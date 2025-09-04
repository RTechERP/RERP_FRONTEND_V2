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
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { ProjectChangeComponent } from '../project-change/project-change.component';
import { ProjectStatusComponent } from '../project-status/project-status.component';
import { ProjectEmployeeComponent } from '../project-employee/project-employee.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-project-synthesis-department',
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
    CommonModule,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './project-synthesis-department.component.html',
  styleUrl: './project-synthesis-department.component.css',
})
export class ProjectSynthesisDepartmentComponent
  implements OnInit, AfterViewInit
{
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  //#region Khai báo biến
  @ViewChild('tb_projects', { static: false })
  tb_projectsContainer!: ElementRef;
  @ViewChild('tb_projectWorkReport', { static: false })
  tb_projectWorkReportContainer!: ElementRef;
  @ViewChild('tb_projectTypeLink', { static: false })
  tb_projectTypeLinkContainer!: ElementRef;
  @ViewChild('tb_projectCurrentSituation', { static: false })
  tb_projectCurrentSituationContainer!: ElementRef;

  tb_projects: any;
  tb_projectTypeLinks: any;
  tb_projectWorkReports: any;
  tb_projectCurrentSituation: any;

  isLoadTable: any = false;
  sizeSearch: string = '0';
  sizeTbDetail: any = '0';

  project: any[] = [];
  departments: any[] = [];
  teams: any[] = [];
  employees: any[] = [];

  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();

  projectId: any;
  departmentId: any;
  teamId: any;
  employeeId: any;
  keyword: any;
  //#endregion

  //#region chạy khi mở chương trình
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTbProjects(this.tb_projectsContainer.nativeElement);
    this.drawTbProjectTypeLinks(this.tb_projectTypeLinkContainer.nativeElement);
    this.drawTbProjectWorkReports(
      this.tb_projectWorkReportContainer.nativeElement
    );
    this.drawTbProjectCurrentSituation(
      this.tb_projectCurrentSituationContainer.nativeElement
    );

    this.getDepartment();
    this.getEmployees();
    this.getUserTeam();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,          'DepartmentName'
        );
      },
        error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
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
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion

  //#region xử lý bảng danh sách dự án
  drawTbProjects(container: HTMLElement) {
    const contextMenuProject = [
      {
        label: `<span style="font-size: 0.75rem;"><i class="fas fa-chart-bar"></i> Mức độ ưu tiên cá nhân</span>`,
        menu: [1, 2, 3, 4, 5].map((level) => ({
          label: `<span style="font-size: 0.75rem;">${level}</span>`,
          action: (e: any, row: any) => {
            this.setPersionalPriority(level);
          },
        })),
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-file-excel"></i> Xuất excel</span>',
        action: (e: any, row: any) => {
          this.exportExcel();
        },
      },
      // {
      //   label:
      //     '<span style="font-size: 0.75rem;"><i class="fas fa-chart-simple"></i> Tổng hợp nhân công</span>',
      //   action: (e: any, row: any) => {
      //     // this.openProjectWorkerPriority();
      //   },
      // },

      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-list-ul"></i> Danh sách báo cáo công việc</span>',
        action: (e: any, row: any) => {
          this.openProjectListWorkReport();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-users"></i> Người tham gia</span>',
        action: (e: any, row: any) => {
          this.openProjectEmployee();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-circle-half-stroke"></i> Trạng thái dự án</span>',
        action: (e: any, row: any) => {
          this.openProjectStatus();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-recycle"></i> Chuyển dự án</span>',
        action: (e: any, row: any) => {
          this.changeProject();
        },
      },
    ];

    this.tb_projects = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      rowHeader: {
        width: 20,
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
      },
      rowContextMenu: contextMenuProject,
      locale: 'vi',
      columns: [
        {
          title: 'Trạng thái',
          field: 'ProjectStatusName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Mức độ ưu tiên',
          field: 'PriotityText',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Mức độ ưu tiên cá nhân',
          field: 'PersonalPriotity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea',
          width: 200,
        },
        {
          title: 'Hiện trạng',
          field: 'CurrentState',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea',
          width: 200,
        },
        {
          title: 'Người phụ trách(sale)',
          field: 'FullNameSale',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
        },
        {
          title: 'Người phụ trách(kỹ thuật)',
          field: 'FullNameTech',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
        },
        {
          title: 'PM',
          field: 'FullNamePM',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
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
          width: 100,
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
          width: 100,
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
          width: 100,
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
          width: 100,
        },
        {
          title: 'End User',
          field: 'EndUserName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 100,
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
          width: 100,
        },
        {
          title: 'Người tạo',
          field: 'Người tạo',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Người sửa',
          field: 'UpdatedBy',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 100,
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
      ],
    });

    this.tb_projects.on('dataLoading', () => {
      this.tb_projects.deselectRow();
      this.sizeTbDetail = '0';
    });

    this.tb_projects.on('rowClick', (e: any, row: any) => {
      this.tb_projects.deselectRow();
      row.select();
      this.sizeTbDetail = null;
      var rowData = row.getData();
      this.projectId = rowData['ID'];
      this.getProjectWorkReports();
      this.getProjectTypeLinks();
    });
  }
  //#endregion

  //#region xử lý bảng danh sách hạng mục công việc
  drawTbProjectWorkReports(container: HTMLElement) {
    this.tb_projectWorkReports = new Tabulator(container, {
      height: '78vh',
      selectableRows: 1,
      layout: 'fitColumns',
      ajaxURL: this.projectService.getProjectItems(),
      ajaxParams: { id: this.projectId },
      ajaxResponse: (url, params, res) => {
        return res.data;
      },
      locale: 'vi',
      rowFormatter: function (row) {
        let data = row.getData();

        let itemLate = parseInt(data['ItemLateActual']);
        console.log('item', itemLate);
        let totalDayExpridSoon = parseInt(data['TotalDayExpridSoon']);
        let dateEndActual = DateTime.fromISO(data['ActualEndDate']).isValid
          ? DateTime.fromISO(data['ActualEndDate']).toFormat('dd/MM/yyy')
          : null;

        if (itemLate == 1) {
          row.getElement().style.backgroundColor = 'Orange';
          row.getElement().style.color = 'white';
        } else if (itemLate == 2) {
          row.getElement().style.backgroundColor = 'Red';
          row.getElement().style.color = 'white';
        } else if (totalDayExpridSoon <= 3 && !dateEndActual) {
          row.getElement().style.backgroundColor = 'LightYellow';
        }
      },
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        { title: 'Mã', field: 'Code', headerHozAlign: 'center', width: 100 },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          hozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Kiểu hạng mục',
          field: 'ProjectTypeName',
          hozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: '%',
          field: 'PercentItem',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Công việc',
          field: 'Mission',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeRequest',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ngày bắt đầu dự kiến',
          field: 'PlanStartDate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Tổng số ngày',
          field: 'TotalDayPlan',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ngày kết thúc dự kiến',
          field: 'PlanEndDate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ngày bắt đầu thực tế',
          field: 'ActualStartDate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ngày kết thúc thực tế',
          field: 'ActualEndDate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Người tham gia',
          field: 'ProjectEmployeeName',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: '% Thực tế',
          field: 'PercentageActual',
          hozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          width: 100,
        },
      ],
      initialSort: [{ column: 'ID', dir: 'asc' }],
    });
  }

  getProjectWorkReports() {
    this.tb_projectWorkReports.setData(this.projectService.getProjectItems(), {
      id: this.projectId,
    });
  }
  //#endregion

  //#region xử lý bảng kiểu dự án
  drawTbProjectTypeLinks(container: HTMLElement) {
    this.tb_projectTypeLinks = new Tabulator(container, {
      height: '80vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      layout: 'fitDataStretch',
      locale: 'vi',
      columns: [
        {
          title: 'Chọn',
          field: 'Selected',
          headerHozAlign: 'center',
          // formatter: function (cell, formatterParams, onRendered) {
          //   const checked = cell.getValue() ? 'checked' : '';
          //   return `<input type='checkbox' ${checked} disable/>`;
          // },
          formatter: 'tickCross',
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          headerHozAlign: 'center',
        },
        { title: 'Leader', field: 'FullName', headerHozAlign: 'center' },
      ],
    });
  }

  getProjectTypeLinks() {
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        this.tb_projectTypeLinks.setData(
          this.projectService.setDataTree(response.data, 'ID')
        );
      },
      error: (error: any) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region Xử lý bảng  hiện trạng
  drawTbProjectCurrentSituation(container: HTMLElement) {
    this.tb_projectCurrentSituation = new Tabulator(container, {
      height: '80vh',
      dataTree: true,
      dataTreeStartExpanded: true,
      layout: 'fitDataStretch',
      locale: 'vi',
      columns: [
        {
          title: 'Người cập nhật',
          field: 'FullName',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày cập nhật',
          field: 'DateSituation',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
        },
        {
          title: 'Nội dung',
          field: 'ContentSituation',
          headerHozAlign: 'center',
        },
      ],
    });
  }
  //#endregion

  //#region tìm kiếm
  searchProjects() {}

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.departmentId = 0;
    this.teamId = 0;
    this.employeeId = 0;
    this.keyword = '';
  }
  //#endregion

  //#region thêm/sửa dự án 0 thêm 1 sửa
  updateProject(status: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);
    if (status == 1) {
      if (selectedIDs.length != 1) {
        this.notification.error('', this.createdText('Vui lòng chọn dự án!'), {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
    }

    const modalRef = this.modalService.open(ProjectDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = status == 0 ? 0 : selectedIDs[0];

    modalRef.result.catch((reason) => {
      if (reason == true) {
        if (status == 0) {
          this.notification.success('', this.createdText('Đã thêm dự án!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        } else {
          this.notification.success('', this.createdText('Đã sửa dự án!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        }

        this.setDefautSearch();
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_projects;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error(
        '',
        this.createdText('Không có dữ liệu xuất excel!'),
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DanhSachDuAn.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion

  //#region xóa dự án
  deletedProjects() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length <= 0) {
      this.notification.error(
        '',
        this.createdText('Vui lòng chọn ít nhất 1 dự án để xóa!'),
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa dự án đã chọn?'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectService.deletedProject(selectedIDs).subscribe({
          next: (response: any) => {
            this.notification.success('', this.createdText('Đã xóa dự án!'), {
              nzStyle: { fontSize: '0.75rem' },
            });
            this.searchProjects();
          },
          error: (error: any) => {
            this.notification.error('', this.createdText('Lỗi xóa dự án!'), {
              nzStyle: { fontSize: '0.75rem' },
            });
            console.error('Lỗi:', error);
          },
        });
      },
    });
  }
  //#endregion

  //#region độ ưu tiên cá nhân
  setPersionalPriority(priority: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length <= 0) {
      this.notification.error('', this.createdText('Vui lòng chọn dự án!'), {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const dataSave = {
      ProjectIDs: selectedIDs,
      UserID: this.projectService.GlobalEmployeeId,
      Priotity: priority,
    };
    this.projectService.saveProjectPersonalPriority(dataSave).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success(
            '',
            this.createdText('Đã đổi độ ưu tiên cá nhân!'),
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          this.searchProjects();
        }
      },
      error: (error: any) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region chuyển dự án
  changeProject() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('', 'Vui lòng chọn 1 dự án cần chuyển!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectIdOld = selectedIDs[0];
    modalRef.componentInstance.disable = false;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Trạng thái dự án
  openProjectStatus() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectStatusComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Danh sách báo cáo công việc
  openProjectListWorkReport() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    this.router.navigate(['/projectListWork', selectedIDs[0]]);
  }
  //#endregion

  //#region Người tham gia dự án
  openProjectEmployee() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    let modalRef = this.modalService.open(ProjectEmployeeComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Lấy danh dách team theo phòng ban
  getUserTeam() {
    this.teams = [];
    if (this.departmentId > 0) {
      this.projectService.getUserTeam(this.departmentId).subscribe({
        next: (response: any) => {
          this.teams = response.data;
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }
  //#endregion
}
