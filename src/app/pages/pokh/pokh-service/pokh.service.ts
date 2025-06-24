import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class PokhService {
  private _url = API_URL + 'api/POKH/';
  constructor(private http: HttpClient) { }

  getPOKH(filterText: string, pageNumber: number, pageSize: number, customerId: number, userId: number, POType: number, status: number, group: number, startDate: Date, endDate: Date, warehouseId: number, employeeTeamSaleId: number): Observable<any> {
    return this.http.get<any>((this._url + 'get-pokh'), {
      params: {
        filterText,
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
        customerId: customerId.toString(),
        userId: userId.toString(),
        POType: POType.toString(),
        status: status.toString(),
        group: group.toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        warehouseId: warehouseId.toString(),
        employeeTeamSaleId: employeeTeamSaleId.toString()
      }
    });
  }
  handlePOKH(pokh: any): Observable<any> {
    return this.http.post<any>(this._url + 'handle', pokh);
  }
  loadEmployeeManagers(group: number = 0, userId: number = 0, teamId: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'get-employee-manager', {
      params: {
        group: group.toString(),
        userId: userId.toString(),
        teamId: teamId.toString()
      }
    });
  }
  loadProject(): Observable<any> {
    return this.http.get<any>(this._url + 'get-project');
  }

  getTypePO(): Observable<any> {
    return this.http.get<any>(this._url + 'get-typePO');
  }

  getCurrency(): Observable<any> {
    return this.http.get<any>(this._url + 'get-currency');
  }


  getPOKHProduct(id: number = 0, idDetail: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-product', {
      params: {
        id: id.toString(),
        idDetail: idDetail.toString()
      }
    });
  }
  getPOKHFile(id: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-files', {
      params: {
        id: id.toString()
      }
    });
  }
  generatePOCode(customer: string, isCopy: boolean, warehouseID: number, pokhID: number): Observable<any> {
    return this.http.get<any>(this._url + 'generate-POcode',
      {
        params: {
          customer: customer,
          isCopy: isCopy.toString(),
          warehouseID: warehouseID.toString(),
          pokhID: pokhID.toString()
        }
      }
    );
  }
  loadProducts(): Observable<any> {
    return this.http.get<any>(this._url + 'get-product');
  }
  loadUserDetail(id: number, idDetail: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-detail-user',
      {
        params: {
          id: id,
          idDetail: idDetail
        }
      }
    )
  }
  uploadFiles(formData: FormData, pokhId: number): Observable<any> {
    return this.http.post<any>(`${this._url}upload?poKHID=${pokhId}`, formData);
  }
  getPOKHByID(id: number):Observable<any>{
    return this.http.get<any>(this._url + id );
  }
  deleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post<any>(this._url + 'delete-file', fileIds);
  }
  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),
    }));
  }
}
