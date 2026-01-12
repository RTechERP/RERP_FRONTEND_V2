import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class KpiErrorFineAmountService {

    private _url = environment.host + 'api/KPIErrorFineAmount/';

    constructor(private http: HttpClient) { }

    // Lấy danh sách KPI Error cho dropdown
    getKPIError(departmentId: number = 0, keyword: string = ''): Observable<any> {
        const params = new HttpParams()
            .set('departmentId', departmentId.toString())
            .set('keyword', keyword);
        return this.http.get(this._url + 'get-kpierror', { params });
    }

    // Lấy danh sách Fine Amount theo KPI Error ID
    getKPIErrorFineAmount(kpiErrorId: number): Observable<any> {
        const params = new HttpParams().set('kpiErrorId', kpiErrorId.toString());
        return this.http.get(this._url + 'get-kpi-error-fine-amount', { params });
    }

    // Lưu danh sách Fine Amount
    saveKPIErrorFineAmount(models: any[]): Observable<any> {
        return this.http.post(this._url + 'save-kpi-error-fine-amount', models);
    }
}
