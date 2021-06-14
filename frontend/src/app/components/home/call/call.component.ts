import { Component, OnInit } from '@angular/core';
import { CallService } from 'src/app/services/call.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent implements OnInit {

  data: any;                      // incoming or outgoing
  call: any;                      // call props
  isMin: boolean = true;          // is window minimized
  audio: boolean = true;          // is mute
  isPeerAudio: boolean = false;   // is peer audio on
  video: boolean = true;          // is video on
  isPeerVideo: boolean = false;   // is peer video on
  screenShare: boolean = false;   // is sharing screen
  isPeerScreenShare: boolean      // is peer screen share on
    = false;
  screenShareTrack: any;          // screen track prop
  isIncoming: boolean = false;    // is call incoming
  isDeclined: boolean = false;    // call declined by peer
  isDisconnected: boolean = false;// peer disconnected

  // { token, room, peerId }
  constructor(
    private callService: CallService,
    private userService: UserService,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {
    if (this.callService.incomingCall) {
      this.data = this.callService.incomingCall;
      this.isIncoming = true;
    } else if (this.callService.outgoingCall) {
      this.data = this.callService.outgoingCall;
      this.joinCall();
      this.notifyPeer();
    }

    // subscribe to any new message available
    this.socketService.observeNewMessage.subscribe(msg => {
      if ('type' in msg && msg['type'] === "call-disconnected") {
        this.isDisconnected = true;
        setTimeout(() => {
          this.endCall();
        }, 5000);
      }

      if ('type' in msg && msg['type'] === "call-declined") {
        this.isDeclined = true;
        setTimeout(() => {
          this.endCall();
        }, 5000);
      }
    });
  }

  /**
   * join room
   */
  joinCall(): void {
    // console.log(this.data);
    // @ts-ignore
    Twilio.Video.connect(this.data.token, {
      audio: { name: 'microphone' },
      video: { name: 'camera' },
      name: this.data.room['uniqueName'],
    }).then(room => {
      this.call = room;
      // console.log(`Successfully joined call: ${room}`);

      if (this.isIncoming) this.isIncoming = false;

      // disable audio and video
      this.enDisAudio();
      this.enDisVideo();

      // existing remote tracks
      room.participants.forEach(participant => {
        participant.on('trackSubscribed', track => {
          // append video el
          let parentEl = document.getElementById('peer-video');
          parentEl.appendChild(track.attach());
          for (let i = 0; i < parentEl.children.length; i++) {
            if (parentEl.children[i].tagName === 'VIDEO'
              && !parentEl.children[i].id) {
              parentEl.children[i].id = track.name;
            }
          }
          // adjust peer video el dimen
          this.adjustVideoSize();
          // if track name is not camera, it is screen share video
          if (track.kind === 'video' && track.name !== 'camera') this.isPeerScreenShare = true;
          // listen to peer audio/video disable
          track.on('disabled', () => {
            if (track.kind === 'audio') this.isPeerAudio = false;
            if (track.kind === 'video') {
              this.isPeerVideo = false;
              this.adjustVideoSize();
            }
          });
          // listen to peer audio/video enable
          track.on('enabled', () => {
            if (track.kind === 'audio') this.isPeerAudio = true;
            if (track.kind === 'video') {
              this.isPeerVideo = true;
              this.adjustVideoSize();
            }
          });
        });

        participant.on('trackUnsubscribed', track => {
          if (track.kind === 'video' && track.name !== 'camera') {
            let parentEl = document.getElementById('peer-video');
            for (let i = 0; i < parentEl.children.length; i++) {
              if (parentEl.children[i].tagName === 'VIDEO' &&
                parentEl.children[i].id !== 'camera') {
                parentEl.children[i].remove();
              }
            }
            this.isPeerScreenShare = false;
          }
        });
      });

      // new remote connected
      room.on('participantConnected', participant => {
        // console.log(`A participant connected: ${participant.identity}`);

        participant.on('trackSubscribed', track => {
          // append video el
          let parentEl = document.getElementById('peer-video');
          parentEl.appendChild(track.attach());
          for (let i = 0; i < parentEl.children.length; i++) {
            if (parentEl.children[i].tagName === 'VIDEO' &&
              !parentEl.children[i].id) {
              parentEl.children[i].id = track.name;
            }
          }
          // adjust peer video el dimen
          this.adjustVideoSize();
          // if track name is not camera, it is screen share video
          if (track.kind === 'video' && track.name !== 'camera') this.isPeerScreenShare = true;
          // listen to peer video disable
          track.on('disabled', () => {
            this.isPeerVideo = false;
            this.adjustVideoSize();
          });
          // listen to peer video enable
          track.on('enabled', () => {
            this.isPeerVideo = true;
            this.adjustVideoSize();
          });
        });

        participant.on('trackUnsubscribed', track => {
          if (track.kind === 'video' && track.name !== 'camera') {
            let parentEl = document.getElementById('peer-video');
            for (let i = 0; i < parentEl.children.length; i++) {
              if (parentEl.children[i].tagName === 'VIDEO' &&
                parentEl.children[i].id !== 'camera') {
                parentEl.children[i].remove();
              }
            }
            this.isPeerScreenShare = false;
          }
        });
      });

      // new remote connected
      room.on('participantDisconnected', participant => {
        // console.log(`A participant disconnected: ${participant.identity}`);
      });
    }, error => {
      // console.log(`Unable to connect to call: ${error.message}`);
    });
  }

  /**
   * notify peer after successfully
   * joining room
   */
  notifyPeer(): void {
    // console.log(this.data);
    this.socketService.sendMessage({
      type: 'call',
      roomId: this.data.room['uniqueName'],
      toPeerId: this.data.peerId,
      fromPeerId: this.userService.currUser.id
    });
  }

  /**
   * mute unmute audio
   */
  enDisAudio(): void {
    this.call.localParticipant.audioTracks.forEach(publication => {
      if (this.audio) publication.track.disable()
      else publication.track.enable()
    });
    this.audio ? this.audio = false : this.audio = true;
  }

  /**
   * show hide video
   */
  enDisVideo(): void {
    this.call.localParticipant.videoTracks.forEach(publication => {
      if (this.video) publication.track.disable()
      else publication.track.enable()
    });
    this.video ? this.video = false : this.video = true;
  }

  /**
   * start stop screen share
   */
  enDisScreenShare(): void {
    if (this.screenShare) {
      this.call.localParticipant.unpublishTrack(this.screenShareTrack);
      this.screenShareTrack.stop();
      this.screenShareTrack = null;
    } else {
      // @ts-ignore
      navigator.mediaDevices.getDisplayMedia()
        .then(stream => {
          // disable video to enable screen share
          this.call.localParticipant.videoTracks.forEach(publication => {
            // console.log(publication);
            if (this.video && publication.trackName === 'camera') publication.track.disable();
          });
          this.video = false;

          setTimeout(() => {
            // @ts-ignore
            this.screenShareTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
            this.call.localParticipant.publishTrack(this.screenShareTrack);

            stream.getVideoTracks()[0].onended = () => {
              this.call.localParticipant.unpublishTrack(this.screenShareTrack);
              this.screenShareTrack.stop();
              this.screenShareTrack = null;
              this.screenShare ? this.screenShare = false : this.screenShare = true;
            }
          }, 1500);
        })
        .catch(() => {
          // console.log(`Screen Share failed`);
        });
    }
    this.screenShare ? this.screenShare = false : this.screenShare = true;
  }

  /**
   * end call
   */
  endCall(): void {
    if (this.call) {
      this.call.localParticipant.tracks.forEach(publication => {
        // console.log(publication);
        const attachedElements = publication.track.detach();
        attachedElements.forEach(element => {
          element.remove();
        });
      });

      // disconnect call
      this.call.disconnect();

      // notify peer
      this.socketService.sendMessage({
        type: 'call-disconnected',
        roomId: this.data.room['uniqueName'],
        toPeerId: this.data.peerId,
        fromPeerId: this.userService.currUser.id
      });

      // remove elements
      let parentEl = document.getElementById('peer-video');
      if (parentEl && parentEl.hasChildNodes()) {
        for (let i = 0; i < parentEl.children.length; i++) {
          parentEl.children[i].remove();
        }
      }

      // calc call duration and update on caller side
      if (this.callService.outgoingCall) {
        let callInHistory = this.callService.callHistory.outgoing.filter(_c => {
          return _c.callId === this.data.room['uniqueName']
        })[0];

        let callStartTime = new Date(callInHistory.callDate).getTime();
        let callEndTime = new Date().getTime();
        let durationInMins = Math.round((((callEndTime - callStartTime) % 86400000) % 3600000) / 60000);
        callInHistory.duration = durationInMins;

        // update call duration
        this.callService.updateCall({ callId: this.data.room['uniqueName'], duration: durationInMins })
          .subscribe((res: any) => {
            // console.log(res);
          }, (error) => {
            if (error.status === 500) console.log('Server Error');
          }, () => { });
      }

      // set null
      if (this.callService.incomingCall) this.callService.incomingCall = null;
      else this.callService.outgoingCall = null;

      this.data = null;
      this.call = null;

      this.callService._call.next(20);
    }
  }

  /**
   * maximize minimize call el
   */
  expandDisplay(): void {
    this.isMin ? this.isMin = false : this.isMin = true;
    this.adjustVideoSize();
  }

  /**
   * answer incoming call
   */
  answerCall(): void {
    this.joinCall();
  }

  /**
   * decline incoming call
   */
  declineCall(): void {
    // notify other user
    this.socketService.sendMessage({
      type: 'call-declined',
      roomId: this.data.room['uniqueName'],
      toPeerId: this.data.peerId,
      fromPeerId: this.userService.currUser.id
    });

    this.callService._call.next(20);
  }

  /**
   * dynamically adjust the 
   * track dimensions
   */
  adjustVideoSize(): void {
    let parentEl = document.getElementById('peer-video');
    if (parentEl.children && parentEl.children.length > 0) {
      for (let i = 0; i < parentEl.children.length; i++) {
        let videoEl;
        if (parentEl.children[i].tagName === 'VIDEO'
          && parentEl.children[i].id === 'camera') {
          videoEl = parentEl.children[i];
          if (this.isPeerVideo) {
            if (this.isMin) {
              videoEl.width = 320;
              videoEl.height = 240;
            } else {
              videoEl.width = 1280;
              videoEl.height = 720;
            }
          } else {
            videoEl.width = 0;
            videoEl.height = 0;
          }
        } else if (parentEl.children[i].tagName === 'VIDEO'
          && parentEl.children[i].id !== 'camera') {
          videoEl = parentEl.children[i];
          if (this.isMin) {
            videoEl.width = 320;
            videoEl.height = 240;
          } else {
            videoEl.width = 1280;
            videoEl.height = 720;
          }
        }
      }
    }
  }

  /**
   * @param id user id
   * @returns users email
   */
  getUserEmail(id: any): any {
    return this.userService.users.filter(user => {
      return user.id === id
    })[0].email;
  }

}
