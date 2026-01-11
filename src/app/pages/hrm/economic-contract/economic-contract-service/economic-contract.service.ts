import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EconomicContractService {
    private baseUrl = environment.host;

    constructor(private http: HttpClient) { }

    // EconomicContractTerm
    getEconomicContractTerms(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/EconomicContract/get-economic-contract-term`);
    }

    saveEconomicContractTerm(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/save-contract-term`, data);
    }

    deleteEconomicContractTerm(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/delete-term`, ids);
    }

    // EconomicContractType
    getEconomicContractTypes(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/EconomicContract/get-economic-contract-type`);
    }

    saveEconomicContractType(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/save-contract-type`, data);
    }

    deleteEconomicContractType(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/delete-type`, ids);
    }

    // EconomicContractFile
    getFileByContractId(contractId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/EconomicContract/get-file-by-contract-id?contractID=${contractId}`);
    }

    saveContractFile(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/save-contract-file`, data);
    }

    // EconomicContract
    getEconomicContracts(request: {
        dateStart: string;
        dateEnd: string;
        keyword: string;
        typeNCC: number;
        type: number;
    }): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/get-economic-contract`, request);
    }

    saveEconomicContract(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/save-contract`, data);
    }

    deleteEconomicContract(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/EconomicContract/delete-contract`, ids);
    }
}
