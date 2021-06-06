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
        let postIdx = this.posts.findIndex(post => post.postId === updatedPost.postId);
        this.posts[postIdx] = { ...updatedPost };
        updatedPost = null;
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

  /**
   * Method updates post
   * @param post post to edit
   */
  editPost(post): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.width = "800px";
    dialogConfig.height = "600px";
    dialogConfig.disableClose = false;
    dialogConfig.data = post;
    let newPostDialogRef = this.dialog.open(NewPostComponent, dialogConfig);
  }

  /**
   * Add comment to current post
   * @param post 
   */
  addComment(post: Post): void {
    let newComment = {}
    newComment['commentBy'] = this.userService.currUser.id;
    newComment['commentDate'] = new Date();
    newComment['commentText'] = this.comment.value;
    post.postComments.push(newComment);
    this.postsService.updatePost(post)
      .subscribe((res: any) => {
        console.log(res);
        this.comment.reset()
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.postsService.notifyPostUpdatedAvl(post);
      });
  }

  /**
   * Method deletes a post
   * @param postId id of post to delete
   */
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
    dialogConfig.width = "800px";
    dialogConfig.height = "600px";
    dialogConfig.disableClose = false;
    let newPostDialogRef = this.dialog.open(NewPostComponent, dialogConfig);
    newPostDialogRef.beforeClosed()
      .subscribe(data => {
        console.log(data);
      });
  }

  // helper method to show media in posts
  showFiles(data: Post): void {
    if (!document.getElementById(`img_${data.postId}`) &&
      !document.getElementById(`vid_${data.postId}`) &&
      !document.getElementById(`aud_${data.postId}`) &&
      !document.getElementById(`file_${data.postId}`)) {
      let showMediaEl = document.getElementById(data.postId);
      // console.log(data.postFileLink);
      let ext = data.postFileLink.split('.')[1];
      if (this.postsService.imgTypes.indexOf(ext) >= 0) {
        let imgEl = document.createElement('img');
        imgEl.id = `img_${data.postId}`;
        imgEl.width = 560;
        imgEl.height = 315;
        imgEl.src = data.postFileLink;
        showMediaEl.appendChild(imgEl);
      } else if (this.postsService.vidTypes.indexOf(ext) >= 0) {
        let vidEl = document.createElement('video');
        vidEl.id = `vid_${data.postId}`;
        vidEl.width = 560;
        vidEl.height = 315;
        vidEl.controls = true;
        vidEl.src = data.postFileLink;
        showMediaEl.appendChild(vidEl);
      } else if (this.postsService.audTypes.indexOf(ext) >= 0) {
        let audEl = document.createElement('audio');
        audEl.id = `aud_${data.postId}`;
        audEl.src = data.postFileLink;
        audEl.controls = true;
        showMediaEl.appendChild(audEl);
      } else {
        let fileEl = document.createElement('button');
        fileEl.id = `file_${data.postId}`;
        fileEl.addEventListener('click', () => {
          window.open(data.postFileLink);
        });
        fileEl.innerText = 'Download ' + data.postFileLink.split('/')[data.postFileLink.split('/').length - 1].split('.')[1];
        fileEl.classList.add('mat-stroked-button');
        showMediaEl.appendChild(fileEl);
      }
    } else return;
  }

  // helper method to show external links in posts
  showLink(data: Post): void {
    if (!document.getElementById(`ifr_${data.postId}`) && !document.getElementById(`href_${data.postId}`)) {
      let showMediaEl = document.getElementById(data.postId);
      let linkEl = document.createElement('button');
      linkEl.id = `ifr_${data.postId}`;
      let newTabLinkEl = document.createElement('a');
      newTabLinkEl.id = `href_${data.postId}`;
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
    } else return;
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
