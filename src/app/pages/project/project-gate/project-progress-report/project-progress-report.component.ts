import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnInit,
    AfterViewInit,
    ViewChild,
    OnDestroy,
    ElementRef,
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
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../project-service/project.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { AuthService } from '../../../../auth/auth.service';
import { PermissionService } from '../../../../services/permission.service';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule as PButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MenuItem, ScrollerOptions } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';

@Component({
    selector: 'app-project-progress-report',
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
        RouterModule,
    ],
    templateUrl: './project-progress-report.component.html',
    styleUrls: ['./project-progress-report.component.css']
})
export class ProjectProgressReportComponent implements OnInit, AfterViewInit, OnDestroy {

    private searchSubject = new Subject<string>();
    showSearchBar: boolean = true;
    isMobile: boolean = false;
    menuItems: MenuItem[] = [];
    showSearchModal: boolean = false;
    private filterSubject = new Subject<any[]>();
    private destroy$ = new Subject<void>();
    private fullStatusFilterOptions: any[] = [];
    isLoading: boolean = false;
    isWorkReportLoading: boolean = false;
    isTypeLinkLoading: boolean = false;
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    @ViewChild('dtProjects') dtProjects: Table | undefined;
    @ViewChild('dtWorkReport') dtWorkReport: Table | undefined;
    @ViewChild('dtTypeLink') dtTypeLink: Table | undefined;

    @ViewChild('keywordInput') keywordInput!: ElementRef;

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
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private permissionService: PermissionService,
    ) {
        this.searchSubject
            .subscribe(() => {
                this.searchProjects(1, this.pageSize);
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
    sizeTbMaster: string = '70%';
    sizeTbDetail: any = '30%';
    showDetailPanel: boolean = true;
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
    activeTab: string = 'gateprogress';
    detailGridsReady: boolean = false;
    userId: any;
    pmId: any;
    businessFieldId: any;
    technicalId: any;
    customerId: any;
    keyword: string = '';
    gateType: number = 0;
    gateTypeFilterOptions = [
        { label: 'Tất cả', value: 0 },
        { label: 'Giải pháp', value: 1 },
        { label: 'Triển khai', value: 2 }
    ];

    solutionGates = [
        { code: 'G0', stt: 1, name: 'RFQ/Tiếp nhận yêu cầu' },
        { code: 'G1', stt: 2, name: 'Khảo sát & làm rõ yêu cầu' },
        { code: 'G2', stt: 3, name: 'Lên Concept/Giải pháp' },
        { code: 'G3', stt: 4, name: 'Review Concept & Báo giá' },
        { code: 'G3A', stt: 5, name: 'POC/Demo/Test trước PO' }
    ];

    deploymentGates = [
        { code: 'G4', stt: 6, name: 'Kick-off sau PO/Hợp đồng' },
        { code: 'G5', stt: 7, name: 'Thiết kế chi tiết' },
        { code: 'G6', stt: 8, name: 'Design Review & Release' },
        { code: 'G7', stt: 9, name: 'Mua hàng / Gia công / Chế tạo' },
        { code: 'G8', stt: 10, name: 'Lắp ráp / Đấu dây / Tích hợp' },
        { code: 'G9', stt: 11, name: 'Debug / Chạy thử nội bộ' },
        { code: 'G10', stt: 12, name: 'FAT tại RTC' },
        { code: 'G11', stt: 13, name: 'SAT tại site' },
        { code: 'G12', stt: 14, name: 'Bàn giao / Đóng dự án / Lessons Learned' }
    ];

    getProjectGates(rowData: any): any[] {
        if (!rowData || !rowData.ProjectGates) return [];
        const gateCodes = rowData.ProjectGates.split(',');
        const allGates = [...this.solutionGates, ...this.deploymentGates];

        const result: any[] = [];
        gateCodes.forEach((code: string) => {
            const trimmed = code.trim();
            if (!trimmed) return;
            const match = allGates.find(g => g.code === trimmed);
            if (match) {
                result.push(match);
            } else {
                result.push({ code: trimmed, stt: 99, name: trimmed });
            }
        });
        return result;
    }

    getGateClass(rowData: any, gate: any): string {
        if (!rowData || !gate) return 'gate-pending';

        if (rowData.IsGateCompleted === true || rowData.IsGateCompleted === 1 || rowData.IsGateCompleted === 'true') {
            return 'gate-completed';
        }

        const currentGateCode = rowData.CurrentGate || '';

        if (currentGateCode === gate.code) {
            return 'gate-active';
        }

        let currentStt = 0;
        const allGates = [...this.solutionGates, ...this.deploymentGates];
        const match = allGates.find(g => g.code === currentGateCode);
        if (match) {
            currentStt = match.stt;
        }

        if (gate.stt < currentStt) {
            return 'gate-completed';
        }

        return 'gate-pending';
    }

    projectId: any = 0;
    projectCode: any = '';
    currentUser: any = null;
    savedPage: number = 1;

    // Pagination properties
    totalRecords: number = 0;
    pageSize: number = 100;
    readonly projectVirtualRowHeight = 44;
    readonly projectRowsPerPageOptions = [100, 200, 300, 99999, 999999];
    readonly projectVirtualScrollOptions: ScrollerOptions = {
        lazy: false,
        showLoader: false,
        numToleratedItems: 30,
        resizeDelay: 50,
    };
    readonly trackProjectById = (index: number, row: any): any => row?.ID ?? row?.id ?? index;
    currentPage: number = -1;
    masterDataset: any[] = [];
    dateStart: string = DateTime.local()
        .minus({ years: 1 })
        .startOf('year')
        .toFormat('yyyy-MM-dd');
    dateEnd: string = DateTime.local()
        .set({ hour: 0, minute: 0, second: 0 })
        .toFormat('yyyy-MM-dd');
    //#endregion

    //#region Lifecycle hooks
    ngOnInit(): void {
        this.updateResponsiveState();
        this.initMenuItems();
        this.isLoading = true;

        this.getProjectStatus();
        this.getProjectTypes();
        this.getBusinessFields();
        this.getCustomers();
        this.getPms();
        this.getUsers();
        this.getCurrentUser();
        this.setDefautSearch();

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (Number(id) == 2) {
                this.isHide = false;
                this.projectTypeIds = [2];
            } else {
                this.isHide = true;
                this.projectTypeIds = [];
            }
            this.searchProjects(1, this.pageSize);
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            if (this.keywordInput) {
                this.keywordInput.nativeElement.focus();
            }
        }, 500);
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
        this.menuItems = [
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
    }

    getCurrentUser(): void {
        this.authService.getCurrentUser().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.currentUser = res.data;
                }
            },
            error: (err) => {
                console.error('Error fetching current user info:', err);
            }
        });
    }

    //#region Excel Export
    exportToExcel(): void {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Báo cáo tiến độ dự án');

            // Define columns
            const cols = [
                { header: 'Trạng thái', key: 'ProjectStatusName', width: 15 },
                { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
                { header: 'Tên dự án', key: 'ProjectName', width: 40 },
                { header: 'End User', key: 'EndUserName', width: 25 },
                { header: 'Kinh doanh', key: 'FullNameSale', width: 20 },
                { header: 'Kỹ thuật', key: 'FullNameTech', width: 20 },
                { header: 'PM', key: 'FullNamePM', width: 20 },
                { header: 'Mức ưu tiên', key: 'PriotityText', width: 12 },
                { header: 'Ưu tiên cá nhân', key: 'PersonalPriotity', width: 15 },
                { header: 'Khách hàng', key: 'CustomerName', width: 25 },
                { header: 'Gate hiện tại', key: 'CurrentGate', width: 15 },
                { header: 'Dự kiến bắt đầu', key: 'ExpectedPlanDate', width: 15 },
                { header: 'Dự kiến kết thúc', key: 'ExpectedProjectEndDate', width: 15 },
                { header: 'Thực tế bắt đầu', key: 'RealityPlanDate', width: 15 },
                { header: 'Thực tế kết thúc', key: 'RealityProjectEndDate', width: 15 },
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

            // Add data with formatted dates
            this.dataset.forEach(item => {
                const rowData = {
                    ...item,
                    ExpectedPlanDate: item.ExpectedPlanDate ? DateTime.fromISO(item.ExpectedPlanDate).toFormat('dd/MM/yyyy') : '',
                    ExpectedProjectEndDate: item.ExpectedProjectEndDate ? DateTime.fromISO(item.ExpectedProjectEndDate).toFormat('dd/MM/yyyy') : '',
                    RealityPlanDate: item.RealityPlanDate ? DateTime.fromISO(item.RealityPlanDate).toFormat('dd/MM/yyyy') : '',
                    RealityProjectEndDate: item.RealityProjectEndDate ? DateTime.fromISO(item.RealityProjectEndDate).toFormat('dd/MM/yyyy') : '',
                };
                worksheet.addRow(rowData);
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
                a.download = `Bao_cao_tien_do_du_an_${new Date().getTime()}.xlsx`;
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

        if (modeChanged) {
            this.showSearchBar = !this.isMobile;
        }
    }

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
            return { 'background-color': 'red' };
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

    closePanel() {
        this.sizeTbMaster = '100%';
        this.sizeTbDetail = '0';
        this.detailGridsReady = false;
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

    toggleDetailPanel() {
        this.showDetailPanel = !this.showDetailPanel;
        if (this.showDetailPanel) {
            if (this.projectId) {
                this.sizeTbMaster = '70%';
                this.sizeTbDetail = '30%';
                this.detailGridsReady = true;
                if (this.activeTab === 'workreport') {
                    this.getWorkReports();
                } else if (this.activeTab === 'typelink') {
                    this.getProjectTypeLinks();
                }
            }
        } else {
            this.sizeTbMaster = '100%';
            this.sizeTbDetail = '0';
            this.detailGridsReady = false;
        }
        this.initMenuItems();
    }

    handleTableFilter(event: any): void {
    }

    private updateStatusFilterOptions(sourceData?: any[]): void {
        if (this.fullStatusFilterOptions && this.fullStatusFilterOptions.length > 0) {
            this.statusFilterOptions = [...this.fullStatusFilterOptions];
        }
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

    private applyLocalFilterAndSort(event: any): void {
        if (!this.masterDataset || this.masterDataset.length === 0) {
            this.dataset = [];
            return;
        }

        let filteredData = [...this.masterDataset];

        // 1. Xử lý Filter
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

        // 2. Xử lý Sort
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

    private initFullStatusFilterOptions(): void {
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

    private enrichProjects(projects: any[], page: number = 1, size: number = 50): any[] {
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
                STT: (page - 1) * size + index + 1,
                ProjectStatusName: statusName,
                ProjectStatusColor: statusColor
            };
        });
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
            gateType: this.gateType || 0,
        };
    }

    searchProjects(page: number = 1, size: number = 100) {
        this.isLoading = true;
        this.currentPage = page;
        this.pageSize = size;

        const ajaxParams = this.getProjectAjaxParams();
        this.projectService
            .getProjectsControlGridPagination(ajaxParams, page, size)
            .subscribe({
                next: (res) => {
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

                        // Auto-select first project on first load
                        if (!this.selectedRow?.ID && this.dataset.length > 0) {
                            this.handleRowClick(this.dataset[0]);
                        }

                        const totalPage = res.data.totalPage || 1;
                        if (res.data.totalRecords !== undefined && res.data.totalRecords !== null) {
                            this.totalRecords = res.data.totalRecords;
                        } else if (size >= 99999) {
                            this.totalRecords = projects.length;
                        } else {
                            this.totalRecords = totalPage * size;
                        }
                    } else {
                        this.masterDataset = [];
                        this.dataset = [];
                        this.totalRecords = 0;
                    }
                    this.isLoading = false;
                },
                error: (err) => {
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
            return;
        }

        this.isTypeLinkLoading = true;
        this.projectService.getProjectTypeLinks(this.projectId).subscribe({
            next: (response: any) => {
                this.isTypeLinkLoading = false;
                const flatData = (response.data || []).map((x: any) => ({
                    ...x,
                    id: x.ID,
                    ParentID: x.ParentID,
                    expanded: true
                }));
                const visible: any[] = [];
                const addNode = (node: any) => {
                    visible.push(node);
                    if (node.expanded && node.children) {
                        node.children.forEach(addNode);
                    }
                };

                const tree = this.buildTree(flatData);
                tree.forEach(addNode);
                this.datasetTypeLink = visible;
            },
            error: (error) => {
                this.isTypeLinkLoading = false;
                console.error('Lỗi:', error);
                this.datasetTypeLink = [];
            },
        });
    }

    toggleTypeLinkNode(item: any): void {
        item.expanded = !item.expanded;
        this.getProjectTypeLinks();
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
            node.children = [];
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
                .toFormat('yyyy-MM-dd HH:mm:ss')
        );
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
        this.userId = 0;
        this.pmId = 0;
        this.businessFieldId = 0;
        this.technicalId = 0;
        this.customerId = 0;
        this.keyword = '';
        this.savedPage = 0;
        this.gateType = 0;
    }

    ToggleSearchPanelNew() {
        this.showSearchBar = !this.showSearchBar;
    }
    //#endregion
}
