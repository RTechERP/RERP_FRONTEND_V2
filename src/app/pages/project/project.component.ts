import { Component, ViewEncapsulation } from '@angular/core';
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
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-projects',
  standalone: true,
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
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectComponent implements OnInit, AfterViewInit {
  // Khai báo format ngày giờ
  /**
   console.log(now.toFormat('yyyy-MM-dd')); // 👉 2025-06-05
    console.log(now.toFormat('dd/MM/yyyy')); // 👉 05/06/2025
    console.log(now.toFormat('HH:mm:ss dd-MM-yyyy')); // 👉 14:30:59 05-06-2025
    console.log(now.toFormat('EEEE, dd LLL yyyy')); // 👉 Thursday, 05 Jun 2025
   */
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) {}

  sizeSearch: string = '0';
  project: any[] = [];
  projectTypes = [];
  users = [];
  pms = [];
  businessFields = [];
  customers = [];
  projecStatuses = [];

  // Khai báo các bảng
  tb_projects: any;
  tb_projectTypeLinks: any;
  tb_projectitems: any;
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  userId: any;
  pmId: any;
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';

  dateStart: any;
  dateEnd: any;

  // Chạy khi mở chương trình
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTbProjects();
  }

  // Khai báo các hàm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  drawTbProjects() {
    if (this.tb_projects) this.tb_projects.destroy();
    const contextMenuProject = [
      {
        label: `<span style="font-size: 0.75rem;"><i class="fas fa-chart-bar"></i> Mức độ ưu tiên cá nhân</span>`,
        menu: [1, 2, 3, 4, 5].map((level) => ({
          label: `<span style="font-size: 0.75rem;">${level}</span>`,
          action: (e: any, row: any) => {
            // this.openEditProjectPersonalPriority(level);
          },
        })),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-file-excel"></i> Xuất excel</span>',
        action: (e: any, row: any) => {
          // this.exportExcel();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-chart-simple"></i> Tổng hợp nhân công</span>',
        action: (e: any, row: any) => {
          // this.openProjectWorkerPriority();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-list-ul"></i> Danh sách báo cáo công việc</span>',
        action: (e: any, row: any) => {
          // this.openProjectListWorkReport();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-circle-half-stroke"></i> Trạng thái dự án</span>',
        action: (e: any, row: any) => {
          // this.openProjectStatus();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-recycle"></i> Chuyển dự án</span>',
        action: (e: any, row: any) => {
          // this.changeProject();
        },
      },
    ];

    let data = [];
    for (let index = 0; index < 100; index++) {
      data.push({ ID: index });
    }
    this.tb_projects = new Tabulator(`#tb_projects`, {
      data: data,
      height: '70vh',
      layout: 'fitDataFill',
      rowHeader: {
        width: 20,
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
      },
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 40, 80, 100],
      // ajaxURL: this.projectService.getAPIProjects(),
      // ajaxParams: this.getProjectAjaxParams(),
      // ajaxResponse: function (url, params, res) {
      //   return {
      //     data: res.data,
      //     last_page: 5,
      //   };
      // },
      rowContextMenu: contextMenuProject,
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
      columns: [
        {
          title: 'Trạng thái',
          field: 'ProjectStatusName',
          hozAlign: 'left',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || 'Kết thúc';
            return value;
          },
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          width: 100,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDate',
          width: 100,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Mức độ ưu tiên',
          field: 'PriotityText',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Mức độ ưu tiên cá nhân',
          field: 'PersonalPriotity',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          hozAlign: 'left',
          bottomCalc: 'count',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'End User',
          field: 'EndUserName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        { title: 'PO', field: 'PO', hozAlign: 'center' },
        {
          title: 'Ngày PO',
          field: 'PODate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Người phụ trách(sale)',
          field: 'FullNameSale',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Người phụ trách(kỹ thuật)',
          field: 'FullNameTech',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'PM',
          field: 'FullNamePM',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Lĩnh vực dự án',
          field: 'BussinessField',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Hiện trạng',
          field: 'CurrentState',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày bắt đầu dự kiến',
          field: 'PlanDateStart',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc dự kiến',
          field: 'PlanDateEnd',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày bắt đầu thực tế',
          field: 'ActualDateStart',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc thực tế',
          field: 'ActualDateEnd',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Người tạo',
          field: 'Người tạo',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Người sửa',
          field: 'UpdatedBy',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
      ],
    });
  }

  // getProjectAjaxParams() {
  //   debugger;
  //   const projectTypeStr =
  //     this.projecStatusIds?.length > 0 ? this.projecStatusIds.join(',') : '';

  //   const projectStatusStr =
  //     this.projecStatusIds?.length > 0 ? this.projecStatusIds.join(',') : '';
  //   return {
  //     dateTimeS: DateTime.fromISO(this.dateStart)
  //       .set({ hour: 0, minute: 0, second: 0 })
  //       .toFormat('yyyy-MM-dd HH:mm:ss'),
  //     dateTimeE: DateTime.fromISO(this.dateEnd)
  //       .set({ hour: 23, minute: 59, second: 59 })
  //       .toFormat('yyyy-MM-dd HH:mm:ss'),
  //     keywword: this.keyword ?? '',
  //     customerID: this.customerId ?? 0,
  //     saleID: this.userId ?? 0,
  //     projectType: projectTypeStr,
  //     leaderID: this.technicalId ?? 0,
  //     userTechID: 0,
  //     pmID: this.pmId ?? 0,
  //     globalUserID: this.projectService.GlobalEmployeeId,
  //     bussinessFieldID: this.businessFieldId ?? 0,
  //     projectStatus: projectStatusStr,
  //   };
  // }
}
