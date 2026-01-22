import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment.host } from '../../../app.config';
// import { DateTime } from 'luxon';
import { NumberSymbol } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HandoverService {

  constructor(private http: HttpClient) {}

    getHandover(
    DepartmentID: number,
    EmployeeID: number,
    LeaderID: number,
    Keyword: string,
    DateStart: Date,
    DateEnd: Date
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID|| 0,
      EmployeeID: EmployeeID || 0,
      LeaderID: LeaderID || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
      DateEnd: DateEnd
    };
    return this.http.post<any>(
      environment.host + `api/handover/get-handover`,
      asset
    );
  }
getHandoverData(HandoverID?: number, EmployeeID?: number, LeaderID?: number): Observable<any> {
   const now = new Date();
  const formattedDateEnd = now.toISOString().slice(0, 19).replace('T', ' '); 

  const asset: any = {
    PageNumber: 1,
    PageSize: 9999,
    DateBegin: '2022-09-01 00:00:00',
    DateStart: '2022-09-01 00:00:00',
    DateEnd: formattedDateEnd,
    ProductGroupID: 0,
    ReturnStatus: 0,
    FilterText: '',
    WareHouseID: 1,
  };

  // Gán điều kiện theo thực tế
  if (HandoverID !== undefined && HandoverID !== null) {
    asset.HandoverID = HandoverID;
  }
  if (EmployeeID !== undefined && EmployeeID !== null) {
    asset.EmployeeID = EmployeeID;
  }
   if (LeaderID !== undefined && LeaderID !== null) {
    asset.LeaderID = LeaderID;
  }

  return this.http.post<any>(
    environment.host + `api/handover/get-handover-data`,
    asset
  );
}

getDataDepartment(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-departments`);
  }
  getDataPosition(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-position`);
  }
  getAllEmployee(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-all-employees`);
  }
     getDataEmployee(Status: number): Observable<any> {
    const asset: any = { Status };
    return this.http.post<any>(
      environment.host + `api/handover/get-employees`,
      asset
    );
  }
      getHandoverID(id: number) {
    return this.http.get<any>(
      environment.host + `api/handover/get-handover/${id}`
    );
  }
    saveData(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/handover/save-data-handover`,
      data
    );
  }
      exportExcel(id: number) {
    return this.http.get(environment.host + `api/handover/export-excel/${id}`, {
      responseType: 'blob', 
    });
  }

    approve(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/handover/approved`,
      data
    );
  }


  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'Handover');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(environment.host +`api/home/upload-multiple`, formData);
  }


}
