import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Call } from "../models/common";
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class CallService {

  public incomingCall: any;
  public outgoingCall: any;

  public _call: Subject<Number> = new Subject();
  public obsrvCall: Observable<Number> = this._call.asObservable();

  public callHistory: any = {
    incoming: [],
    outgoing: []
  }
  public updateCallHistory: Subject<any> = new Subject();
  public obsrvUpdateCallHistory: Observable<any> = this.updateCallHistory.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService,
  ) { }

  getCallHistory(): any {
    return this.http.get(environment.callUrl + `/${this.userService.currUser.id}`);
  }

  createRoom(payload: Call): any {
    return this.http.post(environment.callUrl, payload);
  }

  getAccessToken(payload: any): any {
    return this.http.post(environment.callUrl + '/token', payload);
  }

  endRoom(roomId): any {
    return this.http.get(environment.callUrl + `/${roomId}`);
  }

  updateCall(payload: any): any {
    return this.http.put(environment.callUrl, payload);
  }

  notifyIncomingCall(data: any): void {
    let room, token; // local temp var

    // get access token
    this.getAccessToken({
      roomId: data.roomId,
      userId: this.userService.currUser.id
    }).subscribe((res: any) => {
      console.log(res);
      token = res.token;
    }, (error) => {
      if (error.status === 500) console.log("Server Error");
    }, () => {
      // incoming call props
      this.incomingCall = {};
      this.incomingCall['token'] = token;
      this.incomingCall['room'] = { uniqueName: data.roomId };
      this.incomingCall['peerId'] = data.fromPeerId;

      this._call.next(10);
    });
  }

  notifyOutgoingCall(data: any) {
    let room, token; // local temp var

    // create new room
    this.createRoom(data)
      .subscribe((res: any) => {
        console.log(res);
        room = res.room;
        this.callHistory.outgoing.push(res.call);
        this.updateCallHistory.next(true);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        // get access token
        this.getAccessToken({
          roomId: room['uniqueName'],
          userId: this.userService.currUser.id
        }).subscribe((res: any) => {
          console.log(res);
          token = res.token;
        }, (error) => {
          if (error.status === 500) console.log("Server Error");
        }, () => {
          // outgoing call props
          this.outgoingCall = {
            token: token,
            room: room,
            peerId: data.toUserId
          };

          this._call.next(10);
        });
      });
  }
}
