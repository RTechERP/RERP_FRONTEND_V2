import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { HotelBookingRequestParam, HotelBookingSaveDTO } from './models';

@Injectable({
  providedIn: 'root'
})
export class HotelBookingManagementService {
  private apiUrl = `${environment.host}api/HotelBookingManagement`;

  constructor(private http: HttpClient) { }

  getList(params: HotelBookingRequestParam): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-list`, params);
  }

  getByID(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-by-id?id=${id}`);
  }

  saveData(dto: HotelBookingSaveDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, { ID: id });
  }

  getHistoricalSuggestions(): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-historical-suggestions`, {});
  }

  approveProposal(proposalID: number, status: number, reasonDecline?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-proposal`, {
      ProposalID: proposalID,
      Status: status,
      ReasonDecline: reasonDecline
    });
  }

  exportExcel(params: HotelBookingRequestParam): Observable<any> {
    return this.http.post(`${this.apiUrl}/ExportExcel`, params, { responseType: 'blob' });
  }
}
