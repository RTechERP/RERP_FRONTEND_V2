import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LayoutEventService {

    private _reloadMain$ = new Subject<string>();
    toggleMenu$ = this._reloadMain$.asObservable();

    constructor() { }


    toggleMenu(key: string) {
        // console.log('layoutEvent:', key);
        this._reloadMain$.next(key);
    }
}
