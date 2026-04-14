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
import { environment } from '../../../../environments/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';

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
        NzDividerModule
    ],
    templateUrl: './personal-infomation.component.html',
    styleUrls: ['./personal-infomation.component.css']
})
export class PersonalInfomationComponent implements OnInit {
    employee: EmployeeDTON60 | null = null;
    isLoading = true;
    host = environment.host;

    constructor(
        private http: HttpClient,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;
        this.http.get<any>(`${this.host}api/home/personal-information`).subscribe({
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
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
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
}
