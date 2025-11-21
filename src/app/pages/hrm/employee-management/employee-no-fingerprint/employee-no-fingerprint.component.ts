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
import { firstValueFrom } from 'rxjs';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// XLSX for Excel export
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

// Services and Components
import { EmployeeNofingerprintService } from './employee-no-fingerprint-service/employee-no-fingerprint.service';
import { ENFDetailComponent } from './ENF-detail/ENF-detail.component';

@Component({
  selector: 'app-enf',
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
  templateUrl: './employee-no-fingerprint.component.html',
  styleUrls: ['./employee-no-fingerprint.component.css'],
})
export class EmployeeNoFingerprintComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // #region ViewChild and Properties
  @ViewChild('tb_ENF', { static: false }) tb_ENFRef!: ElementRef;

  // Table instance
  tb_ENF!: Tabulator;

  // Loading states
  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  // UI states
  sizeSearch: string = '0';

  // Search filters
  selectedDepartmentFilter: number | null = null;
  selectedTBPStatusFilter: number = -1;
  searchValue: string = '';
  dateStart: Date = DateTime.local().startOf('month').toJSDate();
  dateEnd: Date = DateTime.local().endOf('month').toJSDate();

  // Convert Date -> ISO khi build params
  private toISODate(d: Date | null | undefined): string {
    if (!d) return '';
    return DateTime.fromJSDate(d).toISODate()!; // "YYYY-MM-DD"
  }
  // Data
  departmentList: any[] = [];

  // Selection tracking
  selectedENF: any[] = [];
  selectedRows: any[] = [];
  lastSelectedENF: any | null = null;
  // #endregion

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private enfService: EmployeeNofingerprintService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService
  ) {}

  // #region Lifecycle Hooks
  ngOnInit(): void {
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_ENF) {
      this.tb_ENF.destroy();
    }
  }
  // #endregion

  // #region Data Loading
  private loadDepartments(): void {
    this.enfService.getDepartments().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.departmentList = response.data || [];
          console.log('Departments loaded:', this.departmentList.length);
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Không thể tải danh sách phòng ban'
          );
          this.departmentList = [];
        }
      },
      error: (error) => {
        console.error('Load departments error:', error);
        this.notification.error(
          'Lỗi',
          'Không thể tải danh sách phòng ban. Vui lòng thử lại sau.'
        );
        this.departmentList = [];
      },
    });
  }
  // #endregion

  // #region Table Setup
  private initializeTable(): void {
    if (!this.tb_ENFRef) {
      console.error('Table container not found');
      return;
    }
    this.drawTbenf(this.tb_ENFRef.nativeElement);
  }

  private drawTbenf(container: HTMLElement): void {
    console.log('Creating enf table...');

    this.tb_ENF = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 100,
      paginationSizeSelector: [100, 200, 400, 800, 1000],

      ajaxURL: this.enfService.getENFListURL(),
      ajaxConfig: 'GET',
      ajaxParams: this.getENFAjaxParams(), // Add initial params
      ajaxResponse: (url: any, params: any, res: any) => {
        let totalPage = 0;
        if (res.data.length != 0) {
          totalPage = res.data[0].TotalPage;
        }
        return {
          data: res.data,
          last_page: totalPage,
        };
      },
      ajaxError: (error: any) => {
        console.error('ENF AJAX Error:', error);
        this.message.error(
          'Lỗi khi tải dữ liệu ENF: ' + (error.message || error)
        );
        return [];
      },

      rowContextMenu: this.getContextMenu(),
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      selectableRows: true,
      selectableRowsRangeMode: 'click',
      groupBy: ['DepartmentName'],
      groupByStartOpen: true,
      groupHeader: (value: any) => `Phòng ban: ${value}`,
      columns: this.getTableColumns(),
    } as any);

    this.setupTableEvents();
  }

  private getContextMenu(): any[] {
    return [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-ban"></i> TBP Hủy duyệt</span>',
        action: () => this.cancelApproveTBP(),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-user-slash"></i> HR Hủy duyệt</span>',
        action: () => this.cancelApprovedHR(),
      },
    ];
  }

  private getTableColumns(): any[] {
    return [
      {
        title: 'Chọn',
        titleFormatter: () => `<input type="checkbox" />`,
        field: 'Selected',
        formatter: (cell: any) => {
          const checked = cell.getValue() ? 'checked' : '';
          return `<input type='checkbox' ${checked} />`;
        },
        headerClick: (e: any, column: any) => {
          const isChecked = (e.target as HTMLInputElement).checked;
          column
            .getTable()
            .getRows()
            .forEach((row: any) => {
              row.update({ Selected: isChecked });
            });
        },
        cellClick: (e: any, cell: any) => {
          const newValue = !cell.getValue();
          cell.setValue(newValue);
        },
        hozAlign: 'center',
        headerHozAlign: 'center',
        headerSort: false,
        width: 50,
        frozen: true,
      },
      {
        title: 'TBP Duyệt',
        field: 'StatusText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatApprovalBadge(cell.getValue()),
      },
      {
        title: 'HR Duyệt',
        field: 'StatusHRText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatApprovalBadge(cell.getValue()),
      },
      {
        title: 'Mã nhân viên',
        field: 'Code',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Tên nhân viên',
        field: 'FullName',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Người duyệt ',
        field: 'ApprovedName',
        width: 140,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Ngày',
        field: 'DayWork',
        width: 110,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatDateOnly(cell.getValue()),
      },
      {
        title: 'Loại',
        field: 'TypeText',
        width: 140,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Ghi chú',
        field: 'Note',
        width: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Lý do sửa',
        field: 'ReasonHREdit',
        width: 150,
        headerHozAlign: 'center',
      },
      {
        title: 'Lý do không đồng ý',
        field: 'ReasonDeciline',
        width: 180,
        headerHozAlign: 'center',
      },
    ];
  }

  private setupTableEvents(): void {
    this.tb_ENF.on('dataLoading', () => {
      console.log('ENF Data loading...');
      this.isLoadTable = true;
      this.tb_ENF.deselectRow();
    });

    this.tb_ENF.on('dataLoaded', (data: any) => {
      console.log('ENF Data loaded:', data.length, 'items');
      this.isLoadTable = false;
    });

    this.tb_ENF.on('dataLoadError', (error: any) => {
      console.error('ENF Data Load Error:', error);
      this.isLoadTable = false;
      this.message.error(
        'Lỗi khi tải dữ liệu ENF: ' + (error.message || 'Unknown error')
      );
    });

    this.tb_ENF.on('rowClick', (e: any, row: any) => {
      this.selectedENF = row.getData();
      this.lastSelectedENF = row.getData();
    });

    this.tb_ENF.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedRows = rows.map((row: any) => row.getData());
      if (rows.length > 0) {
        this.selectedENF = rows[rows.length - 1].getData();
        this.lastSelectedENF = this.selectedENF;
      } else {
        this.selectedENF = [];
        this.lastSelectedENF = null;
      }
    });

    this.tb_ENF.on('tableBuilt', () => {
      console.log('ENF table built successfully');
      this.isTableReady = true;
      // Load data after table is built
      this.searchenf();
    });

    this.tb_ENF.on('rowDblClick', (e: any, row: any) => {
      this.selectedENF = row.getData();
      this.lastSelectedENF = row.getData();
      this.editenf();
    });

    this.tb_ENF.on('renderStarted', () => {
      setTimeout(() => {
        if (this.isLoadTable) {
          this.isLoadTable = false;
        }
      }, 10000);
    });
  }
  // #endregion

  // #region Search and Filter
  searchenf(): void {
    if (!this.isTableReady) {
      console.log('Table not ready yet');
      return;
    }

    const params = this.getENFAjaxParams();
    console.log('Searching ENF with params:', params);

    this.tb_ENF.setData(this.enfService.getENFListURL(), params);
  }

  private getENFAjaxParams(): any {
    const currentPage = this.tb_ENF ? this.tb_ENF.getPage() : 1;
    const currentSize = this.tb_ENF ? this.tb_ENF.getPageSize() : 100;

    return {
      pageNumber: currentPage,
      pageSize: currentSize,
      dateStart: this.toISODate(this.dateStart), // "YYYY-MM-DD"
      dateEnd: this.toISODate(this.dateEnd),
      keyword: this.searchValue?.trim() || '',
      departmentId: this.selectedDepartmentFilter || 0,
      idApprovedTP: 0,
      status:
        this.selectedTBPStatusFilter === null ||
        this.selectedTBPStatusFilter === undefined
          ? -1
          : this.selectedTBPStatusFilter,
      isDelete: 0,
    };
  }

  onDepartmentFilterChange(): void {
    this.searchenf();
  }

  onTBPStatusFilterChange(): void {
    this.searchenf();
  }

  onSearch(): void {
    this.searchenf();
  }

  resetSearch(): void {
    this.selectedDepartmentFilter = null;
    this.selectedTBPStatusFilter = -1;
    this.searchValue = '';
    this.dateStart = DateTime.local().startOf('month').toJSDate();
    this.dateEnd = DateTime.local().endOf('month').toJSDate();

    if (this.tb_ENF) {
      this.tb_ENF.clearData();
      this.tb_ENF.setPage(1);
    }
    
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }
  // #endregion

  // #region Selection Management
  selectAllRows(): void {
    if (!this.tb_ENF) return;

    this.tb_ENF.getRows().forEach((row: any) => {
      row.update({ Selected: true });
    });
    this.message.info('Đã chọn tất cả bản ghi trên trang hiện tại');
  }

  deselectAllRows(): void {
    if (!this.tb_ENF) return;

    this.tb_ENF.getRows().forEach((row: any) => {
      row.update({ Selected: false });
    });
  }

  getSelectedRows(): any[] {
    if (!this.tb_ENF) return [];
    return this.tb_ENF.getData().filter((row: any) => row.Selected === true);
  }

  getSelectedRowsCount(): number {
    return this.getSelectedRows().length;
  }

  private getCurrentSelectedenf(): any | null {
    if (this.lastSelectedENF) return this.lastSelectedENF;
    if (this.selectedENF) return this.selectedENF;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }

  private clearSelection(): void {
    this.selectedENF = [];
    this.lastSelectedENF = null;
    this.deselectAllRows();
  }
  // #endregion

  // #region CRUD Operations
  addenf(): void {
    const modalRef = this.ngbModal.open(ENFDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.enfData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchenf();
        this.notification.success('Thông báo', 'Thêm ENF thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  editenf(): void {
    const enfToEdit = this.getCurrentSelectedenf();

    if (!enfToEdit) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 ENF cần sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.ngbModal.open(ENFDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.enfData = enfToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchenf();
        this.notification.success('Thông báo', 'Sửa ENF thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  deleteenf(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần xóa!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    // Kiểm tra trạng thái duyệt
    const approvedRows = selectedRows.filter(
      (row) =>
        row.StatusText === 'Đã duyệt' ||
        row.StatusHRText === 'Đã duyệt' ||
        row.IsApprovedBGDText === 'Đã duyệt'
    );
    if (approvedRows.length > 0) {
      this.notification.warning(
        'Thông báo',
        'Có bản ghi đã được duyệt. Vui lòng hủy duyệt trước khi xóa!'
      );
      return;
    }

    const count = selectedRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa ENF của <strong>"${selectedRows[0].EmployeeName}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi ENF đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteenf(selectedRows),
    });
  }

  private confirmDeleteenf(selectedRows: any[] = []): void {
    if (selectedRows.length === 0) {
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
      const deleteData = {
        ...item,
        IsDelete: true,
        UpdatedBy: this.enfService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.enfService.saveData(deleteData).subscribe({
        next: (res) => {
          if (res?.status === 1) successCount++;
          else failedCount++;
          deleteNext(index + 1);
        },
        error: (err) => {
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
        `Đã xóa ${successCount}/${totalCount} bản ghi ENF thành công!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
      this.searchenf();
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
  // #endregion

  approvedTBP(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần duyệt!'
      );
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn TBP duyệt ${selectedRows.length} bản ghi ENF đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(selectedRows),
    });
  }

  private confirmApproveTBP(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const empId = this.enfService.GlobalEmployeeId;
    const isAdmin = this.enfService.ISADMIN;
    const userDeptId = this.enfService.GlobalDepartmentId;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `TBP đã duyệt ${successCount}/${selectedRows.length} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // Nếu không phải admin, kiểm tra phòng ban và người duyệt
      if (!isAdmin) {
        if (item.DepartmentID !== userDeptId && userDeptId !== 1) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên [${item.FullName}] không thuộc phòng của bạn.`
          );
          approveNext(index + 1);
          return;
        }
        if (item.ApprovedTP !== empId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không phải người duyệt TBP của nhân viên này.`
          );
          approveNext(index + 1);
          return;
        }
      }

      // Chỉ duyệt nếu chưa duyệt TBP
      if (item.IsApprovedTP) {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt TBP
      const approveData = {
        ...item,
        IsApprovedTP: true,
        StatusText: 'Đã duyệt',
        UpdatedBy: this.enfService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };
      this.enfService.saveData(approveData).subscribe({
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

  approvedHR(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần duyệt!'
      );
      return;
    }
    // Chỉ cho HR duyệt nếu TBP đã duyệt
    const notApprovedTBP = selectedRows.filter(
      (x) => x.StatusText !== 'Đã duyệt'
    );
    if (notApprovedTBP.length > 0) {
      this.notification.warning(
        'Thông báo',
        'Chỉ duyệt HR cho các bản ghi đã được TBP duyệt!'
      );
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt HR',
      nzContent: `Bạn có chắc chắn muốn HR duyệt ${selectedRows.length} bản ghi ENF đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHR(selectedRows),
    });
  }

  private confirmApproveHR(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `HR đã duyệt ${successCount}/${selectedRows.length} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // HR chỉ duyệt nếu TBP đã duyệt và HR chưa duyệt
      if (item.StatusText !== 'Đã duyệt' || item.StatusHRText === 'Đã duyệt') {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt HR
      const approveData = { ...item, StatusHR: 1, IsApprovedHR: true };
      this.enfService.saveData(approveData).subscribe({
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

  cancelApprovedHR(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần hủy duyệt HR!'
      );
      return;
    }
    const confirmMsg =
      selectedRows.length === 1
        ? `Bạn có chắc muốn hủy duyệt HR cho nhân viên [${selectedRows[0].EmployeeName}]?`
        : `Bạn có chắc muốn hủy duyệt HR cho ${selectedRows.length} nhân viên đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt HR',
      nzContent: confirmMsg,
      nzOkText: 'Hủy duyệt HR',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApprovedHR(selectedRows),
    });
  }

  private confirmCancelApprovedHR(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `HR đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];
      // Hủy duyệt HR
      const cancelData = { ...item, IsApprovedHR: false, ApprovedHR: 0 };
      this.enfService.saveData(cancelData).subscribe({
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

  cancelApproveTBP(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 ENF cần hủy duyệt!'
      );
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt TBP ${selectedRows.length} bản ghi ENF đã chọn không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApproveTBP(selectedRows),
    });
  }

  private confirmCancelApproveTBP(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const empId = this.enfService.GlobalEmployeeId;
    const isAdmin = this.enfService.ISADMIN;
    const userDeptId = this.enfService.GlobalDepartmentId;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `TBP đã hủy duyệt ${successCount}/${selectedRows.length} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchenf();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // Nếu không phải admin, kiểm tra phòng ban và người duyệt
      if (!isAdmin) {
        if (item.DepartmentID !== userDeptId && userDeptId !== 1) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên [${item.FullName}] không thuộc phòng của bạn.`
          );
          cancelNext(index + 1);
          return;
        }
        if (item.ApprovedTP !== empId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không phải người duyệt TBP của nhân viên này.`
          );
          cancelNext(index + 1);
          return;
        }
      }

      // Chỉ hủy duyệt nếu đã duyệt TBP
      if (!item.IsApprovedTP) {
        cancelNext(index + 1);
        return;
      }

      // Nếu HR chưa hủy duyệt thì TBP không được hủy duyệt
      if (item.IsApprovedHR) {
        this.notification.warning(
          'Thông báo',
          `HR chưa hủy duyệt bản ghi của nhân viên [${item.FullName}]. TBP không thể hủy duyệt!`
        );
        cancelNext(index + 1);
        return;
      }

      // Gọi API hủy duyệt TBP
      const cancelData = {
        ...item,
        IsApprovedTP: false,
        StatusText: 'Chưa duyệt',
        UpdatedBy: this.enfService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };
      this.enfService.saveData(cancelData).subscribe({
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
  // #endregion

  // #region Export Excel
  exportExcel(): void {
    if (!this.tb_ENF) {
      this.notification.error('Thông báo', 'Bảng dữ liệu chưa sẵn sàng!');
      return;
    }

    const allData = this.tb_ENF.getData();

    if (allData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất!');
      return;
    }

    try {
      this.message.loading('Đang xuất file Excel...', { nzDuration: 2000 });

      const exportData = this.prepareExportData(allData);
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = this.getExcelColumnWidths();

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách ENF');

      const filename = this.generateExcelFilename();
      XLSX.writeFile(workbook, filename);

      setTimeout(() => {
        this.notification.success(
          'Thông báo',
          `Đã xuất ${allData.length} bản ghi ENF ra file Excel thành công!`,
          { nzStyle: { fontSize: '0.75rem' } }
        );
      }, 2000);
    } catch (error) {
      console.error('Export Excel error:', error);
      this.notification.error(
        'Thông báo',
        'Lỗi khi xuất file Excel: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định')
      );
    }
  }

  private prepareExportData(allData: any[]): any[] {
    return allData.map((item: any, index: number) => ({
      STT: index + 1,
      'Mã nhân viên': item.EmployeeCode || item.Code || '',
      'Tên nhân viên': item.EmployeeName || item.FullName || '',
      'Phòng ban': item.DepartmentName || '',
      'Ngày tạo': this.formatDateForExcel(item.CreatedDate),
      'Ngày làm việc': this.formatDateOnlyForExcel(item.DayWork),
      Loại: item.TypeText || '',
      'Ghi chú': item.Note || '',
      'Trạng thái TBP': item.StatusText || '',
      'Trạng thái HR': item.StatusHRText || '',
      'Người duyệt TBP': item.ApprovedName || '',
      'Lý do sửa đổi': item.ReasonHREdit || '',
      'Lý do từ chối': item.ReasonDeciline || '',
    }));
  }

  private getExcelColumnWidths(): any[] {
    return [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
    ];
  }

  private generateExcelFilename(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `DanhSachDangKyENF_T${currentMonth}_${currentYear}.xlsx`;
  }
  // #endregion

  private formatDateForExcel(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      // Format: dd/MM/yyyy HH:mm cho Excel
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  }

  // Thêm method riêng cho format ngày ENF (chỉ ngày, không giờ)
  private formatDateOnly(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);

      // Format: dd/MM/yyyy (chỉ ngày)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  private formatDateOnlyForExcel(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      // Format: dd/MM/yyyy cho Excel
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Date format error:', error);
      return '';
    }
  }

  private formatApprovalBadge(status: string): string {
    if (!status) return '';

    const statusMap: { [key: string]: string } = {
      'Chưa duyệt':
        '<span class="badge bg-warning text-dark">Chưa duyệt</span>',
      'Đã duyệt': '<span class="badge bg-success">Đã duyệt</span>',
      'Từ chối': '<span class="badge bg-danger">Từ chối</span>',
    };

    return (
      statusMap[status] || `<span class="badge bg-secondary">${status}</span>`
    );
  }
}
