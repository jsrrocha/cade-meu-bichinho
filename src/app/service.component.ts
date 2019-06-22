import { Injectable } from '@angular/core';
import {HttpClient, HttpParams,
        HttpHeaders} from '@angular/common/http';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})

export class ServiceComponent {

  //backendUrl = "http://localhost:8086/";
  backendUrl = "https://cademeubichinho02.herokuapp.com/";

  tokenForClient = "Basic Z2xvYmFsOjEyMzQ1Ng==";

  constructor(private http: HttpClient) {}

  authentication(username:string,password:string){
      const url = this.backendUrl + "oauth/token?grant_type=password&username="+ username +"&password=" + password;
      return this.http.post(url,null);
  }

  refreshToken(refreshtoken: string){
      const url = this.backendUrl + "oauth/token?refresh_token=" + refreshtoken + "&grant_type=refresh_token";
      return this.http.post(url,null);
  }

  addUser(data: object){
      const url = this.backendUrl + "user/add";
      return this.http.post(url,data);
  }

  addNewPassword(data: object){
      const url = this.backendUrl + "user/add/password/new";
      return this.http.post(url,data);
  }

  getUserLoggedIn(){
      const url = this.backendUrl + "user/loggedIn";
      return this.http.get(url);
  }

  logoutUser(){
      const url = this.backendUrl + "user/logout";
      return this.http.post(url,null);
  }


  addPet(data: object){
      const url = this.backendUrl + "pet/add";
      return this.http.post(url,data);
  }

  editPet(data: object){
      const url = this.backendUrl + "pet/edit";
      return this.http.post(url,data);
  }


  petSearch(data: object){
      const url = this.backendUrl + "pet/search";
      return this.http.post(url,data);
  }

  getAllPets(){
      const url = this.backendUrl + "pet/all";
      return this.http.get(url);
  }

  getPetCounting(){
      const url = this.backendUrl + "pet/count";
      return this.http.get(url);
  }

  removePet(id:number,reason:number){
      const url = this.backendUrl + "pet/remove/" + id + "/reason/" + reason;
      return this.http.post(url,null);
  }

  addComment(data: object){
      const url = this.backendUrl + "comment/add";
      return this.http.post(url,data);
  }

  getCommentsWithNotificationsActiveByUserReceived(userId:number){
      const url = this.backendUrl + "comment/notification/user/" + userId + "/active/asc";
      return this.http.get(url);
  }

  removeNotification(id:number){
      const url = this.backendUrl + "comment/notification/desactive/" + id ;
      return this.http.post(url,null);
  }

  addPerformance(data: object){
      const url = this.backendUrl + "performance/add";
      return this.http.post(url,data);
  }

  handleErrors(error: any){
    if(error.error.errorMessage != undefined){
      swal.fire({
        type: 'error',
        title: error.error.errorMessage,
        width: 350
      })
    }else if(error.error.error_description == "Bad credentials"){
      swal.fire({
        type: 'error',
        title: 'Usuário ou senha inválidos',
        width: 350
      })
    }else if(error.status == 0){

      swal.fire({
        type: 'error',
        title: 'Oops...Sistema está fora do ar',
        text: 'Mande email para: cademeubichinho02@outlook.com',
        width: 400
      })
    }else if(error.error.error_description == "Invalid refresh token: "){
      //Ignora!
    }else if(error.error.error != undefined){
      swal.fire({
        type: 'error',
        title: 'Não existe esse serviço',
        width: 350
      })

    }else if(error.error != undefined){

      swal.fire({
        type: 'error',
        title: error.error,
        width: 350
      })
    }else{
      swal.fire({
        type: 'error',
        title: 'Oops... Algo deu errado',
        text: 'Tente novamente ou mande email para: cademeubichinho02@outlook.com',
        width: 400
      })
    }
  }

  savePerformanceTime(secondsDiff,type,userId){
    var secondsFinal = this.adjustDecimal('round', secondsDiff, -1);
    
    //console.log(secondsDiff);
    //console.log(secondsFinal);

    let performance = {
       "time" : +secondsFinal,
       "type" : type,
       "userId": userId
    }

    this.addPerformance(performance).subscribe(
      (data:any)=> {},
      error => {
        console.log(error);
    });
  }

  adjustDecimal(type, value, exp) {
    value = +value;
    exp = +exp;

    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? 
                  (+value[1] - exp) : -exp)));
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }
}
