import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiCriteriaService {
  private _url = environment.host + 'api/KPICriteria/';

  constructor(private http: HttpClient) { }

  /**
   * Get list of KPI Criteria (matches api/KPICriteria/get-data)
   * @param quarter Quarter filter (1-4)
   * @param year Year filter
   * @param keywords Keyword search
   */
  getData(quarter: number, year: number, keywords: string = ''): Observable<any> {
    return this.http.get(`${this._url}get-data`, {
      params: {
        quarter: quarter.toString(),
        year: year.toString(),
        keywords: keywords
      }
    });
  }

  /**
   * Get KPI Criteria details by criteria ID (matches api/KPICriteria/get-detail)
   * @param id The ID of the criteria
   */
  getDetail(id: number): Observable<any> {
    return this.http.get(`${this._url}get-detail`, {
      params: {
        id: id.toString()
      }
    });
  }

  /**
   * Delete multiple KPI Criteria (matches api/KPICriteria/delete)
   * @param ids List of Criteria IDs to delete
   */
  delete(ids: number[]): Observable<any> {
    return this.http.post(`${this._url}delete`, ids);
  }

  /**
   * Get maximum STT for a given quarter and year
   * @param quarter Quarter filter
   * @param year Year filter
   */
  getMaxSTT(quarter: number, year: number): Observable<any> {
    return this.http.get(`${this._url}get-max-stt`, {
      params: {
        quarter: quarter.toString(),
        year: year.toString()
      }
    });
  }

  /**
   * Save (Add/Edit) KPI Criteria (matches api/KPICriteria/save-data)
   * @param data Criteria data to save
   */
  saveData(data: any): Observable<any> {
    return this.http.post(`${this._url}save-data`, data);
  }

  /**
   * Copy KPI Criteria from source quarter/year to destination quarter/year
   * This will delete existing criteria in target quarter/year and copy from source
   * @param quarter Source quarter (from filter)
   * @param year Source year (from filter)
   * @param quarterCopyTo Destination quarter (from modal input)
   * @param yearCopyTo Destination year (from modal input)
   */
  copyCriteria(quarter: number, year: number, quarterCopyTo: number, yearCopyTo: number): Observable<any> {
    return this.http.post(`${this._url}copy-criteria`, null, {
      params: {
        quarter: quarter.toString(),
        year: year.toString(),
        quarterCopyTo: quarterCopyTo.toString(),
        yearCopyTo: yearCopyTo.toString()
      }
    });
  }
}

