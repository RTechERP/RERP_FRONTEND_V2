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
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import * as ExcelJS from 'exceljs';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectChangeComponent } from '../project-change/project-change.component';
import { ProjectStatusComponent } from '../project-status/project-status.component';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectEmployeeComponent } from '../project-employee/project-employee.component';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project-service/project.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthService } from '../../../auth/auth.service';
import { ProjectRequestComponent } from '../project-request/project-request.component';
import { ProjectWorkerSyntheticComponent } from '../project-department-summary/project-department-summary-form/project-worker-synthetic/project-worker-synthetic.component';
import { WorkItemComponent } from '../work-item/work-item.component';
import { ProjectCurrentSituationComponent } from '../project-current-situation/project-current-situation.component';
import { ProjectPartlistProblemComponent } from '../project-partlist-problem/project-partlist-problem.component';
import { ProjectHistoryProblemComponent } from '../project-history-problem/project-history-problem.component';
import { ProjectTypeLinkDetailComponent } from '../project-type-link-detail/project-type-link-detail.component';
import { PermissionService } from '../../../services/permission.service';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';
import { ProjectPartListSlickGridComponent } from '../project-part-list-slick-grid/project-part-list-slick-grid.component';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule as PButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { NOTIFICATION_TITLE } from '../../../app.config';

import { MenuItem, PrimeIcons } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTableModule } from 'primeng/treetable';
import { ProjectReportSlickGridComponent } from '../project-report-slick-grid/project-report-slick-grid.component';
import { ProjectWokerSlickGridComponent } from '../project-woker-slick-grid/project-woker-slick-grid.component';
import { TabServiceService } from '../../../layouts/tab-service.service';


@Component({
  selector: 'app-project-dept-summary-prime-ng2',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzGridModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzDropDownModule,
    NzSpinModule,
    CommonModule,
    HasPermissionDirective,
    MenubarModule,
    ContextMenuModule,
    TooltipModule,
    TreeTableModule,
    TableModule,
    PButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    CheckboxModule,
    SelectModule,
    TagModule,
    NzModalModule,
    NzNotificationModule,
    NgbModalModule,
    RouterModule
  ],
  templateUrl: './project-dept-summary-prime-ng2.component.html',
  styleUrl: './project-dept-summary-prime-ng2.component.css'
})
export class ProjectDeptSummaryPrimeNg2Component implements OnInit, AfterViewInit, OnDestroy {

  private searchSubject = new Subject<string>();
  showSearchBar: boolean = true;
  isMobile: boolean = false;
  menuItems: MenuItem[] = [];
  showSearchModal: boolean = false;
  private filterSubject = new Subject<any[]>();
  private destroy$ = new Subject<void>();
  private fullStatusFilterOptions: any[] = [];
  contextMenuItems: MenuItem[] = [];
  selectedContextRow: any;
  isLoading: boolean = false;
  isWorkReportLoading: boolean = false;
  isTypeLinkLoading: boolean = false;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('dtProjects') dtProjects: Table | undefined;
  @ViewChild('dtWorkReport') dtWorkReport: Table | undefined;
  @ViewChild('dtTypeLink') dtTypeLink: Table | undefined;

  @ViewChild('statusDateModalContent', { static: false })
  statusDateModalContent!: any;

  selected = '';
  options = [
    { label: 'Mới', value: 'new' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Hoàn thành', value: 'done' },
  ];

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private permissionService: PermissionService,
    private tabService: TabServiceService,
  ) {
    this.searchSubject
      .subscribe(() => {
        this.searchProjects();
      });

    this.filterSubject
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe((filteredValue) => {
        this.updateStatusFilterOptions(filteredValue);
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
  statusFilterOptions: { label: string; value: string }[] = [];

  selectedRows: any[] = [];
  selectedRowsWorkReport: any[] = [];
  selectedRowsTypeLink: any[] = [];

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
  employeeId: any;
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

  departmentID: any = 2;
  userTeamID: any = 0;
  userID: any = 0;
  departments: any[] = [];
  teams: any[] = [];
  //#endregion

  // Helper function to escape HTML special characters for title attributes
  private escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  //#region Lifecycle hooks
  ngOnInit(): void {
    this.updateResponsiveState();
    this.initMenuItems();
    this.initContextMenu();
    this.isLoading = true;

    this.getProjectStatus();
    this.getProjectTypes();
    this.getBusinessFields();
    this.getCustomers();
    this.getPms();
    //this.getUsers();
    this.getCurrentUser();
    this.setDefautSearch();
    this.getDepartment();
    this.getUserTeam();

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
    // All data loading is handled in ngOnInit to avoid duplicate API calls
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }
  //#endregion

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateResponsiveState();
  }

  initMenuItems(): void {
    const hasPermission = this.permissionService.hasPermission('N1,N13,N27');
    const allItems: MenuItem[] = [
      {
        label: 'Ds báo cáo CV',
        icon: 'fa-solid fa-list fa-lg text-warning',
        command: () => this.openProjectWorkReportModal(),
      },
      {
        label: 'Online',
        icon: 'fa-solid fa-sitemap fa-lg text-success',
        command: () => this.openFolder('online'),
      },
      {
        label: 'Nội bộ',
        icon: 'fa-solid fa-sitemap fa-lg text-primary',
        command: () => this.openFolder('noi_bo'),
      },
      {
        label: 'Hạng mục CV',
        icon: 'fa-solid fa-briefcase fa-lg text-success',
        command: () => this.openWorkItemModal(),
      },
      {
        label: 'Nhân công dự án',
        icon: 'fa-solid fa-users fa-lg text-primary',
        command: () => this.openProjectWorkerModal(),
      },
      {
        label: 'Danh mục vật tư',
        icon: 'fa-solid fa-box fa-lg text-warning',
        command: () => this.openProjectPartListTab(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportToExcel(),
      },
      {
        label: 'Thông tin thêm',
        icon: this.showDetailPanel
          ? 'fa-solid fa-eye fa-lg text-info'
          : 'fa-solid fa-eye-slash fa-lg text-primary',
        command: () => this.toggleDetailPanel(),
      },
    ];

    this.menuItems = allItems.filter(item => item.visible !== false);
  }

  //#region Excel Export
  exportToExcel(): void {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách dự án');

      // Define columns
      const cols = [
        { header: 'Trạng thái', key: 'ProjectStatusName', width: 15 },
        { header: 'Ưu tiên', key: 'PriotityText', width: 12 },
        { header: 'Ưu tiên cá nhân', key: 'PersonalPriotity', width: 15 },
        { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
        { header: 'End User', key: 'EndUserName', width: 25 },
        { header: 'Tên dự án', key: 'ProjectName', width: 40 },
        { header: 'Kinh doanh', key: 'FullNameSale', width: 20 },
        { header: 'Kỹ thuật', key: 'FullNameTech', width: 20 },
        { header: 'PM', key: 'FullNamePM', width: 20 },
        { header: 'Tình hình hiện tại', key: 'CurrentSituation', width: 40 },
      ];

      worksheet.columns = cols;

      // Header style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E75B6' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data
      this.dataset.forEach(item => {
        worksheet.addRow(item);
      });

      // Data style
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // Export
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Danh_sach_du_an_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });

      this.notification.success('Thành công', `Xuất excel thành công!`);
    } catch (error) {
      console.error('Excel export error:', error);
      this.notification.error('Lỗi', 'Không thể export file Excel');
    }
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

  private initContextMenu(): void {
    this.contextMenuItems = [
      {
        label: 'Mức độ ưu tiên cá nhân',
        icon: 'pi pi-star-fill',
        items: [
          { label: '1', command: () => this.setPersionalPriority(1) },
          { label: '2', command: () => this.setPersionalPriority(2) },
          { label: '3', command: () => this.setPersionalPriority(3) },
          { label: '4', command: () => this.setPersionalPriority(4) },
          { label: '5', command: () => this.setPersionalPriority(5) }
        ]
      },
      {
        label: 'Người tham gia',
        icon: 'pi pi-users',
        command: () => this.openProjectEmployee()
      },
      {
        label: 'Chuyển báo cáo công việc',
        icon: 'pi pi-directions',
        command: () => this.changeProject()
      },
      {
        label: 'Hàng phát sinh',
        icon: 'pi pi-plus-circle',
        command: () => this.openProjectPartListProblemModal()
      },
      {
        label: 'Yêu cầu - Giải pháp',
        icon: 'pi pi-question-circle',
        command: () => this.openProjectRequest()
      },
      {
        label: 'Cập nhật Leader',
        icon: 'pi pi-user-edit',
        command: () => this.openProjectTypeLinkDetail()
      },
      {
        label: 'Trạng thái dự án',
        icon: 'pi pi-cog',
        visible: this.permissionService.hasAnyPermission(['N1', 'N13', 'N27']),
        command: () => this.openProjectStatus()
      },
      {
        label: 'Cập nhật hiện trạng',
        icon: 'pi pi-refresh',
        visible: this.permissionService.hasAnyPermission(['N1', 'N13', 'N27']),
        command: () => this.openUpdateCurrentSituation()
      },
    ];
  }

  private updateContextMenuStatusItems() {
    // Luôn khởi tạo lại cấu trúc gốc để đảm bảo các thuộc tính (icon, label) đồng bộ
    this.initContextMenu();

    if (!this.contextMenuItems || !this.projectStatuses || this.projectStatuses.length === 0) {
      return;
    }

    const items = [...this.contextMenuItems];
    const statusMenu = items.find(m => m.label && m.label.includes('Cập nhật trạng thái'));

    if (statusMenu) {
      // Đổ list trạng thái vào items của menu cha
      statusMenu.items = this.projectStatuses.map(status => ({
        label: status.StatusName,
        command: (event: any) => {
          // Ngăn chặn sự kiện nổi bọt nếu cần và gọi hàm xử lý
          this.selectProjectStatus(status.ID);
        }
      }));

      // Đồng bộ trạng thái hiển thị
      statusMenu.visible = this.permissionService.hasAnyPermission(['N1', 'N13', 'N27']);

      // Thay thế chính menu cha bằng clone của nó để PrimeNG nhận diện thay đổi submenu
      const index = items.indexOf(statusMenu);
      if (index > -1) {
        items[index] = { ...statusMenu };
      }
    }

    this.contextMenuItems = items;
  }

  onRowContextMenu(event: any): void {
    this.selectedContextRow = event.data;
    // Đồng bộ selection khi chuột phải
    this.handleRowClick(event.data);

    // Cập nhật lại list trạng thái ngay thời điểm chuột phải
    this.updateContextMenuStatusItems();
  }

  //#endregion

  // Tô màu dòng cho work report trong PrimeNG
  rowStyleWorkReportPrime(item: any) {
    if (!item) return {};

    const itemLate = parseInt(item['ItemLateActual'] || '0', 10);
    const totalDayExpridSoon = parseInt(item['TotalDayExpridSoon'] || '0', 10);
    const hasEndDate = item['ActualEndDate'] && DateTime.fromISO(item['ActualEndDate']).isValid;

    if (itemLate === 1) {
      return { 'background-color': 'lightyellow' };
    } else if (itemLate === 2) {
      return { 'background-color': 'orange', 'color': 'white' };
    } else if (totalDayExpridSoon <= 3 && !hasEndDate) {
      return { 'background-color': 'mistyrose' };
    }

    return {};
  }

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
    // Chỉ thu nhỏ panel, giữ nguyên chế độ showDetailPanel
    this.sizeTbMaster = '100%';
    this.sizeTbDetail = '0';
    this.detailGridsReady = false;
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
    if (tab === 'workreport') {
      this.getWorkReports();
    } else if (tab === 'typelink') {
      this.getProjectTypeLinks();
    }
  }

  handleRowClick(rowData: any): void {
    if (!rowData) return;
    this.selectedRow = rowData;
    this.projectId = rowData.ID;
    this.projectCode = rowData.ProjectCode;
    this.getProjectTypeLinks();

    // Chỉ mở panel khi chế độ "thông tin thêm" đang bật
    if (this.showDetailPanel) {
      this.sizeTbMaster = '60%';
      this.sizeTbDetail = '40%';
      this.detailGridsReady = true;
      this.getWorkReports();
      if (this.activeTab === 'typelink') {
        this.getProjectTypeLinks();
      }
    }
  }

  private collapseAllChildren(item: any): void {
    if (item.children) {
      item.children.forEach((child: any) => {
        child.expanded = false;
        this.collapseAllChildren(child);
      });
    }
  }

  toggleTypeLinkNode(item: any): void {
    item.expanded = !item.expanded;
    this.updateVisibleTypeLinks();
  }

  private updateVisibleTypeLinks(): void {
    const visible: any[] = [];
    const addNode = (node: any) => {
      visible.push(node);
      if (node.expanded && node.children) {
        node.children.forEach(addNode);
      }
    };

    // Mảng gốc (tree)
    const tree = this.buildTree(this.datasetTypeLinkFull);
    tree.forEach(addNode);
    this.datasetTypeLink = visible;
  }

  private buildTree(flatData: any[]): any[] {
    const map = new Map();
    const tree: any[] = [];

    flatData.forEach(item => {
      if (!item.children) item.children = [];
      map.set(item.ID, item);
    });

    flatData.forEach(item => {
      const node = map.get(item.ID);
      node.children = []; // Reset children for each rebuild
    });

    flatData.forEach(item => {
      const node = map.get(item.ID);
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
          node.treeLevel = (parent.treeLevel || 0) + 1;
        } else {
          node.treeLevel = 0;
          if (!tree.includes(node)) tree.push(node);
        }
      } else {
        node.treeLevel = 0;
        if (!tree.includes(node)) tree.push(node);
      }
    });

    return tree;
  }

  datasetTypeLinkFull: any[] = [];

  toggleDetailPanel() {
    this.showDetailPanel = !this.showDetailPanel;
    if (this.showDetailPanel) {
      // Nếu có row đang chọn thì mở panel
      if (this.projectId) {
        this.sizeTbMaster = '60%';
        this.sizeTbDetail = '40%';
        this.detailGridsReady = true;
        this.getWorkReports();
        if (this.activeTab === 'typelink') {
          this.getProjectTypeLinks();
        }
      }
    } else {
      this.sizeTbMaster = '100%';
      this.sizeTbDetail = '0';
      this.detailGridsReady = false;
    }
    // Cập nhật icon menu
    this.initMenuItems();
  }

  getSelectedRows(): any[] {
    if (this.selectedRow && !Array.isArray(this.selectedRow)) {
      return [this.selectedRow];
    }
    return this.selectedRows || [];
  }

  getSelectedIds(): number[] {
    const rows = this.getSelectedRows();
    return rows.map((row: any) => row.ID);
  }

  handleTableFilter(event: any): void {
    // Không cập nhật lại danh sách tuỳ chọn filter (statusFilterOptions)
    // dựa trên dữ liệu đang được filter để người dùng có thể chọn nhiều trạng thái.
  }

  private updateStatusFilterOptions(sourceData?: any[]): void {
    // Luôn giữ đầy đủ danh sách trạng thái, không bị thu hẹp theo dataset được filter
    if (this.fullStatusFilterOptions && this.fullStatusFilterOptions.length > 0) {
      this.statusFilterOptions = [...this.fullStatusFilterOptions];
    }
  }

  private initFullStatusFilterOptions(): void {
    if (!this.projectStatuses || this.projectStatuses.length === 0) {
      this.fullStatusFilterOptions = [];
      return;
    }
    this.fullStatusFilterOptions = this.projectStatuses.map((s: any) => ({
      label: s.StatusName,
      value: s.StatusName
    })).sort((a: any, b: any) => a.label.localeCompare(b.label));

    // Set initial options as full
    this.statusFilterOptions = [...this.fullStatusFilterOptions];
  }

  private enrichProjects(projects: any[]): any[] {
    return projects.map((item: any, index: number) => {
      let statusName = item.ProjectStatusName || item.StatusName;
      let statusColor = item.ProjectStatusColor;

      if (!statusName && item.ProjectStatusID && this.projectStatuses.length > 0) {
        const statusObj = this.projectStatuses.find((s: any) =>
          s.ID === item.ProjectStatusID || s.StatusID === item.ProjectStatusID
        );
        if (statusObj) {
          statusName = statusObj.StatusName;
          statusColor = statusObj.StatusColor;
        }
      }

      return {
        ...item,
        id: item.ID,
        _uid: `${item.ID}_${index}`, // unique key tránh trùng khi 2 dòng có cùng ID
        STT: index + 1,
        ProjectStatusName: statusName,
        ProjectStatusColor: statusColor
      };
    });
  }

  /**
   * Remove a single row from the local dataset (UI-only, no API call).
   * Also deselects the row if it was selected.
   */
  removeRow(rowData: any): void {
    this.dataset = this.dataset.filter(item => item.ID !== rowData.ID);
    this.selectedRows = this.selectedRows.filter(item => item.ID !== rowData.ID);
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
    this.isLoading = true;
    const dateStart = DateTime.fromJSDate(
      new Date(this.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.dateEnd));
    let projectTypeStr = '';
    if (this.projectTypeIds?.length > 0) {
      projectTypeStr = this.projectTypeIds.join(',');
    }
    let projectStatusStr = '';
    if (this.projecStatusIds?.length > 0) {
      projectStatusStr = this.projecStatusIds.join(',');
    }

    let userId =
      this.users
        .flatMap((x: any) => x.options)
        .find((x: any) => x.item.ID === this.employeeId)
        ?.item.UserID || 0;

    this.projectService
      .getProjectSummary(
        dateStart,
        dateEnd,
        this.departmentID,
        userId,
        projectTypeStr,
        this.keyword.trim() || '',
        this.userTeamID
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            const projects = res.data || [];
            this.dataset = this.enrichProjects(projects);
            this.isLoading = false;
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

  getWorkReports() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetWorkReport = [];
      return;
    }

    this.datasetWorkReport = [];
    this.isWorkReportLoading = true;

    this.projectService.getProjectItemsData(this.projectId).subscribe({
      next: (res: any) => {
        this.isWorkReportLoading = false;
        if (res?.data) {
          const reports = res.data || [];
          this.datasetWorkReport = reports.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1
          }));
        } else {
          this.datasetWorkReport = [];
        }
      },
      error: (err: any) => {
        this.isWorkReportLoading = false;
        console.error('Lỗi khi lấy dữ liệu work report:', err);
        this.datasetWorkReport = [];
      },
    });
  }

  getProjectTypeLinks() {
    if (!this.projectId || this.projectId === 0) {
      this.datasetTypeLink = [];
      this.datasetTypeLinkFull = [];
      return;
    }

    this.isTypeLinkLoading = true;
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        this.isTypeLinkLoading = false;
        this.datasetTypeLinkFull = (response.data || []).map((x: any) => ({
          ...x,
          id: x.ID,
          ParentID: x.ParentID,
          expanded: true // Mặc định mở hết
        }));
        this.updateVisibleTypeLinks();
      },
      error: (error) => {
        this.isTypeLinkLoading = false;
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
        if (response?.data) {
          this.projecStatuses = response.data;
          this.projectStatuses = response.data || [];
          this.initFullStatusFilterOptions();

          // Sync context menu after loading statuses
          this.updateContextMenuStatusItems();

          // Sau khi có Status mới load Project để đảm bảo không bị trống text
          this.searchProjects();
        }
      },
      error: (error) => {
        console.error('Error fetching project status:', error);
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
    this.employeeId = 0;
    this.keyword = '';
    this.savedPage = 0;
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }


  ToggleSearchPanelNew(): void {
    this.showSearchBar = !this.showSearchBar;
  }
  //#endregion

  //#region Context menu actions
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

  //#endregion

  //#region Modal openers
  openFolder(type: 'online' | 'noi_bo') {
    const selectedIDs = this.getSelectedIds();
    if (selectedIDs.length == 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    const projectId = selectedIDs[0];
    let selectedProjectTypeIds: number[] = [];

    this.datasetTypeLinkFull.forEach((row: any) => {
      if (row.Selected === true && row.ID) {
        selectedProjectTypeIds.push(row.ID);
      }
    });

    if (selectedProjectTypeIds.length === 0) {
      const projectCode = this.selectedRow?.ProjectCode || '';
      const msg = projectCode
        ? `Dự án ${projectCode} chưa có kiểu dự án nên chưa có thư mục trên server!`
        : 'Dự án chưa có kiểu dự án nên chưa có thư mục trên server!';
      this.notification.error('Thông báo', msg);
      return;
    }

    this.projectService.createProjectTree(projectId, selectedProjectTypeIds).subscribe({
      next: (response: any) => {
        if (response.status == 1 && response.data) {
          const textToCopy = type === 'online' ? response.data.urlOnl : response.data.url;
          if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
              this.notification.success('Thông báo', `Đã copy đường dẫn ${type === 'online' ? 'Online' : 'Nội bộ'} vào clipboard!`);
            }).catch(err => {
              this.notification.error('Lỗi', 'Không thể copy vào clipboard: ' + err);
            });
          } else {
            this.notification.error('Thông báo', 'Đường dẫn trống!');
          }
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
    if (!this.projectId || this.projectId === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectEmployeeComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = this.projectId;

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
  openProjectPartListTab() {
    const selectedIDs = this.getSelectedIds();
    const selectedRows = this.getSelectedRows();

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const projectName = selectedRows[0]?.ProjectName;
    const projectCode = selectedRows[0]?.ProjectCode;

    // Mở như tab thực sự thông qua TabService
    this.tabService.openTabComp({
      comp: ProjectPartListSlickGridComponent,
      title: `Danh mục vật tư - ${projectCode}`,
      key: `project-part-list-${this.projectId}`,
      data: {
        projectId: this.projectId,
        projectNameX: projectName,
        projectCodex: projectCode,
        tbp: false
      }
    });
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

  getUserTeam() {
    this.teams = [];
    if (this.departmentID > 0) {
      this.projectService
        .getUserTeam(this.departmentID)
        .subscribe({
          next: (response: any) => {
            this.teams = response.data || [];
          },
          error: (error) => {
            console.error('Lỗi:', error);
          },
        });
    } else {
      this.userTeamID = 0;
      this.users = [];
    }
  }

  getEmployeesByTeam() {
    this.users = [];
    if (this.userTeamID > 0) {
      this.projectService
        .getEmployeeByUserTeam(this.userTeamID)
        .subscribe({
          next: (response: any) => {
            const employees = response.data || [];
            if (employees.length > 0 && employees[0].DepartmentName) {
              this.users = this.projectService.createdDataGroup(
                employees,
                'DepartmentName'
              );
              console.log(this.users);
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
      this.userID = 0;
    }
  }

  //#region Hàm xử lý bổ sung
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


  //#endregion
}