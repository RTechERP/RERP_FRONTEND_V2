import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentOrder } from './model/payment-order';

@Injectable({
    providedIn: 'root'
})
export class PaymentOrderService {

    private url = environment.host + 'api/paymentorder';
    constructor(private http: HttpClient) { }

    get(data: any): Observable<any> {
        return this.http.post<any>(this.url, { params: data });
    }

    save(payment: PaymentOrder): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, payment);
    }

    uploadFiles(file: any): Observable<any> {
        return this.http.post<any>(`${this.url}/upload-file`, file);
    }
}
