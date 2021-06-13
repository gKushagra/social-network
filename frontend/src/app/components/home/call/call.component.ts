import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent implements OnInit {

  isMin: boolean = false;

  call: any;
  audio: boolean = true;
  video: boolean = true;
  screenShare: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, // { token, room, peerId }
    private dialogRef: MatDialogRef<CallComponent>,
    private userService: UserService,
    private socketService: SocketService,
  ) { }

  ngOnInit(): void {
    this.placeCall();
  }

  placeCall(): void {
    console.log(this.data);
    // @ts-ignore
    Twilio.Video.connect(this.data.token, {
      audio: true,
      name: this.data.room['uniqueName'],
      video: { width: 640 }
    }).then(room => {
      this.call = room;
      console.log(`Successfully joined call: ${room}`);

      if ('url' in this.data.room) {
        this.notifyPeer();
      }

      // local tracks
      room.localParticipant.tracks.forEach(publication => {
        if (publication.isEnabled) {
          const track = publication.track;
          document.getElementById('user-video').appendChild(track.attach());
        }
      });

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

  notifyPeer(): void {
    console.log(this.data);
    this.socketService.sendMessage({
      type: 'call',
      roomId: this.data.room['uniqueName'],
      toPeerId: this.data.peerId,
      fromPeerId: this.userService.currUser.id
    });
  }

  enDisAudio(): void {
    this.audio = !this.audio;
    this.call.localParticipant.audioTracks.forEach(publication => {
      if (this.audio) publication.track.disable()
      else publication.track.enable()
    });
  }

  enDisVideo(): void {
    this.video = !this.video;
    this.call.localParticipant.videoTracks.forEach(publication => {
      if (this.video) publication.track.disable()
      else publication.track.enable()
    });
  }

  enDisScreenShare(): void {
    this.screenShare = !this.screenShare;
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
  }

  endCall(): void {
    this.call.localParticipant.tracks.forEach(publication => {
      const attachedElements = publication.track.detach();
      attachedElements.forEach(element => {
        element.remove();
      });
    });

    this.call.disconnect();

    this.dialogRef.close();
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
