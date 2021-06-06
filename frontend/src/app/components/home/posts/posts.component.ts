import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Post } from 'src/app/models/common';
import { PostService } from 'src/app/services/post.service';
import { UserService } from 'src/app/services/user.service';
import { NewPostComponent } from '../new-post/new-post.component';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
})
export class PostsComponent implements OnInit {

  posts: Post[] = [];

  comment: FormControl = new FormControl(null);

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private postsService: PostService,
  ) { }

  ngOnInit(): void {
    this.getPosts();

    this.postsService.obsrvNewPostAvl.subscribe(post => {
      if (post) {
        this.posts.push(post);
      }
    });

    this.postsService.obsrvUpdatedPostAvl.subscribe(updatedPost => {
      if (updatedPost) {
        let postToBeUpdated = {
          ...this.posts.filter(post => {
            return post.postId === updatedPost.postId
          })[0]
        };
        this.posts = this.posts.filter(post => { return post.postId !== updatedPost.postId });
        this.posts.push(postToBeUpdated);
      }
    });
  }

  /**
   * This method gets all posts from backend
   */
  getPosts(): void {
    this.postsService.getPosts()
      .subscribe((res: any) => {
        console.log(res);
        this.filterPosts(res.posts);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => { });
  }

  /**
   * This method restricts all posts to
   * users contacts only
   * @param posts all posts from backend
   */
  filterPosts(posts: Post[]): void {
    let filteredPosts = posts.filter(post => {
      return this.userService.contacts.findIndex(c => c.contactUserId === post.postOwnerId) >= 0 ||
        post.postOwnerId === this.userService.currUser.id
    });
    this.posts = [...filteredPosts];
    posts = null;
  }

  editPost(post): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.height = "500px";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = false;
    dialogConfig.data = post;
    let newPostDialogRef = this.dialog.open(NewPostComponent, dialogConfig);
  }

  addComment(): void {

  }

  deletePost(postId: any): void {
    this.postsService.deletePost(postId)
      .subscribe((res: any) => {
        console.log(res);
        this.posts = this.posts.filter(post => { return post.postId !== res.postId });
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => { });
  }

  /**
   * Method opens add new post dialog
   */
  public openNewPostDialog(): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.height = "500px";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = false;
    let newPostDialogRef = this.dialog.open(NewPostComponent, dialogConfig);
    newPostDialogRef.beforeClosed()
      .subscribe(data => {
        console.log(data);
      });
  }

  showFiles(data: Post): void {
    let showMediaEl = document.getElementById(data.postId);
    console.log(data.postFileLink);
    let ext = data.postFileLink.split('.')[1];
    if (this.postsService.imgTypes.indexOf(ext) >= 0) {
      let imgEl = document.createElement('img');
      imgEl.src = data.postFileLink;
      showMediaEl.appendChild(imgEl);
    } else if (this.postsService.vidTypes.indexOf(ext) >= 0) {
      let vidEl = document.createElement('video');
      vidEl.controls = true;
      vidEl.src = data.postFileLink;
      showMediaEl.appendChild(vidEl);
    } else if (this.postsService.audTypes.indexOf(ext) >= 0) {
      let audEl = document.createElement('audio');
      audEl.src = data.postFileLink;
      audEl.controls = true;
      showMediaEl.appendChild(audEl);
    } else {
      let fileEl = document.createElement('button');
      fileEl.addEventListener('click', () => {
        window.open(data.postFileLink);
      });
      fileEl.innerText = 'Download ' + data.postFileLink.split('/')[data.postFileLink.split('/').length - 1].split('.')[1];
      fileEl.classList.add('mat-stroked-button');
      showMediaEl.appendChild(fileEl);
    }
  }

  showLink(data: Post): void {
    let showMediaEl = document.getElementById(data.postId);
    let linkEl = document.createElement('button');
    let newTabLinkEl = document.createElement('a');
    newTabLinkEl.href = data.postExternalLink;
    newTabLinkEl.innerHTML = 'Open in new tab';
    newTabLinkEl.target = '_blank';
    linkEl.addEventListener('click', () => {
      console.log(data.postExternalLink);
      this.postsService.openExternalLink(data.postExternalLink);
    });
    linkEl.innerText = 'Open Link';
    linkEl.classList.add('mat-stroked-button');
    newTabLinkEl.classList.add('mat-button');
    showMediaEl.appendChild(linkEl);
    showMediaEl.appendChild(newTabLinkEl);
  }

  // helper to get user email
  getUserEmail(id: any): any {
    return this.userService.users.filter(user => {
      return user.id === id
    })[0].email;
  }

  // helper to check if post owner is curr user
  checkOwner(id: any): boolean {
    return id === this.userService.currUser.id;
  }
}
