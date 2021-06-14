import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Contact, Conversation, Message } from '../models/common';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  conversations: Conversation[] = [];
  activeConversation: Conversation;

  private currentConversation: Subject<any> = new Subject();
  public obsrvCurrentConversation: Observable<any> = this.currentConversation.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService,
  ) { }

  getConversations(): void {
    this.http.get(environment.conversationsUrl + `/${this.userService.currUser.id}`)
      .subscribe((res: any) => {
        // console.log(res);
        this.conversations = res.conversations;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => { });
  }

  updateConversation(payload: any): any {
    return this.http.put(environment.conversationsUrl, payload);
  }

  changeCurrContact(contact: Contact): void {
    // change active conversation
    let isConvAvl = this.conversations.filter(_c => {
      return _c.users.indexOf(contact.contactUserId) >= 0
    });
    // console.log('called ',isConvAvl);
    if (isConvAvl.length > 0) {
      this.activeConversation = isConvAvl[0];
      this.currentConversation.next(this.activeConversation);
    } else {
      // create conversation
      let newConv: Conversation = {
        conversationId: null,
        users: [this.userService.currUser.id, contact.contactUserId],
        messages: []
      }
      // save in backend
      this.http.post(environment.conversationsUrl, newConv)
        .subscribe((res: any) => {
          // console.log(res);
          this.conversations.push(res.conversation);
          this.activeConversation = res.conversation;
        }, (error) => {
          if (error.status === 500) console.log("Server Error");
        }, () => {
          this.currentConversation.next(this.activeConversation);
        });
    }
  }

  addMessage(msg: Message): void {
    this.activeConversation.messages.push(msg);
  }

  editMessage(msg: Message): void {
    let msgToEditIdx = this.activeConversation.messages.findIndex(_msg => {
      _msg.messageId === msg.messageId
    });
    this.activeConversation.messages[msgToEditIdx] = msg;
  }

  deleteMessage(msgId: any): void {
    let msg = this.activeConversation.messages.filter(_msg => {
      return _msg.messageId === msgId
    })[0];
    msg.fileLink ? msg.fileLink = null : null;
    msg.externalLink ? msg.externalLink = null : null;
    msg.text = 'This text has been deleted';
  }
}
