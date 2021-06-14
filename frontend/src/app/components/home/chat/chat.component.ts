import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Conversation, Message } from 'src/app/models/common';
import { ChatService } from 'src/app/services/chat.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { SendMediaComponent } from './send-media/send-media.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  public activeConversation: Conversation;                  // current active conversation instance
  public peerId: string;                                    // user id of contact in current active conv.
  public chatWindowActive: boolean = false;                 // is chat window opened
  public loadingView: boolean = false;                      // loading messages
  public messages: Message[] = [];                          // 
  public textMessage: FormControl = new FormControl(null);  // new message input

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private socketService: SocketService,
    private postsService: PostService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // observe which conversation is set as current
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

    // observe a new message sent via relay server
    this.socketService.observeNewMessage.subscribe(msg => {
      if (!('type' in msg)) {
        let conv = this.chatService.conversations.filter(_conv => {
          return _conv.users.indexOf(msg.fromUserId) >= 0
        });
        // console.log(conv);
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

  /**
   * This method slices latest 25 messages
   * from data
   */
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

  /**
   * Close chat window, clear active conversation
   */
  public closeConversation(): void {
    this.chatWindowActive = false;
    this.activeConversation = null;
    // console.log(this.chatWindowActive);
  }

  /**
   * This method updates the conversation 
   * and saves it to database. Next, sends
   * message to relay server
   * @param e key press event
   */
  public newText(e: any): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      // console.log(this.textMessage.value);
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
          // console.log(res);
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

  public sendMediaOrLink(): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.width = "800px";
    dialogConfig.height = "600px";
    dialogConfig.disableClose = false;
    let sendMediaDialogRef = this.dialog.open(SendMediaComponent, dialogConfig);
    sendMediaDialogRef.beforeClosed().subscribe(data => {
      if (data && data.fileLink || data.externalLink) {
        // console.log(data);
        let newMsg: Message = {
          messageId: this.genNanoId(),
          fromUserId: this.userService.currUser.id,
          toUserId: this.peerId,
          text: null,
          fileLink: data.fileLink,
          externalLink: data.externalLink,
          date: new Date()
        }
        this.activeConversation.messages.push(newMsg);
        this.chatService.updateConversation(this.activeConversation)
          .subscribe((res: any) => {
            // console.log(res);
          }, (error) => {
            if (error.status === 500) console.log("Server Error");
          }, () => {
            this.loadingView = true;
            this.loadMessages();
            this.socketService.sendMessage(newMsg);
            this.textMessage.reset();
          });
      }
    });
  }

  // helper method to show media in posts
  showFiles(data: Message): void {
    if (!document.getElementById(`img_${data.messageId}`) &&
      !document.getElementById(`vid_${data.messageId}`) &&
      !document.getElementById(`aud_${data.messageId}`) &&
      !document.getElementById(`file_${data.messageId}`)) {
      let showMediaEl = document.getElementById(data.messageId);
      // console.log(data.postFileLink);
      let ext = data.fileLink.split('.')[1];
      if (this.postsService.imgTypes.indexOf(ext) >= 0) {
        let imgEl = document.createElement('img');
        imgEl.id = `img_${data.messageId}`;
        imgEl.width = 320;
        imgEl.height = 200;
        imgEl.src = data.fileLink;
        showMediaEl.appendChild(imgEl);
      } else if (this.postsService.vidTypes.indexOf(ext) >= 0) {
        let vidEl = document.createElement('video');
        vidEl.id = `vid_${data.messageId}`;
        vidEl.width = 320;
        vidEl.height = 200;
        vidEl.controls = true;
        vidEl.src = data.fileLink;
        showMediaEl.appendChild(vidEl);
      } else if (this.postsService.audTypes.indexOf(ext) >= 0) {
        let audEl = document.createElement('audio');
        audEl.id = `aud_${data.messageId}`;
        audEl.src = data.fileLink;
        audEl.controls = true;
        showMediaEl.appendChild(audEl);
      } else {
        let fileEl = document.createElement('button');
        fileEl.id = `file_${data.messageId}`;
        fileEl.addEventListener('click', () => {
          window.open(data.fileLink);
        });
        fileEl.innerText = 'Download ' + data.fileLink.split('/')[data.fileLink.split('/').length - 1].split('.')[1];
        fileEl.classList.add('mat-stroked-button');
        showMediaEl.appendChild(fileEl);
      }
    } else return;
  }

  // helper method to show external links in posts
  showLink(data: Message): void {
    if (!document.getElementById(`ifr_${data.messageId}`) && !document.getElementById(`href_${data.messageId}`)) {
      let showMediaEl = document.getElementById(data.messageId);
      let linkEl = document.createElement('button');
      linkEl.id = `ifr_${data.messageId}`;
      linkEl.addEventListener('click', () => {
        // console.log(data.externalLink);
        this.postsService.openExternalLink(data.externalLink);
      });
      linkEl.innerText = 'Open Link';
      linkEl.classList.add('mat-stroked-button');
      let newTabOpenLinkEl = document.createElement('a');
      newTabOpenLinkEl.id = `href_${data.messageId}`;
      newTabOpenLinkEl.href = data.externalLink;
      newTabOpenLinkEl.target = '_blank';
      newTabOpenLinkEl.classList.add('mat-button');
      newTabOpenLinkEl.innerText = 'Open link in new tab';
      showMediaEl.appendChild(linkEl);
      showMediaEl.appendChild(newTabOpenLinkEl);
      // preview html [LATER TODO]
      //   <div class="preview-link">
      //     <img src="https://www.freeimages.com/photo/marguerite-1372118" alt="" width="64px" height="64px">
      //     <span class="preview-link__info">
      //         <b>Sample Image</b>
      //         <br>
      //         <small>This is a sample image</small>
      //     </span>
      // </div>
      // this.postsService.getLinkPreview(data.externalLink)
      //   .subscribe((res: any) => {
      //     let previewDiv = document.createElement('div');
      //     previewDiv.id = `href_${data.messageId}`;
      //     previewDiv.classList.add('preview-link');
      //     let previewDivImg = document.createElement('img');
      //     previewDivImg.src = res.preview?.img // get from backend
      //     previewDivImg.alt = res.preview?.img;
      //     previewDivImg.height = 64;
      //     previewDivImg.width = 64;
      //     let previewDivInfo = document.createElement('span');
      //     previewDivInfo.classList.add('preview-link__info');
      //     let previewDivInfoTitle = document.createElement('b');
      //     previewDivInfoTitle.innerHTML = res.preview?.title // get from backend
      //     let breakLineEl = document.createElement('br');
      //     let previewDivInfoDescp = document.createElement('small');
      //     previewDivInfoDescp.innerHTML = res.preview?.description // get from backend
      //     previewDivInfo.appendChild(previewDivInfoTitle);
      //     previewDivInfo.appendChild(breakLineEl);
      //     previewDivInfo.appendChild(previewDivInfoDescp)
      //     previewDiv.appendChild(previewDivImg);
      //     previewDiv.appendChild(previewDivInfo);
      //     previewDiv.addEventListener('click', () => {
      //       window.open(data.externalLink, '_blank');
      //     });
      //     showMediaEl.appendChild(previewDiv);
      //   }, (error) => {
      //      if (error.status === 500) console.log("Server Error");
      //   }, () => { })

    } else return;
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

  /**
   * This helper method generates uuid 
   * for messages
   * @returns 8 char unique id
   */
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
