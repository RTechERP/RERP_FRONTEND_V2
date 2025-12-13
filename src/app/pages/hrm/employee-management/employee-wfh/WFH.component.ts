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
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

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
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import{HasPermissionDirective} from '../../../../directives/has-permission.directive';
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
    NzDropDownModule,
    NzMenuModule,
    HasPermissionDirective
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
  
  // Current user info
  currentUser: any = null;
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  isAdmin: boolean = false;
  // #endregion

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private wfhService: WFHService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService,
    private authService: AuthService
  ) {}

  // #region Lifecycle Hooks
  ngOnInit(): void {
    this.loadDepartments();
    this.getCurrentUser();
  }
  
  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.currentEmployeeId = data.EmployeeID || 0;
        this.currentDepartmentId = data?.DepartmentID || 0;
        this.currentDepartmentName = data?.DepartmentName || '';
        this.isAdmin = data?.ISADMIN || false;
      }
    });
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
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách phòng ban');
        }
      },
      error: (error) => {
        console.error('Load departments error:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
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
    
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    this.tb_WFH = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      layout: 'fitColumns',

      ajaxURL: this.wfhService.getWFHListURL(),
      ajaxConfig: 'POST',
      ajaxRequestFunc: (url: any, config: any, params: any) => {
        const requestParams = {
          Page: params.page || 1,
          Size: params.size || 100,
          Year: this.year ? this.year.getFullYear() : new Date().getFullYear(),
          Month: this.month || 0,
          Keyword: this.searchValue?.trim() || '',
          DepartmentId: this.selectedDepartmentFilter || 0,
          IdApprovedTP: 0,
          Status:
            this.selectedTBPStatusFilter === null ||
            this.selectedTBPStatusFilter === undefined
              ? -1
              : this.selectedTBPStatusFilter,
        };
        return this.wfhService.getWFHListPost(requestParams);
      },
      ajaxResponse: (url: any, params: any, res: any) => {
        console.log('API Response:', res);
        // Response structure: { status: 1, data: { data: [...], totalPage: [...] }, message: "..." }
        if (res && res.status === 1 && res.data) {
          const data = res.data.data || [];
          // totalPage có thể là array hoặc number
          let totalPage = 1;
          if (Array.isArray(res.data.totalPage)) {
            totalPage = res.data.totalPage[0]?.TotalPage || res.data.totalPage[0] || 1;
          } else if (typeof res.data.totalPage === 'number') {
            totalPage = res.data.totalPage;
          }
          console.log('Total pages:', totalPage, 'Data count:', data.length);
        return {
            data: data,
            last_page: totalPage,
          };
        }
        console.warn('Unexpected response structure:', res);
        return {
          data: [],
          last_page: 1,
        };
      },

      rowContextMenu: this.getContextMenu(),
     
      selectableRows: true,
      selectableRowsRangeMode: 'click',
      groupBy: ['DepartmentName'],
      groupByStartOpen: true,
      groupHeader: (value: any) => `Phòng ban: ${value}`,
      columns: this.getTableColumns(isMobile),
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

  private getTableColumns(isMobile: boolean = false): any[] {
    return [
     
      {
        title: 'TBP Duyệt',
        field: 'StatusText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => {
          const value = cell.getValue();
          // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
          let numValue = 0;
          if (value === null || value === undefined) {
            numValue = 0;
          } else if (typeof value === 'number') {
            numValue = value;
          } else if (typeof value === 'string') {
            // Map string sang number
            if (value === 'Đã duyệt') numValue = 1;
            else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
            else numValue = 0; // Chưa duyệt hoặc giá trị khác
          }
          return this.formatApprovalBadge(numValue);
        },
        frozen: true,
      },
      {
        title: 'HR Duyệt',
        field: 'StatusHRText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => {
          const value = cell.getValue();
          // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
          let numValue = 0;
          if (value === null || value === undefined) {
            numValue = 0;
          } else if (typeof value === 'number') {
            numValue = value;
          } else if (typeof value === 'string') {
            // Map string sang number
            if (value === 'Đã duyệt') numValue = 1;
            else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
            else numValue = 0; // Chưa duyệt hoặc giá trị khác
          }
          return this.formatApprovalBadge(numValue);
        },
        frozen: true,
      },
      {
        title: 'BGĐ Duyệt',
        field: 'IsApprovedBGDText',
        width: 100,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => {
          const value = cell.getValue();
          // Nếu là string, convert sang number; nếu là number/null, dùng trực tiếp
          let numValue = 0;
          if (value === null || value === undefined) {
            numValue = 0;
          } else if (typeof value === 'number') {
            numValue = value;
          } else if (typeof value === 'string') {
            // Map string sang number
            if (value === 'Đã duyệt') numValue = 1;
            else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
            else numValue = 0; // Chưa duyệt hoặc giá trị khác
          }
          return this.formatApprovalBadge(numValue);
        },
        frozen: true,
      },
      {
        title: 'Người đăng ký',
        field: 'EmployeeName',
        width: 160,
        headerHozAlign: 'center',
        sorter: 'string',
        frozen: !isMobile,
      },
      {
        title: 'Tên TBP Duyệt',
        field: 'ApprovedName',   
        minWidth: 140,
        headerHozAlign: 'center',
      },
     
      {
        title: 'Tên BGĐ Duyệt',
        field: 'FullNameBGD',
        minWidth: 140,
        headerHozAlign: 'center',
      },
      // {
      //   title: 'Ngày tạo',
      //   field: 'CreatedDate',
      //   minWidth: 110,
      //   headerHozAlign: 'center',
      //   hozAlign: 'center',
      //   formatter: (cell: any) => this.formatDate(cell.getValue()),
      // },
      {
        title: 'Ngày WFH',
        field: 'DateWFH',
        minWidth: 110,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatDateOnly(cell.getValue()),
    
      },
      {
        title: 'Khoảng thời gian',
        field: 'TimeWFHText',
        minWidth: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Lý do',
        field: 'Reason',
        minWidth: 200,
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Nội dung/Kế hoạch công việc',
        field: 'ContentWork',
        minWidth: 250,
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Đánh giá kết quả',
        field: 'EvaluateResults',
        minWidth: 200,
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Lý do sửa',
        field: 'ReasonHREdit',
        minWidth: 150,
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Lý do không đồng ý',
        field: 'ReasonDeciline',
        minWidth: 180,
        headerHozAlign: 'center',
        formatter: 'textarea',
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
      this.notification.error(
        NOTIFICATION_TITLE.error,
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
      Page: currentPage,
      Size: currentSize,
      Year: this.year ? this.year.getFullYear() : new Date().getFullYear(),
      Month: this.month || 0,
      Keyword: this.searchValue?.trim() || '',
      DepartmentId: this.selectedDepartmentFilter || 0,
      IdApprovedTP: 0,
      Status:
        this.selectedTBPStatusFilter === null ||
        this.selectedTBPStatusFilter === undefined
          ? -1
          : this.selectedTBPStatusFilter,
    };
  }

  searchWFH(): void {
    if (!this.isTableReady) {
      console.log('Table not ready yet');
      return;
    }

    console.log('Searching WFH with params:', this.getWFHAjaxParams());
    // Sử dụng replaceData() để trigger ajaxRequestFunc với params mới
    this.tb_WFH.replaceData();
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
    this.month = 0;
    this.selectedDepartmentFilter = 0;
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
    // Sử dụng getSelectedRows() từ Tabulator thay vì filter
    const selectedRows = this.tb_WFH.getSelectedRows();
    return selectedRows.map((row: any) => row.getData());
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
      centered: true,
    });

    modalRef.componentInstance.wfhData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.userRole = 'employee';
    modalRef.componentInstance.currentEmployeeId = this.currentEmployeeId;

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchWFH();
        this.notification.success(NOTIFICATION_TITLE.success, 'Thêm WFH thành công!');
      }
    });
  }

  editWFH(): void {
    const wfhToEdit = this.getCurrentSelectedWFH();

    if (!wfhToEdit) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn 1 WFH cần sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(WFHDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.wfhData = wfhToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.userRole = 'employee';
    modalRef.componentInstance.currentEmployeeId = this.currentEmployeeId;


    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchWFH();
        this.notification.success(NOTIFICATION_TITLE.success, 'Sửa WFH thành công!');
      }
    });
  }

  deleteWFH(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất 1 WFH cần xóa!'
      );
      return;
    }

    // Lọc ra các phiếu TBP chưa duyệt (có thể xóa)
    const deletableRows = selectedRows.filter(
      (row) => row.StatusText !== 'Đã duyệt'
    );

    // Lọc ra các phiếu TBP đã duyệt (không thể xóa)
    const approvedRows = selectedRows.filter(
      (row) => row.StatusText === 'Đã duyệt'
    );

    // Nếu không có phiếu nào có thể xóa
    if (deletableRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `${selectedRows.length} phiếu đã được TBP duyệt. Vui lòng hủy duyệt trước khi xóa!`
      );
      return;
    }

    // Nếu có cả phiếu có thể xóa và không thể xóa
    let confirmMessage = '';
    if (deletableRows.length === 1) {
      confirmMessage = `Bạn có chắc chắn muốn xóa WFH của <strong>"${deletableRows[0].EmployeeName}"</strong> không?`;
    } else {
      confirmMessage = `Bạn có chắc chắn muốn xóa <strong>${deletableRows.length}</strong> bản ghi WFH đã chọn không?`;
    }

    if (approvedRows.length > 0) {
      confirmMessage += `<br><br><span style="color: orange;">Lưu ý: ${approvedRows.length} phiếu đã được TBP duyệt sẽ bị bỏ qua. Vui lòng hủy duyệt trước khi xóa.</span>`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteWFH(deletableRows, approvedRows.length),
    });
  }

  private confirmDeleteWFH(deletableRows: WFHDto[], skippedCount: number): void {
    if (deletableRows.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có bản ghi hợp lệ để xóa!');
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const totalCount = deletableRows.length;

    const deleteNext = (index: number) => {
      if (index >= deletableRows.length) {
        this.handleDeleteComplete(successCount, failedCount, totalCount, skippedCount);
        return;
      }

      const item = deletableRows[index];
      
      // Kiểm tra lại trạng thái TBP trước khi xóa
      if (item.StatusText === 'Đã duyệt') {
        // Bỏ qua nếu đã được TBP duyệt
        deleteNext(index + 1);
        return;
      }

      const deleteData = {
        ...item,
        IsDeleted: true,
        UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
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
    totalCount: number,
    skippedCount: number = 0
  ): void {
    if (successCount > 0) {
      this.notification.success(
        NOTIFICATION_TITLE.success,
        `Đã xóa ${successCount}/${totalCount} bản ghi WFH thành công!`
      );
      this.searchWFH();
      this.clearSelection();
    }

    if (failedCount > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `${failedCount} bản ghi xóa thất bại!`
      );
    }

    if (skippedCount > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Đã bỏ qua ${skippedCount} phiếu đã được TBP duyệt. Vui lòng hủy duyệt trước khi xóa!`
      );
    }
  }
  // #endregion

  // #region Approval Operations
  // Giả sử bạn có thông tin user hiện tại:

  approvedTBP(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;
    
    if (rowCount === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn nhân viên để duyệt!'
      );
      return;
    }
    
    // Lấy tên nhân viên đầu tiên (focused row)
    const focusedRow = this.tb_WFH?.getSelectedRows()[0];
    const employeeName = focusedRow ? focusedRow.getData()['EmployeeName'] : selectedRows[0]?.['EmployeeName'] || '';
    
    let confirmMessage = '';
    if (rowCount === 1) {
      confirmMessage = `Bạn có chắc muốn duyệt cho nhân viên [${employeeName}] hay không!`;
    } else {
      confirmMessage = `Bạn có chắc muốn duyệt cho những nhân viên này hay không!`;
    }
    
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(selectedRows),
    });
  }

  private confirmApproveTBP(selectedRows: WFHDto[]): void {
    let successCount = 0;
    let failedCount = 0;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Duyệt thành công!
          
            `
           // ${successCount}/${selectedRows.length} bản ghi thành công!
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchWFH();
        this.clearSelection();
        return;
      }
      
      const item = selectedRows[index];
      const departmentId = item.DepartmentID || 0;
      const employeeName = item.EmployeeName || '';
      const approvedTP = item.ApprovedID || 0;

      // Bỏ qua nếu departmentId = 0
      if (departmentId === 0) {
        approveNext(index + 1);
        return;
      }

      // Kiểm tra quyền nếu không phải admin
      if (!this.isAdmin) {
        // Kiểm tra phòng ban
        if (departmentId !== this.currentDepartmentId && this.currentDepartmentId !== 1) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Nhân viên [${employeeName}] không thuộc phòng [${this.currentDepartmentName.toUpperCase()}].\nVui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
        // Kiểm tra người duyệt
        if (approvedTP !== this.currentEmployeeId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể duyệt cho nhân viên thuộc nhóm khác.\nVui lòng kiểm tra lại!`
          );
          approveNext(index + 1);
          return;
        }
      }

      const id = item.ID || 0;
      // Bỏ qua nếu ID = 0
      if (id === 0) {
        approveNext(index + 1);
        return;
      }

      // Kiểm tra đã duyệt chưa
      if (item.StatusText === 'Đã duyệt' || item.IsApproved) {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt TBP
      const approveData = { ...item, Status: 1, IsApproved: true };
      this.wfhService.saveApproveTBP(approveData).subscribe({
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
    const rowCount = selectedRows.length;
    
    if (rowCount === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn nhân viên để duyệt!'
      );
      return;
    }
    
    // Lấy tên nhân viên đầu tiên (focused row)
    const focusedRow = this.tb_WFH?.getSelectedRows()[0];
    const employeeName = focusedRow ? focusedRow.getData()['EmployeeName'] : selectedRows[0]?.['EmployeeName'] || '';
    
    let confirmMessage = '';
    if (rowCount === 1) {
      confirmMessage = `Bạn có chắc muốn duyệt nhân viên [${employeeName}]?`;
    } else {
      confirmMessage = `Bạn có chắc muốn duyệt những nhân viên này không?`;
    }
    
    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt HR',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHR(selectedRows, true),
    });
  }

  private confirmApproveHR(selectedRows: WFHDto[], isApproved: boolean = true): void {
    let successCount = 0;
    let failedCount = 0;
    const approved = isApproved ? 'duyệt' : 'hủy duyệt';

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `HR đã ${approved} ${successCount}/${selectedRows.length} bản ghi thành công!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi ${approved} thất bại!`
          );
        }
        this.searchWFH();
        this.clearSelection();
        return;
      }
      
      const item = selectedRows[index];
      const departmentId = item.DepartmentID || 0;
      const approvedTP = item.ApprovedID || 0;
      const employeeName = item.EmployeeName || '';

      // Bỏ qua nếu departmentId = 0 và approvedTP = 0
      if (departmentId === 0 && approvedTP === 0) {
        approveNext(index + 1);
        return;
      }

      // HR duyệt không cần check phòng ban, chỉ cần check TBP đã duyệt

      // Nếu hủy duyệt và HR đã duyệt thì bỏ qua
      if (!isApproved && item.StatusHRText === 'Đã duyệt') {
        approveNext(index + 1);
        return;
      }

      const id = item.ID || 0;
      if (id === 0) {
        approveNext(index + 1);
        return;
      }

      // HR chỉ duyệt nếu TBP đã duyệt
      if (isApproved && item.StatusText !== 'Đã duyệt') {
        approveNext(index + 1);
        return;
      }

      // Gọi API duyệt/hủy duyệt HR
      const approveData = { 
        ...item, 
        StatusHR: isApproved ? 1 : 0, 
        IsApprovedHR: isApproved 
      };
      this.wfhService.saveApproveHR(approveData).subscribe({
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
        NOTIFICATION_TITLE.error,
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
          NOTIFICATION_TITLE.success,
          `HR đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchWFH();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];
      // Hủy duyệt HR - set StatusHR = 2
      const cancelData = { ...item, IsApprovedHR: false, StatusHR: 2 };
      this.wfhService.saveApproveHR(cancelData).subscribe({
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
        NOTIFICATION_TITLE.error,
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
    const totalCount = selectedRows.length;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `TBP đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
        );
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchWFH();
        this.clearSelection();
        return;
      }
      const item = selectedRows[index];

      // Nếu không phải admin, kiểm tra phòng ban và người duyệt
      if (!this.isAdmin) {
        if (item.DepartmentID !== this.currentDepartmentId && this.currentDepartmentId !== 1) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Nhân viên [${item.EmployeeName}] không thuộc phòng [${this.currentDepartmentName.toUpperCase()}]. Vui lòng kiểm tra lại!`
          );
          cancelNext(index + 1);
          return;
        }
        if (item.ApprovedID !== this.currentEmployeeId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
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
          NOTIFICATION_TITLE.warning,
          `Nhân viên [${item.EmployeeName}] đã được HR duyệt. Vui lòng hủy duyệt HR trước!`
        );
        cancelNext(index + 1);
        return;
      }

      // Hủy duyệt TBP - set Status = 2
      const cancelData = { ...item, IsApproved: false, Status: 2 };
      this.wfhService.saveApproveTBP(cancelData).subscribe({
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
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng dữ liệu chưa sẵn sàng!');
      return;
    }

    try {
      this.message.loading('Đang tải dữ liệu để xuất Excel...', { nzDuration: 0 });

      // Lấy full data từ API với size lớn
      const exportParams = {
        Page: 1,
        Size: 10000, // Lấy tối đa 10000 bản ghi
        Year: this.year ? this.year.getFullYear() : new Date().getFullYear(),
        Month: this.month || 0,
        Keyword: this.searchValue?.trim() || '',
        DepartmentId: this.selectedDepartmentFilter || 0,
        IdApprovedTP: 0,
        Status:
          this.selectedTBPStatusFilter === null ||
          this.selectedTBPStatusFilter === undefined
            ? -1
            : this.selectedTBPStatusFilter,
      };

      this.wfhService.getWFHListPost(exportParams)
        .then((res: any) => {
          this.message.remove();
          if (res && res.status === 1 && res.data) {
            const allData = res.data.data || [];
            
            if (allData.length === 0) {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
              return;
            }

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
                NOTIFICATION_TITLE.success,
                `Đã xuất ${allData.length} bản ghi WFH ra file Excel thành công!`,
                { nzStyle: { fontSize: '0.75rem' } }
              );
            }, 2000);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu để xuất Excel!');
          }
        })
        .catch((error: any) => {
          this.message.remove();
          console.error('Export Excel error:', error);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu để xuất Excel: ' +
              (error instanceof Error ? error.message : 'Lỗi không xác định')
          );
        });
    } catch (error) {
      this.message.remove();
      console.error('Export Excel error:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
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

  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus = status === null || status === undefined ? 0 : Number(status);
    
    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
    }
  }
}
