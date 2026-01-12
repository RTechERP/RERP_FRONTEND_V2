import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SettingHrConfigService {
    constructor(private http: HttpClient) { }

    // Lấy danh sách config hệ thống HR
    getConfigSystemHR(): Observable<any> {
        return this.http.get<any>(environment.host + 'api/home/get-config-system-hr');
    }

    // Lưu config hệ thống HR
    saveConfigSystemHR(data: { Id: number; KeyValue: string }): Observable<any> {
        return this.http.post<any>(environment.host + 'api/home/save-config-system-hr', data);
    }
}
