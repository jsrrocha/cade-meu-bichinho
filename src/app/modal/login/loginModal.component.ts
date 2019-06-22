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
  appLoading = false;

  constructor(
    private dialogRef: MatDialogRef<LoginModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    private dialog: MatDialog,
    private cookieService:CookieService,

    @Inject(MAT_DIALOG_DATA)
    private pet: any,
    ){
    this.formLogin = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['',Validators.required]
    });
  }

  get form() {
    return this.formLogin.controls;
  }

  getEmailErrorMessage() {
    if(this.form.email.hasError('required')){
       return 'Preencha com o seu email';
    }
  }

  getPassErrorMessage() {
    if(this.form.password.hasError('required')){
       return 'Preencha com a sua senha';
    }
  }

  loginAuth(){

    if(this.formLogin.valid){
      this.appLoading = true;
      
      this.cookieService.put('token',this.service.tokenForClient);
      this.service.authentication(
        this.form.email.value,
        this.form.password.value)
        .subscribe(
        (data:any)=> {
          
          this.cookieService.put('token','Bearer ' + data.access_token);
          this.cookieService.put('refreshToken',data.refresh_token);
          this.cookieService.put('expiresIn',data.expires_in);
          var expireTime = new Date().getTime() +  data.expires_in * 1000;
          this.cookieService.put('expireTime',expireTime.toString());

          //Save user in cookies and save pet if is necessary
          this.getUserLoggedInAndSavePet(); 
          this.appLoading = false;
        },
        error => {
          this.appLoading = false;
          this.service.handleErrors(error);
          console.log(error);
        });
    }
  }

  getUserLoggedInAndSavePet(){
    this.service.getUserLoggedIn().subscribe(
      (data:any)=> {
   
        if(data != null){
          this.cookieService.put('logged','true');
          this.cookieService.put('userLoggedId',data.id);
          this.cookieService.put('userName',data.name);
          this.cookieService.put('userPhone',data.phone);
          this.cookieService.put('userPhoneWithWhats',data.phoneWithWhats);
          
          if(this.pet !=null){
            this.pet.userId = this.cookieService.get('userLoggedId');
            this.service.savePerformanceTime(
              this.pet.performanceTime,
              0,
              this.cookieService.get('userLoggedId')); 
            this.savePet(this.pet);
          }else{
            swal.fire({
              title: 'Bom trabalho!',
              text: 'Login realizado com sucesso',
              type: 'success',
              width: 350
            })
            this.dialogRef.close(true); 
          }
        }
      },
      error => {
          console.log(error);
      });
  }

  savePet(pet:any){
    this.service.addPet(pet).subscribe(
      (data:any)=> {
        this.cookieService.put('petId',data.id);
        
        swal.fire({
          title: 'Bom trabalho!',
          text: 'Pet cadastrado com sucesso',
          type: 'success',
          width: 350
        })
        this.dialogRef.close(true);
      },
      error => {
        this.service.handleErrors(error);
        console.log(error);
    });
  }

  refreshAccessAuth(){
    this.cookieService.put('token',this.service.tokenForClient);
    this.service.refreshToken(this.cookieService.get('refreshToken'))
    .subscribe(
    (data:any)=> {
        
        this.cookieService.put('token','Bearer ' + data.access_token);
        this.cookieService.put('refreshToken',data.refresh_token);
        this.cookieService.put('expiresIn',data.expires_in);
    },
    error => {
        console.error("erro ref" + error);
    });
  }

  openDialogRegister() {
    this.dialogRef.close(false);

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '350px';
    this.dialog.open(RegisterModalComponent, dialogConfig);
  }

  openDialogRegisterNewPassword() {
    this.dialogRef.close(false);

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '300px';
    dialogConfig.height = '400px';
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
          this.dialogRef.close(false);
        }
    })
  }

}
