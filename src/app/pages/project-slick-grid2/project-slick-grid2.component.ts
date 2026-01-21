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
import { ExcelExportService } from '@slickgrid-universal/excel-export';
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
import { FolderPathModalComponent } from './folder-path-modal.component';

import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ProjectReportSlickGridComponent } from '../project-report-slick-grid/project-report-slick-grid.component';
import { ProjectWokerSlickGridComponent } from '../project-woker-slick-grid/project-woker-slick-grid.component';

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
    FolderPathModalComponent,
  ],
  templateUrl: './project-slick-grid2.component.html',
  styleUrls: ['./project-slick-grid2.component.css']
})
export class ProjectSlickGrid2Component implements OnInit, AfterViewInit, OnDestroy {
  private searchSubject = new Subject<string>();
  showSearchBar: boolean = true;
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
    this.excelExportService = new ExcelExportService();
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
  showDetailPanel: boolean = false; // Điều khiển hiển thị panel thông tin thêm
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

  // Excel Export Service
  excelExportService: ExcelExportService;

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

  //#region Excel Export
  exportToExcel(): void {
    if (!this.angularGrid) {
      this.notification.error('Lỗi', 'Grid chưa sẵn sàng để export');
      return;
    }

    // Lấy dữ liệu đã được filter từ dataView
    const filteredData = this.angularGrid.dataView.getItems();

    if (!filteredData || filteredData.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
      return;
    }

    try {
      // Cấu hình options cho Excel export với design đẹp
      const exportOptions = {
        filename: `Danh_sach_du_an_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Danh sách dự án',
        sanitizeDataExport: true,
        // Chỉ export các cột đang hiển thị (ẩn các cột không cần thiết)
        exportColumns: this.columnDefinitions
          .filter(col => !col.excludeFromExport && col.id !== 'sel' && col.id !== 'action')
          .map(col => col.id),
        columnHeaderStyle: {
          font: { color: 'FFFFFFFF', bold: true, size: 11, fontName: 'Calibri' },
          fill: { type: 'pattern' as const, patternType: 'solid' as const, fgColor: 'FF2E75B6' },
          alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
          border: {
            top: { color: 'FFFFFFFF', style: 'thin' as const },
            left: { color: 'FFFFFFFF', style: 'thin' as const },
            right: { color: 'FFFFFFFF', style: 'thin' as const },
            bottom: { color: 'FFFFFFFF', style: 'thin' as const }
          }
        },
        // Style cho data rows với auto-wrap
        dataStyle: {
          font: { size: 10, fontName: 'Calibri', color: 'FF333333' },
          alignment: {
            horizontal: 'left' as const,
            vertical: 'center' as const,
            wrapText: true,
            shrinkToFit: false
          },
          border: {
            top: { color: 'FFD1D5DB', style: 'thin' as const },
            left: { color: 'FFD1D5DB', style: 'thin' as const },
            right: { color: 'FFD1D5DB', style: 'thin' as const },
            bottom: { color: 'FFD1D5DB', style: 'thin' as const }
          }
        },
        // Custom header cho Excel với design chuyên nghiệp
        customExcelHeader: (workbook: any, sheet: any) => {
          // Format cho title chính
          const titleFormat = workbook.getStyleSheet().createFormat({
            font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
            alignment: { wrapText: true, horizontal: 'center' as const, vertical: 'center' as const },
            fill: { type: 'pattern' as const, patternType: 'solid' as const, fgColor: 'FF1F497D' },
            border: {
              top: { color: 'FF1F497D', style: 'thin' as const },
              left: { color: 'FF1F497D', style: 'thin' as const },
              right: { color: 'FF1F497D', style: 'thin' as const },
              bottom: { color: 'FF1F497D', style: 'thin' as const }
            }
          });

          // Format cho thông tin filter
          const infoFormat = workbook.getStyleSheet().createFormat({
            font: { size: 11, fontName: 'Calibri', color: 'FF333333', italic: true },
            alignment: { horizontal: 'left' as const, vertical: 'center' as const },
            fill: { type: 'pattern' as const, patternType: 'solid' as const, fgColor: 'FFF8F9FA' },
            border: {
              top: { color: 'FFD1D5DB', style: 'thin' as const },
              left: { color: 'FFD1D5DB', style: 'thin' as const },
              right: { color: 'FFD1D5DB', style: 'thin' as const },
              bottom: { color: 'FFD1D5DB', style: 'thin' as const }
            }
          });

          // Format cho dòng thông tin thống kê
          const statsFormat = workbook.getStyleSheet().createFormat({
            font: { size: 12, fontName: 'Calibri', bold: true, color: 'FF495057' },
            alignment: { horizontal: 'center' as const, vertical: 'center' as const },
            fill: { type: 'pattern' as const, patternType: 'solid' as const, fgColor: 'FFE9ECEF' },
            border: {
              top: { color: 'FFDEE2E6', style: 'thin' as const },
              left: { color: 'FFDEE2E6', style: 'thin' as const },
              right: { color: 'FFDEE2E6', style: 'thin' as const },
              bottom: { color: 'FFDEE2E6', style: 'thin' as const }
            }
          });

          // Tính số cột cuối cùng
          const visibleColumns = this.columnDefinitions.filter(col => !col.excludeFromExport && col.id !== 'sel' && col.id !== 'action');
          const lastColumnLetter = String.fromCharCode('A'.charCodeAt(0) + visibleColumns.length - 1);

          // Dòng 1: Title chính
          sheet.setRowInstructions(0, { height: 40 });
          sheet.mergeCells('A1', `${lastColumnLetter}1`);
          sheet.data.push([{
            value: 'DANH SÁCH DỰ ÁN',
            metadata: { style: titleFormat.id }
          }]);

          // Dòng 2: Thông tin filter
          sheet.setRowInstructions(1, { height: 25 });
          sheet.mergeCells('A2', `${lastColumnLetter}2`);
          const filterInfo = this.getCurrentFilterInfo();
          sheet.data.push([{
            value: `Bộ lọc áp dụng: ${filterInfo}`,
            metadata: { style: infoFormat.id }
          }]);

          // Dòng 3: Thông tin thống kê
          sheet.setRowInstructions(2, { height: 30 });
          sheet.mergeCells('A3', `${lastColumnLetter}3`);
          const exportDate = new Date().toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          sheet.data.push([{
            value: `Tổng số dự án: ${filteredData.length} | Ngày xuất: ${exportDate}`,
            metadata: { style: statsFormat.id }
          }]);

          // Set column widths cho các cột chính
          const columnWidths = this.getColumnWidthsForExcel();
          columnWidths.forEach((width, index) => {
            const colLetter = String.fromCharCode('A'.charCodeAt(0) + index);
            sheet.setColumnInstructions(colLetter, { width });
          });

          // Set row height cho data rows để hỗ trợ multi-line text
          // Bắt đầu từ dòng 4 (sau 3 dòng header)
          const startDataRow = 4;
          const endDataRow = startDataRow + filteredData.length;
          for (let i = startDataRow; i <= endDataRow; i++) {
            sheet.setRowInstructions(i, { height: 25 }); // Height 25 để có không gian cho multi-line
          }
        }
      };

      // Thực hiện export
      this.excelExportService.exportToExcel(exportOptions);

      this.notification.success('Thành công', `Xuất excel thành công!`);

    } catch (error) {
      console.error('Excel export error:', error);
      this.notification.error('Lỗi', 'Không thể export file Excel');
    }
  }

  // Lấy thông tin về bộ lọc hiện tại
  private getCurrentFilterInfo(): string {
    const filters: string[] = [];

    if (this.keyword) filters.push(`Từ khóa: ${this.keyword}`);
    if (this.customerId && this.customerId !== 0) {
      const customer = this.customers.find((c: any) => c.ID === this.customerId);
      if (customer) filters.push(`Khách hàng: ${customer.CustomerName}`);
    }
    if (this.pmId && this.pmId !== 0) {
      const pm = this.pms.find((p: any) => p.ID === this.pmId);
      if (pm) filters.push(`PM: ${pm.FullName}`);
    }
    if (this.technicalId && this.technicalId !== 0) {
      const tech = this.users.find((u: any) => u.ID === this.technicalId);
      if (tech) filters.push(`Kỹ thuật: ${tech.FullName}`);
    }
    if (this.businessFieldId && this.businessFieldId !== 0) {
      const field = this.businessFields.find((f: any) => f.ID === this.businessFieldId);
      if (field) filters.push(`Lĩnh vực: ${field.BusinessFieldName}`);
    }
    if (this.projectTypeIds.length > 0) {
      const types = this.projectTypes
        .filter((t: any) => this.projectTypeIds.includes(t.ID))
        .map((t: any) => t.ProjectTypeName)
        .join(', ');
      filters.push(`Loại dự án: ${types}`);
    }

    return filters.length > 0 ? filters.join(' | ') : 'Tất cả';
  }

  // Lấy độ rộng cho các cột Excel với auto-wrap
  private getColumnWidthsForExcel(): number[] {
    const visibleColumns = this.columnDefinitions.filter(col => !col.excludeFromExport && col.id !== 'sel' && col.id !== 'action');

    // Map column ID to width (in Excel units) - tăng width để có không gian cho wrap text
    const columnWidthMap: { [key: string]: number } = {
      'ProjectStatusName': 18,
      'ProjectCode': 25,
      'ProjectName': 45,  // Tăng width để wrap text cho tên dài
      'EndUserName': 35,  // Tăng width cho tên khách hàng dài
      'FullNameSale': 25,
      'FullNameTech': 25,
      'FullNamePM': 25,
      'BussinessField': 30,
      'CurrentSituation': 40,  // Tăng width cho mô tả dài
      'CustomerName': 35,
      'CreatedBy': 18,
      'UpdatedBy': 18,
      'CreatedDate': 22,
      'UpdatedDate': 22,
      'PlanDateStart': 18,
      'PlanDateEnd': 18,
      'ActualDateStart': 18,
      'ActualDateEnd': 18,
      'ProjectType': 25,
      'Priority': 15,
      'Budget': 20,
      'ActualCost': 20,
      'Progress': 15,
      'Note': 50  // Tăng width cho ghi chú dài
    };

    return visibleColumns.map(col => {
      const width = columnWidthMap[col.id] || 25; // Default width tăng lên 25
      return width;
    });
  }
  //#endregion

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
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // }
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 200,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // },
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
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // },
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
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
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
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // }
      },
      {
        id: 'CurrentSituation',
        name: 'Hiện trạng',
        field: 'CurrentSituation',
        width: 200,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // },
        cssClass: 'cell-wrap'
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        width: 200,
        sortable: true,
        filterable: true,
        // filter: {
        //   model: Filters['multipleSelect'],
        //   collection: [],
        //   collectionOptions: { addBlankEntry: true },
        //   filterOptions: {
        //     filter: true,
        //     autoAdjustDropWidthByTextSize: true,
        //   } as MultipleSelectOption
        // },
        // filter: { model: Filters['compoundInputText'] },
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
      // Thêm Excel Export Service
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'Danh_sach_du_an',
        sanitizeDataExport: true,
        sheetName: 'Danh sách dự án'
      }
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

    // Resize grid immediately upon creation to ensure it fits the container
    setTimeout(() => {
      this.angularGridWorkReport.resizerService?.resizeGrid();
    }, 50);

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

    // Resize grid immediately upon creation
    setTimeout(() => {
      this.angularGridTypeLink.resizerService?.resizeGrid();
    }, 50);
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
      // Không set size split khi click - chỉ lưu thông tin và load data
      this.projectId = item['ID'];
      this.projectCode = item['ProjectCode'];
      this.activeTab = 'workreport'; // Đặt lại tab đầu tiên

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
  }

  // Toggle hiển thị panel thông tin thêm
  toggleDetailPanel() {
    this.showDetailPanel = !this.showDetailPanel;
    if (this.showDetailPanel) {
      this.sizeTbMaster = '60%';
      this.sizeTbDetail = '40%';
      this.logSplitSizes('toggleDetailPanel(open)');

      // Clear datasets cũ trước khi load lại
      this.datasetWorkReport = [];
      this.datasetTypeLink = [];

      // Reload data khi mở panel
      if (this.projectId) {
        this.getProjectWorkReports();
        this.getProjectTypeLinks();
      }

      // Khi mở panel: đợi panel có kích thước, render grids
      setTimeout(() => {
        this.detailGridsReady = true;
        this.logSplitSizes('toggleDetailPanel(after detailGridsReady=true)');

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
      }, 300);
    } else {
      this.closePanel();
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
    this.showDetailPanel = false; // Đóng panel
    this.detailGridsReady = false; // Ẩn grids khi đóng panel
    // Clear datasets để tránh trùng id khi mở lại
    this.datasetWorkReport = [];
    this.datasetTypeLink = [];
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
      .getProjectsPagination(ajaxParams, 1, 999999)
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

    // Clear dataset cũ trước khi load mới
    this.datasetWorkReport = [];

    // Load data ngay cả khi grid chưa được tạo
    this.projectService.getProjectItemsData(this.projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [];

          // Đảm bảo id luôn duy nhất: dùng ID từ API, nếu trùng thì thêm index
          const usedIds = new Set<any>();
          // this.datasetWorkReport = dataArray.map((item: any, index: number) => {
          //   let id = item.ID !== undefined && item.ID !== null ? item.ID : index;
          //   // Nếu ID đã dùng, thêm index vào để tạo id duy nhất
          //   if (usedIds.has(id)) {
          //     id = `${id}_${index}`;
          //   }
          //   usedIds.add(id);
          //   return {
          //     ...item,
          //     id: id,
          //     STT: item.STT 
          //   };
          // });
          this.datasetWorkReport = dataArray.map((item: any, index: number) => ({
            ...item,
            id: index++,
            STT: item.STT
          }));

          // Kiểm tra unique id
          const ids = this.datasetWorkReport.map((item: any) => item.id);
          const uniqueIds = new Set(ids);
          if (ids.length !== uniqueIds.size) {
            console.error('[getProjectWorkReports] Duplicate IDs found:', ids);
            console.error('[getProjectWorkReports] Dataset:', this.datasetWorkReport);
          }

          // Refresh grid nếu đã được tạo
          if (this.angularGridWorkReport) {
            setTimeout(() => {
              try {
                this.angularGridWorkReport?.dataView?.refresh();
                this.angularGridWorkReport?.slickGrid?.invalidate();
              } catch (error) {
                console.error('Error refreshing grid:', error);
              }
            }, 100);
          }
        } else {
          this.datasetWorkReport = [];
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy dữ liệu work report:', err);
        this.datasetWorkReport = [];
      },
    });
  }

  getProjectTypeLinks() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetTypeLink = [];
      return;
    }

    // Clear dataset cũ trước khi load mới
    this.datasetTypeLink = [];

    // Load data ngay cả khi grid chưa được tạo
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        // Map data giống hệt menu-app: id và parentId
        this.datasetTypeLink = (response.data || []).map((x: any) => ({
          ...x,
          id: x.ID,
          parentId: x.ParentID == 0 ? null : x.ParentID
        }));

        // Kiểm tra unique id
        const ids = this.datasetTypeLink.map((item: any) => item.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          console.error('[getProjectTypeLinks] Duplicate IDs found:', ids);
          console.error('[getProjectTypeLinks] Dataset:', this.datasetTypeLink);
        }

        setTimeout(() => {
          this.applyDistinctFiltersTypeLink();
        }, 100);

        // Refresh grid nếu đã được tạo
        if (this.angularGridTypeLink?.dataView && this.angularGridTypeLink?.slickGrid) {
          setTimeout(() => {
            this.angularGridTypeLink.dataView.refresh();
            this.angularGridTypeLink.slickGrid.invalidate();
            this.angularGridTypeLink.slickGrid.render();
            this.angularGridTypeLink.resizerService?.resizeGrid();
          }, 100);
        }
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
      DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
  }

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toFormat('yyyy-MM-dd');
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
    try {
      if (!this.angularGrid || !this.angularGrid.dataView) {
        this.notification.error('Lỗi', 'Grid chưa sẵn sàng!');
        return;
      }

      // Use filtered data from DataView
      const data = this.angularGrid.dataView.getItems();
      if (!data || data.length === 0) {
        this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất excel!');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách dự án');

      // Use actual visible columns from SlickGrid
      const visibleCols = this.angularGrid.slickGrid.getColumns().filter(col => !col.excludeFromExport);

      // Safely get header names
      const headers = visibleCols.map(col => {
        if (typeof col.name === 'string') return col.name;
        // Fallback for non-string headers (e.g. HTML) - try specific extracted text or field name
        return col.field || '';
      });

      // --- 1. Title Row ---
      worksheet.mergeCells(1, 1, 1, visibleCols.length);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = 'DANH SÁCH DỰ ÁN';
      titleCell.font = { name: 'Times New Roman', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };

      // --- 2. Header Row ---
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
      for (let i = 0; i < visibleCols.length; i++) {
        const colIndex = i + 1;
        const column = worksheet.getColumn(colIndex);
        const colDef = visibleCols[i];

        let maxContentLength = 10;

        // Safe check for header name length
        if (typeof colDef.name === 'string') {
          maxContentLength = Math.max(maxContentLength, colDef.name.length);
        } else if (colDef.field) {
          maxContentLength = Math.max(maxContentLength, colDef.field.length);
        }

        // Check first 500 rows for content length
        const rowCountToCheck = Math.min(data.length, 500);
        for (let r = 0; r < rowCountToCheck; r++) {
          const val = data[r][colDef.field as string];
          if (val) {
            const strVal = val.toString();
            const lines = strVal.split('\n');
            lines.forEach((line: string) => {
              maxContentLength = Math.max(maxContentLength, line.length);
            });
          }
        }

        const cappedWidth = Math.min(60, maxContentLength + 3);
        column.width = cappedWidth;
      }

      // --- 5. Export ---
      const buffer = await workbook.xlsx.writeBuffer();
      const currentDate = new Date();
      const dateStr = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}`;
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DanhSachDuAn_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success('', this.createdText('Xuất Excel thành công!'));

    } catch (error) {
      console.error('Export Error:', error);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xuất Excel');
    }
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

          const modalRef = this.modal.create({
            nzTitle: 'Đường dẫn hệ thống',
            nzContent: FolderPathModalComponent,
            nzWidth: 700,
            nzOkText: 'Đóng',
            nzOnOk: () => true,
            nzData: {
              url: url,
              urlOnl: urlOnl
            }
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

    const modalRef = this.modalService.open(ProjectReportSlickGridComponent, {
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

    const modalRef = this.modalService.open(ProjectWokerSlickGridComponent, {
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

    const modalRef = this.modalService.open(ProjectPartListSlickGridComponent, {
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
  openProjectPartListWindow() {
    const selectedIDs = this.getSelectedIds();
    const selectedRows = this.getSelectedRows();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const projectId = this.projectId;
    const projectName = selectedRows[0]?.ProjectName;
    const projectCode = selectedRows[0]?.ProjectCode;

    const url = `/rerpweb/project-part-list?projectId=${projectId}&projectName=${encodeURIComponent(projectName)}&projectCode=${encodeURIComponent(projectCode)}&tbp=false`;
    window.open(url, '_blank', 'width=1280,height=960,resizable=yes');
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
  // private applyDistinctFilters(): void {
  //   const fieldsToFilter = [
  //     'ProjectStatusName', 'ProjectCode', 'ProjectName', 'EndUserName',
  //     'FullNameSale', 'FullNameTech', 'FullNamePM', 'BussinessField',
  //     'CurrentSituation', 'CustomerName', 'CreatedBy', 'UpdatedBy'
  //   ];
  //   this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, fieldsToFilter);
  // }

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
    const booleanFields = new Set([
      'NCCNew',
      'DeptSupplier',
      'IsBill',
      'OrderQualityNotMet',
    ]);

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
}
