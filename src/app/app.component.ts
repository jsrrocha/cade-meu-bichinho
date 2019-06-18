/// <reference types="@types/googlemaps" />

import { Component, ElementRef, NgZone, OnInit, ViewChild,AfterViewInit ,ChangeDetectorRef} from '@angular/core';
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
import { Router, RouterModule } from '@angular/router';

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
export class AppComponent implements OnInit{
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
  showNotifications = false;
  petBelongsToUser = false;

  //Others
  latitude = null;
  longitude = null;
  appLoading = false;
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
  pets = [];
  petUserId;
  petTotal;
  updateListOfPets = false; 

  //For edit pet
  petId;
  petName;
  petSpecie;
  petSex;
  petFurColor;
  petLifeStage;
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
    public cookieService: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef
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
      checkedAllDates: [true,Validators.required],
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
          this.zoom = 15;

          //set to search! if is NULL find ALL places.
          this.latitude = this.lat;
          this.longitude = this.lng;

	        // show filters
          document.querySelector('.filter-container').classList.add("active");

          //Update list of pets!
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
    //this.getPetCounting();

    this.cookieService.put('petId',"");

    setTimeout(()=>{
      this.logoutUserWithOutConfirmation();
    }, 15 * 60 * 1000);
  }

  setDateOfDayInPicker(){
    this.datePicker = new FormControl(new Date());
  }

  get formFilterPet() {
    return this.formFilter.controls;
  }

  clearLocal() {
    this.formLocal.controls.searchValue.setValue('');
    this.latitude = null;
    this.longitude = null;

    //Update list of pets!
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

  inSelectedResult(e,petSelect) {
    this.showFilters=false;
    this.showSelectedResult = true;
    console.log("ANTES" + petSelect);
        console.log(petSelect);


    let pet = {};
    if(petSelect[0] != undefined){
      pet = {
        "id": petSelect[0].value.id,
        "name": petSelect[0].value.name,
        "description" : petSelect[0].value.description,
        "phone" : petSelect[0].value.phone,
        "phoneWithWhats" : petSelect[0].value.phoneWithWhats,
        "userId": petSelect[0].value.userId,
        "latitude" : petSelect[0].value.latitude,
        "longitude" : petSelect[0].value.longitude,
        "lostPet" : petSelect[0].value.lostPet,
        "date" : petSelect[0].value.date,
        "photo": petSelect[0].value.photo,
        "userName": petSelect[0].value.userName,
        "specie": petSelect[0].value.specie,
        "specieNumber": petSelect[0].value.specieNumber,
        "sex": petSelect[0].value.sex,
        "sexNumber": petSelect[0].value.sexNumber,
        "lifeStageNumber": petSelect[0].value.lifeStageNumber,
        "furColorNumber": petSelect[0].value.furColorNumber
      }
    }else{
      pet = petSelect;
    }

    setTimeout(()=>{
      this.fillResult(pet);
    }, 30);
  }

  fillResult(pet){
   console.log("SELECIONADO ");
   console.log(pet);
   this.petId = pet.id;
   this.petName = pet.name;
   this.petSpecie = pet.specieNumber;
   this.petSex = pet.sexNumber;
   this.petFurColor = pet.furColorNumber; 
   this.petLifeStage = pet.lifeStageNumber; 
   this.petDescription = pet.description;
   this.petPhone = pet.phone;
   this.petPhoneWithWhats = pet.phonewithWhats;
   this.petUserId = pet.userId;
   this.lat = pet.latitude;
   this.lng = pet.longitude;
   this.zoom = 16;

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
   pet.specie;

   //Sex
   (<HTMLInputElement>document.getElementById('resultSex')).textContent =
   pet.sex;

   //Type and Date
   this.dateFinal = moment(pet.date).format('DD/MM/YYYY');
   if(pet.lostPet == "true"){
     (<HTMLInputElement>document.getElementById('resultDate')).textContent =
     "Perdido dia " + this.dateFinal;

     this.classLostPet = true;
   }else{
     (<HTMLInputElement>document.getElementById('resultDate')).textContent =
     "Encontrado dia " + this.dateFinal;
     this.classLostPet = false;
   }

   //Description
   (<HTMLInputElement>document.getElementById('resultDescription')).textContent =
   this.petDescription;

   //Photo
   this.path = "data:image/png;base64," + pet.photo;
   (<HTMLInputElement>document.getElementById('resultPhoto')).src = this.path;

   //Username
   var userName = (<HTMLInputElement>document.getElementById('resultUserName')).textContent =
   pet.userName + ".";

   //Phone
   var userPhone = (<HTMLInputElement>document.getElementById('resultPhone')).textContent =
   this.petPhone;

   //Phone With Whats
   if(pet.phonewithWhats == "true"){
      var withWhats = (<HTMLInputElement>document.getElementById('resultWithWhats')).textContent;
      withWhats = " Ou mande Whatsapp " + this.petPhoneWithWhats;
   }
  }

  hiddenSelectedResult(){
    this.showSelectedResult = false;
    this.showFilters= true;
  }

  logoutUser(){
    swal.fire({
      title: 'Você realmente deseja deslogar?',
      type: 'warning',
      width: 350,
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
      }).then((result) => {

      if (result.value) {
        this.appLoading = true;
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
            this.showNotifications = false;
            this.appLoading = false;
            this.getPetSearch();
        },
        error => {
            this.appLoading = false;
            this.service.handleErrors(error);
            console.log(error);
        });
      }
    })
  }

  logoutUserWithOutConfirmation(){
    console.log("CHAMOU DESLOG")
    if(this.cookieService.get('userLoggedId') != null
       && this.cookieService.get('userLoggedId') != undefined){

          this.service.logoutUser().subscribe(
          (data:any)=> {
              location.reload();
              this.cookieService.put('token',null);
              this.cookieService.put('refreshToken',null);
              this.cookieService.put('expiresIn',null);

              this.cookieService.put('userLoggedId',null);
              this.cookieService.put('userName',null);
              this.cookieService.put('userPhone',null);
              this.cookieService.put('UserPhoneWithWhats',null);
              this.cookieService.put('logged',"false");
              this.showNotifications = false;
              this.getPetSearch();
          },
          error => {
              console.log(error);
          });
    }else{
      setTimeout(()=>{ this.logoutUserWithOutConfirmation(); }, 15 * 60 * 1000);
    }
  }

  getPetSearch(){
    this.appLoading = true;

    if(!this.formFilterPet.checkedAllDates.value){
      this.serializedDate = new FormControl((this.datePicker.value).toISOString());

      this.dateFilter = this.serializedDate.value;
    }else{
      this.dateFilter = null;
    }

    if(this.formFilterPet.myPosts.value !=null
       && this.cookieService.get('userLoggedId') != null
       && this.cookieService.get('userLoggedId') != undefined){
      this.userLoggedId = this.cookieService.get('userLoggedId');
    }

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

    this.service.petSearch(pet).subscribe(
    (data:any)=> {
        console.log(data);
        this.pets = data;
        this.searching = true;
        this.appLoading = false;
    },
    error => {
        this.appLoading = false;
        this.service.handleErrors(error);
        console.log(error);
    });
  }

  getNotifications(){
    if(this.cookieService.get('userLoggedId') != undefined
       && this.cookieService.get('userLoggedId') != null){

      this.service.getCommentsWithNotificationsActiveByUserReceived(    +this.cookieService.get('userLoggedId'))
        .subscribe(
          (data:any)=> {
              //console.log(data);
              if(data.length == 0){
                //this.existNotifications = false;

                this.showNotifications = false;
                swal.fire({
                  title: 'Você não possui notificações',
                  type: 'warning',
                  width: 350
                })
              }else{
                //this.existNotifications = true;

                if(this.showNotifications){
                  this.showNotifications = false;
                }else{
                  this.showNotifications = true;
                }
              }
              this.notifications = data;
          },
          error => {
              console.log(error);
      });
    }
  }

  deleteNotification(id){
    //console.log(id);
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
                  this.getNotifications();
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

    let dialogRef = this.dialog.open(LostPetModalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getPetSearch();
        this.hiddenSelectedResult(); 
      }
    }); 
  }

  openDialogFoundPet() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '520px';
    dialogConfig.height = '585px'
    let dialogRef = this.dialog.open(FoundPetModalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      
      if(result.petTotal != undefined){
        this.petTotal = result.petTotal;
      }
      if(result.update){
         this.getPetSearch();
         this.hiddenSelectedResult();  
      }
    }); 
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
         "petSpecie": this.petSpecie,
         "petSex": this.petSex,
         "petFurColor": this.petFurColor,
         "petLifeStage": this.petLifeStage,
         "petDescription": this.petDescription,
         "petPhone": this.petPhone,
         "petPhoneWithWhats": this.petPhoneWithWhats
    }
    dialogConfig.data = petEdition;
    
    let dialogRef = this.dialog.open(FoundPetModalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getPetSearch();
        this.hiddenSelectedResult(); 
      }
    });
  }

  openDialogLogin() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '270px';
    dialogConfig.height = '330px';
    console.log("CHAMA AQ");

    this.dialog.open(LoginModalComponent, dialogConfig);

  }

  openDialogComment() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '380px';
    dialogConfig.height = '480px';

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
    dialogConfig.data = this.petId; 

    let dialogRef = this.dialog.open(RemovePetModalComponent, dialogConfig);  

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getPetSearch();
        this.hiddenSelectedResult(); 
      }
    });   
  }

}
