import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { KpiEvaluationRuleService } from '../kpi-evaluation-rule-service/kpi-evaluation-rule.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-rule-detail',
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
        NzIconModule,
        NzToolTipModule,
        NzTreeSelectModule,
    ],
    templateUrl: './kpi-rule-detail.component.html',
    styleUrl: './kpi-rule-detail.component.css'
})
export class KpiRuleDetailComponent implements OnInit {
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() ruleId: number = 0;
    @Input() departmentId: number = 0;
    @Input() ruleDetail: any = null;
    @Input() parentId: number = 0;
    @Output() onSaved = new EventEmitter<any>();

    // Form fields
    id: number = 0;
    stt: string = '';
    selectedParentId: string = '0';
    selectedKPIEvaluationId: number | null = null;
    maxPercent: number | null = null;
    percentageAdjustment: number | null = null;
    maxPercentageAdjustment: number | null = null;
    ruleContent: string = '';
    ruleNote: string = '';
    note: string = '';
    formulaCode: string = '';

    // Dropdown data
    parentGroups: any[] = [];
    parentGroupNodes: any[] = [];
    kpiEvaluations: any[] = [];

    // Validation errors
    errors: any = {};

    // Loading state
    isLoading: boolean = false;
    isSaving: boolean = false;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private kpiService: KpiEvaluationRuleService
    ) { }

    ngOnInit(): void {
        this.loadParentGroups();
        this.loadKPIEvaluations();

        if (this.mode === 'edit' && this.ruleDetail) {
            this.loadData();
        } else {
            // Add mode - set initial parent and get next STT
            this.selectedParentId = (this.parentId || 0).toString();
            this.loadNextSTT();
        }
    }

    loadData(): void {
        if (this.ruleDetail) {
            this.id = this.ruleDetail.ID || 0;
            this.stt = this.ruleDetail.STT || '';
            this.selectedParentId = (this.ruleDetail.ParentID || 0).toString();
            this.selectedKPIEvaluationId = this.ruleDetail.KPIEvaluationID || null;
            this.maxPercent = this.ruleDetail.MaxPercent ?? null;
            this.percentageAdjustment = this.ruleDetail.PercentageAdjustment ?? null;
            this.maxPercentageAdjustment = this.ruleDetail.MaxPercentageAdjustment ?? null;
            this.ruleContent = this.ruleDetail.RuleContent || '';
            this.ruleNote = this.ruleDetail.RuleNote || '';
            this.note = this.ruleDetail.Note || '';
            this.formulaCode = this.ruleDetail.FormulaCode || '';
        }
    }

    loadParentGroups(): void {
        if (!this.ruleId) return;

        this.kpiService.getRuleDetailByRule(this.ruleId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    let items = (response.data || []).filter((x: any) => x.ID !== this.id);
                    this.parentGroups = items;
                    this.parentGroupNodes = this.buildTreeNodes(items);
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhóm cha');
            }
        });
    }

    buildTreeNodes(items: any[]): any[] {
        // Create a map for quick lookup
        const map = new Map<number, any>();
        const roots: any[] = [];

        // Add root option "Không có nhóm cha"
        roots.push({
            title: 'Không có nhóm cha',
            key: '0',
            isLeaf: true
        });

        // First pass: create all nodes
        items.forEach(item => {
            map.set(item.ID, {
                title: item.STT + ' - ' + (item.RuleContent || ''),
                key: item.ID.toString(),
                children: [],
                isLeaf: true
            });
        });

        // Second pass: build tree structure
        items.forEach(item => {
            const node = map.get(item.ID);
            if (item.ParentID && item.ParentID !== 0 && map.has(item.ParentID)) {
                const parent = map.get(item.ParentID);
                parent.children.push(node);
                parent.isLeaf = false;
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    loadKPIEvaluations(): void {
        if (!this.departmentId) return;

        this.kpiService.getKPIEvaluation(this.departmentId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.kpiEvaluations = response.data || [];
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách Rule Code');
            }
        });
    }

    loadNextSTT(): void {
        if (!this.ruleId) return;

        this.kpiService.getNextSTT(this.ruleId, parseInt(this.selectedParentId) || 0).subscribe({
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

    onRefreshParentGroups(): void {
        this.loadParentGroups();
    }

    onParentChange(): void {
        // Only auto-generate STT if in add mode
        if (this.mode === 'add') {
            this.loadNextSTT();
        }
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.stt || this.stt.trim() === '') {
            this.errors.stt = 'Vui lòng nhập STT';
            isValid = false;
        }

        if (!this.ruleContent || this.ruleContent.trim() === '') {
            this.errors.ruleContent = 'Vui lòng nhập Nội dung đánh giá';
            isValid = false;
        }

        return isValid;
    }

    saveAndClose(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.saveData(true);
    }

    saveAndNew(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        this.saveData(false);
    }

    saveData(closeAfterSave: boolean): void {
        this.isSaving = true;

        const model = {
            ID: this.id,
            KPIEvaluationRuleID: this.ruleId,
            STT: this.stt.trim(),
            ParentID: parseInt(this.selectedParentId) || 0,
            KPIEvaluationID: this.selectedKPIEvaluationId || null,
            MaxPercent: this.maxPercent,
            PercentageAdjustment: this.percentageAdjustment,
            MaxPercentageAdjustment: this.maxPercentageAdjustment,
            RuleContent: this.ruleContent.trim(),
            RuleNote: this.ruleNote.trim(),
            Note: this.note.trim(),
            FormulaCode: this.formulaCode
        };

        this.kpiService.saveRuleDetail(model).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                if (response?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.onSaved.emit(response.data);

                    if (closeAfterSave) {
                        this.activeModal.close(response.data);
                    } else {
                        this.reset();
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

    reset(): void {
        this.id = 0;
        this.selectedKPIEvaluationId = null;
        this.maxPercent = null;
        this.percentageAdjustment = null;
        this.maxPercentageAdjustment = null;
        this.ruleContent = '';
        this.ruleNote = '';
        this.note = '';
        this.formulaCode = '';
        this.errors = {};

        // Reload parent groups and get next STT
        this.loadParentGroups();
        this.loadNextSTT();
    }

    cancel(): void {
        this.activeModal.close(true);
    }
}
