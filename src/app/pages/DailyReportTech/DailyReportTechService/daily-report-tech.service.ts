import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportTechService {
  private api = environment.host + 'api/';
  private urlFilmManagement = `${environment.host}api/FilmManagement/`;
  private apiUrl = environment.host + 'api/DailyReportTech/';
  private apiUrlLXCP = environment.host + 'api/DailyReportHr/';
  private courseApiUrl = environment.host + 'api/Course/';

  constructor(private http: HttpClient) { }

  getDailyReportTech(params: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-daily-report-tech', params);
  }

  getEmployees(userTeamID?: number, departmentid?: number, employeeID?: number): Observable<any> {
    let params = new HttpParams();

    if (userTeamID !== undefined && userTeamID !== null) {
      params = params.set('userTeamID', userTeamID.toString());
    }
    if (departmentid !== undefined && departmentid !== null) {
      params = params.set('departmentid', departmentid.toString());
    }
    if (employeeID !== undefined && employeeID !== null) {
      params = params.set('employeeID', employeeID.toString());
    }

    return this.http.get<any>(this.courseApiUrl + 'get-employees', { params });
  }

  saveReportTechnical(reports: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-report-tech', reports);
  }

  saveReportHr(report: any): Observable<any> {
    return this.http.post<any>(this.apiUrlLXCP + 'save-report-hr', report);
  }
  saveReportTHr(report: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-report-hr', report);
  }


  saveReportMar(report: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-report-mar', report);
  }

  getDataByID(dailyID: number): Observable<any> {
    const params = new HttpParams().set('dailyID', dailyID.toString());
    return this.http.get<any>(this.apiUrl + 'get-by-id', { params });
  }

  /**
   * Lấy dữ liệu báo cáo Marketing theo ID (cho chức năng sửa)
   * @param dailyID ID của báo cáo
   * @returns Observable với { dailyData, dailyFileData }
   */
  getDataByIDHR(dailyID: number): Observable<any> {
    const params = new HttpParams().set('dailyID', dailyID.toString());
    return this.http.get<any>(this.apiUrl + 'get-by-id-hr', { params });
  }

  //#region Get DailyReportHR by ID
  /**
   * Lấy dữ liệu báo cáo HR theo ID (cho Lái xe / Cắt phim)
   * @param id ID của báo cáo
   */
  getDailyReportHRByID(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(this.apiUrlLXCP + 'get-data-by-id', { params });
  }
  //#endregion

  getProjectItemByUser(projectId: number, status: number): Observable<any> {
    let params = new HttpParams()
      .set('projectId', projectId.toString())
      .set('status', status.toString());
    return this.http.get<any>(this.apiUrl + 'get-project-item-by-user', { params });
  }

  deleteDailyReport(dailyReportID: number): Observable<any> {
    // API POST nhận dailyReportID - nếu backend không có [FromBody], 
    // ASP.NET Core sẽ tìm trong query string hoặc form data
    // Thử gửi dưới dạng query string
    const params = new HttpParams().set('dailyReportID', dailyReportID.toString());
    return this.http.post<any>(this.apiUrl + 'delete-daily-report', null, { params });
  }

  getForCopy(params: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-for-copy', params);
  }

  /**
   * Gửi email báo cáo công việc kỹ thuật
   * @param body Nội dung email (text hoặc HTML)
   * @param dateReport Ngày báo cáo (optional)
   * @returns Observable<any>
   */
  sendEmailReport(body: string, dateReport?: Date | string): Observable<any> {
    let dateStr: string | null = null;
    if (dateReport) {
      dateStr = dateReport instanceof Date ? dateReport.toISOString() : dateReport;
    }
    const request = {
      Body: body,
      DateReport: dateStr
    };
    return this.http.post<any>(this.apiUrl + 'send-email-report', request);
  }

  /**
   * Gửi email báo cáo công việc Marketing
   * @param body Nội dung email (HTML)
   * @param dateReport Ngày báo cáo (optional)
   * @returns Observable<any>
   */
  sendEmailMarketingReport(
    body: string,
    dateReport?: Date | string,
    fileLinks?: { FileName: string; Url: string }[]
  ): Observable<any> {
    let dateStr: string | null = null;
    if (dateReport) {
      dateStr = dateReport instanceof Date ? dateReport.toISOString() : dateReport;
    }
    const request: any = {
      Body: body,
      DateReport: dateStr,
      FileLinks: fileLinks ?? []
    };
    return this.http.post<any>(this.apiUrl + 'send-email-marketing-report', request);
  }

  /**
   * Xuất Excel báo cáo kỹ thuật
   * @param request ExportExcelDailyReportTechRequest
   * @returns Observable<Blob> - File Excel
   */
  exportToExcel(request: {
    DateStart?: Date | string;
    DateEnd?: Date | string;
    TeamID?: string;
    TeamName?: string;
  }): Observable<Blob> {
    // Format dates to ISO string if they are Date objects
    const payload = {
      DateStart: request.DateStart instanceof Date
        ? request.DateStart.toISOString()
        : request.DateStart,
      DateEnd: request.DateEnd instanceof Date
        ? request.DateEnd.toISOString()
        : request.DateEnd,
      TeamID: request.TeamID || '',
      TeamName: request.TeamName || ''
    };

    return this.http.post(this.apiUrl + 'export-to-excel', payload, {
      responseType: 'blob'
    });
  }
  //#region get daily report lxcp
  getDailyReportLXCP(params: any): Observable<any> {
    return this.http.post<any>(this.apiUrlLXCP + 'get-daily-report-hr', params);
  }
  //#endregion
  //#region get daily report cp
  getDailyReportCP(params: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-daily-report-cp', params);
  }
  //#endregion

  //#region Film Management
  /**
   * Lấy danh sách công việc cho dropdown
   */
  getFilmList(): Observable<any> {
    const url = `${this.apiUrlLXCP + `get-film-detail`
      }`;
    return this.http.get<any>(url);
  }

  //#endregion

  //#region Save report LXCP (Lái xe / Cắt phim)
  /**
   * Lưu báo cáo Lái xe hoặc Cắt phim
   * @param report Dữ liệu báo cáo
   */
  saveReportLXCP(report: any): Observable<any> {
    return this.http.post<any>(this.apiUrlLXCP + 'save-report-lxcp', report);
  }
  //#endregion
  //ham upload file
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'PathDailyReportMarketing');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this.api + `home/upload-multiple`, formData);
  }
}
