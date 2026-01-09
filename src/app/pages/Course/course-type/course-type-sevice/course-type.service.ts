import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CourseTypeService {

  constructor(private http: HttpClient) { }
  private _url = environment.host + 'api/CourseType/';

  getAllCourseType(): Observable<any> {
    return this.http.get<any>(this._url + 'get-all');
  }

  saveCourseType(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', payload);
  }
}
