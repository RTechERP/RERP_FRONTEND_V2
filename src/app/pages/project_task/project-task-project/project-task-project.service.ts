import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProjectTaskTreeData {
    ID: number;
    ProjectID: number;
    ProjectTaskGroupID: number | null;
    Title: string;
    Description: string | null;
    EmployeeID: number;
    StartDate: string | null;
    DueDate: string | null;
    PlanStartDate: string | null;
    PlanEndDate: string | null;
    Priority: number | null;
    OrderIndex: number | null;
    ParentID: number | null;
    ProgressPercent: number | null;
    ReviewStatus: number;
    CreatedDate: string;
    CreatedBy: string;
    UpdatedDate: string;
    UpdatedBy: string;
    IsDeleted: boolean;
    Status: number;
    Code: string;
    EmployeeCreateID: number;
    IsPersonalProject: boolean | null;
    ProjectTaskTypeID: number | null;
    IsAdditional: boolean | null;
    TaskComplexity: number | null;
    PercentOverTime: number | null;
    ProjectCode: string;
    ProjectName: string;
    EmployeeCode: string;
    FullName: string;
    DepartmentID: number;
}

export interface ProjectTaskTreeNode {
    Data: ProjectTaskTreeData;
    Children: ProjectTaskTreeNode[];
    Leaf: boolean;
    Expanded: boolean;
}

export interface ProjectTaskTreeParams {
    dateStart: string;
    dateEnd: string;
    projectID?: number;
    keyword?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskProjectService {
    private apiUrl = `${environment.host}api/projecttask/get_project_task_tree`;

    constructor(private http: HttpClient) { }

    getProjectTaskTree(params: ProjectTaskTreeParams): Observable<any> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.projectID !== undefined && params.projectID !== null) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.keyword) {
            httpParams = httpParams.set('keyword', params.keyword);
        }

        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }
}
