import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  ChangeDetectorRef
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectService } from '../project-service/project.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthService } from '../../../auth/auth.service';
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,HasPermissionDirective
  ],
  templateUrl: './project-agv-summary.component.html',
  styleUrl: './project-agv-summary.component.css',
//   encapsulation: ViewEncapsulation.None,
})
export class ProjectAgvSummaryComponent implements OnInit, AfterViewInit {
  // Khai báo format ngày giờ
  /**
   console.log(now.toFormat('yyyy-MM-dd')); // 👉 2025-06-05
    console.log(now.toFormat('dd/MM/yyyy')); // 👉 05/06/2025
    console.log(now.toFormat('HH:mm:ss dd-MM-yyyy')); // 👉 14:30:59 05-06-2025
    console.log(now.toFormat('EEEE, dd LLL yyyy')); // 👉 Thursday, 05 Jun 2025
   */
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
    private cdr: ChangeDetectorRef // Thêm này
  ) {}
  //Ga
  //#region Khai báo biến
  @ViewChild('tb_projects', { static: false })
  tb_projectsContainer!: ElementRef;
  @ViewChild('tb_projectWorkReport', { static: false })
  tb_projectWorkReportContainer!: ElementRef;
  @ViewChild('tb_projectTypeLink', { static: false })
  tb_projectTypeLinkContainer!: ElementRef;

  isHide: any = false;

  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  customers: any[] = [];
  projecStatuses: any[] = [];

  tb_projects: any;
  tb_projectTypeLinks: any;
  tb_projectWorkReports: any;
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  userId: any;
  pmId: any;
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';
  projectId: any = 0;
  currentUser: any = null;
  pageId: number =2;
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
    globalID : number =0;
  //#endregion

  //#region chạy khi mở chương trình
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let id = Number(params.get('id'));
      this.isHide = id !== 2;
    });
  }
  getCurrent(){
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.globalID = response.data.ID;
        console.log("binh xem",this.globalID);
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    // 1. Vẽ bảng (không load data)
    this.drawTbProjects(this.tb_projectsContainer.nativeElement);
    this.drawTbProjectTypeLinks(this.tb_projectTypeLinkContainer.nativeElement);
    this.drawTbProjectWorkReports(this.tb_projectWorkReportContainer.nativeElement);
  
    // 2. Load dropdown
    this.getUsers();
    this.getPms();
    this.getBusinessFields();
    this.getCustomers();
    this.getProjectStatus();
  
    // 3. Set giá trị mặc định cho projectTypeIds nếu pageId === 2 (set sớm để đảm bảo có giá trị khi search)
    if (this.pageId === 2) {
      this.projectTypeIds = [2];
    }
  
    // 4. Chờ getCurrent và getProjectTypes hoàn thành → mới search
    this.getCurrent();
    this.getProjectTypes();
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
    this.tb_projects = new Tabulator(container, {
      // data:[{ID:1}],
      //   height: '100%',
      //   layout: 'fitColumns',

      ...DEFAULT_TABLE_CONFIG,
      rowHeader:false,
      selectableRows: 1,
      layout:'fitDataStretch',
      height: '85vh',
      //   pagination: true,
      //   paginationMode: 'remote',
      //   paginationSize: 100,
      //   paginationSizeSelector: [100, 200, 400, 800, 1000],
      ajaxURL: this.projectService.getAPIProjects(),
     ajaxParams: this.getProjectAjaxParams(),
      ajaxResponse: (url, params, res) => {
        // console.log('total', res.totalPage);
        return {
          data: res.data.project,
          last_page: res.data.totalPage,
        };
      },
      columns: [
        {
          title: 'Trạng thái',
          field: 'ProjectStatusName',
          //   hozAlign: 'left',
          // formatter: function (cell, formatterParams, onRendered) {
          //   let value = cell.getValue() || 'Kết thúc';
          //   return value;
          // },
          //   headerHozAlign: 'center',
          width: 100,
          formatter: 'textarea',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          //   headerHozAlign: 'center',
        },
        // {
        //   title: 'Ngày cập nhật',
        //   field: 'UpdatedDate',
        //   width: 100,
        //   formatter: function (cell, formatterParams, onRendered) {
        //     let value = cell.getValue() || '';
        //     const dateTime = DateTime.fromISO(value);
        //     value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        //     return value;
        //   },
        //   hozAlign: 'center',
        //   //   headerHozAlign: 'center',
        // },

        {
          //create column group
          title: 'Mức độ ưu tiên',
          columns: [
            {
              title: 'Dự án',
              field: 'PriotityText',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              // //   editable: true,
              // formatter(cell, formatterParams, onRendered) {
              //   const wrapper = document.createElement('div');
              //   wrapper.innerHTML = `<app-projects></app-projects>`;
              //   document.body.appendChild(wrapper);

              //   // Bạn có thể dùng Angular's ViewContainerRef để inject component động nếu cần nâng cao.

              //   return wrapper;
              //},
            },
            {
              title: 'Cá nhân',
              field: 'PersonalPriotity',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
            },
          ],
        },

        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          //   hozAlign: 'left',
          bottomCalc: 'count',
          //   headerHozAlign: 'center',
       
        },
        {
          title: 'Trạng thái dự án',
          field: 'ProjectProcessType',
          hozAlign: 'left',
          //   headerHozAlign: 'center',
     
        },
        {
          title: 'Nội dung công việc',
          field: 'UserMission',
          hozAlign: 'left',
          formatter:'textarea',
          //   headerHozAlign: 'center',
       
        },
        // {
        //   title: 'Tên dự án',
        //   field: 'ProjectName',
        //   //   hozAlign: 'left',
        //   //   headerHozAlign: 'center',
        
        //   formatter: 'textarea',
        // },
        {
          title: 'End User',
          field: 'EndUserName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
        
          formatter: 'textarea',
        },
        { title: 'PO', field: 'PO', hozAlign: 'center', width: 100 },
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
         
        },
        {
          title: 'Người phụ trách(sale)',
          field: 'FullNameSale',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
         
          formatter: 'textarea',
        },
        {
          title: 'Người phụ trách(kỹ thuật)',
          field: 'FullNameTech',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
        
          formatter: 'textarea',
        },
        {
          title: 'PM',
          field: 'FullNamePM',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
       
          formatter: 'textarea',
        },
        {
          title: 'Lĩnh vực dự án',
          field: 'BussinessField',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
         
          formatter: 'textarea',
        },
        {
          title: 'Hiện trạng',
          field: 'CurrentSituation',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
         
          formatter: 'textarea',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
         
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
            
            },
          ],
        },

        {
          title: 'Người tạo',
          field: 'CreatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
         
        },
        {
          title: 'Người sửa',
          field: 'UpdatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
        
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
    });
  }

  getProjectAjaxParams() {
    const projectTypeStr =
      this.projectTypeIds?.length > 0 ? this.projectTypeIds.join(',') : '';

    const projectStatusStr =
      this.projecStatusIds?.length > 0 ? this.projecStatusIds.join(',') : '';
    return {
      dateTimeS: DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 0, minute: 0, second: 0 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      dateTimeE: DateTime.fromJSDate(new Date(this.dateEnd))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      keyword: this.keyword ?? '',
      customerID: this.customerId ?? 0,
      saleID: this.userId ?? 0,
      projectType: projectTypeStr ?? '',
      leaderID: this.technicalId ?? 0,
      userTechID: 0,
      pmID: this.pmId ?? 0,
      globalUserID: this.globalID ?? 0,
      bussinessFieldID: this.businessFieldId ?? 0,
      projectStatus: projectStatusStr ?? '',
      isAGV: false,
    };
  }
  getDay() {
    console.log(
      DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      DateTime.fromJSDate(this.dateStart)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
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
  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getBusinessFields() {
    this.projectService.getBusinessFields().subscribe({
      next: (response: any) => {
        this.businessFields = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectTypes() {
    this.projectService.getProjectTypes().subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.projectTypes = res.data;
          // Tương tự như selectedKhoTypes trong ví dụ của bạn
          if (this.pageId === 2) {
            this.projectTypeIds = [2];
          } else {
            this.projectTypeIds = [];
          }
  
          // Ép Angular cập nhật lại select (cách chắc chắn)
          this.projectTypeIds = [...this.projectTypeIds];
          
          // Sau khi getProjectTypes hoàn thành và projectTypeIds đã được set, mới gọi searchProjects
          // Đợi một chút để đảm bảo getCurrent cũng có thể hoàn thành
          setTimeout(() => {
            this.searchProjects();
          }, 100);
        }
      },
      error: (err) => {
        console.log("Lỗi khi lấy project types", err);
        // Vẫn search ngay cả khi có lỗi
        setTimeout(() => {
          this.searchProjects();
        }, 100);
      }
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
    this.tb_projects.setData(
      this.projectService.getAPIProjects(),
      this.getProjectAjaxParams()
    );
  }

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.projectTypeIds = [];
    this.projecStatusIds = [];
    this.userId = 0;
    this.pmId = 0;
    this.businessFieldId = 0;
    this.technicalId = 0;
    this.customerId = 0;
    this.keyword = '';
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
  //#endregion

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
      ID: 0,
      UserID: this.currentUser?.EmployeeID ?? 0, 
      ProjectID: selectedIDs[0],                 
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
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion
  //#endregion

  //#region đóng panel
  closePanel(){
    this.sizeTbDetail = '0';
  }
  //#endregion
}
