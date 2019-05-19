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
  
  phoneWithWhats=false; 

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
      password: ['',Validators.required]   
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

  getPhoneErrorMessage() {
    if(this.form.phone.hasError('required')){
       return 'Preencha com seu telefone';
    }else if(this.form.phone.hasError('pattern')){
       return 'Campo aceita somente números';
    }else if(this.form.phone.hasError('minlength')){
       return 'Telefone possui digitos faltando';
    }
  } 

  addUser(){
     if(this.formRegister.valid){

      let user = {
         "name": this.form.name.value, 
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.phoneWithWhats,
         "email" : this.form.email.value,
         "password" : this.form.password.value
      }
      
      this.service.addUser(user).subscribe(
            (data:any)=> {
                console.log(data);
                this.dialogRef.close();  
                alert("Cadastro realizado com sucesso");
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
