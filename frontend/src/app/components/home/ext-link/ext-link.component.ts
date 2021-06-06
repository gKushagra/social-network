import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SafePipe } from "../../../pipes/safe.pipe";

@Component({
  selector: 'app-ext-link',
  templateUrl: './ext-link.component.html',
  styleUrls: ['./ext-link.component.scss']
})
export class ExtLinkComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public url: any,
    public dialogRef: MatDialogRef<ExtLinkComponent>,
  ) { }

  ngOnInit(): void {
  }
}
