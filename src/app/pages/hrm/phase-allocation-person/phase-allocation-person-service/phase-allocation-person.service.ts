import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PhaseAllocationPersonService {
  private url = `${environment.host}api/PhasedAllocationPerson/`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách master theo năm và tháng
   */
  getPhasedAllocationPerson(year: number, month: number): Observable<any> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<any>(`${this.url}`, { params });
  }

  /**
   * Lấy danh sách detail theo phasedId
   */
  getPhasedAllocationPersonDetail(phasedId: number): Observable<any> {
    return this.http.get<any>(`${this.url}detail/${phasedId}`);
  }

  /**
   * Lưu master data
   */
  saveData(phased: any): Observable<any> {
    return this.http.post<any>(`${this.url}save-data`, phased);
  }

  /**
   * Lưu detail data
   */
  saveDataDetail(details: any[]): Observable<any> {
    return this.http.post<any>(`${this.url}detail/save-data`, details);
  }

  /**
   * Get Ajax URL for Tabulator
   */
  getPhasedAllocationPersonAjax(): string {
    return `${this.url}`;
  }
}

