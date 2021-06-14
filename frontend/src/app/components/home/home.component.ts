import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { SocketService } from "src/app/services/socket.service";
import { environment } from 'src/environments/environment';
import { ChatService } from 'src/app/services/chat.service';
import { CallService } from 'src/app/services/call.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  ws: WebSocket;

  constructor(
    private router: Router,
    private userService: UserService,
    private socketService: SocketService,
    private chatService: ChatService,
    private callService: CallService,
  ) { }

  ngOnInit(): void {
    console.log(this.isAuthenticated());
    if (!this.isAuthenticated()) {
      this.router.navigate(['login']);
    }

    if (!this.userService.currUser) {
      this.userService.currUser = JSON.parse(sessionStorage.getItem('_user'));
    }

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

    this.userService.getRequests()
      .subscribe((res: any) => {
        this.userService.requests = res.requests;
        this.userService.sentRequests = res.sentRequests;
        this.userService.refreshAvlRequests();
      });

    this.callService.getCallHistory()
      .subscribe((res: any) => {
        console.log(res);
        this.callService.callHistory = res.callHistory;
        this.callService.updateCallHistory.next(true);
      });

    this.chatService.getConversations();

    this.connectToWs();
  }

  private connectToWs(): void {
    this.socketService.connect();
    setTimeout(() => {
      this.socketService.sendMessage({
        type: "authentication",
        data: this.userService.currUser.id
      });
    }, 2000);
  }

  private isAuthenticated(): boolean {
    if (sessionStorage.getItem('token'))
      return true;
    else return false;
  } ƒ
}
