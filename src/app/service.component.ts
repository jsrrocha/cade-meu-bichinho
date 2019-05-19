import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class ServiceComponent {

  backendUrl = "http://localhost:8086/cademeubichinho/";
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



  addPet(data: object){
      const url = this.backendUrl + "pet/add";
      return this.http.post(url,data);
  }

  addUserOfPet(petId:number,userId:number){
      console.log(userId);
      const url = this.backendUrl + "pet/" + petId + "/add/user/" + userId;
      return this.http.post(url,null);
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

  removePet(id:number,reason:number){
      const url = this.backendUrl + "remove/" + id + "/reason/" + reason;
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

  
  
}