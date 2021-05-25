import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MaterialModule } from "../material.module";
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ResetComponent } from './reset/reset.component';
import { ReactiveFormsModule } from "@angular/forms";
import { RequestLinkComponent } from './request-link/request-link.component';

@NgModule({
    declarations: [
        LoginComponent,
        SignupComponent,
        ResetComponent,
        RequestLinkComponent
    ],
    imports: [
        MaterialModule,
        FlexLayoutModule,
        HttpClientModule,
        ReactiveFormsModule,
    ],
    exports: []
})
export class ComponentsModule { }