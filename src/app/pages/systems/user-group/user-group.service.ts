import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserGroupService {
    private url = environment.host + 'api/UserGroup';

    constructor(private http: HttpClient) { }

    getAll(keyword: string = '', userId: number = 0): Observable<any> {
        return this.http.get<any>(`${this.url}/getall?keyword=${keyword}&userId=${userId}`);
    }

    getGroupLinks(userGroupId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-group-links?userGroupId=${userGroupId}`);
    }

    getRightsDistribution(userGroupId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-rights-distribution?userGroupId=${userGroupId}`);
    }

    addUsersToGroup(userIds: string, userGroupId: number): Observable<any> {
        return this.http.post<any>(`${this.url}/add-users-to-group?userIds=${userIds}&userGroupId=${userGroupId}`, {});
    }

    save(item: any): Observable<any> {
        return this.http.post<any>(`${this.url}/save`, item);
    }

    delete(id: number): Observable<any> {
        return this.http.post<any>(`${this.url}/delete?id=${id}`, {});
    }

    deleteLink(id: number): Observable<any> {
        return this.http.post<any>(`${this.url}/delete-link?id=${id}`, {});
    }

    getGroupPermissionTree(userGroupId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-group-permission-tree?userGroupId=${userGroupId}`);
    }

    saveGroupPermissions(req: any): Observable<any> {
        return this.http.post<any>(`${this.url}/save-group-permissions`, req);
    }

    getGroupsByUser(userId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-groups-by-user?userId=${userId}`);
    }

    copyUserGroups(req: any): Observable<any> {
        return this.http.post<any>(`${this.url}/copy-user-groups`, req);
    }
}
