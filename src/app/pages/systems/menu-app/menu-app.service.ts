import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuApp } from './model/menu-app';

@Injectable({
    providedIn: 'root'
})
export class MenuAppService {

    private url = environment.host + 'api/menuapp';
    constructor(private http: HttpClient) { }

    getAll(): Observable<any> {
        return this.http.get<MenuApp>(this.url);
    }

    saveData(menu: MenuApp): Observable<any> {
        return this.http.post<any>(this.url + '/save-data', menu);
    }
}
