import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiErrorEmployeeService {

  private _url = environment.host + 'api/KPIErrorEmployee/';
  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách nhân viên
  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-employees');
  }

  // Lấy danh sách lỗi vi phạm theo loại
  getKPIError(typeID: number): Observable<any> {
    const params = new HttpParams().set('typeID', typeID.toString());
    return this.http.get(this._url + 'get-kpierror', { params });
  }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Load dữ liệu chính
  loadData(
    startDate: Date,
    endDate: Date,
    kpiErrorID: number,
    employeeID: number,
    typeID: number,
    departmentID: number,
    keywords: string = ''
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString())
      .set('kpiErrorID', kpiErrorID.toString())
      .set('employeeID', employeeID.toString())
      .set('typeID', typeID.toString())
      .set('departmentID', departmentID.toString())
      .set('keywords', keywords);

    return this.http.get(this._url + 'load-data', { params });
  }

  // Load file theo KPIErrorEmployeeID
  loadDataFile(kpiErrorEmployeeID: number): Observable<any> {
    const params = new HttpParams().set('kpiErrorEmployeeID', kpiErrorEmployeeID.toString());
    return this.http.get(this._url + 'load-data-file', { params });
  }

  // Tự động thêm lỗi BCCV
  autoAdd(startDate: Date, endDate: Date): Observable<any> {
    return this.http.post(this._url + 'auto-add', {
      StartDate: startDate,
      EndDate: endDate
    });
  }

  // Xóa KPIErrorEmployee
  deleteKPIErrorEmployee(ids: number[]): Observable<any> {
    return this.http.post(this._url + 'delete-kpi-error-employee', ids);
  }

  // Lưu KPIErrorEmployee (thêm mới hoặc cập nhật)
  saveKPIErrorEmployee(model: any): Observable<any> {
    return this.http.post(this._url + 'save-data-employee-error', model);
  }

  // Lấy chi tiết KPIErrorEmployee theo ID
  getKPIErrorEmployeeById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this._url + 'get-kpi-error-employee-by-id', { params });
  }

  // Lấy danh sách lỗi vi phạm theo phòng ban
  getKPIErrorByDepartment(departmentID: number): Observable<any> {
    const params = new HttpParams().set('departmentID', departmentID.toString());
    return this.http.get(this._url + 'get-kpierror-by-department', { params });
  }

  // Upload file cho KPIErrorEmployee (giống request-invoice-detail)
  uploadFiles(formData: FormData, kpiErrorEmployeeId: number, fileType: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiErrorEmployeeId', kpiErrorEmployeeId.toString())
      .set('fileType', fileType.toString());

    return this.http.post(this._url + 'upload', formData, { params });
  }

  // Xóa file
  deleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post(this._url + 'delete-file', fileIds);
  }

  // Import Excel data
  importExcel(data: any[]): Observable<any> {
    return this.http.post(this._url + 'import-excel', data);
  }

  // Download template file
  downloadTemplate(fileName: string): Observable<Blob> {
    const url = `${environment.host}api/share/software/Template/ImportExcel/${fileName}`;
    return this.http.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        return response.body as Blob;
      })
    );
  }
}
