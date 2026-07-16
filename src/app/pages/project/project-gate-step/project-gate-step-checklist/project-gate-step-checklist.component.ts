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
import { SplitterModule } from 'primeng/splitter';
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
    SplitterModule,
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

  // ── Master: CheckList items ──────────────────────────────────
  checkLists: any[] = [];
  selectedCheckList: any = null;

  typeOptions = [
    { label: 'File', value: 'File' },
    { label: 'PartList', value: 'PartList' },
    { label: 'Document', value: 'Document' },
    { label: 'Folder', value: 'Folder' },
    { label: 'Form', value: 'Form' },
    { label: 'Checklist', value: 'Checklist' },
    { label: 'Khác', value: 'Other' },
  ];

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
    { label: '.cs (C#)', value: '.cs' },
    { label: '.ts (TypeScript)', value: '.ts' },
    { label: '.js (JavaScript)', value: '.js' },
    { label: '.html (HTML)', value: '.html' },
    { label: '.css (CSS)', value: '.css' },
    { label: '.json (JSON)', value: '.json' },
    { label: '.sql (SQL)', value: '.sql' },
    { label: '.py (Python)', value: '.py' },
    { label: '.xml (XML)', value: '.xml' },
    { label: '.md (Markdown)', value: '.md' },
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

  // ════════════════════════════════════════════════════════════
  // LOAD
  // ════════════════════════════════════════════════════════════

  loadData(): void {
    if (!this.stepId) return;
    this.isLoading = true;
    this.selectedCheckList = null;
    this.details = [];

    this.service.getCheckListsOnly(this.stepId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          this.checkLists = (res.data || []).map((cl: any, idx: number) => ({
            ...cl,
            _tempId: cl.ID || -(idx + 1),
            _isNew: false,
            _isDirty: false,
            _detailsLoaded: false,
            Details: []
          }));

          // Auto-select first checklist if exists
          if (this.checkLists.length > 0) {
            this.selectCheckList(this.checkLists[0]);
          }
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi tải dữ liệu');
        }
      });
  }

  // ════════════════════════════════════════════════════════════
  // MASTER — CheckList CRUD
  // ════════════════════════════════════════════════════════════

  selectCheckList(cl: any): void {
    this.deletedDetailIds = [];
    this.isSubmitted = false;

    this.selectedCheckList = cl;

    // If it is a new checklist (ID <= 0), just read from in-memory
    if (cl.ID <= 0) {
      this.details = (cl.Details || []).map((d: any, idx: number) => {
        let selectedFormats = d._selectedFormats;
        if (!selectedFormats) {
          selectedFormats = d.FileFormat ? d.FileFormat.split(',').map((x: string) => x.trim()).filter((x: string) => x.length > 0) : [];
        }
        return {
          ...d,
          _tempId: d._tempId || d.ID || -(idx + 1),
          _selectedFormats: selectedFormats,
          _isNew: d._isNew || false,
          _isDirty: d._isDirty || false
        };
      });
      return;
    }

    // Call API to fetch details from ProjectGateStepCheckListDetail table
    this.isLoading = true;
    this.service.getCheckListDetailsOnly(cl.ID)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          cl.Details = res.data || [];
          cl._detailsLoaded = true;
          this.details = cl.Details.map((d: any, idx: number) => {
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
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi tải chi tiết checklist');
        }
      });
  }



  // ════════════════════════════════════════════════════════════
  // DETAIL — CheckListDetail CRUD
  // ════════════════════════════════════════════════════════════

  addDetail(): void {
    if (!this.selectedCheckList) return;
    const newRow = {
      ID: 0,
      ProjectGateStepCheckListID: this.selectedCheckList.ID || 0,
      FileRule: '',
      FileFormat: '',
      _selectedFormats: [] as string[],
      FileQuantity: 0,
      IsCheck: false,
      _tempId: -Date.now() - Math.floor(Math.random() * 1000),
      _isNew: true,
      _isDirty: true
    };
    this.details = [...this.details, newRow];
    // Sync back to checklist's Details array
    this.selectedCheckList.Details = this.details;
    this.selectedCheckList._isDirty = true;
  }

  removeDetail(row: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dòng checklist đã chọn không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.details = this.details.filter(d => d._tempId !== row._tempId);
        if (row.ID > 0) {
          this.deletedDetailIds.push(row.ID);
        }
        if (this.selectedCheckList) {
          this.selectedCheckList.Details = this.details;
          this.selectedCheckList._isDirty = true;
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
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedCount} dòng checklist đã chọn không?`,
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

        if (this.selectedCheckList) {
          this.selectedCheckList.Details = this.details;
          this.selectedCheckList._isDirty = true;
        }
      }
    });
  }

  markDetailDirty(row: any): void {
    row._isDirty = true;
    if (this.selectedCheckList) {
      this.selectedCheckList._isDirty = true;
    }
  }

  // ════════════════════════════════════════════════════════════
  // SAVE (Tách riêng: Checklist & Checklist Detail)
  // ════════════════════════════════════════════════════════════



  onSaveDetails(): void {
    if (!this.selectedCheckList) return;

    if (this.selectedCheckList.ID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhấn "Lưu Checklist" ở cột bên trái trước để lưu checklist này, sau đó mới lưu được file rules!');
      return;
    }

    // Sync current details in component state to SelectedCheckList's Details array
    this.selectedCheckList.Details = this.details;

    this.isSubmitted = true;

    // Validate FileRule cannot be empty
    const emptyIndex = this.details.findIndex(d => !d.FileRule || !d.FileRule.trim());
    if (emptyIndex > -1) {
      this.focusInput(emptyIndex, 'FileRule');
      return;
    }

    this.isSavingDetail = true;

    const detailsPayload = this.details.map(d => ({
      ID: d.ID || 0,
      FileRule: d.FileRule || '',
      FileFormat: (d._selectedFormats || []).join(', '),
      FileQuantity: d.FileQuantity ?? 0,
      IsCheck: d.IsCheck || false
    }));

    const payload = {
      details: detailsPayload,
      deletedIds: this.deletedDetailIds
    };

    this.service.saveCheckListDetails(this.selectedCheckList.ID, payload)
      .pipe(finalize(() => this.isSavingDetail = false))
      .subscribe({
        next: (res: any) => {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu danh sách file rules thành công!');
          this.deletedDetailIds = [];
          // Reload only the details of the selected checklist to keep UI snappy
          this.selectedCheckList._detailsLoaded = false;
          this.selectCheckList(this.selectedCheckList);
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi khi lưu file rules!');
        }
      });
  }


  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════

  getTypeColor(type: string): string {
    const map: { [k: string]: string } = {
      'File': 'blue', 'PartList': 'geekblue', 'Document': 'purple',
      'Folder': 'orange', 'Form': 'cyan', 'Checklist': 'green', 'Other': 'default'
    };
    return map[type] || 'default';
  }

  getFormatOptions(selectedValues: string[]): any[] {
    const selected = selectedValues || [];
    const list = [...this.formatOptions];

    // Add any selected values not already in the list
    selected.forEach(val => {
      if (val && !list.some(x => x.value === val)) {
        list.push({ label: val, value: val });
      }
    });

    // Partition so that selected items appear at the very beginning
    const selectedList = list.filter(opt => selected.includes(opt.value));
    const unselectedList = list.filter(opt => !selected.includes(opt.value));

    return [...selectedList, ...unselectedList];
  }

  countRequired(): number {
    return this.checkLists.filter(c => c.IsRequired).length;
  }

  hasDirty(): boolean {
    return this.checkLists.some(c => c._isDirty || c._isNew);
  }

  isSelected(cl: any): boolean {
    return this.selectedCheckList?._tempId === cl._tempId;
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
        return; // Allow cursor navigation inside textarea
      }
      
      // If it's the last row, add a new row
      if (rowIndex === this.details.length - 1) {
        event.preventDefault();
        this.addDetail();
        // Focus the new row's FileRule input after change detection
        setTimeout(() => {
          this.focusInput(rowIndex + 1, 'FileRule');
        }, 50);
      } else {
        // Move focus to the same column in the next row
        event.preventDefault();
        this.focusInput(rowIndex + 1, column);
      }
    } else if (event.key === 'ArrowUp') {
      if (column === 'FileRule') {
        return; // Allow cursor navigation inside textarea
      }
      if (rowIndex > 0) {
        event.preventDefault();
        this.focusInput(rowIndex - 1, column);
      }
    } else if (event.key === 'Tab') {
      // If it is the last cell of the last row (we use keydown to capture tab before default blur)
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
      } else if (column === 'FileQuantity') {
        const inputNum = element.querySelector('input') as HTMLElement;
        if (inputNum) {
          inputNum.focus();
        } else {
          element.focus();
        }
      } else if (column === 'IsCheck') {
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

