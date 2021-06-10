import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Call } from "../models/common";

@Injectable({
  providedIn: 'root'
})
export class CallService {

  constructor(
    private http: HttpClient,
  ) { }

  createRoom(payload: Call): any {
    return this.http.post(environment.callUrl, payload);
  } 

  getAccessToken(payload: any): any {
    return this.http.post(environment.callUrl + '/token', payload);
  }

  endRoom(roomId): any {
    return this.http.get(environment.callUrl + `/${roomId}`);
  }
}
