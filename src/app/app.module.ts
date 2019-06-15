import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {HttpClientModule, HttpParams, HttpHeaders,HTTP_INTERCEPTORS} from '@angular/common/http';

import {DomSanitizer} from '@angular/platform-browser';
import {ScrollDispatchModule} from '@angular/cdk/scrolling'; 
import { CookieModule } from 'ngx-cookie';

// Map
import { AgmCoreModule } from '@agm/core';
import { AgmOverlays } from "agm-overlays";

// Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { LostPetModalComponent } from './modal/lostPet/lostPetModal.component';
import { FoundPetModalComponent } from './modal/foundPet/foundPetModal.component';

import { RemovePetModalComponent } from './modal/removePet/removePetModal.component';

import { LoginModalComponent } from './modal/login/loginModal.component';
import { RegisterModalComponent } from './modal/register/registerModal.component';
import { RegisterNewPasswordModalComponent } from './modal/registerNewPassword/registerNewPasswordModal.component';

import { CommentModalComponent } from './modal/comment/commentModal.component';
  
import { ServiceComponent } from './service.component';
import { TokenInterceptor } from './token.interceptor';


// Material
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
   MatButtonModule, 
   MatCheckboxModule,
   MatGridListModule,
   MatInputModule,
   MatIconModule,
   MatCardModule,
   MatMenuModule,
   MatDialogModule,
   MatDatepickerModule,
   MatNativeDateModule,
   MatButtonToggleModule,
   MatTooltipModule,
   MatRadioModule,
   MatDividerModule,
   MatListModule,
   MatPaginatorModule,
   MAT_DIALOG_DATA,
   MatDialogRef,
   MatSlideToggleModule,
   

 } from '@angular/material';


@NgModule({
  declarations: [
    AppComponent,
    LostPetModalComponent,
    FoundPetModalComponent,
    LoginModalComponent,
    RegisterModalComponent,
    RegisterNewPasswordModalComponent,
    CommentModalComponent,
    RemovePetModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CookieModule.forRoot(),

    // material
    MatButtonModule,
    MatCheckboxModule,
    MatGridListModule,
    MatInputModule, 
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatRadioModule,
    MatDividerModule,
    MatListModule,
    MatPaginatorModule,
    ScrollDispatchModule,
    MatSlideToggleModule,
    // map
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyClNvzWYjAplvnnhCGHaXzVEiV6KGEHYSQ',
      libraries: ['places']
    }),
    AgmOverlays
  ],
  providers: [ 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }, 
    { provide: MatDialogRef, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: [] },
    LoginModalComponent
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    LostPetModalComponent, FoundPetModalComponent,
    LoginModalComponent,RegisterModalComponent,
    CommentModalComponent,RemovePetModalComponent,
    RegisterNewPasswordModalComponent
  ]
})
export class AppModule { }

