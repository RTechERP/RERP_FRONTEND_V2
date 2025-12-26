import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { WorkPlan } from './WorkPlan';

@Injectable({
    providedIn: 'root'
})
export class WorkplanService {
    private url = environment.host + "api/workplan";
    private urlDetail = environment.host + "api/workplan";
    constructor(private http: HttpClient) { }

    // Lấy danh sách kế hoạch tuần cá nhân
    getWorkPlans(data: any): Observable<any> {
        return this.http.post<any>(this.url, data);
    }

    // Lưu kế hoạch tuần
    saveWorkPlan(workPlan: WorkPlan): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, workPlan);
    }

    // Xóa kế hoạch tuần
    deleteWorkPlan(id: number): Observable<any> {
        return this.http.post<any>(`${this.url}/${id}`, {});
    }

    // Lấy kế hoạch theo ID
    getWorkPlanById(id: number): Observable<any> {
        return this.http.get<any>(`${this.url}/${id}`);
    }

    // Lấy danh sách dự án
    getProjects(): Observable<any> {
        return this.http.get<any>(`${environment.host}api/project/get-all`);
    }

    // ============ CHỨC NĂNG 2: KẾ HOẠCH TỔNG HỢP ============
    // Lấy kế hoạch tổng hợp (tất cả nhân viên)
    getWorkPlanSummary(params: {
        dateStart: Date;
        dateEnd: Date;
        keyword?: string;
        departmentId?: number;
        teamId?: number;
        type?: number;
        userId?: number;
    }): Observable<any> {
        return this.http.post<any>(`${this.urlDetail}/summary`, params);
    }

    // ============ CHỨC NĂNG 3: KẾ HOẠCH HẠNG MỤC CÁ NHÂN ============
    // Lấy kế hoạch hạng mục tổng hợp theo cá nhân
    getSummarizeWork(params: {
        dateStart: string;
        dateEnd: string;
        departmentID?: number;
        teamID?: number;
        userID?: number;
        keyWord?: string;
    }): Observable<any> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);
        
        if (params.departmentID) httpParams = httpParams.set('departmentID', params.departmentID.toString());
        if (params.teamID) httpParams = httpParams.set('teamID', params.teamID.toString());
        if (params.userID) httpParams = httpParams.set('userID', params.userID.toString());
        if (params.keyWord) httpParams = httpParams.set('keyWord', params.keyWord);

        return this.http.get<any>(`${this.urlDetail}/summarize-work`, { params: httpParams });
    }

    // Lấy danh sách phòng ban
    getDepartments(): Observable<any> {
        return this.http.get<any>(`${environment.host}api/department/get-all`);
    }

    // Lấy danh sách team theo phòng ban
    getTeamsByDepartment(departmentId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/team/by-department/${departmentId}`);
    }

    // Lấy danh sách nhân viên theo team
    getUsersByTeam(teamId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/employee/by-team/${teamId}`);
    }

    // Lấy tất cả nhân viên
    getAllEmployees(): Observable<any> {
        return this.http.get<any>(`${environment.host}api/employee/get-all`);
    }
}
