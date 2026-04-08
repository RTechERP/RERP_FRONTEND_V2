import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IProjectTask, IProjectTaskGroup, IProjectTaskChecklist, IProjectTaskAdditional, IProjectTaskAttachment, IProjectSubtask, IAPIResponse, IProject } from '../../../models/kanban.interface';

@Injectable({
    providedIn: 'root'
})
export class KanbanService {
    private apiUrl = `${environment.host}api/ProjectTask`;
    private _url = environment.host + 'api/';

    constructor(private http: HttpClient) { }

    // --- Group (Column) Methods ---
    getTaskGroups(projectId: number): Observable<IAPIResponse<IProjectTaskGroup[]>> {
        return this.http.get<IAPIResponse<IProjectTaskGroup[]>>(`${this.apiUrl}/Groups?projectId=${projectId}`);
    }

    getBoardDetails(projectId: number): Observable<IAPIResponse<IProjectTaskGroup[]>> {
        return this.http.get<IAPIResponse<IProjectTaskGroup[]>>(`${this.apiUrl}/BoardDetails?projectId=${projectId}`);
    }

    addTaskGroup(group: Partial<IProjectTaskGroup>): Observable<IAPIResponse<IProjectTaskGroup>> {
        return this.http.post<IAPIResponse<IProjectTaskGroup>>(`${this.apiUrl}/Groups`, group);
    }

    moveTaskGroup(groupId: number, OrderIndex: number): Observable<IAPIResponse<void>> {
        return this.http.post<IAPIResponse<void>>(`${this.apiUrl}/Groups/${groupId}/${OrderIndex}/Move`, {});
    }

    updateTaskGroup(group: Partial<IProjectTaskGroup>): Observable<IAPIResponse<void>> {
        return this.http.put<IAPIResponse<void>>(`${this.apiUrl}/Groups`, group);
    }

    // --- Task Methods ---
    getTasks(projectId: number): Observable<IAPIResponse<IProjectTask[]>> {
        return this.http.get<IAPIResponse<IProjectTask[]>>(`${this.apiUrl}?projectId=${projectId}`);
    }

    addTask(task: Partial<IProjectTask>): Observable<IAPIResponse<IProjectTask>> {
        return this.http.post<IAPIResponse<IProjectTask>>(`${this.apiUrl}`, task);
    }

    updateTask(taskId: number, task: Partial<IProjectTask>): Observable<IAPIResponse<void>> {
        return this.http.put<IAPIResponse<void>>(`${this.apiUrl}/${taskId}`, task);
    }

    deleteTask(taskId: number): Observable<IAPIResponse<void>> {
        return this.http.delete<IAPIResponse<void>>(`${this.apiUrl}/${taskId}`);
    }

    moveTask(taskId: number, data: { ProjectTaskGroupID: number, OrderIndex: number }): Observable<IAPIResponse<void>> {
        return this.http.post<IAPIResponse<void>>(`${this.apiUrl}/${taskId}/Move`, data);
    }

    // --- Task CRUD with SaveData endpoint ---
    getTaskById(taskId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${taskId}`);
    }

    saveTask(taskData: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/SaveData`, taskData);
    }

    // --- Employee Management ---
    updateTaskEmployee(
        projectTaskID: number,
        employeeType: number,
        isDeleted: boolean,
        employeeID: number
    ): Observable<IAPIResponse<any>> {
        return this.http.put<IAPIResponse<any>>(`${this.apiUrl}/employee`, null, {
            params: {
                projectTaskID: projectTaskID.toString(),
                employeeType: employeeType.toString(),
                isDeleted: isDeleted.toString(),
                employeeID: employeeID.toString()
            }
        });
    }

    // --- Checklist Methods ---
    getChecklists(taskId: number): Observable<IAPIResponse<IProjectTaskChecklist[]>> {
        return this.http.get<IAPIResponse<IProjectTaskChecklist[]>>(`${this.apiUrl}/${taskId}/Checklists`);
    }

    addChecklistItem(item: Partial<IProjectTaskChecklist>): Observable<IAPIResponse<IProjectTaskChecklist>> {
        return this.http.post<IAPIResponse<IProjectTaskChecklist>>(`${this.apiUrl}/Checklists`, item);
    }

    updateChecklistItem(id: number, item: Partial<IProjectTaskChecklist>): Observable<IAPIResponse<void>> {
        return this.http.put<IAPIResponse<void>>(`${this.apiUrl}/Checklists/${id}`, item);
    }

    // --- Delete Checklist Method ---
    deleteChecklistItem(id: number): Observable<IAPIResponse<void>> {
        return this.http.delete<IAPIResponse<void>>(`${this.apiUrl}/Checklists/${id}`);
    }

    // --- Subtask Methods ---
    getSubtasks(taskId: number): Observable<IAPIResponse<IProjectSubtask[]>> {
        return this.http.get<IAPIResponse<IProjectSubtask[]>>(`${this.apiUrl}/${taskId}/Subtasks`);
    }

    addSubtask(subtask: Partial<IProjectSubtask>): Observable<IAPIResponse<IProjectSubtask>> {
        return this.http.post<IAPIResponse<IProjectSubtask>>(`${this.apiUrl}/Subtasks`, subtask);
    }

    updateSubtask(id: number, subtask: Partial<IProjectSubtask>): Observable<IAPIResponse<void>> {
        return this.http.put<IAPIResponse<void>>(`${this.apiUrl}/Subtasks/${id}`, subtask);
    }

    deleteSubtask(id: number): Observable<IAPIResponse<void>> {
        return this.http.delete<IAPIResponse<void>>(`${this.apiUrl}/Subtasks/${id}`);
    }

    getSubtaskDetail(id: number): Observable<IAPIResponse<IProjectSubtask>> {
        return this.http.get<IAPIResponse<IProjectSubtask>>(`${this.apiUrl}/Subtasks/${id}`);
    }
    private _employees$: Observable<any> | null = null;

    getEmployees(): Observable<any> {
        if (!this._employees$) {
            this._employees$ = this.http.get<any>(
                `${this._url}employee/employees`
            ).pipe(shareReplay(1));
        }
        return this._employees$;
    }

    // Invalidate cache (gọi khi cần refresh danh sách nhân viên)
    clearEmployeeCache(): void {
        this._employees$ = null;
    }

    // Get task employees by type (1: Người thực hiện, 2: Người liên quan)
    getTaskEmployees(taskId: number, typeEmployee: number): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}/employee/${taskId}?typeEmployee=${typeEmployee}`
        );
    }

    uploadMultipleFiles(files: File[], key?: string, subPath?: string): Observable<any> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });
        formData.append('key', key || 'ProjectTask');
        if (subPath && subPath.trim()) {
            formData.append('subPath', subPath.trim());
        }
        return this.http.post<any>(this._url + 'home/upload-multiple', formData);
    }

    // Attachment Management - Support both create (ID <= 0) and update (ID > 0)
    saveFileAttachment(attachment: Partial<IProjectTaskAttachment>): Observable<IAPIResponse<IProjectTaskAttachment>> {
        return this.http.put<IAPIResponse<IProjectTaskAttachment>>(
            `${this.apiUrl}/Files`,
            attachment
        );
    }

    saveLinkAttachment(attachment: Partial<IProjectTaskAttachment>): Observable<IAPIResponse<IProjectTaskAttachment>> {
        return this.http.put<IAPIResponse<IProjectTaskAttachment>>(
            `${this.apiUrl}/Links`,
            attachment
        );
    }

    deleteFileAttachment(id: number): Observable<IAPIResponse<any>> {
        return this.http.delete<IAPIResponse<any>>(
            `${this.apiUrl}/Files/${id}`
        );
    }

    deleteLinkAttachment(id: number): Observable<IAPIResponse<any>> {
        return this.http.delete<IAPIResponse<any>>(
            `${this.apiUrl}/Links/${id}`
        );
    }

    getAttachments(taskId: number): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}/Attachments/${taskId}`
        );
    }

    // --- Approval Methods ---
    approveTask(projectTaskIDs: number[], isApproved: boolean, review: string = '', completionRating: number | null = null): Observable<IAPIResponse<any>> {
        return this.http.post<IAPIResponse<any>>(
            `${this.apiUrl}/Approve?isApproved=${isApproved}&review=${encodeURIComponent(review)}&completionRating=${completionRating ?? ''}`,
            projectTaskIDs
        );
    }

    // --- Project Methods ---
    getAllProjects(): Observable<IAPIResponse<IProject[]>> {
        return this.http.get<IAPIResponse<IProject[]>>(`${this.apiUrl}/get-all-project`);
    }

    // --- Task Log Methods ---
    getTaskLogs(projectTaskID: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/project-task-log/${projectTaskID}`);
    }

    // --- Project Task Additional Information ---
    getAdditional(taskId: number): Observable<IAPIResponse<IProjectTaskAdditional[]>> {
        return this.http.get<IAPIResponse<IProjectTaskAdditional[]>>(`${this.apiUrl}/${taskId}/Additional`);
    }

    saveAdditional(item: Partial<IProjectTaskAdditional>): Observable<IAPIResponse<IProjectTaskAdditional>> {
        return this.http.post<IAPIResponse<IProjectTaskAdditional>>(`${this.apiUrl}/Additional`, item);
    }

    // --- Project Task Type Methods ---
    getProjectTaskTypes(assigneeIds?: number[]): Observable<any> {
        if (assigneeIds && assigneeIds.length > 0) {
            // Updated backend to [HttpGet] with [FromQuery] List<int> listEmployeeAsignee
            let params = new HttpParams();
            assigneeIds.forEach(id => {
                params = params.append('listEmployeeAsignee', id.toString());
            });
            return this.http.get<any>(`${this.apiUrl}/project-task-type`, { params });
        }
        return this.http.get<any>(`${this.apiUrl}/project-task-type`);
    }

    // --- Parent Task List Methods ---
    getProjectTasksList(projectID: number = 0, isPersionalProject: boolean = false): Observable<IAPIResponse<any[]>> {
        return this.http.get<IAPIResponse<any[]>>(`${this.apiUrl}/list-project-task?projectID=${projectID}&isPersionalProject=${isPersionalProject}`);
    }
}

