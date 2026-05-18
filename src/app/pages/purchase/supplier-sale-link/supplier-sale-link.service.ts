import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupplierSaleLinkService {
    private url = environment.host + 'api/SupplierSaleLink';

    constructor(private http: HttpClient) { }

    getAll(keyword: string = '', employeePurchaseID: number = 0): Observable<any> {
        return this.http.get<any>(`${this.url}/getall?keyword=${keyword}&employeePurchaseID=${employeePurchaseID}`);
    }

    getWithSelection(employeePurchaseID: number = 0, keyword: string = '', pageNumber: number = 1, pageSize: number = 50): Observable<any> {
        return this.http.get<any>(`${this.url}/get-with-selection?employeePurchaseID=${employeePurchaseID}&keyword=${keyword}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
    }

    save(item: any): Observable<any> {
        return this.http.post<any>(`${this.url}/save`, item);
    }

    delete(id: any): Observable<any> {
        return this.http.post<any>(`${this.url}/delete?id=${id}`, {});
    }

    getEmployees(departmentId: number = 0): Observable<any> {
        const params = { status: 0, departmentid: departmentId, keyword: '' };
        return this.http.get<any>(`${environment.host}api/employee/`, { params: params as any });
    }

    importExcelWithPayload(payload: any): Observable<any> {
        return this.http.post<any>(`${this.url}/import-excel`, payload);
    }

    downloadTemplate(fileName: string): Observable<Blob> {
        const url = `${environment.host}api/share/software/Template/ImportExcel/${fileName}`;
        return this.http.get(url, {
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            map((response: HttpResponse<Blob>) => {
                return response.body as Blob;
            })
        );
    }
}
