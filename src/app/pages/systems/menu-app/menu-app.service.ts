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

    getAll(keyword: string = ''): Observable<any> {
        return this.http.get<MenuApp>(this.url + `?keyword=${keyword}`);
    }

    saveData(menu: MenuApp): Observable<any> {
        return this.http.post<any>(this.url + '/save-data', menu);
    }

    sortBySTTImmutable(
        items: any[],
        getOrder: (item: any) => number,
        childrenKeys: string[] = ['children']
    ): any[] {

        // console.log('items:', items);
        // console.log('getOrder:', getOrder);
        // console.log('childrenKeys:', childrenKeys);

        const itemsort = [...items]
            .sort((a, b) => getOrder(a) - getOrder(b))
            .map(item => {
                // tìm key children đang tồn tại trên item
                const childKey = childrenKeys.find(k => Array.isArray(item[k]));

                if (!childKey) {
                    return { ...item }; // không có children
                }

                return {
                    ...item,
                    [childKey]: this.sortBySTTImmutable(
                        item[childKey],
                        getOrder,
                        childrenKeys
                    )
                };
            });
        // console.log('itemsort:', itemsort);
        return itemsort;
    }


}
