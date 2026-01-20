import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TabServiceService {

    private tabRequestSource = new Subject<TabPayload>();
    tabRequest$ = this.tabRequestSource.asObservable();

    // Subject for component-based tabs
    private tabCompRequestSource = new Subject<TabCompPayload>();
    tabCompRequest$ = this.tabCompRequestSource.asObservable();

    constructor() { }

    openTab(payload: TabPayload) {
        this.tabRequestSource.next(payload);
    }

    // Open a component as a tab
    openTabComp(payload: TabCompPayload) {
        console.log('[TabService] openTabComp called:', payload);
        this.tabCompRequestSource.next(payload);
    }
}


export interface TabPayload {
    route: string;
    title: string;
    queryParams?: any;
}

export interface TabCompPayload {
    comp: Type<any>;
    title: string;
    key: string;
    data?: any;
}