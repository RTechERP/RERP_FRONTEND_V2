import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsaleServiceService {
  private baseUrl = `https://localhost:7187/api/ProductsSale`;

  constructor(private httpclient: HttpClient) {}

  getdataProductGroup(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/getdataproductgroup`);
  }
  getdataProductSalebyID(id: number, keyword: string, checkeedAll: boolean): Observable<any> {
    const params: any = {
      id: id?.toString() || '0',
      find: keyword?.trim() || '',
      checkeedAll: checkeedAll.toString()
    };
    
    return this.httpclient.get(`https://localhost:7187/api/ProductsSale/getproductsale`, { params });
  }
  getdataProductSalebyIDGroup(id:number){
    return this.httpclient.get<any>(`${this.baseUrl}/getProductbyidgroup?id=`+id);
  }
  getdataEmployee(){
    return this.httpclient.get<any>(`${this.baseUrl}/getdataEmployee`);
  }
  getdataWareHouse(){
    return this.httpclient.get<any>(`${this.baseUrl}/getdatawh`);
  }
  addnewProductGroup(data: any){
    return this.httpclient.post<any>(`${this.baseUrl}/savedatagroup`,data);
  }
  deleteProductGroup(data:any){
    return this.httpclient.post<any>(`${this.baseUrl}/deleteproductgroup`,data);
  }
  getdataProductGroupbyID(id:number){
    return this.httpclient.get<any>(`${this.baseUrl}/getdataproductgroupbyid?id=`+id);
  }
  getdataProductGroupWareHouse(productgroupID:number):Observable<any>{
    const params:any={
      warehouseID:'0',
      productgroupID:productgroupID.toString()||'0'
    };
    return this.httpclient.get(`https://localhost:7187/api/ProductsSale/getdatproductgroupwh`,{ params });
    }
  updateProductGroup(data: any) {
    return this.httpclient.post<any>(`${this.baseUrl}/savedatagroup`, data);
  }
  }

