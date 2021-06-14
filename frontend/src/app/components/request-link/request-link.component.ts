import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-request-link',
  templateUrl: './request-link.component.html',
  styleUrls: ['./request-link.component.scss']
})
export class RequestLinkComponent implements OnInit {

  email: FormControl = new FormControl(null, [Validators.required, Validators.email]);

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  tryResetLink(): void {
    // console.log(this.email.value);

    // send email to backend 
    this.authenticationService.requestResetLink(this.email.value)
      .subscribe((res: any) => {
        // console.log(res);
      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        this.email.disable();
      });
  }

  goToLogin(): void {
    this.router.navigate(['login']);
  }

}
