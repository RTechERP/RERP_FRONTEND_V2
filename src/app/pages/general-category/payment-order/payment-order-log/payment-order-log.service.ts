import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PaymentOrderLogService {

    private url = environment.host + 'api/PaymentOrderLog';

    constructor(private http: HttpClient) { }

    getPaymentOrder(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-payment-order`);
    }

    getData(paymentOrderId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-data`, {
            params: { paymentOrderId: paymentOrderId.toString() }
        });
    }
}
