import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotifyItem } from '../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _items = new BehaviorSubject<NotifyItem[]>([]);
  items$ = this._items.asObservable();

  get items(): NotifyItem[] {
    return this._items.getValue();
  }

  setItems(items: NotifyItem[]): void {
    this._items.next(items);
  }

  addItem(item: NotifyItem): void {
    const exists = this._items.getValue().some(x => x.id === item.id);
    if (!exists) {
      this._items.next([...this._items.getValue(), item]);
    }
  }
}
