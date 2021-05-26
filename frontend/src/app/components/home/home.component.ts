import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    console.log(this.isAuthenticated());
    if (!this.isAuthenticated()) {
      this.router.navigate(['login']);
    }

    if(!this.userService.currUser) {
      this.userService.currUser = JSON.parse(localStorage.getItem('_user'));
    }

    this.userService.getUsers()
      .subscribe((res: any) => {
        this.userService.users = res.users;
        this.userService.refreshAvlUsers();
      })
    this.userService.getContacts()
      .subscribe((res: any) => {
        this.userService.contacts = res.contacts;
        this.userService.refreshAvlContacts();
      });
  }

  private isAuthenticated(): boolean {
    if (localStorage.getItem('token'))
      return true;
    else return false;
  } ƒ
}
