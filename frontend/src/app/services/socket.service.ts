import { Injectable } from '@angular/core';
import { EMPTY, Observable, Subject, timer } from 'rxjs';
import { catchError, delayWhen, retryWhen, switchAll, tap } from 'rxjs/operators';
import { webSocket } from "rxjs/webSocket";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private ws: WebSocket;

  private newMessage: Subject<any> = new Subject();
  public observeNewMessage: Observable<any> = this.newMessage.asObservable();

  constructor() { }

  // create a connection and add listeners
  public connect(): void {
    this.ws = new WebSocket(environment.socketUrl);

    // connection opened
    this.ws.onopen = (event) => {
      console.log('connection open');
    }

    // new message from server
    this.ws.onmessage = (event) => {
      // console.log(JSON.parse(event.data));
      this.newMessage.next(JSON.parse(event.data));
    }

    // error in connection
    this.ws.onerror = (event) => {
      console.log('error', event);
      this.reconnect();
    }

    // connection closed from server
    this.ws.onclose = (event) => {
      console.log('connection closed from server side', event);
      this.reconnect();
    }
  }

  // try to reconnect
  public reconnect(): void {
    this.ws.close();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // send new message
  public sendMessage(data): void {
    this.ws.send(JSON.stringify(data));
  }

  // close the connection
  public close(): void {
    this.ws.close();
  }
}
