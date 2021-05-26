import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  public user: any;
  public loadingView: boolean = false;
  public conversation: any = ["Hello", "How are you?", "I am good!", "How about you?", "I am great too!", "When can we meet?",
    "Hello", "How are you?", "I am good!", "How about you?", "I am great too!", "When can we meet?"];
  public isActive: boolean = false;
  public textMessage: FormControl = new FormControl(null);

  constructor(
    private chatService: ChatService,
  ) { }

  ngOnInit(): void {
    this.chatService.observeCurrentUser
      .subscribe(_user => {
        if (_user !== this.user) {
          this.loadingView = true;
          this.user = _user;
          this.loadConversation();
        }
      });
  }

  private loadConversation(): void {
    // get conversations for current user
    this.loadingView = false;
    this.isActive = true;
  }

  public closeConversation(): void {
    this.isActive = false;
    console.log(this.isActive);
  }

  public newText(e: any): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log(this.textMessage.value);
      this.conversation.push(this.textMessage.value);
      this.textMessage.reset();
    }
  }

}
