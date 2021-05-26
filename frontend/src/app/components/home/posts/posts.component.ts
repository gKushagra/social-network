import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NewPostComponent } from '../new-post/new-post.component';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
})
export class PostsComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }

  public openNewPostDialog(): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.height = "500px";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = false;
    let newPostDialogRef = this.dialog.open(NewPostComponent, dialogConfig);
    newPostDialogRef.beforeClosed()
      .subscribe(data => {
        console.log(data);
      })
  }

}
