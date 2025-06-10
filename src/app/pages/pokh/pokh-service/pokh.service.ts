import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PokhService {
  private _url = 'https://localhost:7187/api/POKH/';
  constructor(private http: HttpClient) { }
  getPokhById(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'GetPOKHByID' + id);
  }
  getPOKH(filterText: string, pageNumber: number, pageSize: number, customerId: number, userId: number, POType: number, status: number, group: number, startDate: Date, endDate: Date, warehouseId: number, employeeTeamSaleId: number): Observable<any> {
    return this.http.get<any>((this._url + 'GetPOKH'), {
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
    return this.http.post<any>(this._url + 'Handle', pokh);
  }
  deletePOKH(id: number): Observable<any> {
    return this.http.delete<any>(this._url + 'DeletePOKH' + id);
  }
  deleteRangePOKH(ids: number[]): Observable<any> {
    return this.http.post<any>(this._url + 'DeleteRangePOKH', ids);
  }
  loadEmployeeManagers(group: number = 0, userId: number = 0, teamId: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'GetEmployeeManager', {
      params: {
        group: group.toString(),
        userId: userId.toString(),
        teamId: teamId.toString()
      }
    });
  }
  loadProject(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadProject');
  }

  getTypePO(): Observable<any> {
    return this.http.get<any>(this._url + 'GetTypePO');
  }


  getCurrency(): Observable<any> {
    return this.http.get<any>(this._url + 'GetCurrency');
  }


  getPOKHProduct(id: number = 0, idDetail: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'LoadPOKHProduct', {
      params: {
        id: id.toString(),
        idDetail: idDetail.toString()
      }
    });
  }
  getPOKHFile(id: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'LoadPOKHFiles', {
      params: {
        id: id.toString()
      }
    });
  }
  generatePOCode(customer: string, isCopy: boolean, warehouseID: number, pokhID: number): Observable<any> {
    return this.http.get<any>(this._url + 'GeneratePOCode',
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
    return this.http.get<any>(this._url + 'LoadProduct');
  }
  loadUserDetail(id: number, idDetail: number): Observable<any> {
    return this.http.get<any>(this._url + 'LoadDetailUser',
      {
        params: {
          id: id,
          idDetail: idDetail
        }
      }
    )
  }
  uploadFiles(formData: FormData, pokhId: number): Observable<any> {
    return this.http.post<any>(`${this._url}Upload?poKHID=${pokhId}`, formData);
  }
  getPOKHByID(id: number):Observable<any>{
    return this.http.get<any>(this._url + 'GetPOKHByID',{
      params:{
        id:id.toString()
      }
    });
  }
  deleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post<any>(this._url + 'DeleteFile', fileIds);
  }
}
