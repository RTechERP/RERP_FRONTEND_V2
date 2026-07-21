import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

    getDeletedByProject(projectId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetDeletedByProject/${projectId}`);
    }

    saveFile(checkListLinkId: number, fileDto: any): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepCheckListDetailLink/SaveFile/${checkListLinkId}`, fileDto);
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
}
