import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditorChangeContent } from 'ngx-quill';
import { Post } from 'src/app/models/common';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { PostService } from "../../../services/post.service";

@Component({
  selector: 'app-new-post',
  templateUrl: './new-post.component.html',
  styleUrls: ['./new-post.component.scss']
})
export class NewPostComponent implements OnInit {

  post: Post = {
    postId: null,
    postOwnerId: null,
    postFileLink: null,
    postHtmlContent: null,
    postDate: null,
    postExternalLink: null,
    postComments: null
  }

  @ViewChild('showMedia') showMediaEl: ElementRef;

  editorStyle = {
    height: '200px'
  }

  config = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
    ]
  }

  showExtLinkInput: boolean = false;
  externalLink: FormControl = new FormControl(null);

  initialEditorValue: FormControl = new FormControl(this.data ? this.data.postHtmlContent : null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Post,
    private dialogRef: MatDialogRef<NewPostComponent>,
    private postsService: PostService,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.data) {
        this.post = this.data;
        if (this.post.postFileLink) this.showFiles(this.data);
        if (this.post.postExternalLink) this.showLink(this.data);
      }
    }, 2000);
  }

  // method to save a new post
  saveNewPost(): void {
    this.post.postOwnerId = this.userService.currUser.id;

    this.postsService.addPost(this.post)
      .subscribe((res: any) => {
        // console.log(res);
        this.post = res.post;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.postsService.notifyNewPostAvl(this.post);
        this.dialogRef.close();
      });
  }

  // method to update existing post
  updatePost(): void {
    this.postsService.updatePost(this.post)
      .subscribe((res: any) => {
        // console.log(res);
        this.post = res.post;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.postsService.notifyPostUpdatedAvl(this.post);
        this.dialogRef.close();
      });
  }

  /**
   * This method listens to quill editor
   * content changes
   * @param event editor Html content
   */
  changedEditor(event: EditorChangeContent) {
    // tslint:disable-next-line:no-console
    // console.log('editor-change', event);
    this.post.postHtmlContent = event.html;
  }

  /**
   * This method uploads file and 
   * create element to show uploaded 
   * file based on type
   * @param files uploaded file
   */
  uploadFile(files: FileList): void {
    this.postsService.uploadFile(files.item(0))
      .subscribe((res: any) => {
        // console.log(res);
        this.post.postFileLink = environment.filesUrl + '/' + res.filename;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.showFiles(this.post);
      });
  }

  /**
   * This method is to show the 
   * external link inside iframe
   * @param url link
   */
  insertLink(): void {
    this.post.postExternalLink = this.externalLink.value;
    this.showLink(this.post);
  }

  /**
   * helper method to show media
   * @param data post
   */
  showFiles(data: Post): void {
    // console.log(data.postFileLink);
    let ext = data.postFileLink.split('.')[1];
    if (this.postsService.imgTypes.indexOf(ext) >= 0) {
      let imgEl = document.createElement('img');
      imgEl.width = 560;
      imgEl.height = 315;
      imgEl.src = data.postFileLink;

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        data.postFileLink = null;
        this.showMediaEl.nativeElement.removeChild(imgEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(imgEl);
    } else if (this.postsService.vidTypes.indexOf(ext) >= 0) {
      let vidEl = document.createElement('video');
      vidEl.controls = true;
      vidEl.width = 560;
      vidEl.height = 315;
      vidEl.src = data.postFileLink;
      
      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        data.postFileLink = null;
        this.showMediaEl.nativeElement.removeChild(vidEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(vidEl);
    } else if (this.postsService.audTypes.indexOf(ext) >= 0) {
      let audEl = document.createElement('audio');
      audEl.src = data.postFileLink;
      audEl.controls = true;

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        data.postFileLink = null;
        this.showMediaEl.nativeElement.removeChild(audEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(audEl);
    } else {
      let fileEl = document.createElement('button');
      fileEl.addEventListener('click', () => {
        window.open(data.postFileLink);
      });
      fileEl.innerText = 'Download ' + data.postFileLink.split('/')[data.postFileLink.split('/').length - 1].split('.')[1];
      fileEl.classList.add('mat-stroked-button');

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        data.postFileLink = null;
        this.showMediaEl.nativeElement.removeChild(fileEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(fileEl);
    }
  }

  /**
   * helper method to show external link
   * @param data post
   */
  showLink(data: Post): void {
    let linkEl = document.createElement('button');
    let newTabLinkEl = document.createElement('a');
    newTabLinkEl.href = data.postExternalLink;
    newTabLinkEl.innerHTML = 'Open in new tab';
    newTabLinkEl.target = '_blank';
    linkEl.addEventListener('click', () => {
      // console.log(data.postExternalLink);
      this.postsService.openExternalLink(data.postExternalLink);
    });
    linkEl.innerText = 'Open Link';
    linkEl.classList.add('mat-stroked-button');
    newTabLinkEl.classList.add('mat-button');

    // remove btn
    let delBtn = document.createElement('button');
    delBtn.classList.add('mat-button');
    delBtn.addEventListener('click', () => {
      data.postExternalLink = null;
      this.showMediaEl.nativeElement.removeChild(linkEl);
      this.showMediaEl.nativeElement.removeChild(newTabLinkEl);
      this.showMediaEl.nativeElement.removeChild(delBtn);
    });
    delBtn.innerText = 'Remove';
    this.showMediaEl.nativeElement.appendChild(delBtn);

    this.showMediaEl.nativeElement.appendChild(linkEl);
    this.showMediaEl.nativeElement.appendChild(newTabLinkEl);
    this.showExtLinkInput = false;
  }

  closeDialog(): void {
    this.dialogRef.close("Works");
  }

}
