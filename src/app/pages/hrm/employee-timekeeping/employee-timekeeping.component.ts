import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// XLSX for Excel export
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';
// Services and Components
import { EmployeeTimekeepingService } from './employee-timekeeping-service/employee-timekeeping.service';
import { EmployeeTimekeepingDetailComponent } from './employee-timekeeping-detail/employee-timekeeping-detail.component';
import { EmployeeTimekeepingManagementComponent } from './employee-timekeeping-management/employee-timekeeping-management.component';
import vi from '@angular/common/locales/vi';
import { Router, RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from '../../../layouts/main-layout/main-layout.component';
@Component({
  selector: 'app-employee-timekeeping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzModalModule,
  ],
  templateUrl: './employee-timekeeping.component.html',
  styleUrls: ['./employee-timekeeping.component.css'],
})
export class EmployeeTimekeepingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // #region ViewChild and Properties
  @ViewChild('tb_ET', { static: false }) tb_ETRef!: ElementRef;

  // Table instance
  tb_ET!: Tabulator;

  // Loading states
  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  // UI states
  sizeSearch: string = '0';

  // Search filters
  year: Date = new Date();
  searchValue: string = '';

  // Selection tracking
  selectedET: any[] = [];
  selectedRows: any[] = [];
  lastSelectedET: any = null;

  constructor(
    private notification: NzNotificationService,
    private etService: EmployeeTimekeepingService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService,
    private router: Router,
    private app: MainLayoutComponent
  ) {}

  // #region Lifecycle Hooks
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_ET) {
      this.tb_ET.destroy();
    }
  }

  openManagement(et?: any) {
    const row = et ?? this.getCurrentSelectedET(); // dùng row được chọn trong Tabulator
    if (!row?.ID) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 bảng chấm công!');
      return;
    }
 const modalRef = this.ngbModal.open(EmployeeTimekeepingManagementComponent, {
    modalDialogClass: 'modal-fullscreen',
    backdrop: 'static',
    keyboard: false,
  });
  modalRef.componentInstance.etData = row;

;
  }
  private initializeTable(): void {
    if (!this.tb_ETRef) {
      console.error('Table container not found');
      return;
    }
    this.drawTbET(this.tb_ETRef.nativeElement);
  }

  private drawTbET(container: HTMLElement): void {
    this.tb_ET = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [100, 200, 400, 800, 1000],

      ajaxURL: this.etService.getETListURL(),
      ajaxParams: this.getETAjaxParams(),
      ajaxConfig: 'GET',

      ajaxResponse: (url: string, params: any, response: any) => {
        let rows: any[] = [];

        // Xử lý response theo structure của API
        if (response && typeof response === 'object') {
          if (response.status === 1 && response.data) {
            let data = response.data;

            // Kiểm tra nếu data là array của arrays
            if (Array.isArray(data)) {
              if (data.length > 0 && Array.isArray(data[0])) {
                // Nếu data[0] là array, thì flatten nó
                rows = data.flat();
              } else {
                // Nếu data là array bình thường
                rows = data;
              }
            } else {
              rows = [];
            }
          } else if (Array.isArray(response)) {
            rows = response;
          }
        }

        return rows;
      },

      rowContextMenu: this.getContextMenu(),
      langs: {
        vi: { pagination: { first: '<<', last: '>>', prev: '<', next: '>' } },
      },
      locale: 'vi',
      selectableRows: 1,
      // selectable: 1,
      selectableRangeMode: 'click',
      groupByStartOpen: true,
      columns: this.getTableColumns(),
    } as any);

    this.setupTableEvents();
  }

  private getContextMenu(): any[] {
    return [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-eye"></i> Bảng chấm chi tiết</span>',
        action: () => this.openManagement(),
      },
    ];
  }

  
  private getTableColumns(): any[] {
    return [
      {
        title: 'Duyệt',
        field: 'isApproved',
        headerHozAlign: 'center',
        hozAlign: 'center',
         formatter: function (cell: any) {
            let value = cell.getValue();
            return value
              ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
              : "<input type='checkbox' readonly style='pointer-events:none'>";
          },
        headerSort: false,
        minWidth: 40,
        width: 60,
        resizable: true,
      },
      {
        title: 'Năm',
        field: '_Year',
        headerHozAlign: 'center',
        hozAlign: 'center',
        minWidth: 40,
        width: 100,
        resizable: true,
      },
      {
        title: 'Tháng',
        field: '_Month',
        headerHozAlign: 'center',
        hozAlign: 'center',
        minWidth: 40,
        width: 100,
        resizable: true,
      },
      {
        title: 'Tên bảng chấm công',
        field: 'Name',
        headerHozAlign: 'center',
        hozAlign: 'left',
        minWidth: 90,
        width: 500,
        resizable: true,
      },
      {
        title: 'Ghi chú',
        field: 'Note',
        headerHozAlign: 'center',
        hozAlign: 'left',
        minWidth: 100,
        // width: 150,
        resizable: true,
      },
    ];
  }

  private setupTableEvents(): void {
    this.tb_ET.on('dataLoading', () => {
      console.log('ET Data loading...');
      this.isLoadTable = true;
      this.tb_ET.deselectRow();
    });

    this.tb_ET.on('dataLoaded', (data: any) => {
      console.log('ET Data loaded:', data.length, 'items');
      this.isLoadTable = false;
    });

    this.tb_ET.on('dataLoadError', (error: any) => {
      console.error('ET Data Load Error:', error);
      this.isLoadTable = false;
      this.notification.error(
        'Thông báo',
        'Lỗi khi tải dữ liệu ET: ' + (error.message || 'Lỗi không xác định')
      );
    });

    this.tb_ET.on('rowClick', (e: any, row: any) => {
      this.selectedET = row.getData();
      this.lastSelectedET = row.getData();
    });

    this.tb_ET.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedRows = rows.map((row: any) => row.getData());
      if (rows.length > 0) {
        this.selectedET = rows[rows.length - 1].getData();
        this.lastSelectedET = this.selectedET;
      } else {
        this.selectedET = [];
        this.lastSelectedET = null;
      }
    });

    this.tb_ET.on('tableBuilt', () => {
      console.log('ET table built successfully');
      this.isTableReady = true;
      // Load data after table is built
      this.searchET();
    });

    this.tb_ET.on('rowDblClick', (e: any, row: any) => {
      this.selectedET = row.getData();
      this.lastSelectedET = row.getData();
      this.editET();
    });

    this.tb_ET.on('renderStarted', () => {
      setTimeout(() => {
        if (this.isLoadTable) {
          this.isLoadTable = false;
        }
      }, 10000);
    });
  }
  private getETAjaxParams(): any {
    const y = this.year ? this.year.getFullYear() : new Date().getFullYear();
    const kw = (this.searchValue || '').trim();
    return { year: y, keyword: kw };
  }

  searchET(): void {
    if (!this.isTableReady) {
      console.log('Table not ready yet');
      return;
    }
    const params = this.getETAjaxParams();
    console.log('Searching ERR with params:', params);
    this.tb_ET.setData(this.etService.getETListURL(), params);
  }

  resetSearch(): void {
    this.year = new Date();
    this.searchValue = '';
    if (this.tb_ET) {
      this.tb_ET.clearData();
      this.searchET(); // CHANGED: nạp lại dữ liệu sau khi reset
    }
  }

  onSearch(): void {
    this.searchET();
  }
  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }
  // #endregion

  // #region Selection Management

  getSelectedRows(): any[] {
    if (!this.tb_ET) return [];
    // Lấy các dòng đang được chọn bởi Tabulator
    return this.tb_ET.getSelectedData();
  }

  getSelectedRowsCount(): number {
    return this.getSelectedRows().length;
  }

  private getCurrentSelectedET(): any | null {
    if (this.lastSelectedET) return this.lastSelectedET;
    if (this.selectedET) return this.selectedET;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }
  clearSelection(): void {
    this.selectedET = [];
    if (this.tb_ET) {
      this.tb_ET.deselectRow();
    }
  }

  // #endregion

  // #region CRUD Operations
  addET(): void {
    const modalRef = this.ngbModal.open(EmployeeTimekeepingDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.etData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchET();
        this.notification.success('Thông báo', 'Thêm ET thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  editET(): void {
    const etToEdit = this.getCurrentSelectedET();

    if (!etToEdit) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ET cần sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }
    if (etToEdit.isApproved) {
      this.notification.warning(
        'Thông báo',
        'Bản ghi đã được duyệt. Vui lòng hủy duyệt trước khi sửa!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(EmployeeTimekeepingDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.etData = etToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchET();
        this.notification.success('Thông báo', 'Sửa ET thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  deleteET(): void {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ERR cần xóa!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    // Chỉ cho phép xóa bản ghi chưa duyệt
    const notApprovedRows = selectedRows.filter((row) => !row.isApproved);
    if (notApprovedRows.length !== selectedRows.length) {
      this.notification.warning(
        'Thông báo',
        'Chỉ được xóa bản ghi chưa duyệt. Vui lòng hủy duyệt trước khi xóa!'
      );
      return;
    }

    const count = notApprovedRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa ET của <strong>"Tháng ${notApprovedRows[0]._Month}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi ET đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteET(notApprovedRows),
    });
  }

  private confirmDeleteET(selectedRows: any[] = []): void {
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Không có bản ghi hợp lệ để xóa!');
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const deleteNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.handleDeleteComplete(successCount, failedCount, totalCount);
        return;
      }

      const item = selectedRows[index];
      // Sửa IsDelete thành kiểu số
      const deleteData = {
        ID: item.ID,
        IsDelete: true,
        UpdatedBy: this.etService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.etService.saveData(deleteData).subscribe({
        next: (res) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          deleteNext(index + 1);
        },
        error: () => {
          failedCount++;
          deleteNext(index + 1);
        },
      });
    };

    deleteNext(0);
  }

  private handleDeleteComplete(
    successCount: number,
    failedCount: number,
    totalCount: number
  ): void {
    if (successCount > 0) {
      this.notification.success(
        'Thông báo',
        `Đã xóa ${successCount}/${totalCount} bản ghi ET thành công!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
      this.searchET();
      this.clearSelection();
    }

    if (failedCount > 0) {
      this.notification.warning(
        'Thông báo',
        `${failedCount} bản ghi xóa thất bại!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
    }
  }

  manageTimekeeping(): void {
    const etToView = this.getCurrentSelectedET();

    if (!etToView) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ET để xem!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.ngbModal.open(
      EmployeeTimekeepingManagementComponent,
      {
        modalDialogClass: 'modal-fullscreen',
        backdrop: 'static',
        keyboard: false,
      }
    );

    modalRef.componentInstance.etData = etToView;

    modalRef.result.then((result) => {
      // Xử lý sau khi đóng modal nếu cần
    });
  }

  approvedET(): void {
    const selected = this.getCurrentSelectedET();
    if (!selected) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ET để duyệt!');
      return;
    }
    if (selected.isApproved) {
      this.notification.warning('Thông báo', 'Bản ghi đã được duyệt!');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt',
      nzContent: `Bạn có chắc chắn muốn duyệt ET của <strong>Tháng ${selected._Month}</strong> không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const approveData = {
          ...selected,
          isApproved: true,
          UpdatedBy: this.etService.LoginName,
          UpdatedDate: new Date().toISOString(),
        };
        this.etService.saveData(approveData).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', 'Duyệt thành công!');
              this.searchET();
              this.clearSelection();
            } else {
              this.notification.error('Thông báo', 'Duyệt thất bại!');
            }
          },
          error: () => {
            this.notification.error('Thông báo', 'Duyệt thất bại!');
          },
        });
      },
    });
  }

  cancelApprovedET(): void {
    const selected = this.getCurrentSelectedET();
    if (!selected) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ET để hủy duyệt!');
      return;
    }
    if (!selected.isApproved) {
      this.notification.warning('Thông báo', 'Bản ghi chưa được duyệt!');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt ET của "Tháng ${selected._Month}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => {
        const cancelData = {
          ...selected,
          isApproved: false,
          UpdatedBy: this.etService.LoginName,
          UpdatedDate: new Date().toISOString(),
        };
        this.etService.saveData(cancelData).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', 'Hủy duyệt thành công!');
              this.searchET();
              this.clearSelection();
            } else {
              this.notification.error('Thông báo', 'Hủy duyệt thất bại!');
            }
          },
          error: () => {
            this.notification.error('Thông báo', 'Hủy duyệt thất bại!');
          },
        });
      },
    });
  }
}
