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
  public requests: Request[] = [];

  private availableUsers: Subject<boolean> = new Subject();
  public observeAvlUsers: Observable<boolean> = this.availableUsers.asObservable();

  private availableContacts: Subject<boolean> = new Subject();
  public observeAvlContacts: Observable<boolean> = this.availableContacts.asObservable();

  private availableRequests: Subject<boolean> = new Subject();
  public observeAvlRequests: Observable<boolean> = this.availableRequests.asObservable();

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

  getRequests(): any {
    return this.http.get(environment.requestUrl + `/${this.currUser.id}`);
  }

  addRequest(payload): any {
    return this.http.post(environment.requestUrl, payload);
  }

  setRequestInactive(requestId): any {
    return this.http.put(environment.requestUrl + `/${requestId}`, {});
  }

  refreshAvlUsers(): void {
    this.availableUsers.next(true);
  }

  refreshAvlContacts(): void {
    this.availableContacts.next(true);
  }

  refreshAvlRequests(): void {
    this.availableRequests.next(true);
  }
}
