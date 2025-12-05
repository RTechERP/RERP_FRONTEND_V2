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

// NgBootstrap Modal
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

// Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// Services and Components
import { EmployeeTimekeepingService } from './employee-timekeeping-service/employee-timekeeping.service';
import { EmployeeTimekeepingDetailComponent } from './employee-timekeeping-detail/employee-timekeeping-detail.component';
import { EmployeeTimekeepingManagementComponent } from './employee-timekeeping-management/employee-timekeeping-management.component';
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
    NgbModalModule,
    // EmployeeTimekeepingManagementComponent, // Cần import để dùng trong modal
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
  selectedET: any | null = null;
  selectedRows: any[] = [];
  lastSelectedET: any | null = null;

  constructor(
    private notification: NzNotificationService,
    private etService: EmployeeTimekeepingService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService
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

    // Mở modal fullscreen thay vì navigate
    const modalRef = this.ngbModal.open(
      EmployeeTimekeepingManagementComponent,
      {
        modalDialogClass: 'modal-fullscreen',
        backdrop: 'static',
        keyboard: false,
        centered: false,
      }
    );

    // Truyền ID và etData vào component
    modalRef.componentInstance.etId = row.ID;
    modalRef.componentInstance.masterId = row.ID;
    modalRef.componentInstance.etData = row;

    modalRef.result.then(
      (result) => {
        // Nếu cần refresh sau khi đóng modal
        if (result?.action === 'refresh') {
          this.searchET();
        }
      },
      (reason) => {
        // Dismissed - không làm gì
      }
    );
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

      ajaxResponse: (url: any, params: any, response: any) => {
        console.log('API Response:', response);
        let rows: any[] = [];

        // Response structure: { status: 1, data: [...] } từ procedure spGetEmployeeChamCongMaster
        if (response && typeof response === 'object') {
          if (response.status === 1 && response.data) {
            let data = response.data;

            // Nếu data là array của arrays (DataSet)
            if (Array.isArray(data)) {
              if (data.length > 0 && Array.isArray(data[0])) {
                // DataSet - lấy table đầu tiên (index 0)
                rows = data[0];
              } else {
                // Array bình thường
                rows = data;
              }
            } else {
              rows = [];
            }
            console.log('Processed rows count:', rows.length);
          } else {
            console.warn('Unexpected response structure:', response);
            rows = [];
          }
        } else if (Array.isArray(response)) {
          // Fallback: nếu response là array trực tiếp
          rows = response;
        } else {
          rows = [];
        }

        return rows;
      },

      rowContextMenu: this.getContextMenu(),
      langs: {
        vi: { pagination: { first: '<<', last: '>>', prev: '<', next: '>' } },
      },
      locale: 'vi',
      selectableRows: true,
      selectableRowsRangeMode: false, // Cho phép chọn nhiều bằng checkbox hoặc Ctrl+Click
      initialSort: [
        { column: '_Year', dir: 'asc' }, // Sắp xếp theo năm tăng dần
        { column: '_Month', dir: 'asc' }, // Sau đó sắp xếp theo tháng tăng dần
      ],
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
        headerSort: true,
        sorter: 'number',
      },
      {
        title: 'Tháng',
        field: '_Month',
        headerHozAlign: 'center',
        hozAlign: 'center',
        minWidth: 40,
        width: 100,
        resizable: true,
        headerSort: true,
        sorter: 'number',
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
        this.selectedET = null;
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
    console.log('Searching ET with params:', this.getETAjaxParams());
    // Sử dụng replaceData() để trigger ajax với params mới
    this.tb_ET.replaceData();
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
    // Sử dụng getSelectedRows() từ Tabulator thay vì getSelectedData()
    const selectedRows = this.tb_ET.getSelectedRows();
    return selectedRows.map((row: any) => row.getData());
  }

  selectAllRows(): void {
    if (!this.tb_ET) return;
    // Sử dụng Tabulator API để chọn tất cả rows trên trang hiện tại
    const rows = this.tb_ET.getRows();
    if (rows.length > 0) {
      this.tb_ET.selectRow(rows);
    }
  }

  deselectAllRows(): void {
    if (!this.tb_ET) return;
    // Sử dụng Tabulator API để bỏ chọn tất cả rows
    const selectedRows = this.tb_ET.getSelectedRows();
    if (selectedRows.length > 0) {
      this.tb_ET.deselectRow(selectedRows);
    }
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
    this.selectedET = null;
    this.lastSelectedET = null;
    this.selectedRows = [];
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
        this.notification.success(
          'Thông báo',
          'Thêm bảng chấm công  thành công!',
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
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
        this.notification.success(
          'Thông báo',
          'Sửa bảng chấm công  thành công!',
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
      }
    });
  }

  deleteET(): void {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ET cần xóa!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    // Lọc ra các bản ghi chưa duyệt (chỉ xóa những cái này)
    const notApprovedRows = selectedRows.filter((row) => !row.isApproved);
    const approvedRows = selectedRows.filter((row) => row.isApproved);

    // Nếu không có bản ghi nào chưa duyệt thì báo lỗi
    if (notApprovedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Tất cả bản ghi đã chọn đều đã được duyệt. Chỉ có thể xóa bản ghi chưa duyệt!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    // Nếu có bản ghi đã duyệt, hiển thị cảnh báo nhưng vẫn cho phép xóa những cái chưa duyệt
    if (approvedRows.length > 0) {
      this.notification.info(
        'Thông báo',
        `Có ${approvedRows.length} bản ghi đã duyệt sẽ được bỏ qua. Chỉ xóa ${notApprovedRows.length} bản ghi chưa duyệt.`,
        { nzStyle: { fontSize: '0.75rem' }, nzDuration: 3000 }
      );
    }

    const count = notApprovedRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa bảng chấm công <strong>"${notApprovedRows[0].Name}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi ET chưa duyệt không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteET(notApprovedRows, approvedRows.length),
    });
  }

  private confirmDeleteET(
    selectedRows: any[] = [],
    skippedCount: number = 0
  ): void {
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Không có bản ghi hợp lệ để xóa!');
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const deleteNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.handleDeleteComplete(
          successCount,
          failedCount,
          totalCount,
          skippedCount
        );
        return;
      }

      const item = selectedRows[index];
      // Sửa IsDelete thành kiểu số
      const deleteData = {
        Name: item.Name,
        ID: item.ID,
        IsDeleted: true,
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
    totalCount: number,
    skippedCount: number = 0
  ): void {
    if (successCount > 0) {
      let message = `Đã xóa ${successCount}/${totalCount} bản ghi bảng chấm công thành công!`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} bản ghi đã duyệt được bỏ qua)`;
      }
      this.notification.success('Thông báo', message, {
        nzStyle: { fontSize: '0.75rem' },
      });
      this.searchET();
      this.clearSelection();
    } else if (totalCount > 0) {
      // Nếu không có bản ghi nào xóa thành công
      this.notification.warning(
        'Thông báo',
        `Không thể xóa bất kỳ bản ghi nào!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
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

    if (!etToView || !etToView.ID) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ET để xem!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    // Mở modal fullscreen với ID
    const modalRef = this.ngbModal.open(
      EmployeeTimekeepingManagementComponent,
      {
        modalDialogClass: 'modal-fullscreen',
        backdrop: 'static',
        keyboard: false,
        centered: false,
      }
    );

    // Truyền ID và etData vào component
    modalRef.componentInstance.etId = etToView.ID;
    modalRef.componentInstance.masterId = etToView.ID;
    modalRef.componentInstance.etData = etToView;

    modalRef.result.then(
      (result) => {
        // Nếu cần refresh sau khi đóng modal
        if (result?.action === 'refresh') {
          this.searchET();
        }
      },
      (reason) => {
        // Dismissed - không làm gì
      }
    );
  }

  approvedET(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn bản ghi để duyệt!');
      return;
    }

    // Lọc ra các bản ghi chưa duyệt
    const notApprovedRows = selectedRows.filter((row) => !row.isApproved);
    if (notApprovedRows.length === 0) {
      this.notification.warning('Thông báo', 'Tất cả bản ghi đã được duyệt!');
      return;
    }

    // Lấy tên bảng chấm công đầu tiên (focused row)
    const focusedRow = this.tb_ET?.getSelectedRows()[0];
    const timekeepingName = focusedRow
      ? focusedRow.getData()['Name']
      : selectedRows[0]?.['Name'] || '';

    let confirmMessage = '';
    if (notApprovedRows.length === 1) {
      confirmMessage = `Bạn có chắc chắn muốn duyệt bảng chấm công <strong>"${notApprovedRows[0].Name}"</strong> không?`;
    } else {
      confirmMessage = `Bạn có chắc chắn muốn duyệt <strong>${notApprovedRows.length}</strong> bản ghi đã chọn không?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveET(notApprovedRows),
    });
  }

  private confirmApproveET(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            'Thông báo',
            `Duyệt thành công ${successCount}/${selectedRows.length} bản ghi!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchET();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];

      // Kiểm tra đã duyệt chưa
      if (item.isApproved) {
        approveNext(index + 1);
        return;
      }

      const approveData = {
        ...item,
        isApproved: true,
        UpdatedBy: this.etService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.etService.saveData(approveData).subscribe({
        next: (res: any) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          approveNext(index + 1);
        },
        error: () => {
          failedCount++;
          approveNext(index + 1);
        },
      });
    };

    approveNext(0);
  }

  cancelApprovedET(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn bản ghi để hủy duyệt!'
      );
      return;
    }

    // Lọc ra các bản ghi đã duyệt
    const approvedRows = selectedRows.filter((row) => row.isApproved);
    if (approvedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có bản ghi nào đã được duyệt!'
      );
      return;
    }

    let confirmMessage = '';
    if (approvedRows.length === 1) {
      confirmMessage = `Bạn có chắc chắn muốn hủy duyệt bảng chấm công <strong>"${approvedRows[0].Name}"</strong> không?`;
    } else {
      confirmMessage = `Bạn có chắc chắn muốn hủy duyệt <strong>${approvedRows.length}</strong> bản ghi đã chọn không?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt',
      nzContent: confirmMessage,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApprovedET(approvedRows),
    });
  }

  private confirmCancelApprovedET(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            'Thông báo',
            `Hủy duyệt thành công ${successCount}/${selectedRows.length} bản ghi!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchET();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];

      // Kiểm tra đã duyệt chưa
      if (!item.isApproved) {
        cancelNext(index + 1);
        return;
      }

      const cancelData = {
        ...item,
        isApproved: false,
        UpdatedBy: this.etService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.etService.saveData(cancelData).subscribe({
        next: (res: any) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          cancelNext(index + 1);
        },
        error: () => {
          failedCount++;
          cancelNext(index + 1);
        },
      });
    };

    cancelNext(0);
  }
}
