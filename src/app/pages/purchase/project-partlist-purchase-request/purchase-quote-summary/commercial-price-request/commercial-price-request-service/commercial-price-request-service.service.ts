import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CommercialPriceRequestServiceService {
  private apiUrl = environment.host + 'api/commercialpricerequest/';

  constructor(private http: HttpClient) { }

  // get all data 
  getCommercialPriceRequests(filter: any = {}): Observable<any> {
    let params = new HttpParams();
    if (filter.Keyword) params = params.set('keyword', filter.Keyword);
    if (filter.YearNo) params = params.set('yearNo', filter.YearNo);
    if (filter.PageNumber) params = params.set('pageNumber', filter.PageNumber);
    if (filter.PageSize) params = params.set('pageSize', filter.PageSize);
    if (filter.isoDateStart) params = params.set('dateStart', filter.isoDateStart);
    if (filter.isoDateEnd) params = params.set('dateEnd', filter.isoDateEnd);
    if (filter.employeeId) params = params.set('employeeId', filter.employeeId);

    return this.http.get<any>(this.apiUrl + 'get-all', { params });
  }
  // send data import excel commercial price request
  postDataImportExcel(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'post-data-import-excel', data);
  }
  //LƯU MẪU EXCEL
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
