import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { AuthService } from '../../../auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangePasswordComponent } from '../../../auth/change-password/change-password.component';
import { PersonalInfomationComponent } from '../../general-category/infomation-personal/personal-infomation.component';
@Component({
  selector: 'app-app-user-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDropDownModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzSwitchModule,
    NgbModalModule
  ],
  templateUrl: './app-user-dropdown.component.html',
  styleUrls: ['./app-user-dropdown.component.css'],
})
export class AppUserDropdownComponent {
  employeeCode: string = '';
  fullName: string = '';
  positionName: string = '';
  autoLogin: boolean = false;
  constructor(
    private auth: AuthService,
    private router: Router,
    private notification: NzNotificationService,
    private ngbModal: NgbModal,
    private tabService: TabServiceService
  ) { }
  ngOnInit(): void {
    this.decodeToken();
  }

  decodeToken() {
    const token = this.auth.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // console.log('decoded token:', decoded);
        this.employeeCode = decoded.code;
        this.fullName = decoded.fullname;
        this.positionName = decoded.positionname;
      } catch (error: any) {
        // console.error('Invalid token', error);
        this.notification.error(NOTIFICATION_TITLE.error, error);
      }
    }
  }
  onLogout() {
    this.auth.logout();
    localStorage.removeItem('auto_login');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  onChangePassword() {
    this.ngbModal.open(ChangePasswordComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
  }

  profile() {
    this.tabService.openTabComp({
      comp: PersonalInfomationComponent,
      title: 'Thông tin cá nhân',
      key: 'personal-information',
    });
    this.router.navigateByUrl('/personal-information');
  }

  onAutoLoginChange(value: boolean): void {
    if (value) {
      localStorage.setItem('auto_login', 'true');
    } else {
      localStorage.removeItem('auto_login');
    }
  }
}