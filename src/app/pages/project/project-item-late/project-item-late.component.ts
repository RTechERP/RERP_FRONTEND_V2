import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project-service/project.service';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
@Component({
  selector: 'app-project-item-late',
  imports: [
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,HasPermissionDirective
  ],
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './project-item-late.component.html',
  styleUrl: './project-item-late.component.css',
})
export class ProjectItemLateComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  @ViewChild('tb_projectItemlate', { static: false })
  tb_projectItemlateContainer!: ElementRef;

  sizeSearch: string = '0';
  isLoadTable: any = false;

  tb_projectItemlate: any;

  departments: any[] = [];
  employees: any[] = [];
  projects: any[] = [];

  dateStart: any = DateTime.local().set({ day: 1 }).toISO();
  dateEnd: any = DateTime.local().plus({ month: 1 }).set({ day: 1 }).toISO();
  departmentId: any;
  employeeId: any;
  projectId: any;
  keyword: any;
  IsLateActual: number = 0;
  //#endregion
  //#region Chạy khi mở
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.drawTbProjectItemlate(this.tb_projectItemlateContainer.nativeElement);
    this.getProjects();
    this.getDepartment();
    this.getEmployees();
    this.getProjectItemLate();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  resetSearch() {
    this.dateStart = DateTime.local().set({ day: 1 }).toISO();
    this.dateEnd = DateTime.local().plus({ month: 1 }).set({ day: 1 }).toISO();
    this.departmentId = 0;
    this.employeeId = 0;
    this.projectId = 0;
    this.keyword = '';
    this.IsLateActual = 0;
    if (this.tb_projectItemlate) {
      this.tb_projectItemlate.clearFilter();
    }
  }
  //#endregion
  //#region Xử lý bảng hạng mục chậm tiến độ
  drawTbProjectItemlate(container: HTMLElement) {
    this.tb_projectItemlate = new Tabulator(container, {
      //   height: '100%',
      //   layout: 'fitColumns',

      ...DEFAULT_TABLE_CONFIG,
      rowHeader:false,
      columnCalcs: 'both',
      pagination: true,
      layout:'fitDataStretch',
      height: '87vh',
      paginationMode:'local',
      groupBy: 'ProjectCode',
      groupHeader: function (value) {
        return value ? `Mã dự án ${value}` : `Chưa có mã dự án`;
      },
      //   columnCalcs: 'table',
      //   locale: 'vi',
      columns: [
        {
          title: 'Mã công việc',
          field: 'Code',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Tình trạng',
          field: 'StatusText',
          width: 100,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          width: 150,
          headerHozAlign: 'center',
          bottomCalc: 'count',
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeRequest',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Công việc',
          field: 'Mission',
          width: 400,
          headerHozAlign: 'center',
          formatter: 'textarea',
          editor: 'textarea',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          width: 300,
          headerHozAlign: 'center',
          formatter: 'textarea',
          editor: 'textarea',
        },
        {
          title: 'Lý do muộn',
          field: 'ReasonLate',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
          editor: 'textarea',
        },
        {
          title: 'Ngày bắt đầu dự kiến',
          field: 'PlanStartDate',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc dự kiến',
          field: 'PlanEndDate',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày bắt đầu thực tế',
          field: 'ActualStartDate',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc thực tế',
          field: 'ActualEndDate',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
        },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDateActual',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
        },
        {
          title: 'IsLateActual',
          field: 'IsLateActual',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Trạng thái',
          field: 'IsLateActualText',
          width: 200,
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            const rowData = cell.getRow().getData();
            const isLateActual = rowData['IsLateActual'];
            const value = cell.getValue() || '';
            let backgroundColor = '';
            let textColor = '';
            
            if (isLateActual === 1 || isLateActual === '1') {
              backgroundColor = '#ffd700'; // Màu vàng
              textColor = '#000000';
            } else if (isLateActual == 3 || isLateActual === '3') {
              backgroundColor = 'orange'; // Màu cam
              textColor = '#000000';
            } else if (isLateActual == 2 || isLateActual === '2') {
              backgroundColor = 'red'; // Màu đỏ
              textColor = 'white';
            }
            
            // Tô màu toàn bộ ô
            if (onRendered) {
              onRendered(function() {
                const cellElement = cell.getElement();
                if (cellElement && backgroundColor) {
                  cellElement.style.backgroundColor = backgroundColor;
                  cellElement.style.color = textColor;
                }
              });
            }
            
            return value;
          },
        },
      ],
    });
    this.tb_projectItemlate.on("pageLoaded", () => {
      this.tb_projectItemlate.redraw();
    });
  }
  //#endregion
  //#region Load dữ liệu hạng mục công việc chậm
  getProjectItemLate() {
    this.isLoadTable = true;

    let data = {
      userId: this.employeeId ? this.employeeId : 0,
      projectId: this.projectId ? this.projectId : 0,
      departmentId: this.departmentId ? this.departmentId : 0,
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      keyword: this.keyword ? this.keyword : '',
    };

    this.projectService.getProjectItemLate(data).subscribe({
      next: (response: any) => {
        console.log(response.data.length);
        this.tb_projectItemlate.setData(response.data);
        this.isLoadTable = false;
        // Áp dụng filter trạng thái sau khi load dữ liệu
        this.getTrangThai();
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  //#endregion
  //#region Xuất excel khảo sát dự án
  exportExcel() {
    let date = DateTime.local().toFormat('ddMMyy');
    this.projectService.exportExcelGroup(
      this.tb_projectItemlate,
      this.tb_projectItemlate.getData(),
      'Hạng mục chậm tiến độ',
      `HangMucCongViecChamTienDo_${date}`,
      'ProjectCode'
    );
  }
  //#endregion
  //#region Xử lý trạng thái
  getTrangThai() {
    if (this.tb_projectItemlate) {
      if (this.IsLateActual != 0) {
        // Lọc dữ liệu theo IsLateActual
        this.tb_projectItemlate.setFilter([
          {
            field: 'IsLateActual',
            type: '=',
            value: this.IsLateActual,
          },
        ]);
      } else {
        // Nếu không chọn trạng thái, hiển thị tất cả
        this.tb_projectItemlate.clearFilter();
      }
    }
  }
  //#endregion
}
