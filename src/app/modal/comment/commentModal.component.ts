import { Component, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import { CookieService } from 'ngx-cookie';
import swal from 'sweetalert2';


//material
import { MAT_DIALOG_DATA, MatDialogRef,MatDatepickerModule,
MatNativeDateModule} from '@angular/material';
import {DateAdapter, MAT_DATE_FORMATS,MAT_DATE_LOCALE} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

// Components
import { ServiceComponent } from '../../service.component';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

@Component({
  selector: 'comment-modal',
  templateUrl: './commentModal.component.html',
  styleUrls: ['./commentModal.component.scss'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],   
})
export class CommentModalComponent {
  formComment: FormGroup;
  date;
  user:any; 
  userSendId = null;

  constructor(
    private dialogRef: MatDialogRef<CommentModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    private cookieService:CookieService,
    @Inject(MAT_DIALOG_DATA) private petData: any,
    ){

    this.formComment = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', 
        [Validators.required,
        Validators.minLength(10),
        Validators.pattern('[0-9]+')]],
      phoneWithWhats: [false],
      comment: ['', Validators.required],
      link: [''],

    });

    this.setDateOfDayInPick();
    
    //Set user logged(if exist)
    if(this.cookieService.get('logged') != undefined
       && this.cookieService.get('logged') != null){
      this.form.name.setValue(this.cookieService.get('userName'));
      this.form.phone.setValue(this.cookieService.get('userPhone'));
      this.form.phoneWithWhats.setValue(!!this.cookieService.get('UserPhoneWithWhats'));
    }  
  }

  setDateOfDayInPick(){
    this.date = new FormControl(new Date());
    var serializedDate = new FormControl((new Date()).toISOString());
  }

  get form() {
    return this.formComment.controls;
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

  getNameErrorMessage(){
    if(this.form.name.hasError('required')){
       return 'Preencha o nome do pet';
    }
  }

  getCommentErrorMessage(){
    if(this.form.comment.hasError('required')){
       return 'Preencha o comentário';
    }
  }


  addComment(){  
    if(this.formComment.valid){      
      let comment = {
         "userName": this.form.name.value, 
         "userPhone" : this.form.phone.value,
         "userPhoneWithWhats" :  this.form.phoneWithWhats.value,
         "date" : this.date.value,
         "comment" : this.form.comment.value,
         "link": this.form.link.value,
         "idPet": this.petData.petId, 
         "idReceived": this.petData.petUserId
      }

      this.service.addComment(comment).subscribe(
        (data:any)=> {
            
            this.dialogRef.close();
            swal.fire({
                      title: 'Bom trabalho!',
                      text: 'Comentário adicionado com sucesso',
                      type: 'success',
                      width: 350
            })
        },
        error => {
            console.log(error);
            this.service.handleErrors(error);
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
