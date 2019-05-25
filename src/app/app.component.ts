/// <reference types="@types/googlemaps" />

import { Component, ElementRef, NgZone, OnInit, ViewChild,AfterViewInit } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import {ScrollDispatchModule} from '@angular/cdk/scrolling';
import {DomSanitizer} from '@angular/platform-browser';;
import {DateAdapter, MAT_DATE_FORMATS,MAT_DATE_LOCALE} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {FormBuilder,FormControl, FormGroup,Validators} from '@angular/forms';
import { CookieService } from 'ngx-cookie';
import { AgmOverlays } from "agm-overlays";
import * as moment from 'moment';
import swal from 'sweetalert2'; 

//material
import { MatDialog, MatDialogConfig,MatRadioModule,MatNativeDateModule,MatDividerModule,
MatListModule,MatPaginatorModule,MatCheckboxModule } from '@angular/material';

// Components
import { LostPetModalComponent } from './modal/lostPet/lostPetModal.component';
import { FoundPetModalComponent } from './modal/foundPet/foundPetModal.component';
import { LoginModalComponent } from './modal/login/loginModal.component';
import { CommentModalComponent } from './modal/comment/commentModal.component';
import { ServiceComponent } from './service.component';
import { RemovePetModalComponent } from './modal/removePet/removePetModal.component'; 

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
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class AppComponent implements OnInit {
  title = 'tcc';

  //Map
  lat: number = -30.0513678; // default Porto Alegre
  lng: number = -51.2160819; // default Porto Alegre
  zoom: number = 13;
  searchControl: FormControl;
  loading: boolean = true;
  streetViewControlOptions: object = {};
  zoomControlOptions: object = {};
  @ViewChild('search')
  public searchElementRef: ElementRef;
  
  //Forms
  formLocal: FormGroup;
  formFilter: FormGroup;

  //Flags nIf
  showFilters = true;
  showSelectedResult = false; 
  searching = false;
  existPets = false; 
  showNotifications = false;
  petBelongsToUser = false;
  
  //Others
  latitude = null;
  longitude = null;
  datePicker;
  serializedDate;
  path = "";
  dateFinal;
  phoneWithWhats= false; //ta sendo usado?
  userSendId = null;
  notifications: Object = [];
  dateFilter = null;
  userLoggedId = null;
  classLostPet = false;
  pets: Object = [];
  petUserId;
  petTotal = 0;
  isNormalUser = true;

  //For edit pet
  petId;
  petName;
  petDescription;
  petPhone;
  petPhoneWithWhats;


  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private service: ServiceComponent,
    private formBuilder: FormBuilder,
    private formBuilder2: FormBuilder,
    public cookieService: CookieService
    ){
  
    this.formLocal = this.formBuilder.group({
      searchValue: [''],
    });

    this.formFilter = this.formBuilder2.group({
      type: [null, Validators.required],
      myPosts: [null, Validators.required],
              
      specie: [null, Validators.required],
      lifeStage: [null,Validators.required],
      sex: [null,Validators.required],
      furColor: [null,Validators.required],
      description: [null],
      checkedAllDates: [true, Validators.required], 
    }); 

  }

  ngOnInit() {
    let self = this;

    // get user geolocation
    navigator.geolocation.getCurrentPosition((position) => {
      self.lat = position.coords.latitude;
      self.lng = position.coords.longitude;
      self.loading = false;
    }, () => {}, { enableHighAccuracy: true });


    // MAPS API loader
    this.mapsAPILoader.load().then(() => {
      let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        types: ['address']
      });

      // Set input autocomplete
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.lat = place.geometry.location.lat();
          this.lng = place.geometry.location.lng();
          this.zoom = 16;
          
          //set to search! if is NULL find ALL places.
          this.latitude = this.lat;
          this.longitude = this.lng; 

	        // show filters
          document.querySelector('.filter-container').classList.add("active");
          
          //Atualize list of pets!
          this.getPetSearch();
          
        });
      });

      // Set map options
      self.streetViewControlOptions = {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
      self.zoomControlOptions = {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
    });

    this.setDateOfDayInPicker();
    this.getPetCounting();  

    //inicialize cookies 
    //(Problema: quando o user atualizar a página se desloga..)
    //this.cookieService.put('token',"");
    //this.cookieService.put('refreshToken',"");
    //this.cookieService.put('expiresIn',"");

    //this.cookieService.put('logged',"false");
    //this.cookieService.put('userLoggedId',"");
    //this.cookieService.put('userName',"");
    //this.cookieService.put('userPhone',"");
    //this.cookieService.put('UserPhoneWithWhats',"");
    this.cookieService.put('petId',"");

  }


  setDateOfDayInPicker(){
    this.datePicker = new FormControl(new Date());
  }

  getPetCounting(){
      this.service.getPetCounting().subscribe(
      (data:any)=> {
          //console.log(data); 
          this.petTotal = data;
      },
      error => {
          console.log(error); 
      });
  }

  get formFilterPet() {
    return this.formFilter.controls;
  }

  clearLocal() { 
    this.formLocal.controls.searchValue.setValue('');
    this.latitude = null;
    this.longitude = null; 
    
    //Atualize list of pets!
    this.getPetSearch();
  }

  showHiddenFilters(){
    if(document.querySelector('.filter-container').
      classList.contains("active")) {
        document.querySelector('.filter-container').classList.remove("active");
    }else{
      document.querySelector('.filter-container').classList.add("active");
    }
  } 

  inSelectedResult(e,v) {
    this.showFilters=false; 
    this.showSelectedResult = true; 

    setTimeout(()=>{  
      this.fillResult(v); 
    }, 60); 
  }

  fillResult(v){
   
   this.petId = v[0].value.id;
   this.petName = v[0].value.name;
   this.petDescription = v[0].value.description;
   this.petPhone = v[0].value.phone;
   this.petPhoneWithWhats = v[0].value.phonewithWhats;
   this.petUserId = v[0].value.userId;

   if(this.petUserId == this.cookieService.get('userLoggedId')){
      this.petBelongsToUser = true;
   }else{
      this.petBelongsToUser = false;
   }

   //Name
   (<HTMLInputElement>document.getElementById('resultName')).textContent = 
   this.petName;
 
   //Specie
   (<HTMLInputElement>document.getElementById('resultSpecie')).textContent = 
   v[0].value.specie;
   
   //Sex
   (<HTMLInputElement>document.getElementById('resultSex')).textContent = 
   v[0].value.sex;
   
   //Type and Date
   this.dateFinal = moment(v[0].value.date).format('DD/MM/YYYY');
   if(v[0].value.lostPet == "true"){
     (<HTMLInputElement>document.getElementById('resultDate')).textContent = 
     "Perdido dia " + this.dateFinal;
     
     this.classLostPet = true; 
   }else{
     (<HTMLInputElement>document.getElementById('resultDate')).textContent = 
     "Encontrado dia " + this.dateFinal;
   }

   //Description
   (<HTMLInputElement>document.getElementById('resultDescription')).textContent = 
   this.petDescription;

   //Photo
   this.path = "data:image/png;base64," + v[0].value.photo;
   (<HTMLInputElement>document.getElementById('resultPhoto')).src = this.path;
   
   //Username
   var userName = (<HTMLInputElement>document.getElementById('resultUserName')).textContent = 
   v[0].value.userName + ".";

   //Phone
   var userPhone = (<HTMLInputElement>document.getElementById('resultPhone')).textContent = 
   this.petPhone;

   //Phone With Whats
   if(v[0].value.phonewithWhats = "true"){
      var withWhats = (<HTMLInputElement>document.getElementById('resultWithWhats')).textContent;
      withWhats = " Ou mande Whatsapp " + this.petPhoneWithWhats;
   }
  }

  hiddenSelectedResult(){
    this.showSelectedResult = false; 
    this.showFilters= true; 
  }
  
  logoutUser(){
      this.service.logoutUser().subscribe(
      (data:any)=> {
          this.cookieService.put('token',null);
          this.cookieService.put('refreshToken',null);
          this.cookieService.put('expiresIn',null);

          this.cookieService.put('userLoggedId',null);
          this.cookieService.put('userName',null);
          this.cookieService.put('userPhone',null);
          this.cookieService.put('UserPhoneWithWhats',null);
          this.cookieService.put('logged',"false"); 
      },
      error => {
          console.log(error);
      });  
  }

  getPetSearch(){
      this.searching = true;

      if(!this.formFilterPet.checkedAllDates.value){
         this.serializedDate = new FormControl((this.datePicker.value).toISOString());
         //console.log(this.serializedDate);
         
         this.dateFilter = this.serializedDate.value;
      }else{
         this.dateFilter = null;
      }
      
      if(this.formFilterPet.myPosts.value !=null
         && this.cookieService.get('userLoggedId') != null){
        this.userLoggedId = this.cookieService.get('userLoggedId');
      } 
      
      //COLOCAR LATITUDE/LONG
      let pet = {
         "specie": this.formFilterPet.specie.value,
         "sex": this.formFilterPet.sex.value,
         "furColor": this.formFilterPet.furColor.value,
         "lifeStage": this.formFilterPet.lifeStage.value,
         "description" : this.formFilterPet.description.value,
         "lostPet" : this.formFilterPet.type.value,
         "date" : this.dateFilter,
         "latitude": this.latitude,
         "longitude": this.longitude,
         "userId": this.userLoggedId
      }
      console.log(pet); 

      this.service.petSearch(pet).subscribe(
      (data:any)=> {
          //console.log(data); 
          this.pets = data;
          this.existPets = true; 
      },
      error => {
          this.service.handleErrors(error);
          console.log(error);
      });        
  }

  getNotifications(){
    if(this.cookieService.get('userLoggedId') != null){
      
      this.service.getCommentsWithNotificationsActiveByUserReceived(    +this.cookieService.get('userLoggedId'))
        .subscribe( 
          (data:any)=> {
              //console.log(data); 
              this.notifications = data;
          },
          error => {
              console.log(error);
      });
    }
  }

  openNotifications() { 
    if(this.showNotifications){  
      this.showNotifications = false; 
    }else{
     this.showNotifications = true; 
    }

    this.getNotifications();
  }

  deleteNotification(id){
    console.log(id);
    swal.fire({
      title: 'Você realmente deseja remover a notificação?',
      type: 'warning',
      width: 350,
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
      }).then((result) => { 
      
      if (result.value) {
        this.service.removeNotification(id)
            .subscribe(
              (data:any)=> {
                  swal.fire({
                    title: 'Bom trabalho!',
                    text: 'Notificação removida com sucesso',
                    type: 'success',
                    width: 350
                  })
              },
              error => {
                  this.service.handleErrors(error);
                  console.log(error);
        });
      } 
    })
  }

  /* Modal */
  openDialogLostPet() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '520px';
    dialogConfig.height = '585px'; 

    this.dialog.open(LostPetModalComponent, dialogConfig);
  }

  openDialogFoundPet() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '520px';
    dialogConfig.height = '585px'
    this.dialog.open(FoundPetModalComponent, dialogConfig);
  }

  openDialogPetEdition() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '520px';
    dialogConfig.height = '585px';

    let petEdition = {
         "petId": this.petId,
         "petName": this.petName,
         "petDescription": this.petDescription,
         "petPhone": this.petPhone,
         "petPhoneWithWhats": this.petPhoneWithWhats
    }
    dialogConfig.data = petEdition;

    this.dialog.open(FoundPetModalComponent, dialogConfig);
  }

  openDialogLogin() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '230px';
    dialogConfig.height = '330px';  
    this.dialog.open(LoginModalComponent, dialogConfig);
  }

  openDialogComment() { 
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '380px';
    dialogConfig.height = '400px'; 

    let petSelected = {
         "petId": this.petId,
         "petUserId": this.petUserId
    }
    dialogConfig.data = petSelected;

    this.dialog.open(CommentModalComponent, dialogConfig);
  }

  openDialogRemovePet() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '250px';
    dialogConfig.height = '200px';  
    this.dialog.open(RemovePetModalComponent, dialogConfig);
  }
}
