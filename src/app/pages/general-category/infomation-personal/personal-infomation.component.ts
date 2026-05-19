import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { environment } from '../../../../environments/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { PersonalInfomationService } from './personal-infomation.service';

export interface EmployeeDTON60 {
    ID: number;
    Code: string;
    FullName: string;
    Position: string;
    ChucVu: string;
    DepartmentName: string;
    BirthOfDate: string;
    GioiTinhText: string;
    SDTCaNhan: string;
    EmailCaNhan: string;
    HomeAddress: string;
    Resident: string;
    StartWorking: string;
    BankAccount: string;
    MST: string;
    CMTND: string;
    NgayCap: string;
    NoiCap: string;
    Qualifications: string;
    Major: string;
    SchoolName: string;
    ImagePath: string;
    DanToc: string;
    TonGiao: string;
    DcThuongTru: string;
    DcTamTru: string;
    LoaiHDLD: string;
}

@Component({
    selector: 'app-personal-infomation',
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        NzGridModule,
        NzAvatarModule,
        NzDescriptionsModule,
        NzTagModule,
        NzSpinModule,
        NzIconModule,
        NzDividerModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzModalModule
    ],
    templateUrl: './personal-infomation.component.html',
    styleUrls: ['./personal-infomation.component.css']
})
export class PersonalInfomationComponent implements OnInit {
    employee: EmployeeDTON60 | null = null;
    editEmployee: EmployeeDTON60 | null = null;
    isLoading = true;
    isEditingPersonal = false;
    isSaving = false;
    host = environment.host;

    constructor(
        private notification: NzNotificationService,
        private modal: NzModalService,
        private personalService: PersonalInfomationService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this.personalService.getPersonalInformation().subscribe({
            next: (res) => {
                if (res.status === RESPONSE_STATUS.SUCCESS) {
                    this.employee = Array.isArray(res.data) ? res.data[0] : res.data;
                } else {
                    this.notification.create(
                        NOTIFICATION_TYPE_MAP[res.status] || 'error',
                        NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Lỗi',
                        res.message || 'Lỗi tải thông tin',
                        {
                            nzStyle: { whiteSpace: 'pre-line' }
                        }
                    );
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.notification.create(
                    'error',
                    NOTIFICATION_TITLE.error,
                    err?.error?.message || 'Lỗi kết nối máy chủ',
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    }
                );
                this.isLoading = false;
            }
        });
    }

    getAvatarUrl(): string {
        if (!this.employee?.ImagePath) return 'assets/icon/user.png';
        const url = this.employee.ImagePath.replace(/\\/g, '/');
        if (url.startsWith('http')) return url;
        return this.host + 'api/share/' + url;
    }

    toggleEditPersonal(): void {
        this.isEditingPersonal = !this.isEditingPersonal;
        if (this.isEditingPersonal && this.employee) {
            this.editEmployee = { ...this.employee };
        }
    }

    cancelEditPersonal(): void {
        this.isEditingPersonal = false;
        this.editEmployee = null;
    }

    savePersonal(): void {
        if (!this.editEmployee || !this.employee) return;

        // Validate phone number
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        if (this.editEmployee.SDTCaNhan && !phoneRegex.test(this.editEmployee.SDTCaNhan)) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Số điện thoại không đúng định dạng!'
            );
            return;
        }

        // Validate email
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i;
        if (this.editEmployee.EmailCaNhan && !emailRegex.test(this.editEmployee.EmailCaNhan)) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Email không đúng định dạng!'
            );
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: 'Bạn có chắc chắn muốn cập nhật thông tin cá nhân này không?',
            nzOnOk: () => {
                this.executeSave();
            }
        });
    }

    private executeSave(): void {
        if (!this.editEmployee || !this.employee) return;

        this.isSaving = true;
        const payload = {
            EmployeeID: this.employee.ID,
            SDTCaNhan: this.editEmployee.SDTCaNhan,
            EmailCaNhan: this.editEmployee.EmailCaNhan
        };

        this.personalService.updatePersonalInformation(payload).subscribe({
            next: (res) => {
                if (res.status === RESPONSE_STATUS.SUCCESS) {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        res.message || 'Cập nhật thành công'
                    );
                    this.employee = { ...this.employee, ...payload } as EmployeeDTON60;
                    this.isEditingPersonal = false;
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        res.message || 'Cập nhật thất bại'
                    );
                }
                this.isSaving = false;
            },
            error: (err) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message || 'Lỗi kết nối máy chủ'
                );
                this.isSaving = false;
            }
        });
    }
}
