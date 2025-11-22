import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';

export type MenuOpen = { groupKey: string; leafKey: string };

export interface TabOpenData {
  comp: Type<any>;
  title: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class MenuEventService {
  private open$ = new Subject<MenuOpen>();
  onOpen$ = this.open$.asObservable();

  private openTab$ = new Subject<TabOpenData>();
  onOpenTab$ = this.openTab$.asObservable();

  open(groupKey: string, leafKey: string) {
    this.open$.next({ groupKey, leafKey });
  }

  /**
   * Mở một tab mới với component và data
   * @param comp Component class cần mở
   * @param title Tiêu đề của tab
   * @param data Dữ liệu truyền vào component thông qua injector
   */
  openNewTab(comp: Type<any>, title: string, data?: any) {
    this.openTab$.next({ comp, title, data });
  }
}
