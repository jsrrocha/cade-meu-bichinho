import { Component, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import swal from 'sweetalert2';

//material
import { MAT_DIALOG_DATA, MatDialogRef,MatDatepickerModule,
MatNativeDateModule} from '@angular/material';
import {DateAdapter, MAT_DATE_FORMATS,MAT_DATE_LOCALE} from '@angular/material/core';

// Components
import { ServiceComponent } from '../../service.component';

@Component({
  selector: 'removePet-modal',
  templateUrl: './removePetModal.component.html',
  styleUrls: ['./removePetModal.component.scss'],
  providers: [], 
  
})
export class RemovePetModalComponent {
  formRemove: FormGroup;
  phoneWithWhats=false; 
  updateListOfPets = false;


  constructor(
    private dialogRef: MatDialogRef<RemovePetModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    @Inject(MAT_DIALOG_DATA) 
    private petId: any, 
    ){

    this.formRemove = this.formBuilder.group({
      reason: [0, Validators.required]    
    });
  }

  get form() {
    return this.formRemove.controls;
  }

  removePet(){ 
    
    if(this.formRemove.valid){    
      this.service.removePet(+this.petId,this.form.reason.value)
        .subscribe(
          
          (data:any)=> {
            swal.fire({
              title: 'Bom trabalho!',
              text: 'Pet foi removido com sucesso',
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
