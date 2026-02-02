import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { KpiEvaluationFactorsService } from '../kpi-evaluation-factores-service/kpi-evaluation-factors.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-evaluation-factors-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzInputNumberModule,
        NzButtonModule,
        NzSelectModule,
        NzCardModule,
        NzSpinModule,
        NzTreeSelectModule,
    ],
    templateUrl: './kpi-evaluation-factors-detail.component.html',
    styleUrl: './kpi-evaluation-factors-detail.component.css'
})
export class KpiEvaluationFactorsDetailComponent implements OnInit {
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() kpiExamId: number = 0;
    @Input() evaluationType: number = 1; // 1=Kỹ năng, 2=Chuyên môn, 3=Đánh giá chung
    @Input() departmentId: number = 0;
    @Input() selectedFactor: any = null; // Khi edit
    @Input() parentFactor: any = null;   // Khi thêm từ node cha

    // Form fields
    id: number = 0;
    stt: string = '';
    parentId: number = 0;
    selectedEvaluationType: number = 1;
    specializationType: number = 0;
    evaluationContent: string = '';
    verificationToolsContent: string = '';
    standardPoint: number = 0;
    coefficient: number = 0;
    unit: string = '';

    // Dropdown data
    parentGroups: any[] = [];
    evaluationTypes: any[] = [
        { ID: 0, EValuationType: '---Chọn yếu tố ---' },
        { ID: 1, EValuationType: 'Đánh giá kỹ năng' },
        { ID: 2, EValuationType: 'Chuyên môn' },
        { ID: 3, EValuationType: 'Đánh giá chung' }
    ];
    specializationTypes: any[] = [];

    // Validation errors
    errors: any = {};

    // Loading state
    isLoading: boolean = false;
    isSaving: boolean = false;

    // Check if standard point is required (no parent)
    isStandardPointRequired: boolean = true;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiService: KpiEvaluationFactorsService
    ) { }

    ngOnInit(): void {
        this.selectedEvaluationType = this.evaluationType;
        this.loadSpecializationTypes();
        this.loadParentGroup();

        if (this.mode === 'edit' && this.selectedFactor) {
            this.loadData();
        } else if (this.mode === 'add' && this.parentFactor) {
            // Thêm mới từ node cha
            this.parentId = this.parentFactor.ParentID || 0;
            this.specializationType = this.parentFactor.SpecializationType || 0;
            this.standardPoint = this.parentFactor.StandardPoint || 0;
            this.stt = this.parentFactor.STT || '';
        } else {
            // Thêm mới không có cha
            this.loadNextSTT();
        }
    }

    loadData(): void {
        if (this.selectedFactor) {
            this.id = this.selectedFactor.ID || 0;
            this.stt = this.selectedFactor.STT || '';
            this.parentId = this.selectedFactor.ParentID || 0;
            this.selectedEvaluationType = this.selectedFactor.EvaluationType || this.evaluationType;
            this.specializationType = this.selectedFactor.SpecializationType || 0;
            this.evaluationContent = this.selectedFactor.EvaluationContent || '';
            this.verificationToolsContent = this.selectedFactor.VerificationToolsContent || '';
            this.standardPoint = this.selectedFactor.StandardPoint || 0;
            this.coefficient = this.selectedFactor.Coefficient || 0;
            this.unit = this.selectedFactor.Unit || '';

            this.isStandardPointRequired = this.parentId <= 0;
        }
    }

    loadParentGroup(): void {
        this.kpiService.getParentGroup(this.kpiExamId, this.selectedEvaluationType, this.id).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    // Thêm option "Không có nhóm cha" vào đầu
                    const data = response.data || [];
                    this.parentGroups = [
                        { ID: 0, STT: '', EvaluationDetails: 'Không có nhóm cha' },
                        ...data
                    ];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhóm cha');
            }
        });
    }

    loadSpecializationTypes(): void {
        this.kpiService.getSpecializationTypes(this.departmentId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.specializationTypes = response.data || [];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại chuyên môn');
            }
        });
    }

    loadNextSTT(): void {
        this.kpiService.getNextSTT(this.kpiExamId, this.selectedEvaluationType, this.parentId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.stt = response.data || '';
                }
            },
            error: (err) => {
                console.error('Error loading next STT', err);
            }
        });
    }

    onParentGroupChange(): void {
        if (this.parentId > 0) {
            // Tìm parent trong danh sách
            const parent = this.parentGroups.find(p => p.ID === this.parentId);
            if (parent) {
                this.specializationType = parent.SpecializationType || this.specializationType;
                if (this.departmentId === 2) {
                    this.standardPoint = parent.StandardPoint || 0;
                }
            }
            this.isStandardPointRequired = false;
        } else {
            this.isStandardPointRequired = true;
        }

        // Load next STT
        this.loadNextSTT();
    }

    onRefreshParentGroup(): void {
        this.loadParentGroup();
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        // STT validation
        if (!this.stt || this.stt.trim() === '') {
            this.errors.stt = 'Vui lòng nhập STT';
            isValid = false;
        } else {
            const regex = /^\d+(\.\d+)*$/;
            if (!regex.test(this.stt.trim())) {
                this.errors.stt = 'STT chỉ được nhập số và dấu chấm';
                isValid = false;
            }
        }

        // Loại yếu tố validation
        if (!this.selectedEvaluationType || this.selectedEvaluationType <= 0) {
            this.errors.evaluationType = 'Vui lòng chọn Loại yếu tố';
            isValid = false;
        }

        // Loại chuyên môn validation
        if (!this.specializationType || this.specializationType <= 0) {
            this.errors.specializationType = 'Vui lòng chọn Loại chuyên môn';
            isValid = false;
        }

        // Yếu tố đánh giá validation
        if (!this.evaluationContent || this.evaluationContent.trim() === '') {
            this.errors.evaluationContent = 'Vui lòng nhập Yếu tố đánh giá';
            isValid = false;
        }

        // Điểm chuẩn validation (required khi không có nhóm cha)
        if (this.parentId <= 0 && (!this.standardPoint || this.standardPoint <= 0)) {
            this.errors.standardPoint = 'Vui lòng nhập Điểm chuẩn';
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

    saveAndNew(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.saveData(true);
    }

    saveData(resetAfterSave: boolean): void {
        this.isSaving = true;

        const request = {
            ID: this.id,
            KPIExamID: this.kpiExamId,
            ParentID: this.parentId,
            EvaluationType: this.selectedEvaluationType,
            SpecializationType: this.specializationType,
            STT: this.stt.trim(),
            EvaluationContent: this.evaluationContent.trim(),
            VerificationToolsContent: this.verificationToolsContent?.trim() || '',
            StandardPoint: this.standardPoint,
            Coefficient: this.coefficient,
            Unit: this.unit?.trim() || '',
            DepartmentID: this.departmentId
        };

        this.kpiService.saveEvaluationFactor(request).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');

                    if (resetAfterSave) {
                        this.resetForm();
                    } else {
                        this.activeModal.close(response.data);
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isSaving = false;
                const errorMessage = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
        });
    }

    resetForm(): void {
        this.id = 0;
        this.evaluationContent = '';
        this.verificationToolsContent = '';
        this.errors = {};

        // Reload parent group and next STT
        this.loadParentGroup();
        this.onParentGroupChange();
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
