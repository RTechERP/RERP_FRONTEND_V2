import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  HostListener,
  TemplateRef
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
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
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project/project-service/project.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../services/permission.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../app.config';
import { ProjectSurveyService } from '../project/project-survey/project-survey-service/project-survey.service';
import { ProjectSurveyDetailComponent } from '../project/project-survey-detail/project-survey-detail.component';

import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-project-survey-slick-grid',
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
    NzFormModule,
    ReactiveFormsModule
  ],
  templateUrl: './project-survey-slick-grid.component.html',
  styleUrls: ['./project-survey-slick-grid.component.css']
})
export class ProjectSurveySlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  private searchSubject = new Subject<string>();
  showSearchBar: boolean = true;
  isMobile: boolean = false;
  menuBars: MenuItem[] = [];
  isLoading: boolean = false;

  @ViewChild('infoApproved', { static: false })
  infoApprovedContainer!: TemplateRef<any>;

  approvalForm: any;
  isDisableReason: boolean = false;

  constructor(
    private projectService: ProjectService,
    private projectSurveyService: ProjectSurveyService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    public permissionService: PermissionService, // Made public for HTML usage
    private fb: NonNullableFormBuilder,
  ) {
    this.excelExportService = new ExcelExportService();
    this.searchSubject
      .pipe(debounceTime(1200))
      .subscribe(() => {
        this.getDataProjectSurvey();
      });

    this.approvalForm = this.fb.group({
      technicalRequestId: this.fb.control<number | null>(null, [
        Validators.required,
      ]),
      dateSurvey: this.fb.control<string>('', [Validators.required]),
      partOfDayId: this.fb.control<number>(0),
      reason: this.fb.control<string>(''),
    });
  }

  //#region Variables
  isHide: boolean = false;
  sizeSearch: string = '0';

  // Data lists for filters/dropdowns
  employees: any[] = [];
  projects: any[] = [];
  customers: any[] = [];
  projectTypes: any[] = [];

  // SlickGrid
  angularGrid!: AngularGridInstance;
  gridData: any[] = [];
  dataset: any[] = [];
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  excelExportService: ExcelExportService;
  selectedRow: any = '';

  // Filter params
  dateStart: any = DateTime.local()
    .minus({ month: 1 })
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  dateEnd: any = DateTime.local().plus({ month: 2 }).toISO();
  projectId: any = 0;
  technicalId: any = 0;
  saleId: any = 0;
  keyword: string = '';

  currentUser: any = null;
  //#endregion

  //#region Lifecycle hooks
  ngOnInit(): void {
    this.updateResponsiveState();
    this.initMenuBar();
    this.isLoading = true;

    this.initGrid();
  }

  ngAfterViewInit(): void {
    // Initialize with empty dataset to prevent SlickGrid error
    this.dataset = [];
    this.gridData = [];
    
    this.getCurrentUser();
    this.getEmployees();
    this.getProjects();
    this.getCustomers();
    this.getProjectTypes();
    this.getDataProjectSurvey();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateResponsiveState();
  }
  //#endregion

  //#region Initial Data fetching
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.currentUser = response.data;
      },
      error: (error: any) => {
        console.error('Lỗi getUser:', error);
      },
    });
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        // Flatten logic if needed, but assuming data is array
        this.employees = Array.isArray(response.data) ? response.data : [];
      },
      error: (error: any) => {
        console.error('Lỗi getEmployees:', error);
      },
    });
  }

  getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        console.error('Lỗi getProjects:', error);
      },
    });
  }

  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (res: any) => {
        this.customers = res.data;
        this.updateFilterCollections();
      },
      error: (err: any) => console.error(err)
    });
  }

  getProjectTypes() {
    this.projectService.getProjectType().subscribe({
      next: (res: any) => {
        this.projectTypes = res.data;
        this.updateFilterCollections();
      },
      error: (err) => console.error(err)
    });
  }

  updateFilterCollections() {
    if (!this.columnDefinitions || this.columnDefinitions.length === 0) return;

    // Update Customers Filter
    const customerCol = this.columnDefinitions.find(c => c.id === 'CustomerName');
    if (customerCol && customerCol.filter) {
      customerCol.filter.collection = this.customers.map((c: any) => ({ value: c.CustomerName, label: c.CustomerName }));
    }

    // Update Project Type Filter
    const typeCol = this.columnDefinitions.find(c => c.id === 'ProjectTypeName');
    if (typeCol && typeCol.filter) {
      typeCol.filter.collection = this.projectTypes.map((t: any) => ({ value: t.ProjectTypeName, label: t.ProjectTypeName }));
    }

    // Update Status Filter (Manual list as example or fetch if available)
    const statusCol = this.columnDefinitions.find(c => c.id === 'StatusText');
    if (statusCol && statusCol.filter) {
      statusCol.filter.collection = [
        { value: 'Mới', label: 'Mới' },
        { value: 'Đang xử lý', label: 'Đang xử lý' },
        { value: 'Hoàn thành', label: 'Hoàn thành' }
      ];
    }

    // Refresh grid columns to apply new filters
    if (this.angularGrid && this.angularGrid.gridService) {
      // this.angularGrid.slickGrid.setColumns(this.columnDefinitions); // Optional depending on version
    }
  }
  //#endregion

  //#region Action Logic
  ToggleSearchPanelNew() {
    this.showSearchBar = !this.showSearchBar;
    if (this.showSearchBar) {
      this.sizeSearch = '22%';
    } else {
      this.sizeSearch = '0';
    }
  }

  reset() {
    this.dateStart = DateTime.local()
      .minus({ month: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local().plus({ month: 2 }).toISO();
    this.projectId = 0;
    this.technicalId = 0;
    this.saleId = 0;
    this.keyword = '';
    this.getDataProjectSurvey();
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
        label: 'Thêm',
        icon: PrimeIcons.PLUS,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.updateProjectSurvey(0),
      },
      {
        label: 'Sửa',
        icon: PrimeIcons.PENCIL,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.updateProjectSurvey(1),
      },
      {
        label: 'Xóa',
        icon: PrimeIcons.TRASH,
        visible: this.permissionService.hasPermission('N1') || this.permissionService.hasPermission('N13') || this.permissionService.hasPermission('N27'),
        command: () => this.deletedProjectSurvey(),
      },
      {
        label: 'Xuất Excel',
        icon: PrimeIcons.FILE_EXCEL,
        command: () => this.exportToExcel(),
      }
    ];
  }

  getDataProjectSurvey() {
    this.isLoading = true;
    let data = {
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      projectId: this.projectId ? this.projectId : 0,
      technicalId: this.technicalId ? this.technicalId : 0,
      saleId: this.saleId ? this.saleId : 0,
      keyword: this.keyword?.trim() ?? '',
    };

    this.projectSurveyService.getDataProjectSurvey(data).subscribe({
      next: (response: any) => {
        // Ensure response.data exists and is an array
        const responseData = response.data || [];
        
        // Create a Set to track used ids and ensure uniqueness
        const usedIds = new Set<string>();
        
        this.dataset = responseData.map((item: any, index: number) => {
          let uniqueId = item.ID || item.id || `survey_${index + 1}`;
          
          // If the id is already used, create a truly unique one
          if (usedIds.has(String(uniqueId))) {
            uniqueId = `survey_${index + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          usedIds.add(String(uniqueId));
          
          return {
            ...item,
            id: uniqueId
          };
        });
        
        // Create a new Set for gridData to ensure independence
        const usedIdsForGrid = new Set<string>();
        this.gridData = responseData.map((item: any, index: number) => {
          let uniqueId = item.ID || item.id || `survey_grid_${index + 1}`;
          
          if (usedIdsForGrid.has(String(uniqueId))) {
            uniqueId = `survey_grid_${index + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          usedIdsForGrid.add(String(uniqueId));
          
          return {
            ...item,
            id: uniqueId
          };
        });
        
        this.isLoading = false;

        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
      },
      error: (error) => {
        console.error('Lỗi getDataProjectSurvey:', error);
        this.isLoading = false;
        // Ensure empty dataset has proper structure
        this.dataset = [];
        this.gridData = [];
      },
    });
  }
  //#endregion

  //#region SlickGrid
  initGrid() {
    this.columnDefinitions = [
      {
        id: 'IsUrgent',
        name: 'KS Gấp',
        field: 'IsUrgent',
        width: 60,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (row: number, cell: number, value: any) => value ? '✓' : '',
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: true, label: 'Có' },
            { value: false, label: 'Không' }
          ],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'IsApprovedUrgent',
        name: 'Duyệt Gấp',
        field: 'IsApprovedUrgent',
        width: 70,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (_row: number, _cell: number, value: any) => value ? '✓' : '',
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: true, label: 'Có' },
            { value: false, label: 'Không' }
          ],
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'FullNameRequest',
        name: 'Người yêu cầu',
        field: 'FullNameRequest',
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
          return `<span title="${dataContext.FullNameRequest}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'SDTCaNhan',
        name: 'SĐT người yêu cầu',
        field: 'SDTCaNhan',
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
        id: 'DateStart',
        name: 'Từ ngày',
        field: 'DateStart',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
        },
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'DateEnd',
        name: 'Đến ngày',
        field: 'DateEnd',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
        },
        filter: { model: Filters['compoundDate'] }
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
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `<span title="${dataContext.CustomerName}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'Address',
        name: 'Địa chỉ',
        field: 'Address',
        width: 250,
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
          return `<span title="${dataContext.Address}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ProjectTypeName',
        name: 'Kiểu khảo sát',
        field: 'ProjectTypeName',
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
          return `<span title="${dataContext.ProjectTypeName}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'FullNameLeaderTBP',
        name: 'Leader Kỹ thuật',
        field: 'FullNameLeaderTBP',
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
          return `<span title="${dataContext.FullNameLeaderTBP}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
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
          return `<span title="${dataContext.StatusText}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'PIC',
        name: 'PIC',
        field: 'PIC',
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
          return `<span title="${dataContext.PIC}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'Description',
        name: 'Mô tả',
        field: 'Description',
        width: 250,
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
        formatter: (_row, _cell, value, _column, dataContext) => `<span title="${value || ''}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value || ''}</span>`,
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'FullNameApproved',
        name: 'Leader Sale',
        field: 'FullNameApproved',
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
          return `<span title="${dataContext.FullNameApproved}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ReasonUrgent',
        name: 'Lý do gấp',
        field: 'ReasonUrgent',
        width: 200,
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
          return `<span title="${dataContext.ReasonUrgent}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'FullNameTechnical',
        name: 'Kỹ thuật phụ trách',
        field: 'FullNameTechnical',
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
          return `<span title="${dataContext.FullNameTechnical}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'SDTCaNhanTechnical',
        name: 'SĐT Kỹ thuật',
        field: 'SDTCaNhanTechnical',
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
        id: 'DateSurvey',
        name: 'Ngày khảo sát',
        field: 'DateSurvey',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
        },
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'SurveySessionText',
        name: 'Buổi khảo sát',
        field: 'SurveySessionText',
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
        id: 'Result',
        name: 'Kết quả khảo sát',
        field: 'Result',
        width: 200,
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
          return `<span title="${dataContext.Result}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'ReasonCancel',
        name: 'Lý do hủy',
        field: 'ReasonCancel',
        width: 200,
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
          return `<span title="${dataContext.ReasonCancel}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
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
          return `<span title="${dataContext.Note}" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
        customTooltip: { useRegularTooltip: true },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-project-survey',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableSorting: true,
      multiColumnSort: true,
      enablePagination: false,
      showHeaderRow: true,
      headerRowHeight: 35,
      rowHeight: 35,
      frozenColumn: 5,
      explicitInitialization: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableContextMenu: true,
      dataView: {
        syncGridSelection: true,
      },
      contextMenu: {
        commandItems: [
          {
            command: 'export-excel',
            title: 'Xuất Excel',
            iconCssClass: 'fa fa-file-excel',
            action: (_e, _args) => this.exportToExcel()
          },
          {
            command: 'open-folder',
            title: 'Cây thư mục',
            iconCssClass: 'fa fa-folder-tree',
            action: (_e, _args) => this.openFolder()
          },
          {
            divider: true, command: '', title: ''
          },
          {
            command: 'approve-urgent',
            title: 'Duyệt gấp',
            iconCssClass: 'fa fa-check-circle text-success',
            action: (_e, _args) => this.approved(true, 'duyệt gấp', 1)
          },
          {
            command: 'cancel-urgent',
            title: 'Hủy duyệt gấp',
            iconCssClass: 'fa fa-times-circle text-danger',
            action: (_e, _args) => this.approved(false, 'hủy duyệt gấp', 1)
          },
          {
            divider: true, command: '', title: ''
          },
          {
            command: 'approve-request',
            title: 'Duyệt yêu cầu',
            iconCssClass: 'fa fa-check-square text-success',
            action: (_e, _args) => this.approved(true, 'duyệt', 2)
          },
          {
            command: 'cancel-request',
            title: 'Hủy duyệt yêu cầu',
            iconCssClass: 'fa fa-window-close text-danger',
            action: (_e, _args) => this.approved(false, 'hủy duyệt', 2)
          }
        ]
      }
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // Setup grouping by ProjectCode
    if (this.angularGrid && this.angularGrid.dataView) {
      this.angularGrid.dataView.setGrouping([
        {
          getter: 'ProjectCode',
          comparer: () => 0,
          formatter: (g: any) => {
            const projectCode = g.value;
            return `Mã dự án: ${projectCode}`;
          }
        }
      ]);
    }

    setTimeout(() => {
      this.angularGrid.resizerService?.resizeGrid();

      const gridContainer = document.getElementById('grid-container-project-survey') as HTMLElement;
      if (gridContainer) {
        const slickViewport = gridContainer.querySelector('.slick-viewport') as HTMLElement;
        if (slickViewport) {
          const containerHeight = gridContainer.offsetHeight;
          slickViewport.style.height = `${containerHeight - 35}px`;
        }
      }
    }, 100);
  }
  //#endregion

  //#region Business Logic
  updateProjectSurvey(status: number) {
    let selectedRows: any[] = [];
    let canEdit: boolean = true;

    if (status != 0) {
      if (this.angularGrid && this.angularGrid.slickGrid) {
        const selectedIndices = this.angularGrid.slickGrid.getSelectedRows();
        selectedRows = selectedIndices.map(idx => this.angularGrid.dataView.getItem(idx));
      }

      if (selectedRows.length == 0 || selectedRows.length > 1) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 yêu cầu để sửa!');
        return;
      }
      debugger;
      if (
        selectedRows[0].EmployeeID != this.currentUser.EmployeeID &&
        !this.currentUser.IsAdmin
      ) {
        canEdit = false;
      }
      else if (  selectedRows[0].EmployeeID1 !=null &&
        selectedRows[0].EmployeeID1 != this.currentUser.EmployeeID &&
        !this.currentUser.IsAdmin
      ) {
        canEdit = false;
      }
    }

    let modalRef = this.modalService.open(ProjectSurveyDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId =
      selectedRows.length > 0 && selectedRows[0]['ProjectID'] > 0 && status == 1
        ? selectedRows[0]['ProjectID']
        : 0;
    modalRef.componentInstance.projectSurveyId =
      selectedRows.length > 0 && selectedRows[0]['ID'] > 0 && status == 1
        ? selectedRows[0]['ID']
        : 0;
    modalRef.componentInstance.isEdit = status;
    modalRef.componentInstance.canEdit = canEdit;
    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getDataProjectSurvey();
      }
    });
  }

  deletedProjectSurvey() {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;
    const selectedIndices = this.angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedIndices.map(idx => this.angularGrid.dataView.getItem(idx));

    if (selectedRows.length == 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn yêu cầu để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa các dòng đã chọn?',
      nzOnOk: () => {
        const ids = selectedRows.map(r => r.ID);
        // Assuming service has this method from legacy
        this.projectSurveyService.deletedProjectSurvey({ ids }).subscribe({
          next: () => {
            this.notification.success('Thông báo', 'Xóa thành công');
            this.getDataProjectSurvey();
          },
        error: (error: any) => {
            console.error('Error deleting version:', error);
            const errorMessage = error?.error?.message || error?.message || 'Không thể xóa!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }

  approved(approvedStatus: boolean, statusText: string, select: number) {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;
    const selectedIndices = this.angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedIndices.map(idx => this.angularGrid.dataView.getItem(idx));

    if (selectedRows.length <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Vui lòng chọn yêu cầu cần ${statusText}!`
      );
      return;
    }

    if (this.currentUser.EmployeeID != selectedRows[0].LeaderID) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Bạn không thể ${statusText} yêu cầu của leader [${selectedRows[0].FullNameLeaderTBP}]!`
      );
      return;
    }

    let requestIds = [...new Set(selectedRows.map((row: any) => row.ID))];

    if (select == 1) {
      this.modal.confirm({
        nzTitle: `Thông báo`,
        nzContent: `Bạn có chắc muốn ${statusText} yêu cầu đã chọn không?`,
        nzOkText: 'Ok',
        nzOkType: 'primary',
        nzOnOk: () => {
          let data = {
            approvedStatus: approvedStatus,
            loginName: this.currentUser.LoginName,
            globalEmployeeId: this.currentUser.EmployeeID,
            ids: requestIds,
          };
          this.projectSurveyService.approvedUrgent(data).subscribe({
            next: (response: any) => {
              if (response.status == 1) {
                this.notification.success('Thông báo', `Đã ${statusText} yêu cầu khảo sát!`);
                this.getDataProjectSurvey();
              }
            },
            error: (error) => console.error(error)
          });
        },
      });
    } else {
      // Approval Request logic (select == 2)
      if (approvedStatus == false) this.isDisableReason = true;

      if (selectedRows.length > 1) {
        this.notification.error(NOTIFICATION_TITLE.error, `Vui lòng chỉ chọn 1 yêu cầu!`);
        return;
      }

      // Handle Date initialization safely
      let initialDateSurvey: string = new Date().toISOString();
      if (selectedRows[0].DateSurvey) {
        initialDateSurvey = selectedRows[0].DateSurvey;
      } else if (selectedRows[0].DateEnd) {
        initialDateSurvey = selectedRows[0].DateEnd;
      }

      this.approvalForm.patchValue({
        technicalRequestId: selectedRows[0].EmployeeID1 || null,
        partOfDayId: selectedRows[0].SurveySession || 0,
        reason: selectedRows[0].ReasonCancel || '',
        dateSurvey: initialDateSurvey
      });

      if (approvedStatus === false) {
        this.approvalForm.get('reason')?.setValidators([Validators.required]);
        this.isDisableReason = true;
      } else {
        this.approvalForm.get('reason')?.clearValidators();
        this.approvalForm.get('reason')?.updateValueAndValidity();
        this.isDisableReason = false;
      }

      // Open Modal
      const modalRef = this.modal.create({
        nzTitle: `${statusText.toUpperCase()} YÊU CẦU`,
        nzContent: this.infoApprovedContainer,
        nzFooter: [
          {
            label: 'Hủy',
            onClick: () => modalRef.close()
          },
          {
            label: 'Lưu',
            type: 'primary',
            onClick: () => {
              this.submitApproval(modalRef, selectedRows, approvedStatus, statusText);
            }
          }
        ]
      });
    }
  }

  submitApproval(modalRef: any, selectedRows: any[], approvedStatus: boolean, statusText: string) {
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    const formValue = this.approvalForm.getRawValue();
    const data = {
      approvedStatus: approvedStatus,
      id: selectedRows[0].ID,
      employeeId: formValue.technicalRequestId,
      surveySession: formValue.partOfDayId,
      reason: formValue.reason,
      dateSurvey: formValue.dateSurvey,
      loginName: this.currentUser.LoginName,
      globalEmployeeId: this.currentUser.EmployeeID
    };

    this.projectSurveyService.approved(data).subscribe({
      next: () => {
        this.notification.success('Thông báo', `Thành công`);
        this.getDataProjectSurvey();
        modalRef.close();
      },
      error: (err) => console.error(err)
    });
  }

  openFolder() {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;
    const selectedIndices = this.angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedIndices.map(idx => this.angularGrid.dataView.getItem(idx));
    if (selectedRows.length === 1) {
      const projectId = selectedRows[0].ProjectID;
      this.projectSurveyService.openSurveyFolder(projectId).subscribe();
    }
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'Danh_Sach_Khao_Sat',
      format: 'xlsx'
    });
  }

  applyDistinctFilters(): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];
    if (!data || data.length === 0) return;

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
    };

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];

    // Update predefined collections
    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;
          
          // Use predefined collections for boolean fields
          if (field === 'IsUrgent' || field === 'IsApprovedUrgent') {
            column.filter.collection = booleanCollection;
          } else if (field === 'CustomerName') {
            column.filter.collection = this.customers.map((c: any) => ({ value: c.CustomerName, label: c.CustomerName }));
          } else if (field === 'ProjectTypeName') {
            column.filter.collection = this.projectTypes.map((t: any) => ({ value: t.ProjectTypeName, label: t.ProjectTypeName }));
          } else if (field === 'StatusText') {
            column.filter.collection = [
              { value: 'Mới', label: 'Mới' },
              { value: 'Đang xử lý', label: 'Đang xử lý' },
              { value: 'Hoàn thành', label: 'Hoàn thành' }
            ];
          } else {
            column.filter.collection = getUniqueValues(data, field);
          }
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (colDef.filter && colDef.filter.model === Filters['multipleSelect']) {
          const field = colDef.field;
          if (!field) return;
          
          // Use predefined collections for boolean fields
          if (field === 'IsUrgent' || field === 'IsApprovedUrgent') {
            colDef.filter.collection = booleanCollection;
          } else if (field === 'CustomerName') {
            colDef.filter.collection = this.customers.map((c: any) => ({ value: c.CustomerName, label: c.CustomerName }));
          } else if (field === 'ProjectTypeName') {
            colDef.filter.collection = this.projectTypes.map((t: any) => ({ value: t.ProjectTypeName, label: t.ProjectTypeName }));
          } else if (field === 'StatusText') {
            colDef.filter.collection = [
              { value: 'Mới', label: 'Mới' },
              { value: 'Đang xử lý', label: 'Đang xử lý' },
              { value: 'Hoàn thành', label: 'Hoàn thành' }
            ];
          } else {
            colDef.filter.collection = getUniqueValues(data, field);
          }
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
  //#endregion
}
