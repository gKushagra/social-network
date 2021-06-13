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

  constructor(
    private http: HttpClient,
    private userService: UserService,
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
      // DEPRECATED
      // let dialogConfig: MatDialogConfig = new MatDialogConfig();
      // dialogConfig.minWidth = window.innerWidth;
      // dialogConfig.minHeight = window.innerHeight;
      // dialogConfig.disableClose = true;
      // dialogConfig.data = {
      //   token: token,
      //   room: { uniqueName: this.incomingCall.roomId },
      //   peerId: this.incomingCall.fromPeerId
      // };
      // let callDialogRef: MatDialogRef<CallComponent> = this.dialog.open(CallComponent, dialogConfig);
      // callDialogRef.beforeClosed().subscribe(data => {
      //   console.log(data);
      //   token = null;
      //   room = null;
      //   this.incomingCall = null;
      // });
    });
  }

  notifyOutgoingCall(data: any) {
    let room, token; // local temp var

    // create new room
    this.createRoom(data)
      .subscribe((res: any) => {
        console.log(res);
        room = res.room;
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
          // DEPRECATED
          // let dialogConfig: MatDialogConfig = new MatDialogConfig();
          // dialogConfig.minWidth = window.innerWidth;
          // dialogConfig.minHeight = window.innerHeight;
          // dialogConfig.disableClose = true;
          // dialogConfig.data = { token: token, room: room, peerId: callObj.toUserId };
          // let callDialogRef: MatDialogRef<CallComponent> = this.dialog.open(CallComponent, dialogConfig);
          // callDialogRef.beforeClosed().subscribe(data => {
          //   console.log(data);
          //   token = null;
          //   room = null;
          //   // end room: dont know if req.
          //   // this.callService.endRoom(room.unique_name)
          //   //   .subscribe((res: any) => {
          //   //     console.log(res);
          //   //   }, (error) => {
          //   //     if (error.status === 500) console.log("Server Error");
          //   //   }, () => { });
          // });
        });
      });
  }
}
