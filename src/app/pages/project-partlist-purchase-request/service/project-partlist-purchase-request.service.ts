import { Injectable,inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../../../app.config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class ProjectPartlistPurchaseRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/api/ProjectPartlistPurchaseRequest`;
constructor() { }
  getAPIUrl(){
    return this.baseUrl+"/getall";
  }
}
