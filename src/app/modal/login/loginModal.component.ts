import { Component, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import { CookieService } from 'ngx-cookie';
import swal from 'sweetalert2';


//material

import { MAT_DIALOG_DATA, MatDialogRef,MatDialogConfig,MatDialog,
         MatButtonModule,MatButtonToggleModule,
         MatIconModule,MatIconRegistry,MatTooltipModule} 
         from '@angular/material'; 

// Components
import { RegisterModalComponent } from '../../modal/register/registerModal.component';  
import { RegisterNewPasswordModalComponent } from '../../modal/registerNewPassword/registerNewPasswordModal.component'; 

import { ServiceComponent } from '../../service.component';
import { TokenInterceptor } from '../../token.interceptor';   

@Component({
  selector: 'login-modal',
  templateUrl: './loginModal.component.html',
  styleUrls: ['./loginModal.component.scss']
})
export class LoginModalComponent { 

  formLogin: FormGroup;
  phoneWithWhats=false; 
  logged = false;

  constructor(
    private dialogRef: MatDialogRef<LoginModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    private dialog: MatDialog, 
    private cookieService:CookieService,
    ){
    
    this.formLogin = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['',Validators.required]   
    });

  }

  get formControl() {
    return this.formLogin.controls;
  }

  isPhoneWithWhats() { 
   if(this.phoneWithWhats){  
      this.phoneWithWhats = false; 
   }else{
     this.phoneWithWhats = true; 
   }    
  }  

  loginAuth(){
    if(this.formLogin.valid){
      this.cookieService.put('token',this.service.tokenForClient);
      console.log(this.cookieService.get('token'));

      this.service.authentication(
        this.formControl.email.value,
        this.formControl.password.value)
        .subscribe(
        (data:any)=> {
            console.log(data);
            this.cookieService.put('token','Bearer ' + data.access_token);
            this.cookieService.put('refreshToken',data.refresh_token);
            
            this.cookieService.put('expiresIn',data.expires_in);

            var expireTime = new Date().getTime() +  data.expires_in * 1000;  
            this.cookieService.put('expireTime',expireTime.toString());
   
            this.getUserLoggedInAndAddUserOfPet();
            this.dialogRef.close();
            
            alert("Login realizado com sucesso");
        }, 

        error => {
            alert("Algo deu errado");
            console.error(error);
        });
    }
  }

  getUserLoggedInAndAddUserOfPet(){
      this.service.getUserLoggedIn().subscribe(
        (data:any)=> {
          console.log(data); 
          
          if(data != null){
            this.cookieService.put('logged','true');
            this.cookieService.put('userLoggedId',data.id);
            this.cookieService.put('userName',data.name);
            this.cookieService.put('userPhone',data.phone);
            this.cookieService.put('userPhoneWithWhats',data.phoneWithWhats);

            if(this.cookieService.get('petId') != ""){
              this.addUserOfPet();
            }
         
          }
        },
        error => {
            console.log(error);
        });
  }

  addUserOfPet(){
    this.service.addUserOfPet(
     +this.cookieService.get('petId'),
     +this.cookieService.get('userLoggedId'))
      .subscribe(
      (data:any)=> {
          console.log(data);
          this.cookieService.put('petHaveUser','true');
      },

      error => {
          console.error(error);
      });
  }


  refreshAccessAuth(){
    this.cookieService.put('token',this.service.tokenForClient);
    
    console.log(this.cookieService.get('refreshToken')); 

    this.service.refreshToken(this.cookieService.get('refreshToken'))
    .subscribe(
    (data:any)=> {
        console.log(data);

        this.cookieService.put('token','Bearer ' + data.access_token);
        this.cookieService.put('refreshToken',data.refresh_token);
        this.cookieService.put('expiresIn',data.expires_in);
    },
    error => {
        console.error(error);
    });
  }

  openDialogRegister() {
    this.dialogRef.close();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '350px'; 
    this.dialog.open(RegisterModalComponent, dialogConfig);
    
  }

  openDialogRegisterNewPassword() {
    this.dialogRef.close();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '300px';  

    this.dialog.open(RegisterNewPasswordModalComponent, dialogConfig);
  }

  close() {
    swal.fire({
        title: 'Você realmente deseja sair?',
        type: 'warning',
        width: 350,
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then((result) => { 
        if (result.value) {
          this.dialogRef.close();
        } 
    })
  }

}
