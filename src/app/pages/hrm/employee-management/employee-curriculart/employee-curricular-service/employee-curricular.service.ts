import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EmployeeCurricularRequestParam {
  Month?: number;
  Year?: number;
  DepartmentID?: number;
  EmployeeID?: number;
}

export interface EmployeeCurricularDto {
  ID?: number;
  EmployeeID?: number;
  CurricularCode?: string;
  CurricularName?: string;
  CurricularDay?: number;
  CurricularMonth?: number;
  CurricularYear?: number;
  Note?: string;
  CreatedDate?: Date | string;
  CreatedBy?: string;
  UpdatedDate?: Date | string;
  UpdatedBy?: string;
  IsDeleted?: boolean;
}
 
@Injectable({
  providedIn: 'root',
})
export class EmployeeCurricularService {
  private apiUrl = `${environment.host}api/EmployeeCurricular/`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách ngoại khóa nhân viên
  getEmployeeCurricularList(params: EmployeeCurricularRequestParam): Observable<any> {
    const httpParams = new HttpParams()
      .set('month', params.Month?.toString() || '0')
      .set('year', params.Year?.toString() || '0')
      .set('departmentId', params.DepartmentID?.toString() || '0')
      .set('employeeId', params.EmployeeID?.toString() || '0');

    return this.http.get<any>(this.apiUrl + 'get-employee-curricular', { params: httpParams });
  }

  // Lưu hoặc cập nhật ngoại khóa nhân viên
  saveData(data: EmployeeCurricularDto): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    
    const cleanData: any = { ...data };
    
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    if (cleanData.IsDeleted === null) {
      delete cleanData.IsDeleted;
    }
    
    return this.http.post<any>(this.apiUrl + 'save-data', cleanData, { headers });
  }

  // Kiểm tra trùng lặp ngoại khóa
  checkEmployeeCurricular(
    employeeId: number,
    curricularDay: number,
    curricularMonth: number,
    curricularYear: number
  ): Observable<any> {
    const httpParams = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('curricularDay', curricularDay.toString())
      .set('curricularMonth', curricularMonth.toString())
      .set('curricularYear', curricularYear.toString());

    return this.http.get<any>(this.apiUrl + 'check', { params: httpParams });
  }

  // Xóa ngoại khóa (hard delete)
  deleteEmployeeCurricular(id: number): Observable<any> {
    return this.http.delete<any>(this.apiUrl + id.toString());
  }

  // Nhập dữ liệu từ file Excel
  importExcel(file: File, sheetName?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheetName) {
      formData.append('sheetName', sheetName);
    }

    return this.http.post<any>(this.apiUrl + 'import-excel', formData);
  }

  // Lấy danh sách sheet từ file Excel
  getExcelSheets(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(this.apiUrl + 'get-excel-sheets', formData);
  }

  // Tải file mẫu Excel
  downloadTemplate(fileName: string): Observable<Blob> {
    return this.http.get(`${environment.host}assets/${fileName}`, {
      responseType: 'blob',
    });
  }
}

