import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

interface PersonalPropertyDTO {
    AssetID: number;
    AssetCategory: number;
    IsApprove: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssetPersonalService {
    private url = `${environment.host}api/Assets`;

    constructor(private http: HttpClient) { }

    getPersonalProperties(params: {
        dateStart: string;
        dateEnd: string;
        receiverID?: number;
        assetCategory?: number;
    }): Observable<any> {
        const queryParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd)
            .set('receiverID', (params.receiverID || 0).toString())
            .set('assetCategory', (params.assetCategory ?? -1).toString());

        return this.http.get<any>(`${this.url}/get-personal-properties`, { params: queryParams });
    }

    getPersonalPropertyDetails(assetID: number, assetCategory: number): Observable<any> {
        const queryParams = new HttpParams()
            .set('assetID', assetID.toString())
            .set('assetCategory', assetCategory.toString());

        return this.http.get<any>(`${this.url}/get-personal-property-details`, { params: queryParams });
    }

    getAssetPerson(params: {
        FilterText?: string;
        PageNumber?: number;
        PageSize?: number;
        DateStart?: string;
        DateEnd?: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.url}/get-asset-person`, params);
    }

    changeStatusAsset(asset: PersonalPropertyDTO): Observable<any> {
        return this.http.post<any>(`${this.url}/change-status-asset`, asset);
    }
}
