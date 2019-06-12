import { Component,Inject, NgZone,ElementRef, OnInit, Input,ViewChild,AfterViewInit } from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser'; 
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MapsAPILoader } from '@agm/core';
import { CookieService } from 'ngx-cookie';
import swal from 'sweetalert2';

//material
import { MAT_DIALOG_DATA, MatDialogRef,MatDialog, MatDatepickerModule,
         MatNativeDateModule,MatDialogConfig,MatButtonModule,MatButtonToggleModule,
         MatIconModule,MatIconRegistry,MatTooltipModule} 
         from '@angular/material'; 
import {DateAdapter, MAT_DATE_FORMATS,MAT_DATE_LOCALE} from '@angular/material/core';

// Components
import { ServiceComponent } from '../../service.component';

import { LoginModalComponent } from '../../modal/login/loginModal.component'; 

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
  selector: 'found-pet-modal',
  templateUrl: './foundPetModal.component.html',
  styleUrls: ['./foundPetModal.component.scss'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})

export class FoundPetModalComponent implements OnInit{  

  formPetFound: FormGroup;
  date;
  selectedSpecie= 0;
  selectedSex= 0;
  selectedLifeStage= 0;
  selectedFurColor= 0; 
  photoData = null;
  photoWithoutHeader64 = null;
  phoneWithWhats= false; 
  selectedImg= true;
  userLoggedId = null;
  edition = false;
  
  //Map
  @Input() lat: number = -30.0513678; // default Porto Alegre
  @Input() lng: number = -51.2160819; // default Porto Alegre
  @Input() zoom: number = 13;
  latPet;
  lngPet;
  markerPet;
  
  constructor(
    private dialogRef: MatDialogRef<FoundPetModalComponent>,
    private formBuilder: FormBuilder,
    private service: ServiceComponent,
    private mapsAPILoader2: MapsAPILoader,
    private ngZone2: NgZone,
    private cookieService: CookieService,
    private dialog: MatDialog,
    
    @Inject(MAT_DIALOG_DATA) 
    private petEdition: any, 
    ){ 

    this.formPetFound = this.formBuilder.group({
      name: ['Nome desconhecido', Validators.required],
      phone: ['', 
        [Validators.required,
        Validators.minLength(10),
        Validators.pattern('[0-9]+')]],
      description: [''],
      photoSrc: ['',Validators.required]   
    }); 
  }
  
  ngOnInit() {
    let center = { 
      lat: this.lat, 
      lng: this.lng 
    };

    var streetviewMap = (<HTMLInputElement>document.getElementById('streetviewMap'));
    let map = new window['google'].maps.Map( 
      streetviewMap,  
      { 
        center: center,  
        zoom: this.zoom,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
      });

    var image = {
      url: '../assets/icons/dog_found.png',
      scaledSize: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0)
    };

    var marker = new google.maps.Marker({
      map: map,
      draggable: true,
      position: {lat: -30.055819, lng: -51.223238}, //Local Default
      icon: image,
      title:"Arrasta-me!"
    }); 

    var infowindow = new google.maps.InfoWindow({
        content: "Arrasta-me para o local"
    });

    marker.addListener('click', function() {
      infowindow.open(map, marker);
    });

    this.markerPet = marker; 
    marker.addListener('dragend',handleEvent);

    function handleEvent(event) {
      //console.log(marker.getPosition().lat());
      //console.log(marker.getPosition().lng());
    }

    this.setDateOfDayInPick();
    
    //Set user logged(if exist)
    if(this.cookieService.get('logged') != undefined
       && this.cookieService.get('logged') != null){
      this.form.phone.setValue(this.cookieService.get('userPhone'));
      this.phoneWithWhats = !!this.cookieService.get('UserPhoneWithWhats'); 
    }
    
    //If is pet edition set fields
    console.log(this.petEdition);
    if(this.petEdition !=null){
      this.edition = true;
      this.form.name.setValue(this.petEdition.petName);
      this.form.description.setValue(this.petEdition.petDescription);
      this.form.phone.setValue(this.petEdition.petPhone);
      this.form.photoSrc.setValue("imagemPet.jpg");
      this.phoneWithWhats = this.petEdition.petPhoneWithWhats;
    }
  }

  setDateOfDayInPick(){
    this.date = new FormControl(new Date());
    var serializedDate = new FormControl((new Date()).toISOString());
  }

  get form() {
    return this.formPetFound.controls;
  }

  getErrorMessage() {
    if(this.form.phone.hasError('required')){
       return 'Preencha com seu telefone';
    }else if(this.form.phone.hasError('pattern')){
       return 'Campo aceita somente números';
    }else if(this.form.phone.hasError('minlength')){
       return 'Telefone possui digitos faltando';
    }else if(this.form.name.hasError('required')){
       return 'Preencha com o nome do pet';
    }else if(this.form.photoSrc.hasError('required')){
       return 'Insira uma foto do pet';
    }
  } 

  isPhoneWithWhats() { 
   if(this.phoneWithWhats){  
      this.phoneWithWhats = false; 
   }else{
     this.phoneWithWhats = true; 
   }    
  }

  onFileSelected(event){
    const target= event.target as HTMLInputElement;
    var file: File = (target.files as FileList)[0];    
    this.form.photoSrc.setValue(file.name);
   
    var myReader:FileReader = new FileReader();
    myReader.onloadend = (e) => {
      this.photoData = myReader.result; 
    }
    myReader.readAsDataURL(file); 
  }
  
  
  addPet(){
    if(this.formPetFound.valid){

      var description = this.form.description.value;
      if(description == ''){
        description = "Sem informações adicionais"
      }
      if(this.photoData !=null){
        this.photoWithoutHeader64 = this.photoData.split(',')[1]; 
      }

      let pet = {
         "name": this.form.name.value, 
         "specie": this.selectedSpecie,
         "sex": this.selectedSex,
         "furColor": this.selectedFurColor,
         "lifeStage": this.selectedLifeStage,
         "photo" : this.photoWithoutHeader64, 
         "date" : this.date.value,
         "latitude" : this.markerPet.getPosition().lat(),
         "longitude" : this.markerPet.getPosition().lng(),
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.phoneWithWhats,
         "description" : description,
         "lostPet" : "false",
         "userId": this.cookieService.get('userLoggedId')
      }

      if(this.cookieService.get('userLoggedId') == undefined 
         || this.cookieService.get('userLoggedId') == null ){
        
        this.dialogRef.close();
        swal.fire({
          type: 'warning',
          title: 'Faça login para cadastrar o pet',
          width: 350
        }).then((result) => { 

          this.openDialogLogin(pet);
        })
      }else{

        this.service.addPet(pet).subscribe(
          (data:any)=> { 
              //this.cookieService.put('petId',data.id);  ??
              this.dialogRef.close();

              swal.fire({
                title: 'Bom trabalho!',
                text: 'Pet cadastrado com sucesso',
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
  }

  editPet(){
    if(this.formPetFound.valid){

      if(this.photoData !=null){
        this.photoWithoutHeader64 = this.photoData.split(',')[1]; 
      }
      var description = this.form.description.value;
      if(description == ''){
        description = "Sem informações adicionais"
      }

      let pet = {
         "id": this.petEdition.petId,
         "name": this.form.name.value, 
         "photo" : this.photoWithoutHeader64, 
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.phoneWithWhats,
         "description" : description
      }
      //console.log(pet);

      this.service.editPet(pet).subscribe(
          (data:any)=> {
              this.dialogRef.close();
               swal.fire({
                title: 'Bom trabalho!',
                text: 'Pet editado com sucesso',
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

  openDialogLogin(pet:any) { 
    console.log(pet);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '350px'; 
    dialogConfig.data = pet; 

    this.dialog.open(LoginModalComponent, dialogConfig);
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
