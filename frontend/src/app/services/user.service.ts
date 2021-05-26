import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User, Contact } from "../models/common";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public currUser: User;
  public users: User[] = []
  public contacts: Contact[] = [];

  private availableUsers: Subject<boolean> = new Subject();
  public observeAvlUsers: Observable<boolean> = this.availableUsers.asObservable();

  private availableContacts: Subject<boolean> = new Subject();
  public observeAvlContacts: Observable<boolean> = this.availableContacts.asObservable();

  constructor(
    private http: HttpClient,
  ) { }

  getContacts(): any {
    return this.http.get(environment.contactsUrl + `/${this.currUser.id}`);
  }

  getUsers(): any {
    return this.http.get(environment.usersUrl);
  }

  addContact(payload): any {
    return this.http.post(environment.contactsUrl, payload);
  }

  removeContact(contactUserId): any {
    return this.http.get(environment.contactsUrl + `/${contactUserId}`);
  }

  refreshAvlUsers(): void {
    this.availableUsers.next(true);
  }

  refreshAvlContacts(): void {
    this.availableContacts.next(true);
  }
}
