import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { FlightBookingRequestParam, FlightBookingSaveDTO } from './models';

@Injectable({
  providedIn: 'root'
})
export class FlightBookingManagementService {
  private apiUrl = `${environment.host}api/FlightBookingManagement`;

  constructor(private http: HttpClient) { }

  getList(params: FlightBookingRequestParam): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-list`, params);
  }

  getByID(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-by-id?id=${id}`);
  }

  saveData(dto: FlightBookingSaveDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, id);
  }

  getHistoricalSuggestions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-historical-suggestions`);
  }

  getEmployees(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-employees`);
  }

  getProjects(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-projects`);
  }

  approveProposal(proposalID: number, status: number, reasonDecline?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-proposal`, {
      ProposalID: proposalID,
      Status: status,
      ReasonDecline: reasonDecline
    });
  }

  exportExcel(params: FlightBookingRequestParam): Observable<any> {
    return this.http.post(`${this.apiUrl}/ExportExcel`, params, { responseType: 'blob' });
  }
}
