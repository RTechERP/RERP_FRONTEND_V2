import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class PoRequestBuySlickgridService {
  private _url = environment.host + 'api/PORequestBuy/';
  constructor(private http: HttpClient) { }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
  getEmployees(status: number): Observable<any> {
    return this.http.get<any>(
      environment.host + 'api/Employee/' + 'employees',
      {
        params: {
          status: status.toString(),
        },
      }
    );
  }
  getPOKHProduct(id: number = 0, idDetail: number = 0): Observable<any> {
    return this.http.get<any>(environment.host + 'api/POKH/' + 'get-pokh-product', {
      params: {
        id: id.toString(),
        idDetail: idDetail.toString(),
      },
    });
  }

  getPOKHProductForRequestBuy(id: number = 0): Observable<any> {
    return this.http.get<any>(environment.host + 'api/POKH/' + 'get-pokh-detail-request-buy', {
      params: {
        id: id.toString(),
      },
    });
  }

  getPOKHProductsForRequestBuy(ids: number[] = []): Observable<{
    data: any[];
    failedIds: number[];
    failedMessages: string[];
  }> {
    const normalizedIds = ids
      .map((id) => Number(id) || 0)
      .filter((id, index, array) => id > 0 && array.indexOf(id) === index);

    if (normalizedIds.length === 0) {
      return of({
        data: [],
        failedIds: [],
        failedMessages: [],
      });
    }

    return forkJoin(
      normalizedIds.map((id) =>
        this.getPOKHProductForRequestBuy(id).pipe(
          map((response: any) => ({
            id,
            response,
            error: null,
          })),
          catchError((error: any) =>
            of({
              id,
              response: null,
              error,
            })
          )
        )
      )
    ).pipe(
      map((results) => {
        const data: any[] = [];
        const failedIds: number[] = [];
        const failedMessages: string[] = [];

        results.forEach((result) => {
          const response = result.response;

          if (result.error) {
            failedIds.push(result.id);
            failedMessages.push(`POKH ${result.id}: ${result.error?.message || result.error || 'Request failed'}`);
            return;
          }

          if (response?.status !== 1) {
            failedIds.push(result.id);
            failedMessages.push(`POKH ${result.id}: ${response?.message || 'Load failed'}`);
            return;
          }

          const responseData = Array.isArray(response?.data) ? response.data : [];
          data.push(...responseData.map((item: any) => ({
            ...item,
            __pokhId: result.id,
          })));
        });

        return {
          data,
          failedIds,
          failedMessages,
        };
      })
    );
  }
  getDepartments(): Observable<any> {
    return this.http.get<any>(environment.host + 'api/Department/' + 'get-all');
  }
}
