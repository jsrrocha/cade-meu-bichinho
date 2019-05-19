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
        console.log(user);
        
        this.service.addNewPassword(user).subscribe(
              (data:any)=> {
                  console.log(data);
                  this.dialogRef.close(); 
                  alert("Nova senha cadastrada com sucesso"); 
              },
              error => {
                  console.log(error);
                  alert("Algo deu errado");
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
