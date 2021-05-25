import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  public signupForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [Validators.required])
  });

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  public trySignup(): void {
    console.log(this.signupForm.value);

    // send user data to signup endpoint
    this.authenticationService.signup(this.signupForm.value)
      .subscribe((res: any) => {
        console.log(res);
      }, (error) => {
        // Show Error
        if (error.status === 409) console.log("User Exists");
        if (error.status === 500) console.log("Server Error");
      }, () => {
        // redirect to home
      });
  }

  public goToLogin(): void {
    this.router.navigate(['login']);
  }

}
