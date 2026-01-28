import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
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
    selector: 'app-kpi-evaluation-rule-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzCheckboxModule,
        NzCardModule,
        NzSpinModule,
        NzModalModule,
    ],
    templateUrl: './kpi-evaluation-rule-detail.component.html',
    styleUrl: './kpi-evaluation-rule-detail.component.css'
})
export class KpiEvaluationRuleDetailComponent implements OnInit {
    @Input() mode: 'add' | 'edit' | 'copy' = 'add';
    @Input() kpiSessionId: number = 0;
    @Input() year: number = 0;
    @Input() quarter: number = 0;
    @Input() rule: any = null;
    @Input() fromRuleId: number = 0;

    // Form fields - Group "ĐẾN"
    selectedSessionId: number = 0;
    selectedPositionId: number = 0;
    ruleCode: string = '';
    ruleName: string = '';

    // Copy mode - Group "TỪ"
    isCopy: boolean = false;
    selectedSessionCopyId: number = 0;
    selectedRuleCopyId: number = 0;

    // Dropdown data
    sessions: any[] = [];
    positions: any[] = [];
    rulesCopy: any[] = [];

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
        this.selectedSessionId = this.kpiSessionId;

        // Set copy mode if opened with copy
        if (this.mode === 'copy') {
            this.isCopy = true;
            this.selectedSessionCopyId = this.kpiSessionId;
            this.selectedRuleCopyId = this.fromRuleId;
        }

        this.loadSessions();
        this.loadPositions();

        if (this.mode === 'edit' && this.rule) {
            this.loadData();
        }
    }

    loadSessions(): void {
        this.kpiService.getDataKPISession().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.sessions = response.data || [];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách kỳ đánh giá');
            }
        });
    }

    loadPositions(): void {
        if (this.selectedSessionId > 0) {
            this.kpiService.getPositionBySession(this.selectedSessionId).subscribe({
                next: (response: any) => {
                    if (response?.status === 1) {
                        this.positions = response.data || [];

                        // Auto-generate code/name if add mode
                        if (this.mode === 'add' && this.positions.length > 0 && !this.selectedPositionId) {
                            // Don't auto-select, wait for user
                        }
                    }
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách vị trí');
                }
            });
        }
    }

    loadRulesCopy(): void {
        if (this.selectedSessionCopyId > 0) {
            this.kpiService.getKPIRuleBySessionCopy(this.selectedSessionCopyId).subscribe({
                next: (response: any) => {
                    if (response?.status === 1) {
                        this.rulesCopy = response.data || [];
                    }
                },
                error: (err) => {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách Rule');
                }
            });
        }
    }

    loadData(): void {
        if (this.rule) {
            this.ruleCode = this.rule.RuleCode || '';
            this.ruleName = this.rule.RuleName || '';
            this.selectedPositionId = this.rule.KPIPositionID || 0;
            this.selectedSessionId = this.rule.KPISessionID || this.kpiSessionId;
        }
    }

    onCopyChange(): void {
        if (this.isCopy) {
            this.selectedSessionCopyId = this.kpiSessionId;
            this.loadRulesCopy();
        } else {
            this.selectedSessionCopyId = 0;
            this.selectedRuleCopyId = 0;
            this.rulesCopy = [];
        }
    }

    onSessionCopyChange(): void {
        this.selectedRuleCopyId = 0;
        this.loadRulesCopy();
    }

    onPositionChange(): void {
        this.changeRuleCode();
    }

    changeRuleCode(): void {
        const session = this.sessions.find(s => s.ID === this.selectedSessionId);
        const position = this.positions.find(p => p.ID === this.selectedPositionId);

        if (session && position) {
            const positionCode = position.PositionCode?.toUpperCase() || '';
            const positionName = position.PositionName?.toUpperCase() || '';

            this.ruleCode = `KPIRule_${positionCode}_${session.YearEvaluation}_Q${session.QuarterEvaluation}`;
            this.ruleName = `Đánh giá KPI Rule ${positionName} Q${session.QuarterEvaluation}-${session.YearEvaluation}`;
        }
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (this.isCopy) {
            if (!this.selectedSessionCopyId || this.selectedSessionCopyId <= 0) {
                this.errors.sessionCopyId = 'Vui lòng chọn Kỳ đánh giá copy';
                isValid = false;
            }
            if (!this.selectedRuleCopyId || this.selectedRuleCopyId <= 0) {
                this.errors.ruleCopyId = 'Vui lòng chọn Rule đánh giá để copy';
                isValid = false;
            }
        }

        if (!this.selectedSessionId || this.selectedSessionId <= 0) {
            this.errors.sessionId = 'Vui lòng chọn Kỳ đánh giá';
            isValid = false;
        }

        if (!this.selectedPositionId || this.selectedPositionId <= 0) {
            this.errors.positionId = 'Vui lòng chọn Vị trí';
            isValid = false;
        }

        if (!this.ruleCode || this.ruleCode.trim() === '') {
            this.errors.ruleCode = 'Vui lòng nhập Mã Rule đánh giá';
            isValid = false;
        }

        if (!this.ruleName || this.ruleName.trim() === '') {
            this.errors.ruleName = 'Vui lòng nhập Tên Rule đánh giá';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.saveData(false);
    }

    saveData(isForce: boolean): void {
        this.isLoading = true;

        const dto = {
            Model: {
                ID: this.rule?.ID || 0,
                KPISessionID: this.selectedSessionId,
                KPIPositionID: this.selectedPositionId,
                RuleCode: this.ruleCode.trim(),
                RuleName: this.ruleName.trim()
            },
            IsCopy: this.isCopy,
            IsForce: isForce,
            FromRuleID: this.selectedRuleCopyId
        };

        this.kpiService.saveKPIRule(dto).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response?.status === 1) {
                    // Check if need confirmation
                    if (response.data?.NeedConfirm) {
                        this.modal.confirm({
                            nzTitle: 'Xác nhận',
                            nzContent: response.message,
                            nzOkText: 'Đồng ý',
                            nzOkDanger: true,
                            nzCancelText: 'Hủy',
                            nzOnOk: () => this.saveData(true)
                        });
                        return;
                    }

                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
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

    cancel(): void {
        this.activeModal.dismiss();
    }
}
