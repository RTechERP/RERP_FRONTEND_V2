import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse, IProjectTaskEmailBand, IProjectTaskSetting } from '../../../models/kanban.interface';
import * as ExcelJS from 'exceljs';
import { Table } from 'primeng/table';
import { DateTime } from 'luxon';

export interface ProjectTaskItem {
    ID: number;
    ProjectID: number | null;
    ProjectCode: string | null;
    ProjectName: string | null;
    Mission: string | null;
    Description: string | null;
    EmployeeIDRequest: number | null;
    FullName: string | null;
    ActualStartDate: string | Date | null;
    ActualEndDate: string | Date | null;
    PlanStartDate: string | Date | null;
    PlanEndDate: string | Date | null;
    Priority: number | null;
    Status: number | null;
    Code: string | null;
    OrderIndex: number | null;
    ParentID: number | null;
    ParentCode: string | null;
    ParentTitle: string | null;
    CreatedBy: string | null;
    CreatedDate: string | null;
    UpdatedBy: string | null;
    UpdatedDate: string | null;
    IsDeleted: boolean | null;
    SecondEmployeeID: number | null;
    SecondEmployeeFullName: string | null;
    SecondEmployeeType: number | null; // 1: assignee, 2: related
    IsApproved: number | null; // Old field (kept for compatibility)
    ApprovalStatus?: boolean | null; // New field: null=chưa duyệt, true=đã duyệt, false=từ chối
    ReviewDescription: string | null;
    DisplayStatus?: number; // Computed: same as Status, or 5 = Quá hạn
    DepartmentAssignerID?: number | null;
    DepartmentAssigneeID?: number | null;
    DepartmentAssignerName?: string | null;
    DepartmentAssigneeName?: string | null;
    ProjectTaskTypeName?: string | null;
    IsPersonalProject?: boolean | null;
    IsAdditional?: boolean | null;
    TaskComplexity?: number | null;
    PercentOverTime?: number | null;
    AsigneeEmployeeID?: number | null;
    AsigneeEmployeeFullName?: string | null;
    ProjectTaskColor?: string | null;
    CompletionRating?: number | null;
    ReviewCompletionRating?: number | null;
    TotalActualHours?: number | null;
    IsCheck?: boolean | null;
    Deadline?: string | Date | null;
    ProjectTaskTypeID?: number | null;
    TypeProjectItem?: number | null;

    // Additional fields from sample JSON
    STT?: number | null;
    UserID?: number | null;
    Note?: string | null;
    TotalDayPlan?: number | null;
    PercentItem?: number | null;
    TotalDayActual?: number | null;
    ItemLate?: boolean | number | null;
    TimeSpan?: any | null;
    PercentageActual?: number | null;
    UpdatedDateActual?: string | Date | null;
    IsUpdateLate?: boolean | null;
    ReasonLate?: string | null;
    UpdatedDateReasonLate?: string | Date | null;
    IsApprovedLate?: number | null;
    EmployeeRequestID?: number | null;
    EmployeeRequestName?: string | null;
    Location?: string | null;
    EmployeeCreateID?: number | null;
}

export interface ProjectTaskResponse {
    ProjectTask: ProjectTaskItem[];
    UserID: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskService {
    private apiUrl = `${environment.host}api/ProjectTask`;

    constructor(private http: HttpClient) { }

    getProjectTasks(dateStart: string, dateEnd: string, status: number = 0): Observable<ProjectTaskResponse> {
        const params = new HttpParams()
            .set('dateStart', dateStart)
            .set('dateEnd', dateEnd)
            .set('status', status.toString());
        return this.http.get<IAPIResponse<ProjectTaskResponse>>(`${this.apiUrl}`, { params }).pipe(
            map(response => response.data as ProjectTaskResponse)
        );
    }

    approveTask(taskId: number): Observable<IAPIResponse<ProjectTaskResponse>> {
        return this.http.post<IAPIResponse<ProjectTaskResponse>>(`${this.apiUrl}/approve/${taskId}`, {});
    }

    rejectTask(taskId: number, reason?: string): Observable<IAPIResponse<ProjectTaskResponse>> {
        return this.http.post<IAPIResponse<ProjectTaskResponse>>(`${this.apiUrl}/reject/${taskId}`, { reason });
    }

    getTaskById(taskId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${taskId}`);
    }

    async exportExcelPrimeNG(table: Table, cols: any[], sheetName: string, fileName: string, postProcess?: (worksheet: ExcelJS.Worksheet) => void) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Header row
        const headers = cols.map(c => c.header);
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Data source: Nếu có filteredValue thì dùng, không thì dùng value của table
        const data = table.filteredValue || table.value || [];

        data.forEach((item: any) => {
            const rowValues = cols.map(col => {
                let val = item[col.field];
                if (col.type === 'date' && val) {
                    return val instanceof Date ? val : new Date(val);
                }
                if (col.type === 'boolean') {
                    return val ? 'Có' : 'Không';
                }
                return val;
            });
            const excelRow = worksheet.addRow(rowValues);

            // Áp dụng style cho từng cell dựa trên column config
            cols.forEach((col, colIdx) => {
                if (col.cellStyle) {
                    const cell = excelRow.getCell(colIdx + 1);
                    const style = col.cellStyle(item);
                    if (style.fill) cell.fill = style.fill;
                    if (style.font) cell.font = style.font;
                }
            });
        });

        // Borders for ALL cells (including empty ones)
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = {
                    vertical: 'middle',
                    wrapText: true,
                    horizontal: cell.alignment?.horizontal || 'left'
                };
                if (cell.value instanceof Date) {
                    cell.numFmt = 'dd/mm/yyyy';
                    cell.alignment = { ...cell.alignment, horizontal: 'center' };
                }
            });
        });

        // Auto-width
        worksheet.columns.forEach((column: any) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = Math.min(maxLength + 2, 50);
        });

        // Áp dụng postProcess nếu có (Ví dụ gộp dòng cho Timeline)
        if (postProcess) {
            postProcess(worksheet);
        }

        // Add Filters
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: cols.length }
        };

        // Save
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}_${DateTime.now().toFormat('ddMMyyyy')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    getEmailBandData(): Observable<IAPIResponse<IProjectTaskSetting>> {
        return this.http.get<IAPIResponse<IProjectTaskSetting>>(`${this.apiUrl}/email-band`);
    }

    saveEmailBandData(
        sendMailCreate: boolean,
        sendFinish: boolean,
        sendApprove: boolean
    ): Observable<IAPIResponse<IProjectTaskSetting>> {
        const params = new HttpParams()
            .set('SendMailCreateProjectTask', sendMailCreate.toString())
            .set('SendFinishProjectTask', sendFinish.toString())
            .set('SendApproveProjectTask', sendApprove.toString());
        return this.http.post<IAPIResponse<IProjectTaskSetting>>(`${this.apiUrl}/email-band`, {}, { params });
    }

    saveAttendance(projectTaskID: number, isCheck: boolean): Observable<IAPIResponse<any>> {
        const params = new HttpParams()
            .set('projectTaskID', projectTaskID.toString())
            .set('isCheck', isCheck.toString());
        return this.http.post<IAPIResponse<any>>(`${this.apiUrl}/attendance`, {}, { params });
    }
}