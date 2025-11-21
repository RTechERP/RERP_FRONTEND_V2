import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierSaleService {

  private apiUrl = environment.host + 'api/SupplierSale/';
  private apiUrlProject = environment.host + 'api/Project/';

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) { }

  // Danh sách sale NCC
  getSupplierSaleByID(supplierSaleID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getsalesupplierbyid?supplierID=${supplierSaleID}`,
    );
  }
  getSupplierSale() {
    return this.apiUrl + `supplier-sale`;
  }
  // Danh sách sale supplier sale contact
  getSupplierSaleContact(supplierID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `supplier-sale-contact?supplierID=${supplierID}`,
    );
  }
  // get project employee
  getProjectEmployee(status: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrlProject + `get-project-employee/${status}`
    );
  }
  // get document sale admin
  getDocumentSaleAdmin(departmentID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getdocumentsaleadmin/${departmentID}`
    );
  }
  // get documentfile
  getDocumentFile(documentID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getdocumentfile/${documentID}`
    );
  }

  // get documentfile
  getDocumentType(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getdocumenttype/`
    );
  }
  // get document by id
  getDocument(documentID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getdocument/${documentID}`
    );
  }

  // get rule pay
  getRulePay(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getrulepay`
    );
  }
  // get department
  getDepartment(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getdepartment`
    );
  }
  // get tax company
  getTaxCompany(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `gettaxcompany`
    );
  }
  // check exist code document
  getCheckExistDocument(code: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `getcheckexistdocument?code=${code}`
    );
  }
  // tải xuống document file
  downloadDocumentFile(
    arrDocumentFileID: number[],
    documentType: string,
    departmentCode: string
  ) {
    const form = new FormData();
    form.append('departmentCode', departmentCode);
    form.append('documentType', documentType);
    arrDocumentFileID.forEach(id => form.append('arrDocumentFileID', String(id)));


    return this.http.post<any>(
      this.apiUrl + 'downloaddocumentfile',
      form
    );
  }

  // đẩy file lên server và lưu document file
  uploadDocumentFiles(
    departmentCode: string,
    documentType: string,
    documentID: number,
    files: File[]
  ) {
    const form = new FormData();
    form.append('departmentCode', departmentCode);
    form.append('documentType', documentType);
    form.append('documentID', documentID.toString());

    files.forEach(file => {
      form.append('files', file, file.name); // 'files' trùng với List<IFormFile> files
    });

    return this.http.post(
      this.apiUrl + 'uploaddocumentfiles',
      form
    );
  }


  // lưu supplier Sale
  saveSupplierSale(
    supplierSale: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `supplier-sale`, supplierSale
    );
  }
  // lưu document file
  saveDocumentFile(
    documentfile: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `savedocumentfile`, documentfile
    );
  }

  // lưu supplier Sale Contact
  saveSupplierSaleContact(
    supplierSaleContact: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `supplier-sale-contact`, supplierSaleContact
    );
  }
  // lưu document
  saveDocument(
    document: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `savedocument`, document
    );
  }
}
