import { Injectable } from '@angular/core';
import {HttpRequest,HttpHandler,HttpEvent,HttpInterceptor} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { CookieService } from 'ngx-cookie';

import { LoginModalComponent } from './modal/login/loginModal.component';
import { ServiceComponent } from './service.component';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    public service: ServiceComponent,
    public login: LoginModalComponent,
    public cookieService: CookieService){}

  expiresIn; 
  expireTime;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    if(this.cookieService.get('expiresIn') != undefined
       && this.cookieService.get('expiresIn') != null
       && this.cookieService.get('expireTime') != undefined 
       && this.cookieService.get('expireTime') !=null){

      this.expiresIn = parseInt(this.cookieService.get('expiresIn'));
      this.expireTime = parseInt(this.cookieService.get('expireTime'));
      
      if(new Date().getTime() >= this.expireTime){ 
             
        this.expireTime = new Date().getTime() + this.expiresIn * 1000;
        this.cookieService.put('expireTime',
        this.expireTime.toString());

        this.login.refreshAccessAuth();
      }
    } 

    var authToken = "";
    if(this.cookieService.get('token') != undefined
        && this.cookieService.get('token') != null){
      authToken = this.cookieService.get('token');
    }
    request = request.clone({
      setHeaders: {
        Authorization: authToken 
      }
    });
    return next.handle(request);
  }
}
