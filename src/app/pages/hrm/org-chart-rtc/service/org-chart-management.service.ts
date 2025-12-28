import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OrgChartManagementService {
    private url = environment.host + 'api/OrganizationalChart';

    constructor(private http: HttpClient) { }

    // Lấy danh sách sơ đồ tổ chức (master)
    getOrganizationChart(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-organization-chart`);
    }

    // Lấy chi tiết nhân viên theo ID (detail)
    getOrganizationChartDetail(id: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-organization-chart-detail?id=${id}`);
    }

    // Lưu dữ liệu (thêm/sửa/xóa)
    saveData(dto: any): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, dto);
    }

    // Lấy danh sách công ty
    getTaxCompanies(): Observable<any> {
        return this.http.get<any>(`${environment.host}api/TaxCompany/tax-company`);
    }

    // Lấy danh sách phòng ban
    getDepartments(): Observable<any> {
        return this.http.get<any>(`${environment.host}api/department/get-all`);
    }

    // Lấy danh sách nhân viên
    getEmployees(departmentId: number = 0): Observable<any> {
        return this.http.get<any>(`${environment.host}api/employee/get-all?departmentId=${departmentId}`);
    }
}
