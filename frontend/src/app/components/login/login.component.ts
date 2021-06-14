import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from "../../services/authentication.service";
import { UserService } from "../../services/user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.email, Validators.required]),
    password: new FormControl(null, [Validators.required])
  });

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
  }

  public tryLogin(): void {
    // console.log(this.loginForm.value);

    // send user login info to auth endpoint on server
    this.authenticationService.login(this.loginForm.value)
      .subscribe((res: any) => {
        // console.log(res);
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('_user', JSON.stringify(res.data));
        this.userService.currUser = res.data;
      }, (error) => {
        // show error
        if (error.status === 401) console.log("User does not exist");
        if (error.status === 401) console.log("Incorrect email/password");
        if (error.status === 500) console.log("Server Error");
      }, () => {
        // redirect to home
        this.router.navigate(['home']);
      });
  }

  public goToSignUp(): void {
    this.router.navigate(['signup']);
  }

  public goToRequestResetLink() {
    this.router.navigate(['forgot-password']);
  }

}
