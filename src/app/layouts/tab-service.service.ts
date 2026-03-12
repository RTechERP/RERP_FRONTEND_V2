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

    // Subject for closing a tab by key
    private closeTabByKeySource = new Subject<string>();
    closeTabByKey$ = this.closeTabByKeySource.asObservable();

    // Subject to notify other tabs that data was saved (emits a domain key, e.g. 'poncc')
    private dataSavedSource = new Subject<string>();
    dataSaved$ = this.dataSavedSource.asObservable();

    constructor() { }

    openTab(payload: TabPayload) {
        this.tabRequestSource.next(payload);
    }

    // Open a component as a tab
    openTabComp(payload: TabCompPayload) {
        console.log('[TabService] openTabComp called:', payload);
        this.tabCompRequestSource.next(payload);
    }

    // Close a component tab by its key
    closeTabByKey(key: string) {
        this.closeTabByKeySource.next(key);
    }

    // Notify subscribers that data was saved for a given domain key
    notifyDataSaved(key: string) {
        this.dataSavedSource.next(key);
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