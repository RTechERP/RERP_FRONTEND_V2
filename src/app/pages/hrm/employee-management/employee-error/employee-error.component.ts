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

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

import {
  EmployeeErrorService,
  EmployeeErrorDto,
} from './employee-error-service/employee-error.service';
import { EmployeeErrorDetailComponent } from './employee-error-detail/employee-error-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-employee-error',
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
    // EmployeeErrorDetailComponent,
    HasPermissionDirective,
    NzDropDownModule,
  ],
  templateUrl: './employee-error.component.html',
  styleUrls: ['./employee-error.component.css'],
})
export class EmployeeErrorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('tb_Error', { static: false }) tb_ErrorRef!: ElementRef;

  tb_Error!: Tabulator;

  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  sizeSearch: string = '0';

  dateStart: Date = DateTime.local().startOf('month').toJSDate();
  dateEnd: Date = DateTime.local().endOf('month').toJSDate();
  searchValue: string = '';

  selectedError: any | null = null;
  selectedRows: any[] = [];
  lastSelectedError: any | null = null;

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private errorService: EmployeeErrorService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_Error) {
      this.tb_Error.destroy();
    }
  }

  private toISODate(d: Date | null | undefined): string {
    if (!d) return '';
    return DateTime.fromJSDate(d).toISODate()!;
  }

  private initializeTable(): void {
    if (!this.tb_ErrorRef) {
      return;
    }
    this.drawTbError(this.tb_ErrorRef.nativeElement);
  }

  private drawTbError(container: HTMLElement): void {
    this.tb_Error = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      ajaxURL: this.errorService.getEmployeeErrorListURL(),
      ajaxConfig: 'POST',
      ajaxRequestFunc: (url: any, config: any, params: any) => {
        const dateStart =
          this.dateStart || DateTime.local().startOf('month').toJSDate();
        const dateEnd =
          this.dateEnd || DateTime.local().endOf('month').toJSDate();
        const requestParams: any = {
          Page: params.page || 1,
          Size: params.size || 50,
          DateStart: dateStart,
          DateEnd: dateEnd,
          KeyWord: this.searchValue?.trim() || '',
        };
        return this.errorService.getEmployeeErrorListPost(requestParams);
      },
      ajaxResponse: (url: any, params: any, res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = res.data.data || [];
          let totalPage = 1;
          if (Array.isArray(res.data.totalPage)) {
            totalPage =
              res.data.totalPage[0]?.TotalPage || res.data.totalPage[0] || 1;
          } else if (typeof res.data.totalPage === 'number') {
            totalPage = res.data.totalPage;
          }
          return {
            data: data,
            last_page: totalPage,
          };
        }
        return {
          data: [],
          last_page: 1,
        };
      },
      ajaxError: (error: any) => {
        this.message.error('Lỗi khi tải dữ liệu: ' + (error.message || error));
        return [];
      },
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
      selectableRowsRangeMode: false,
      columns: this.getTableColumns(),
    } as any);

    this.setupTableEvents();
  }

  private getTableColumns(): any[] {
    return [
      {
        title: 'Duyệt',
        field: 'IsApprovedText',
        width: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => {
          const value = cell.getValue();
          const isApproved =
            cell.getRow().getData().IsApproved === true || value === 'Đã duyệt';
          if (isApproved) {
            return '<span class="badge bg-success">Đã duyệt</span>';
          }
          return '<span class="badge bg-warning text-dark">Chưa duyệt</span>';
        },
      },

      {
        title: 'Mã nhân viên',
        field: 'Code',
        width: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Tên nhân viên',
        field: 'FullName',
        width: 180,
        headerHozAlign: 'center',
        hozAlign: 'left',
      },

      {
        title: 'Số tiền',
        field: 'Money',
        width: 150,
        headerHozAlign: 'center',
        hozAlign: 'right',
        formatter: (cell: any) => {
          const value = cell.getValue();
          if (value === null || value === undefined) return '';
          return Number(value).toLocaleString('vi-VN') + 'đ';
        },
      },
      {
        title: 'Ngày',
        field: 'DateError',
        width: 120,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatDateOnly(cell.getValue()),
      },
      {
        title: 'Ghi chú',
        field: 'Note',
        width: 300,
        headerHozAlign: 'center',
        hozAlign: 'left',
        formatter: 'textarea',
      },
    ];
  }

  private setupTableEvents(): void {
    this.tb_Error.on('dataLoading', () => {
      this.isLoadTable = true;
      this.tb_Error.deselectRow();
    });

    this.tb_Error.on('dataLoaded', () => {
      this.isLoadTable = false;
    });

    this.tb_Error.on('dataLoadError', (error: any) => {
      this.isLoadTable = false;
      this.message.error(
        'Lỗi khi tải dữ liệu: ' + (error.message || 'Unknown error')
      );
    });

    this.tb_Error.on('rowClick', (e: any, row: any) => {
      this.selectedError = row.getData();
      this.lastSelectedError = row.getData();
    });

    this.tb_Error.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedRows = rows.map((row: any) => row.getData());
      if (rows.length > 0) {
        this.selectedError = rows[rows.length - 1].getData();
        this.lastSelectedError = this.selectedError;
      } else {
        this.selectedError = null;
        this.lastSelectedError = null;
      }
    });

    this.tb_Error.on('tableBuilt', () => {
      this.isTableReady = true;
    });

    this.tb_Error.on('rowDblClick', (e: any, row: any) => {
      this.selectedError = row.getData();
      this.lastSelectedError = row.getData();
      this.editError();
    });
  }

  searchError(): void {
    if (!this.isTableReady) {
      return;
    }
    this.tb_Error.replaceData();
  }

  onSearch(): void {
    this.searchError();
  }

  resetSearch(): void {
    this.searchValue = '';
    this.dateStart = DateTime.local().startOf('month').toJSDate();
    this.dateEnd = DateTime.local().endOf('month').toJSDate();

    if (this.tb_Error) {
      this.tb_Error.clearData();
      this.tb_Error.setPage(1);
    }
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  onDateStartChange(value: Date | null): void {
    if (!value) {
      this.dateStart = DateTime.local().startOf('month').toJSDate();
    } else {
      this.dateStart = value;
    }
    this.searchError();
  }

  onDateEndChange(value: Date | null): void {
    if (!value) {
      this.dateEnd = DateTime.local().endOf('month').toJSDate();
    } else {
      this.dateEnd = value;
    }
    this.searchError();
  }

  getSelectedRows(): any[] {
    if (!this.tb_Error) return [];
    const selectedRows = this.tb_Error.getSelectedRows();
    return selectedRows.map((row: any) => row.getData());
  }

  private getCurrentSelectedError(): any | null {
    if (this.lastSelectedError) return this.lastSelectedError;
    if (this.selectedError) return this.selectedError;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }

  private clearSelection(): void {
    this.selectedError = null;
    this.lastSelectedError = null;
    this.selectedRows = [];
    if (this.tb_Error) {
      this.tb_Error.deselectRow();
    }
  }

  addError(): void {
    const modalRef = this.ngbModal.open(EmployeeErrorDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.errorData = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchError();
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Thêm lỗi thành công!'
        );
      }
    });
  }

  editError(): void {
    const errorToEdit = this.getCurrentSelectedError();

    if (!errorToEdit) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần sửa!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(EmployeeErrorDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.errorData = errorToEdit;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchError();
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Sửa lỗi thành công!'
        );
      }
    });
  }

  deleteError(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xóa!'
      );
      return;
    }

    const approvedRows = selectedRows.filter(
      (row) => row.IsApproved === true || row.IsApprovedText === 'Đã duyệt'
    );
    if (approvedRows.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Có bản ghi đã được duyệt. Không thể xóa bản ghi đã duyệt!'
      );
      return;
    }

    const deletableRows = selectedRows.filter(
      (row) => row.IsApproved !== true && row.IsApprovedText !== 'Đã duyệt'
    );

    if (deletableRows.length === 0) {
      return;
    }

    const count = deletableRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa bản ghi của <strong>"${deletableRows[0].FullName}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteError(deletableRows),
    });
  }

  private confirmDeleteError(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const deleteNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.handleDeleteComplete(successCount, failedCount, totalCount);
        return;
      }

      const item = selectedRows[index];
      const deleteData: any = {
        ID: item.ID,
        IsDeleted: true,
      };

      this.errorService.saveData(deleteData).subscribe({
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
        NOTIFICATION_TITLE.success,
        `Đã xóa ${successCount}/${totalCount} bản ghi thành công!`
      );
      this.searchError();
      this.clearSelection();
    }

    if (failedCount > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `${failedCount} bản ghi xóa thất bại!`
      );
    }
  }

  approveError(): void {
    const selectedRows = this.getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi để duyệt!'
      );
      return;
    }

    const alreadyApproved = selectedRows.filter(
      (row) => row.IsApproved === true || row.IsApprovedText === 'Đã duyệt'
    );
    if (alreadyApproved.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Có bản ghi đã được duyệt!'
      );
      return;
    }

    let confirmMessage = '';
    if (rowCount === 1) {
      confirmMessage = `Bạn có chắc muốn duyệt bản ghi của <strong>"${selectedRows[0].FullName}"</strong>?`;
    } else {
      confirmMessage = `Bạn có chắc muốn duyệt <strong>${rowCount}</strong> bản ghi đã chọn?`;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt',
      nzContent: confirmMessage,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveError(selectedRows),
    });
  }

  private confirmApproveError(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;

    const approveNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Duyệt thành công ${successCount} bản ghi!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi duyệt thất bại!`
          );
        }
        this.searchError();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];
      const approveData: any = {
        ID: item.ID,
        IsApproved: true,
      };

      this.errorService.saveData(approveData).subscribe({
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

  cancelApproveError(): void {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất 1 bản ghi cần hủy duyệt!'
      );
      return;
    }

    const notApproved = selectedRows.filter(
      (row) => row.IsApproved !== true && row.IsApprovedText !== 'Đã duyệt'
    );
    if (notApproved.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Có bản ghi chưa được duyệt!'
      );
      return;
    }

    const confirmMsg =
      selectedRows.length === 1
        ? `Bạn có chắc muốn hủy duyệt bản ghi của <strong>"${selectedRows[0].FullName}"</strong>?`
        : `Bạn có chắc muốn hủy duyệt <strong>${selectedRows.length}</strong> bản ghi đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt',
      nzContent: confirmMsg,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: () => this.confirmCancelApproveError(selectedRows),
    });
  }

  private confirmCancelApproveError(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const cancelNext = (index: number) => {
      if (index >= selectedRows.length) {
        if (successCount > 0) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Đã hủy duyệt ${successCount}/${totalCount} bản ghi thành công!`
          );
        }
        if (failedCount > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `${failedCount} bản ghi hủy duyệt thất bại!`
          );
        }
        this.searchError();
        this.clearSelection();
        return;
      }

      const item = selectedRows[index];
      const cancelData: any = {
        ID: item.ID,
        IsApproved: false,
      };

      this.errorService.saveData(cancelData).subscribe({
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

  exportExcel(): void {
    if (!this.tb_Error) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Bảng dữ liệu chưa sẵn sàng!'
      );
      return;
    }

    const allData = this.tb_Error.getData();

    if (allData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!'
      );
      return;
    }

    try {
      this.message.loading('Đang xuất file Excel...', { nzDuration: 2000 });

      const exportData = this.prepareExportData(allData);
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = this.getExcelColumnWidths();

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách lỗi');

      const filename = this.generateExcelFilename();
      XLSX.writeFile(workbook, filename);

      setTimeout(() => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Đã xuất ${allData.length} bản ghi ra file Excel thành công!`
        );
      }, 2000);
    } catch (error) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất file Excel: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định')
      );
    }
  }

  private prepareExportData(allData: any[]): any[] {
    return allData.map((item: any, index: number) => ({
      STT: index + 1,
      'Mã nhân viên': item.EmployeeCode || '',
      'Tên nhân viên': item.EmployeeName || '',
      'Phòng ban': item.DepartmentName || '',
      'Số tiền': item.Money
        ? Number(item.Money).toLocaleString('vi-VN') + 'đ'
        : '',
      Ngày: this.formatDateOnlyForExcel(item.DateError),
      'Ghi chú': item.Note || '',
      'Trạng thái duyệt':
        item.IsApprovedText || (item.IsApproved ? 'Đã duyệt' : 'Chưa duyệt'),
      'Người duyệt': item.ApprovedByName || '',
      'Ngày duyệt': this.formatDateOnlyForExcel(item.ApprovedDate),
      'Ngày tạo': this.formatDateTimeForExcel(item.CreatedDate),
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
      { wch: 40 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
    ];
  }

  private generateExcelFilename(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `DanhSachLoi_T${currentMonth}_${currentYear}.xlsx`;
  }

  private formatDateOnly(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  private formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }

  private formatDateTimeForExcel(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  }
}
