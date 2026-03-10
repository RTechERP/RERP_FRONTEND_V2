import {
    Component,
    OnInit,
    HostListener,
    ChangeDetectorRef,
    ViewChild,
    TemplateRef,
    AfterViewInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { DateTime } from 'luxon';

import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    Grouping,
    GroupTotalFormatters,
    SortComparers,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

import {
    NgbModal,
    NgbActiveModal,
    NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

import { NOTIFICATION_TITLE } from '../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';
import { AppUserService } from '../../../services/app-user.service';
import { HrRecruitmentCandidateDetailComponent } from './hr-recruitment-candidate-detail/hr-recruitment-candidate-detail.component';
import { HRRecruitmentCandidateService } from './hr-recruitment-candidate.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HrInterviewInvitationComponent } from './hr-interview-invitation/hr-interview-invitation.component';
import { ProjectService } from '../../project/project-service/project.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { HomeLayoutCandidateComponent } from '../hr-recruitment/hr-recruitment-application-form/home-layout-candidate/home-layout-candidate.component';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-hr-recruitment-candidate',
    imports: [
        CommonModule,
        FormsModule,
        AngularSlickgridModule,
        NzButtonModule,
        NzIconModule,
        NzModalModule,
        NzSpinModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzSplitterModule,
        NzTreeSelectModule,
        NzDropDownModule,
        NgbModalModule,
        Menubar,
        HomeLayoutCandidateComponent,
    ],
    templateUrl: './hr-recruitment-candidate.component.html',
    styleUrl: './hr-recruitment-candidate.component.css'
})
export class HRRecruitmentCandidateComponent implements OnInit, AfterViewInit {
    //#region Khai báo biến
    constructor(
        private notification: NzNotificationService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private appUserService: AppUserService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private permissionService: PermissionService,
        private hrRecruitmentCandidateService: HRRecruitmentCandidateService,
        private message: NzMessageService,
        private projectService: ProjectService,
        private departmentService: DepartmentServiceService
    ) { }
    exportProgress = { current: 0, total: 0, fileName: '' };
    private exportModalRef: any = null;

    @ViewChild('noteLogTpl') noteLogTpl!: TemplateRef<any>;
    tempNoteLog: string = '';

    hrRecruitmentCandidateMenu: MenuItem[] = [];
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions!: GridOption;
    dataset: any[] = [];
    isLoading = false;
    excelExportService = new ExcelExportService();
    keyword: any = '';
    employeeRequestId: any = -1;
    employees: any[] = [];

    departmentId: any = -1;
    departmentList: any[] = [];

    isHavePermission: any = false;

    dateStart: Date = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
    );
    dateEnd: Date = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
    );
    status: any = -1;
    employeeChucVuHDId: any = -1;
    positionContract: any[] = [];

    isMobile = window.innerWidth <= 768;
    isShowModal = false;

    // Modal xem tờ khai ứng viên
    isShowApplicationFormModal = false;
    selectedCandidateIDForForm = 0;
    selectedCandidateNameForForm = '';
    //#endregion

    @HostListener('window:resize')
    onWindowResize() {
        this.isMobile = window.innerWidth <= 768;
    }



    //#region Sự kiện load mở CN
    ngOnInit(): void {
        this.getPositionContract();
        this.getEmployees();
        this.loadDepartments();
        this.loadMenu();
        this.initAngularGrid();
        this.onSearch();
        this.isHavePermission = this.permissionService.hasPermission('N1,N2');
    }

    ngAfterViewInit(): void {
        this.angularGrid?.slickGrid?.invalidate();
        this.angularGrid?.slickGrid?.render();
        this.angularGrid?.slickGrid?.resizeCanvas();
    }

    loadMenu() {
        const statusItems = [
            { value: 1, label: '1. Gửi thư mời PV' },
            { value: 2, label: '2. Xác nhận phỏng vấn' },
            { value: 3, label: '3. Đã phỏng vấn' },
            { value: 4, label: '4. Kết quả không đạt' },
            { value: 5, label: '5. Kết quả đạt' },
            { value: 6, label: '6. Trình phê duyệt' },
            { value: 7, label: '7. Gửi thư mời nhận việc' },
            { value: 8, label: '8. Xác nhận thư mời' },
            { value: 9, label: '9. Nhận việc' },
        ];

        this.hrRecruitmentCandidateMenu = [
            {
                label: 'Thêm mới',
                icon: 'fa-solid fa-plus fa-lg text-success',
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => this.onAdd(),
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => this.onEdit(),
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                visible: this.permissionService.hasPermission('N1,N2'),
                command: () => this.onDelete(),
            },
            {
                label: 'Cập nhật trạng thái',
                icon: 'fa-solid fa-arrow-right-arrow-left fa-lg text-success',
                visible: this.permissionService.hasPermission('N1,N2'),
                items: statusItems.map(s => ({
                    label: s.label,
                    icon: 'fa-solid fa-circle-check text-success',
                    command: () => this.onUpdateStatus(s.value, true),
                })),
            },
            {
                label: 'Hủy trạng thái',
                icon: 'fa-solid fa-rotate-left fa-lg text-danger',
                visible: this.permissionService.hasPermission('N1,N2'),
                items: statusItems.map(s => ({
                    label: s.label,
                    icon: 'fa-solid fa-circle-xmark text-danger',
                    command: () => this.onUpdateStatus(s.value, false),
                })),
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                //visible: this.permissionService.hasPermission('N1,N2'),
                command: () => this.onExportExcel(),
            },
            {
                label: 'Tải file Cv',
                visible: this.permissionService.hasPermission('N1,N2'),
                icon: 'fa-solid fa-file-arrow-down fa-lg text-warning',
                command: () => this.onDownloadCV(),
            },
            {
                label: 'Gửi thư mời PV',
                visible: this.permissionService.hasPermission('N1,N2'),
                icon: 'fa-solid fa-envelope fa-lg text-primary',
                items: [
                    {
                        label: '1. Vòng 1',
                        icon: '',
                        command: () => this.onSendMail(1),
                    },
                    {
                        label: '2. Vòng 2',
                        icon: '',
                        command: () => this.onSendMail(2),
                    },
                ],
            },
            // {
            //   label: 'Gửi thư mời nhận việc',
            //   visible: this.permissionService.hasPermission('N1,N2'),
            //   icon: 'fa-solid fa-scroll fa-lg text-success',
            //   command: () => this.onSendOfferLetter(),
            // },
            {
                label: 'Xem tờ khai UV',
                icon: 'fa-solid fa-file-lines fa-lg text-info',
                command: () => this.viewApplicationForm(),
            },
        ];
    }

    getPositionContract() {
        this.hrRecruitmentCandidateService.getPositionContract().subscribe({
            next: (response: any) => {
                this.positionContract = response.data ?? [];
            },
            error: (err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    });
            },
        });
    }

    getEmployees() {
        this.projectService.getUsers().subscribe({
            next: (response: any) => {
                this.employees = this.projectService.createdDataGroup(
                    response.data,
                    'DepartmentName'
                );
            },
            error: (error: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách nhân viên: ' + (error.message || error)
                );
            },
        });
    }

    loadDepartments() {
        this.departmentService.getDepartments().subscribe({
            next: (data: any) => {
                console.log(data);
                this.departmentList = data.data;
            },
            error: (error) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    error.error?.message || 'Lỗi khi tải danh sách phòng ban'
                );
            },
        });
    }

    //#endregion

    angularGridHrRecruitmentCandidateReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;

        if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                this.updateMasterFooterRow();
            });
        }

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            this.updateMasterFooterRow();
            this.applyDistinctFilters();
        }, 100);
    }

    onGridClick(eventData: any, args: any) {
        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        const cell = grid.getCellFromEvent(eventData);
        if (!cell) return;

        // Nếu click vào cột checkbox (col 0) thì để slickgrid tự xử lý
        if (cell.cell === 0) return;

        const rowIndex = cell.row;
        const selectedRows = grid.getSelectedRows() as number[];

        // Nếu đang có nhiều dòng được chọn và click vào 1 trong số đó → giữ nguyên
        // Nếu chỉ click 1 dòng bình thường → select duy nhất dòng đó
        if (selectedRows.length <= 1 || !selectedRows.includes(rowIndex)) {
            grid.setSelectedRows([rowIndex]);
        }
    }

    onDblClick(eventData: any, args: any) {
        if (!this.isHavePermission) return;

        const grid = this.angularGrid?.slickGrid;
        if (!grid) return;

        const cell = grid.getCellFromEvent(eventData);
        if (!cell) return;

        // Không xử lý khi double click vào cột checkbox
        if (cell.cell === 0) return;

        const item = this.angularGrid.dataView.getItem(cell.row);
        if (!item || item.__group || item.__groupTotals) return;

        const modalRef = this.modalService.open(HrRecruitmentCandidateDetailComponent, {
            backdrop: 'static',
            keyboard: false,
            centered: true,
            size: 'xl',
            scrollable: true,
        });

        modalRef.componentInstance.hrRecruitmentCandidate = item;
        modalRef.componentInstance.stt = item.STT ?? 0;
        modalRef.result.then(
            () => this.onSearch(),
            () => { }
        );
    }

    viewApplicationForm() {

        const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length !== 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để xem tờ khai!');
            return;
        }


        const item = this.angularGrid.slickGrid.getDataItem(selectedRows[0]);
        if (!item) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên!');
            return;
        }

        if (item.StatusApplicationForm !== 1) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Ứng viên chưa tạo tờ khai!');
            return;
        }

        this.selectedCandidateIDForForm = item.ID || item.HRRecruitmentCandidateID || 0;
        this.selectedCandidateNameForForm = item.FullName || '';

        if (this.selectedCandidateIDForForm > 0) {
            this.isShowApplicationFormModal = true;
        } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên');
        }
    }

    initAngularGrid() {
        this.columnDefinitions = [
            {
                id: 'STT',
                field: 'STT',
                name: 'STT',
                width: 80,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 8 },
            },
            {
                id: 'StatusName',
                field: 'StatusName',
                name: 'Trạng thái ứng tuyển',
                width: 180,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
                excelExportOptions: { width: 25 },
            },
            {
                id: 'StatusApplicationFormText',
                field: 'StatusApplicationFormText',
                name: 'Trạng thái tờ khai UV',
                width: 180,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 16 },
            },
            {
                id: 'FullName',
                field: 'FullName',
                name: 'Tên ứng viên',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 30 },
            },
            {
                id: 'PositionName',
                field: 'PositionName',
                name: 'Vị trí ứng tuyển',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
                excelExportOptions: { width: 25 },
            },
            {
                id: 'DateApply',
                field: 'DateApply',
                name: 'Ngày ứng tuyển',
                minWidth: 150,
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                excelExportOptions: { width: 16 },
            },
            {
                id: 'UserName',
                field: 'UserName',
                name: 'Tên đăng nhập',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'Password',
                field: 'Password',
                name: 'Mật khẩu',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 16 },
            },

            {
                id: 'PhaseHiringText',
                field: 'PhaseHiringText',
                name: 'Yêu cầu tuyển dụng',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 25 },
            },
            {
                id: 'EmployeeRequest',
                field: 'EmployeeRequest',
                name: 'Người yêu cầu',
                width: 250,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                    collectionOptions: { addBlankEntry: true },
                },
                excelExportOptions: { width: 25 },
            },
            {
                id: 'FileCVName',
                field: 'FileCVName',
                name: 'File CV',
                width: 300,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 30 },
            },
            // {
            //   id: 'ServerPath',
            //   field: 'ServerPath',
            //   name: 'Đường dẫn file',
            //   width: 300,
            //   sortable: true,
            //   filterable: true,
            //   filter: { model: Filters['compoundInputText'] },
            //   excelExportOptions: { width: 40 },
            // },
            {
                id: 'StatusMailText',
                field: 'StatusMailText',
                name: 'Trạng thái gửi mail',
                width: 300,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 40 },
            },
            {
                id: 'DateInterview',
                field: 'DateInterview',
                name: 'Ngày phỏng vấn',
                minWidth: 150,
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                excelExportOptions: { width: 16 },
            },
            {
                id: 'SendMailTime',
                field: 'SendMailTime',
                name: 'Ngày gửi mail',
                minWidth: 150,
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                excelExportOptions: { width: 16 },
            },
            {
                id: 'GenderText',
                field: 'GenderText',
                name: 'Giới tính',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 12 },
            },
            {
                id: 'DateOfBirth',
                field: 'DateOfBirth',
                name: 'Ngày sinh',
                minWidth: 150,
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                excelExportOptions: { width: 14 },
            },
            {
                id: 'PhoneNumber',
                field: 'PhoneNumber',
                name: 'Số điện thoại',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 16 },
            },
            {
                id: 'Email',
                field: 'Email',
                name: 'Email',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 28 },
            },
            {
                id: 'Address',
                field: 'Address',
                name: 'Địa chỉ',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 35 },
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 500,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                excelExportOptions: { width: 40 },
            },
            {
                id: 'CreatedDate',
                field: 'CreatedDate',
                name: 'Ngày tạo',
                minWidth: 150,
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                excelExportOptions: { width: 14 },
            },
        ];

        this.gridOptions = {
            enableAutoResize: false,
            autoResize: {
                container: '.grid-container-hr-recruitment-candidate',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: false,
            },
            checkboxSelector: {
                hideInFilterHeaderRow: true,
                hideInColumnTitleRow: false,
                applySelectOnAllPages: false,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            forceFitColumns: false,
            enableHeaderMenu: false,
            enableExcelExport: true,
            externalResources: [this.excelExportService],
            excelExportOptions: {
                sanitizeDataExport: true,
                exportWithFormatter: true,
                columnHeaderStyle: {
                    font: { bold: true, color: 'FFFFFFFF' },
                    fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4D94FF' },
                    alignment: { wrapText: true, horizontal: 'center', vertical: 'center' },
                },
            },
            formatterOptions: {
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ',',
            },

            enableGrouping: true,

      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      frozenColumn: 5,
      contextMenu: {
        hideCloseButton: false,
        commandTitle: '',
        commandItems: [
          {
            command: '', title: 'Xem file', iconCssClass: 'fa-solid fa-eye', positionOrder: 10,
            action: (e, args) => {
              const filePath = args.dataContext?.ServerPath || '';
              if (filePath) {
                const host = environment.host + 'api/share';
                let urlImg = filePath.replace("\\\\192.168.1.190", host) + `/${args.dataContext?.FileCVName}`;
                const newWindow = window.open(
                  urlImg,
                  '_blank',
                );

                                if (newWindow) {
                                    newWindow.onload = () => {
                                        newWindow.document.title = args.dataContext?.FileCVName;
                                    };
                                }
                            }
                        }
                    },
                    {
                        command: '', title: 'Tải file', iconCssClass: 'fa-solid fa-download', positionOrder: 9,
                        action: (e, args) => this.onDownloadCV()
                    },

                ],
            }
        };
    }

    groupByDepartment() {
        const dataView = this.angularGrid?.dataView;
        if (!dataView) return;

        dataView.setGrouping([
            {
                getter: 'DepartmentName',
                formatter: (g: any) =>
                    `<b>Phòng ban:</b> ${g.value || '(Chưa có)'} &nbsp; <span style="color:#e34141">(${g.count} ứng viên)</span>`,
                comparer: (a: any, b: any) => SortComparers.string(a.value, b.value),
                aggregators: [],
                collapsed: false,
                lazyTotalsCalculation: true,
            }
        ] as Grouping[]);

        this.angularGrid?.slickGrid?.invalidate();
        this.angularGrid?.slickGrid?.render();
    }

    updateMasterFooterRow() {
        if (this.angularGrid && this.angularGrid.slickGrid) {
            // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
            const items =
                (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
                this.dataset;

            // Đếm số lượng Code
            const codeCount = (items || []).filter((item) => item.STT).length;

            //this.angularGrid.slickGrid.setFooterRowVisibility(true);

            // Set footer values cho từng column
            const columns = this.angularGrid.slickGrid.getColumns();
            columns.forEach((col: any) => {
                const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
                    col.id
                );
                if (!footerCell) return;

                // Đếm cho cột Code
                if (col.id === 'STT') {
                    footerCell.innerHTML = `<b>${codeCount}</b>`;
                }
            });
        }
    }

    reNumberSTTByGroup() {
        // Sort theo DepartmentName để items cùng nhóm liền kề
        this.dataset.sort((a: any, b: any) =>
            (a.DepartmentName ?? '').localeCompare(b.DepartmentName ?? '')
        );

        // Đánh lại STT trong từng group
        const counters = new Map<string, number>();
        this.dataset = this.dataset.map((item: any) => {
            const key = item.DepartmentName ?? '';
            const n = (counters.get(key) ?? 0) + 1;
            counters.set(key, n);
            return { ...item, STT: n };
        });
    }

    applyDistinctFilters() {
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

        const columns = angularGrid.slickGrid.getColumns();
        if (columns) {
            columns.forEach((column: any) => {
                if (
                    column.filter &&
                    column.filter.model === Filters['multipleSelect']
                ) {
                    const field = column.field;
                    if (!field) return;
                    column.filter.collection = getUniqueValues(data, field);
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
                    colDef.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        const updatedColumns = angularGrid.slickGrid.getColumns();
        angularGrid.slickGrid.setColumns(updatedColumns);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
    }
    //#endregion

    //#region Thêm, sửa, xóa, tìm kiếm, update trạng thái
    onSearch() {
        this.isLoading = true;
        const toLocalISO = (d: Date) => {
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        this.hrRecruitmentCandidateService.getDataHrRecruitmentCandidate(
            0,
            this.status ?? -1,
            this.employeeRequestId ?? -1,
            this.departmentId ?? -1,
            this.employeeChucVuHDId ?? -1,
            toLocalISO(new Date(this.dateStart.getFullYear(), this.dateStart.getMonth(), this.dateStart.getDate(), 0, 0, 0)),
            toLocalISO(new Date(this.dateEnd.getFullYear(), this.dateEnd.getMonth(), this.dateEnd.getDate(), 23, 59, 59)),
            this.keyword ?? ""
        ).subscribe({
            next: (res: any) => {
                this.dataset = (Array.isArray(res.data) ? res.data : []).map(
                    (item: any, index: number) => ({
                        ...item,
                        id: item.ID ?? item.id ?? `row_${index}`,
                        STT: index + 1,
                    })
                );
                this.isLoading = false;

                setTimeout(() => {
                    this.applyDistinctFilters();
                    this.updateMasterFooterRow();
                    this.reNumberSTTByGroup();
                    this.groupByDepartment();
                    this.angularGrid?.slickGrid?.invalidate();
                    this.angularGrid?.slickGrid?.render();
                    this.angularGrid?.slickGrid?.resizeCanvas();
                }, 100);

                setTimeout(() => {
                    this.angularGrid?.slickGrid?.invalidate();
                    this.angularGrid?.slickGrid?.render();
                    this.angularGrid?.slickGrid?.resizeCanvas();
                }, 1000);
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    });
            },
        });

    }

    onAdd() {
        const modalRef = this.modalService.open(
            HrRecruitmentCandidateDetailComponent,
            {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                size: 'xl',
                scrollable: true,
            }
        );

        let stt = (this.dataset?.length ?? 0) + 1;
        modalRef.componentInstance.stt = stt;
        modalRef.result.then(
            (result) => {
                this.onSearch();
            },
            () => {
                // Modal dismissed
            }
        );
    }

    onEdit() {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length != 1) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 dòng để sửa!');
            return;
        }

        const item = angularGrid.dataView.getItem(selectedRowIndexes[0]);

        const modalRef = this.modalService.open(
            HrRecruitmentCandidateDetailComponent,
            {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                size: 'xl',
                scrollable: true,
            }
        );

        let stt = (this.dataset?.length ?? 0) + 1;
        modalRef.componentInstance.hrRecruitmentCandidate = item;
        modalRef.componentInstance.stt = stt;
        modalRef.result.then(
            (result) => {
                this.onSearch();
            },
            () => {
            }
        );
    }

    onDelete() {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ít nhất 1 dòng để xóa!');
            return;
        }

        const listIds = selectedRows.map((item: any) => item.ID);
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa <b>${selectedRows.length}</b> ứng viên đã chọn không?`,
            nzOkText: 'Đồng ý',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.hrRecruitmentCandidateService.deleteData(listIds).subscribe({
                    next: (res: any) => {
                        this.notification.success(NOTIFICATION_TITLE.success, `Xóa thành công ${selectedRows.length} ứng viên!`);
                        this.onSearch();
                    },
                    error: (err: any) => {
                        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                            { nzStyle: { whiteSpace: 'pre-line' } });
                    },
                });
            }
        });
    }

    onUpdateStatus(status: number, isApprove: boolean) {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ít nhất 1 dòng để thay đổi trạng thái!');
            return;
        }

        let statusText = "";
        switch (status) {
            case 0:
                statusText = "Ứng tuyển";
                break;
            case 1:
                statusText = "Gửi thư mời";
                break;
            case 2:
                statusText = "Xác nhận phỏng vấn";
                break;
            case 3:
                statusText = "Đã phỏng vấn";
                break;
            case 4:
                statusText = "Kết quả phỏng vấn";
                break;
            case 5:
                statusText = "Trình phê duyệt";
                break;
            case 6:
                statusText = "Gửi thư mời nhận việc";
                break;
            case 7:
                statusText = "Xác nhận thư mời";
                break;
            case 8:
                statusText = "Nhận việc";
                break;
        }

        let selectedRowsTemp = [];
        let listIds: number[] = [];
        if (isApprove) {
            selectedRowsTemp = selectedRows.filter((item: any) => item.Status < status);
            listIds = selectedRowsTemp.map((item: any) => item.ID);
        } else {
            selectedRowsTemp = selectedRows.filter((item: any) => item.Status === status);
            listIds = selectedRowsTemp.map((item: any) => item.ID);
        }

        if (listIds.length === 0) {
            this.notification.info('Thông báo', 'Không có ứng viên nào để thay đổi trạng thái!');
            return;
        }


        let payload = {
            listIds: listIds,
            Status: status,
            isApproved: isApprove,
            NoteLog: ""
        }

        this.isLoading = true;

        this.modal.confirm({
            nzTitle: 'Xác nhận thay đổi trạng thái ' + statusText,
            nzContent: `Bạn có chắc chắn muốn thay đổi trạng thái <b>${selectedRows.length}</b> ứng viên đã chọn không?.
      Những trạng thái ${isApprove ? 'trước' : 'khác'} sẽ tự động được bỏ qua!`,
            nzOkText: 'Đồng ý',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnCancel: () => {
                this.isLoading = false;
            },
            nzOnOk: () => {
                this.tempNoteLog = '';
                this.modal.create({
                    nzTitle: 'Ghi chú chuyển trạng thái',
                    nzContent: this.noteLogTpl,
                    nzOkText: 'Xác nhận',
                    nzCancelText: 'Bỏ qua',
                    nzOnOk: () => {
                        payload.NoteLog = this.tempNoteLog;
                        this.hrRecruitmentCandidateService.updateStatus(payload).subscribe({
                            next: (res: any) => {
                                this.notification.success(NOTIFICATION_TITLE.success, `Thay đổi trạng thái thành công ${selectedRows.length} ứng viên!`);
                                this.onSearch();
                                this.isLoading = false;

                                if (status === 1 && selectedRowsTemp.length > 0 && isApprove === true) {
                                    this.sendEmail(selectedRowsTemp);
                                }
                            },
                            error: (err: any) => {
                                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                                    { nzStyle: { whiteSpace: 'pre-line' } });
                                this.isLoading = false;
                            },
                        });
                    },
                    nzOnCancel: () => {
                        this.hrRecruitmentCandidateService.updateStatus(payload).subscribe({
                            next: (res: any) => {
                                this.notification.success(NOTIFICATION_TITLE.success, `Thay đổi trạng thái thành công ${selectedRows.length} ứng viên!`);
                                this.onSearch();
                                this.isLoading = false;

                                if (status === 1 && selectedRowsTemp.length > 0 && isApprove === true) {
                                    this.sendEmail(selectedRowsTemp);
                                }
                            },
                            error: (err: any) => {
                                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
                                    { nzStyle: { whiteSpace: 'pre-line' } });
                                this.isLoading = false;
                            },
                        });
                    }
                });
            }
        });

    }

    sendEmail(selectedRowsTemp: any[]) {
        const modalRef = this.modalService.open(
            HrInterviewInvitationComponent,
            {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                size: 'xl',
                scrollable: true,
            }
        );

        modalRef.componentInstance.candidates = selectedRowsTemp;
        modalRef.componentInstance.round = 1;

        modalRef.result.then(
            (result) => {
                this.onSearch();
            },
            () => {
                // Modal dismissed
            }
        );
    }
    //#endregion

    //#region Hàm thay đổi trạng thái
    //#endregion

    //#region Hàm khác
    onDateChange(field: 'dateStart' | 'dateEnd', value: string): void {
        if (value) {
            (this as any)[field] = new Date(value);
        }
    }
    //#endregion

    //#region Hàm xuất phiếu
    onExportExcel() {
        if (!this.angularGrid || !this.angularGrid.dataView) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa có dữ liệu để xuất!');
            return;
        }

        const filteredItems = (this.angularGrid.dataView.getFilteredItems?.() as any[]) || [];
        if (!filteredItems || filteredItems.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }

        const now = DateTime.now().toFormat('yyyyMMdd');
        try {
            this.excelExportService.exportToExcel({
                filename: `DanhSachUngVien_${now}`,
                format: 'xlsx',
                sheetName: 'Danh sách ứng viên',
            });
            this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
        } catch (error) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi khi xuất Excel!');
        }
    }

    async onDownloadCV() {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length <= 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ứng viên cần xuất file!');
            return;
        }

        const ids = selectedRows.filter((row: any) => row.ID > 0).map((row: any) => row.ID);
        if (ids.length <= 0) {
            this.notification.info(
                'Thông báo',
                'Không có ứng viên hợp lệ để xuất file!'
            );
            return;
        }

        // Kiểm tra nếu trình duyệt hỗ trợ File System Access API
        if (!('showDirectoryPicker' in window)) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Trình duyệt không hỗ trợ tính năng này!'
            );
            return;
        }

        try {
            // Chỉ gọi showDirectoryPicker() một lần duy nhất
            const dirHandle = await (window as any).showDirectoryPicker();

            // Request permission ngay bằng cách tạo file test
            try {
                const testFileHandle = await dirHandle.getFileHandle('.export_test', { create: true });
                const testWritable = await testFileHandle.createWritable();
                await testWritable.write('test');
                await testWritable.close();
                // Xóa file test
                await dirHandle.removeEntry('.export_test');
            } catch (permErr: any) {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Không có quyền ghi vào thư mục này!'
                );
                return;
            }

            this.isLoading = true;

            if (ids.length >= 10) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Do lượng file lớn vui lòng chờ ít phút để hoàn tất tải file!'
                );
            }

            await this.exportSequentiallyToFolder(ids, 0, dirHandle);

        } catch (err: any) {
            if (err.name === 'AbortError') {
                this.notification.info('Thông báo', 'Bạn đã hủy chọn thư mục!');
            } else {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    `Lỗi: ${err.message || 'Có lỗi xảy ra khi chọn thư mục'}`
                );
            }
            this.isLoading = false;
        }
    }

    private async exportSequentiallyToFolder(
        ids: number[],
        index: number,
        dirHandle: any
    ): Promise<void> {
        // Tạo modal lần đầu
        if (index === 0) {
            this.exportProgress = { current: 0, total: ids.length, fileName: '' };
            this.exportModalRef = this.modal.info({
                nzTitle: 'Đang xuất file',
                nzContent: `Đang xuất file 0/${ids.length}...`,
                nzClosable: false,
                nzMaskClosable: false,
                nzKeyboard: false,
                nzOkText: null,
                nzCancelText: null,
                nzMask: false
            });
        }

        if (index >= ids.length) {
            // Đóng modal và hiển thị thành công
            if (this.exportModalRef) {
                this.exportModalRef.close();
                this.exportModalRef = null;
            }
            this.message.success(`Xuất thành công ${ids.length} file!`);
            this.isLoading = false;
            return;
        }

        const id = ids[index];
        const selectedRows = this.dataset.find((item) => item.ID === id);

        // Cập nhật nội dung modal
        this.exportProgress.current = index + 1;
        this.exportProgress.fileName = `Ứng viên ${selectedRows?.FullName}`;

        if (this.exportModalRef) {
            this.exportModalRef.updateConfig({
                nzContent: `Đang xuất file ${index + 1}/${ids.length}: ${this.exportProgress.fileName}`
            });
        }

        try {
            const res = await this.hrRecruitmentCandidateService.dowloadFileCv(id).toPromise();
            const tick = Date.now().toString(36);

            const fileName = `CV_${selectedRows?.FullName}_${tick}.pdf`;

            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(res);
            await writable.close();

            // Tiếp tục với file tiếp theo
            await this.exportSequentiallyToFolder(ids, index + 1, dirHandle);

        } catch (err: any) {
            if (this.exportModalRef) {
                this.exportModalRef.close();
                this.exportModalRef = null;
            }

            // Nếu error.error là Blob (do responseType: 'blob'), cần đọc nội dung
            if (err?.error instanceof Blob) {
                const text = await err.error.text();
                try {
                    const json = JSON.parse(text);
                    const errorMessage = json?.message || json?.error || 'Có lỗi xảy ra';
                    this.message.error(
                        `Lỗi xuất file ${index + 1}/${ids.length} (Ứng viên ${selectedRows?.FullName}): ${errorMessage}`
                    );
                } catch {
                    this.message.error(`Lỗi xuất file ${index + 1}/${ids.length}: ${text}`);
                }
            } else {
                const errorMessage = err?.error?.message || err?.message || 'Có lỗi xảy ra';
                this.message.error(
                    `Lỗi xuất file ${index + 1}/${ids.length} (Ứng viên ${selectedRows?.FullName}): ${errorMessage}`
                );
            }

            this.isLoading = false;
        }
    }
    //#endregion

    //#region Gửi mail
    onSendMail(round: number) {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ít nhất 1 ứng viên để gửi mail!');
            return;
        }

        const modalRef = this.modalService.open(
            HrInterviewInvitationComponent,
            {
                backdrop: 'static',
                keyboard: false,
                centered: true,
                size: 'xl',
                scrollable: true,
            }
        );

        modalRef.componentInstance.candidates = selectedRows;
        modalRef.componentInstance.round = round;

        modalRef.result.then(
            (result) => {
                this.onSearch();
            },
            () => {
                // Modal dismissed
            }
        );
    }
    //#endregion

    //#region Gửi thư mời nhận việc
    onSendOfferLetter() {
        const angularGrid = this.angularGrid;
        if (!angularGrid) return;

        const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
        const selectedRows = selectedRowIndexes
            .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
            .filter((item: any) => item);

        if (selectedRows.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ít nhất 1 ứng viên để gửi thư mời nhận việc!');
            return;
        }

        // const modalRef = this.modalService.open(
        //   HrOfferLetterComponent,
        //   {
        //     backdrop: 'static',
        //     keyboard: false,
        //     centered: true,
        //     size: 'xl',
        //   }
        // );

        // modalRef.componentInstance.candidates = selectedRows;

        // modalRef.result.then(
        //   (result) => {
        //     this.onSearch();
        //   },
        //   () => {
        //     // Modal dismissed
        //   }
        // );
    }
    //#endregion


}
