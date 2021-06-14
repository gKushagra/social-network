import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  video: boolean = true;          // is video on
  screenShare: boolean = false;   // is sharing screen
  isIncoming: boolean = false;    // is call incoming

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
  }

  /**
   * join room
   */
  joinCall(): void {
    console.log(this.data);
    // @ts-ignore
    Twilio.Video.connect(this.data.token, {
      audio: true,
      video: true,
      name: this.data.room['uniqueName'],
    }).then(room => {
      this.call = room;
      console.log(`Successfully joined call: ${room}`);

      if (this.isIncoming) this.isIncoming = false;

      // disable audio and video
      this.enDisAudio();
      this.enDisVideo();

      // existing remote tracks
      room.participants.forEach(participant => {
        participant.tracks.forEach(publication => {
          if (publication.track) {
            document.getElementById('peer-video').appendChild(publication.track.attach());
          }
        });

        participant.on('trackSubscribed', track => {
          document.getElementById('peer-video').appendChild(track.attach());
        });
      });

      // new remote connected
      room.on('participantConnected', participant => {
        console.log(`A participant connected: ${participant.identity}`);

        participant.tracks.forEach(publication => {
          if (publication.isSubscribed) {
            const track = publication.track;
            document.getElementById('peer-video').appendChild(track.attach());
          }
        });

        participant.on('trackSubscribed', track => {
          document.getElementById('peer-video').appendChild(track.attach());
        });
      });

      // new remote connected
      room.on('participantDisconnected', participant => {
        console.log(`A participant disconnected: ${participant.identity}`);
      });
    }, error => {
      console.log(`Unable to connect to call: ${error.message}`);
    });
  }

  /**
   * notify peer after successfully
   * joining room
   */
  notifyPeer(): void {
    console.log(this.data);
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
    let screenTrack;
    if (this.screenShare) {
      this.call.localParticipant.unpublishTrack(screenTrack);
      screenTrack.stop();
      screenTrack = null;
    } else {
      // @ts-ignore
      navigator.mediaDevices.getDisplayMedia()
        .then(stream => {
          // @ts-ignore
          screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
          this.call.localParticipant.publishTrack(screenTrack);
        })
        .catch(() => {
          console.log(`Screen Share failed`);
        });
    }
    this.screenShare ? this.screenShare = false : this.screenShare = true;
  }

  /**
   * end call
   */
  endCall(): void {
    this.call.localParticipant.tracks.forEach(publication => {
      const attachedElements = publication.track.detach();
      attachedElements.forEach(element => {
        element.remove();
      });
    });

    // disconnect call
    this.call.disconnect();

    // set null
    if (this.callService.incomingCall) this.callService.incomingCall = null;
    else this.callService.outgoingCall = null;

    this.data = null;
    this.call = null;

    this.callService._call.next(20);
  }

  /**
   * maximize minimize call el
   */
  expandDisplay(): void {
    this.isMin ? this.isMin = false : this.isMin = true;
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
