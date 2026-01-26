import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
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
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project/project-service/project.service';
import { AuthService } from '../../auth/auth.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-project-agv-summary-slick-gird',
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
    NzFormModule,
    NzTabsModule,
    CommonModule,
  ],
  templateUrl: './project-agv-summary-slick-gird.component.html',
  styleUrl: './project-agv-summary-slick-gird.component.css',
})
export class ProjectAgvSummarySlickGirdComponent implements OnInit, AfterViewInit, OnDestroy {
  private searchSubject = new Subject<string>();
  showSearchBar: boolean = true;
  isMobile: boolean = false;
  isLoading: boolean = false;
  selectedTabIndex: number = 0;

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(1200)).subscribe(() => {
      this.searchProjects();
    });
  }

  //#region Khai báo biến
  isHide: boolean = false;
  sizeSearch: string = '0';
  sizeTbMaster: string = '100%';
  sizeTbDetail: any = '0';
  showDetailPanel: boolean = false; // Điều khiển hiển thị panel thông tin thêm
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  customers: any[] = [];
  projecStatuses: any[] = [];

  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridWorkReport!: AngularGridInstance;
  angularGridTypeLink!: AngularGridInstance;
  gridData: any;

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

  gridsReady: boolean = false;
  detailGridsReady: boolean = false;
  detailTabsVisible: boolean = false;
  userId: any;
  pmId: any;
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';
  projectId: any = 0;
  projectCode: any = '';
  currentUser: any = null;
  pageId: number = 2;
  globalID: number = 0;
  dateStart: string = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toFormat('yyyy-MM-dd');
  //#endregion


  //#region Lifecycle hooks
  ngOnInit(): void {
    this.updateResponsiveState();
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
    this.getCurrent();
    this.getUsers();
    this.getPms();
    this.getBusinessFields();
    this.getCustomers();
    this.getProjectTypes();
    this.getProjectStatus();

    this.searchProjects();
    setTimeout(() => {
      this.gridsReady = true;
      this.angularGrid?.resizerService?.resizeGrid();
    }, 800); // Tăng lên 800ms để đảm bảo DOM đã ready
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

  getCurrent() {
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.globalID = response.data.ID;
        this.currentUser = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  onChange(val: string) {
    this.valueChange.emit(val);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  createdText(text: string) {
    return `<span class="fs-12">${text}</span>`;
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

  //#region SlickGrid initialization
  initGridProjects() {
    this.columnDefinitions = [
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
          } as MultipleSelectOption,
        },
        cssClass: 'cell-wrap',
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
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'PriotityText',
        name: 'Mức ưu tiên dự án',
        field: 'PriotityText',
        width: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'PersonalPriotity',
        name: 'Mức ưu tiên cá nhân',
        field: 'PersonalPriotity',
        width: 90,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 150,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
      },
      {
        id: 'ProjectProcessType',
        name: 'Trạng thái dự án',
        field: 'ProjectProcessType',
        width: 120,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
      },
      {
        id: 'UserMission',
        name: 'Nội dung công việc',
        field: 'UserMission',
        width: 250,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.UserMission}"
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
        id: 'EndUserName',
        name: 'End User',
        field: 'EndUserName',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
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
        id: 'PO',
        name: 'PO',
        field: 'PO',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
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
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'FullNameSale',
        name: 'Người phụ trách(sale)',
        field: 'FullNameSale',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
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
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
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
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
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
        id: 'BussinessField',
        name: 'Lĩnh vực dự án',
        field: 'BussinessField',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.BussinessField}"
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
        cssClass: 'cell-wrap',
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
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
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption,
        // },
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
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'PlanDateEndSummary',
        name: 'Dự kiến kết thúc',
        field: 'PlanDateEndSummary',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] },
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
        filter: { model: Filters['compoundDate'] },
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
        filter: { model: Filters['compoundDate'] },
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
          } as MultipleSelectOption,
        },
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
          } as MultipleSelectOption,
        },
      },
    ].filter((col) => col !== null && col !== undefined) as Column[];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-agv-projects',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableCellNavigation: true,
      enableSorting: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 4,
      syncColumnCellResize: true, // Sửa lỗi sort nhầm cột khi có frozen columns
      rowHeight: 33,
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
        filter: { model: Filters['compoundInputNumber'] },
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
        width: 100,
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
        },
      },
      {
        id: 'FullName',
        name: 'Người phụ trách',
        field: 'FullName',
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
        id: 'PercentItem',
        name: '%',
        field: 'PercentItem',
        width: 50,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
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
        id: 'PlanStartDate',
        name: 'Dự kiến bắt đầu',
        field: 'PlanStartDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        cssClass: 'text-center',
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'TotalDayPlan',
        name: 'Số ngày',
        field: 'TotalDayPlan',
        width: 80,
        sortable: true,
        cssClass: 'text-end',
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
        filter: { model: Filters['compoundDate'] },
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
        filter: { model: Filters['compoundDate'] },
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
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'PercentageActual',
        name: '% Thực tế',
        field: 'PercentageActual',
        width: 80,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
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
    ].filter((col) => col !== null && col !== undefined) as Column[];

    this.gridOptionsWorkReport = {
      autoResize: {
        container: '#grid-container-agv-workreport',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      forceFitColumns: false,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowHeight: 33,
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
        formatter: (_row: number, _cell: number, value: any) => {
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
        },
      },
      {
        id: 'ProjectTypeName',
        name: 'Kiểu dự án',
        field: 'ProjectTypeName',
        width: 200,
        sortable: true,
        filterable: true,
        formatter: Formatters.tree, // Thêm formatter để hiển thị cây
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
        hidden: !this.isHide,
      },
    ];

    this.gridOptionsTypeLink = {
      enableAutoResize: true,
      autoResize: {
        container: '#grid-container-agv-typelink',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container', // Thêm resizeDetection
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true, // THÊM enableFiltering cho tree data
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false, // Đổi thành false giống file tham khảo
      },
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'ProjectTypeName',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel', // Thêm levelPropName
        indentMarginLeft: 25, // Thêm indent
        exportIndentMarginLeft: 4,
        initiallyCollapsed: false,
      },
      multiColumnSort: false, // Tree data không hỗ trợ multi-column sort
    };
  }
  //#endregion


  //#region Grid Events
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};
  }

  angularGridWorkReportReady(angularGrid: AngularGridInstance) {
    this.angularGridWorkReport = angularGrid;
    console.log('[WORKREPORT] Grid ready, instance:', !!this.angularGridWorkReport);

    // Áp dụng tô màu dòng bằng getItemMetadata
    angularGrid.dataView.getItemMetadata = this.rowStyleWorkReport(
      angularGrid.dataView.getItemMetadata,
      angularGrid
    );

    // Fix: Resize grid immediately upon creation
    setTimeout(() => {
      const container = this.angularGridWorkReport?.slickGrid?.getContainerNode();
      console.log('[WORKREPORT] Resizing grid (initial load). Container size:',
        container ? `${container.offsetWidth}x${container.offsetHeight}` : 'N/A');

      this.angularGridWorkReport.resizerService?.resizeGrid();
    }, 50);

    // Fail-safe check 2 seconds later
    setTimeout(() => {
      const container = this.angularGridWorkReport?.slickGrid?.getContainerNode();
      console.log('[WORKREPORT] 2s Check. Container size:',
        container ? `${container.offsetWidth}x${container.offsetHeight}` : 'N/A');
      if (container && (container.offsetWidth === 0 || container.offsetHeight === 0)) {
        console.warn('[WORKREPORT] Container has 0 dimension!');
      }
    }, 2000);

    // Load data ngay khi grid ready (chỉ khi đang ở tab workreport)
    if (this.projectId && this.projectId > 0 && this.activeTab === 'workreport') {
      console.log('[WORKREPORT] Loading data after grid ready...');
      setTimeout(() => this.getProjectWorkReports(), 100);
    }
  }

  angularGridTypeLinkReady(angularGrid: AngularGridInstance) {
    this.angularGridTypeLink = angularGrid;
    console.log('[TYPELINK] Grid ready, instance:', !!this.angularGridTypeLink);

    // Fix: Resize grid immediately upon creation
    setTimeout(() => {
      console.log('[TYPELINK] Resizing grid (initial load)');
      this.angularGridTypeLink.resizerService?.resizeGrid();
    }, 50);

    // Load data ngay khi grid ready (chỉ khi đang ở tab typelink)
    if (this.projectId && this.projectId > 0 && this.activeTab === 'typelink') {
      console.log('[TYPELINK] Loading data after grid ready...');
      setTimeout(() => this.getProjectTypeLinks(), 100);
    }
  }

  // Helper function để tính tree level
  private calculateTreeLevel(parentId: number, allData: any[]): number {
    if (!parentId || parentId === 0) return 0;

    let level = 0;
    let currentParentId = parentId;

    // Tìm parent chain để tính level
    while (currentParentId && currentParentId !== 0) {
      level++;
      const parent = allData.find(item => item.ID === currentParentId);
      if (!parent || parent.ParentID === 0 || parent.ParentID === currentParentId) {
        break;
      }
      currentParentId = parent.ParentID;
    }

    return level;
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
          // Bỏ qua nếu lỗi
        }
      }

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

  openProjectDetail(item: any) {
    // Không set size split khi click - chỉ lưu thông tin và load data
    console.log('[OPEN PROJECT] Opening project detail:', item);
    this.projectId = item['ID'];
    this.projectCode = item['ProjectCode'];
    this.activeTab = 'workreport';
    this.selectedTabIndex = 0;

    // Load data cho 2 bảng work và type (không cần đợi panel mở)
    this.getProjectWorkReports();
    this.getProjectTypeLinks();

    // Nếu panel đang mở thì resize grids
    if (this.showDetailPanel) {
      setTimeout(() => {
        try {
          if (this.angularGridWorkReport?.slickGrid) {
            this.angularGridWorkReport.resizerService?.resizeGrid();
          }
          if (this.angularGridTypeLink?.slickGrid) {
            this.angularGridTypeLink.resizerService?.resizeGrid();
          }
        } catch (error) {
          console.error('Error resizing grids:', error);
        }
      }, 100);
    }
  }

  // Toggle hiển thị panel thông tin thêm
  toggleDetailPanel() {
    this.showDetailPanel = !this.showDetailPanel;
    if (this.showDetailPanel) {
      this.sizeTbMaster = '60%';
      this.sizeTbDetail = '40%';

      // Clear stale instances to avoid confusion
      this.angularGridWorkReport = undefined!;
      this.angularGridTypeLink = undefined!;

      // Trigger change detection
      this.cdr.detectChanges();

      this.detailTabsVisible = true;
      this.detailGridsReady = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        // Reinforce state right before rendering
        this.activeTab = 'workreport';
        this.selectedTabIndex = 0;
        this.detailGridsReady = true;
        console.log('[TOGGLE PANEL] Detail grids ready. activeTab:', this.activeTab, 'selectedTabIndex:', this.selectedTabIndex);

        // Resize grids after panel opens
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
      }, 600);
    } else {
      this.closePanel();
    }
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridData.getDataItem(args.rows[0]);
      this.selectedRow = selectedRow;

      // Mở detail khi chọn dòng (giống như onCellClicked) - DONE: Disable to prevent double call
      // if (selectedRow) {
      //   this.openProjectDetail(selectedRow);
      // }
    }
  }

  onCellClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.openProjectDetail(item);
    }
  }
  //#endregion

  //#region Data Loading
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

  searchProjects() {
    this.isLoading = true;
    const params = this.getProjectAjaxParams();

    this.projectService.getProjectsPagination(params, 1, 999999).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.project) {
          this.dataset = response.data.project.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
            STT: index + 1,
          }));

          setTimeout(() => {
            this.applyDistinctFilters();
            this.isLoading = false;
          }, 100);
        } else {
          this.dataset = [];
          this.isLoading = false;
        }
        // Reset detail panel
        this.sizeTbMaster = '100%';
        this.sizeTbDetail = '0';
        this.detailGridsReady = false;
        this.detailTabsVisible = false;
        this.projectId = 0;
        this.datasetWorkReport = [];
        this.datasetTypeLink = [];
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.notification.error('', this.createdText('Không thể tải dữ liệu dự án!'), {
          nzStyle: { fontSize: '0.75rem' },
        });
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

          this.datasetWorkReport = dataArray.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
            STT: index + 1,
          }));

          // Fix: Explicitly set items to DataView to ensure grid updates
          if (this.angularGridWorkReport?.dataView) {
            this.angularGridWorkReport.dataView.setItems(this.datasetWorkReport);
          }

          setTimeout(() => {
            if (this.angularGridWorkReport?.dataView && this.angularGridWorkReport?.slickGrid) {
              this.angularGridWorkReport.dataView.refresh();
              this.angularGridWorkReport.slickGrid.invalidate();
              this.angularGridWorkReport.slickGrid.render();

              const container = this.angularGridWorkReport.slickGrid.getContainerNode();
              console.log('[WORKREPORT] Data rendering complete. Container size:',
                container ? `${container.offsetWidth}x${container.offsetHeight}` : 'N/A');

              console.log('[WORKREPORT] Data rendering complete, resizing grid...');
              this.angularGridWorkReport.resizerService?.resizeGrid();
              this.applyDistinctFiltersWorkReport();
            }
          }, 100);
        } else {
          this.datasetWorkReport = [];
          if (this.angularGridWorkReport?.dataView) {
            this.angularGridWorkReport.dataView.setItems([]);
          }
        }
      },
      error: (err) => {
        console.error('Error loading project work reports:', err);
        this.datasetWorkReport = [];
      },
    });
  }

  getProjectTypeLinks() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetTypeLink = [];
      return;
    }

    console.log('[TYPELINK] Loading data for project:', this.projectId);
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        console.log('[TYPELINK] API response:', response);
        this.datasetTypeLink = (response.data || []).map((x: any) => ({
          ...x,
          id: x.ID,
          parentId: x.ParentID == 0 ? null : x.ParentID,
          treeLevel: this.calculateTreeLevel(x.ParentID, response.data), // Thêm treeLevel
        }));

        console.log('[TYPELINK] Mapped data:', this.datasetTypeLink.length, 'items');
        console.log('[TYPELINK] Sample data:', this.datasetTypeLink.slice(0, 3));

        // Set data vào grid
        if (this.angularGridTypeLink?.dataView) {
          this.angularGridTypeLink.dataView.setItems(this.datasetTypeLink);
          console.log('[TYPELINK] Data set to grid:', this.datasetTypeLink.length, 'items');
        } else {
          console.log('[TYPELINK] Grid dataView not available, will retry...');
          // Retry sau 100ms nếu grid chưa ready
          setTimeout(() => {
            if (this.angularGridTypeLink?.dataView) {
              this.angularGridTypeLink.dataView.setItems(this.datasetTypeLink);
              console.log('[TYPELINK] Data set to grid (retry):', this.datasetTypeLink.length, 'items');
            }
          }, 100);
        }

        setTimeout(() => {
          this.applyDistinctFiltersTypeLink();
        }, 100);

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
  //#endregion


  //#region Dropdown Data
  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(response.data, 'DepartmentName');
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = this.projectService.createdDataGroup(response.data, 'DepartmentName');
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
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
  }
  //#endregion

  //#region Search & Actions
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toISO();
    this.projectTypeIds = [];
    this.projecStatusIds = [];
    this.userId = 0;
    this.pmId = 0;
    this.businessFieldId = 0;
    this.technicalId = 0;
    this.customerId = 0;
    this.keyword = '';
  }

  closePanel() {
    this.sizeTbMaster = '100%';
    this.sizeTbDetail = '0';
    this.showDetailPanel = false; // Đóng panel
    this.detailGridsReady = false;
    this.detailTabsVisible = false;
    this.angularGridWorkReport = undefined!;
    this.angularGridTypeLink = undefined!;
    setTimeout(() => {
      try {
        this.angularGrid?.resizerService?.resizeGrid();
      } catch {
        // ignore
      }
    }, 300);
  }

  switchTab(tab: string) {
    console.log('[SWITCH TAB] Switching to:', tab, 'selectedTabIndex:', this.selectedTabIndex);
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
        }, 100);
      }
    }, 100);
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

  setPersionalPriority(priority: number) {
    const selectedIDs = this.getSelectedIds();

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
          this.notification.success('', this.createdText('Đã đổi độ ưu tiên cá nhân!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
          this.searchProjects();
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
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.error('', this.createdText('Không có dữ liệu xuất excel!'), {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const visibleColumns = this.columnDefinitions.filter((col) => !col.hidden);
    const headers = visibleColumns.map((col) => col.name || col.id);
    worksheet.addRow(headers);

    this.dataset.forEach((row: any) => {
      const rowData = visibleColumns.map((col) => {
        const field = col.field as string;
        let value = row[field];

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
      to: { row: 1, column: visibleColumns.length },
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

  //#region Apply Distinct Filters
  private applyDistinctFilters(): void {
    const fieldsToFilter = [
      'ProjectStatusName', 'ProjectCode', 'ProjectProcessType', 'EndUserName',
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

    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

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
  }
  //#endregion
}
