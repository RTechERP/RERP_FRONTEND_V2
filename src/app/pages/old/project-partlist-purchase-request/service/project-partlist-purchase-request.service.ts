import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HOST } from '../../../../app.config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPurchaseRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${HOST}/api/ProjectPartlistPurchaseRequest`;
  constructor() {}
  getAPIUrl() {
    return this.baseUrl + '/getall';
  }
}
