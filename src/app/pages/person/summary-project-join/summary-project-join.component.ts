import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  ChangeDetectorRef,
  HostListener,
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
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { OnInit, AfterViewInit } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../project/project-service/project.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthService } from '../../../auth/auth.service';
import { SummaryProjectJoinService } from './summary-project-join-service/summary-project-join.service';
@Component({
  selector: 'app-summary-project-join',
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
    AngularSlickgridModule,
    // HasPermissionDirective
  ],
  templateUrl: './summary-project-join.component.html',
  styleUrl: './summary-project-join.component.css'
  //   encapsulation: ViewEncapsulation.None,
})
export class SummaryProjectJoinComponent implements OnInit, AfterViewInit {
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
    private summaryProjectJoinService: SummaryProjectJoinService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}
  //Ga
  //#region Khai báo biến
  // SlickGrid instances
  angularGridProjects!: AngularGridInstance;
  angularGridProjectEmployee!: AngularGridInstance;
  angularGridProjectWorkReports!: AngularGridInstance;
  angularGridProjectTypeLinks!: AngularGridInstance;
  gridDataProjects: any;
  gridDataProjectEmployee: any;
  gridDataProjectWorkReports: any;
  gridDataProjectTypeLinks: any;

  // Column definitions
  columnDefinitionsProjects: Column[] = [];
  columnDefinitionsProjectEmployee: Column[] = [];
  columnDefinitionsProjectWorkReports: Column[] = [];
  columnDefinitionsProjectTypeLinks: Column[] = [];

  // Grid options
  gridOptionsProjects: GridOption = {};
  gridOptionsProjectEmployee: GridOption = {};
  gridOptionsProjectWorkReports: GridOption = {};
  gridOptionsProjectTypeLinks: GridOption = {};

  // Datasets
  datasetProjects: any[] = [];
  datasetProjectEmployee: any[] = [];
  datasetProjectWorkReports: any[] = [];
  datasetProjectTypeLinks: any[] = [];


  isHide: any = false;
  showProjectDetail: boolean = false; // Điều khiển hiển thị tab bên dưới - mặc định false để tránh lỗi khởi tạo
  detailGridsReady: boolean = false; // Chỉ render detail grids khi container đã sẵn sàng

  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  customers: any[] = [];
  projecStatuses: any[] = [];

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
  pageId: number = 2;
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  globalID: number = 0;
  private resizeTimeout: any;
  //#endregion

  //#region chạy khi mở chương trình
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let id = Number(params.get('id'));
      this.isHide = id !== 2;
    });

    // Khởi tạo SlickGrid columns và options
    this.initGridProjects();
    this.initGridProjectEmployee();
    this.initGridProjectWorkReports();
    this.initGridProjectTypeLinks();
  }

  getCurrent() {
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.globalID = response.data.ID;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    // Load dropdown data
    this.getUsers();
    this.getPms();
    this.getBusinessFields();
    this.getCustomers();
    this.getProjectStatus();

    // Set giá trị mặc định
    if (this.pageId === 2) {
      this.projectTypeIds = [2];
    }

    // Load user và project types, sau đó search
    this.getCurrent();
    this.getProjectTypes();

    // Đợi DOM render xong và resize grids
    setTimeout(() => {
      this.resizeAllGrids();
      // Force trigger resize event để SlickGrid tính toán lại kích thước
      window.dispatchEvent(new Event('resize'));
      
      // Load data mẫu để test
      this.loadSampleData();
    }, 1000);
  }

  onChange(val: string) {
    this.valueChange.emit(val);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  clearAllFilters() {
    this.dateStart = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
      .toISO();
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.technicalId = null;
    this.keyword = '';
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }
  //#endregion

  //#region xử lý bảng danh sách dự án với SlickGrid
  initGridProjects() {
    // Format date helper
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        let dateValue = DateTime.fromISO(value);
        if (!dateValue.isValid) {
          dateValue = DateTime.fromFormat(value, 'yyyy-MM-dd');
        }
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
            return value;
      }
    };

    this.columnDefinitionsProjects = [
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', width: 70, sortable: true, excludeFromExport: true, hidden: true },
      { id: 'ProjectStatusName', name: 'Trạng thái', field: 'ProjectStatusName', type: 'string', width: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CreatedDate', name: 'Ngày tạo', field: 'CreatedDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'PriotityText', name: 'Ưu tiên dự án', field: 'PriotityText', type: 'number', width: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'PersonalPriotity', name: 'Ưu tiên cá nhân', field: 'PersonalPriotity', type: 'number', width: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProjectProcessType', name: 'Trạng thái dự án', field: 'ProjectProcessType', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'UserMission', name: 'Nội dung công việc', field: 'UserMission', type: 'string', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'EndUserName', name: 'End User', field: 'EndUserName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PO', name: 'PO', field: 'PO', type: 'string', width: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center' },
      { id: 'PODate', name: 'Ngày PO', field: 'PODate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'FullNameSale', name: 'Người phụ trách(sale)', field: 'FullNameSale', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'FullNameTech', name: 'Người phụ trách(kỹ thuật)', field: 'FullNameTech', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'FullNamePM', name: 'PM', field: 'FullNamePM', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'BussinessField', name: 'Lĩnh vực dự án', field: 'BussinessField', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'CurrentSituation', name: 'Hiện trạng', field: 'CurrentSituation', type: 'string', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PlanDateStart', name: 'Ngày bắt đầu (dự kiến)', field: 'PlanDateStart', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'PlanDateEndSummary', name: 'Ngày kết thúc (dự kiến)', field: 'PlanDateEndSummary', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualDateStart', name: 'Ngày bắt đầu (thực tế)', field: 'ActualDateStart', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualDateEnd', name: 'Ngày kết thúc (thực tế)', field: 'ActualDateEnd', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'CreatedBy', name: 'Người tạo', field: 'CreatedBy', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'UpdatedBy', name: 'Người sửa', field: 'UpdatedBy', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];

    this.gridOptionsProjects = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-projects',
        calculateAvailableSizeBy: 'container'
      },
      gridWidth: '100%',
      gridHeight: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Vẽ bảng dự án thực tế (bên phải) với SlickGrid
  initGridProjectEmployee() {
    // Format date helper
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        let dateValue = DateTime.fromISO(value);
        if (!dateValue.isValid) {
          dateValue = DateTime.fromFormat(value, 'yyyy-MM-dd');
        }
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
            return value;
      }
    };

    this.columnDefinitionsProjectEmployee = [
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', width: 70, sortable: true, excludeFromExport: true, hidden: true },
      { id: 'ProjectStatusName', name: 'Trạng thái', field: 'ProjectStatusName', type: 'string', width: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CreatedDate', name: 'Ngày tạo', field: 'CreatedDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'PriotityText', name: 'Ưu tiên dự án', field: 'PriotityText', type: 'number', width: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'PersonalPriotity', name: 'Ưu tiên cá nhân', field: 'PersonalPriotity', type: 'number', width: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProjectProcessType', name: 'Trạng thái dự án', field: 'ProjectProcessType', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'UserMission', name: 'Nội dung công việc', field: 'UserMission', type: 'string', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'EndUserName', name: 'End User', field: 'EndUserName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PO', name: 'PO', field: 'PO', type: 'string', width: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center' },
      { id: 'PODate', name: 'Ngày PO', field: 'PODate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'FullNameSale', name: 'Người phụ trách(sale)', field: 'FullNameSale', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'FullNameTech', name: 'Người phụ trách(kỹ thuật)', field: 'FullNameTech', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'FullNamePM', name: 'PM', field: 'FullNamePM', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'BussinessField', name: 'Lĩnh vực dự án', field: 'BussinessField', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'CurrentSituation', name: 'Hiện trạng', field: 'CurrentSituation', type: 'string', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PlanDateStart', name: 'Ngày bắt đầu (dự kiến)', field: 'PlanDateStart', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'PlanDateEndSummary', name: 'Ngày kết thúc (dự kiến)', field: 'PlanDateEndSummary', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualDateStart', name: 'Ngày bắt đầu (thực tế)', field: 'ActualDateStart', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualDateEnd', name: 'Ngày kết thúc (thực tế)', field: 'ActualDateEnd', type: 'date', width: 150, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'CreatedBy', name: 'Người tạo', field: 'CreatedBy', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'UpdatedBy', name: 'Người sửa', field: 'UpdatedBy', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];

    this.gridOptionsProjectEmployee = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-project-employee',
        calculateAvailableSizeBy: 'container'
      },
      gridWidth: '100%',
      gridHeight: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // SlickGrid event handlers
  angularGridProjectsReady(angularGrid: AngularGridInstance) {
    this.angularGridProjects = angularGrid;
    this.gridDataProjects = angularGrid?.slickGrid || {};
    
    // Đợi grid render xong rồi mới resize
    setTimeout(() => {
      this.angularGridProjects?.resizerService?.resizeGrid();
      this.angularGridProjects?.slickGrid?.invalidate();
      this.angularGridProjects?.slickGrid?.render();
    }, 200);
  }

  angularGridProjectEmployeeReady(angularGrid: AngularGridInstance) {
    this.angularGridProjectEmployee = angularGrid;
    this.gridDataProjectEmployee = angularGrid?.slickGrid || {};
    
    // Đợi grid render xong rồi mới resize
    setTimeout(() => {
      this.angularGridProjectEmployee?.resizerService?.resizeGrid();
      this.angularGridProjectEmployee?.slickGrid?.invalidate();
      this.angularGridProjectEmployee?.slickGrid?.render();
    }, 200);
  }

  handleRowSelectionProjects(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridDataProjects.getDataItem(args.rows[0]);
      if (selectedRow) {
        this.projectId = selectedRow.ID;
        // Nếu panel chưa mở, mở nó trước
        if (!this.showProjectDetail) {
          this.toggleProjectDetail();
        } else if (this.detailGridsReady && this.projectId > 0) {
          // Nếu panel đã mở và grids đã sẵn sàng, load data ngay
          this.getProjectWorkReports();
          this.getProjectTypeLinks();
        }
      }
    }
  }

  handleRowSelectionProjectEmployee(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridDataProjectEmployee.getDataItem(args.rows[0]);
      if (selectedRow) {
        this.projectId = selectedRow.ID;
        // Nếu panel chưa mở, mở nó trước
        if (!this.showProjectDetail) {
          this.toggleProjectDetail();
        } else if (this.detailGridsReady && this.projectId > 0) {
          // Nếu panel đã mở và grids đã sẵn sàng, load data ngay
          this.getProjectWorkReports();
          this.getProjectTypeLinks();
        }
      }
    }
  }

  onCellClickedProjects(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.projectId = item.ID;
      // Nếu panel chưa mở, mở nó trước
      if (!this.showProjectDetail) {
        this.toggleProjectDetail();
      } else if (this.detailGridsReady && this.projectId > 0) {
        // Nếu panel đã mở và grids đã sẵn sàng, load data ngay
      this.getProjectWorkReports();
      this.getProjectTypeLinks();
      }
    }
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
      keyword: this.keyword?.trim() ?? '',
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
    // Date changed - có thể thêm logic nếu cần
  }


  // Load dữ liệu từ API mới
  loadSummaryProjectJoin(): void {
    // Chuyển đổi date đúng format
    let dateStartValue: string;
    let dateEndValue: string;

    try {
      // Xử lý dateStart
      if (this.dateStart instanceof Date) {
        dateStartValue = DateTime.fromJSDate(this.dateStart)
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          .toISO() || '';
      } else if (typeof this.dateStart === 'string') {
        const dtStart = DateTime.fromISO(this.dateStart);
        dateStartValue = dtStart.isValid
          ? dtStart.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || ''
          : '';
      } else {
        dateStartValue = DateTime.local()
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          .toISO() || '';
      }

      // Xử lý dateEnd
      if (this.dateEnd instanceof Date) {
        dateEndValue = DateTime.fromJSDate(this.dateEnd)
          .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
          .toISO() || '';
      } else if (typeof this.dateEnd === 'string') {
        const dtEnd = DateTime.fromISO(this.dateEnd);
        dateEndValue = dtEnd.isValid
          ? dtEnd.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || ''
          : '';
      } else {
        dateEndValue = DateTime.local()
          .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
          .toISO() || '';
      }

      // Tạo payload với structure { request: { ... } }
      const payload = {
          employeeID: this.technicalId || 0,
          dateStart: dateStartValue,
          dateEnd: dateEndValue,
      };

      this.summaryProjectJoinService.getSummaryProjectJoin(payload).subscribe({
        next: (response: any) => {
          if (response && response.status === 1 && response.data) {
            // rs cho bảng trái, rs2 cho bảng phải
            const rs = response.data.rs || [];
            const rs2 = response.data.rs2 || [];
            
            // Set data cho SlickGrid
            this.datasetProjects = rs.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index
            }));
            
            this.datasetProjectEmployee = rs2.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index
            }));
            
            // Refresh grids sau khi load data
            this.refreshMainGrids();
          }
        },
        error: (error: any) => {
          console.error('Lỗi khi load dữ liệu:', error);
          const errorMsg = error?.error?.message || error?.message || 'Không thể tải dữ liệu';
          this.notification.error('Lỗi', errorMsg);
        },
      });
    } catch (error: any) {
      console.error('Lỗi khi xử lý ngày tháng:', error);
      this.notification.error('Lỗi', 'Ngày tháng không hợp lệ');
    }
  }

  // Refresh và resize các grid chính sau khi load data
  refreshMainGrids(): void {
    setTimeout(() => {
      // Refresh main grids
      if (this.angularGridProjects?.dataView) {
        this.angularGridProjects.dataView.refresh();
        this.angularGridProjects.slickGrid?.invalidate();
        this.angularGridProjects.slickGrid?.render();
        this.angularGridProjects.resizerService?.resizeGrid();
      }
      
      if (this.angularGridProjectEmployee?.dataView) {
        this.angularGridProjectEmployee.dataView.refresh();
        this.angularGridProjectEmployee.slickGrid?.invalidate();
        this.angularGridProjectEmployee.slickGrid?.render();
        this.angularGridProjectEmployee.resizerService?.resizeGrid();
      }
      
      // Refresh detail grids if showing
      if (this.showProjectDetail) {
        if (this.angularGridProjectWorkReports?.dataView) {
          this.angularGridProjectWorkReports.dataView.refresh();
          this.angularGridProjectWorkReports.slickGrid?.invalidate();
          this.angularGridProjectWorkReports.slickGrid?.render();
          this.angularGridProjectWorkReports.resizerService?.resizeGrid();
        }
        
        if (this.angularGridProjectTypeLinks?.dataView) {
          this.angularGridProjectTypeLinks.dataView.refresh();
          this.angularGridProjectTypeLinks.slickGrid?.invalidate();
          this.angularGridProjectTypeLinks.slickGrid?.render();
          this.angularGridProjectTypeLinks.resizerService?.resizeGrid();
        }
      }
      
      // Force trigger window resize để đảm bảo SlickGrid tính toán lại
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  // Toggle hiển thị tab thông tin dự án
  toggleProjectDetail(): void {
    this.showProjectDetail = !this.showProjectDetail;
    
    if (this.showProjectDetail) {
      // Khi mở panel: đợi panel có kích thước, render grids, load data
      setTimeout(() => {
        this.detailGridsReady = true;
        this.cdr.detectChanges();
        
        // Sau khi render, resize grids và load data
        setTimeout(() => {
          if (this.projectId > 0) {
            this.getProjectWorkReports();
            this.getProjectTypeLinks();
          }
          this.resizeAllGrids();
        }, 200); // Đợi grids render và có kích thước
      }, 300); // Đợi panel animation hoàn thành
    } else {
      // Khi đóng panel: ẩn grids để tránh render lỗi
      this.detailGridsReady = false;
    }
    
    // Resize grids chính
    setTimeout(() => {
      this.resizeAllGrids();
      window.dispatchEvent(new Event('resize'));
    }, 150);
  }

  // Resize tất cả SlickGrids
  resizeAllGrids(): void {
    setTimeout(() => {
      // Resize grids chính
      if (this.angularGridProjects?.resizerService) {
        this.angularGridProjects.resizerService.resizeGrid();
        this.angularGridProjects.slickGrid?.invalidate();
        this.angularGridProjects.slickGrid?.render();
      }
      
      if (this.angularGridProjectEmployee?.resizerService) {
        this.angularGridProjectEmployee.resizerService.resizeGrid();
        this.angularGridProjectEmployee.slickGrid?.invalidate();
        this.angularGridProjectEmployee.slickGrid?.render();
      }
      
      // Resize detail grids nếu đang hiển thị
      if (this.showProjectDetail) {
        if (this.angularGridProjectWorkReports?.resizerService) {
          this.angularGridProjectWorkReports.resizerService.resizeGrid();
          this.angularGridProjectWorkReports.slickGrid?.invalidate();
          this.angularGridProjectWorkReports.slickGrid?.render();
        }
        
        if (this.angularGridProjectTypeLinks?.resizerService) {
          this.angularGridProjectTypeLinks.resizerService.resizeGrid();
          this.angularGridProjectTypeLinks.slickGrid?.invalidate();
          this.angularGridProjectTypeLinks.slickGrid?.render();
        }
      }
    }, 100);
  }
  //#endregion

  //#region xử lý bảng danh sách hạng mục công việc với SlickGrid
  initGridProjectWorkReports() {
    // Format date helper
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        let dateValue = DateTime.fromISO(value);
        if (!dateValue.isValid) {
          dateValue = DateTime.fromFormat(value, 'yyyy-MM-dd');
        }
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
                return value;
      }
    };

    this.columnDefinitionsProjectWorkReports = [
      { id: 'STT', name: 'STT', field: 'STT', type: 'number', width: 50, sortable: true, cssClass: 'text-center' },
      { id: 'Code', name: 'Mã', field: 'Code', type: 'string', width: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'StatusText', name: 'Trạng thái', field: 'StatusText', type: 'string', width: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProjectTypeName', name: 'Kiểu hạng mục', field: 'ProjectTypeName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'FullName', name: 'Người phụ trách', field: 'FullName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PercentItem', name: '%', field: 'PercentItem', type: 'number', width: 50, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'Mission', name: 'Công việc', field: 'Mission', type: 'string', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'EmployeeRequest', name: 'Người giao việc', field: 'EmployeeRequest', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'PlanStartDate', name: 'Ngày bắt đầu (dự kiến)', field: 'PlanStartDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'TotalDayPlan', name: 'Số ngày (dự kiến)', field: 'TotalDayPlan', type: 'number', width: 80, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'PlanEndDate', name: 'Ngày kết thúc (dự kiến)', field: 'PlanEndDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualStartDate', name: 'Ngày bắt đầu (thực tế)', field: 'ActualStartDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'ActualEndDate', name: 'Ngày kết thúc (thực tế)', field: 'ActualEndDate', type: 'date', width: 120, sortable: true, filterable: true, formatter: formatDate, filter: { model: Filters['compoundDate'] }, cssClass: 'text-center' },
      { id: 'PercentageActual', name: '% (thực tế)', field: 'PercentageActual', type: 'number', width: 50, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-right' },
      { id: 'Note', name: 'Ghi chú', field: 'Note', type: 'string', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'ProjectEmployeeName', name: 'Người tham gia', field: 'ProjectEmployeeName', type: 'string', width: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
    ];

    this.gridOptionsProjectWorkReports = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-project-work-reports',
        calculateAvailableSizeBy: 'container'
      },
      gridWidth: '100%',
      gridHeight: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  angularGridProjectWorkReportsReady(angularGrid: AngularGridInstance) {
    this.angularGridProjectWorkReports = angularGrid;
    this.gridDataProjectWorkReports = angularGrid?.slickGrid || {};
    
    // Apply row colors after grid is ready
    if (this.gridDataProjectWorkReports) {
      this.gridDataProjectWorkReports.onViewportChanged.subscribe(() => {
        this.applyRowColorsProjectWorkReports();
      });
    }
    
    // Đợi grid render xong rồi mới resize
    setTimeout(() => {
      this.angularGridProjectWorkReports?.resizerService?.resizeGrid();
      this.angularGridProjectWorkReports?.slickGrid?.invalidate();
      this.angularGridProjectWorkReports?.slickGrid?.render();
    }, 200);
  }

  applyRowColorsProjectWorkReports() {
    if (!this.gridDataProjectWorkReports) return;
    
    const data = this.gridDataProjectWorkReports.getData();
    data.forEach((item: any, index: number) => {
      const itemLate = parseInt(item['ItemLateActual'] || '0');
      const totalDayExpridSoon = parseInt(item['TotalDayExpridSoon'] || '0');
      const dateEndActual = item['ActualEndDate'] 
        ? DateTime.fromISO(item['ActualEndDate']).isValid 
          ? DateTime.fromISO(item['ActualEndDate']).toFormat('dd/MM/yyyy')
          : null
          : null;

      const rowNode = this.gridDataProjectWorkReports.getRowNode(index);
      if (rowNode) {
        if (itemLate == 1) {
          rowNode.style.backgroundColor = 'Orange';
          rowNode.style.color = 'white';
        } else if (itemLate == 2) {
          rowNode.style.backgroundColor = 'Red';
          rowNode.style.color = 'white';
        } else if (totalDayExpridSoon <= 3 && !dateEndActual) {
          rowNode.style.backgroundColor = 'LightYellow';
        }
      }
    });
  }

  getProjectWorkReports() {
    if (!this.projectId || this.projectId <= 0) {
      this.datasetProjectWorkReports = [];
      return;
    }

    // Chỉ load data nếu grid đã sẵn sàng
    if (!this.detailGridsReady || !this.angularGridProjectWorkReports) {
      return;
    }

    const token = localStorage.getItem('token');
    this.http.get<any>(this.projectService.getProjectItems(), {
      params: { id: this.projectId },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).subscribe({
      next: (response: any) => {
        this.datasetProjectWorkReports = (response.data || []).map((item: any, index: number) => ({
          ...item,
          id: item.ID || index
        }));
        
        // Refresh DataView và invalidate grid (chỉ khi grid đã được khởi tạo)
        setTimeout(() => {
          if (this.angularGridProjectWorkReports?.slickGrid) {
            this.angularGridProjectWorkReports.dataView?.refresh();
            this.angularGridProjectWorkReports.slickGrid.invalidate();
            this.angularGridProjectWorkReports.slickGrid.render();
            this.angularGridProjectWorkReports.resizerService?.resizeGrid();
            this.applyRowColorsProjectWorkReports();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.datasetProjectWorkReports = [];
      },
    });
  }
  //#endregion

  //#region xử lý bảng kiểu dự án với SlickGrid
  initGridProjectTypeLinks() {
    // Checkbox formatter
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value === true || value === 'true' || value === 1 || value === '1';
      return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
    };

    this.columnDefinitionsProjectTypeLinks = [
      { id: 'Selected', name: 'Chọn', field: 'Selected', type: 'boolean', width: 60, sortable: true, formatter: checkboxFormatter, cssClass: 'text-center' },
      { id: 'ProjectTypeName', name: 'Kiểu dự án', field: 'ProjectTypeName', type: 'string', width: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'FullName', name: 'Leader', field: 'FullName', type: 'string', width: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, hidden: this.isHide },
    ];

    this.gridOptionsProjectTypeLinks = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-project-type-links',
        calculateAvailableSizeBy: 'container'
      },
      gridWidth: '100%',
      gridHeight: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      multiColumnSort: false, // Tree Data không hỗ trợ multi-column sort
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'ProjectTypeName',
        parentPropName: 'ParentID',
        identifierPropName: 'ID',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        exportIndentMarginLeft: 4,
      },
    };
  }

  angularGridProjectTypeLinksReady(angularGrid: AngularGridInstance) {
    this.angularGridProjectTypeLinks = angularGrid;
    this.gridDataProjectTypeLinks = angularGrid?.slickGrid || {};
    
    // Đợi grid render xong rồi mới resize
    setTimeout(() => {
      this.angularGridProjectTypeLinks?.resizerService?.resizeGrid();
      this.angularGridProjectTypeLinks?.slickGrid?.invalidate();
      this.angularGridProjectTypeLinks?.slickGrid?.render();
    }, 200);
  }

  getProjectTypeLinks() {
    if (!this.projectId || this.projectId <= 0) {
      this.datasetProjectTypeLinks = [];
      return;
    }

    // Chỉ load data nếu grid đã sẵn sàng
    if (!this.detailGridsReady || !this.angularGridProjectTypeLinks) {
      return;
    }

    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        // Convert flat data to tree structure
        const treeData = this.projectService.setDataTree(response.data, 'ID');
        this.datasetProjectTypeLinks = (treeData || []).map((item: any, index: number) => ({
          ...item,
          id: item.ID || index
        }));
        
        // Refresh DataView và invalidate grid (chỉ khi grid đã được khởi tạo)
        setTimeout(() => {
          if (this.angularGridProjectTypeLinks?.slickGrid) {
            this.angularGridProjectTypeLinks.dataView?.refresh();
            this.angularGridProjectTypeLinks.slickGrid.invalidate();
            this.angularGridProjectTypeLinks.slickGrid.render();
            this.angularGridProjectTypeLinks.resizerService?.resizeGrid();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.datasetProjectTypeLinks = [];
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
        console.log('Lỗi khi lấy project types', err);
        // Vẫn search ngay cả khi có lỗi
        setTimeout(() => {
          this.searchProjects();
        }, 100);
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
    // Sử dụng API mới
    this.loadSummaryProjectJoin();
  }
  onSearchChange(value: string) {
    this.searchProjects();
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
    if (!this.angularGridProjects || !this.angularGridProjects.dataView) return;

    // Lấy dữ liệu đã được filter từ grid (dataView)
    const selectedData: any[] = [];
    const dataLength = this.angularGridProjects.dataView.getLength();
    for (let i = 0; i < dataLength; i++) {
      const item = this.angularGridProjects.dataView.getItem(i);
      if (item) {
        selectedData.push(item);
      }
    }

    if (!selectedData || selectedData.length === 0) {
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

    // Lấy columns từ columnDefinitions, bỏ qua các cột hidden và excludeFromExport
    const columns = this.columnDefinitionsProjects.filter(
      (col: Column) =>
        col.excludeFromExport !== true && col.hidden !== true && col.field && col.field.trim() !== ''
    );

    const headers = columns.map((col: Column) => col.name || col.field);
    worksheet.addRow(headers);

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: Column) => {
        const field = col.field!;
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
          cell.numFmt = 'dd/mm/yyyy';
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

    // Thêm bộ lọc cho toàn bộ cột
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
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
    if (!this.angularGridProjects || !this.angularGridProjects.gridService) {
      this.notification.error('', this.createdText('Vui lòng chọn dự án!'), {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const selectedRows = this.angularGridProjects.gridService.getSelectedRows();
    const selectedIDs = selectedRows.map((index: number) => {
      const item = this.gridDataProjects.getDataItem(index);
      return item.ID;
    });

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

  //#region Window resize handler
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // Debounce resize để tránh gọi quá nhiều lần
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.resizeAllGrids();
    }, 150);
  }
  //#endregion

  //#region đóng panel
  closePanel() {
    this.sizeTbDetail = '0';
  }

  //#region Load sample data for testing
  loadSampleData(): void {
    // Sample data cho bảng Projects
    this.datasetProjects = [
      {
        id: 1,
        ID: 1,
        ProjectStatusName: 'Đang thực hiện',
        CreatedDate: '2024-01-15T00:00:00',
        PriotityText: 1,
        PersonalPriotity: 2,
        ProjectCode: 'PRJ001',
        ProjectProcessType: 'Phát triển',
        UserMission: 'Phát triển module quản lý người dùng',
        EndUserName: 'Công ty ABC',
        PO: 'PO001',
        PODate: '2024-01-10T00:00:00',
        FullNameSale: 'Nguyễn Văn A',
        FullNameTech: 'Trần Văn B',
        FullNamePM: 'Lê Thị C',
        BussinessField: 'Công nghệ thông tin',
        CurrentSituation: 'Đang phát triển 70%',
        CustomerName: 'Công ty ABC',
        PlanDateStart: '2024-01-01T00:00:00',
        PlanDateEndSummary: '2024-03-31T00:00:00',
        ActualDateStart: '2024-01-05T00:00:00',
        ActualDateEnd: null,
        CreatedBy: 'Admin',
        UpdatedBy: 'Admin'
      },
      {
        id: 2,
        ID: 2,
        ProjectStatusName: 'Hoàn thành',
        CreatedDate: '2024-02-01T00:00:00',
        PriotityText: 2,
        PersonalPriotity: 1,
        ProjectCode: 'PRJ002',
        ProjectProcessType: 'Bảo trì',
        UserMission: 'Bảo trì hệ thống báo cáo',
        EndUserName: 'Công ty XYZ',
        PO: 'PO002',
        PODate: '2024-01-25T00:00:00',
        FullNameSale: 'Phạm Văn D',
        FullNameTech: 'Hoàng Thị E',
        FullNamePM: 'Vũ Văn F',
        BussinessField: 'Tài chính',
        CurrentSituation: 'Hoàn thành 100%',
        CustomerName: 'Công ty XYZ',
        PlanDateStart: '2024-02-01T00:00:00',
        PlanDateEndSummary: '2024-02-28T00:00:00',
        ActualDateStart: '2024-02-01T00:00:00',
        ActualDateEnd: '2024-02-25T00:00:00',
        CreatedBy: 'Admin',
        UpdatedBy: 'Admin'
      }
    ];

    // Sample data cho bảng Project Employee
    this.datasetProjectEmployee = [
      {
        id: 1,
        ID: 1,
        ProjectStatusName: 'Đã tham gia',
        CreatedDate: '2023-12-01T00:00:00',
        PriotityText: 1,
        PersonalPriotity: 1,
        ProjectCode: 'PRJ_OLD001',
        ProjectProcessType: 'Hoàn thành',
        UserMission: 'Phát triển website bán hàng',
        EndUserName: 'Công ty DEF',
        PO: 'PO_OLD001',
        PODate: '2023-11-20T00:00:00',
        FullNameSale: 'Nguyễn Thị G',
        FullNameTech: 'Trần Văn H',
        FullNamePM: 'Lê Văn I',
        BussinessField: 'Thương mại điện tử',
        CurrentSituation: 'Đã hoàn thành',
        CustomerName: 'Công ty DEF',
        PlanDateStart: '2023-12-01T00:00:00',
        PlanDateEndSummary: '2024-01-31T00:00:00',
        ActualDateStart: '2023-12-01T00:00:00',
        ActualDateEnd: '2024-01-28T00:00:00',
        CreatedBy: 'Admin',
        UpdatedBy: 'Admin'
      }
    ];

    // Sample data cho Work Reports
    this.datasetProjectWorkReports = [
      {
        id: 1,
        STT: 1,
        Code: 'WR001',
        StatusText: 'Đang thực hiện',
        ProjectTypeName: 'Phát triển',
        FullName: 'Nguyễn Văn A',
        PercentItem: 70,
        Mission: 'Thiết kế giao diện người dùng',
        EmployeeRequest: 'Trần Văn B',
        PlanStartDate: '2024-01-15T00:00:00',
        TotalDayPlan: 10,
        PlanEndDate: '2024-01-25T00:00:00',
        ActualStartDate: '2024-01-15T00:00:00',
        ActualEndDate: null,
        PercentageActual: 70,
        Note: 'Đang thực hiện theo kế hoạch',
        ProjectEmployeeName: 'Nguyễn Văn A, Trần Văn B'
      }
    ];

    // Sample data cho Project Type Links
    this.datasetProjectTypeLinks = [
      {
        id: 1,
        ID: 1,
        Selected: true,
        ProjectTypeName: 'Phát triển Web',
        FullName: 'Trần Văn B',
        ParentID: null,
        treeLevel: 0
      },
      {
        id: 2,
        ID: 2,
        Selected: false,
        ProjectTypeName: 'Frontend',
        FullName: 'Nguyễn Văn A',
        ParentID: 1,
        treeLevel: 1
      },
      {
        id: 3,
        ID: 3,
        Selected: true,
        ProjectTypeName: 'Backend',
        FullName: 'Lê Thị C',
        ParentID: 1,
        treeLevel: 1
      }
    ];

    // Refresh tất cả grids
    setTimeout(() => {
      this.refreshMainGrids();
      console.log('Sample data loaded:', {
        projects: this.datasetProjects.length,
        employee: this.datasetProjectEmployee.length,
        workReports: this.datasetProjectWorkReports.length,
        typeLinks: this.datasetProjectTypeLinks.length
      });
    }, 100);
  }
  //#endregion
  //#endregion
}
