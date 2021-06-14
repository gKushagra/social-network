import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { PostService } from 'src/app/services/post.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-send-media',
  templateUrl: './send-media.component.html',
  styleUrls: ['./send-media.component.scss']
})
export class SendMediaComponent implements OnInit {

  @ViewChild('showMedia') showMediaEl: ElementRef;

  showExtLinkInput: boolean = false;
  fileLink: string;
  externalLink: FormControl = new FormControl(null);

  constructor(
    private postsService: PostService,
    private dialogRef: MatDialogRef<SendMediaComponent>,
  ) { }

  ngOnInit(): void {
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
        this.fileLink = environment.filesUrl + '/' + res.filename;
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.showFiles();
      });
  }

  /**
   * This method is to show the 
   * external link inside iframe
   * @param url link
   */
  insertLink(): void {
    this.showLink();
  }

  /**
   * helper method to show media
   */
  showFiles(): void {
    // console.log(this.fileLink);
    let ext = this.fileLink.split('.')[1];
    if (this.postsService.imgTypes.indexOf(ext) >= 0) {
      let imgEl = document.createElement('img');
      imgEl.width = 560;
      imgEl.height = 315;
      imgEl.src = this.fileLink;

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        this.fileLink = null;
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
      vidEl.src = this.fileLink;

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        this.fileLink = null;
        this.showMediaEl.nativeElement.removeChild(vidEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(vidEl);
    } else if (this.postsService.audTypes.indexOf(ext) >= 0) {
      let audEl = document.createElement('audio');
      audEl.src = this.fileLink;
      audEl.controls = true;

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        this.fileLink = null;
        this.showMediaEl.nativeElement.removeChild(audEl);
        this.showMediaEl.nativeElement.removeChild(delBtn);
      });
      delBtn.innerText = 'Remove';
      this.showMediaEl.nativeElement.appendChild(delBtn);

      this.showMediaEl.nativeElement.appendChild(audEl);
    } else {
      let fileEl = document.createElement('button');
      fileEl.addEventListener('click', () => {
        window.open(this.fileLink);
      });
      fileEl.innerText = 'Download ' + this.fileLink.split('/')[this.fileLink.split('/').length - 1].split('.')[1];
      fileEl.classList.add('mat-stroked-button');

      // remove btn
      let delBtn = document.createElement('button');
      delBtn.classList.add('mat-button');
      delBtn.addEventListener('click', () => {
        this.fileLink = null;
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
   */
  showLink(): void {
    let linkEl = document.createElement('button');
    let newTabLinkEl = document.createElement('a');
    newTabLinkEl.href = this.externalLink.value;
    newTabLinkEl.innerHTML = 'Open in new tab';
    newTabLinkEl.target = '_blank';
    linkEl.addEventListener('click', () => {
      // console.log(this.externalLink.value);
      this.postsService.openExternalLink(this.externalLink.value);
    });
    linkEl.innerText = 'Open Link';
    linkEl.classList.add('mat-stroked-button');
    newTabLinkEl.classList.add('mat-button');

    // remove btn
    let delBtn = document.createElement('button');
    delBtn.classList.add('mat-button');
    delBtn.addEventListener('click', () => {
      this.externalLink.reset();
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
    this.dialogRef.close({
      fileLink: this.fileLink,
      externalLink: this.externalLink.value,
    });
  }
}
