import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectApplicationTypesService {
  private apiUrl = environment.host + 'api/';
  private apiProjectApplicationType = this.apiUrl + 'projectapplicationtypes/';
  private apiProjectTechnologies = this.apiUrl + 'projecttechnologies/';
  constructor(private http: HttpClient) {}

  getProjectApplicationType(ProjectTypeID: number): Observable<any> {
    const asset: any = {
      ProjectTypeID: ProjectTypeID || 0,
    };
    return this.http.get<any>(
      this.apiProjectApplicationType + `project-application-type`,
      { params: asset },
    );
  }

  saveProjectApplicationType(data: any): Observable<any> {
    return this.http.post(
      this.apiProjectApplicationType + `save-project-application-type`,
      data,
    );
  }

  getProjectTechnology(ProjectTypeID: number): Observable<any> {
    const asset: any = {
      ProjectTypeID: ProjectTypeID || 0,
    };
    return this.http.get<any>(
      this.apiProjectTechnologies + `project-technology`,
      { params: asset },
    );
  }
  saveProjectTechnology(data: any): Observable<any> {
    return this.http.post(
      this.apiProjectTechnologies + `save-project-technology`,
      data,
    );
  }

  deleteProjectTechnology(ids: number[]): Observable<any> {
    return this.http.post(
      this.apiProjectTechnologies + `delete`,
      ids,
    );
  }

  deleteProjectApplicationType(ids: number[]): Observable<any> {
    return this.http.post(
      this.apiProjectApplicationType + `delete`,
      ids,
    );
  }
}
