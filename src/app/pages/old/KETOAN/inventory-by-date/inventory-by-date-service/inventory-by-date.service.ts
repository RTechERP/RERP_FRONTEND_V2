import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryByDateService {

  private _url = environment.host + 'api/InventoryByDate/';
  constructor(private http: HttpClient) { }

  loadData(
    dateTime: Date
  ): Observable<any> {
    // Format date theo local time để tránh lệch timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    return this.http.get(this._url + 'get-data', {
      params: {
        dateTime: formatLocalDate(dateTime),
      },
    });
  }
}