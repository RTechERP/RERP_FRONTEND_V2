import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class RequestInvoiceSlickgridService {
    private _url = environment.host + 'api/RequestInvoice/';
    private _urlSummary = environment.host + 'api/RequestInvoiceSummary/';
    constructor(private http: HttpClient) { }

    getRequestInvoice(
        dateStart: Date,
        dateEnd: Date,
        filterText: string,
        warehouseId: number
    ): Observable<any> {
        return this.http.get<any>(this._url, {
            params: {
                dateStart: dateStart.toISOString(),
                dateEnd: dateEnd.toISOString(),
                keyWords: filterText,
                warehouseId: warehouseId.toString(),
            },
        });
    }

    getDetail(id: number): Observable<any> {
        return this.http.get<any>(this._url + 'get-details', {
            params: {
                id: id.toString(),
            },
        });
    }

    getRequestInvoiceById(id: number): Observable<any> {
        return this.http.get<any>(this._url + 'get-request-invoice-by-id', {
            params: {
                id: id.toString(),
            },
        });
    }

    getPOKHFile(pokhId: number): Observable<any> {
        return this.http.get<any>(this._url + 'get-pokh-file', {
            params: {
                pokhId: pokhId.toString(),
            },
        });
    }

    downloadFile(filePath: string): Observable<Blob> {
        const params = new HttpParams().set('path', filePath);
        return this.http.get(`${environment.host}api/home/download`, {
            params,
            responseType: 'blob',
        });
    }

    getRequestInvoiceSummary(dateStart: Date, dateEnd: Date, customerId: number, userId: number, status: number, keywords: string): Observable<any> {
        return this.http.get<any>(this._urlSummary + 'get-request-invoice-summary', {
            params: {
                dateStart: dateStart.toISOString(),
                dateEnd: dateEnd.toISOString(),
                customerId: customerId.toString(),
                userId: userId.toString(),
                status: status.toString(),
                keyWords: keywords,
            },
        });
    }

    getCustomer(): Observable<any> {
        return this.http.get<any>(this._urlSummary + 'get-customer');
    }

    getTreeFolderPath(requestInvoiceID: number): Observable<any> {
        return this.http.get<any>(this._url + 'get-tree-folder-path', {
            params: {
                requestInvoiceID: requestInvoiceID.toString(),
            },
        });
    }

}
