import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { KpiEmployeeTeamService } from '../kpi-employee-team-service/kpi-employee-team.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-copy-team',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzSelectModule,
        NzInputNumberModule,
        NzFormModule,
        NzSpinModule,
    ],
    templateUrl: './copy-team.component.html',
    styleUrl: './copy-team.component.css'
})
export class CopyTeamComponent implements OnInit {
    @Output() onSaved = new EventEmitter<any>();

    // Form model
    quarterFrom: number = 1;
    quarterTo: number = 1;
    yearFrom: number = new Date().getFullYear();
    yearTo: number = new Date().getFullYear();
    departmentId: number = 0;

    // Dropdown data
    departments: any[] = [];
    quarters: number[] = [1, 2, 3, 4];

    // Loading state
    isLoading: boolean = false;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiEmployeeTeamService: KpiEmployeeTeamService
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.loadDepartments();
    }

    loadData(): void {
        const now = new Date();
        this.yearFrom = now.getFullYear();
        this.yearTo = now.getFullYear();
        this.quarterTo = Math.ceil((now.getMonth() + 1) / 3);
        this.quarterFrom = this.quarterTo > 1 ? this.quarterTo - 1 : 4;
        if (this.quarterFrom === 4 && this.quarterTo === 1) {
            this.yearFrom = this.yearTo - 1;
        }
    }

    loadDepartments(): void {
        this.kpiEmployeeTeamService.getDepartments().subscribe({
            next: (response) => {
                if (response?.status === 1) {
                    // Add "All departments" option
                    this.departments = [
                        { ID: 0, Name: '--Tất cả các phòng--' },
                        ...(response.data || []).sort((a: any, b: any) => (a.STT || 0) - (b.STT || 0))
                    ];
                }
            },
            error: (error) => {
                console.error('Error loading departments:', error);
            }
        });
    }

    validate(): boolean {
        if (this.quarterFrom === this.quarterTo && this.yearFrom === this.yearTo) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Quý/Năm mới phải khác Quý/Năm cũ!');
            return false;
        }

        if (this.quarterFrom > this.quarterTo && this.yearFrom >= this.yearTo) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Quý/Năm mới phải lớn hơn Quý/Năm cũ!');
            return false;
        }

        return true;
    }

    copy(): void {
        if (!this.validate()) return;

        this.isLoading = true;

        const request = {
            OldQuarter: this.quarterFrom,
            NewQuarter: this.quarterTo,
            OldYear: this.yearFrom,
            NewYear: this.yearTo,
            DepartmentID: this.departmentId > 0 ? this.departmentId : undefined
        };

        this.kpiEmployeeTeamService.copyTeam(request).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Copy thành công!');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Copy thất bại');
                }
            },
            error: (error) => {
                this.isLoading = false;
                const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
