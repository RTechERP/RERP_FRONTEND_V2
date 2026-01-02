import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
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
import { ProjectTypeLinkDetailComponent } from '../project/project-type-link-detail/project-type-link-detail.component';
import { PermissionService } from '../../services/permission.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';

import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ProjectReportSlickGridComponent } from '../project-report-slick-grid/project-report-slick-grid.component';
import { ProjectPartListSlickGridComponent } from '../project-part-list-slick-grid/project-part-list-slick-grid.component';

@Component({
  selector: 'app-project-department-summary-slick-grid',
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
  templateUrl: './project-department-summary-slick-grid.component.html',
  styleUrls: ['./project-department-summary-slick-grid.component.css']
})
export class ProjectDepartmentSummarySlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  private searchSubject = new Subject<string>();
  showSearchBar: boolean = true;
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];
  isLoading: boolean = false;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  //#region Khai báo biến
  isHide: boolean = true;
  sizeSearch: string = '0';
  sizeTbMaster: string = '100%';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  departments: any[] = [];
  teams: any[] = [];
  projecStatuses: any[] = [];

  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridWorkReport!: AngularGridInstance;
  angularGridTypeLink!: AngularGridInstance;
  gridData: any;
  gridDataWorkReport: any;
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
  detailGridsReady: boolean = false;
  keyword: string = '';
  projectId: any = 0;
  projectCode: any = '';
  currentUser: any = null;
  savedPage: number = 1;

  searchParams: any = {
    dateTimeS: new Date('2024-02-02'),
    dateTimeE: new Date(),
    keyword: '',
    userID: 0,
    projectTypeID: '',
    departmentID: 2,
    userTeamID: 0,
  };
  //#endregion

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
        this.loadProjects();
      });
  }

  //#region Lifecycle hooks
  ngOnInit(): void {
    this.updateResponsiveState();
    this.initMenuBar();
    this.isLoading = true;
    this.getCurrentUser();

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
    this.getDepartment();
    this.getUserTeam();
    this.getProjectTypes();
    this.getProjectStatus();
    this.loadProjects();
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
        },
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
        cssClass: 'cell-wrap',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.CurrentSituation}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
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
        },
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
        },
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
        },
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

    ].filter(col => col !== null && col !== undefined) as Column[];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-projects',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      enableFiltering: true, // THÊM enableFiltering cho tree data
      rowSelectionOptions: {
        selectActiveRow: true
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 3,
      rowHeight: 33, // Base height - sẽ tự động tăng theo nội dung qua CSS
      enableAutoTooltip: true,
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
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProjectTypeName',
        name: 'Kiểu hạng mục',
        field: 'ProjectTypeName',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
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
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
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
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProjectEmployeeName',
        name: 'Người tham gia',
        field: 'ProjectEmployeeName',
        width: 300,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
    ].filter(col => col !== null && col !== undefined) as Column[];

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
      rowHeight: 33, // Base height - sẽ tự động tăng theo nội dung qua CSS
      enableAutoTooltip: true,
    };
  }

  initGridTypeLinks() {
    this.columnDefinitionsTypeLink = [
      { id: 'ID', name: 'ID', field: 'ID', hidden: true },
      {
        id: 'Selected',
        name: 'Chọn',
        field: 'Selected',
        width: 60,
        sortable: true,
        filterable: true,
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
        formatter: Formatters.tree,
        cssClass: 'cell-wrap',
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
        id: 'FullNamePm',
        name: 'Tên PM',
        field: 'FullNamePm',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
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
    ].filter(col => col !== null && col !== undefined) as Column[];

    this.gridOptionsTypeLink = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-typelink',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'ProjectTypeName',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 25,
        exportIndentMarginLeft: 4,
      },
      multiColumnSort: false,
    };
  }
  //#endregion

  //#region SlickGrid event handlers
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};
  }

  angularGridWorkReportReady(angularGrid: AngularGridInstance) {
    this.angularGridWorkReport = angularGrid;
    this.gridDataWorkReport = angularGrid?.slickGrid || {};

    // Áp dụng tô màu dòng bằng getItemMetadata
    angularGrid.dataView.getItemMetadata = this.rowStyleWorkReport(angularGrid.dataView.getItemMetadata, angularGrid);
  }

  // Tô màu dòng cho work report
  rowStyleWorkReport(previousItemMetadata: any, angularGrid: AngularGridInstance) {
    return (rowNumber: number) => {
      const item = angularGrid.dataView.getItem(rowNumber);
      let meta: any = {
        cssClasses: '',
      };

      if (previousItemMetadata && typeof previousItemMetadata === 'function') {
        try {
          const previousMeta = previousItemMetadata.call(angularGrid.dataView, rowNumber);
          if (previousMeta && typeof previousMeta === 'object' && previousMeta !== null) {
            meta = { ...previousMeta };
          }
        } catch (error) {
          // Ignore
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
      this.projectId = item['ID'];
      this.projectCode = item['ProjectCode'];
      this.activeTab = 'workreport';

      setTimeout(() => {
        this.detailGridsReady = true;

        setTimeout(() => {
          this.getProjectWorkReports();
          this.getProjectTypeLinks();

          setTimeout(() => {
            try {
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
        }, 200);
      }, 300);
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

  ToggleSearchPanelNew(event?: any) {
    this.showSearchBar = !this.showSearchBar;
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  closePanel() {
    this.sizeTbMaster = '100%';
    this.sizeTbDetail = '0';
    this.detailGridsReady = false;
    setTimeout(() => {
      try {
        this.angularGrid?.resizerService?.resizeGrid();
      } catch {
        // ignore
      }
    }, 300);
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    setTimeout(() => {
      if (tab === 'workreport' && this.angularGridWorkReport) {
        this.angularGridWorkReport.resizerService?.resizeGrid();
        if (this.angularGridWorkReport.dataView && this.angularGridWorkReport.slickGrid) {
          this.angularGridWorkReport.dataView.refresh();
          this.angularGridWorkReport.slickGrid.invalidate();
          this.angularGridWorkReport.slickGrid.render();
        }
      } else if (tab === 'typelink') {
        setTimeout(() => {
          this.getProjectTypeLinks();

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
        }, 200);
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

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  setDefautSearch() {
    this.searchParams = {
      dateTimeS: new Date('2024-02-02'),
      dateTimeE: new Date(),
      keyword: '',
      userID: 0,
      projectTypeID: '',
      departmentID: 0,
      userTeamID: 0,
    };
    this.savedPage = 0; // Reset savedPage khi reset search params
    this.keyword = '';
    this.projectTypeIds = [];
    this.projecStatusIds = [];
  }
  //#endregion

  //#region Data loading
  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getUserTeam() {
    this.teams = [];
    if (this.searchParams.departmentID > 0) {
      this.projectService
        .getUserTeam(this.searchParams.departmentID)
        .subscribe({
          next: (response: any) => {
            this.teams = response.data || [];
          },
          error: (error) => {
            console.error('Lỗi:', error);
          },
        });
    } else {
      this.searchParams.userTeamID = 0;
      this.users = [];
    }
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
  }

  getEmployeesByTeam() {
    this.users = [];
    if (this.searchParams.userTeamID > 0) {
      this.projectService
        .getEmployeeByUserTeam(this.searchParams.userTeamID)
        .subscribe({
          next: (response: any) => {
            const employees = response.data || [];
            if (employees.length > 0 && employees[0].DepartmentName) {
              this.users = this.projectService.createdDataGroup(
                employees,
                'DepartmentName'
              );
            } else {
              this.users = [
                {
                  label: 'Nhân viên',
                  options: employees.map((item: any) => ({ item: item })),
                },
              ];
            }
          },
          error: (error) => {
            console.error('Lỗi:', error);
            this.users = [];
          },
        });
    } else {
      this.users = [];
      this.searchParams.userID = 0;
    }
  }

  getProjectTypes() {
    this.projectService.getProjectTypes().subscribe({
      next: (res) => {
        if (res?.data) {
          this.projectTypes = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading project types:', err);
      }
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (res) => {
        if (res?.data) {
          this.projecStatuses = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading project statuses:', err);
      }
    });
  }

  loadProjects() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateTimeS)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateTimeE));

    this.isLoading = true;
    this.projectService
      .getProjectSummary(
        dateStart,
        dateEnd,
        this.searchParams.departmentID,
        this.searchParams.userID,
        this.searchParams.projectTypeID,
        this.searchParams.keyword.trim() || '',
        this.searchParams.userTeamID
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            const projects = res.data || [];
            this.dataset = (Array.isArray(projects) ? projects : []).map((item: any, index: number) => {
              const row = (item && typeof item === 'object') ? { ...item } : {};
              return {
                ...row,
                id: (row.ID !== undefined && row.ID !== null) ? `p_${row.ID}_${index}` : `p_row_${index}`,
                STT: index + 1
              };
            });

            setTimeout(() => {
              this.applyDistinctFilters();

              // Force refresh grid if instance exists
              if (this.angularGrid?.gridService) {
                this.angularGrid.gridService.renderGrid();

                // Cần resize lại canvas khi dữ liệu load động
                if (this.angularGrid.slickGrid?.resizeCanvas) {
                  this.angularGrid.slickGrid.resizeCanvas();
                }
              }

              this.isLoading = false;
            }, 200);
          } else {
            this.dataset = [];
            this.isLoading = false;
          }
        },
        error: (err: any) => {
          console.error('Error loading project data:', err);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu dự án');
          this.isLoading = false;
        },
      });
  }
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
          this.datasetWorkReport = (Array.isArray(res.data) ? res.data : []).map((item: any, index: number) => {
            const row = (item && typeof item === 'object') ? { ...item } : {};
            return {
              ...row,
              id: (row.ID !== undefined && row.ID !== null) ? `wr_${row.ID}_${index}` : `wr_row_${index}`,
              STT: index + 1
            };
          });

          setTimeout(() => {
            if (this.angularGridWorkReport?.slickGrid) {
              this.angularGridWorkReport.slickGrid.invalidate();
              this.angularGridWorkReport.slickGrid.render();
            }
          }, 100);
        } else {
          this.datasetWorkReport = [];
        }
      },
      error: (err) => {
        console.error('Error loading work reports:', err);
        this.datasetWorkReport = [];
      }
    });
  }

  getProjectTypeLinks() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetTypeLink = [];
      return;
    }

    if (!this.detailGridsReady) {
      return;
    }

    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (res) => {
        if (res?.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [];
          this.datasetTypeLink = (Array.isArray(res.data) ? res.data : []).map((item: any, index: number) => {
            const row = (item && typeof item === 'object') ? { ...item } : {};
            return {
              ...row,
              id: String(row.ID), // Đảm bảo ID là string để tree hoạt động ổn định
              parentId: row.ParentID == 0 ? null : String(row.ParentID),
              treeLevel: row.TreeLevel || 0
            };
          });

          setTimeout(() => {
            if (this.angularGridTypeLink?.slickGrid) {
              this.angularGridTypeLink.slickGrid.invalidate();
              this.angularGridTypeLink.slickGrid.render();
            }
          }, 100);
        } else {
          this.datasetTypeLink = [];
        }
      },
      error: (err) => {
        console.error('Error loading type links:', err);
        this.datasetTypeLink = [];
      }
    });
  }
  //#endregion

  //#region Modal methods
  openProjectWorkReportModal() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectReportSlickGridComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
  }

  openWorkItemModal() {
    if (!this.projectId || this.projectId === 0) {
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
    if (!this.projectId || this.projectId === 0) {
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
    modalRef.componentInstance.projectCodex = this.projectCode;
  }

  openProjectPartListModal() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectPartListSlickGridComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.projectCode;
    modalRef.componentInstance.tbp = false;
  }

  openProjectEmployee() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectEmployeeComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadProjects();
      }
    });
  }

  changeProject() {
    if (!this.projectId || this.projectId === 0) {
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
    modalRef.componentInstance.projectIdOld = this.projectId;
    modalRef.componentInstance.disable = false;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadProjects();
      }
    });
  }

  openProjectPartListProblemModal() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectPartlistProblemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectID = this.projectId;
  }

  openProjectRequest() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectRequestComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectID = this.projectId;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadProjects();
      }
    });
  }

  openProjectTypeLinkDetail() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectTypeLinkDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result
      .then((result) => {
        if (result?.success) {
          this.loadProjects();
        }
      })
      .catch((reason) => {
        if (reason == true || reason?.success) {
          this.loadProjects();
        }
      });
  }

  openProjectStatus() {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
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
    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadProjects();
      }
    });
  }

  openUpdateCurrentSituation() {
    if (!this.projectId || this.projectId === 0) {
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
    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result.catch((reason) => {
      if (reason == true || reason?.success) {
        this.loadProjects();
      }
    });
  }

  setPersionalPriority(priority: number) {
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    const dataSave = {
      ID: 0,
      UserID: this.currentUser?.EmployeeID ?? 0,
      ProjectID: this.projectId,
      Priotity: priority,
    };

    this.projectService.saveProjectPersonalPriority(dataSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thông báo', 'Đã đổi độ ưu tiên cá nhân!');
          this.loadProjects();
        }
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region Export Excel
  async exportExcel() {
    try {
      if (!this.angularGrid || !this.angularGrid.dataView) {
        this.notification.error('Lỗi', 'Grid chưa sẵn sàng!');
        return;
      }

      // Use filtered data from DataView
      const data = this.angularGrid.dataView.getFilteredItems();
      if (!data || data.length === 0) {
        this.notification.warning('Cảnh báo', 'Không có dữ liệu đã filter để xuất excel!');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tổng hợp dự án theo phòng ban');

      // Use actual visible columns from SlickGrid
      const visibleCols = this.angularGrid.slickGrid.getColumns().filter(col => !col.excludeFromExport);

      // Safely get header names
      const headers = visibleCols.map(col => {
        if (typeof col.name === 'string') return col.name;
        // Fallback for non-string headers (e.g. HTML) - try specific extracted text or field name
        return col.field || '';
      });

      // --- 1. Filter Info Row ---
      const currentFilterInfo = this.getCurrentFilterInfo();
      if (currentFilterInfo) {
        worksheet.mergeCells(1, 1, 1, visibleCols.length);
        const filterCell = worksheet.getCell(1, 1);
        filterCell.value = currentFilterInfo;
        filterCell.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF333333' } };
        filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
        filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }

      // --- 2. Header Row ---
      const headerRowIndex = currentFilterInfo ? 2 : 1;
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // --- 3. Data Rows ---
      data.forEach((row: any) => {
        const rowData = visibleCols.map(col => {
          let value = row[col.field as string];
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          return value;
        });

        const addedRow = worksheet.addRow(rowData);

        addedRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Times New Roman', size: 11 };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', wrapText: true };

          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else if (typeof cell.value === 'number') {
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }
        });
      });

      // --- 4. Auto-width ---
      const columnWidths = this.getColumnWidthsForExcel(visibleCols, data);
      for (let i = 0; i < visibleCols.length; i++) {
        const colIndex = i + 1;
        const column = worksheet.getColumn(colIndex);
        column.width = columnWidths[i];
      }

      // --- 5. Row Heights for Data ---
      const startDataRow = headerRowIndex + 1;
      for (let i = 0; i < data.length; i++) {
        const rowIndex = startDataRow + i;
        const row = worksheet.getRow(rowIndex);
        row.height = 25; // Tăng chiều cao row để hỗ trợ multi-line text
      }

      // --- 8. Export ---
      const buffer = await workbook.xlsx.writeBuffer();
      const currentDate = new Date();
      const dateStr = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}`;
      const timeStr = `${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DuAn_TheoPhongBan_${dateStr}_${timeStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success('Thông báo', 'Xuất Excel thành công!');

    } catch (error) {
      console.error('Export Error:', error);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xuất Excel');
    }
  }

  // Helper methods cho export Excel
  private getCurrentFilterInfo(): string {
    const filters: string[] = [];
    
    // Lấy filter từ các cột
    const columns = this.angularGrid?.slickGrid?.getColumns() || [];
    columns.forEach(col => {
      if (col.filter && col.filter.model) {
        const filterValue = this.getFilterValue(col);
        if (filterValue) {
          filters.push(`${col.name}: ${filterValue}`);
        }
      }
    });

    return filters.length > 0 ? `Filter: ${filters.join(' | ')}` : '';
  }

  private getFilterValue(column: any): string {
    try {
      if (column.filter.model === Filters['multipleSelect']) {
        const selectedItems = column.filter.collection?.filter((item: any) => item.selected);
        return selectedItems?.map((item: any) => item.label).join(', ') || '';
      } else if (column.filter.model === Filters['compoundInputText']) {
        return column.filter.searchTerm || '';
      } else if (column.filter.model === Filters['compoundInputNumber']) {
        return column.filter.searchTerm || '';
      } else if (column.filter.model === Filters['compoundDate']) {
        return column.filter.searchTerm || '';
      }
    } catch (error) {
      console.warn('Error getting filter value:', error);
    }
    return '';
  }

  private getStatsInfo(): string {
    const totalItems = this.angularGrid?.dataView?.getItems()?.length || 0;
    const filteredItems = this.angularGrid?.dataView?.getFilteredItems()?.length || 0;
    
    return `Tổng số dự án: ${filteredItems} ${filteredItems < totalItems ? `(trên ${totalItems})` : ''}`;
  }

  private getColumnWidthsForExcel(columns: any[], data: any[]): number[] {
    return columns.map(col => {
      let maxContentLength = 10;

      // Header length
      if (typeof col.name === 'string') {
        maxContentLength = Math.max(maxContentLength, col.name.length);
      } else if (col.field) {
        maxContentLength = Math.max(maxContentLength, col.field.length);
      }

      // Data content length (check first 500 rows)
      const rowCountToCheck = Math.min(data.length, 500);
      for (let r = 0; r < rowCountToCheck; r++) {
        const val = data[r][col.field as string];
        if (val) {
          const strVal = val.toString();
          const lines = strVal.split('\n');
          lines.forEach((line: string) => {
            maxContentLength = Math.max(maxContentLength, line.length);
          });
        }
      }

      // Capped width with minimum values
      const minWidth = 15;
      const maxWidth = 60;
      return Math.max(minWidth, Math.min(maxWidth, maxContentLength + 3));
    });
  }
  //#endregion
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
