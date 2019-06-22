import { Component, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import swal from 'sweetalert2';

//material
import { MAT_DIALOG_DATA, MatDialogRef,MatDialogConfig,MatDialog,
         MatButtonModule,MatButtonToggleModule,
         MatIconModule,MatIconRegistry,MatTooltipModule} 
         from '@angular/material'; 

// Components
import { RegisterModalComponent } from '../../modal/register/registerModal.component';  
import { ServiceComponent } from '../../service.component';
import { TokenInterceptor } from '../../token.interceptor';   

@Component({
  selector: 'register-new-password-modal',
  templateUrl: './registerNewPasswordModal.component.html',
  styleUrls: ['./registerNewPasswordModal.component.scss']
})

export class RegisterNewPasswordModalComponent { 

  formRegister: FormGroup;
  phoneWithWhats=false; 
  
  constructor(
    private dialogRef:MatDialogRef<RegisterNewPasswordModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    private dialog: MatDialog, 
    ){
    this.formRegister = this.formBuilder.group({
      phone: ['', Validators.required],
      email: ['', Validators.required],
      newPassword: ['',Validators.required],
      confirmPassword: ['', Validators.required], 
    });
  }

  get form() {
    return this.formRegister.controls;
  }

  getPhoneErrorMessage() {
    if(this.form.phone.hasError('required')){
       return 'Preencha com seu telefone';
    }else if(this.form.phone.hasError('pattern')){
       return 'Campo aceita somente números';
    }else if(this.form.phone.hasError('minlength')){
       return 'Telefone possui digitos faltando';
    }
  } 

  getEmailErrorMessage() {
    if(this.form.email.hasError('required')){
       return 'Preencha com o seu email';
    }
  } 

  getPassErrorMessage() {
    if(this.form.newPassword.hasError('required')){
       return 'Preencha com a nova senha';
    }
  } 

  getConfirmPasswordErrorMessage() {
    if(this.form.confirmPassword.hasError('required')){
       return 'Preencha com a sua nova senha';
    }
  } 

  isPhoneWithWhats() { 
    if(this.phoneWithWhats){  
      this.phoneWithWhats = false; 
    }else{
      this.phoneWithWhats = true; 
    }    
  }  

  registerNewPassword(){
    if(this.formRegister.valid){

      let user = { 
        "phone" : this.form.phone.value,
        "email" : this.form.email.value,
        "newPassword" : this.form.newPassword.value,
        "confirmNewPassword": this.form.confirmPassword.value
      }
      
      this.service.addNewPassword(user).subscribe(
        (data:any)=> {
            this.dialogRef.close(); 
            swal.fire({
              title: 'Bom trabalho!',
              text: 'Nova senha cadastrada com sucesso',
              type: 'success',
              width: 350
            })
        },
        error => {
            this.service.handleErrors(error);
            console.log(error);
        });
    }
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
