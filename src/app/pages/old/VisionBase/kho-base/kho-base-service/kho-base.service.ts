import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class KhoBaseService {
  // private apiUrl = 'https://localhost:7187/api/';
  private _url = environment.host + 'api/';

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) { }

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;



  getGroupSaleUser(params: any): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getgroupsalesuser`,
      params
    );
  }
  getProjects(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getprojects`,
    );
  }
  getPM(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getpm`,
    );
  }
  getCustomers(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getcustomers`,
    );
  }
  getProjectStatus(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getprojectstatus`,
    );
  }
  getFirmBase(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getfirmbase`,
    );
  }
  getProjectTypeBase(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getprojecttypebase`,
    );
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getusers`,
    );
  }
  getEmployee(status: number): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getemployee?status=${status}`,

    );
  }
  getProjectByID(id: number): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getprojectbyid?id=${id}`,

    );
  }
  getFollowProjectBaseDetail(followProjectBaseID: number, projectID: number): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getfollowprojectbasedetail?followProjectBaseID=${followProjectBaseID}&projectID=${projectID}`,

    );
  }
  getCustomerBase(): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getcustomerbase`,

    );
  }
  getAPIFollowProjectBase() {
    return this._url + `followprojectbase/getfollowprojectbase`
  };
  getUpdateProject(ProjectStatusBaseID: number, ProjectID: number, LoginName: string): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getupdateproject?ProjectStatusBaseID=${ProjectStatusBaseID}&ProjectID=${ProjectID}&LoginName=${LoginName}`,

    );
  }
  getCheckExistFirmBase(firmBaseCode: string): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getcheckexistfirmbase?firmBaseCode=${firmBaseCode}`,

    );
  };
  getCheckExistProjectTypeBase(projectTypeBaseCode: string): Observable<any> {
    return this.http.get<any>(
      this._url + `followprojectbase/getcheckexistprojecttypebase?projectTypeBaseCode=${projectTypeBaseCode}`,
    );
  };
  
  postSaveFollowProjectBase(data: any): Observable<any> {
    return this.http.post<any>(
      this._url + `followprojectbase/savefollowprojectbase`,
      data
    );
  }
  postSaveProjectStatusLog(data: any): Observable<any> {
    return this.http.post<any>(
      this._url + `followprojectbase/saveprojectstatuslog`,
      data
    );
  }
  postSaveFirmBase(data: any): Observable<any> {
    return this.http.post<any>(
      this._url + `followprojectbase/savefirmbase`,
      data
    );
  }
  postSaveProjectTypeBase(data: any): Observable<any> {
    return this.http.post<any>(
      this._url + `followprojectbase/saveprojecttypebase`,
      data
    );
  }
  postImportExcel(data: any[]): Observable<any> {
    return this.http.post<any>(
      this._url + `followprojectbase/importexcel`,
      data
    );
  }

  // Export Excel Follow Project Base
  exportFollowProjectBaseExcel(params: {
    followProjectBaseID?: number,
    projectID?: number,
    userID?: number,
    customerID?: number,
    pm?: number,
    warehouseID?: number,
    filterText?: string,
    fileNameElement?: string
  }): Observable<Blob> {
    const httpParams = new HttpParams()
      .set('followProjectBaseID', (params.followProjectBaseID || 0).toString())
      .set('projectID', (params.projectID || 0).toString())
      .set('userID', (params.userID || 0).toString())
      .set('customerID', (params.customerID || 0).toString())
      .set('pm', (params.pm || 0).toString())
      .set('warehouseID', (params.warehouseID || 1).toString())
      .set('filterText', params.filterText || '')
      .set('fileNameElement', params.fileNameElement || '');

    return this.http.get(
      this._url + `followprojectbase/exportfollowprojectbase`,
      {
        params: httpParams,
        responseType: 'blob'
      }
    );
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
  setDataTree(flatData: any[], valueField: string): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Map từng item theo ID
    flatData.forEach((item) => {
      map.set(item[valueField], { ...item, _children: [] });
    });

    // Bước 2: Gắn item vào parent hoặc top-level
    flatData.forEach((item) => {
      const current = map.get(item[valueField]);
      if (item.ParentID && item.ParentID != 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(current);
        } else {
          tree.push(current);
        }
      } else {
        tree.push(current);
      }
    });

    return tree;
  }

}
