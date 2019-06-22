import { Component, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import swal from 'sweetalert2';

//material
import { MatDialogConfig,MAT_DIALOG_DATA, MatDialogRef,
         MatButtonModule,MatButtonToggleModule,
         MatIconModule,MatIconRegistry,MatTooltipModule} 
         from '@angular/material'; 

// Components
import { ServiceComponent } from '../../service.component';
import { TokenInterceptor } from '../../token.interceptor';


@Component({
  selector: 'register-modal',
  templateUrl: './registerModal.component.html',
  styleUrls: ['./registerModal.component.scss']
})
export class RegisterModalComponent { 

  formRegister: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<RegisterModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent, 
    
    ){
    this.formRegister = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', 
        [Validators.required,
         Validators.minLength(10),
         Validators.pattern('[0-9]+')]],
      email: ['', Validators.required],
      password: ['',Validators.required],
      phoneWithWhats: [false]    
    });
   
  }

  get form() {
    return this.formRegister.controls;
  }

  getNameErrorMessage() {
    if(this.form.name.hasError('required')){
       return 'Preencha com o seu nome';
    }
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
    if(this.form.password.hasError('required')){
       return 'Preencha com a sua senha';
    }
  } 

  addUser(){
     if(this.formRegister.valid){
      let user = {
         "name": this.form.name.value, 
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.form.phoneWithWhats.value,
         "email" : this.form.email.value,
         "password" : this.form.password.value
      }
      
      this.service.addUser(user).subscribe(
            (data:any)=> {
              this.dialogRef.close();  

              swal.fire({
                title: 'Bom trabalho!',
                text: 'Cadastro realizado com sucesso',
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
