import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { AGVProductGroup } from '../model/AGVProductGroup';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgvProductGroupService {
  private url = environment.host + 'api/agvproductgroup';
  constructor(private http: HttpClient) {}

  getGroups(): Observable<AGVProductGroup> {
    return this.http.get<any>(this.url);
  }

  saveGroup(product: AGVProductGroup): Observable<AGVProductGroup> {
    return this.http.post<any>(`${this.url}/save-data`, product);
  }
}
