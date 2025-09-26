import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-app-user-dropdown',
  standalone: true,
  imports: [CommonModule, NzDropDownModule, NzMenuModule, NzIconModule, NzButtonModule],
  templateUrl: './app-user-dropdown.component.html',
  styleUrls: ['./app-user-dropdown.component.css']
})
export class AppUserDropdownComponent {
  onLogout() {
    // TODO: gọi API logout + navigate('/login')
  }
}
