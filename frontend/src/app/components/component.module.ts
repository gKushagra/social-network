import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MaterialModule } from "../material.module";
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ResetComponent } from './reset/reset.component';
import { ReactiveFormsModule } from "@angular/forms";
import { RequestLinkComponent } from './request-link/request-link.component';
import { HomeComponent } from './home/home.component';
import { PostsComponent } from './home/posts/posts.component';
import { NewPostComponent } from './home/new-post/new-post.component';
import { ContactsComponent } from './home/contacts/contacts.component';
import { ChatComponent } from './home/chat/chat.component';
import { CommonModule } from "@angular/common";

@NgModule({
    declarations: [
        LoginComponent,
        SignupComponent,
        ResetComponent,
        RequestLinkComponent,
        HomeComponent,
        PostsComponent,
        NewPostComponent,
        ContactsComponent,
        ChatComponent
    ],
    imports: [
        CommonModule,
        MaterialModule,
        FlexLayoutModule,
        HttpClientModule,
        ReactiveFormsModule,
    ],
    exports: []
})
export class ComponentsModule { }