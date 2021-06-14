import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from "rxjs/operators";
import { Call, Contact, Request, User } from 'src/app/models/common';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { ChatService } from "../../../services/chat.service";
import { CallService } from "../../../services/call.service";

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
  isCall: boolean = false;              // is call el active
  callHistory: any = {                  // store call history
    incoming: [], 
    outgoing: [] 
  }                     

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService,
    private callService: CallService,
  ) { }

  ngOnInit(): void {
    // global user search
    this.options = this.userService.users;

    // get contacts for user
    this.contacts = this.userService.contacts;
    // console.log(this.contacts);

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
        // console.log(this.options);
      }
    });

    // subscribe to any new contacts available
    this.userService.observeAvlContacts.subscribe(avl => {
      if (avl) {
        this.contacts = this.userService.contacts;
        // console.log(this.contacts);
      }
    });

    // subscribe to any new requests available
    this.userService.observeAvlRequests.subscribe(avl => {
      if (avl) {
        this.requests = this.userService.requests;
        this.sentRequests = this.userService.sentRequests;
        // console.log(this.requests, this.sentRequests);
      }
    });

    // subscribe to changes in call history
    this.callService.obsrvUpdateCallHistory.subscribe(avl => {
      if (avl) {
        this.callHistory = this.callService.callHistory;
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
        this.callService.notifyIncomingCall(msg);
      }
    });

    // subscribe to incoming and outgoing calls
    this.callService.obsrvCall.subscribe(callStatusCode => {
      if (callStatusCode === 10) this.isCall = true;
      else if (callStatusCode === 20) this.isCall = false;
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
    // console.log('call initiated');

    let callObj: Call = {
      callId: null,
      fromUserId: this.userService.currUser.id,
      toUserId: contact.contactUserId,
      callDate: null,
      duration: 0,
    }

    this.callService.notifyOutgoingCall(callObj);
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
      // console.log(res);
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
        // console.log(res);
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
      // console.log(res);
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
      // console.log(res);
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
        // console.log(res);
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
