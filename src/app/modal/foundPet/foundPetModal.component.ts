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

  //Map
  @Input() lat: number = -30.0513678; // default Porto Alegre
  @Input() lng: number = -51.2160819; // default Porto Alegre
  @Input() zoom: number = 13;
  @ViewChild('search')
  public searchElement: ElementRef;
  latPet;
  lngPet;
  markerPet;

  //Others
  formPetFound: FormGroup;
  photoData = null;
  photoWithoutHeader64 = null;
  selectedImg= true;
  userLoggedId = null;
  edition = false;
  petTotal = 0;
  appLoading = false;
  startTime = new Date().getTime(); 
  endTime;

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
      selectedSpecie: [null,Validators.required],
      selectedSex: [null,Validators.required],
      selectedFurColor: [null,Validators.required],
      selectedLifeStage: [null,Validators.required],
      phone: ['',
        [Validators.required,
        Validators.minLength(10),
        Validators.pattern('[0-9]+')]],
      phoneWithWhats: [false],
      description: [''],
      photoSrc: ['',Validators.required],
      date: [new Date(),Validators.required]
    });
  }

  ngOnInit() {
    //If is pet edition set fields
    if(this.petEdition !=null){
      this.fillPetEdition();
    }

    //Set user logged(if exist)
    if(this.cookieService.get('logged') != undefined
       && this.cookieService.get('logged') != null){
      this.form.phone.setValue(this.cookieService.get('userPhone'));
      this.form.phoneWithWhats.setValue(!!this.cookieService.get('UserPhoneWithWhats'));
    }
    
    setTimeout(()=>{
      this.configureMap();
    }, 30);
  }

  get form() {
    return this.formPetFound.controls;
  }

  configureMap(){

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
        streetViewControl: false, 
        mapTypeControl: false,
        zoomControl: true, 
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
      }  
    );
    var searchLocal = (<HTMLInputElement>document.getElementById('searchLocal')); 

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchLocal);
    
    //Marker
    var image = {
      url: '../assets/icons/dog_found.png',
      scaledSize: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0)
    };

    var marker = new google.maps.Marker({
      map: map,
      draggable: true,
      position: {lat: this.lat, lng: this.lng}, //Local Default
      icon: image,
      title:"Arrasta-me!"
    }); 

    var infowindow = new google.maps.InfoWindow({
        content: "Arrasta-me para o local"
    });
    this.markerPet = marker; 
    marker.addListener('click', function() {
      infowindow.open(map, marker); 
    });

    //Autocomplete
    this.mapsAPILoader2.load().then(() => { 
      let autocomplete = new google.maps.places.Autocomplete(this.searchElement.nativeElement, { 
        types: ['address'] 
      });

      // Set input autocomplete
      autocomplete.addListener('place_changed', () => {
        this.ngZone2.run(() => { 

          // get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          } 

          // set latitude, longitude and zoom
          map.setCenter(place.geometry.location);
          map.setZoom(14);
          marker.setPosition(place.geometry.location);

        }); 
      });
    });
  }

  fillPetEdition(){
    this.edition = true;
    this.form.name
      .setValue(this.petEdition.petName);
    
    this.form.selectedSpecie
      .setValue(this.petEdition.petSpecie);
    
    this.form.selectedSex
      .setValue(this.petEdition.petSex);
    this.form.selectedLifeStage
      .setValue(this.petEdition.petLifeStage);
    this.form.selectedFurColor
      .setValue(this.petEdition.petFurColor);

    this.form.description
      .setValue(this.petEdition.petDescription);
    this.form.phone
      .setValue(this.petEdition.petPhone);
    this.form.photoSrc
      .setValue("imagemPet.jpg");
    this.form.phoneWithWhats
      .setValue(this.petEdition.petPhoneWithWhats);
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

  getPetCounting(){
      this.service.getPetCounting().subscribe(
      (data:any)=> {
          
          this.petTotal = data;
      },
      error => {
          console.log(error);
      });
  }

  //Errors messages
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

  getPhotoErrorMessage(){
    if(this.form.photoSrc.hasError('required')){
       return 'Insira uma foto do pet';
    }
  }

  getDateErrorMessage(){
    if(this.form.date.hasError('required')){
       return 'Insira a data do encontro';
    }
  }

  getSpecieErrorMessage(){
    if(this.form.selectedSpecie.hasError('required')){
      return 'Selecione a espécie do pet';
    }   
  }

  getSexErrorMessage(){
    if(this.form.selectedSex.hasError('required')){
      return 'Selecione o sexo do pet';
    }   
  }

  getFurColorErrorMessage(){
    if(this.form.selectedFurColor.hasError('required')){
      return 'Selecione a cor do pelo do pet';
    }   
  }

  getLifeStageErrorMessage(){
    if(this.form.selectedLifeStage.hasError('required')){
      return 'Selecione o estágio de vida do pet';
    }   
  }

  addPet(){
    this.getSpecieErrorMessage();
    
    if(this.formPetFound.valid ){        
      var description = this.form.description.value;
      if(description == ''){
        description = "Sem informações adicionais"
      }
      if(this.photoData !=null){
        this.photoWithoutHeader64 = this.photoData.split(',')[1];
      }
      
      //calculate performance time
      this.endTime = new Date().getTime();
      var secondsDiff = +(this.endTime - this.startTime) / 1000;

      let pet = {
         "name": this.form.name.value,
         "specie": this.form.selectedSpecie.value,
         "sex": this.form.selectedSex.value,
         "furColor": this.form.selectedFurColor.value,
         "lifeStage": this.form.selectedLifeStage.value,
         "photo" : this.photoWithoutHeader64,
         "date" : this.form.date.value,
         "latitude" : this.markerPet.getPosition().lat(),
         "longitude" : this.markerPet.getPosition().lng(),
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.form.phoneWithWhats.value,
         "description" : description,
         "lostPet" : "false",
         "userId": this.cookieService.get('userLoggedId'),
         "performanceTime": secondsDiff
      }

      if(this.cookieService.get('userLoggedId') == undefined
         || this.cookieService.get('userLoggedId') == null ){
        
        this.dialogRef.close(false);
        swal.fire({
          type: 'warning',
          title: 'Faça login para cadastrar o pet',
          width: 350
        }).then((result) => {

          this.openDialogLogin(pet);
        })
      }else{
        this.service.savePerformanceTime(
            secondsDiff,
            0,
            this.cookieService.get('userLoggedId'));
        
        this.service.addPet(pet).subscribe(
          (data:any)=> {
              this.getPetCounting();
          
              swal.fire({
                title: 'Bom trabalho!',
                text: 'Pet cadastrado com sucesso',
                type: 'success',
                width: 350
              })

              setTimeout(()=>{
                let result = {
                  "petTotal": this.petTotal,
                  "update": true
                }
                this.dialogRef.close(result);
              }, 30);   
          },
          error => {
              this.appLoading = false;
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
         "specie": this.form.selectedSpecie.value,
         "sex": this.form.selectedSex.value,
         "furColor": this.form.selectedFurColor.value,
         "lifeStage": this.form.selectedLifeStage.value,
         "phone" : this.form.phone.value,
         "phoneWithWhats" :  this.form.phoneWithWhats.value,
         "photo" : this.photoWithoutHeader64,
         "description" : description
      }

      this.service.editPet(pet).subscribe(
          (data:any)=> {
              this.dialogRef.close(true);
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
    
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '350px';
    dialogConfig.data = pet;

    let dialogRef = this.dialog.open(LoginModalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getPetCounting();  
      }
    }); 
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
