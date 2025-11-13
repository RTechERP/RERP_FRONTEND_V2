import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
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
// import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
// import { ProjectService } from './project-service/project.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectChangeComponent } from '../project-change/project-change.component';
import { ProjectStatusComponent } from '../project-status/project-status.component';
import { Router } from '@angular/router';
import { ProjectEmployeeComponent } from '../project-employee/project-employee.component';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectService } from '../project-service/project.service';
import { NzFormModule } from 'ng-zorro-antd/form'; 
import { AuthService } from '../../../auth/auth.service';
import { ProjectWorkerSyntheticComponent } from './project-department-summary-form/project-worker-synthetic/project-worker-synthetic.component';
import { ProjectListWorkReportComponent } from '../project-list-work-report/project-list-work-report.component';
import { ProjectWorkTimelineComponent } from '../project-work-timeline/project-work-timeline.component';
import { ProjectWorkPropressComponent } from '../project-work-propress/project-work-propress.component';
import { WorkItemComponent } from '../work-item/work-item.component';
import { ProjectWorkerComponent } from './project-department-summary-form/project-woker/project-worker.component';
@Component({
  selector: 'app-project-new',
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzFormModule,
    ProjectWorkerComponent
  ],
  templateUrl: './project-department-summary.component.html',
  styleUrl: './project-department-summary.component.css'
})
export class ProjectDepartmentSummaryComponent implements AfterViewInit {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  selected = '';
  options = [
    { label: 'Mới', value: 'new' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Hoàn thành', value: 'done' },
  ];

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}
  //Ga
  //#region Khai báo biến
  @ViewChild('tb_projectsummary', { static: false })
  tb_projectsummaryContainer!: ElementRef;
  @ViewChild('tb_projectsummaryWorkReport', { static: false })
  tb_projectsummaryWorkReportContainer!: ElementRef;
  @ViewChild('tb_projectsummaryTypeLink', { static: false })
  tb_projectsummaryTypeLinkContainer!: ElementRef;
  @ViewChild('tb_projectSituation', { static: false })
  tb_projectSituationContainer!: ElementRef;

  isHide: any = false;

  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  projectSituations: any[] = [];
  projecStatuses: any[] = [];

  tb_projects: any;
  tb_projectTypeLinks: any;
  tb_projectWorkReports: any;
  tb_projectSituation: any;
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';
  projectId: any = 0;
  currentUser: any = null;
  users:any;
  departments:any;
  teams:any;
  searchParams: any = {
    dateTimeS: new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .split('T')[0],
    dateTimeE: new Date().toISOString().split('T')[0],
    keyword: '',
    userID: 0,
    projectTypeID: '',
    departmentID: 0,
    userTeamID: 0,
  };
 

  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  //#endregion

  //#region chạy khi mở chương trình
  ngOnInit(): void {
    
    this.route.paramMap.subscribe((params) => {
      let id = params.get('id');
      if (Number(id) == 2) {
        this.isHide = false;
        this.projectTypeIds = [2];
        // this.drawTbProjects(this.tb_projectsContainer.nativeElement);
        // this.drawTbProjectTypeLinks(
        //   this.tb_projectTypeLinkContainer.nativeElement
        // );
      } else {
        this.isHide = true;
        this.projectTypeIds = [];
        // this.drawTbProjects(this.tb_projectsContainer.nativeElement);
        // this.drawTbProjectTypeLinks(
        //   this.tb_projectTypeLinkContainer.nativeElement
        // );
      }
      //   console.log(this.isHide);
    });
  }
  
  ngAfterViewInit(): void {
    this.drawTbProjects(this.tb_projectsummaryContainer.nativeElement);
    this.drawTbProjectTypeLinks(this.tb_projectsummaryTypeLinkContainer.nativeElement);
    this.drawTbProjectWorkReports(
      this.tb_projectsummaryWorkReportContainer.nativeElement
    );
    this.drawTbProjectSituation(this.tb_projectSituationContainer.nativeElement);
    this.loadProjects();
    this.getDepartment();
    this.getUserTeam();
    this.getProjectTypes();
    this.getProjectStatus();
  }
 
getUserTeam() {
  this.teams = [];
  if (this.searchParams.departmentID > 0) {
    this.projectService.getUserTeam(this.searchParams.departmentID).subscribe({
      next: (response: any) => {
        this.teams = response.data;
        console.log("jhaa", this.teams)
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  } else {
    // Reset team khi không chọn phòng ban
    this.searchParams.userTeamID = 0;
  }
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
  loadProjects() {
    const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateTimeS)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateTimeE));
  
    this.projectService.getProjectSummary(dateStart,dateEnd,
      this.searchParams.departmentID,
      this.searchParams.userID,
      this.searchParams.projectTypeID, 
      this.searchParams.keyword,
      this.searchParams.userTeamID).subscribe({
      next: (res:any) => {
        if (res.status===1) {
          this.project = res.data;
          console.log('Dự án:', res.data);
          // Nếu dùng Tabulator → reload data
          if (this.tb_projects) {
            this.tb_projects.replaceData(this.project);
          }
        }
      },
      error: (err:any) => {
        console.error('Lỗi API:', err);
        alert('Không tải được dữ liệu dự án!');
      }
    });
  }

  onChange(val: string) {
    this.valueChange.emit(val);
  }

  // Khai báo các hàm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }

  //#endregion

  //#region xử lý bảng danh sách dự án
  drawTbProjects(container: HTMLElement) {
    let contextMenuProject = [
      {
        label: `<span style="font-size: 0.75rem;"><img src="assets/icon/priority_level_16.png" alt="Mức độ ưu tiên cá nhân" class="me-1" /> Mức độ ưu tiên cá nhân</span>`,
        menu: [1, 2, 3, 4, 5].map((level) => ({
          label: `<span style="font-size: 0.75rem;">${level}</span>`,
          action: (e: any, row: any) => {
            this.setPersionalPriority(level);
          },
        })),
      },
      {
        label:  
          '<span style="font-size: 0.75rem;"><img src="assets/icon/action_export_excel_16.png" alt="Xuất Excel" class="me-1" /> Xuất excel</span>',
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
          '<span style="font-size: 0.75rem;"><img src="assets/icon/list_project_report_16.png" alt="Danh sách báo cáo công việc" class="me-1" /> Danh sách báo cáo công việc</span>',
        action: (e: any, row: any) => {
          this.openProjectListWorkReport();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/participants_16.png" alt="Người tham gia" class="me-1" /> Người tham gia</span>',
        action: (e: any, row: any) => {
          this.openProjectEmployee();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/project_status_16.png" alt="Trạng thái dự án" class="me-1" /> Trạng thái dự án</span>',
        action: (e: any, row: any) => {
          this.openProjectStatus();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/compare_project_16.png" alt="Chuyển dự án" class="me-1" /> Chuyển dự án</span>',
        action: (e: any, row: any) => {
          this.changeProject();
        },
      },
    ];

    if (!this.isHide) {
      contextMenuProject = [
        {
          label:
            '<span style="font-size: 0.75rem;"><img src="assets/icon/action_export_excel_16.png" alt="Xuất Excel" class="me-1" /> Xuất excel</span>',
          action: (e: any, row: any) => {
            this.exportExcel();
          },
        },
      ];
    }

    this.tb_projects = new Tabulator(container, {
      // data:[{ID:1}],
      //   height: '100%',
      //   layout: 'fitColumns',

      ...DEFAULT_TABLE_CONFIG,
      data:this.project,
      rowHeader: false,
      selectableRows:1,
      paginationMode: 'local',
        // pagination: true,
        // paginationMode: 'remote',
        // paginationSize: 100,
        // paginationSizeSelector: [100, 200, 400, 800, 1000],
      rowContextMenu: contextMenuProject,
      columns: [
        {
          title: 'Trạng thái',
          field: 'ProjectStatusName',
          width: 100,
          formatter: 'textarea',
        },
        {
          //create column group
          title: 'Mức độ ưu tiên',
          columns: [
            {
              title: 'Dự án',
              field: 'PriotityText',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 70,
            },
            {
              title: 'Cá nhân',
              field: 'PersonalPriotity',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 90,
            },
          ],
        },

        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          //   hozAlign: 'left',
          bottomCalc: 'count',
          //   headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Hiện trạng',
          field: 'CurrentSituation',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Người phụ trách(sale)',
          field: 'FullNameSale',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Người phụ trách(kỹ thuật)',
          field: 'FullNameTech',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'PM',
          field: 'FullNamePM',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },

        {
          //create column group
          title: 'Dự kiến',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanDateStart',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'PlanDateEnd',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },

        {
          //create column group
          title: 'Thực tế',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualDateStart',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualDateEnd',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },
        {
          title: 'End User',
          field: 'EndUserName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
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
          //   headerHozAlign: 'center',
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
          //   headerHozAlign: 'center',
        },
        {
          title: 'Người tạo',
          field: 'CreatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Người sửa',
          field: 'UpdatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
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
          //   headerHozAlign: 'center',
        },

      ],
    });

    this.tb_projects.on('dataLoading', () => {
      this.tb_projects.deselectRow();
      this.sizeTbDetail = '0';
    });

    this.tb_projects.on('rowClick', (e: any, row: any) => {
      //   this.tb_projects.deselectRow();
      //   row.select();
      this.sizeTbDetail = null;
      var rowData = row.getData();
      this.projectId = rowData['ID'];
      this.getProjectWorkReports();
      this.getProjectTypeLinks();
      this.getProjectSituation();
    });
  }

  getProjectSituation() {
    this.projectService.getProjectSituation(this.projectId).subscribe((res) => {
      if(res.status === 1) {
        this.projectSituations = res.data;
        this.tb_projectSituation.setData(this.projectSituations);
      } else {
        this.notification.error('Lỗi', res.message);
        this.projectSituations = [];
        this.tb_projectSituation.setData([]);
      } 
    });
  }

  getProjectAjaxParams() {
    const safeDate = (date: Date | null, isStart: boolean): string | null => {
      if (!date) return null;
      const dt = DateTime.fromJSDate(date);
      if (!dt.isValid) return null;
      return isStart
        ? dt.startOf('day').toFormat('yyyy-MM-dd HH:mm:ss')
        : dt.endOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
    };
  
    const filter = {
      dateTimeS: safeDate(this.dateStart, true),
      dateTimeE: safeDate(this.dateEnd, false),
      departmentID: 0,
      userTeamID: 0,
      userID: this.customerId ?? 0,
      projectTypeID: this.projectTypeIds?.length > 0 ? this.projectTypeIds.join(',') : '',
      keyword: (this.keyword ?? '').trim(),
    };
  
    return { filter }; // ← ĐÚNG FORMAT: { filter: { ... } }
  }
  getDay() {
    const safeLog = (isoDate: any, label: string) => {
      if (!isoDate) {
        console.log(`${label}: null`);
        return;
      }
  
      const dt = DateTime.fromISO(isoDate);
      if (!dt.isValid) {
        console.log(`${label}: Invalid DateTime →`, isoDate);
        return;
      }
  
      const formatted = dt.set({ hour: 23, minute: 59, second: 59 }).toFormat('yyyy-MM-dd HH:mm:ss');
      console.log(`${label}:`, formatted);
    };
  
    safeLog(this.dateStart, 'dateStart → 23:59:59');
    safeLog(this.dateEnd, 'dateEnd → 23:59:59');
  }
  //#endregion

  //#region xử lý bảng danh sách hạng mục công việc
  drawTbProjectWorkReports(container: HTMLElement) {
    this.tb_projectWorkReports = new Tabulator(container, {
      // ...DEFAULT_TABLE_CONFIG,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },

      height: '78vh',
      selectableRows: 1,
      layout: 'fitDataFill',
      ajaxURL: this.projectService.getProjectItems(),
      ajaxParams: { id: this.projectId },
      ajaxResponse: (url, params, res) => {
        return res.data;
      },
      locale: 'vi',
      rowFormatter: function (row) {
        let data = row.getData();

        let itemLate = parseInt(data['ItemLateActual']);
        // console.log('item', itemLate);
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
          width: 50,
        },
        {
          title: 'Mã',
          field: 'Code',
          hozAlign: 'left',
          width: 120,
          bottomCalc: 'count',
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          width: 100,
        },
        {
          title: 'Kiểu hạng mục',
          field: 'ProjectTypeName',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          width: 150,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          width: 150,
          formatter: 'textarea',
        },
        {
          title: '%',
          field: 'PercentItem',
          hozAlign: 'right',
          width: 50,
        },
        {
          title: 'Công việc',
          field: 'Mission',
          //   headerHozAlign: 'center',
          width: 300,
          //   editor: true,
          formatter: 'textarea',
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeRequest',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          //create column group
          title: 'Dự kiến',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanStartDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Số ngày',
              field: 'TotalDayPlan',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 80,
            },
            {
              title: 'Ngày kết thúc',
              field: 'PlanEndDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },

        {
          title: 'Thực tế',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualStartDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualEndDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: '%',
              field: 'PercentageActual',
              hozAlign: 'right',
              //   formatter: function (cell, formatterParams, onRendered) {
              //     let value = cell.getValue() || '';
              //     return value;
              //   },
              width: 50,
            },
          ],
        },

        {
          title: 'Ghi chú',
          field: 'Note',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          headerHozAlign: 'center',
          width: 300,
          formatter: 'textarea',
        },
        {
          title: 'Người tham gia',
          field: 'ProjectEmployeeName',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          headerHozAlign: 'center',
          width: 300,
          formatter: 'textarea',
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
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
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
          formatter: 'tickCross',
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          //   headerHozAlign: 'center',
        },
        {
          title: 'Leader',
          field: 'FullName',
          headerHozAlign: 'center',
          visible: this.isHide,
        },
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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region tìm kiếm

 

  getProjectTypes() {
    this.projectService.getProjectTypes().subscribe({
      next: (response: any) => {
        this.projectTypes = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projecStatuses = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  searchProjects() {
    this.loadProjects();
  }
  //#endregion
  setDefautSearch(){
    this.searchParams={
      dateTimeS: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
      dateTimeE: new Date().toISOString().split('T')[0],
      keyword: '',
      userID: 0,
      projectTypeID: '',
      departmentID: 0,
      userTeamID: 0,
    }
  }
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
      // centered: true,
      // backdrop: 'static',
      // windowClass: 'full-screen-modal',
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
      this.notification.error('Thông báo',
        'Không có dữ liệu xuất excel!',
      );
      return;
    }

    this.projectService.exportExcel(table, data, 'Tổng hợp danh sách phòng ban', 'Tổng hợp danh sách phòng ban');
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
          error: (error) => {
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
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
      console.log("CurentUser:",this.currentUser);
    });
  }
  setPersionalPriority(priority: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);
    if (selectedIDs.length <= 0) {
      this.notification.error('Thông báo','Vui lòng chọn dự án!')
      return;
    }

    const dataSave = {
      ID: 0,
      UserID: this.currentUser?.EmployeeID ?? 0, 
      ProjectID: selectedIDs[0],                 
      Priotity: priority,                          
    };
    console.log("dataSaveuutien", dataSave);
    this.projectService.saveProjectPersonalPriority(dataSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            'Đã đổi độ ưu tiên cá nhân!'
          );
          this.searchProjects();
        }
      },
      error: (error) => {
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

  //#region đóng panel
  closePanel(){
    this.sizeTbDetail = '0';
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
  //#region Hiện trạng dự án
  drawTbProjectSituation(container: HTMLElement) {
    this.tb_projectSituation = new Tabulator(container, {
      data: this.projectSituations,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },

      height: '78vh',
      selectableRows: 1,
      layout: 'fitDataFill',
      ajaxURL: this.projectService.getProjectItems(),
      ajaxParams: { id: this.projectId },
      ajaxResponse: (url, params, res) => {
        return res.data;
      },
      locale: 'vi',
      columns: [
        {
          title: 'Người cập nhật',
          field: 'FullName',
          width: 200,
        },
        {
          title: 'Ngày cập nhật',
          field: 'DateSituation',
          width: 200,
          formatter: (cell) => {
            return cell.getValue() ? DateTime.fromISO(cell.getValue()).toFormat('dd/MM/yyyy:HH:mm:ss'):'';
          }
        },
        {
          title: 'Nội dung',
          field: 'ContentSituation',
          width: 200,
          formatter: 'textarea',
        }
      ],
    });
  }
  //#endregion
  //#region Tổng hợp nhân công
  openProjectWorkerSynthetic() {
    const modalRef = this.modalService.open(ProjectWorkerSyntheticComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectID = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion
  //#region Danh sách báo cáo công việc
  openProjectWorkReportModal() {
    const modalRef = this.modalService.open(ProjectListWorkReportComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
       // this.searchProjects();
      }
    });
  }
  //#endregion
  //#region Timeline công việc
  openProjectWorkTimeline() {
    const modalRef = this.modalService.open(ProjectWorkPropressComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion
  //#region Hạng mục công việc
  openWorkItemModal() {
    const modalRef = this.modalService.open(WorkItemComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion
  //#region Nhân công dự án
  openProjectWorkerModal() {
    const modalRef = this.modalService.open(ProjectWorkerComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion
}

