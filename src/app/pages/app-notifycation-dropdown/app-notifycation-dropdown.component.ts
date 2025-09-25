import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge'; // nếu dùng badge

export interface NotifyItem {
  icon: string;
  text: string;
  time: string;
  group?: 'today' | 'yesterday' | 'other';
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
  @Input() count = 0;
  @Input() items: NotifyItem[] = [];
  @Output() itemClick = new EventEmitter<NotifyItem>();

  get today()     { return this.items.filter(x => x.group === 'today'); }
  get yesterday() { return this.items.filter(x => x.group === 'yesterday'); }
  get other()     { return this.items.filter(x => !x.group || x.group === 'other'); }

  onPick(n: NotifyItem) { this.itemClick.emit(n); }
}
