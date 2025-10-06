import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { AuthService } from '../../../../auth/auth.service';
@Component({
  selector: 'app-app-user-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    NzDropDownModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzSwitchModule,
  ],
  templateUrl: './app-user-dropdown.component.html',
  styleUrls: ['./app-user-dropdown.component.css'],
})
export class AppUserDropdownComponent {
  employeeCode: string = '';
  fullName: string = '';
  positionName: string = '';
  constructor(private auth: AuthService, private router: Router) {}
  ngOnInit(): void {
    this.decodeToken();
  }

  decodeToken() {
    const token = this.auth.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('decoded token:', decoded);
        this.employeeCode = decoded.code;
        this.fullName = decoded.fullname;
        this.positionName = decoded.positionname;
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }
  onLogout() {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
