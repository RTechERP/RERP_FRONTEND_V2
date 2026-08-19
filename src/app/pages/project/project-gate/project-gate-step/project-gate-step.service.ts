import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IAPIResponse } from '../../../../models/kanban.interface';
import { environment } from '../../../../../environments/environment';
import { TimelineByTeamItem } from '../../../project_task/project-task-time-line-total/project-task-time-line-total.service';
import { TimelineByProjectParams } from '../../../project_task/project-task-time-line-project/project-task-time-line-project.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectGateStepService {
    private url = environment.host + 'api/ProjectGateStep';

    constructor(private http: HttpClient) { }

    getAll(gateId?: number | null, departmentId?: number | null): Observable<any> {
        let url = `${this.url}/get-all?`;
        if (gateId !== null && gateId !== undefined) {
            url += `gateId=${gateId}&`;
        }
        if (departmentId !== null && departmentId !== undefined) {
            url += `departmentId=${departmentId}&`;
        }
        return this.http.get<any>(url);
    }

    getByGate(gateId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-by-gate/${gateId}`);
    }

    getProduce(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-produce`);
    }

    save(items: any[]): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, items);
    }

    delete(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.url}/delete`, ids);
    }

    saveGateStepLink(data: any): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepLink/Save`, data);
    }

    getByProject(projectId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetByProject/${projectId}`);
    }

    getGateDepartmentReport(projectId: number, gateCode?: string): Observable<any> {
        let url = `${environment.host}api/ProjectGateStepLink/GetGateDepartmentReport/${projectId}`;
        if (gateCode) {
            url += `?gateCode=${encodeURIComponent(gateCode)}`;
        }
        return this.http.get<any>(url);
    }

    getDeletedByProject(projectId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetDeletedByProject/${projectId}`);
    }

    saveFile(checkListLinkId: number, fileDto: any): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/SaveFile/${checkListLinkId}`, fileDto);
    }

    uploadMultipleFiles(files: File[], subPath?: string, projectCode?: string): Observable<any> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        formData.append('key', 'Projects');
        if (subPath && subPath.trim()) {
            formData.append('subPath', subPath.trim());
        }
        if (projectCode && projectCode.trim()) {
            formData.append('projectCode', projectCode.trim());
        }
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/upload-multiple`, formData);
    }

    getFiles(checkListLinkId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/GetFiles/${checkListLinkId}`);
    }

    getCheckListsByStep(stepLinkId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/GetCheckLists/${stepLinkId}`);
    }

    getFilesByStep(stepLinkId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/GetFilesByStep/${stepLinkId}`);
    }

    deleteFile(fileId: number): Observable<any> {
        return this.http.delete<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/DeleteFile/${fileId}`);
    }

    updateFileStatus(fileId: number, status: number): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/UpdateFileStatus/${fileId}?status=${status}`, {});
    }

    approve(linkId: number, comment?: string): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepLink/Approve/${linkId}`, comment ? JSON.stringify(comment) : null, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    reject(linkId: number, comment?: string): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepLink/Reject/${linkId}`, comment ? JSON.stringify(comment) : null, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    approveMultiple(linkIds: number[], isApproved: boolean, forceApprove: boolean = false): Observable<any> {
        const body = {
            LinkIDs: linkIds,
            IsApproved: isApproved,
            ForceApprove: forceApprove
        };
        return this.http.post<any>(`${environment.host}api/ProjectGateStepLink/ApproveMultiple`, body);
    }

    downloadFile(filePath: string): Observable<Blob> {
        return this.http.get(`${environment.host}api/home/download`, {
            params: { path: filePath },
            responseType: 'blob'
        });
    }

    // ProjectGateStepCheckList + CheckListDetail API
    private checkListApiUrl = environment.host + 'api/ProjectGateStepCheckList';

    getCheckListByStep(stepId: number): Observable<any> {
        return this.http.get<any>(`${this.checkListApiUrl}/get-by-step/${stepId}`);
    }

    getCheckListsOnly(stepId: number): Observable<any> {
        return this.http.get<any>(`${this.checkListApiUrl}/get-checklist-by-step/${stepId}`);
    }

    getCheckListDetailsOnly(checkListId: number): Observable<any> {
        return this.http.get<any>(`${this.checkListApiUrl}/get-details-by-checklist/${checkListId}`);
    }

    saveCheckListByStep(stepId: number, data: any[]): Observable<any> {
        return this.http.post<any>(`${this.checkListApiUrl}/save-by-step/${stepId}`, data);
    }

    saveCheckLists(stepId: number, data: any[]): Observable<any> {
        return this.http.post<any>(`${this.checkListApiUrl}/save-checklist/${stepId}`, data);
    }

    saveCheckListDetails(checkListId: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.checkListApiUrl}/save-details/${checkListId}`, data);
    }

    // ProjectGateStepForm API
    private stepFormApiUrl = environment.host + 'api/ProjectGateStepForm';

    getFormsByStep(stepId: number): Observable<any> {
        return this.http.get<any>(`${this.stepFormApiUrl}/get-by-step/${stepId}`);
    }

    saveStepForms(stepId: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.stepFormApiUrl}/save-by-step/${stepId}`, data);
    }

    uploadFormFile(file: File, departmentName?: string): Observable<any> {
        const formData = new FormData();
        formData.append('files', file);
        if (departmentName && departmentName.trim()) {
            formData.append('departmentName', departmentName.trim());
        }
        return this.http.post<any>(`${this.stepFormApiUrl}/upload-file`, formData);
    }

    // ProjectGateStepTemplate API
    private templateApiUrl = environment.host + 'api/ProjectGateStepTemplate';

    getAllTemplates(): Observable<any> {
        return this.http.get<any>(`${this.templateApiUrl}/get-all`);
    }

    saveTemplates(items: any[]): Observable<any> {
        return this.http.post<any>(`${this.templateApiUrl}/save-data`, items);
    }

    deleteTemplates(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.templateApiUrl}/delete`, ids);
    }

    completeRules(detailLinkIds: number[], isCompleted: boolean): Observable<any> {
        const body = {
            DetailLinkIDs: detailLinkIds,
            IsCompleted: isCompleted
        };
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/CompleteRules`, body);
    }

    checkRequiredFiles(detailLinkIds: number[]): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/CheckRequiredFiles`, detailLinkIds);
    }

    approveRule(detailLinkId: number, isApprovedTBP: number, approvedTBPBy: number): Observable<any> {
        const body = {
            IsApprovedTBP: isApprovedTBP,
            ApprovedTBPBy: approvedTBPBy
        };
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/ApproveRule/${detailLinkId}`, body);
    }

    getProjectItemParentChild(projectTaskId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetProjectItemParentChild/${projectTaskId}`);
    }

    getWorkersByStepLink(stepLinkId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/get-workers-by-step-link/${stepLinkId}`);
    }
    getTimelineByProject(params: TimelineByProjectParams): Observable<TimelineByTeamItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.projectID !== undefined) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.status !== undefined && params.status !== '') {
            httpParams = httpParams.set('status', params.status);
        }
        if (params.typeSearch !== undefined) {
            httpParams = httpParams.set('typeSearch', params.typeSearch.toString());
        }

        return this.http.get<IAPIResponse<TimelineByTeamItem[]>>(
            `${environment.host}api/ProjectGateStepLink/project-task-timeline-by-team-project-gate`, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
