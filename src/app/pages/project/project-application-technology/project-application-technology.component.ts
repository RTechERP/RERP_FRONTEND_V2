import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule as PButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TreeNode, FilterService, MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { CustomTreeTable } from '../../../shared/custom-tree-table/custom-tree-table';
import { TreeColumnDef, EditLookupConfig } from '../../../shared/custom-tree-table/tree-column-def.model';
import { ProjectService } from '../project-service/project.service';
import { AuthService } from '../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DateTime } from 'luxon';
import { PermissionService } from '../../../services/permission.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectTechnologyFormComponent } from '../project-application-types/project-technology-form/project-technology-form.component';
import { ProjectApplicationTypesFormComponent } from '../project-application-types/project-application-types-form/project-application-types-form.component';

@Component({
  selector: 'app-project-application-technology',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzGridModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzNotificationModule,
    NzModalModule,
    NzDropDownModule,
    NzDatePickerModule,
    TableModule,
    PButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    CheckboxModule,
    SelectModule,
    TagModule,
    MenubarModule,
    CustomTreeTable
  ],
  templateUrl: './project-application-technology.component.html',
  styleUrls: ['./project-application-technology.component.css']
})
export class ProjectApplicationTechnologyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Layout states
  sizeSearch: string = '0';
  sizeTbMaster: string = '100%';
  sizeTbDetail: string = '0';
  showDetailPanel: boolean = false;
  showSearchBar: boolean = true;
  isMobile: boolean = false;
  isModalVisible: boolean = false;
  menuItems: MenuItem[] = [];

  // Master lists & query variables
  dataset: any[] = [];
  masterDataset: any[] = [];
  customers: any[] = [];
  projectStatuses: any[] = [];
  projecStatuses: any[] = [];
  applicationTypes: any[] = [];
  technologies: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  statusFilterOptions: { label: string; value: string }[] = [];
  fullStatusFilterOptions: any[] = [];

  // Current states
  selectedRow: any = null;
  projectId: number = 0;
  cachedProjectHeader: any = null;
  cachedFollowProjectBase: any = null;
  currentUser: any = null;

  // Search parameters
  isHide: boolean = true;
  dateStart: string = DateTime.local()
    .minus({ years: 1 })
    .startOf('year')
    .toFormat('yyyy-MM-dd');
  dateEnd: string = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toFormat('yyyy-MM-dd');
  customerId: any = null;
  userId: any = null;
  pmId: any = null;
  businessFieldId: any = null;
  technicalId: any = null;
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  keyword: string = '';
  selectedAppTypeIds: any[] = [null];
  selectedTechIds: any[] = [null];

  // Pagination & Loading
  isLoading: boolean = false;
  isDetailLoading: boolean = false;
  isSaving: boolean = false;
  totalRecords: number = 0;
  pageSize: number = 100;
  readonly projectVirtualRowHeight = 44;
  readonly projectVirtualScrollOptions = {
    lazy: false,
    showLoader: false,
    numToleratedItems: 30,
    resizeDelay: 50,
  };
  readonly trackProjectById = (index: number, row: any): any => row?.ID ?? row?.id ?? index;
  currentPage: number = -1;

  // Detail panel tree table configuration
  projectTypeNodes: TreeNode[] = [];
  selectedTypeNodes: TreeNode[] = [];
  projectTypeCols: TreeColumnDef[] = [];
  projectUserTeams: any[] = [];
  leaderLookupConfig!: EditLookupConfig;
  appLookupConfig!: EditLookupConfig;
  techLookupConfig!: EditLookupConfig;

  @ViewChild('dtProjects') dtProjects: Table | undefined;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private notification: NzNotificationService,
    private modalService: NzModalService,
    private permissionService: PermissionService,
    private ngbModal: NgbModal,
  ) { }


  ngOnInit(): void {
    this.isLoading = true;
    this.getCurrentUser();
    this.getCustomers();
    this.getProjectStatus();
    this.getProjectTypes();
    this.getBusinessFields();
    this.getPms();
    this.getUsers();
    this.getUserTeams();
    this.getApplicationTypes();
    this.getTechnologies();
    this.setDefautSearch();
    this.initMenuItems();
    this.searchProjects(1, this.pageSize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Retrieve current user
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
  }

  // Load Lookup Catalogs
  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (res: any) => {
        this.customers = res.data || [];
      }
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (res: any) => {
        this.projecStatuses = res.data || [];
        this.projectStatuses = res.data || [];
        this.initFullStatusFilterOptions();
      }
    });
  }

  getProjectTypes() {
    this.projectService.getProjectTypes().subscribe({
      next: (response: any) => {
        this.projectTypes = response.data || [];
      }
    });
  }

  getBusinessFields() {
    this.projectService.getBusinessFields().subscribe({
      next: (response: any) => {
        this.businessFields = response.data || [];
      }
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      }
    });
  }

  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      }
    });
  }

  initFullStatusFilterOptions(): void {
    if (!this.projectStatuses || this.projectStatuses.length === 0) {
      this.fullStatusFilterOptions = [];
      return;
    }
    this.fullStatusFilterOptions = this.projectStatuses.map((s: any) => ({
      label: s.StatusName,
      value: s.StatusName
    })).sort((a: any, b: any) => a.label.localeCompare(b.label));

    this.statusFilterOptions = [...this.fullStatusFilterOptions];
  }

  getDay() {
    // Console log for date change triggers
  }

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .startOf('year')
      .toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toFormat('yyyy-MM-dd');
    this.projectTypeIds = [];
    this.projecStatusIds = [];
    this.userId = null;
    this.pmId = null;
    this.businessFieldId = null;
    this.technicalId = null;
    this.customerId = null;
    this.keyword = '';
    this.selectedAppTypeIds = [null];
    this.selectedTechIds = [null];
  }

  ToggleSearchPanelNew(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  getUserTeams() {
    this.projectService.getUserTeams().subscribe({
      next: (response: any) => {
        this.projectUserTeams = response.data || [];
        this.updateLookupConfigs();
      }
    });
  }

  getApplicationTypes(projectTypeIds?: string) {
    this.projectService.getApplicationTypes(projectTypeIds).subscribe({
      next: (res: any) => {
        this.applicationTypes = res.data || [];
        this.updateLookupConfigs();
      }
    });
  }

  getTechnologies(projectTypeIds?: string) {
    this.projectService.getTechnologies(projectTypeIds).subscribe({
      next: (res: any) => {
        this.technologies = res.data || [];
        this.updateLookupConfigs();
      }
    });
  }

  onProjectTypeChange() {
    const idsStr = this.projectTypeIds && this.projectTypeIds.length > 0
      ? this.projectTypeIds.filter(id => id !== null && id !== undefined && id !== 0).join(',')
      : '';
    this.getApplicationTypes(idsStr);
    this.getTechnologies(idsStr);
  }

  // TN.Bình update 15/04/26: Hàm mở modal thêm mới kiểu ứng dụng
  openAddApplicationTypeModal(rowData: any) {
    const modalRef = this.ngbModal.open(ProjectApplicationTypesFormComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'high-zindex-modal',
      backdropClass: 'high-zindex-backdrop'
    });
    // Truyền ProjectTypeID hiện tại vào modal
    modalRef.componentInstance.projectTypeID = rowData?.ProjectTypeID || rowData?.ID || 0;
    modalRef.result.then((result) => {
      // result = hasSaved flag từ NgbActiveModal.close()
      if (result) {
        this.getApplicationTypes(); // Load lại dữ liệu combobox sau khi thêm mới
      }
    }).catch((res) => {
      // Catch trường hợp đóng modal bằng cách khác nhưng vẫn cần reload nếu res = true
      if (res === true) this.getApplicationTypes();
    });
  }

  // TN.Bình update 15/04/26: Hàm mở modal thêm mới công nghệ
  openAddTechnologyModal(rowData: any) {
    const modalRef = this.ngbModal.open(ProjectTechnologyFormComponent, {
      size: 'lg',
      backdrop: 'static',
      windowClass: 'high-zindex-modal',
      backdropClass: 'high-zindex-backdrop'
    });
    // Truyền ProjectTypeID hiện tại vào modal
    modalRef.componentInstance.projectTypeID = rowData?.ProjectTypeID || rowData?.ID || 0;
    modalRef.result.then((result) => {
      if (result) {
        this.getTechnologies(); // Load lại dữ liệu combobox sau khi thêm mới
      }
    }).catch((res) => {
      if (res === true) this.getTechnologies();
    });
  }

  // Initialize and Update Lookup Editor Settings for custom-tree-table
  initLookupConfigs() {
    this.leaderLookupConfig = {
      data: this.projectUserTeams,
      columns: [
        { field: 'Code', header: 'Mã nhân viên', width: '120px' },
        { field: 'FullName', header: 'Họ tên' }
      ],
      valueField: 'EmployeeID',
      displayField: 'FullName'
    };

    this.appLookupConfig = {
      data: this.applicationTypes,
      columns: [
        { field: 'ApplicationName', header: 'Tên kiểu ứng dụng' },
        { field: 'Descriptions', header: 'Mô tả' }
      ],
      valueField: 'ID',
      displayField: 'ApplicationName',
      multiSelect: true,
      addAction: (rowData: any) => this.openAddApplicationTypeModal(rowData),
      loadData: (query: string, rowData?: any) => {
        const typeId = rowData?.ProjectTypeID || rowData?.ID;
        let filtered = this.applicationTypes.filter(x => x.ProjectTypeID === typeId);
        if (query) {
          query = query.toLowerCase();
          filtered = filtered.filter(x => x.ApplicationName?.toLowerCase().includes(query));
        }
        return filtered;
      }
    };

    this.techLookupConfig = {
      data: this.technologies,
      columns: [
        { field: 'TechnologyName', header: 'Tên công nghệ' },
        { field: 'Descriptions', header: 'Mô tả' }
      ],
      valueField: 'ID',
      displayField: 'TechnologyName',
      multiSelect: true,
      addAction: (rowData: any) => this.openAddTechnologyModal(rowData),
      loadData: (query: string, rowData?: any) => {
        const typeId = rowData?.ProjectTypeID || rowData?.ID;
        let filtered = this.technologies.filter(x => x.ProjectTypeID === typeId);
        if (query) {
          query = query.toLowerCase();
          filtered = filtered.filter(x => x.TechnologyName?.toLowerCase().includes(query));
        }
        return filtered;
      }
    };

    this.projectTypeCols = [
      { field: 'ProjectTypeName', header: 'Kiểu dự án', treeToggler: true, width: '200px' },
      {
        field: 'FullName',
        header: 'Leader',
        width: '180px',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'table-lookup',
        editLookupConfig: this.leaderLookupConfig
      },
      {
        field: 'ApplicationTypeIDs',
        header: 'Kiểu ứng dụng',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'table-lookup',
        editLookupConfig: this.appLookupConfig
      },
      {
        field: 'TechnologyIDs',
        header: 'Công nghệ ứng dụng',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'table-lookup',
        editLookupConfig: this.techLookupConfig
      }
    ];
  }

  updateLookupConfigs() {
    if (this.applicationTypes.length && this.technologies.length && this.projectUserTeams.length) {
      this.initLookupConfigs();
    } else if (this.applicationTypes.length && this.technologies.length && !this.leaderLookupConfig) {
      // Init even without teams to avoid undefined errors, teams will update later
      this.initLookupConfigs();
    }
  }

  getProjectAjaxParams() {
    const projectTypeStr =
      this.projectTypeIds?.length > 0 ? this.projectTypeIds.join(',') : '';
    const projectStatusStr =
      this.projecStatusIds?.length > 0 ? this.projecStatusIds.join(',') : '';
    const appTypeStr =
      this.selectedAppTypeIds?.length > 0 && !this.selectedAppTypeIds.includes(null)
        ? this.selectedAppTypeIds.filter(x => x !== null && x !== undefined).join(',')
        : '';
    const techStr =
      this.selectedTechIds?.length > 0 && !this.selectedTechIds.includes(null)
        ? this.selectedTechIds.filter(x => x !== null && x !== undefined).join(',')
        : '';

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
      applicationType: appTypeStr,
      technology: techStr,
    };
  }

  private enrichProjects(projects: any[], page: number = 1, size: number = 50): any[] {
    return projects.map((item: any, index: number) => {
      let statusName = item.ProjectStatusName || item.StatusName;
      let statusColor = item.ProjectStatusColor;

      const statusId = item.ProjectStatusID ?? item.ProjectStatus;
      if (!statusName && statusId && this.projectStatuses.length > 0) {
        const statusObj = this.projectStatuses.find((s: any) =>
          s.ID === statusId || s.StatusID === statusId
        );
        if (statusObj) {
          statusName = statusObj.StatusName;
          statusColor = statusObj.StatusColor;
        }
      }

      return {
        ...item,
        id: item.ID,
        STT: (page - 1) * size + index + 1,
        ProjectStatusName: statusName,
        ProjectStatusColor: statusColor
      };
    });
  }

  applyLocalFilterAndSort(event: any): void {
    if (!this.masterDataset || this.masterDataset.length === 0) {
      this.dataset = [];
      return;
    }

    let filteredData = [...this.masterDataset];

    // 1. Filter processing
    if (event.filters) {
      filteredData = filteredData.filter(item => {
        return Object.keys(event.filters).every(field => {
          const filterConstraint = event.filters[field][0] || event.filters[field];
          const filterValue = filterConstraint.value;
          const filterMatchMode = filterConstraint.matchMode || 'contains';

          if (filterValue === null || filterValue === undefined || filterValue === '') {
            return true;
          }

          let itemValue = item[field];

          if (field === 'ProjectStatusName' && Array.isArray(filterValue)) {
            return filterValue.includes(itemValue);
          }

          if (itemValue === null || itemValue === undefined) return false;

          const sItemValue = String(itemValue).toLowerCase();
          const sFilterValue = String(filterValue).toLowerCase();

          switch (filterMatchMode) {
            case 'contains': return sItemValue.includes(sFilterValue);
            case 'startsWith': return sItemValue.startsWith(sFilterValue);
            case 'endsWith': return sItemValue.endsWith(sFilterValue);
            case 'equals': return sItemValue === sFilterValue;
            case 'notContains': return !sItemValue.includes(sFilterValue);
            default: return sItemValue.includes(sFilterValue);
          }
        });
      });
    }

    // 2. Sort processing
    if (event.sortField) {
      const field = event.sortField;
      const order = event.sortOrder || 1;
      filteredData.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA == null) return 1;
        if (valB == null) return -1;
        const result = valA < valB ? -1 : valA > valB ? 1 : 0;
        return result * order;
      });
    }

    this.dataset = filteredData;
  }

  // Load Projects master list
  searchProjects(page: number = 1, size: number = 100) {
    this.isLoading = true;
    this.currentPage = page;
    this.pageSize = size;

    const ajaxParams = this.getProjectAjaxParams();
    this.projectService
      .getProjectsAppTechPagination(ajaxParams, page, size)
      .subscribe({
        next: (res: any) => {
          if (res?.data) {
            const projects = res.data.project || [];
            this.masterDataset = this.enrichProjects(projects, page, size);

            if (this.dtProjects && this.dtProjects.filters) {
              this.applyLocalFilterAndSort({
                filters: this.dtProjects.filters,
                sortField: this.dtProjects.sortField,
                sortOrder: this.dtProjects.sortOrder
              });
            } else {
              this.dataset = [...this.masterDataset];
            }

            const totalPage = res.data.totalPage || 1;
            this.totalRecords = totalPage * size;
          } else {
            this.masterDataset = [];
            this.dataset = [];
            this.totalRecords = 0;
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading project data:', err);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu dự án');
          this.isLoading = false;
        }
      });
  }

  loadProjectsLazy(event: TableLazyLoadEvent): void {
    if (event.last !== undefined && event.last !== null) {
      if (this.currentPage === -1) {
        this.searchProjects(1, this.pageSize);
      }
      return;
    }

    const first = event.first ?? 0;
    const rows = event.rows && event.rows > 0 ? event.rows : this.pageSize;
    const page = Math.floor(first / rows) + 1;

    if (page !== this.currentPage || rows !== this.pageSize || this.currentPage === -1) {
      this.currentPage = page;
      this.pageSize = rows;
      this.searchProjects(page, rows);
    } else {
      this.applyLocalFilterAndSort(event);
    }
  }

  // Triggered on selecting a project row
  handleRowClick(rowData: any): void {
    if (!rowData) return;
    this.selectedRow = rowData;
    this.projectId = rowData.ID;
    this.initMenuItems();
  }

  initMenuItems(): void {
    const hasPermission = this.permissionService.hasPermission('N1,N13,N27,N97');
    this.menuItems = [
      {
        label: 'Chỉnh sửa lĩnh vực dự án',
        icon: 'fa-solid fa-pen-to-square fa-lg text-warning',
        visible: hasPermission,
        //disabled: !this.selectedRow,
        command: () => this.openEditMappingModal()
      }
    ];
  }

  // Load selected project metadata and mappings
  loadDetailPanel() {
    this.isDetailLoading = true;
    combineLatest([
      this.projectService.getProject(this.projectId),
      this.projectService.getFollowProjectBases(this.projectId),
      this.projectService.getProjectTypeLinks(this.projectId),
      this.projectService.getProjectApplicationLinks(this.projectId),
      this.projectService.getProjectTechnologyLinks(this.projectId)
    ]).subscribe({
      next: ([projectRes, followRes, linksRes, appsRes, techsRes]: any) => {
        this.cachedProjectHeader = projectRes.data;
        this.cachedFollowProjectBase = followRes.data;

        const links = linksRes.data || [];
        const apps = appsRes.data || [];
        const techs = techsRes.data || [];

        links.forEach((item: any) => {
          item.ApplicationTypeIDs = apps.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.ApplicationTypeID);
          item.TechnologyIDs = techs.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.TechnologyID);
          // Map FullName from projectUserTeams based on LeaderID
          if (item.LeaderID && this.projectUserTeams.length > 0) {
            const leader = this.projectUserTeams.find((u: any) => u.EmployeeID === item.LeaderID);
            item.FullName = leader ? leader.FullName : null;
          } else {
            item.FullName = null;
          }
        });

        const treeData = this.projectService.setDataTree(links, 'ID');
        this.projectTypeNodes = this.mapToTreeNodes(treeData);

        // Map selections
        this.selectedTypeNodes = [];
        this.getFlatNodes(this.projectTypeNodes, this.selectedTypeNodes);

        // Load application types and technologies filtered by selected ProjectType IDs
        const selectedIds = this.selectedTypeNodes
          .map(node => node.data.ProjectTypeID || node.data.ID)
          .filter(id => id > 0);
        const idsStr = selectedIds.join(',');
        this.getApplicationTypes(idsStr);
        this.getTechnologies(idsStr);

        this.isDetailLoading = false;
      },
      error: (err: any) => {
        this.isDetailLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.message || 'Lỗi tải thông tin chi tiết ánh xạ');
      }
    });
  }

  mapToTreeNodes(data: any[]): TreeNode[] {
    return data.map(item => {
      const node: TreeNode = {
        data: item,
        expanded: true,
        children: item._children ? this.mapToTreeNodes(item._children) : []
      };
      return node;
    });
  }

  parseAppTechLine(line: string): { parent: string; children: string[]; display: string; full: string; moreCount: number } {
    if (!line) return { parent: '', children: [], display: '', full: '', moreCount: 0 };
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'chưa cấu hình') {
      return { parent: '', children: [], display: '', full: '', moreCount: 0 };
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      return { parent: trimmed, children: [], display: '', full: '', moreCount: 0 };
    }
    const parent = trimmed.substring(0, colonIndex).trim();
    const childrenStr = trimmed.substring(colonIndex + 1).trim();
    let children = childrenStr ? childrenStr.split(',').map(c => c.trim()).filter(Boolean) : [];
    children = children.filter(c => c.toLowerCase() !== 'chưa cấu hình' && c !== '');
    
    const full = children.join(', ');
    const display = children.slice(0, 3).join(', ');
    const moreCount = children.length > 3 ? children.length - 3 : 0;
    return { parent, children, display, full, moreCount };
  }

  getFlatNodes(nodes: TreeNode[], selection: TreeNode[]) {
    nodes.forEach(node => {
      if (node.data.Selected) {
        selection.push(node);
      }
      if (node.children) {
        this.getFlatNodes(node.children, selection);
      }
    });
  }

  onSelectionChange(event: any) {
    this.syncSelectionToData(this.projectTypeNodes, this.selectedTypeNodes);
    const selectedIds = this.selectedTypeNodes
      .map(node => node.data.ProjectTypeID || node.data.ID)
      .filter(id => id > 0);
    const idsStr = selectedIds.join(',');
    this.getApplicationTypes(idsStr);
    this.getTechnologies(idsStr);
  }

  syncSelectionToData(nodes: TreeNode[], selection: TreeNode[]) {
    nodes.forEach(node => {
      node.data.Selected = selection.some(s => s.data.ID === node.data.ID);
      if (node.children) {
        this.syncSelectionToData(node.children, selection);
      }
    });
  }

  getSelectedData(nodes: TreeNode[], result: any[] = []) {
    nodes.forEach(node => {
      result.push(node.data);
      if (node.children) {
        this.getSelectedData(node.children, result);
      }
    });
    return result;
  }

  handleCellValueChange(event: any) {
    // Tree table handles updating the row model directly
  }

  onLookupSelect(event: { selectedRow: any; field: string; rowData: any }) {
    // When Leader is selected via table-lookup, sync LeaderID on the rowData
    if (event.field === 'FullName') {
      if (event.selectedRow && !Array.isArray(event.selectedRow)) {
        event.rowData.LeaderID = event.selectedRow.EmployeeID || 0;
        event.rowData.EmployeeID = event.selectedRow.EmployeeID || 0;
      } else if (!event.selectedRow) {
        event.rowData.LeaderID = 0;
        event.rowData.EmployeeID = 0;
      }
    }
  }

  openEditMappingModal(rowData: any = null): void {
    const projectToEdit = rowData || this.selectedRow;
    if (!projectToEdit) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dự án để chỉnh sửa!');
      return;
    }
    this.selectedRow = projectToEdit;
    this.projectId = projectToEdit.ID;
    this.isModalVisible = true;
    this.loadDetailPanel();
    this.initMenuItems();
  }

  closeModal(): void {
    this.isModalVisible = false;
    this.initMenuItems();
  }

  // Save changes
  saveData() {
    if (!this.selectedRow) return;
    this.isSaving = true;

    // Get flat list of types to save
    const projectTypeLinks = this.getSelectedData(this.projectTypeNodes);

    // Deep merge changes into safety payload
    const dataSave: any = {
      projectID: this.projectId,
      projectTypeLinks: projectTypeLinks.map(link => ({
        ProjectTypeLinkID: link.ProjectTypeLinkID || 0,
        ID: link.ID,
        LeaderID: link.LeaderID || 0,
        EmployeeID: link.EmployeeID || link.LeaderID || 0,
        Selected: !!link.Selected,
        projectTypeID: link.ProjectTypeID || link.ID,
        ApplicationTypeIDs: link.ApplicationTypeIDs || [],
        TechnologyIDs: link.TechnologyIDs || []
      }))
    };

    this.projectService.saveProjectApplicationTechnology(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          // Re-create tree folder structure
          this.projectService.createProjectTree(response.data.project.ID, response.data.selectedProjectTypeLink).subscribe({
            next: () => {
              this.isSaving = false;
              this.notification.success('Thành công', 'Lưu thành công!');
              this.closeModal();
              this.searchProjects(this.currentPage > 0 ? this.currentPage : 1, this.pageSize);
            },
            error: (err) => {
              this.isSaving = false;
              this.notification.error('Thành công nhưng lỗi tạo cây thư mục', err.message || 'Lỗi tạo cây thư mục');
            }
          });
        } else {
          this.isSaving = false;
          this.notification.error('Lỗi', response.message || 'Lỗi lưu thông tin dự án');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.message || 'Lỗi hệ thống khi lưu');
      }
    });
  }

  // Toggle search options
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  // Close the right detail mapping pane
  closePanel() {
    this.showDetailPanel = false;
    this.sizeTbMaster = '100%';
    this.sizeTbDetail = '0';
    this.selectedRow = null;
  }
}
