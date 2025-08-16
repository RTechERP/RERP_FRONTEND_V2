import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductsaleServiceService {
  private baseUrl = `https://localhost:7187/api/ProductSale`;
  private warehouseUrl =`https://localhost:7187/api/Warehouse`;
  private productgroupUrl=`https://localhost:7187/api/ProductGroup`;
  private productgroupwarehouseUrl=`https://localhost:7187/api/ProductGroupWareHouse`;
  private locationUrl=`https://localhost:7187/api/Location`;
  private unitcountUrl=`https://localhost:7187/api/UnitCount`;
  private frimUrl=`https://localhost:7187/api/Firm`;
  private employeeUrl=`https://localhost:7187/api/Employee`;

  constructor(private httpclient: HttpClient) {}

  getdataProductGroup(warehouseCode:string, isvisible:boolean): Observable<any> {
    return this.httpclient.get<any>(`${this.productgroupUrl}?isvisible=${isvisible}&warehousecode=${warehouseCode}`);
  }
  getdataProductSalebyID(id: number, keyword: string, checkedAll: boolean): Observable<any> {
    const params: any = {
      id: id?.toString() || '0',
      find: keyword?.trim() || '',
      checkedAll: checkedAll
    };
    
    return this.httpclient.post(`${this.baseUrl}`,  params );
  }
  // getdataProductSalebyIDGroup(id:number){
  //   return this.httpclient.get<any>(`${this.baseUrl}/get-product-sale-by-product-group?productgroupID=`+id);
  // }
  getdataEmployee(){
    return this.httpclient.get<any>(`${this.employeeUrl}/?status=0&departmentid=0`);
  }
  getdataWareHouse(){
    return this.httpclient.get<any>(`${this.warehouseUrl}`);
  }
  savedataProductGroup(data: any){
    return this.httpclient.post<any>(`${this.productgroupUrl}/save-data`,data);
  }
  getdataProductGroupbyID(id:number){
    return this.httpclient.get<any>(`${this.productgroupUrl}/`+id);
  }
  getdataProductGroupWareHouse(productgroupID:number,warehouse:number):Observable<any>{
    const params:any={
      warehouseID:warehouse || '0',
      productgroupID:productgroupID.toString()||'0'
    };
    return this.httpclient.get(`${this.productgroupwarehouseUrl}`,{ params });
    }

  getdataUnitCount(){
    return this.httpclient.get<any>(`${this.unitcountUrl}`);
  }
  getDataProductGroupcbb(){
    return this.httpclient.get<any>(`${this.productgroupUrl}?isvisible=true`);
  }
  getDataFirm(){
    return this.httpclient.get<any>(`${this.frimUrl}`);
  }
  getDataLocation(productgroupID: number){
    
    return this.httpclient.get<any>(`${this.locationUrl}/get-location-by-product-group?productgroupID=`+productgroupID);
  }
  saveDataProductSale(data:any){
    return this.httpclient.post<any>(`${this.baseUrl}/save-data`,data);
  }
  getDataProductSalebyID(id:number){
    return this.httpclient.get<any>(`${this.baseUrl}/`+id)
  }
  saveDataFirm(data:any){
    return this.httpclient.post<any>(`${this.frimUrl}/save-data`,data)
  }
  saveDataLocation(data:any){
    return this.httpclient.post<any>(`${this.locationUrl}/save-data`,data)
  }
  saveDataUnitCount(data:any){
    return this.httpclient.post<any>(`${this.unitcountUrl}/save-data`,data)
  }
  checkProductSaleCodes(data:any){
    return this.httpclient.post<any>(`${this.baseUrl}/check-codes`,data)
  }
  }

