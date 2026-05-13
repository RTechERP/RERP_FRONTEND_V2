import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

type DepartmentIdInput = number[] | string | number;

@Injectable({
  providedIn: 'root'
})
export class SummaryKpiErrorEmployeeService {

  private _url = environment.host + 'api/SummaryKPIErrorEmployee/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Lấy danh sách lỗi (theo loại)
  getKPIError(typeId: number): Observable<any> {
    const params = new HttpParams().set('typeId', typeId.toString());
    return this.http.get(this._url + 'get-kpierror', { params });
  }

  // Lấy danh sách nhân viên
  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-employees');
  }

  // Lấy dữ liệu tổng hợp (Tab 1 - 3 sub-tabs)
  getDataTongHop(month: number, year: number, kpiErrorId: number, employeeId: number, departmentIDs: DepartmentIdInput, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('employeeId', employeeId.toString())
      .set('departmentIDs', this.normalizeDepartmentIDs(departmentIDs));

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-th', { params });
  }

  // Lấy danh sách file
  getDataFile(month: number, year: number, kpiErrorId: number, employeeId: number, departmentIDs: DepartmentIdInput, typeId: number, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('employeeId', employeeId.toString())
      .set('departmentIDs', this.normalizeDepartmentIDs(departmentIDs))
      .set('typeId', typeId.toString());

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-file', { params });
  }

  // Lấy dữ liệu thống kê (Tab 2)
  getDataThongKe(month: number, year: number, typeId: number, departmentIDs: DepartmentIdInput, keywords: string = ''): Observable<any> {
    const selectedDepartmentIds = this.getSelectedDepartmentIds(departmentIDs);

    if (selectedDepartmentIds.length <= 1) {
      return this.getDataThongKeByDepartment(month, year, typeId, selectedDepartmentIds[0] || 0, keywords);
    }

    return forkJoin(
      selectedDepartmentIds.map(departmentId =>
        this.getDataThongKeByDepartment(month, year, typeId, departmentId, keywords)
      )
    ).pipe(map(responses => this.mergeThongKeResponses(responses)));
  }

  private getDataThongKeByDepartment(month: number, year: number, typeId: number, departmentId: number, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('typeId', typeId.toString())
      .set('departmentId', departmentId.toString());

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-tk', { params });
  }

  // Lấy dữ liệu biểu đồ (Tab 3)
  getKPIErrorInMonth(month: number, year: number, kpiErrorId: number, weekIndex: number, departmentIDs: DepartmentIdInput): Observable<any> {
    const selectedDepartmentIds = this.getSelectedDepartmentIds(departmentIDs);

    if (selectedDepartmentIds.length <= 1) {
      return this.getKPIErrorInMonthByDepartment(month, year, kpiErrorId, weekIndex, selectedDepartmentIds[0] || 0);
    }

    return forkJoin(
      selectedDepartmentIds.map(departmentId =>
        this.getKPIErrorInMonthByDepartment(month, year, kpiErrorId, weekIndex, departmentId)
      )
    ).pipe(map(responses => this.mergeListResponses(responses)));
  }

  private getKPIErrorInMonthByDepartment(month: number, year: number, kpiErrorId: number, weekIndex: number, departmentId: number): Observable<any> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('weekIndex', weekIndex.toString())
      .set('deparmentID', departmentId.toString());

    return this.http.get(this._url + 'get-kpi-error-in-month', { params });
  }

  private normalizeDepartmentIDs(departmentIDs: DepartmentIdInput): string {
    if (Array.isArray(departmentIDs)) {
      return departmentIDs.filter(id => Number(id) > 0).join(',');
    }

    if (typeof departmentIDs === 'number') {
      return departmentIDs > 0 ? departmentIDs.toString() : '';
    }

    return departmentIDs || '';
  }

  private getSelectedDepartmentIds(departmentIDs: DepartmentIdInput): number[] {
    const normalizedDepartmentIds = this.normalizeDepartmentIDs(departmentIDs);
    if (!normalizedDepartmentIds) return [];

    return normalizedDepartmentIds
      .split(',')
      .map(id => Number(id))
      .filter(id => id > 0);
  }

  private mergeThongKeResponses(responses: any[]): any {
    const baseResponse = this.getMergedBaseResponse(responses);
    const rows = responses.flatMap(response => Array.isArray(response?.data) ? response.data : []);
    const sumFields = ['Quantity', 'Monney', 'Money', 'Week1', 'Week2', 'Week3', 'Week4', 'Week5', 'Week6', 'Month'];
    const mergedRows = new Map<string, any>();

    rows.forEach(row => {
      const key = this.getThongKeRowKey(row);
      const existingRow = mergedRows.get(key);

      if (!existingRow) {
        mergedRows.set(key, { ...row });
        return;
      }

      sumFields.forEach(field => {
        existingRow[field] = (Number(existingRow[field]) || 0) + (Number(row?.[field]) || 0);
      });
    });

    return { ...baseResponse, data: Array.from(mergedRows.values()) };
  }

  private mergeListResponses(responses: any[]): any {
    return {
      ...this.getMergedBaseResponse(responses),
      data: responses.flatMap(response => Array.isArray(response?.data) ? response.data : [])
    };
  }

  private getMergedBaseResponse(responses: any[]): any {
    const successResponse = responses.find(response => response?.status === 1);
    return {
      ...(successResponse || responses[0] || {}),
      status: successResponse?.status ?? responses[0]?.status ?? 1
    };
  }

  private getThongKeRowKey(row: any): string {
    return [
      row?.ID ?? row?.KPIErrorID ?? row?.KpiErrorID ?? row?.Code ?? '',
      row?.TypeName ?? '',
      row?.Content ?? '',
      row?.Unit ?? ''
    ].join('|');
  }
}
