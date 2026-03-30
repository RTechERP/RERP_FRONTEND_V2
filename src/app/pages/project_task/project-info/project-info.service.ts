import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface IEmployee {
    ID: number;
    FullName: string;
    Email: string;
    Avatar?: string;
}

export interface IProject {
    ID?: number;
    ProjectName: string;
    Description?: string;
    Icon: string;
    Color: string;
    StartDate?: Date;
    EndDate?: Date;
    Priority: 'high' | 'medium' | 'low';
    Members: IEmployee[];
}

@Injectable({
    providedIn: 'root'
})
export class ProjectInfoService {
    private apiUrl = `${environment.host}api/projectinfo`;
    private _url = environment.host + 'api/';
    // Mock data for employees
    private mockEmployees: IEmployee[] = [
        { ID: 1, FullName: 'Mai Thị Tú Oanh Oanh', Email: 'maioanh.vh92@gmail.com' },
        { ID: 2, FullName: 'Nguyễn Văn An', Email: 'nguyenvanan@gmail.com' },
        { ID: 3, FullName: 'Trần Thị Bình', Email: 'tranthivinh@gmail.com' },
        { ID: 4, FullName: 'Phạm Văn Cường', Email: 'phamvancuong@gmail.com' },
        { ID: 5, FullName: 'Lê Thị Dung', Email: 'lethidung@gmail.com' }
    ];

    constructor(private http: HttpClient) { }

    getProjectInfo(projectId: number): Observable<IAPIResponse<any>> {
        return this.http.get<IAPIResponse<any>>(`${this.apiUrl}/GetProjectInfo/${projectId}`);
    }

    // Get employees list - will connect to real API later
    getEmployees(): Observable<any> {
        return this.http.get<any>(
            `${this._url}employee/employees`
        );
    }

    // Create new project - will connect to real API later
    createProject(project: IProject): Observable<IAPIResponse<IProject>> {
        // TODO: Replace with real API call
        // return this.http.post<IAPIResponse<IProject>>(`${this.apiUrl}/CreateProject`, project);

        // Mock implementation
        console.log('Creating project:', project);
        return of({
            status: 1,
            message: 'Project created successfully',
            data: { ...project, ID: Date.now() },
            error: ''
        });
    }
}