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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// XLSX for Excel export
import * as XLSX from 'xlsx';

// Services and Components
import { WFHService, WFHDto, DepartmentDto } from './WFH-service/WFH.service';
import { WFHDetailComponent } from './WFH-detail/WFH-detail.component';

@Component({
  selector: 'app-wfh',
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
  templateUrl: './WFH.component.html',
  styleUrls: ['./WFH.component.css'],
})
export class WFHComponent implements OnInit, AfterViewInit, OnDestroy {
  // #region ViewChild and Properties
  @ViewChild('tb_WFH', { static: false }) tb_WFHRef!: ElementRef;

  // Table instance
  tb_WFH!: Tabulator;

  // Loading states
  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  // UI states
  sizeSearch: string = '0';

  // Search filters
  year: Date = new Date();
  month: number = new Date().getMonth() + 1;
  selectedDepartmentFilter: number | null = null;
  selectedTBPStatusFilter: number = -1;
  searchValue: string = '';

  // Data
  departmentList: DepartmentDto[] = [];

  // Selection tracking
  selectedWFH: WFHDto | null = null;
  selectedRows: WFHDto[] = [];
  lastSelectedWFH: WFHDto | null = null;
  // #endregion

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private wfhService: WFHService,
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
    if (this.tb_WFH) {
      this.tb_WFH.destroy();
    }
  }
  // #endregion

  // #region Data Loading
  private loadDepartments(): void {
    this.wfhService.getDepartments().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.departmentList = response.data || [];
          console.log('Departments loaded:', this.departmentList.length);
        } else {
          this.message.error('Không thể tải danh sách phòng ban');
        }
      },
      error: (error) => {
        console.error('Load departments error:', error);
        this.message.error('Lỗi khi tải danh sách phòng ban');
        this.departmentList = [];
      },
    });
  }
  // #endregion

  // #region Table Setup
  private initializeTable(): void {
    if (!this.tb_WFHRef) {
      console.error('Table container not found');
      return;
    }
    this.drawTbWFH(this.tb_WFHRef.nativeElement);
  }

  private drawTbWFH(container: HTMLElement): void {
    console.log('Creating WFH table...');

    this.tb_WFH = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 100,
      paginationSizeSelector: [100, 200, 400, 800, 1000],

      ajaxURL: this.wfhService.getWFHListURL(),
      ajaxConfig: 'GET',
      ajaxResponse: (url, params, res) => {
        console.log('Total pages:', res.totalPage);
        return {
          data: res.data,
          last_page: res.totalPage,
        };
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
        action: () => this.cancelApprovedTBP(),
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
        title: 'BGĐ Duyệt',
        field: 'IsApprovedBGDText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatApprovalBadge(cell.getValue()),
      },
      {
        title: 'Người đăng ký',
        field: 'EmployeeName',
        width: 160,
        headerHozAlign: 'center',
        sorter: 'string',
      },
      {
        title: 'Tên TBP Duyệt',
        field: 'ApprovedName',
        width: 140,
        headerHozAlign: 'center',
      },
      {
        title: 'Tên BGĐ Duyệt',
        field: 'FullNameBGD',
        width: 140,
        headerHozAlign: 'center',
      },
      {
        title: 'Ngày tạo',
        field: 'CreatedDate',
        width: 110,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatDate(cell.getValue()),
      },
      {
        title: 'Ngày WFH',
        field: 'DateWFH',
        width: 110,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatDateOnly(cell.getValue()),
      },
      {
        title: 'Khoảng thời gian',
        field: 'TimeWFHText',
        width: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Lý do',
        field: 'Reason',
        width: 200,
        headerHozAlign: 'center',
      },
      {
        title: 'Nội dung/Kế hoạch công việc',
        field: 'ContentWork',
        width: 250,
        headerHozAlign: 'center',
      },
      {
        title: 'Đánh giá kết quả',
        field: 'EvaluateResults',
        width: 200,
        headerHozAlign: 'center',
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
    this.tb_WFH.on('dataLoading', () => {
      this.isLoadTable = true;
      this.tb_WFH.deselectRow();
    });

    this.tb_WFH.on('dataLoaded', (data: any) => {
      console.log('WFH Data loaded:', data.length, 'items');
      this.isLoadTable = false;
    });

    this.tb_WFH.on('dataLoadError', (error: any) => {
      console.error('WFH Data Load Error:', error);
      this.isLoadTable = false;
      this.message.error(
        'Lỗi khi tải dữ liệu WFH: ' + (error.message || 'Unknown error')
      );
    });

    this.tb_WFH.on('rowClick', (e: any, row: any) => {
      this.selectedWFH = row.getData();
      this.lastSelectedWFH = row.getData();
    });

    this.tb_WFH.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedRows = rows.map((row: any) => row.getData());
      if (rows.length > 0) {
        this.selectedWFH = rows[rows.length - 1].getData();
        this.lastSelectedWFH = this.selectedWFH;
      } else {
        this.selectedWFH = null;
        this.lastSelectedWFH = null;
      }
    });

    this.tb_WFH.on('tableBuilt', () => {
      console.log('WFH table built successfully');
      this.isTableReady = true;
    });

    this.tb_WFH.on('rowDblClick', (e: any, row: any) => {
      this.selectedWFH = row.getData();
      this.lastSelectedWFH = row.getData();
      this.editWFH();
    });

    this.tb_WFH.on('renderStarted', () => {
      setTimeout(() => {
        if (this.isLoadTable) {
          this.isLoadTable = false;
        }
      }, 10000);
    });
  }
  // #endregion

  // #region Search and Filter
  private getWFHAjaxParams(): any {
    const currentPage = this.tb_WFH ? this.tb_WFH.getPage() : 1;
    const currentSize = this.tb_WFH ? this.tb_WFH.getPageSize() : 100;

    return {
      page: currentPage,
      size: currentSize,
      year: this.year ? this.year.getFullYear() : new Date().getFullYear(),
      month: this.month || 0,
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

  searchWFH(): void {
    if (!this.isTableReady) {
      console.log('Table not ready yet');
      return;
    }

    console.log('Searching WFH with params:', this.getWFHAjaxParams());
    this.tb_WFH.setData(
      this.wfhService.getWFHListURL(),
      this.getWFHAjaxParams()
    );
  }

  onDepartmentFilterChange(): void {
    this.searchWFH();
  }

  onTBPStatusFilterChange(): void {
    this.searchWFH();
  }

  onSearch(): void {
    this.searchWFH();
  }

  resetSearch(): void {
    this.year = new Date();
    this.month = null;
    this.selectedDepartmentFilter = null;
    this.selectedTBPStatusFilter = -1;
    this.searchValue = '';

    if (this.tb_WFH) {
      this.tb_WFH.clearData();
      this.tb_WFH.setPage(1);
    }
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }
  // #endregion

  // #region Selection Management
  selectAllRows(): void {
    if (!this.tb_WFH) return;

    this.tb_WFH.getRows().forEach((row: any) => {
      row.update({ Selected: true });
    });
    this.message.info('Đã chọn tất cả bản ghi trên trang hiện tại');
  }

  deselectAllRows(): void {
    if (!this.tb_WFH) return;

    this.tb_WFH.getRows().forEach((row: any) => {
      row.update({ Selected: false });
    });
  }

  getSelectedRows(): WFHDto[] {
    if (!this.tb_WFH) return [];
    return this.tb_WFH.getData().filter((row: any) => row.Selected === true);
  }

  getSelectedRowsCount(): number {
    return this.getSelectedRows().length;
  }

  private getCurrentSelectedWFH(): WFHDto | null {
    if (this.lastSelectedWFH) return this.lastSelectedWFH;
    if (this.selectedWFH) return this.selectedWFH;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }

  private clearSelection(): void {
    this.selectedWFH = null;
    this.lastSelectedWFH = null;
    this.deselectAllRows();
  }
  // #endregion

  // #region CRUD Operations
  addWFH(): void {
    const modalRef = this.ngbModal.open(WFHDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.wfhData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchWFH();
        this.notification.success('Thông báo', 'Thêm WFH thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  editWFH(): void {
    const wfhToEdit = this.getCurrentSelectedWFH();

    if (!wfhToEdit) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 WFH cần sửa!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.ngbModal.open(WFHDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.wfhData = wfhToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userRole = 'employee';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchWFH();
        this.notification.success('Thông báo', 'Sửa WFH thành công!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      }
    });
  }

  deleteWFH(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 WFH cần xóa!',
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
        ? `Bạn có chắc chắn muốn xóa WFH của <strong>"${selectedRows[0].EmployeeName}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi WFH đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteWFH(selectedRows),
    });
  }

  private confirmDeleteWFH(selectedRows: WFHDto[]): void {
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
        UpdatedBy: this.wfhService.LoginName,
        UpdatedDate: new Date().toISOString(),
      };

      this.wfhService.saveData(deleteData).subscribe({
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
        `Đã xóa ${successCount}/${totalCount} bản ghi WFH thành công!`,
        { nzStyle: { fontSize: '0.75rem' } }
      );
      this.searchWFH();
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

  // #region Approval Operations
  // Giả sử bạn có thông tin user hiện tại:

  approvedTBP(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 WFH cần duyệt!'
      );
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn TBP duyệt ${selectedRows.length} bản ghi WFH đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(selectedRows),
    });
  }

  private confirmApproveTBP(selectedRows: WFHDto[]): void {
    let successCount = 0;
    let failedCount = 0;
    const empId = this.wfhService.GlobalEmployeeId;
    const isAdmin = this.wfhService.ISADMIN;
    const userDeptId = this.wfhService.GlobalDepartmentId;

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
        this.searchWFH();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      if (!isAdmin) {
        // Chỉ duyệt nếu cùng phòng hoặc là phòng ban đặc biệt (ID = 1)
        if (item.DepartmentID !== userDeptId && userDeptId !== 1) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên [${item.EmployeeName}] không thuộc phòng của bạn. Vui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
        // Chỉ duyệt nếu mình là người duyệt TBP
        if (item.ApprovedID !== empId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không thể duyệt cho nhân viên thuộc nhóm khác. Vui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
      }

      // Chỉ duyệt nếu chưa duyệt TBP
      if (item.StatusText === 'Đã duyệt') {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt TBP
      const approveData = { ...item, Status: 1, IsApproved: true };
      this.wfhService.saveData(approveData).subscribe({
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
        'Vui lòng chọn ít nhất 1 WFH cần duyệt!'
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
      nzContent: `Bạn có chắc chắn muốn HR duyệt ${selectedRows.length} bản ghi WFH đã chọn không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHR(selectedRows),
    });
  }

  private confirmApproveHR(selectedRows: WFHDto[]): void {
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
        this.searchWFH();
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
      this.wfhService.saveData(approveData).subscribe({
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
        'Vui lòng chọn ít nhất 1 WFH cần hủy duyệt HR!'
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

  private confirmCancelApprovedHR(selectedRows: WFHDto[]): void {
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
        this.searchWFH();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];
      // Hủy duyệt HR
      const cancelData = { ...item, IsApprovedHR: false, ApprovedHR: 0 };
      this.wfhService.saveData(cancelData).subscribe({
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

  cancelApprovedTBP(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 WFH cần hủy duyệt TBP!'
      );
      return;
    }
    const confirmMsg =
      selectedRows.length === 1
        ? `Bạn có chắc muốn hủy duyệt TBP cho nhân viên [${selectedRows[0].EmployeeName}]?`
        : `Bạn có chắc muốn hủy duyệt TBP cho ${selectedRows.length} nhân viên đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: confirmMsg,
      nzOkText: 'Hủy duyệt TBP',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApprovedTBP(selectedRows),
    });
  }

  private confirmCancelApprovedTBP(selectedRows: WFHDto[]): void {
    let successCount = 0;
    let failedCount = 0;
    const empId = this.wfhService.GlobalEmployeeId;
    const isAdmin = this.wfhService.ISADMIN;
    const userDeptId = this.wfhService.GlobalDepartmentId;
    const totalCount = selectedRows.length;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          'Thông báo',
          `TBP đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            'Thông báo',
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchWFH();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // Nếu không phải admin, kiểm tra phòng ban và người duyệt
      if (!isAdmin) {
        if (item.DepartmentID !== userDeptId && userDeptId !== 1) {
          this.notification.warning(
            'Thông báo',
            `Nhân viên [${item.EmployeeName}] không thuộc phòng của bạn. Vui lòng kiểm tra lại!`
          );
          cancelNext(index + 1);
          return;
        }
        if (item.ApprovedID !== empId) {
          this.notification.warning(
            'Thông báo',
            `Bạn không thể hủy duyệt cho nhân viên thuộc nhóm khác. Vui lòng kiểm tra lại!`
          );
          cancelNext(index + 1);
          return;
        }
      }

      // Nếu chưa duyệt TBP thì bỏ qua
      if (!item.IsApproved) {
        cancelNext(index + 1);
        return;
      }
      // Nếu HR đã duyệt thì không cho hủy TBP
      if (item.IsApprovedHR) {
        this.notification.warning(
          'Thông báo',
          `Nhân viên [${item.EmployeeName}] đã được HR duyệt. Vui lòng hủy duyệt HR trước!`
        );
        cancelNext(index + 1);
        return;
      }

      // Hủy duyệt TBP
      const cancelData = { ...item, IsApproved: false, Status: 0 };
      this.wfhService.saveData(cancelData).subscribe({
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
    if (!this.tb_WFH) {
      this.notification.error('Thông báo', 'Bảng dữ liệu chưa sẵn sàng!');
      return;
    }

    const allData = this.tb_WFH.getData();

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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách WFH');

      const filename = this.generateExcelFilename();
      XLSX.writeFile(workbook, filename);

      setTimeout(() => {
        this.notification.success(
          'Thông báo',
          `Đã xuất ${allData.length} bản ghi WFH ra file Excel thành công!`,
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

  private prepareExportData(allData: WFHDto[]): any[] {
    return allData.map((item: WFHDto, index: number) => ({
      STT: index + 1,
      'Mã nhân viên': item.EmployeeCode || '',
      'Tên nhân viên': item.EmployeeName || '',
      'Phòng ban': item.DepartmentName || '',
      'Ngày tạo': this.formatDateForExcel(item.CreatedDate),
      'Ngày WFH': this.formatDateOnlyForExcel(item.DateWFH),
      'Khoảng thời gian': item.TimeWFHText || '',
      'Lý do WFH': item.Reason || '',
      'Nội dung công việc': item.ContentWork || '',
      'Trạng thái TBP': item.StatusText || '',
      'Trạng thái HR': item.StatusHRText || '',
      'Trạng thái BGĐ': item.IsApprovedBGDText || '',
      'Người duyệt TBP': item.ApprovedName || '',
      'Người duyệt BGĐ': item.FullNameBGD || '',
      'Đánh giá kết quả': item.EvaluateResults || '',
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
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
    ];
  }

  private generateExcelFilename(): string {
    const currentYear = this.year
      ? this.year.getFullYear()
      : new Date().getFullYear();
    const currentMonth = this.month || new Date().getMonth() + 1;
    return `DanhSachDangKyWFH_T${currentMonth}_${currentYear}.xlsx`;
  }
  // #endregion

  // #region Utility Methods
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);

      // Format: dd/MM/yyyy HH:mm
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  }

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

  // Thêm method riêng cho format ngày WFH (chỉ ngày, không giờ)
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
