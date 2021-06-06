import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from "rxjs/operators";
import { Contact, Request, User } from 'src/app/models/common';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { ChatService } from "../../../services/chat.service";

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  myControl = new FormControl();
  options: User[] = [];
  filteredOptions: Observable<User[]>;
  contacts: Contact[] = [];
  activeUsers: any = [];
  requests: Request[] = [];
  sentRequests: Request[] = [];
  currUser: User;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private router: Router,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {

    this.options = this.userService.users;
    this.options = this.options.filter(user => {
      return user.id !== this.userService.currUser.id
    });
    console.log(this.options);

    this.contacts = this.userService.contacts;
    console.log(this.contacts);

    this.currUser = this.userService.currUser;

    this.requests = this.userService.requests;

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

    this.userService.observeAvlContacts.subscribe(avl => {
      if (avl) {
        this.contacts = this.userService.contacts;
        console.log(this.contacts);
      }
    });

    this.userService.observeAvlRequests.subscribe(avl => {
      if (avl) {
        this.requests = this.userService.requests;
        this.sentRequests = this.userService.sentRequests;
        console.log(this.requests, this.sentRequests);
      }
    });

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    this.socketService.observeNewMessage.subscribe(msg => {
      if (msg.type === "active-users") {
        this.activeUsers = msg.data;
      }
    });
  }

  private _filter(value: string): User[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.email.toLowerCase().indexOf(filterValue) === 0);
  }

  public selectContact(_user: any): void {
    this.chatService.changeCurrUser(_user);
  }

  public addContact(_user: any): void {
    this.userService.addContact({
      ownerId: this.userService.currUser.id,
      userId: _user.id,
      userEmail: _user.email
    }).subscribe((res: any) => {
      console.log(res);
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
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
    });
  }

  public removeContact(_user: any): void {
    this.userService.removeContact(_user.contactUserId)
      .subscribe((res: any) => {
        console.log(res);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
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
      });
  }

  addRequest(_user: any): void {
    this.userService.addRequest({
      fromUserId: this.userService.currUser.id,
      toUserId: _user.id
    }).subscribe((res: any) => {
      console.log(res);
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
      this.userService.getRequests()
        .subscribe((res: any) => {
          this.userService.requests = res.requests;
          this.userService.sentRequests = res.sentRequests;
          this.userService.refreshAvlRequests();
        });
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
      this.userService.getRequests()
        .subscribe((res: any) => {
          this.userService.requests = res.requests;
          this.userService.sentRequests = res.sentRequests;
          this.userService.refreshAvlRequests();
        });
    });
  }

  cancelRequest(request: Request): void {
    this.userService.declineRequest(request.requestId)
      .subscribe((res: any) => {
        console.log(res);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.userService.getRequests()
          .subscribe((res: any) => {
            this.userService.requests = res.requests;
            this.userService.sentRequests = res.sentRequests;
            this.userService.refreshAvlRequests();
          });
      });
  }

  getUserEmail(id: any): any {
    return this.userService.users.filter(user => {
      return user.id === id
    })[0].email;
  }

  isActive(id: any): boolean {
    let activeUser = this.activeUsers.filter(user => {
      return user.id === id
    });
    // console.log(activeUser);
    if (activeUser.length > 0) return true;
    else return false;
  }

  public tryLogout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('_user');
    this.socketService.close();
    window.location.replace('http://localhost:4240/login');
  }

}
