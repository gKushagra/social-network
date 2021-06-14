import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {

  password: FormControl = new FormControl(null, [Validators.required]);
  retypePassword: FormControl = new FormControl(null, [Validators.required]);

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
  }

  public tryReset(): void {
    // console.log(this.password.value, this.retypePassword.value);

    const token = this.route.snapshot.queryParamMap.get('token');
    // console.log(token);

    // send new pass to backend
    this.authenticationService.reset({ token: token, password: this.password.value })
      .subscribe((res: any) => {

      }, (error) => {
        if (error.status === 500) console.log("Server Error");
      }, () => {
        // redirect to login
        this.router.navigate(['login']);
      });
  }

}
