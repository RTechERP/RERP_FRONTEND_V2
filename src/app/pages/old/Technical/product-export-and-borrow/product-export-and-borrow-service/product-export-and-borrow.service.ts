import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProductExportAndBorrowService {
  private url = `${environment.host}api/ProductExportAndBorrow/`;

  constructor(private http: HttpClient) {}
  getProductExportAndBorrow(request: any) {
    return this.http.post<any>(
      `${this.url + `get-product-export-and-borrow`}`,
      request
    );
  }
  getProductExportAndBorrowAjax(): string {
    return `${this.url}get-product-export-and-borrow`;
  }
}
