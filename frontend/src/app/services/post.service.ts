import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExtLinkComponent } from '../components/home/ext-link/ext-link.component';
import { Post } from '../models/common';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private newPostAvl: Subject<any> = new Subject();
  public obsrvNewPostAvl: Observable<any> = this.newPostAvl.asObservable();

  private updatedPostAvl: Subject<any> = new Subject();
  public obsrvUpdatedPostAvl: Observable<any> = this.updatedPostAvl.asObservable();

  public imgTypes: string[] = ['jpg', 'jpeg', 'gif', 'bmp', 'png', 'svg', 'webp', 'ico', 'tiff'];
  public vidTypes: string[] = ['mp4', 'avi', 'mov', 'mpg', 'wmv', 'flv', 'mkv', 'webm', '3gp'];
  public audTypes: string[] = ['mp3', 'wav'];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
  ) { }

  uploadFile(payload: File): any {
    const formData: FormData = new FormData();
    formData.append('file', payload, payload.name);
    return this.http.post(environment.filesUrl, formData);
  }

  openExternalLink(data: any): void {
    let dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.minHeight = window.innerHeight;
    dialogConfig.minWidth = 3 * (window.innerWidth / 4);
    dialogConfig.data = data;
    console.log(data);
    let externalLinkDialog = this.dialog.open(ExtLinkComponent, dialogConfig);
  }

  getPosts(): any {
    return this.http.get(environment.postsUrl);
  }

  addPost(payload: Post): any {
    return this.http.post(environment.postsUrl, payload);
  }

  updatePost(payload: Post): any {
    return this.http.put(environment.postsUrl, payload);
  }

  deletePost(postId: any): any {
    return this.http.delete(environment.postsUrl + `/${postId}`);
  }

  notifyNewPostAvl(post: Post): void {
    this.newPostAvl.next(post);
  }

  notifyPostUpdatedAvl(post: Post): void {
    this.updatedPostAvl.next(post);
  }
}
