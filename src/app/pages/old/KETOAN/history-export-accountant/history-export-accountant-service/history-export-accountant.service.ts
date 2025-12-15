import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class HistoryExportAccountantService {

  private _url = environment.host + 'api/HistoryExportAccountant/';
  constructor(private http: HttpClient) { }

  loadData(
    page: number,
    size: number,
    dateStart: Date,
    dateEnd: Date,
    status: number,
    filterText: string
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

    return this.http.get(this._url + 'load-data', {
      params: {
        page: page.toString(),
        size: size.toString(),
        dateStart: formatLocalDate(dateStart),
        dateEnd: formatLocalDate(dateEnd),
        status: status.toString(),
        filterText: filterText.toString(),
      },
    });
  }
}
