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

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

import { EmployeeCurricularService, EmployeeCurricularRequestParam, EmployeeCurricularDto } from '../employee-curricular-service/employee-curricular.service';
import { EmployeeCurricularDetailComponent } from '../employee-curricular-detail/employee-curricular-detail.component';
import { EmployeeCurricularExcelComponent } from '../excel-employee-curricular/excel-employee-curricular.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { ProjectService } from '../../../../project/project-service/project.service';

@Component({
  selector: 'app-employee-curricular',
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
    HasPermissionDirective,
  ],
  templateUrl: './employee-curricular.component.html',
  styleUrls: ['./employee-curricular.component.css'],
})
export class EmployeeCurricularComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tb_employeeCurricular', { static: false }) tb_employeeCurricularRef!: ElementRef;

  tb_employeeCurricular!: Tabulator;

  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  sizeSearch: string = '0';

  selectedMonthYear: Date = new Date();
  selectedEmployee: number | null = null;
  selectedDepartment: number | null = null;
  searchValue: string = '';

  selectedCurricular: any | null = null;
  selectedRows: any[] = [];
  lastSelectedCurricular: any | null = null;

  ListEmployee: any[] = [];
  ListDepartment: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private curricularService: EmployeeCurricularService,
    private projectService: ProjectService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService
  ) {}

  ngOnInit(): void {
    this.getEmployee();
    this.getDepartment();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_employeeCurricular) {
      this.tb_employeeCurricular.destroy();
    }
  }

  private initializeTable(): void {
    if (!this.tb_employeeCurricularRef) {
      return;
    }
    this.drawTbEmployeeCurricular(this.tb_employeeCurricularRef.nativeElement);
  }

  private drawTbEmployeeCurricular(container: HTMLElement): void {
    this.tb_employeeCurricular = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      paginationMode: 'local',
      data: [],
      selectableRows: true,
      selectableRowsRangeMode: false,
      columns: this.getTableColumns(),
    } as any);

    this.setupTableEvents();
    this.loadTableData();
  }

  private loadTableData(): void {
    if (!this.tb_employeeCurricular) return;

    this.isLoadTable = true;
    
    const currentDate = this.selectedMonthYear || new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const requestParams: EmployeeCurricularRequestParam = {
      Month: month,
      Year: year,
      DepartmentID: this.selectedDepartment || 0,
      EmployeeID: this.selectedEmployee || 0,
    };
    
    this.curricularService.getEmployeeCurricularList(requestParams).subscribe({
      next: (res: any) => {
        this.isLoadTable = false;
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data : [];
          this.tb_employeeCurricular.replaceData(data);
        } else {
          this.tb_employeeCurricular.replaceData([]);
        }
      },
      error: (error: any) => {
        this.isLoadTable = false;
        this.message.error('Lỗi khi tải dữ liệu: ' + (error.message || error));
        this.tb_employeeCurricular.replaceData([]);
      },
    });
  }

  private getTableColumns(): any[] {
    return [
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
        {
          title: 'EmployeeID',
          field: 'EmployeeID',
          visible: false,
        },
        {
          title: 'Nhân viên',
          field: 'FullName',
          width: 200,
          minWidth: 150,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Mã ngoại khóa',
          field: 'CurricularCode',
          width: 200,
          minWidth: 100,
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Tên ngoại khóa',
          field: 'CurricularName',
          widthGrow: 3,
          minWidth: 250,
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Ngày',
          field: 'CurricularDay',
          width: 70,
          minWidth: 60,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Tháng',
          field: 'CurricularMonth',
          width: 70,
          minWidth: 60,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Năm',
          field: 'CurricularYear',
          width: 80,
          minWidth: 70,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          widthGrow: 2,
          minWidth: 150,
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'DepartmentName',
          field: 'DepartmentName',
          visible: false,
        },
    ];
  }

  private setupTableEvents(): void {
    this.tb_employeeCurricular.on('rowClick', (e: any, row: any) => {
      this.selectedCurricular = row.getData();
      this.lastSelectedCurricular = row.getData();
    });

    this.tb_employeeCurricular.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedRows = rows.map((row: any) => row.getData());
      if (rows.length > 0) {
        this.selectedCurricular = rows[rows.length - 1].getData();
        this.lastSelectedCurricular = this.selectedCurricular;
      } else {
        this.selectedCurricular = null;
        this.lastSelectedCurricular = null;
      }
    });

    this.tb_employeeCurricular.on('tableBuilt', () => {
      this.isTableReady = true;
    });

    this.tb_employeeCurricular.on('rowDblClick', (e: any, row: any) => {
      this.selectedCurricular = row.getData();
      this.lastSelectedCurricular = row.getData();
      this.editCurricular();
    });
  }

  searchCurricular(): void {
    if (!this.isTableReady) {
      return;
    }
    this.loadTableData();
  }

  onSearch(): void {
    this.searchCurricular();
  }

  resetSearch(): void {
    this.searchValue = '';
    this.selectedEmployee = null;
    this.selectedDepartment = null;
    this.selectedMonthYear = new Date();

    if (this.tb_employeeCurricular) {
      this.tb_employeeCurricular.clearData();
      this.tb_employeeCurricular.setPage(1);
    }
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  onMonthYearChange(value: Date | null): void {
    if (!value) {
      this.selectedMonthYear = new Date();
    } else {
      this.selectedMonthYear = value;
    }
    this.searchCurricular();
  }

  getSelectedRows(): any[] {
    if (!this.tb_employeeCurricular) return [];
    const selectedRows = this.tb_employeeCurricular.getSelectedRows();
    return selectedRows.map((row: any) => row.getData());
  }

  private getCurrentSelectedCurricular(): any | null {
    if (this.lastSelectedCurricular) return this.lastSelectedCurricular;
    if (this.selectedCurricular) return this.selectedCurricular;

    const selectedRows = this.getSelectedRows();
    return selectedRows.length > 0 ? selectedRows[0] : null;
  }

  private clearSelection(): void {
    this.selectedCurricular = null;
    this.lastSelectedCurricular = null;
    this.selectedRows = [];
    if (this.tb_employeeCurricular) {
      this.tb_employeeCurricular.deselectRow();
    }
  }

  addCurricular(): void {
    const modalRef = this.ngbModal.open(EmployeeCurricularDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.curricularData = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.month = this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    modalRef.componentInstance.year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchCurricular();
      }
    });
  }

  editCurricular(): void {
    const curricularToEdit = this.getCurrentSelectedCurricular();

    if (!curricularToEdit) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(EmployeeCurricularDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.curricularData = curricularToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.month = curricularToEdit.CurricularMonth || DateTime.now().month;
    modalRef.componentInstance.year = curricularToEdit.CurricularYear || DateTime.now().year;

    modalRef.result.then((result) => {
      if (result?.action === 'save') {
        this.searchCurricular();
        this.notification.success(NOTIFICATION_TITLE.success, 'Sửa ngoại khóa thành công!');
      }
    });
  }

  deleteCurricular(): void {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần xóa!');
      return;
    }

    const count = selectedRows.length;
    const confirmMessage =
      count === 1
        ? `Bạn có chắc chắn muốn xóa ngoại khóa của <strong>"${selectedRows[0].FullName}"</strong> không?`
        : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> bản ghi đã chọn không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeleteCurricular(selectedRows),
    });
  }

  private confirmDeleteCurricular(selectedRows: any[]): void {
    let successCount = 0;
    let failedCount = 0;
    const totalCount = selectedRows.length;

    const deleteNext = (index: number) => {
      if (index >= selectedRows.length) {
        this.handleDeleteComplete(successCount, failedCount, totalCount);
        return;
      }

      const item = selectedRows[index];

      if (!item.ID || item.ID === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, `Bản ghi "${item.FullName || 'N/A'}" không có ID hợp lệ!`);
        failedCount++;
        deleteNext(index + 1);
        return;
      }

      const deleteData: EmployeeCurricularDto = {
        ID: item.ID,
        EmployeeID: item.EmployeeID,
        CurricularCode: item.CurricularCode,
        CurricularName: item.CurricularName,
        CurricularDay: item.CurricularDay,
        CurricularMonth: item.CurricularMonth,
        CurricularYear: item.CurricularYear,
        Note: item.Note,
        IsDeleted: true,
      };

      this.curricularService.saveData(deleteData).subscribe({
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
      this.searchCurricular();
      this.clearSelection();
    }

    if (failedCount > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `${failedCount} bản ghi xóa thất bại!`
      );
    }
  }

  excel(): void {
    const modalRef = this.ngbModal.open(EmployeeCurricularExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.result.then((reason: any) => {
      if (reason == true) {
        this.notification.success(NOTIFICATION_TITLE.success, 'Đã nhập Excel thành công!');
        this.searchCurricular();
      }
    });
  }

  exportExcel(): void {
    if (!this.tb_employeeCurricular) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng dữ liệu chưa sẵn sàng!');
      return;
    }

    const allData = this.tb_employeeCurricular.getData();

    if (allData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    try {
      this.message.loading('Đang xuất file Excel...', { nzDuration: 2000 });

      const exportData = this.prepareExportData(allData);
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = this.getExcelColumnWidths();

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách ngoại khóa');

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
        'Lỗi khi xuất file Excel: ' + (error instanceof Error ? error.message : 'Lỗi không xác định')
      );
    }
  }

  private prepareExportData(allData: any[]): any[] {
    return allData.map((item: any, index: number) => ({
      STT: index + 1,
      'Mã nhân viên': item.EmployeeCode || '',
      'Tên nhân viên': item.FullName || '',
      'Phòng ban': item.DepartmentName || '',
      'Mã ngoại khóa': item.CurricularCode || '',
      'Tên ngoại khóa': item.CurricularName || '',
      'Ngày': item.CurricularDay || '',
      'Tháng': item.CurricularMonth || '',
      'Năm': item.CurricularYear || '',
      'Ghi chú': item.Note || '',
    }));
  }

  private getExcelColumnWidths(): any[] {
    return [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 40 },
    ];
  }

  private generateExcelFilename(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    return `DanhSachNgoaiKhoa_T${currentMonth}_${currentYear}.xlsx`;
  }

  getEmployee(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.ListEmployee = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
      },
    });
  }

  getDepartment(): void {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.ListDepartment = response.data || [];
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
      },
    });
  }
}
