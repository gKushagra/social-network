import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(
    private http: HttpClient,
  ) { }

  login(payload): any {
    return this.http.post(environment.authenticationUrl + 'login', payload);
  }

  signup(payload): any {
    return this.http.post(environment.authenticationUrl + 'signup', payload);
  }

  requestResetLink(email): any {
    return this.http.get(environment.authenticationUrl + `reset/${email}`);
  }

  reset(payload): any {
    return this.http.post(environment.authenticationUrl + 'reset', payload);
  }
}
