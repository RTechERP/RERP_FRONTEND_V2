import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProjectGateStepService } from '../project-gate-step.service';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-project-gate-step-checklist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzToolTipModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzTagModule,
    NzIconModule,
    NzDividerModule,
    TableModule,
  ],
  providers: [NzNotificationService, NzModalService],
  templateUrl: './project-gate-step-checklist.component.html',
  styleUrls: ['./project-gate-step-checklist.component.css']
})

export class ProjectGateStepChecklistComponent implements OnInit {
  @Input() stepId!: number;
  @Input() stepCode!: string;
  @Input() stepName!: string;

  isLoading = false;

  formatOptions = [
    { label: '.xlsx (Excel)', value: '.xlsx' },
    { label: '.docx (Word)', value: '.docx' },
    { label: '.pdf (PDF)', value: '.pdf' },
    { label: '.zip (File nén)', value: '.zip' },
    { label: '.rar (File nén)', value: '.rar' },
    { label: '.png (Ảnh)', value: '.png' },
    { label: '.jpg (Ảnh)', value: '.jpg' },
    { label: '.dwg (CAD)', value: '.dwg' },
    { label: '.xls (Excel cũ)', value: '.xls' },
    { label: '.doc (Word cũ)', value: '.doc' },
  ];

  // ── Detail: CheckListDetail rows ─────────────────────────────
  details: any[] = [];
  deletedDetailIds: number[] = [];
  isSavingDetail = false;
  isSubmitted = false;

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    @Optional() @Inject('tabData') public tabData: any,
    private service: ProjectGateStepService,
    private tabService: TabServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
  ) { }

  ngOnInit(): void {
    if (this.tabData) {
      this.stepId = this.tabData.stepId ?? this.stepId;
      this.stepCode = this.tabData.stepCode ?? this.stepCode;
      this.stepName = this.tabData.stepName ?? this.stepName;
    }
    this.loadData();
  }

  loadData(): void {
    if (!this.stepId) return;
    this.isLoading = true;
    this.details = [];
    this.deletedDetailIds = [];

    this.service.getCheckListDetailsOnly(this.stepId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          this.details = (res.data || []).map((d: any, idx: number) => {
            const selectedFormats = d.FileFormat ? d.FileFormat.split(',').map((x: string) => x.trim()).filter((x: string) => x.length > 0) : [];
            return {
              ...d,
              _tempId: d.ID || -(idx + 1),
              _selectedFormats: selectedFormats,
              _isNew: false,
              _isDirty: false
            };
          });
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi tải danh sách quy tắc');
        }
      });
  }

  addDetail(): void {
    const newRow = {
      ID: 0,
      ProjectGateStepID: this.stepId,
      FileRule: '',
      FileFormat: '',
      _selectedFormats: [] as string[],
      FileQuantity: 1,
      IsCheck: true,
      IsFile: true,
      STT: this.details.length + 1,
      FileName: '',
      _tempId: -Date.now() - Math.floor(Math.random() * 1000),
      _isNew: true,
      _isDirty: true
    };
    this.details = [...this.details, newRow];
  }

  removeDetail(row: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng quy tắc đã chọn không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.details = this.details.filter(d => d._tempId !== row._tempId);
        if (row.ID > 0) {
          this.deletedDetailIds.push(row.ID);
        }
      }
    });
  }

  isAllDetailsSelected(): boolean {
    if (this.details.length === 0) return false;
    return this.details.every(d => d._selected);
  }

  toggleSelectAllDetails(checked: boolean): void {
    this.details.forEach(d => d._selected = checked);
  }

  hasSelectedDetails(): boolean {
    return this.details.some(d => d._selected);
  }

  removeSelectedDetails(): void {
    const selectedCount = this.details.filter(d => d._selected).length;
    if (selectedCount === 0) return;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedCount} dòng quy tắc đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.details.forEach(d => {
          if (d._selected && d.ID > 0) {
            this.deletedDetailIds.push(d.ID);
          }
        });
        this.details = this.details.filter(d => !d._selected);
      }
    });
  }

  markDetailDirty(row: any): void {
    row._isDirty = true;
  }

  onIsFileChange(row: any): void {
    this.markDetailDirty(row);
    if (!row.IsFile) {
      row._selectedFormats = [];
      row.FileQuantity = 0;
    }
  }

  onSaveDetails(): void {
    this.isSubmitted = true;

    // Validate FileRule cannot be empty
    const emptyIndex = this.details.findIndex(d => !d.FileRule || !d.FileRule.trim());
    if (emptyIndex > -1) {
      this.focusInput(emptyIndex, 'FileRule');
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Quy tắc/Yêu cầu file không được để trống!');
      return;
    }

    this.isSavingDetail = true;

    const detailsPayload = this.details.map(d => ({
      ID: d.ID || 0,
      FileRule: d.FileRule || '',
      FileFormat: (d._selectedFormats || []).join(', '),
      FileQuantity: d.FileQuantity ?? 0,
      IsCheck: d.IsCheck || false,
      IsFile: d.IsFile !== false,
      STT: d.STT || null,
      FileName: d.FileName || ''
    }));

    const payload = {
      details: detailsPayload,
      deletedIds: this.deletedDetailIds
    };

    this.service.saveCheckListDetails(this.stepId, payload)
      .pipe(finalize(() => this.isSavingDetail = false))
      .subscribe({
        next: (res: any) => {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu danh sách quy tắc thành công!');
          this.deletedDetailIds = [];
          this.loadData();
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi khi lưu quy tắc!');
        }
      });
  }

  getFormatOptions(selectedValues: string[]): any[] {
    const selected = selectedValues || [];
    const list = [...this.formatOptions];

    selected.forEach(val => {
      if (val && !list.some(x => x.value === val)) {
        list.push({ label: val, value: val });
      }
    });

    const selectedList = list.filter(opt => selected.includes(opt.value));
    const unselectedList = list.filter(opt => !selected.includes(opt.value));

    return [...selectedList, ...unselectedList];
  }

  countChecked(): number {
    return this.details.filter(d => d.IsCheck).length;
  }

  onKeyDown(rowIndex: number, column: string, event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      if (column === 'FileRule') {
        if (rowIndex === this.details.length - 1) {
          event.preventDefault();
          this.addDetail();
          setTimeout(() => {
            this.focusInput(rowIndex + 1, 'FileRule');
          }, 50);
        }
        return;
      }
      if (rowIndex === this.details.length - 1) {
        event.preventDefault();
        this.addDetail();
        setTimeout(() => {
          this.focusInput(rowIndex + 1, 'FileRule');
        }, 50);
      } else {
        event.preventDefault();
        this.focusInput(rowIndex + 1, column);
      }
    } else if (event.key === 'ArrowUp') {
      if (column === 'FileRule') {
        return;
      }
      if (rowIndex > 0) {
        event.preventDefault();
        this.focusInput(rowIndex - 1, column);
      }
    } else if (event.key === 'Tab') {
      if (rowIndex === this.details.length - 1 && column === 'IsCheck') {
        event.preventDefault();
        this.addDetail();
        setTimeout(() => {
          this.focusInput(rowIndex + 1, 'FileRule');
        }, 50);
      }
    }
  }

  focusInput(rowIndex: number, column: string): void {
    const selector = `[data-row="${rowIndex}"][data-col="${column}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      if (column === 'FileFormat') {
        const selectControl = element.querySelector('.ant-select-selector') as HTMLElement;
        if (selectControl) {
          selectControl.focus();
        } else {
          element.focus();
        }
      } else if (column === 'FileQuantity' || column === 'STT') {
        const inputNum = element.querySelector('input') as HTMLElement;
        if (inputNum) {
          inputNum.focus();
        } else {
          element.focus();
        }
      } else if (column === 'IsCheck' || column === 'IsFile') {
        const checkbox = element.querySelector('input[type="checkbox"]') as HTMLElement;
        if (checkbox) {
          checkbox.focus();
        } else {
          element.focus();
        }
      } else {
        element.focus();
      }
    }
  }
}
