import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from "rxjs/operators";
import { Call, Contact, Request, User } from 'src/app/models/common';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { ChatService } from "../../../services/chat.service";
import { CallService } from "../../../services/call.service";
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CallComponent } from '../call/call.component';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  myControl = new FormControl();        // global search control
  options: User[] = [];                 // global users list
  filteredOptions: Observable<User[]>;  // filtered global users list
  contacts: Contact[] = [];             // user contacts
  activeUsers: any = [];                // contacts active
  requests: Request[] = [];             // user connection request received
  sentRequests: Request[] = [];         // user connection request received      
  currUser: User;                       // local curr user
  incomingCall: any;                    // store room properties

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService,
    private callService: CallService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // global user search
    this.options = this.userService.users;

    // get contacts for user
    this.contacts = this.userService.contacts;
    console.log(this.contacts);

    // remove curr user and contacts
    this.options = this.options.filter(user => {
      return user.id !== this.userService.currUser.id ||
        this.userService.contacts.findIndex(_c => _c.contactUserId === user.id) >= 0
    });
    // console.log(this.options);

    // set local curr user
    this.currUser = this.userService.currUser;

    // get requests received and sent
    this.requests = this.userService.requests;

    // subscribe to any new online user available
    this.userService.observeAvlUsers.subscribe(avl => {
      if (avl) {
        this.options = this.userService.users;
        this.options = this.options.filter(user => {
          return user.id !== this.userService.currUser.id &&
            this.contacts.findIndex(c => c.contactUserId === user.id) < 0
        });
        console.log(this.options);
      }
    });

    // subscribe to any new contacts available
    this.userService.observeAvlContacts.subscribe(avl => {
      if (avl) {
        this.contacts = this.userService.contacts;
        console.log(this.contacts);
      }
    });

    // subscribe to any new requests available
    this.userService.observeAvlRequests.subscribe(avl => {
      if (avl) {
        this.requests = this.userService.requests;
        this.sentRequests = this.userService.sentRequests;
        console.log(this.requests, this.sentRequests);
      }
    });

    // filter for global user autocomplete
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    // subscribe to any new message available
    this.socketService.observeNewMessage.subscribe(msg => {
      if ('type' in msg && msg['type'] === "active-users") {
        this.activeUsers = msg.data;
        this.userService.activeUsers = this.activeUsers;
      }

      if ('type' in msg && msg['type'] === "call") {
        // msg = { roomId, peerId }
        this.incomingCall = msg;
      }
    });
  }

  /**
   * global search autocomplete filter
   * @param value what user types
   * @returns array of users with matching names
   */
  private _filter(value: string): User[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.email.toLowerCase().indexOf(filterValue) === 0);
  }

  /**
   * refresh chat when a contact is clicked
   * @param _user contact
   */
  public selectContact(contact: any): void {
    this.chatService.changeCurrContact(contact);
  }

  /**
   * place call to a contact
   * audio on, video & screen share off
   * @param contact 
   */
  callContact(contact: Contact): void {
    console.log('call initiated');

    let callObj: Call = {
      callId: null,
      fromUserId: this.userService.currUser.id,
      toUserId: contact.contactUserId,
      callDate: null
    }

    let room, token; // local temp var

    // create new room
    this.callService.createRoom(callObj)
      .subscribe((res: any) => {
        console.log(res);
        room = res.room;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        // get access token
        this.callService.getAccessToken({
          roomId: room['uniqueName'],
          userId: this.userService.currUser.id
        }).subscribe((res: any) => {
          console.log(res);
          token = res.token;
        }, (error) => {
          if (error.status === 500) console.log("Server Error");
        }, () => {
          // open call dialog
          let dialogConfig: MatDialogConfig = new MatDialogConfig();
          dialogConfig.minWidth = window.innerWidth;
          dialogConfig.minHeight = window.innerHeight;
          dialogConfig.disableClose = true;
          dialogConfig.data = { token: token, room: room, peerId: callObj.toUserId };
          let callDialogRef: MatDialogRef<CallComponent> = this.dialog.open(CallComponent, dialogConfig);
          callDialogRef.beforeClosed().subscribe(data => {
            console.log(data);
            token = null;
            room = null;
            // end room: dont know if req.
            // this.callService.endRoom(room.unique_name)
            //   .subscribe((res: any) => {
            //     console.log(res);
            //   }, (error) => {
            //     if (error.status === 500) console.log("Server Error");
            //   }, () => { });
          });
        });
      });
  }

  answerCall(): void {
    let room, token; // local temp var

    // get access token
    this.callService.getAccessToken({
      roomId: this.incomingCall.roomId,
      userId: this.userService.currUser.id
    }).subscribe((res: any) => {
      console.log(res);
      token = res.token;
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
      // open call dialog
      let dialogConfig: MatDialogConfig = new MatDialogConfig();
      dialogConfig.minWidth = window.innerWidth;
      dialogConfig.minHeight = window.innerHeight;
      dialogConfig.disableClose = true;
      dialogConfig.data = {
        token: token,
        room: { uniqueName: this.incomingCall.roomId },
        peerId: this.incomingCall.fromPeerId
      };
      let callDialogRef: MatDialogRef<CallComponent> = this.dialog.open(CallComponent, dialogConfig);
      callDialogRef.beforeClosed().subscribe(data => {
        console.log(data);
        token = null;
        room = null;
        this.incomingCall = null;
      });
    });
  }

  /**
   * add contact [DEPRECATED]
   * @param _user user
   */
  public addContact(_user: any): void {
    this.userService.addContact({
      ownerId: this.userService.currUser.id,
      userId: _user.id,
      userEmail: _user.email
    }).subscribe((res: any) => {
      console.log(res);
    }, (error) => {
      // server error
      if (error.status === 500) console.log("Server Error");
    }, () => {
      this.getUsersAndContacts();
    });
  }

  /**
   * remove existing contact
   * @param _user contact
   */
  public removeContact(_user: any): void {
    this.userService.removeContact(_user.contactUserId)
      .subscribe((res: any) => {
        console.log(res);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.getUsersAndContacts();
      });
  }

  /**
   * send a new connection request
   * @param _user user
   */
  addRequest(_user: any): void {
    this.userService.addRequest({
      fromUserId: this.userService.currUser.id,
      toUserId: _user.id
    }).subscribe((res: any) => {
      console.log(res);
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
      this.getRequests();
    });
  }

  /**
   * add to contacts for fromUserId and toUserId and
   * change status to 0
   * @param request Request received or sent
   */
  acceptRequest(request: Request): void {
    this.userService.acceptRequest({
      requestId: request.requestId,
      fromUserId: request.fromUserId,
      fromUserEmail: this.getUserEmail(request.fromUserId),
      toUserId: request.toUserId,
      toUserEmail: this.getUserEmail(request.toUserId)
    }).subscribe((res: any) => {
      console.log(res);
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
      this.getRequests();
    });
  }

  /**
   * cancel a pending request
   * @param request 
   */
  cancelRequest(request: Request): void {
    this.userService.declineRequest(request.requestId)
      .subscribe((res: any) => {
        console.log(res);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.getRequests();
      });
  }

  /**
   * get updated list of global users
   * and contacts
   */
  getUsersAndContacts(): void {
    this.userService.getUsers()
      .subscribe((res: any) => {
        this.userService.users = res.users;
        this.userService.refreshAvlUsers();
      });
    this.userService.getContacts()
      .subscribe((res: any) => {
        this.userService.contacts = res.contacts;
        this.userService.refreshAvlContacts();
      });
  }

  /**
   * get updated list of requests
   */
  getRequests(): void {
    this.userService.getRequests()
      .subscribe((res: any) => {
        this.userService.requests = res.requests;
        this.userService.sentRequests = res.sentRequests;
        this.userService.refreshAvlRequests();
      });
  }

  /**
   * @param id user id
   * @returns users email
   */
  getUserEmail(id: any): any {
    return this.userService.users.filter(user => {
      return user.id === id
    })[0].email;
  }

  /**
   * @param id user id
   * @returns user active or not boolean
   */
  isActive(id: any): boolean {
    let activeUser = this.activeUsers.filter(userId => {
      return userId === id
    });
    // console.log(activeUser);
    if (activeUser.length > 0) return true;
    else return false;
  }

  /**
   * logout
   */
  public tryLogout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('_user');
    this.socketService.close();
    window.location.replace('http://localhost:4240/login');
  }

}
