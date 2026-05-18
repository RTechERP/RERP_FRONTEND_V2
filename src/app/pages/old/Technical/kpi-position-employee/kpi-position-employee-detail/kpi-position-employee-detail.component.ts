import { Component, OnInit, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { KpiPositionEmployeeService } from '../kpi-position-employee-service/kpi-position-employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

type PrimeColumnType = 'text' | 'number' | 'boolean';

interface PrimeColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  minWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: PrimeColumnType;
  align?: 'left' | 'center' | 'right';
  cssClass?: string;
}

@Component({
  selector: 'app-kpi-position-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    TableModule
  ],
  templateUrl: './kpi-position-employee-detail.component.html',
  styleUrl: './kpi-position-employee-detail.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiPositionEmployeeDetailComponent implements OnInit {
  @Input() departmentId: number = 0;
  @Input() kpiSessionId: number = 0;
  @Input() kpiPositionId: number = 0;
  @Output() onSaved = new EventEmitter<any>();

  // Grid
  columnDefinitions: PrimeColumn[] = [];
  dataset: any[] = [];
  isLoading = false;

  // Track changes
  lstInsert: number[] = [];  // EmployeeIDs to insert
  lstDel: number[] = [];     // PositionEmployeeIDs to delete

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private service: KpiPositionEmployeeService
  ) { }

  ngOnInit(): void {
    this.initGrid();
    this.loadEmployees();
  }

  private initGrid(): void {
    this.columnDefinitions = [
      this.textCol('IsCheck', '', 'IsCheck', 50, { sortable: false, filterable: false, cssClass: 'text-center' }),
      this.textCol('Code', 'Mã nhân viên', 'Code', 120),
      this.textCol('FullName', 'Tên nhân viên', 'FullName', 200),
      this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 150),
      this.textCol('ChucVuName', 'Chức vụ', 'ChucVuName', 150),
      this.textCol('PositionName', 'Vị trí', 'PositionName', 150)
    ];
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.service.getPositionEmployeeDetail(this.departmentId, this.kpiSessionId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.dataset = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
            IsCheck: item.KPIPosiotionID === this.kpiPositionId
          })).sort((a: any, b: any) => (a.DepartmentName || '').localeCompare(b.DepartmentName || ''));
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
      }
    });
  }

  /**
   * Xử lý click checkbox
   */
  onCheckboxClick(dataContext: any): void {
    const empId = parseInt(dataContext.ID, 10);
    const positionEmployeeId = parseInt(dataContext.PositionEmployeeID, 10) || 0;
    const currentPositionId = parseInt(dataContext.KPIPosiotionID, 10) || 0;
    const isCurrentlyChecked = dataContext.IsCheck;

    if (isCurrentlyChecked) {
      // Đang checked -> hỏi bỏ check (xóa)
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có muốn xóa Nhân viên [${dataContext.FullName}] hay không?`,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          // Thêm vào danh sách xóa (dùng PositionEmployeeID)
          if (positionEmployeeId && !this.lstDel.includes(positionEmployeeId)) {
            this.lstDel.push(positionEmployeeId);
          }
          // Xóa khỏi danh sách thêm
          this.lstInsert = this.lstInsert.filter(id => id !== empId);

          // Update UI
          dataContext.IsCheck = false;
        },
        nzOnCancel: () => {
          // Reset UI state to keep checked
          dataContext.IsCheck = true;
          this.dataset = [...this.dataset];
        }
      });
    } else {
      // Đang unchecked -> check (thêm)
      if (currentPositionId && currentPositionId !== 0 && currentPositionId === this.kpiPositionId) {
        // Nhân viên đã có đúng KPI Position rồi => không cần insert
        this.lstInsert = this.lstInsert.filter(id => id !== empId);
        dataContext.IsCheck = true;
        return;
      }

      if (currentPositionId && currentPositionId !== 0 && currentPositionId !== this.kpiPositionId) {
        // Nhân viên đã có vị trí khác => hỏi có muốn gán lại không
        this.modal.confirm({
          nzTitle: 'Xác nhận gán lại',
          nzContent: `Nhân viên [${dataContext.FullName}] đã được gán vị trí [${dataContext.PositionName}]! Bạn có muốn gán lại vị trí không?`,
          nzOkText: 'Gán lại',
          nzOkType: 'primary',
          nzCancelText: 'Hủy',
          nzOnOk: () => {
            if (!this.lstInsert.includes(empId)) {
              this.lstInsert.push(empId);
            }
            dataContext.IsCheck = true;
          },
          nzOnCancel: () => {
            // Reset UI state to keep unchecked
            dataContext.IsCheck = false;
            this.dataset = [...this.dataset];
          }
        });
      } else {
        // positionID == 0 => chưa gán bao giờ
        if (!this.lstInsert.includes(empId)) {
          this.lstInsert.push(empId);
        }
        dataContext.IsCheck = true;
      }
    }
  }

  saveAndClose(): void {
    this.save(() => {
      this.activeModal.close({ success: true });
    });
  }

  /**
   * Gọi save-position-employee API với listDel, listInsert, KPIPositionID
   */
  private save(onSuccess: () => void): void {
    if (this.lstDel.length === 0 && this.lstInsert.length === 0) {
      onSuccess();
      return;
    }

    this.service.savePositionEmployee(this.lstDel, this.lstInsert, this.kpiPositionId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.lstDel = [];
          this.lstInsert = [];
          this.onSaved.emit({ success: true });
          onSuccess();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
        }
      },
      error: (error: any) => {
        console.error('Error saving:', error);
        const errorMsg = error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      }
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  visibleColumns(columns: PrimeColumn[]): PrimeColumn[] {
    return columns.filter(col => !col.hidden);
  }

  getColumnWidth(col: PrimeColumn): string {
    return `${col.width || col.minWidth || 120}px`;
  }

  getColumnFilterType(col: PrimeColumn): string {
    return 'text';
  }

  getCellClass(col: PrimeColumn): Record<string, boolean> {
    return {
      'text-end': col.align === 'right' || col.type === 'number' || col.cssClass === 'text-end',
      'text-center': col.align === 'center' || col.type === 'boolean' || col.cssClass === 'text-center',
    };
  }

  formatCell(row: any, col: PrimeColumn): string {
    const value = row?.[col.field];
    if (value === null || value === undefined || value === '') return '';
    if (col.type === 'number') return this.formatNumber(value);
    if (col.type === 'boolean') return value ? '✓' : '';
    return String(value);
  }

  getCellTitle(row: any, col: PrimeColumn): string {
    if (col.type === 'boolean') return row?.[col.field] ? 'Có' : 'Không';
    return this.formatCell(row, col);
  }

  getDetailGroupCount(deptName: string): number {
    return this.dataset.filter(item => item.DepartmentName === deptName).length;
  }

  private formatNumber(value: any): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(numericValue);
  }

  private textCol(id: string, name: string, field: string, width: number, extra: Partial<PrimeColumn> = {}): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'text',
      ...extra,
    };
  }
}
