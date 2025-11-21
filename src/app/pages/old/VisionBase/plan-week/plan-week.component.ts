import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { PlanWeekService } from './plan-week-services/plan-week.service';
import { Title } from '@angular/platform-browser';
import { PlanWeekDetailComponent } from '../plan-week-detail/plan-week-detail/plan-week-detail.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-plan-week',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
    NzTreeSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './plan-week.component.html',
  styleUrl: './plan-week.component.css',
})
export class PlanWeekComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;

  private tb_MainTable!: Tabulator;

  sizeSearch: string = '0';
  isMobile: boolean = false;
  toggleSearchPanel() {
    if (this.isMobile) {
      this.sizeSearch = this.sizeSearch === '0' ? '100%' : '0';
    } else {
      this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
    }
  }

  filters: any = {
    departmentId: 0,
    teamId: 0,
    userId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  selectedRow: any = null;
  selectedId: number = 0;
  selectedField: string | null = null;
  isEditMode: boolean = false;
  private selectedCellElement: HTMLElement | null = null;
  isCurrentUserAdmin: boolean = false; //flag kiểm tra quyền admin
  isUserFilterDisabled: boolean = false; //flag disable filter user
  filterDepartmentData: any[] = [];
  filterTeamData: any[] = [];
  filterUserData: any[] = [];
  mainData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private planWeekService: PlanWeekService,
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 576;
    const today = new Date();

    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    monday.setHours(0, 0, 0);
    sunday.setHours(23, 59, 59);

    this.filters.startDate = monday;
    this.filters.endDate = sunday;

    this.configureUserFilterByRole(); //config kiểm tra quyền admin và disable filter user

    this.loadDepartment();
    this.loadTeam();
    this.loadUser();
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  ngAfterViewInit(): void {
    this.initMainTable();
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 576;
    if (this.isMobile && !wasMobile && this.sizeSearch !== '0') {
      this.sizeSearch = '100%';
    }
    if (!this.isMobile && wasMobile && this.sizeSearch === '100%') {
      this.sizeSearch = '22%';
    }
  };

  searchData(): void {
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  increaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  decreaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  openPlanWeekDetailModal() {
    let userid = 0;
    if (this.isEditMode === true) {
      userid = this.selectedId;
    } else {
      userid = this.appUserService.id || 0;
    }
    const modalRef = this.modalService.open(PlanWeekDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.isEditMode = this.isEditMode;
    modalRef.componentInstance.UserID = userid;
    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.selectedRow = [];
          this.selectedId = 0;
          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.departmentId,
            this.filters.userId,
            this.filters.teamId
          );
        } else {
          this.isEditMode = false;
        }
      },
      (reason) => {
        this.isEditMode = false;
        console.log('Modal closed');
      }
    );
  }

  onEdit(): void {
    if (this.selectedId > 0) {
      this.isEditMode = true;
      this.openPlanWeekDetailModal();
    } else {
      this.notification.info('Thông báo', 'Không có dữ liệu bản ghi cần sửa!');
    }
  }

  onDepartmentChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.departmentId = 0;
    }
  }

  onTeamChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.teamId = 0;
    }
  }

  onUserChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.userId = 0;
    }
  }

  loadDepartment() {
    this.planWeekService.getDepartment().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterDepartmentData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể tải dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  loadTeam() {
    this.planWeekService.getTeam().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterTeamData = this.transformFlatDataToTreeData(response.data);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể tải dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  loadUser() {
    this.planWeekService.getEmployees(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể tải dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  loadMainData(
    startDate: Date,
    endDate: Date,
    departmentId: number,
    userId: number,
    groupSaleId: number
  ) {
    this.planWeekService
      .getData(startDate, endDate, departmentId, userId, groupSaleId)
      .subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.mainData = response.data.data;
            if (this.tb_MainTable) {
              this.tb_MainTable.setColumns([]);
              this.tb_MainTable.setData(this.mainData);
            }
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message);
          }
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message || error?.message || 'Không thể tải dữ liệu';
          this.notification.error('Lỗi', errorMessage);
        },
      });
  }

  private transformFlatDataToTreeData(flatData: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    flatData.forEach((item) => {
      map.set(item.ID, {
        title: `${item.FullName} - ${item.GroupSalesName}`,
        key: item.ID.toString(),
        children: [],
        isLeaf: true,
      });
    });

    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID && map.has(item.ParentID)) {
        const parentNode = map.get(item.ParentID);
        parentNode.children.push(node);
        parentNode.isLeaf = false;
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  onDelete() {
    if (!this.selectedId || this.selectedId <= 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn bản ghi cần xóa');
      return;
    }
    if (
      !this.selectedField ||
      ['FullName', 'Code', 'UserID', 'ParentID'].includes(this.selectedField)
    ) {
      this.notification.info('Thông báo', 'Vui lòng chọn đúng ô ngày cần xóa');
      return;
    }
    const dateFromField = new Date(this.selectedField as string);

    const UserID = this.selectedId;
    const DatePlan = dateFromField;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa kế hoạch ngày ${dateFromField.toLocaleDateString()} của ${
        this.selectedRow?.FullName
      }?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (isNaN(dateFromField.getTime())) {
          this.notification.error(
            'Lỗi',
            'Không xác định được ngày từ cột đã chọn'
          );
          return;
        }

        this.planWeekService.delete(UserID, DatePlan).subscribe({
          next: (sv) => {
            if (sv.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công');
              this.loadMainData(
                this.filters.startDate,
                this.filters.endDate,
                this.filters.departmentId,
                this.filters.userId,
                this.filters.teamId
              );
            } else {
              this.notification.error('Lỗi', sv.message || 'Không thể lưu');
            }
          },
          error: (err) => {
            const errorMessage =
              err?.error?.message || err?.message || 'Không thể xóa dữ liệu';
            this.notification.error('Lỗi', errorMessage);
          },
        });
      },
    });
  }

  async exportMainTableToExcel() {
    if (!this.tb_MainTable) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất Excel'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KeHoachTuan');

    const columns = this.tb_MainTable
      .getColumns()
      .filter((column) => column.isVisible?.() ?? true);

    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const allData = this.tb_MainTable.getData();

    allData.forEach((rowData) => {
      const row = columns.map((col) => {
        const field = col.getField();
        const value = rowData[field];

        return value;
      });

      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 30;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const formatDate = (date: Date): string => {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const start = formatDate(this.filters.startDate);
    const end = formatDate(this.filters.endDate);

    link.download = `KeHoachTuan_${start} - ${end}.xlsx`;

    link.click();
    window.URL.revokeObjectURL(url);
  }

  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      layout: 'fitColumns',
      height: '89vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 100,
      movableColumns: true,
      resizableRows: true,
      
      reactiveData: true,
      autoColumns: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
        cssClass: 'tabulator-cell-wrap',
      },
      rowHeader: false,
      autoColumnsDefinitions: (definitions: any[] = []) =>
        definitions.map((def: any) => {
          if (def.field === 'ParentID') {
            return { ...def, visible: false };
          }
          if (def.field === 'UserID') {
            return { ...def, visible: false };
          }
          if (def.field === 'FullName') {
            return { ...def, title: 'Họ tên' };
          }
          if (def.field === 'Code') {
            return { ...def, title: 'Mã nhân viên', width: 100 };
          }
          return def;
        }),
    });
    // this.tb_MainTable.on('rowClick', (e: any, row: RowComponent) => {
    //   const rowData = row.getData();
    //   this.selectedRow = rowData;
    //   this.selectedId = rowData['UserID'];
    // });
    this.tb_MainTable.on('cellClick', (e: any, cell: CellComponent) => {
      this.highlightSelectedCell(cell);
      const field = cell.getField();
      this.selectedField = field;
      const rowData = cell.getRow().getData();
      this.selectedRow = rowData;
      if (rowData && rowData['UserID']) {
        this.selectedId = rowData['UserID'];
        console.log(this.selectedId);
      }
    });
  }

  private highlightSelectedCell(cell: CellComponent): void {
    if (this.selectedCellElement) {
      this.selectedCellElement.style.backgroundColor = '';
    }
    const cellElement = cell.getElement() as HTMLElement;
    cellElement.style.backgroundColor = '#e6f4ff';
    this.selectedCellElement = cellElement;
  }

  private configureUserFilterByRole(): void {
    this.isCurrentUserAdmin = this.appUserService.isAdmin;
    if (this.isCurrentUserAdmin) {
      this.isUserFilterDisabled = false;
      return;
    }

    this.isUserFilterDisabled = true;
    const currentUserId = this.appUserService.id;
    if (currentUserId) {
      this.filters.userId = currentUserId;
      this.selectedId = currentUserId;
    } else {
      this.filters.userId = 0;
    }
  }
}
