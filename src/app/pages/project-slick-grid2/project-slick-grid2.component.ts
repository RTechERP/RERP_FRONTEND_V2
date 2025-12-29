import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  HostListener
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
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
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ProjectDetailComponent } from '../project/project-detail/project-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectChangeComponent } from '../project/project-change/project-change.component';
import { ProjectStatusComponent } from '../project/project-status/project-status.component';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectEmployeeComponent } from '../project/project-employee/project-employee.component';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project/project-service/project.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../auth/auth.service';
import { ProjectRequestComponent } from '../project-request/project-request.component';
import { ProjectWorkerSyntheticComponent } from '../project/project-department-summary/project-department-summary-form/project-worker-synthetic/project-worker-synthetic.component';
import { ProjectListWorkReportComponent } from '../project/project-list-work-report/project-list-work-report.component';
import { WorkItemComponent } from '../project/work-item/work-item.component';
import { ProjectWorkerComponent } from '../project/project-department-summary/project-department-summary-form/project-woker/project-worker.component';
import { ProjectPartListComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { ProjectCurrentSituationComponent } from '../project/project-current-situation/project-current-situation.component';
import { ProjectPartlistProblemComponent } from '../project/project-partlist-problem/project-partlist-problem.component';
import { ProjectHistoryProblemComponent } from '../project/project-history-problem/project-history-problem.component';
import { ProjectTypeLinkDetailComponent } from '../project/project-type-link-detail/project-type-link-detail.component';
import { PermissionService } from '../../services/permission.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';
import { ProjectPartListSlickGridComponent } from '../project-part-list-slick-grid/project-part-list-slick-grid.component';

import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-project-slick-grid2',
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
    AngularSlickgridModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzDropDownModule,
    CommonModule,
    HasPermissionDirective,
    Menubar,
  ],
  templateUrl: './project-slick-grid2.component.html',
  styleUrls: ['./project-slick-grid2.component.css']
})
export class ProjectSlickGrid2Component implements OnInit, AfterViewInit, OnDestroy {
  private searchSubject = new Subject<string>();
  showSearchBar: boolean = false;
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];
  isLoading: boolean = false;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('statusDateModalContent', { static: false })
  statusDateModalContent!: any;

  selected = '';
  options = [
    { label: 'Mới', value: 'new' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Hoàn thành', value: 'done' },
  ];

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {
    this.searchSubject
      .pipe(debounceTime(1200))
      .subscribe(() => {
        this.searchProjects();
      });
  }

  //#region Khai báo biến
  isHide: boolean = false;
  sizeSearch: string = '0';
  sizeTbMaster: string = '100%';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  customers: any[] = [];
  projectStatuses: any[] = [];
  projecStatuses: any[] = [];

  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridWorkReport!: AngularGridInstance;
  angularGridTypeLink!: AngularGridInstance;
  gridData: any;
  gridWorkReportData: any;
  gridTypeLinkData: any;

  // Column definitions
  columnDefinitions: Column[] = [];
  columnDefinitionsWorkReport: Column[] = [];
  columnDefinitionsTypeLink: Column[] = [];

  // Grid options
  gridOptions: GridOption = {};
  gridOptionsWorkReport: GridOption = {};
  gridOptionsTypeLink: GridOption = {};

  // Datasets
  dataset: any[] = [];
  datasetWorkReport: any[] = [];
  datasetTypeLink: any[] = [];

  selectedRow: any = '';
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  activeTab: string = 'workreport';
  detailGridsReady: boolean = false; // Chỉ render detail grids khi panel đã sẵn sàng
  userId: any;
  pmId: any;
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';
  projectId: any = 0;
  projectCode: any = '';
  currentUser: any = null;
  savedPage: number = 1;
  selectedStatusDate: Date | null = null;
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  //#endregion

  //#region Lifecycle hooks
  ngOnInit(): void {
    this.updateResponsiveState();
    this.initMenuBar();
    this.isLoading = true;

    this.initGridProjects();
    this.initGridWorkReports();
    this.initGridTypeLinks();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (Number(id) == 2) {
        this.isHide = false;
        this.projectTypeIds = [2];
      } else {
        this.isHide = true;
        this.projectTypeIds = [];
      }
    });
  }

  ngAfterViewInit(): void {
    this.getUsers();
    this.getPms();
    this.getBusinessFields();
    this.getCustomers();
    this.getProjectTypes();
    this.getProjectStatus();
    this.searchProjects();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
  //#endregion

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateResponsiveState();
  }

  private updateResponsiveState(): void {
    const nextIsMobile = window.innerWidth <= 768;
    const modeChanged = this.isMobile !== nextIsMobile;
    this.isMobile = nextIsMobile;

    // Only apply default when switching between mobile/desktop.
    // Otherwise user toggle should be preserved.
    if (modeChanged) {
      this.showSearchBar = !this.isMobile;
    }
  }

  private initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Tìm kiếm',
        icon: PrimeIcons.SEARCH,
        command: () => this.ToggleSearchPanelNew(),
      },
      {
        label: 'Thêm',
        icon: PrimeIcons.PLUS,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.updateProject(0),
      },
      {
        label: 'Sửa',
        icon: PrimeIcons.PENCIL,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.updateProject(1),
      },
      {
        label: 'Xóa',
        icon: PrimeIcons.TRASH,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.deletedProjects(),
      },
      {
        label: 'Cây thư mục',
        icon: PrimeIcons.SITEMAP,
        command: () => this.openFolder(),
      },
      {
        label: 'Ds báo cáo công việc',
        icon: PrimeIcons.LIST,
        command: () => this.openProjectWorkReportModal(),
      },
      {
        label: 'Hạng mục công việc',
        icon: PrimeIcons.BRIEFCASE,
        command: () => this.openWorkItemModal(),
      },
      {
        label: 'Nhân công dự án',
        icon: PrimeIcons.USERS,
        command: () => this.openProjectWorkerModal(),
      },
      {
        label: 'Danh mục vật tư',
        icon: PrimeIcons.BOX,
        command: () => this.openProjectPartListModal(),
      },
      {
        label: 'Xuất Excel',
        icon: PrimeIcons.FILE_EXCEL,
        command: () => this.exportExcel(),
      },
    ];
  }

  //#region SlickGrid initialization
  initGridProjects() {
    // Đảm bảo column definitions không có null values
    this.columnDefinitions = [
      { id: 'ID', name: 'ID', field: 'ID', hidden: true },
      {
        id: 'ProjectStatusName',
        name: 'Trạng thái',
        field: 'ProjectStatusName',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectStatusName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'EndUserName',
        name: 'End User',
        field: 'EndUserName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.EndUserName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullNameSale',
        name: 'Người phụ trách(sale)',
        field: 'FullNameSale',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameSale}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullNameTech',
        name: 'Người phụ trách(kỹ thuật)',
        field: 'FullNameTech',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameTech}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullNamePM',
        name: 'PM',
        field: 'FullNamePM',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropWidthByTextSize: true }
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNamePM}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'PriotityText',
        name: 'Mức ưu tiên',
        field: 'PriotityText',
        width: 70,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'PersonalPriotity',
        name: 'Mức độ ưu tiên cá nhân',
        field: 'PersonalPriotity',
        width: 90,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'BussinessField',
        name: 'Lĩnh vực dự án',
        field: 'BussinessField',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'CurrentSituation',
        name: 'Hiện trạng',
        field: 'CurrentSituation',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        cssClass: 'cell-wrap'
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.CustomerName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'PO',
        name: 'PO',
        field: 'PO',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center'
      },
      {
        id: 'PODate',
        name: 'Ngày PO',
        field: 'PODate',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'PlanDateStart',
        name: 'Dự kiến bắt đầu',
        field: 'PlanDateStart',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'PlanDateEnd',
        name: 'Dự kiến kết thúc',
        field: 'PlanDateEnd',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'ActualDateStart',
        name: 'Thực tế bắt đầu',
        field: 'ActualDateStart',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'ActualDateEnd',
        name: 'Thực tế kết thúc',
        field: 'ActualDateEnd',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'UpdatedDate',
        name: 'Ngày cập nhật',
        field: 'UpdatedDate',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'CreatedBy',
        name: 'Người tạo',
        field: 'CreatedBy',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'UpdatedBy',
        name: 'Người sửa',
        field: 'UpdatedBy',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { 
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
    ].filter(col => col !== null && col !== undefined) as Column[]; // Filter out any null/undefined columns

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-projects',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 3,
      rowHeight: 33, // Base height - sẽ tự động tăng theo nội dung qua CSS
          };
  }

  initGridWorkReports() {
    
    this.columnDefinitionsWorkReport = [
      { id: 'ID', name: 'ID', field: 'ID', hidden: true },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 70,
        sortable: true,
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'Code',
        name: 'Mã',
        field: 'Code',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Code}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.StatusText}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProjectTypeName',
        name: 'Kiểu hạng mục',
        field: 'ProjectTypeName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'FullName',
        name: 'Người phụ trách',
        field: 'FullName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'PercentItem',
        name: '%',
        field: 'PercentItem',
        width: 50,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'Mission',
        name: 'Công việc',
        field: 'Mission',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Mission}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'EmployeeRequest',
        name: 'Người giao việc',
        field: 'EmployeeRequest',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'PlanStartDate',
        name: 'Dự kiến bắt đầu',
        field: 'PlanStartDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'TotalDayPlan',
        name: 'Số ngày',
        field: 'TotalDayPlan',
        width: 80,
        sortable: true,
        cssClass: 'text-end'
      },
      {
        id: 'PlanEndDate',
        name: 'Dự kiến kết thúc',
        field: 'PlanEndDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'ActualStartDate',
        name: 'Thực tế bắt đầu',
        field: 'ActualStartDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'ActualEndDate',
        name: 'Thực tế kết thúc',
        field: 'ActualEndDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'PercentageActual',
        name: '% Thực tế',
        field: 'PercentageActual',
        width: 80,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        cssClass: 'cell-wrap'
      },
      {
        id: 'ProjectEmployeeName',
        name: 'Người tham gia',
        field: 'ProjectEmployeeName',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        cssClass: 'cell-wrap'
      },
    ].filter(col => col !== null && col !== undefined) as Column[]; // Filter out any null/undefined columns

    this.gridOptionsWorkReport = {
      autoResize: {
        container: '#grid-container-workreport',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      forceFitColumns: false,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowHeight: 33 // Base height - sẽ tự động tăng theo nội dung qua CSS
    };
  }

  initGridTypeLinks() {
    // Copy toàn bộ logic tree từ menu-app.component.ts
    this.columnDefinitionsTypeLink = [
      { id: 'ID', name: 'ID', field: 'ID', hidden: true },
      {
        id: 'Selected',
        name: 'Chọn',
        field: 'Selected',
        width: 60,
        sortable: true,
        filterable: true,
        // Formatter để hiển thị checkbox dựa trên giá trị Selected từ API
        // Kiểm tra nhiều trường hợp: true, 'true', 1, '1'
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'ProjectTypeName',
        name: 'Kiểu dự án',
        field: 'ProjectTypeName',
        width: 200,
        sortable: true,
        filterable: true,
        formatter: Formatters.tree, // Sử dụng Formatters.tree giống menu-app
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'FullName',
        name: 'Leader',
        field: 'FullName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        hidden: !this.isHide
      },
    ].filter(col => col !== null && col !== undefined) as Column[]; // Filter out any null/undefined columns

    // Copy toàn bộ gridOptions từ menu-app (giữ nguyên các options khác)
    this.gridOptionsTypeLink = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-typelink',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container', // Thêm resizeDetection giống menu-app
      },
      gridWidth: '100%', // Thêm gridWidth giống menu-app
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false // Giống menu-app: False (Multiple Selections)
      },
      enableTreeData: true, // Bật tree data
      treeDataOptions: {
        columnId: 'ProjectTypeName', // the column where you will have the Tree with collapse/expand icons
        parentPropName: 'parentId', // the parent/child key relation in your dataset
        levelPropName: 'treeLevel', // optionally, you can define the tree level property name, it nothing is provided it will use "__treeLevel"
        indentMarginLeft: 25, // optionally provide the indent spacer width in pixel, for example if you provide 10 and your tree level is 2 then it will have 20px of indentation
        exportIndentMarginLeft: 4, // similar to `indentMarginLeft` but represent a space instead of pixels for the Export CSV/Excel
      },
      multiColumnSort: false, // Tree data không hỗ trợ multi-column sort
    };
  }
  //#endregion

  //#region SlickGrid event handlers
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};
    
    // Tính và set row height sau khi data được load
    if (angularGrid?.dataView) {
      angularGrid.dataView.onRowsChanged.subscribe(() => {
        this.adjustRowHeights();
      });
    }
  }

  // Điều chỉnh row height dựa trên nội dung
  adjustRowHeights() {
    if (!this.angularGrid?.slickGrid || !this.angularGrid?.dataView) return;
    
    try {
      const data = this.angularGrid.dataView.getItems();
      if (!Array.isArray(data)) return;
      
      const slickGrid = this.angularGrid.slickGrid;
      data.forEach((item: any, index: number) => {
        if (!item) return;
        const height = this.calculateRowHeight(item);
        // Lấy row element từ DOM thông qua SlickGrid
        const rowElement = slickGrid?.getCellNode(index, 0)?.parentElement as HTMLElement;
        if (rowElement && rowElement.classList.contains('slick-row') && height > 80) {
          rowElement.style.height = height + 'px';
        }
      });
    } catch (error) {
      console.error('Error adjusting row heights:', error);
    }
  }

  // Tính row height dựa trên nội dung
  calculateRowHeight(item: any): number {
    if (!item) return 80;
    
    let maxLines = 1;
    const baseLineHeight = 18; // Chiều cao mỗi dòng text
    const padding = 8; // Padding top + bottom
    
    // Kiểm tra các cột có class cell-wrap
    const wrapColumns = ['ProjectName', 'EndUserName', 'CurrentSituation'];
    
    wrapColumns.forEach(field => {
      const value = item[field];
      if (value && typeof value === 'string') {
        const column = this.columnDefinitions?.find(col => col && col.field === field);
        if (!column) return;
        const columnWidth = column.width || 200;
        const charsPerLine = Math.floor(columnWidth / 7);
        const lines = Math.ceil(value.length / charsPerLine);
        maxLines = Math.max(maxLines, lines);
      }
    });
    
    return Math.max(80, maxLines * baseLineHeight + padding);
  }

  angularGridWorkReportReady(angularGrid: AngularGridInstance) {
    this.angularGridWorkReport = angularGrid;
    
    // Áp dụng tô màu dòng bằng getItemMetadata (giống payment-order)
    angularGrid.dataView.getItemMetadata = this.rowStyleWorkReport(angularGrid.dataView.getItemMetadata, angularGrid);
    
    // Tính và set row height sau khi data được load
    if (angularGrid?.dataView) {
      angularGrid.dataView.onRowsChanged.subscribe(() => {
        this.adjustWorkReportRowHeights();
      });
    }
  }

  // Điều chỉnh row height cho work report
  adjustWorkReportRowHeights() {
    if (!this.angularGridWorkReport?.slickGrid || !this.angularGridWorkReport?.dataView) return;
    
    try {
      const data = this.angularGridWorkReport.dataView.getItems();
      if (!Array.isArray(data)) return;
      
      const slickGrid = this.angularGridWorkReport.slickGrid;
      data.forEach((item: any, index: number) => {
        if (!item) return;
        const height = this.calculateWorkReportRowHeight(item);
        // Lấy row element từ DOM thông qua SlickGrid
        const rowElement = slickGrid.getCellNode(index, 0)?.parentElement as HTMLElement;
        if (rowElement && rowElement.classList.contains('slick-row') && height > 80) {
          rowElement.style.height = height + 'px';
        }
      });
    } catch (error) {
      console.error('Error adjusting work report row heights:', error);
    }
  }

  // Tính row height dựa trên nội dung cho work report
  calculateWorkReportRowHeight(item: any): number {
    if (!item) return 80;
    
    let maxLines = 1;
    const baseLineHeight = 18;
    const padding = 8;
    
    const wrapColumns = ['Mission', 'Note', 'ProjectEmployeeName'];
    
    wrapColumns.forEach(field => {
      const value = item[field];
      if (value && typeof value === 'string') {
        const column = this.columnDefinitionsWorkReport?.find(col => col && col.field === field);
        if (!column) return;
        const columnWidth = column.width || 300;
        const charsPerLine = Math.floor(columnWidth / 7);
        const lines = Math.ceil(value.length / charsPerLine);
        maxLines = Math.max(maxLines, lines);
      }
    });
    
    return Math.max(80, maxLines * baseLineHeight + padding);
  }

  // Tô màu dòng cho work report (giống payment-order)
  rowStyleWorkReport(previousItemMetadata: any, angularGrid: AngularGridInstance) {
    return (rowNumber: number) => {
      const item = angularGrid.dataView.getItem(rowNumber);
      let meta: any = {
        cssClasses: '',
      };
      
      // Gọi previousItemMetadata với context đúng (bind dataView)
      if (previousItemMetadata && typeof previousItemMetadata === 'function') {
        try {
          const previousMeta = previousItemMetadata.call(angularGrid.dataView, rowNumber);
          if (previousMeta && typeof previousMeta === 'object' && previousMeta !== null) {
            meta = { ...previousMeta };
          }
        } catch (error) {
          // Bỏ qua nếu lỗi, dùng meta mặc định
        }
      }

      // Áp dụng màu dựa trên điều kiện
      if (item) {
        const itemLate = parseInt(item['ItemLateActual'] || '0', 10);
        const totalDayExpridSoon = parseInt(item['TotalDayExpridSoon'] || '0', 10);
        const hasEndDate = item['ActualEndDate'] && DateTime.fromISO(item['ActualEndDate']).isValid;

        if (itemLate === 1) {
          meta.cssClasses = (meta.cssClasses || '') + ' row-late-1';
        } else if (itemLate === 2) {
          meta.cssClasses = (meta.cssClasses || '') + ' row-late-2';
        } else if (totalDayExpridSoon <= 3 && !hasEndDate) {
          meta.cssClasses = (meta.cssClasses || '') + ' row-warning';
        }
      }

      return meta;
    };
  }

  angularGridTypeLinkReady(angularGrid: AngularGridInstance) {
    this.angularGridTypeLink = angularGrid;
    this.gridTypeLinkData = angularGrid?.slickGrid || {};
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridData.getDataItem(args.rows[0]);
      this.selectedRow = selectedRow;
    }
  }

  onCellClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.sizeTbMaster = '60%';
      this.sizeTbDetail = '40%';
      this.logSplitSizes('onCellClicked(before render)');
      this.projectId = item['ID'];
      this.projectCode = item['ProjectCode'];
      this.activeTab = 'workreport'; // Đặt lại tab đầu tiên
      
      // Khi mở panel: đợi panel có kích thước, render grids, load data
      setTimeout(() => {
        this.detailGridsReady = true;
        this.logSplitSizes('onCellClicked(after detailGridsReady=true)');
        
        // Sau khi render, resize grids và load data
        setTimeout(() => {
          this.getProjectWorkReports();
          this.getProjectTypeLinks();
          
          // Resize grids after panel opens (với delay để đảm bảo columns đã được set)
          setTimeout(() => {
            try {
              // Kiểm tra slickGrid và columns hợp lệ trước khi resize
              if (this.angularGrid?.slickGrid) {
                const columns = this.angularGrid.slickGrid.getColumns();
                if (columns && columns.length > 0 && columns.every(col => col !== null && col !== undefined)) {
                  this.angularGrid.resizerService?.resizeGrid();
                }
              }
              if (this.angularGridWorkReport?.slickGrid) {
                const columns = this.angularGridWorkReport.slickGrid.getColumns();
                if (columns && columns.length > 0 && columns.every(col => col !== null && col !== undefined)) {
                  this.angularGridWorkReport.resizerService?.resizeGrid();
                }
              }
              if (this.angularGridTypeLink?.slickGrid) {
                const columns = this.angularGridTypeLink.slickGrid.getColumns();
                if (columns && columns.length > 0 && columns.every(col => col !== null && col !== undefined)) {
                  this.angularGridTypeLink.resizerService?.resizeGrid();
                }
              }
            } catch (error) {
              console.error('Error resizing grids:', error);
            }
          }, 100);
        }, 200); // Đợi grids render và có kích thước
      }, 300); // Đợi panel animation hoàn thành
    }
  }
  //#endregion

  //#region Helper methods
  onChange(val: string) {
    this.valueChange.emit(val);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  createdText(text: string) {
    return text;
  }

  closePanel() {
    this.sizeTbMaster = '100%';
    this.sizeTbDetail = '0';
    this.detailGridsReady = false; // Ẩn grids khi đóng panel
    this.logSplitSizes('closePanel(immediate)');
    setTimeout(() => this.logSplitSizes('closePanel(after 50ms)'), 50);
    setTimeout(() => {
      this.logSplitSizes('closePanel(after 300ms)');
      try {
        this.angularGrid?.resizerService?.resizeGrid();
      } catch {
        // ignore
      }
    }, 300);
  }

  private logSplitSizes(source: string) {
    try {
      const gridContainer = document.querySelector('#grid-container-projects') as HTMLElement | null;
      const splitter = (gridContainer?.closest('nz-splitter') as HTMLElement | null) || null;
      const panels = splitter?.querySelectorAll(':scope > nz-splitter-panel') as NodeListOf<HTMLElement> | undefined;

      const panelSizes = panels
        ? Array.from(panels)
            .slice(0, 2)
            .map((p, i) => {
              const rect = p.getBoundingClientRect();
              const style = window.getComputedStyle(p);
              return {
                index: i,
                widthPx: Math.round(rect.width),
                flexBasis: style.flexBasis,
                widthStyle: style.width,
                display: style.display,
                visibility: style.visibility,
              };
            })
        : [];

      // eslint-disable-next-line no-console
      console.log('[ProjectSlickGrid2 split]', {
        source,
        sizeTbMaster: this.sizeTbMaster,
        sizeTbDetail: this.sizeTbDetail,
        detailGridsReady: this.detailGridsReady,
        splitterFound: !!splitter,
        panelSizes,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[ProjectSlickGrid2 split] logSplitSizes error', { source, err });
    }
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    setTimeout(() => {
      if (tab === 'workreport' && this.angularGridWorkReport) {
        this.angularGridWorkReport.resizerService?.resizeGrid();
        // Refresh để đảm bảo hiển thị đúng
        if (this.angularGridWorkReport.dataView && this.angularGridWorkReport.slickGrid) {
          this.angularGridWorkReport.dataView.refresh();
          this.angularGridWorkReport.slickGrid.invalidate();
          this.angularGridWorkReport.slickGrid.render();
        }
      } else if (tab === 'typelink') {
        // Đợi grid được render (vì *ngIf chỉ render khi activeTab === 'typelink')
        setTimeout(() => {
          // Load data nếu chưa có
          this.getProjectTypeLinks();
          
          // Resize và refresh grid sau khi data được load
          setTimeout(() => {
            if (this.angularGridTypeLink) {
              this.angularGridTypeLink.resizerService?.resizeGrid();
              if (this.angularGridTypeLink.dataView && this.angularGridTypeLink.slickGrid) {
                this.angularGridTypeLink.dataView.refresh();
                this.angularGridTypeLink.slickGrid.invalidate();
                this.angularGridTypeLink.slickGrid.render();
              }
            }
          }, 100);
        }, 200); // Đợi grid được render
      }
    }, 150);
  }

  getSelectedRows(): any[] {
    if (this.angularGrid && this.angularGrid.gridService) {
      const selectedRows = this.angularGrid.gridService.getSelectedRows();
      return selectedRows.map((index: number) => this.gridData.getDataItem(index));
    }
    return [];
  }

  getSelectedIds(): number[] {
    return this.getSelectedRows().map((row: any) => row.ID);
  }
  //#endregion

  //#region Data loading
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
      keyword: this.keyword.trim() || '',
      customerID: this.customerId || 0,
      saleID: this.userId || 0,
      projectType: projectTypeStr || '',
      leaderID: this.technicalId || 0,
      userTechID: 0,
      pmID: this.pmId || 0,
      globalUserID: this.currentUser?.EmployeeID || 0,
      bussinessFieldID: this.businessFieldId || 0,
      projectStatus: projectStatusStr || '',
      isAGV: this.isHide,
    };
  }

  searchProjects() {
    const ajaxParams = this.getProjectAjaxParams();
    this.projectService
      .getProjectsPagination(ajaxParams, 1, 1000)
      .subscribe({
        next: (res) => {
          if (res?.data) {
            const projects = res.data.project || [];
            this.dataset = projects.map((item: any, index: number) => ({
              ...item,
              id: item.ID,
              STT: index + 1
            }));
            
            // Điều chỉnh row height và apply distinct filters sau khi data được load
            setTimeout(() => {
              this.adjustRowHeights();
              this.applyDistinctFilters();
              this.isLoading = false;
            }, 100);
          } else {
            this.dataset = [];
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error loading project data:', err);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu dự án');
          this.isLoading = false;
        },
      });
  }

  // getProjectWorkReports() {
  //   if (!this.projectId || this.projectId === 0) {
  //     this.datasetWorkReport = [];
  //     return;
  //   }

  //   // Chỉ load data nếu grid đã sẵn sàng
  //   if (!this.detailGridsReady || !this.angularGridWorkReport) {
  //     return;
  //   }

  //   this.projectService.getProjectItemsData(this.projectId).subscribe({
  //     next: (res) => {
  //       if (res?.data) {
  //         const dataArray = Array.isArray(res.data) ? res.data : [];
  //         this.datasetWorkReport = dataArray.map((item: any, index: number) => ({
  //           ...item,
  //           id: item.ID || index,
  //           STT: index + 1
  //         }));
  // }
  getProjectWorkReports() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetWorkReport = [];
      return;
    }
  
    if (!this.detailGridsReady || !this.angularGridWorkReport) {
      return;
    }
  
    this.projectService.getProjectItemsData(this.projectId).subscribe({
      next: (res) => {
        if (res?.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [];
  
          this.datasetWorkReport = dataArray.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
            STT: index + 1
          }));

          // Refresh grid để áp dụng màu và điều chỉnh row height
          setTimeout(() => {
            if (this.angularGridWorkReport?.dataView && this.angularGridWorkReport?.slickGrid) {
              this.angularGridWorkReport.dataView.refresh();
              this.angularGridWorkReport.slickGrid.invalidate();
              this.angularGridWorkReport.slickGrid.render();
              this.adjustWorkReportRowHeights();
              this.applyDistinctFiltersWorkReport();
            }
          }, 100);
        } else {
          this.datasetWorkReport = [];
        }
      },
      error: (err) => {
        console.error('Error loading project work reports:', err);
      },
    });
  }
  getProjectTypeLinks() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetTypeLink = [];
      return;
    }

    // Chỉ load data nếu detailGridsReady (grid sẽ được render khi tab được chọn)
    if (!this.detailGridsReady) {
      return;
    }

    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        // Map data giống hệt menu-app: id và parentId
        this.datasetTypeLink = (response.data || []).map((x: any) => ({
          ...x,
          id: x.ID,
          parentId: x.ParentID == 0 ? null : x.ParentID
        }));

        setTimeout(() => {
          this.applyDistinctFiltersTypeLink();
        }, 100);
        
        // Refresh grid sau khi data được load (nếu grid đã được khởi tạo)
        setTimeout(() => {
          if (this.angularGridTypeLink?.dataView && this.angularGridTypeLink?.slickGrid) {
            this.angularGridTypeLink.dataView.refresh();
            this.angularGridTypeLink.slickGrid.invalidate();
            this.angularGridTypeLink.slickGrid.render();
            this.angularGridTypeLink.resizerService?.resizeGrid();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.datasetTypeLink = [];
      },
    });
  }

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
        this.projectStatuses = response.data || [];
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
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
    this.savedPage = 0;
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }
  //#endregion

  //#region Context menu actions
  setPersionalPriority(priority: number) {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length <= 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
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
            { nzStyle: { fontSize: '0.75rem' } }
          );
          this.searchProjects();
        }
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  selectProjectStatus(statusID: number) {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const projectID = selectedIDs[0];
    this.selectedStatusDate = new Date();

    const modalRef = this.modal.create({
      nzTitle: 'Cập nhật trạng thái',
      nzContent: this.statusDateModalContent,
      nzFooter: [
        {
          label: 'Hủy',
          type: 'default',
          onClick: () => {
            this.selectedStatusDate = null;
            modalRef.close();
          },
        },
        {
          label: 'OK',
          type: 'primary',
          onClick: () => {
            if (!this.selectedStatusDate) {
              this.notification.error('Thông báo', 'Vui lòng chọn ngày thay đổi trạng thái!', {
                nzStyle: { fontSize: '0.75rem' },
              });
              return;
            }

            const dateLog = this.selectedStatusDate;
            this.selectedStatusDate = null;

            this.projectService.updateProjectStatus(projectID, statusID, dateLog).subscribe({
              next: (response: any) => {
                if (response && response.status === 1) {
                  this.notification.success('Thông báo', response.message || 'Cập nhật trạng thái thành công!', {
                    nzStyle: { fontSize: '0.75rem' },
                  });
                  modalRef.close();
                  this.searchProjects();
                } else {
                  this.notification.error('Lỗi', response?.message || 'Không thể cập nhật trạng thái!', {
                    nzStyle: { fontSize: '0.75rem' },
                  });
                }
              },
              error: (error: any) => {
                const errorMsg = error?.error?.message || error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái!';
                this.notification.error('Lỗi', errorMsg, {
                  nzStyle: { fontSize: '0.75rem' },
                });
                console.error('Error updating project status:', error);
              },
            });
          },
        },
      ],
      nzWidth: 500,
    });
  }
  //#endregion

  //#region CRUD operations
  updateProject(status: number) {
    const selectedIDs = this.getSelectedIds();

    if (status == 1) {
      if (selectedIDs.length != 1) {
        this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
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
          this.notification.success('Thông báo', this.createdText('Đã thêm dự án thành công!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        } else {
          this.notification.success('Cập nhật', this.createdText('Đã sửa dự án thành công'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        }
        this.searchProjects();
      }
    });
  }

  deletedProjects() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length <= 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất 1 dự án để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Bạn có chắc muốn xóa dự án đã chọn?',
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

  //#region Export Excel
  async exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.error('', this.createdText('Không có dữ liệu xuất excel!'), {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const headers = this.columnDefinitions
      .filter(col => !col.hidden)
      .map(col => col.name);
    worksheet.addRow(headers);

    this.dataset.forEach((row: any) => {
      const rowData = this.columnDefinitions
        .filter(col => !col.hidden)
        .map(col => {
          let value = row[col.field as string];
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          return value;
        });
      worksheet.addRow(rowData);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DanhSachDuAn.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion

  //#region Modal openers
  openFolder() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length == 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    const projectId = selectedIDs[0];
    let selectedProjectTypeIds: number[] = [];

    this.datasetTypeLink.forEach((row: any) => {
      if (row.Selected === true && row.ID) {
        selectedProjectTypeIds.push(row.ID);
      }
    });

    if (selectedProjectTypeIds.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất 1 kiểu dự án!');
      return;
    }

    this.projectService.createProjectTree(projectId, selectedProjectTypeIds).subscribe({
      next: (response: any) => {
        if (response.status == 1 && response.data) {
          const url = response.data.url || '';
          const urlOnl = response.data.urlOnl || '';

          this.modal.create({
            nzTitle: 'Đường dẫn hệ thống',
            nzContent: `
              <div style="padding: 16px;">
                <div style="margin-bottom: 20px;">
                  <div style="margin-bottom: 8px; font-weight: 600; color: #333;">
                    <i class="anticon anticon-folder" style="margin-right: 8px;"></i>Đường dẫn hệ thống:
                  </div>
                  <div style="margin-top: 8px; padding: 12px; background-color: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; cursor: text; user-select: text;">
                    ${url}
                  </div>
                </div>
                <div>
                  <div style="margin-bottom: 8px; font-weight: 600; color: #333;">
                    <i class="anticon anticon-cloud" style="margin-right: 8px;"></i>Đường dẫn online:
                  </div>
                  <div style="margin-top: 8px; padding: 12px; background-color: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; cursor: text; user-select: text;">
                    ${urlOnl}
                  </div>
                </div>
                <div style="margin-top: 16px; padding: 8px; background-color: #e6f7ff; border-left: 3px solid #1890ff; border-radius: 2px; font-size: 12px; color: #666;">
                  <i class="anticon anticon-info-circle" style="margin-right: 6px;"></i>
                  Bạn có thể chọn và copy (Ctrl+C) đường dẫn để sử dụng
                </div>
              </div>
            `,
            nzWidth: 700,
            nzOkText: 'Đóng',
            nzOnOk: () => true
          });
        } else {
          this.notification.error('Thông báo', response.message || 'Không thể tạo cây thư mục dự án!');
        }
      },
      error: (error) => {
        this.notification.error('Thông báo', error.error?.message || 'Lỗi khi tạo cây thư mục dự án!');
        console.error('Lỗi:', error);
      }
    });
  }

  changeProject() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án cần chuyển!', {
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

  openProjectPartListProblemModal() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectPartlistProblemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectID = selectedIDs[0];
  }

  openProjectRequest() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectRequestComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectID = selectedIDs[0];

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }

  openUpdateCurrentSituation() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectCurrentSituationComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true || reason?.success) {
        this.searchProjects();
      }
    });
  }

  openProjectStatus() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
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

  openProjectTypeLinkDetail() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectTypeLinkDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.then((result) => {
      if (result?.success) {
        this.searchProjects();
      }
    }).catch((reason) => {
      if (reason == true || reason?.success) {
        this.searchProjects();
      }
    });
  }

  openProjectListWorkReport() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    this.router.navigate(['/projectListWork', selectedIDs[0]]);
  }

  openProjectEmployee() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectEmployeeComponent, {
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

  openProjectWorkerSynthetic() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectWorkerSyntheticComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectID = this.projectId;
  }

  openProjectWorkReportModal() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectListWorkReportComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
  }

  openWorkItemModal() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(WorkItemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectCode = this.projectCode;
    modalRef.componentInstance.projectId = this.projectId;
  }

  openProjectWorkerModal() {
    const selectedIDs = this.getSelectedIds();
    const selectedRows = this.getSelectedRows();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectWorkerComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = selectedRows[0]?.ProjectCode;
  }

  openProjectPartListModal() {
    const selectedIDs = this.getSelectedIds();
    const selectedRows = this.getSelectedRows();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectPartListComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      scrollable: false,
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectNameX = selectedRows[0]?.ProjectName;
    modalRef.componentInstance.projectCodex = selectedRows[0]?.ProjectCode;
    modalRef.componentInstance.tbp = false;
  }

  openProjectHistoryProblemModal() {
    const selectedIDs = this.getSelectedIds();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectHistoryProblemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCode;
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    const fieldsToFilter = [
      'ProjectStatusName', 'ProjectCode', 'ProjectName', 'EndUserName',
      'FullNameSale', 'FullNameTech', 'FullNamePM', 'BussinessField',
      'CurrentSituation', 'CustomerName', 'CreatedBy', 'UpdatedBy'
    ];
    this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, fieldsToFilter);
  }

  private applyDistinctFiltersWorkReport(): void {
    const fieldsToFilter = [
      'Code', 'StatusText', 'ProjectTypeName', 'FullName',
      'Mission', 'EmployeeRequest', 'Note', 'ProjectEmployeeName'
    ];
    this.applyDistinctFiltersToGrid(this.angularGridWorkReport, this.columnDefinitionsWorkReport, fieldsToFilter);
  }

  private applyDistinctFiltersTypeLink(): void {
    const fieldsToFilter = ['ProjectTypeName', 'FullName'];
    this.applyDistinctFiltersToGrid(this.angularGridTypeLink, this.columnDefinitionsTypeLink, fieldsToFilter);
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    // Update column definitions (so when grid re-renders, it keeps the collections)
    columnDefs.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();

    // Thêm tooltip cho dropdown options sau khi render
    setTimeout(() => {
      this.addTooltipsToDropdownOptions();
    }, 100);
  }

  private addTooltipsToDropdownOptions(): void {
    // Tìm tất cả dropdown options và thêm title attribute
    const dropdownOptions = document.querySelectorAll('.ms-drop.bottom .ms-list li label span');
    dropdownOptions.forEach((span: Element) => {
      const text = span.textContent || '';
      if (text && text.length > 30) { // Chỉ thêm tooltip cho text dài
        (span as HTMLElement).setAttribute('title', text);
      }
    });
  }
  //#endregion
}
