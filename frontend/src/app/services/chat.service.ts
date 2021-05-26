import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private currentUser: Subject<any> = new Subject();
  public observeCurrentUser: Observable<any> = this.currentUser.asObservable();

  constructor() { }

  changeCurrUser(_user: any): void {
    this.currentUser.next(_user);
  }
}
