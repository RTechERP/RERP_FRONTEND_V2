import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankList } from './model/bank-list';

@Injectable({
  providedIn: 'root'
})
export class BankListService {

  private url = environment.host + 'api/banklist';

  constructor(private http: HttpClient) { }

  getAll(): Observable<BankList[]> {
    return this.http.get<BankList[]>(this.url);
  }

  getById(id: number): Observable<BankList> {
    return this.http.get<BankList>(`${this.url}/${id}`);
  }

  saveData(data: BankList): Observable<any> {
    return this.http.post<any>(`${this.url}/save-data`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}
