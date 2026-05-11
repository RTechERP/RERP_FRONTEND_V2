import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogCrmService {

  constructor(private http: HttpClient) { }
  private url = environment.host + 'api/POKH';
  private urlRequestInvoice = environment.host + 'api/RequestInvoice';

  GetLogActivity(pokhId: number): Observable<any> {
    return this.http.get<any>(this.url + `/log-activity?pokhId=${pokhId}`);
  }

  GetLogActivityRequestInvoice(requestInvoiceId: number): Observable<any> {
    return this.http.get<any>(this.urlRequestInvoice + `/log-activity-request-invoice?requestInvoiceId=${requestInvoiceId}`);
  }

}
