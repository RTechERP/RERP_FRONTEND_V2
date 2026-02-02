import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO Modules
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { CopyKpiExamService } from './copy-kpi-exam.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-copy-kpi-exam',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzButtonModule,
        NzIconModule,
        NzSelectModule,
        NzSpinModule,
        NzCardModule,
        NzDividerModule,
        NzModalModule,
    ],
    templateUrl: './copy-kpi-exam.component.html',
    styleUrl: './copy-kpi-exam.component.css',
})
export class CopyKpiExamComponent implements OnInit {
    // Input from parent
    @Input() departmentId: number = 0;
    @Input() kpiSessionId: number = 0;
    @Input() kpiExamId: number = 0;
    @Input() examName: string = '';

    // Data for dropdowns
    kpiSessions: any[] = [];
    sourceExams: any[] = [];
    targetExams: any[] = [];

    // Selected values
    sourceSessionId: number = 0;
    sourceExamId: number = 0;
    targetSessionId: number = 0;
    targetExamId: number = 0;

    // Loading states
    isLoadingSession = false;
    isLoadingSourceExam = false;
    isLoadingTargetExam = false;
    isCopying = false;

    constructor(
        public activeModal: NgbActiveModal,
        private copyService: CopyKpiExamService,
        private notification: NzNotificationService,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.loadKPISessions();

        // Set initial values from parent
        this.sourceSessionId = this.kpiSessionId;
        this.sourceExamId = this.kpiExamId;
        this.targetSessionId = this.kpiSessionId;
    }

    loadKPISessions(): void {
        this.isLoadingSession = true;
        this.copyService.getKPISessions(this.departmentId).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.kpiSessions = response.data || [];
                    // Load exams after sessions are loaded
                    if (this.sourceSessionId > 0) {
                        this.loadSourceExams();
                    }
                    if (this.targetSessionId > 0) {
                        this.loadTargetExams();
                    }
                }
                this.isLoadingSession = false;
            },
            error: () => {
                this.isLoadingSession = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu Kỳ đánh giá');
            }
        });
    }

    onSourceSessionChange(): void {
        this.sourceExamId = 0;
        this.loadSourceExams();
    }

    onTargetSessionChange(): void {
        this.targetExamId = 0;
        this.loadTargetExams();
    }

    loadSourceExams(): void {
        if (!this.sourceSessionId) {
            this.sourceExams = [];
            return;
        }

        this.isLoadingSourceExam = true;
        this.copyService.getKPIExams(this.departmentId, this.sourceSessionId).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.sourceExams = response.data || [];
                }
                this.isLoadingSourceExam = false;
            },
            error: () => {
                this.isLoadingSourceExam = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu Bài đánh giá');
            }
        });
    }

    loadTargetExams(): void {
        if (!this.targetSessionId) {
            this.targetExams = [];
            return;
        }

        this.isLoadingTargetExam = true;
        this.copyService.getKPIExams(this.departmentId, this.targetSessionId).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.targetExams = response.data || [];
                }
                this.isLoadingTargetExam = false;
            },
            error: () => {
                this.isLoadingTargetExam = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu Bài đánh giá');
            }
        });
    }

    onCopy(): void {
        // Validation
        if (!this.sourceExamId || this.sourceExamId <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bài thi muốn sao chép');
            return;
        }

        if (!this.targetExamId || this.targetExamId <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bài thi muốn sao chép tới');
            return;
        }

        if (this.sourceExamId === this.targetExamId) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể copy trùng bài thi');
            return;
        }

        // Get exam names for confirmation message
        const sourceExam = this.sourceExams.find(e => e.ID === this.sourceExamId);
        const targetExam = this.targetExams.find(e => e.ID === this.targetExamId);
        const sourceExamName = sourceExam?.ExamName || 'Bài nguồn';
        const targetExamName = targetExam?.ExamName || 'Bài đích';

        this.nzModal.confirm({
            nzTitle: 'Xác nhận sao chép',
            nzContent: `Bạn có chắc chắn muốn sao chép dữ liệu từ "${sourceExamName}" sang "${targetExamName}" không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.executeCopy(true);
            }
        });
    }

    private executeCopy(overwrite: boolean): void {
        this.isCopying = true;

        this.copyService.copyExam(this.sourceExamId, this.targetExamId, overwrite).subscribe({
            next: (response: any) => {
                this.isCopying = false;
                if (response.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Copy thành công');
                    this.activeModal.close({ success: true });
                } else {
                    // Check if data exists and ask for overwrite
                    if (response.message?.includes('Dữ liệu đã tồn tại')) {
                        this.nzModal.confirm({
                            nzTitle: 'Dữ liệu đã tồn tại',
                            nzContent: 'Tiêu chí đánh giá bài này đã tồn tại! Bạn có muốn ghi đè dữ liệu không?',
                            nzOkText: 'Ghi đè',
                            nzCancelText: 'Hủy',
                            nzOkDanger: true,
                            nzOnOk: () => {
                                this.executeCopy(true);
                            }
                        });
                    } else {
                        this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi copy');
                    }
                }
            },
            error: (err: any) => {
                this.isCopying = false;
                const errorMessage = err?.error?.message || 'Lỗi khi sao chép bài đánh giá';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    onCancel(): void {
        this.activeModal.dismiss('cancel');
    }
}
