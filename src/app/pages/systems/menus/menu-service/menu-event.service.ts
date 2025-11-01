import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type MenuOpen = { groupKey: string; leafKey: string };

@Injectable({ providedIn: 'root' })
export class MenuEventService {
  private open$ = new Subject<MenuOpen>();
  onOpen$ = this.open$.asObservable();

  open(groupKey: string, leafKey: string) {
    this.open$.next({ groupKey, leafKey });
  }
}
