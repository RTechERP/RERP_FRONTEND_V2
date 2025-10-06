import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

export interface NotifyItem {
  id: number;
  time: string;
  text?: string;
  title?: string;
  detail?: string;
  group?: 'today' | 'yesterday' | 'other';
  icon?: string;
}
@Component({
  selector: 'app-app-notifycation-dropdown',
  standalone: true,
  imports: [CommonModule, NzDropDownModule, NzIconModule, NzBadgeModule],
  templateUrl: './app-notifycation-dropdown.component.html',
  styleUrls: ['./app-notifycation-dropdown.component.css']
})
export class AppNotifycationDropdownComponent {
  @Input() title = 'Thông báo';
  @Input() items: NotifyItem[] = [];
  @Output() itemClick = new EventEmitter<NotifyItem>();

  get today()     { return this.items.filter(x => x.group === 'today'); }
  get yesterday() { return this.items.filter(x => x.group === 'yesterday'); }
  get other()     { return this.items.filter(x => !x.group || x.group === 'other'); }
  get count()     { return this.today.length + this.yesterday.length + this.other.length; }

  onPick(n: NotifyItem) { this.itemClick.emit(n); }
  trackById(_: number, it: NotifyItem) { return it.id; }
}
