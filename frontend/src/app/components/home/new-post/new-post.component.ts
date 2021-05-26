import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-post',
  templateUrl: './new-post.component.html',
  styleUrls: ['./new-post.component.scss']
})
export class NewPostComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<NewPostComponent>,
  ) { }

  ngOnInit(): void {
  }

  closeDialog(): void {
    this.dialogRef.close("Works");
  }

}
