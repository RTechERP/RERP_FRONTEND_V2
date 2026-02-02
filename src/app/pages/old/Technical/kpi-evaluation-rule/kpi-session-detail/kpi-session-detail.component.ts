import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { KpiEvaluationRuleService } from '../kpi-evaluation-rule-service/kpi-evaluation-rule.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-session-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzInputNumberModule,
        NzButtonModule,
        NzSelectModule,
        NzCheckboxModule,
        NzCardModule,
        NzSpinModule,
        NzModalModule,
    ],
    templateUrl: './kpi-session-detail.component.html',
    styleUrl: './kpi-session-detail.component.css'
})
export class KpiSessionDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() departmentId: number = 0;
    @Input() session: any = null;
    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    year: number = new Date().getFullYear();
    quarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
    selectedDepartmentId: number = 0;
    code: string = '';
    name: string = '';

    // Copy mode
    isCopy: boolean = false;
    fromSessionId: number = 0;

    // Dropdown data
    departments: any[] = [];
    kpiSessions: any[] = [];

    // Validation errors
    errors: any = {};

    // Loading state
    isLoading: boolean = false;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private kpiService: KpiEvaluationRuleService
    ) { }

    ngOnInit(): void {
        // Set selectedDepartmentId first before loading departments
        if (this.mode === 'edit' && this.session) {
            this.loadData();
        } else {
            this.selectedDepartmentId = this.departmentId;
        }

        this.loadDepartments();
        this.loadKPISessions();
    }

    loadDepartments(): void {
        this.kpiService.getDepartments().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.departments = response.data || [];

                    // Set default department if not already set
                    if (!this.selectedDepartmentId && this.departments.length > 0) {
                        this.selectedDepartmentId = this.departments[0].ID;
                    }

                    // Always generate code/name after departments are loaded (for add mode)
                    if (this.mode === 'add') {
                        this.changeValueNameCode();
                    }
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
            }
        });
    }

    loadKPISessions(): void {
        this.kpiService.getDataKPISession().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.kpiSessions = response.data || [];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách kỳ đánh giá');
            }
        });
    }

    loadData(): void {
        if (this.session) {
            this.year = this.session.YearEvaluation || new Date().getFullYear();
            this.quarter = this.session.QuarterEvaluation || 1;
            this.code = this.session.Code || '';
            this.name = this.session.Name || '';
            this.selectedDepartmentId = this.session.DepartmentID || this.departmentId;
        }
    }

    changeValueNameCode(): void {
        const department = this.departments.find(d => d.ID === this.selectedDepartmentId);
        const deptCode = department?.Code?.trim() || '';
        const deptName = department?.Name?.trim() || '';

        this.code = `KPI_${deptCode}_${this.year}_Q${this.quarter}`;
        this.name = `Kỳ đánh giá KPI ${deptName} quý ${this.quarter}-${this.year}`;
    }

    onYearChange(): void {
        this.changeValueNameCode();
    }

    onQuarterChange(): void {
        this.changeValueNameCode();
    }

    onDepartmentChange(): void {
        this.changeValueNameCode();
    }

    onCopyChange(): void {
        if (!this.isCopy) {
            this.fromSessionId = 0;
        }
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (this.isCopy && (!this.fromSessionId || this.fromSessionId <= 0)) {
            this.errors.fromSessionId = 'Vui lòng chọn Kỳ đánh giá nguồn';
            isValid = false;
        }

        if (!this.year || this.year <= 0) {
            this.errors.year = 'Vui lòng nhập Năm';
            isValid = false;
        }

        if (!this.quarter || this.quarter < 1 || this.quarter > 4) {
            this.errors.quarter = 'Vui lòng nhập Quý (1-4)';
            isValid = false;
        }

        if (!this.code || this.code.trim() === '') {
            this.errors.code = 'Vui lòng nhập Mã kỳ đánh giá';
            isValid = false;
        }

        if (!this.name || this.name.trim() === '') {
            this.errors.name = 'Vui lòng nhập Tên kỳ đánh giá';
            isValid = false;
        }

        if (!this.selectedDepartmentId || this.selectedDepartmentId <= 0) {
            this.errors.departmentId = 'Vui lòng chọn Phòng ban';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        if (this.isCopy) {
            this.copyData();
        } else {
            this.saveData(false);
        }
    }

    saveData(isForce: boolean): void {
        this.isLoading = true;

        const dto = {
            model: {
                ID: this.id,
                YearEvaluation: this.year,
                QuarterEvaluation: this.quarter,
                DepartmentID: this.selectedDepartmentId,
                Code: this.code.trim(),
                Name: this.name.trim()
            },
            IsCopy: false,
            IsForce: isForce
        };

        this.kpiService.saveKPISession(dto).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response?.status === 1) {
                    // Check if need confirmation
                    if (response.data?.NeedConfirm) {
                        this.modal.confirm({
                            nzTitle: 'Xác nhận',
                            nzContent: response.message,
                            nzOkText: 'Đồng ý',
                            nzCancelText: 'Hủy',
                            nzOnOk: () => this.saveData(true)
                        });
                        return;
                    }

                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isLoading = false;
                const errorMessage = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    copyData(isForce: boolean = false): void {
        this.isLoading = true;

        const dto = {
            FromSessionID: this.fromSessionId,
            Year: this.year,
            Quarter: this.quarter,
            DepartmentID: this.selectedDepartmentId,
            Code: this.code.trim(),
            Name: this.name.trim(),
            IsForce: isForce
        };

        this.kpiService.copyKPISession(dto).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response?.status === 1) {
                    // Check if need confirmation
                    if (response.data?.NeedConfirm) {
                        this.modal.confirm({
                            nzTitle: 'Xác nhận ghi đè',
                            nzContent: response.message,
                            nzOkText: 'Đồng ý',
                            nzOkDanger: true,
                            nzCancelText: 'Hủy',
                            nzOnOk: () => this.copyData(true)
                        });
                        return;
                    }

                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Sao chép thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Sao chép thất bại');
                }
            },
            error: (err) => {
                this.isLoading = false;
                const errorMessage = err?.error?.message || err?.message || 'Có lỗi xảy ra khi sao chép dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
