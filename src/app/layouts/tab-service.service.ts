import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TabServiceService {

    private tabRequestSource = new Subject<TabPayload>();
    tabRequest$ = this.tabRequestSource.asObservable();
    constructor() { }

    openTab(payload: TabPayload) {
        this.tabRequestSource.next(payload);
    }


}


export interface TabPayload {
    route: string;
    title: string;
    queryParams?: any;
}