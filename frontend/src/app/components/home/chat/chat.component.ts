import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Conversation, Message } from 'src/app/models/common';
import { ChatService } from 'src/app/services/chat.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  public activeConversation: Conversation;
  public peerId: string;
  public chatWindowActive: boolean = false;
  public loadingView: boolean = false;
  public messages: Message[] = [];
  public textMessage: FormControl = new FormControl(null);

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {
    this.chatService.obsrvCurrentConversation
      .subscribe((_conv: Conversation) => {
        if (_conv.conversationId !== this.activeConversation?.conversationId) {
          this.loadingView = true;
          this.activeConversation = _conv;
          this.peerId = this.activeConversation.users.filter(_u => {
            return _u !== this.userService.currUser.id
          })[0];
          this.loadMessages();
        }
      });

    this.socketService.observeNewMessage.subscribe(msg => {
      if (!('type' in msg)) {
        let conv = this.chatService.conversations.filter(_conv => {
          return _conv.users.indexOf(msg.fromUserId) >= 0
        });
        console.log(conv);
        if (conv.length > 0) {
          if (this.activeConversation &&
            this.activeConversation.users.indexOf(msg.fromUserId) >= 0) {
            this.activeConversation.messages.push(msg);
            this.loadingView = true;
            this.loadMessages();
          } else {
            conv[0].messages.push(msg);
          }
        } else {
          // get conversations, find the one with fromUserId and update messages
          this.chatService.getConversations();
          setTimeout(() => {
            if (this.activeConversation &&
              this.activeConversation.users.indexOf(msg.fromUserId) >= 0) {
              this.activeConversation.messages.push(msg);
              this.loadingView = true;
              this.loadMessages();
            } else {
              this.chatService.conversations.filter(_c => {
                return _c.users.indexOf(msg.fromUserId) >= 0
              })[0].messages.push(msg);
            }
          }, 1000);
        }

      }
    });
  }

  private loadMessages(): void {
    // load recent 25 messages
    this.messages = this.activeConversation.messages.slice(
      this.activeConversation.messages.length > 25 ?
        this.activeConversation.messages.length - 25 : 0,
      this.activeConversation.messages.length
    );
    this.loadingView = false;
    this.chatWindowActive = true;
    setTimeout(() => {
      let conversationDiv = document.getElementById('conversation-thread');
      conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }, 100);
  }

  public closeConversation(): void {
    this.chatWindowActive = false;
    this.activeConversation = null;
    console.log(this.chatWindowActive);
  }

  public newText(e: any): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log(this.textMessage.value);
      let newMsg: Message = {
        messageId: this.genNanoId(),
        fromUserId: this.userService.currUser.id,
        toUserId: this.peerId,
        date: new Date(),
        text: this.textMessage.value,
        fileLink: null,
        externalLink: null
      }
      this.activeConversation.messages.push(newMsg);
      this.chatService.updateConversation(this.activeConversation)
        .subscribe((res: any) => {
          console.log(res);
        }, (error) => {
          if (error.status === 500) console.log("Server Error");
        }, () => {
          this.loadingView = true;
          this.loadMessages();
          this.socketService.sendMessage(newMsg);
          this.textMessage.reset();
        });
    }
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
    let activeUser = this.userService.activeUsers.filter(userId => {
      return userId === id
    });
    // console.log(activeUser);
    if (activeUser.length > 0) return true;
    else return false;
  }

  genNanoId(): string {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
  }
}
