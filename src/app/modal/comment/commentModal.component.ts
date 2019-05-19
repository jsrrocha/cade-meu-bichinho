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
  phoneWithWhats= false;
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
      phone: ['', Validators.required],
      comment: ['', Validators.required],
      link: ['']
    });

    this.setDateOfDayInPick();
    
    //Set user logged(if exist)
    this.form.name.setValue(this.cookieService.get('userName'));
    this.form.phone.setValue(this.cookieService.get('userPhone'));
    this.phoneWithWhats = !!this.cookieService.get('UserPhoneWithWhats');   
  }


  setDateOfDayInPick(){
    this.date = new FormControl(new Date());
    var serializedDate = new FormControl((new Date()).toISOString());
  }

  get form() {
    return this.formComment.controls;
  }

  isPhoneWithWhats() { 
   if(this.phoneWithWhats){  
      this.phoneWithWhats = false; 
   }else{
     this.phoneWithWhats = true; 
   }    
  }

  addComment(){  
     if(this.formComment.valid){      
      console.log(this.user); 
      let comment = {
         "name": this.form.name.value, 
         "date" : this.date.value,
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.phoneWithWhats,
         "comment" : this.form.comment.value,
         "idPet": this.petData.petId, 
         "idReceived": this.petData.petUserId, //OBRIGATORIO
         "idSend": this.cookieService.get('userLoggedId') 
      }
     
      this.service.addComment(comment).subscribe(
          (data:any)=> {
              console.log(data);
              this.dialogRef.close();
              alert("Comentário adicionado com sucesso");

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
