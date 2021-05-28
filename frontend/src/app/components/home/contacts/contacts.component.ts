import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from "rxjs/operators";
import { Contact, User } from 'src/app/models/common';
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

    this.userService.observeAvlUsers.subscribe(avl => {
      if (avl) {
        this.options = this.userService.users;
        this.options = this.options.filter(user => {
          return user.id !== this.userService.currUser.id
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

  isActive(id: any): boolean {
    let activeUser = this.activeUsers.filter(user => {
      return user.id === id
    });
    console.log(activeUser);
    if (activeUser.length > 0) return true;
    else return false;
  }

  public tryLogout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('_user');
    this.socketService.close();
    window.location.replace('http://localhost:4240/login');
  }

}
