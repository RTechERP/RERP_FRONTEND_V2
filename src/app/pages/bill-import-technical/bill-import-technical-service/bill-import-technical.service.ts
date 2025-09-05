import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class BillImportTechnicalService {
  private url = `${API_ORIGIN}api/BillImportTechnical/`;
   private urlCustomer = `${API_ORIGIN}api/Customer/get-customers`;
     private urlNCC = `${API_ORIGIN}api/SupplierSale/get-ncc`;
       private urlRulepay = `${API_ORIGIN}api/BillImportTechnical/get-rulepay`;
  constructor(private http: HttpClient) { } 
  getBillimportTechnical(request: any) {
    return this.http.post<any>(`${this.url + `get-bill-import-technical`}`, request);
  }
  getBillImport(): string {
    return this.url+`get-bill-import-technical`;
  }
  getBillImportDetail(id: number): Observable<any> {
    const url = `${this.url + `get-bill-import-technical-detail`}?ID=${id}`;
    return this.http.get<any>(url);
  }
  getDocumentBillImport(poNCCId: number, billImportID: number): Observable<any> {
  const params = new HttpParams()
    .set('poNCCId', poNCCId)
    .set('billImportID', billImportID);
  const url = `${this.url}get-document-bill-import`;
  return this.http.get<any>(url, { params });
}
getCustomer():Observable<any>
{
  return this.http.get<any>(this.urlCustomer);
}
getNCC():Observable<any>
{
  return this.http.get<any>(this.urlNCC);
}
getRulepay():Observable<any>
{
  return this.http.get<any>(this.urlRulepay);
}
getBillCode(billtype: number): Observable<any> {
  const params = new HttpParams().set('billtype', billtype);
  const url = `${this.url}get-bill-code`;
  return this.http.get<any>(url, { params });
}
saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload)
  }
  getSerialByID(id: number): Observable<any> {
    const url = `${this.url + `get-serialbyID`}?id=${id}`;
    return this.http.get<any>(url);
  }
  getBillImportByCode(billCode: string): Observable<any> {
  const params = new HttpParams().set('billCode', billCode);
  const url = `${this.url}get-bill-import-by-code`;
  return this.http.get<any>(url, { params });
}

  exportBillImportTechnical(request: any): Observable<Blob> {
  return this.http.post(`${this.url}export-bill-import-technical`, request, {
    responseType: 'blob'
  });
}

}
