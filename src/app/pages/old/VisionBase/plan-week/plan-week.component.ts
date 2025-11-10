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

import { PlanWeekService } from './plan-week-services/plan-week.service';
import { Title } from '@angular/platform-browser';
import { PlanWeekDetailComponent } from '../plan-week-detail/plan-week-detail/plan-week-detail.component';
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
  ],
  templateUrl: './plan-week.component.html',
  styleUrl: './plan-week.component.css',
})
export class PlanWeekComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;

  private tb_MainTable!: Tabulator;

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
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
  isEditMode: boolean = false;
  filterDepartmentData: any[] = [];
  filterTeamData: any[] = [];
  filterUserData: any[] = [];
  mainData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private planWeekService: PlanWeekService
  ) {}

  ngOnInit(): void {
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
  }
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
    const modalRef = this.modalService.open(PlanWeekDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.isEditMode = this.isEditMode;
    modalRef.componentInstance.UserID = this.selectedId;
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
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  onEdit(): void {
    if (this.selectedId > 0) {
      this.isEditMode = true;
      this.openPlanWeekDetailModal();
    } else {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 bản ghi cần sửa!');
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
        this.notification.error(NOTIFICATION_TITLE.error, error);
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
        this.notification.error(NOTIFICATION_TITLE.error, error);
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
        this.notification.error(NOTIFICATION_TITLE.error, error);
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
          this.notification.error(NOTIFICATION_TITLE.error, error);
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
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần xóa');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa kế hoạch tuần của người này?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.planWeekService
          .getData(
            this.filters.startDate,
            this.filters.endDate,
            0,
            this.selectedId,
            0
          )
          .subscribe({
            next: (res) => {
              if (res.status !== 1) {
                this.notification.error(
                  'Lỗi',
                  res.message || 'Không lấy được dữ liệu'
                );
                return;
              }
              const rows = (res.data?.data1 || []).map((r: any) => ({
                ...r,
                UserID: r?.UserID || this.selectedId,
                ContentPlan: '',
                Result: '',
              }));
              this.planWeekService.save(rows).subscribe({
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
                    this.notification.error(
                      'Lỗi',
                      sv.message || 'Không thể lưu'
                    );
                  }
                },
                error: (err) =>
                  this.notification.error(
                    'Lỗi',
                    'Không thể lưu: ' + err.message
                  ),
              });
            },
            error: (err) =>
              this.notification.error(
                'Lỗi',
                'Không lấy được dữ liệu: ' + err.message
              ),
          });
      },
    });
  }

  async exportMainTableToExcel() {
    if (!this.tb_MainTable) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KeHoachTuan');

    const columns = this.tb_MainTable.getColumns();

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
    link.download = `KeHoachTuan${this.filters.startDate} - ${this.filters.endDate}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      layout: 'fitColumns',
      height: '100%',
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
      },
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
    this.tb_MainTable.on('rowClick', (e: any, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedRow = rowData;
      this.selectedId = rowData['UserID'];
    });
  }
}
