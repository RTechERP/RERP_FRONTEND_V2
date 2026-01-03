import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgModule } from '@angular/core';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import {
    AfterViewInit,
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ElementRef,
    Input,
    Optional,
    Inject,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
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
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { JobRequirementService } from './job-requirement-service/job-requirement.service';
// import { HandoverFormComponent } from './handover-form/handover-form.component';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HrPurchaseProposalComponent } from '../hr-purchase-proposal/hr-purchase-proposal.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { RecommendSupplierFormComponent } from './recommend-supplier-form/recommend-supplier-form.component';
import { JobRequirementFormComponent } from './job-requirement-form/job-requirement-form.component';
import { CancelApproveReasonFormComponent } from './cancel-approve-reason-form/cancel-approve-reason-form.component';
import { AuthService } from '../../../auth/auth.service';
import { NoteFormComponent } from './note-form/note-form.component';
import { ProjectPartlistPriceRequestFormComponent } from '../../old/project-partlist-price-request/project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { JobRequirementPurchaseRequestViewComponent } from './job-requirement-purchase-request-view/job-requirement-purchase-request-view.component';
import { JobRequirementSummaryComponent } from './job-requirement-summary/job-requirement-summary.component';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../shared/pdf/vfs_fonts_custom.js';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';

(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = {
    Times: {
        normal: 'TIMES.ttf',
        bold: 'TIMESBD.ttf',
        bolditalics: 'TIMESBI.ttf',
        italics: 'TIMESI.ttf',
    },
};

@Component({
    selector: 'app-job-requirement',
    standalone: true,
    imports: [
        CommonModule,
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
        NzUploadModule,
        NzModalModule,
        NgbModalModule,
        NzFormModule,
        NzInputNumberModule,
        NzDropDownModule,
        NzMenuModule,
        NzSpinModule,
        HasPermissionDirective,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './job-requirement.component.html',
    styleUrl: './job-requirement.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class JobRequirementComponent implements OnInit, AfterViewInit {

    @Input() approvalMode: 1 | 2 | 3 | null = null;

    // SlickGrid instances
    angularGrid!: AngularGridInstance;
    angularGridDetail!: AngularGridInstance;
    angularGridFile!: AngularGridInstance;
    angularGridApproved!: AngularGridInstance;

    // Column definitions
    columnDefinitions: Column[] = [];
    columnDefinitionsDetail: Column[] = [];
    columnDefinitionsFile: Column[] = [];
    columnDefinitionsApproved: Column[] = [];

    // Grid options
    gridOptions: GridOption = {};
    gridOptionsDetail: GridOption = {};
    gridOptionsFile: GridOption = {};
    gridOptionsApproved: GridOption = {};

    // Datasets
    dataset: any[] = [];
    datasetDetail: any[] = [];
    datasetFile: any[] = [];
    datasetApproved: any[] = [];

    searchParams = {
        DateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        DateEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        Request: '',
        EmployeeID: 0,
        DepartmentID: 0,
        ApprovedTBPID: 0,
        Step: 0,
    };

    JobrequirementData: any[] = [];
    JobrequirementID: number = 0;
    DepartmentRequiredID: number = 0;
    data: any[] = [];
    dataDepartment: any[] = [];
    cbbEmployee: any[] = [];

    JobrequirementDetailData: any[] = [];
    JobrequirementFileData: any[] = [];
    JobrequirementApprovedData: any[] = [];

    HCNSApprovalData: any[] = [];
    isHCNSApproved: boolean = false; // Trạng thái đã duyệt HCNS hay chưa

    sizeSearch: string = '0';
    showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
    isCheckmode: boolean = false;
    isLoading: boolean = false;
    dateFormat = 'dd/MM/yyyy';

    // Menu bars
    menuBars: any[] = [];

    get shouldShowSearchBar(): boolean {
        return this.showSearchBar;
    }

    isMobile(): boolean {
        return typeof window !== 'undefined' && window.innerWidth <= 768;
    }

    dataInput: any = {};

    ngOnInit(): void {
        // Initialize grids first to ensure columns are defined before view renders
        this.initGrid();
        this.initGridDetail();
        this.initGridFile();
        this.initGridApproved();

        this.route.queryParams.subscribe(params => {
            const typeApprove = params['typeApprove'] || 0;

            if (typeApprove === '2') {
                this.approvalMode = 1;
                this.searchParams.Step = 1;
            } else if (typeApprove === '1') {
                this.approvalMode = 2;
            } else if (typeApprove === '3') {
                this.approvalMode = 3;
            }

            // Call getCurrentUser AFTER approvalMode is set
            this.getCurrentUser();
            // Initialize menubar after approvalMode is set
            this.initMenuBar();
        });

        this.getdataEmployee();
        this.getdataDepartment();
    }

    initMenuBar(): void {
        this.menuBars = [];

        // Thêm/Sửa/Xóa - only when not in approval mode
        if (!this.approvalMode) {
            this.menuBars.push(
                {
                    label: 'Thêm',
                    icon: 'fa-solid fa-plus fa-lg text-success',
                    command: () => this.onAddJobRequirement(false)
                },
                {
                    label: 'Sửa',
                    icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
                    command: () => this.onAddJobRequirement(true)
                },
                {
                    label: 'Xóa',
                    icon: 'fa-solid fa-trash fa-lg text-danger',
                    command: () => this.onDeleteJobRequirement()
                }
            );
        }

        // Xuất Excel - always available
        this.menuBars.push({
            label: 'Xuất Excel',
            icon: 'fa-solid fa-file-excel fa-lg text-success',
            command: () => this.exportToExcel()
        });

        // TBP Menu - approval mode 1
        if (this.approvalMode === 1) {
            this.menuBars.push({
                label: 'Trưởng Bộ Phận',
                icon: 'fa-solid fa-calendar-check fa-lg text-primary',
                items: [
                    {
                        label: 'Duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        visible: this.permissionService.hasPermission("N56,N32,N1"),
                        command: () => this.onApproveJobRequirement('btnApproveTBP_New')
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N56,N32,N1"),
                        command: () => this.onApproveJobRequirement('btnUnApproveTBP_New')
                    }
                ]
            });
        }

        // HR Menu - no approval mode or approval mode 2
        if (!this.approvalMode || this.approvalMode === 2) {
            this.menuBars.push({
                label: 'Nhân sự',
                visible: this.permissionService.hasPermission("N56,N34,N1"),
                icon: 'fa-solid fa-calendar-check fa-lg text-info',
                items: [
                    {
                        label: 'Duyệt yêu cầu',
                        icon: 'fa-solid fa-check fa-lg text-success',
                        command: () => this.onApproveJobRequirement('btnApproveDocumentHR')
                    },
                    {
                        label: 'Hủy yêu cầu',
                        icon: 'fa-solid fa-xmark fa-lg text-danger',
                        command: () => this.onApproveJobRequirement('btnUnApproveDocumentHR')
                    },
                    { separator: true },
                    {
                        label: 'TBP Duyệt',
                        visible: this.permissionService.hasPermission("N56,N1"),
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => this.onApproveJobRequirement('btnApproveHR')
                    },
                    {
                        label: 'TBP hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        visible: this.permissionService.hasPermission("N56,N1"),
                        command: () => this.onApproveJobRequirement('btnUnApproveHR')
                    },
                    { separator: true },
                    {
                        label: 'Yêu cầu BGD duyệt',
                        icon: 'fa-solid fa-paper-plane fa-lg text-warning',
                        command: () => this.onRequestBGDApprove(true)
                    },
                    {
                        label: 'Hủy yêu cầu BGD duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        command: () => this.onRequestBGDApprove(false)
                    },
                    {
                        label: 'Hoàn thành duyệt',
                        icon: 'fa-solid fa-check-double fa-lg text-success',
                        command: () => this.onApproveJobRequirement('btnSuccessApproved')
                    },
                    { separator: true },
                    {
                        label: 'Thêm đề xuất',
                        icon: 'fa-solid fa-plus fa-lg text-success',
                        command: () => this.onAddSupplier(false),
                        disabled: !this.canAddOrEdit()
                    },
                    {
                        label: 'Sửa đề xuất',
                        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
                        command: () => this.onAddSupplier(true),
                        disabled: !this.canAddOrEdit() || this.JobrequirementID === 0
                    },
                    {
                        label: 'Xem chi tiết đề xuất',
                        icon: 'fa-solid fa-eye fa-lg text-info',
                        command: () => this.onOpenDepartmentRequired()
                    },
                    { separator: true },
                    {
                        label: 'Ghi chú',
                        icon: 'fa-solid fa-note-sticky fa-lg text-warning',
                        command: () => this.onOpenNoteModal()
                    }
                ]
            });
        }

        // BGD Menu - no approval mode or approval mode 3
        if (!this.approvalMode || this.approvalMode === 3) {
            this.menuBars.push({
                label: 'Ban Giám Đốc',
                visible: this.permissionService.hasPermission("N58,N1"),
                icon: 'fa-solid fa-user-tie fa-lg text-primary',
                items: [
                    {
                        label: 'Duyệt',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => this.onApproveJobRequirement('btnSuccessApproved')
                    },
                    {
                        label: 'Hủy duyệt',
                        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
                        command: () => this.onApproveJobRequirement('btnUnApproveBGĐ')
                    }
                ]
            });
        }

        // Bộ phận phối hợp - only when not in approval mode
        if (!this.approvalMode) {
            this.menuBars.push({
                label: 'Bộ phận phối hợp',
                visible: this.permissionService.hasPermission("N34,N56,N1,N80"),
                icon: 'fa-solid fa-users fa-lg text-info',
                items: [
                    {
                        label: 'Nhân sự',
                        icon: 'fa-solid fa-circle-check fa-lg text-success',
                        command: () => this.onConfirmComplete()
                    },
                    {
                        label: 'Yêu cầu báo giá',
                        icon: 'fa-solid fa-file-invoice-dollar fa-lg text-warning',
                        command: () => this.onRequestPriceQuote()
                    }
                ]
            });
        }

        // View buttons - always available
        this.menuBars.push(
            {
                label: 'Xem yêu cầu mua',
                icon: 'fa-solid fa-eye fa-lg text-info',
                command: () => this.onViewPurchaseRequest()
            },
            {
                label: 'Tổng hợp',
                icon: 'fa-solid fa-chart-bar fa-lg text-primary',
                command: () => this.onOpenSummary()
            },
            {
                label: 'In Phiếu',
                icon: 'fa-solid fa-print fa-lg text-secondary',
                command: () => this.onPrintJobRequirement()
            }
        );
    }
    ngAfterViewInit(): void {
        // Grid initialization moved to ngOnInit
    }

    currentUser: any = null;

    constructor(
        private notification: NzNotificationService,
        private JobRequirementService: JobRequirementService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private cdr: ChangeDetectorRef,
        private message: NzMessageService,
        private menuEventService: MenuEventService,
        private authService: AuthService,
        private route: ActivatedRoute,
        private permissionService: PermissionService,
    ) {
    }
    getCurrentUser(): void {
        this.authService.getCurrentUser().subscribe({
            next: (res: any) => {
                const data = res?.data;
                this.currentUser = Array.isArray(data) ? data[0] : data;
                if (this.approvalMode === 1 && this.currentUser?.EmployeeID) {
                    this.searchParams.ApprovedTBPID = this.currentUser.EmployeeID;
                }
                this.getJobrequirement();
            },
            error: (err) => {
                this.notification.error("Lỗi", err.error.message);
            }
        });
    }

    //search
    filterOption = (input: string, option: any): boolean => {
        const label = option.nzLabel?.toLowerCase() || '';
        const value = option.nzValue?.toString().toLowerCase() || '';
        return (
            label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
        );
    };

    private formatApprovalBadge(status: number): string {
        // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
        const numStatus =
            status === null || status === undefined ? 0 : Number(status);

        switch (numStatus) {
            case 0:
                return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Chưa duyệt</span>';
            case 1:
                return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Đã duyệt</span>';
            case 2:
                return '<span class="badge bg-danger" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Không duyệt</span>';
            default:
                return '<span class="badge bg-secondary" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Không xác định</span>';
        }
    }

    getJobrequirement(): void {
        this.isLoading = true;
        this.JobRequirementService.getJobrequirement(
            this.searchParams.DepartmentID,
            this.searchParams.EmployeeID,
            this.searchParams.ApprovedTBPID,
            this.searchParams.Step,
            this.searchParams.Request,
            this.searchParams.DateStart,
            this.searchParams.DateEnd
        ).subscribe({
            next: (response: any) => {
                this.JobrequirementData = response.data || [];

                // Map data with id for SlickGrid
                this.dataset = this.JobrequirementData.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID,
                    RowIndex: index + 1
                }));

                // Apply distinct filters after data is loaded
                setTimeout(() => {
                    this.applyDistinctFilters();

                    // Select first row if data exists
                    if (this.dataset.length > 0 && this.angularGrid?.slickGrid) {
                        this.JobrequirementID = this.dataset[0].ID;
                        this.angularGrid.slickGrid.setSelectedRows([0]);
                        this.getJobrequirementDetails(this.JobrequirementID);
                        this.getHCNSData(this.JobrequirementID);
                    } else {
                        this.JobrequirementID = 0;
                    }
                }, 100);
                this.isLoading = false;
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
                );
            }
        });
    }


    /**
     * Gọi API một lần để lấy tất cả dữ liệu: details, files, approves
     */
    getJobrequirementDetails(id: number) {
        this.JobRequirementService.getJobrequirementbyID(id).subscribe(
            (response: any) => {
                const data = response.data || {};

                // Cập nhật details - map with id for SlickGrid
                this.JobrequirementDetailData = data.details || [];
                this.datasetDetail = this.JobrequirementDetailData.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || index
                }));

                // Cập nhật files - map with id for SlickGrid
                this.JobrequirementFileData = data.files || [];
                this.datasetFile = this.JobrequirementFileData.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || index
                }));

                // Cập nhật approves - map with id for SlickGrid
                this.JobrequirementApprovedData = data.approves || [];
                this.datasetApproved = this.JobrequirementApprovedData.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || index
                }));
            }
        );
    }

    getdataDepartment() {
        this.JobRequirementService.getDataDepartment().subscribe((response: any) => {
            this.dataDepartment = response.data || [];
        });
    }
    getdataEmployee() {
        this.JobRequirementService.getAllEmployee().subscribe((response: any) => {
            this.cbbEmployee = response.data || [];
        });
    }

    getHCNSData(JobrequirementID: number): void {
        if (!JobrequirementID || JobrequirementID === 0) {
            this.HCNSApprovalData = [];
            this.isHCNSApproved = false;
            return;
        }

        this.JobRequirementService
            .getHCNSProposals(
                JobrequirementID,
                this.DepartmentRequiredID,
                this.searchParams.DateStart,
                this.searchParams.DateEnd
            )
            .subscribe({
                next: (response: any) => {
                    this.HCNSApprovalData = response.data?.HCNSProPosalData || [];

                    // Chỉ chặn khi có bản ghi đã được duyệt (IsApproved = 1)
                    // 0: Chưa duyệt, 1: Đã duyệt, 2: Hủy duyệt
                    this.isHCNSApproved = this.HCNSApprovalData.some((item: any) => {
                        const isApproved = item.IsApproved;
                        // Chỉ chặn khi IsApproved = 1 (Đã duyệt)
                        return isApproved === 1 || isApproved === '1';
                    });
                },
                error: (err) => {
                    this.HCNSApprovalData = [];
                    this.isHCNSApproved = false;
                },
            });
    }

    /**
     * Kiểm tra xem có thể thêm mới hoặc sửa không
     */
    canAddOrEdit(): boolean {
        return !this.isHCNSApproved;
    }

    onAddSupplier(isEditmode: boolean) {
        this.isCheckmode = isEditmode;
        if (this.isCheckmode == true && this.JobrequirementID === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn 1 bản ghi để sửa!'
            );
            return;
        }

        // Kiểm tra nếu đã duyệt thì không cho phép thêm mới hoặc sửa
        if (this.isHCNSApproved) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không thể thêm mới hoặc chỉnh sửa bản ghi đã được duyệt!'
            );
            return;
        }

        const selected = this.getSelectedData() || [];
        const rowData = { ...selected[0] };
        const modalRef = this.modalService.open(RecommendSupplierFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.JobrequirementID = this.JobrequirementID;
        modalRef.componentInstance.dataInput = rowData;

        modalRef.result
            .then((result) => {
                if (result == true) {
                    this.getJobrequirement();
                    // Refresh grid data after changes
                    // Reload HCNS data để cập nhật trạng thái
                    if (this.JobrequirementID) {
                        this.getHCNSData(this.JobrequirementID);
                    }
                }
            })
            .catch(() => { });
    }

    onAddJobRequirement(isEditmode: boolean) {
        this.isCheckmode = isEditmode;

        // Nếu là chế độ sửa, cần kiểm tra có row được chọn không
        if (this.isCheckmode == true) {
            const selected = this.getSelectedData() || [];
            if (selected.length === 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Vui lòng chọn 1 bản ghi để sửa!'
                );
                return;
            }

            const rowData = { ...selected[0] };
            const jobRequirementID = rowData?.ID || 0;

            if (!jobRequirementID || jobRequirementID <= 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Không tìm thấy ID của bản ghi!'
                );
                return;
            }

            // Kiểm tra nếu đã có bước duyệt > 1 thì không cho phép sửa
            const approvedStep = this.JobrequirementApprovedData.find((item: any) =>
                item.JobRequirementID === jobRequirementID &&
                item.Step > 1 &&
                (item.IsApproved === 1 || item.IsApproved === '1')
            );
            if (approvedStep) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Phiếu đã được duyệt, không thể sửa!'
                );
                return;
            }

            // Kiểm tra nếu đã duyệt thì không cho phép sửa
            if (this.isHCNSApproved) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Không thể chỉnh sửa bản ghi đã được duyệt!'
                );
                return;
            }

            const modalRef = this.modalService.open(JobRequirementFormComponent, {
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                centered: true,
            });
            modalRef.componentInstance.isCheckmode = this.isCheckmode;
            modalRef.componentInstance.JobRequirementID = jobRequirementID;
            modalRef.componentInstance.dataInput = rowData;

            modalRef.result
                .then((result) => {
                    if (result == true) {
                        this.getJobrequirement();
                        // Refresh grid data after changes
                    }
                })
                .catch(() => { });
        } else {
            // Thêm mới: không cần chọn row, không cần ID
            // Kiểm tra nếu đã duyệt thì không cho phép thêm mới (nếu cần)
            // if (this.isHCNSApproved) {
            //   this.notification.warning(
            //     NOTIFICATION_TITLE.warning,
            //     'Không thể thêm mới bản ghi đã được duyệt!'
            //   );
            //   return;
            // }

            const modalRef = this.modalService.open(JobRequirementFormComponent, {
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                centered: true,
            });
            modalRef.componentInstance.isCheckmode = this.isCheckmode;
            modalRef.componentInstance.JobRequirementID = 0; // Thêm mới nên ID = 0
            modalRef.componentInstance.dataInput = {}; // Không có data input khi thêm mới

            modalRef.result
                .then((result) => {
                    if (result == true) {
                        this.getJobrequirement();
                        // Refresh grid data after changes
                    }
                })
                .catch(() => { });
        }
    }
    onDeleteJobRequirement() {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một bản ghi để xóa!'
            );
            return;
        }

        // Lấy danh sách ID từ các row được chọn
        const ids = selected.map((row: any) => row.ID).filter((id: number) => id && id > 0);

        if (ids.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi cần xóa!'
            );
            return;
        }

        // Validate: Kiểm tra quyền xóa - chỉ được xóa phiếu của chính mình
        const currentEmployeeID = this.currentUser?.EmployeeID;
        const notOwnedRecords = selected.filter((row: any) => row.EmployeeID !== currentEmployeeID);
        if (notOwnedRecords.length > 0) {
            const notOwnedCodes = notOwnedRecords.map((row: any) => row.NumberRequest || row.Code || `ID: ${row.ID}`).join(', ');
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Bạn không thể xóa phiếu của người khác: ${notOwnedCodes}`
            );
            return;
        }

        // Validate: Kiểm tra bản ghi đã được duyệt (Step > 1 và IsApproved = 1)
        const approvedRecords: string[] = [];
        for (const row of selected) {
            // Kiểm tra trong JobrequirementApprovedData nếu có
            // Hoặc kiểm tra trực tiếp từ row data nếu có thông tin duyệt
            if (row.IsApprovedTBP === true || row.IsApprovedTBP === 1 || row.IsApprovedTBP === '1' ||
                row.IsApprovedHR === true || row.IsApprovedHR === 1 || row.IsApprovedHR === '1' ||
                row.IsApprovedBGD === true || row.IsApprovedBGD === 1 || row.IsApprovedBGD === '1') {
                approvedRecords.push(row.NumberRequest || row.Code || `ID: ${row.ID}`);
            }
        }
        if (approvedRecords.length > 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Không thể xóa bản ghi đã được duyệt: ${approvedRecords.join(', ')}`
            );
            return;
        }

        // Hiển thị confirm dialog
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} bản ghi đã chọn?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.JobRequirementService.deleteJobRequirement(ids).subscribe({
                    next: (response: any) => {
                        if (response.status == 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                response.message || 'Xóa thành công!'
                            );
                            // Refresh lại table
                            this.getJobrequirement();
                            // Reset selection
                            this.JobrequirementID = 0;
                            this.JobrequirementDetailData = [];
                            this.JobrequirementFileData = [];
                            this.JobrequirementApprovedData = [];
                            // Reset SlickGrid datasets
                            this.datasetDetail = [];
                            this.datasetFile = [];
                            this.datasetApproved = [];
                        } else {
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                response.message || 'Xóa thất bại!'
                            );
                        }
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Xóa thất bại!';
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            errorMessage
                        );
                    }
                });
            }
        });
    }

    onOpenDepartmentRequired() {
        const selected = this.getSelectedData() || [];
        const rowData = { ...selected[0] };

        // Lấy JobrequirementID từ row đã chọn hoặc từ biến
        const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;

        const title = 'Đề xuất mua hàng';
        const data = {
            JobrequirementID: jobRequirementID,
            isCheckmode: this.isCheckmode,
            dataInput: rowData
        };

        this.menuEventService.openNewTab(
            HrPurchaseProposalComponent,
            title,
            data
        );
    }

    /**
     * Xem yêu cầu báo giá
     */
    onViewPriceQuote(): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một bản ghi để xem yêu cầu báo giá!'
            );
            return;
        }

        const rowData = selected[0];
        const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;

        if (jobRequirementID <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }
    }

    /**
     * Xem yêu cầu mua hàng
     */
    onViewPurchaseRequest(): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một bản ghi để xem yêu cầu mua hàng!'
            );
            return;
        }

        const rowData = selected[0];
        const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;
        const numberRequest = rowData?.NumberRequest || rowData?.Code || '';

        if (jobRequirementID <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }

        // Mở modal fullscreen
        const modalRef = this.modalService.open(JobRequirementPurchaseRequestViewComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'job-requirement-purchase-request-modal',
        });

        // Truyền dữ liệu vào modal
        modalRef.componentInstance.jobRequirementID = jobRequirementID;
        modalRef.componentInstance.numberRequest = numberRequest;

        modalRef.result.then(
            (result) => {
                // Handle result if needed
            },
            () => {
                // Modal dismissed
            }
        );
    }

    /**
     * Tổng hợp yêu cầu công việc - mở modal JobRequirementSummaryComponent
     */
    onOpenSummary(): void {
        const modalRef = this.modalService.open(JobRequirementSummaryComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'job-requirement-summary-modal',
        });

        modalRef.result.then(
            (result) => {
                // Handle result if needed
            },
            () => {
                // Modal dismissed
            }
        );
    }

    /**
     * In phiếu yêu cầu công việc
     */
    onPrintJobRequirement(): void {
        if (!this.JobrequirementID) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn yêu cầu công việc cần in!'
            );
            return;
        }

        // Lấy dữ liệu chi tiết của yêu cầu công việc
        this.JobRequirementService.getJobrequirementbyID(this.JobrequirementID).subscribe({
            next: (response: any) => {
                const data = response.data || {};

                // Lấy thông tin chính từ bảng JobrequirementData
                const selectedRow = this.getSelectedData()[0];
                const jobRequirement = selectedRow || {};

                // Lấy chi tiết từ response
                const details = data.details || [];
                const approvals = data.approves || [];
                const files = data.files || [];

                // Load logo và tạo PDF
                this.loadImageAsBase64('assets/images/logo-RTC-2023-1200-banchuan.png').then((logoBase64) => {
                    const docDefinition = this.createJobRequirementPDF(jobRequirement, details, approvals, files, logoBase64);
                    pdfMake.createPdf(docDefinition).open();
                }).catch((err) => {
                    // Nếu không load được logo, tạo PDF không có logo
                    const docDefinition = this.createJobRequirementPDF(jobRequirement, details, approvals, files, null);
                    pdfMake.createPdf(docDefinition).open();
                });
            },
            error: (err: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi lấy dữ liệu: ' + (err?.error?.message || err?.message)
                );
            }
        });
    }

    /**
     * Load ảnh và chuyển sang base64
     */
    private loadImageAsBase64(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } else {
                    reject('Cannot get canvas context');
                }
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Tạo PDF definition cho yêu cầu công việc
     */
    private createJobRequirementPDF(jobRequirement: any, details: any[], approvals: any[], files: any[], logoBase64: string | null): any {
        // Format date helper
        const formatDate = (date: any) => {
            if (!date) return '';
            return DateTime.fromISO(date).toFormat('dd/MM/yyyy');
        };

        // Format date time helper
        const formatDateTime = (date: any) => {
            if (!date) return '';
            return DateTime.fromISO(date).toFormat('dd/MM/yyyy HH:mm');
        };

        // Extract approval information
        const extractApprovalInfo = (step: number) => {
            const approval = approvals.find((a: any) => a.Step === step && (a.IsApproved === 1 || a.IsApproved === '1'));
            if (approval) {
                return {
                    date: formatDateTime(approval.DateApproved),
                    approver: approval.EmployeeName || ''
                };
            }
            return { date: '', approver: '' };
        };

        // Get approval info for each step
        const tbpApproval = extractApprovalInfo(2); // TBP duyệt
        const hrApproval = extractApprovalInfo(4);  // TBP HCNS duyệt  
        const bgdApproval = extractApprovalInfo(5); // BGĐ duyệt

        // Tạo danh sách chi tiết cho bảng "Nội dung yêu cầu"
        const detailRows = details.map((item: any, index: number) => [
            { text: (index + 1).toString(), alignment: 'center', fontSize: 10 },
            { text: item.Category || '', fontSize: 10 },
            { text: item.Description || '', fontSize: 10 },
            { text: item.Target || '', fontSize: 10 },
            { text: item.Note || '', fontSize: 10 },
        ]);

        // Logo column
        const logoColumn = logoBase64
            ? {
                width: 100,
                image: logoBase64,
                fit: [150, 150],
                margin: [0, 0, 10, 0],
            }
            : {
                width: 80,
                text: '',
                margin: [0, 0, 10, 0],
            };

        const docDefinition = {
            info: {
                title: 'Phiếu yêu cầu công việc - ' + (jobRequirement.NumberRequest || ''),
            },
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [40, 40, 40, 40],
            content: [
                // Header với logo và tiêu đề
                {
                    columns: [
                        logoColumn,
                        {
                            width: '*',
                            stack: [
                                {
                                    text: 'PHIẾU YÊU CẦU CÔNG VIỆC',
                                    alignment: 'center',
                                    bold: true,
                                    fontSize: 16,
                                },
                                {
                                    text: 'Số: ' + (jobRequirement.NumberRequest || ''),
                                    alignment: 'center',
                                    fontSize: 10,
                                    margin: [0, 5, 0, 0],
                                },
                            ],
                        },
                    ],
                    margin: [0, 0, 0, 15],
                },
                // Thông tin bộ phận
                {
                    table: {
                        widths: [140, '*'],
                        body: [
                            [
                                { text: 'Bộ phận yêu cầu', bold: true },
                                { text: ': ' + (jobRequirement.EmployeeDepartment || '') },
                            ],
                            [
                                { text: 'Bộ phận được yêu cầu', bold: true },
                                { text: ': ' + (jobRequirement.RequiredDepartment || '') },
                            ],
                            [
                                { text: 'Bộ phận phối hợp', bold: true },
                                { text: ': ' + (jobRequirement.CoordinationDepartment || '') },
                            ],
                            [
                                { text: 'Người phê duyệt', bold: true },
                                { text: ': ' + (jobRequirement.FullNameApprovedTBP || '') },
                            ],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 0, 0, 10],
                },
                // Nội dung yêu cầu
                {
                    text: 'Nội dung yêu cầu:',
                    bold: true,
                    fontSize: 11,
                    margin: [0, 5, 0, 5],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [30, 80, '*', 100, 80],
                        body: [
                            [
                                { text: 'TT', alignment: 'center', bold: true, fontSize: 11 },
                                { text: 'Hạng mục', alignment: 'center', bold: true, fontSize: 11 },
                                { text: 'Diễn giải', alignment: 'center', bold: true, fontSize: 11 },
                                { text: 'Mục tiêu cần đạt', alignment: 'center', bold: true, fontSize: 11 },
                                { text: 'Ghi chú', alignment: 'center', bold: true, fontSize: 11 },
                            ],
                            ...detailRows,
                        ],
                    },
                    layout: {
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                        hLineColor: () => '#000000',
                        vLineColor: () => '#000000',
                    },
                    margin: [0, 0, 0, 10],
                },
                // Tài liệu kèm theo
                ...(files.length > 0 ? [
                    {
                        text: 'Tài liệu kèm theo Phiếu yêu cầu công việc: ',
                        fontSize: 10,
                        margin: [0, 10, 0, 5],
                    },
                    {
                        ul: files.map((file: any) => file.FileName || file.FileName || ''),
                        fontSize: 9,
                        margin: [0, 0, 0, 30],
                    }
                ] : [
                    {
                        text: 'Tài liệu kèm theo Phiếu yêu cầu công việc: Không có',
                        fontSize: 10,
                        margin: [0, 10, 0, 30],
                    }
                ]),
                // Đánh giá mức độ hoàn thành
                {
                    text: 'Đánh giá mức độ hoàn thành: ',
                    bold: true,
                    fontSize: 10,
                    margin: [0, 10, 0, 20],
                },
                // Chữ ký
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { text: tbpApproval.date, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                                { text: 'Trưởng bộ phận yêu cầu', alignment: 'center', bold: true, fontSize: 10 },
                                { text: tbpApproval.approver, alignment: 'center', fontSize: 10, margin: [0, 10, 0, 0] },
                            ],
                        },
                        {
                            width: '*',
                            stack: [
                                { text: hrApproval.date, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                                { text: 'TBP HCNS duyệt', alignment: 'center', bold: true, fontSize: 10 },
                                { text: hrApproval.approver, alignment: 'center', fontSize: 10, margin: [0, 10, 0, 0] },
                            ],
                        },
                        {
                            width: '*',
                            stack: [
                                { text: bgdApproval.date, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                                { text: 'Phê duyệt', alignment: 'center', bold: true, fontSize: 10 },
                                { text: bgdApproval.approver, alignment: 'center', fontSize: 10, margin: [0, 10, 0, 0] },
                            ],
                        },
                    ],
                    margin: [0, 0, 0, 0],
                },
            ],
            defaultStyle: {
                fontSize: 10,
                font: 'Times',
            },
        };

        return docDefinition;
    }

    /**
     * Yêu cầu báo giá - mở form ProjectPartlistPriceRequestNewComponent
     */
    onRequestPriceQuote(): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một bản ghi để yêu cầu báo giá!'
            );
            return;
        }

        const rowData = selected[0];
        const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;

        if (jobRequirementID <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }

        const modalRef = this.modalService.open(ProjectPartlistPriceRequestNewComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            backdrop: 'static',
        });
        modalRef.componentInstance.jobRequirementID = jobRequirementID;

        modalRef.result.then(
            (result) => {
                if (result) {
                    this.getJobrequirement();
                }
            },
            () => {
                // Modal dismissed
            }
        );
    }

    /**
     * Xác nhận hoàn thành yêu cầu công việc (BPPH)
     */
    onConfirmComplete(): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một bản ghi!'
            );
            return;
        }

        const rowData = selected[0];
        const id = rowData?.ID || 0;
        const numberRequest = rowData?.NumberRequest || rowData?.Code || '';
        const status = rowData?.Status || 0;

        if (id <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }

        // Kiểm tra BGĐ đã duyệt chưa (Step 5, IsApproved = 1)
        const bgdApproved = this.JobrequirementApprovedData.find((item: any) =>
            item.JobRequirementID === id &&
            item.Step === 5 &&
            (item.IsApproved === 1 || item.IsApproved === '1')
        );

        if (!bgdApproved) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Yêu cầu công việc [${numberRequest}] cần được BGĐ duyệt!`
            );
            return;
        }

        // Kiểm tra đã hoàn thành chưa
        if (status === 1) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Yêu cầu công việc [${numberRequest}] đã hoàn thành!`
            );
            return;
        }

        // Hiển thị dialog xác nhận
        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: `Bạn có chắc muốn xác nhận hoàn thành yêu cầu công việc [${numberRequest}] không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Tạo model để gửi API
                const model = {
                    ID: id,
                    Status: 1, // Hoàn thành công việc
                    UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
                    UpdatedDate: new Date().toISOString()
                };

                // Gọi API
                this.JobRequirementService.saveRequestBGDApprove(model).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                'Xác nhận hoàn thành thành công!'
                            );
                            // Refresh lại table
                            this.getJobrequirement();
                            // Refresh lại details nếu có JobRequirementID
                            if (this.JobrequirementID) {
                                this.getJobrequirementDetails(this.JobrequirementID);
                            }
                        } else {
                            const errorMessage = response?.message || 'Không thể xác nhận hoàn thành!';
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                errorMessage
                            );
                        }
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi xác nhận hoàn thành!';
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            errorMessage
                        );
                    }
                });
            }
        });
    }

    /**
     * Mở modal để nhập ghi chú
     */
    onOpenNoteModal(): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một bản ghi để thêm ghi chú!'
            );
            return;
        }

        const rowData = selected[0];
        const id = rowData?.ID || 0;

        if (id <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }

        const currentNote = rowData?.Note || '';
        const numberRequest = rowData?.NumberRequest || rowData?.Code || '';

        // Mở modal component
        const modalRef = this.modalService.open(NoteFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });

        // Set initial note value trước khi component khởi tạo
        modalRef.componentInstance.initialNote = currentNote;

        // Handle modal result
        modalRef.result
            .then((result: any) => {
                if (result && result.confirmed) {
                    const note = result.note || '';

                    // Tạo model để gửi API
                    const model = {
                        ID: id,
                        Note: note,
                        UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
                        UpdatedDate: new Date().toISOString()
                    };

                    // Gọi API save-comment
                    this.JobRequirementService.saveComment(model).subscribe({
                        next: (response: any) => {
                            if (response && response.status === 1) {
                                this.notification.success(
                                    NOTIFICATION_TITLE.success,
                                    'Lưu ghi chú thành công!'
                                );
                                // Refresh lại table
                                this.getJobrequirement();
                                // Refresh lại details nếu có JobRequirementID
                                if (this.JobrequirementID) {
                                    this.getJobrequirementDetails(this.JobrequirementID);
                                }
                            } else {
                                const errorMessage = response?.message || 'Không thể lưu ghi chú!';
                                this.notification.error(
                                    NOTIFICATION_TITLE.error,
                                    errorMessage
                                );
                            }
                        },
                        error: (error: any) => {
                            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi lưu ghi chú!';
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                errorMessage
                            );
                        }
                    });
                }
            })
            .catch(() => {
                // User cancelled, do nothing
            });
    }

    onDeleteJobrequirement() { }

    /**
     * Xem file (ảnh) trong modal hoặc tab mới
     * Chuyển đổi UNC path sang HTTP URL sử dụng environment.host và api/share
     */
    viewFile(fileData: any): void {
        const filePath = fileData?.FilePath || '';
        const fileName = fileData?.FileName || 'file';

        if (!filePath) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy đường dẫn file!'
            );
            return;
        }

        try {
            // Tìm vị trí "Common" trong đường dẫn (không phân biệt hoa thường)
            const commonIndex = filePath.toLowerCase().indexOf('common');

            if (commonIndex === -1) {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Đường dẫn file không chứa thư mục Common!'
                );
                return;
            }

            // Lấy phần đường dẫn từ "Common" trở đi
            let pathAfterCommon = filePath.substring(commonIndex);

            // Chuyển đổi backslash thành forward slash
            pathAfterCommon = pathAfterCommon.replace(/\\/g, '/');

            // Đảm bảo bắt đầu bằng "Common/" (không phải "common/")
            if (!pathAfterCommon.startsWith('Common/')) {
                pathAfterCommon = 'Common/' + pathAfterCommon.substring(pathAfterCommon.indexOf('/') + 1);
            }

            // Ghép với environment.host và api/share
            const url = `${environment.host}api/share/${pathAfterCommon}`;

            // Kiểm tra extension file để quyết định cách hiển thị
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
            const isImage = imageExtensions.includes(fileExtension);

            if (isImage) {
                // Nếu là ảnh, mở trong modal để xem
                this.modal.create({
                    nzTitle: fileName,
                    nzContent: `
            <div style="text-align: center; padding: 10px;">
              <img 
                src="${url}" 
                style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" 
                alt="${fileName}"
                onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-family=\\'Arial\\' font-size=\\'16\\' fill=\\'%23999\\'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';"
              />
            </div>
          `,
                    nzWidth: '90%',
                    nzStyle: { top: '20px' },
                    nzBodyStyle: { padding: '20px', textAlign: 'center', overflow: 'auto', maxHeight: '90vh' },
                    nzFooter: null,
                    nzMaskClosable: true,
                    nzClosable: true
                });
            } else {
                // Nếu không phải ảnh, mở trong tab mới
                window.open(url, '_blank');
                this.notification.success(
                    NOTIFICATION_TITLE.success,
                    `Đang mở file: ${fileName}`
                );
            }
        } catch (error: any) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Lỗi khi xem file: ' + (error?.message || '')
            );
        }
    }

    /**
     * Tải file từ FilePath
     * Chuyển đổi UNC path sang HTTP URL sử dụng environment.host và api/share
     */
    downloadFile(fileData: any): void {
        const filePath = fileData?.FilePath || '';
        const fileName = fileData?.FileName || 'file';

        if (!filePath) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy đường dẫn file!'
            );
            return;
        }

        try {
            // Tìm vị trí "Common" trong đường dẫn (không phân biệt hoa thường)
            const commonIndex = filePath.toLowerCase().indexOf('common');

            if (commonIndex === -1) {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Đường dẫn file không chứa thư mục Common!'
                );
                return;
            }

            // Lấy phần đường dẫn từ "Common" trở đi
            let pathAfterCommon = filePath.substring(commonIndex);

            // Chuyển đổi backslash thành forward slash
            pathAfterCommon = pathAfterCommon.replace(/\\/g, '/');

            // Đảm bảo bắt đầu bằng "Common/" (không phải "common/")
            if (!pathAfterCommon.startsWith('Common/')) {
                pathAfterCommon = 'Common/' + pathAfterCommon.substring(pathAfterCommon.indexOf('/') + 1);
            }

            // Ghép với environment.host và api/share
            const url = `${environment.host}api/share/${pathAfterCommon}`;

            // Mở URL trong tab mới để tải file
            window.open(url, '_blank');

            this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đang tải file: ${fileName}`
            );
        } catch (error: any) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Lỗi khi tải file: ' + (error?.message || '')
            );
        }
    }

    /**
     * Map button name sang step và status
     * @param buttonName Tên button (ví dụ: btnApproveTBP_New, btnUnApproveTBP_New, etc.)
     * @returns Object { step: number, status: number } hoặc null nếu không tìm thấy
     */
    private getStepAndStatusFromButton(buttonName: string): { step: number; status: number } | null {
        // Status: 1 = duyệt, 2 = hủy
        const buttonMap: { [key: string]: { step: number; status: number } } = {
            // Step 2: TBP xác nhận
            'btnApproveTBP_New': { step: 2, status: 1 },
            'btnUnApproveTBP_New': { step: 2, status: 2 },
            'btnTBP': { step: 2, status: 1 }, // Default approve cho TBP

            // Step 3: HR check yêu cầu
            'btnApproveDocumentHR': { step: 3, status: 1 },
            'btnUnApproveDocumentHR': { step: 3, status: 2 },

            // Step 4: TBP HR xác nhận
            'btnApproveHR': { step: 4, status: 1 },
            'btnUnApproveHR': { step: 4, status: 2 },

            // Step 5: BGĐ xác nhận
            'btnSuccessApproved': { step: 5, status: 1 },
            'btnBGĐ': { step: 5, status: 1 },
            'btnUnApproveBGĐ': { step: 5, status: 2 },
        };

        return buttonMap[buttonName] || null;
    }

    /**
     * Xử lý duyệt/hủy duyệt job requirement
     * @param buttonName Tên button được click
     */
    onApproveJobRequirement(buttonName: string): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một bản ghi để duyệt!'
            );
            return;
        }

        // Lấy step và status từ button name
        const stepStatus = this.getStepAndStatusFromButton(buttonName);
        if (!stepStatus) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy bước duyệt tương ứng với nút này!'
            );
            return;
        }

        const { step, status } = stepStatus;

        // Kiểm tra HR không thể hủy duyệt nếu BGD đã duyệt (Step 4 hủy duyệt khi Step 5 đã duyệt)
        if (step === 4 && status === 2) {
            for (const row of selected) {
                const bgdApproved = this.JobrequirementApprovedData.find((item: any) =>
                    item.JobRequirementID === row.ID &&
                    item.Step === 5 &&
                    (item.IsApproved === 1 || item.IsApproved === '1')
                );
                if (bgdApproved) {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        `Không thể hủy duyệt HR vì BGĐ đã duyệt phiếu "${row.NumberRequest || row.ID}"!`
                    );
                    return;
                }
            }
        }

        // Nếu là hủy duyệt (status = 2), cần nhập lý do
        if (status === 2) {
            this.showCancelReasonModal(selected, step);
        } else {
            // Duyệt (status = 1), gọi API trực tiếp
            this.processApprove(selected, step, status, '');
        }
    }

    /**
     * Hiển thị modal nhập lý do hủy
     */
    private showCancelReasonModal(selected: any[], step: number): void {
        const modalRef = this.modalService.open(CancelApproveReasonFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });

        modalRef.result
            .then((reasonCancel: string) => {
                if (reasonCancel && reasonCancel.trim()) {
                    this.processApprove(selected, step, 2, reasonCancel.trim());
                }
            })
            .catch(() => {
                // User cancelled, do nothing
            });
    }

    /**
     * Xử lý duyệt/hủy duyệt
     */
    private processApprove(selected: any[], step: number, status: number, reasonCancel: string): void {
        // Tạo danh sách approve request
        const approveList = selected.map((row: any) => ({
            JobRequirementID: row.ID || 0,
            Step: step,
            Status: status,
            ReasonCancel: reasonCancel || ''
        })).filter((item: any) => item.JobRequirementID > 0);

        if (approveList.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi cần duyệt!'
            );
            return;
        }

        // Gọi API approve
        this.JobRequirementService.approveJobRequirement(approveList).subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    const results = response.data || [];
                    let successCount = 0;
                    let failCount = 0;
                    const errorMessages: string[] = [];

                    results.forEach((result: any) => {
                        if (result.Success) {
                            successCount++;
                        } else {
                            failCount++;
                            if (result.Message) {
                                errorMessages.push(result.Message);
                            }
                        }
                    });

                    // Hiển thị thông báo kết quả
                    if (successCount > 0 && failCount === 0) {
                        this.notification.success(
                            NOTIFICATION_TITLE.success,
                            `Duyệt thành công ${successCount} bản ghi!`
                        );
                        // Refresh lại table
                        this.getJobrequirement();
                        if (this.JobrequirementID) {
                            this.getJobrequirementDetails(this.JobrequirementID);
                        }
                    } else if (successCount > 0 && failCount > 0) {
                        this.notification.warning(
                            NOTIFICATION_TITLE.warning,
                            `Duyệt thành công ${successCount} bản ghi, thất bại ${failCount} bản ghi. ${errorMessages.join('; ')}`
                        );
                        // Refresh lại table
                        this.getJobrequirement();
                        if (this.JobrequirementID) {
                            this.getJobrequirementDetails(this.JobrequirementID);
                        }
                    } else {
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            errorMessages.length > 0 ? errorMessages.join('; ') : 'Duyệt thất bại!'
                        );
                    }
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        response?.message || 'Duyệt thất bại!'
                    );
                }
            },
            error: (error: any) => {
                const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Duyệt thất bại!';
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    errorMessage
                );
            }
        });
    }

    /**
     * Xử lý yêu cầu/hủy yêu cầu BGD duyệt
     */
    onRequestBGDApprove(isRequest: boolean): void {
        const selected = this.getSelectedData() || [];

        if (selected.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một bản ghi!'
            );
            return;
        }

        // Chỉ xử lý bản ghi đầu tiên (theo luồng C#)
        const rowData = selected[0];
        const id = rowData?.ID || 0;

        if (id <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID của bản ghi!'
            );
            return;
        }

        const numberRequest = rowData?.NumberRequest || rowData?.Code || '';
        const isRequestText = isRequest ? 'yêu cầu' : 'huỷ yêu cầu';
        const confirmMessage = `Bạn có chắc muốn ${isRequestText} BGĐ duyệt yêu cầu công việc [${numberRequest}] không?`;

        // Hiển thị dialog xác nhận
        this.modal.confirm({
            nzTitle: 'Thông báo',
            nzContent: confirmMessage,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Tạo model để gửi API
                const model = {
                    ID: id,
                    IsRequestBGDApproved: isRequest,
                    UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
                    UpdatedDate: new Date().toISOString()
                };

                // Gọi API
                this.JobRequirementService.saveRequestBGDApprove(model).subscribe({
                    next: (response: any) => {
                        if (response && response.status === 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                `Đã ${isRequestText} BGĐ duyệt thành công!`
                            );
                            // Refresh lại table
                            this.getJobrequirement();
                            // Refresh lại details nếu có JobRequirementID
                            if (this.JobrequirementID) {
                                this.getJobrequirementDetails(this.JobrequirementID);
                            }
                        } else {
                            const errorMessage = response?.message || `Không thể ${isRequestText} BGĐ duyệt!`;
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                errorMessage
                            );
                        }
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || `Lỗi khi ${isRequestText} BGĐ duyệt!`;
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            errorMessage
                        );
                    }
                });
            }
        });
    }

    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
        // Force resize grids after splitter resize
        setTimeout(() => {
            if (this.angularGrid?.resizerService) {
                this.angularGrid.resizerService.resizeGrid();
            }
            if (this.angularGridDetail?.resizerService) {
                this.angularGridDetail.resizerService.resizeGrid();
            }
            if (this.angularGridFile?.resizerService) {
                this.angularGridFile.resizerService.resizeGrid();
            }
            if (this.angularGridApproved?.resizerService) {
                this.angularGridApproved.resizerService.resizeGrid();
            }
        }, 300);
    }

    ToggleSearchPanelNew(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.showSearchBar = !this.showSearchBar;
    }

    searchData() {

        this.getJobrequirement();
    }

    onKeywordChange(value: string) {

        this.searchParams.Request = value;
    }

    /**
     * Xuất dữ liệu Excel theo các cột hiển thị trên bảng
     */
    exportToExcel(): void {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu để xuất Excel!'
            );
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Yêu cầu công việc');

            // Get columns from SlickGrid column definitions
            const headers: string[] = [];
            const columnFields: string[] = [];
            const columnWidths: number[] = [];

            this.columnDefinitions.forEach((col: Column) => {
                if (col.field && col.name && !col.hidden) {
                    headers.push(col.name as string);
                    columnFields.push(col.field);
                    columnWidths.push(col.width || 120);
                }
            });

            // Add headers
            worksheet.addRow(headers);

            // Style header row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell: ExcelJS.Cell) => {
                cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1677FF' }
                };
            });
            headerRow.height = 30;

            // Add data rows
            this.JobrequirementData.forEach((row: any) => {
                const rowData = columnFields.map(field => {
                    const value = row[field];
                    // Format date fields
                    if (field === 'DateRequest' || field === 'DeadlineRequest' || field === 'DateApprovedTBP' ||
                        field === 'DateApprovedHR' || field === 'DateApprovedBGD') {
                        if (value) {
                            return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
                        }
                        return '';
                    }
                    // Format boolean/checkbox fields
                    if (field === 'IsRequestBGDApproved' || field === 'IsRequestBuy' || field === 'IsRequestPriceQuote') {
                        return (value === true || value === 'true' || value === 1 || value === '1') ? 'Có' : 'Không';
                    }
                    return value ?? '';
                });
                worksheet.addRow(rowData);
            });

            // Set font Times New Roman cỡ 10 và wrap text cho tất cả các cell dữ liệu
            worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
                if (rowNumber !== 1) {
                    row.height = 25;
                    row.eachCell((cell: ExcelJS.Cell) => {
                        cell.font = { name: 'Times New Roman', size: 10 };
                        cell.alignment = {
                            vertical: 'middle',
                            horizontal: 'left',
                            wrapText: true
                        };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
            });

            // Auto fit columns
            worksheet.columns.forEach((column: any, index: number) => {
                if (column && column.eachCell) {
                    let maxLength = 0;
                    column.eachCell({ includeEmpty: false }, (cell: any) => {
                        const cellValue = cell.value ? cell.value.toString() : '';
                        if (cellValue.length > maxLength) {
                            maxLength = cellValue.length;
                        }
                    });
                    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
                }
            });

            // Generate file
            workbook.xlsx.writeBuffer().then((buffer: any) => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const fileName = `Yeu_cau_cong_viec_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
                saveAs(blob, fileName);
                this.notification.success(
                    NOTIFICATION_TITLE.success,
                    'Xuất Excel thành công!'
                );
            });
        } catch (error: any) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Lỗi khi xuất Excel: ' + (error?.message || 'Unknown error')
            );
        }
    }

    // SlickGrid ready handlers
    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    angularGridDetailReady(angularGrid: AngularGridInstance): void {
        this.angularGridDetail = angularGrid;
    }

    angularGridFileReady(angularGrid: AngularGridInstance): void {
        this.angularGridFile = angularGrid;
    }

    angularGridApprovedReady(angularGrid: AngularGridInstance): void {
        this.angularGridApproved = angularGrid;

        // Cấu hình bôi màu dòng dựa trên trạng thái duyệt
        if (this.angularGridApproved?.dataView) {
            this.angularGridApproved.dataView.getItemMetadata = (row: number) => {
                const item = this.angularGridApproved.dataView.getItem(row);
                if (item) {
                    // IsApproved: 1 - Đã duyệt, 2 - Không duyệt/Hủy duyệt
                    if (item.IsApproved === 1 || item.IsApproved === '1') {
                        return { cssClasses: 'row-approved' };
                    } else if (item.IsApproved === 2 || item.IsApproved === '2') {
                        return { cssClasses: 'row-cancelled' };
                    }
                }
                return null;
            };
        }
    }

    // Initialize main grid
    initGrid(): void {
        const formatDate = (row: number, cell: number, value: any) => {
            if (!value) return '';
            try {
                const dateValue = DateTime.fromISO(value);
                return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
            } catch (e) {
                return value;
            }
        };

        const checkboxFormatter = (row: number, cell: number, value: any) => {
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<div style="text-align: center;"><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
        };

        const tooltipFormatter = (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
            if (!value) return '';
            const fieldName = _column.field;
            return `
                <span
                    title="${dataContext[fieldName] || value}"
                    style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                    ${value}
                </span>
            `;
        };

        this.columnDefinitions = [
            { id: 'ID', name: 'ID', field: 'ID', type: 'number', excludeFromExport: true, hidden: true },
            { id: 'RowIndex', name: 'STT', field: 'RowIndex', type: 'number', width: 60, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-center' },
            {
                id: 'IsRequestBGDApproved',
                name: 'Yêu cầu BGĐ duyệt',
                field: 'IsRequestBGDApproved',
                type: 'string',
                width: 100,
                sortable: true,
                filterable: true,
                formatter: checkboxFormatter,
                cssClass: 'text-center'
            },
            {
                id: 'IsRequestBuy',
                name: 'Yêu cầu mua',
                field: 'IsRequestBuy',
                type: 'string',
                width: 100,
                sortable: true,
                filterable: true,
                formatter: checkboxFormatter,
                cssClass: 'text-center'
            },
            {
                id: 'IsRequestPriceQuote',
                name: 'Yêu cầu báo giá',
                field: 'IsRequestPriceQuote',
                type: 'string',
                width: 100,
                sortable: true,
                filterable: true,
                formatter: checkboxFormatter,
                cssClass: 'text-center'
            },
            {
                id: 'StatusText',
                name: 'Trạng thái',
                field: 'StatusText',
                type: 'string',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'NumberRequest',
                name: 'Mã yêu cầu',
                field: 'NumberRequest',
                type: 'string',
                width: 130,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'DateRequest',
                name: 'Ngày yêu cầu',
                field: 'DateRequest',
                type: 'string',
                width: 110,
                sortable: true,
                filterable: true,
                formatter: formatDate,
                filter: { model: Filters['compoundDate'] }
            },
            {
                id: 'EmployeeName',
                name: 'Tên nhân viên',
                field: 'EmployeeName',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'EmployeeDepartment',
                name: 'Bộ phận yêu cầu',
                field: 'EmployeeDepartment',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'FullNameApprovedTBP',
                name: 'TBP duyệt',
                field: 'FullNameApprovedTBP',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'RequiredDepartment',
                name: 'Bộ phận được yêu cầu',
                field: 'RequiredDepartment',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'CoordinationDepartment',
                name: 'Bộ phận phối hợp',
                field: 'CoordinationDepartment',
                type: 'string',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'IsApprovedText',
                name: 'Trạng thái duyệt',
                field: 'IsApprovedText',
                type: 'string',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { filter: true, autoAdjustDropWidthByTextSize: true } as MultipleSelectOption
                }
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                field: 'Note',
                type: 'string',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: tooltipFormatter,
                filter: { model: Filters['compoundInputText'] }
            }
        ];

        this.gridOptions = {
            autoResize: {
                container: '#jobRequirementGridContainer',
                rightPadding: 0,
                bottomPadding: 0,
                calculateAvailableSizeBy: 'container'

            },
            enableAutoResize: true,
            enableCellNavigation: true,
            enableColumnReorder: true,
            enableSorting: true,
            enableFiltering: true,
            enableRowSelection: true,
            enableCheckboxSelector: true,
            checkboxSelector: { hideSelectAllCheckbox: false },
            rowSelectionOptions: { selectActiveRow: true },
            multiSelect: true,
            rowHeight: 35,
            headerRowHeight: 40,
            forceFitColumns: false,
            enableAutoSizeColumns: false,
            autoFitColumnsOnFirstLoad: false,
            gridWidth: '100%'
        };

        this.getJobrequirement();
    }

    // Initialize detail grid
    initGridDetail(): void {
        const tooltipFormatter = (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
            if (!value) return '';
            const fieldName = _column.field;
            return `
                <span
                    title="${dataContext[fieldName] || value}"
                    style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                    ${value}
                </span>
            `;
        };

        this.columnDefinitionsDetail = [
            { id: 'STT', name: 'STT', field: 'STT', type: 'number', width: 80, sortable: true, cssClass: 'text-center' },
            { id: 'Category', name: 'Đề mục', field: 'Category', type: 'string', width: 200, sortable: true, filterable: true, formatter: tooltipFormatter },
            { id: 'Description', name: 'Diễn giải', field: 'Description', type: 'string', width: 350, sortable: true, filterable: true, formatter: tooltipFormatter },
            { id: 'Target', name: 'Mục tiêu cần đạt', field: 'Target', type: 'string', width: 300, sortable: true, filterable: true, formatter: tooltipFormatter },
            { id: 'Note', name: 'Ghi chú', field: 'Note', type: 'string', width: 250, sortable: true, filterable: true, formatter: tooltipFormatter }
        ];

        this.gridOptionsDetail = {
            autoResize: {
                container: '#jobRequirementDetailGridContainer',
                rightPadding: 0,
                bottomPadding: 0,
                calculateAvailableSizeBy: 'container'
            },
            enableAutoResize: true,
            enableCellNavigation: true,
            enableSorting: true,
            enableFiltering: true,
            rowHeight: 35,
            headerRowHeight: 40,
            forceFitColumns: true,
            enableAutoSizeColumns: false,
            autoFitColumnsOnFirstLoad: false,
            gridWidth: '100%'
        };
    }

    // Initialize file grid
    initGridFile(): void {
        const tooltipFormatter = (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
            if (!value) return '';
            const fieldName = _column.field;
            return `
                <span
                    title="${dataContext[fieldName] || value}"
                    style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                    ${value}
                </span>
            `;
        };

        this.columnDefinitionsFile = [
            { id: 'FileName', name: 'File đính kèm', field: 'FileName', type: 'string', width: 300, sortable: true, filterable: true, formatter: tooltipFormatter }
        ];

        this.gridOptionsFile = {
            autoResize: {
                container: '#jobRequirementFileGridContainer',
                rightPadding: 0,
                bottomPadding: 0,
                calculateAvailableSizeBy: 'container'
            },
            enableAutoResize: true,
            enableCellNavigation: true,
            enableSorting: true,
            rowHeight: 35,
            headerRowHeight: 40,
            forceFitColumns: true,
            enableAutoSizeColumns: false,
            autoFitColumnsOnFirstLoad: false,
            gridWidth: '100%',
            enableContextMenu: true,
            contextMenu: {
                commandItems: [
                    {
                        command: 'view-file',
                        title: '👁️ Xem file',
                        action: (_e: Event, args: any) => {
                            const item = args.dataContext;
                            this.viewFile(item);
                        }
                    },
                    {
                        command: 'download-file',
                        title: '⬇️ Tải file',
                        action: (_e: Event, args: any) => {
                            const item = args.dataContext;
                            this.downloadFile(item);
                        }
                    }
                ]
            }
        };
    }

    // Initialize approved grid
    initGridApproved(): void {
        const formatDateTime = (row: number, cell: number, value: any) => {
            if (!value) return '';
            try {
                const dateValue = DateTime.fromISO(value);
                return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy HH:mm') : value;
            } catch (e) {
                return value;
            }
        };

        const tooltipFormatter = (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
            if (!value) return '';
            const fieldName = _column.field;
            return `
                <span
                    title="${dataContext[fieldName] || value}"
                    style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                >
                    ${value}
                </span>
            `;
        };

        this.columnDefinitionsApproved = [
            { id: 'Step', name: 'Bước', field: 'Step', type: 'number', width: 80, sortable: true, cssClass: 'text-center' },
            { id: 'StepName', name: 'Tên bước', field: 'StepName', type: 'string', width: 200, sortable: true, formatter: tooltipFormatter },
            { id: 'DateApproved', name: 'Ngày duyệt', field: 'DateApproved', type: 'string', width: 150, sortable: true, formatter: formatDateTime },
            { id: 'IsApprovedText', name: 'Trạng thái', field: 'IsApprovedText', type: 'string', width: 120, sortable: true, formatter: tooltipFormatter },
            { id: 'EmployeeName', name: 'Người thực hiện', field: 'EmployeeName', type: 'string', width: 180, sortable: true, formatter: tooltipFormatter },
            { id: 'EmployeeActualName', name: 'Người duyệt', field: 'EmployeeActualName', type: 'string', width: 180, sortable: true, formatter: tooltipFormatter },
            { id: 'ReasonCancel', name: 'Lý do hủy duyệt', field: 'ReasonCancel', type: 'string', width: 250, sortable: true, formatter: tooltipFormatter }
        ];

        this.gridOptionsApproved = {
            autoResize: {
                container: '#jobRequirementApprovedGridContainer',
                rightPadding: 0,
                bottomPadding: 0,
                calculateAvailableSizeBy: 'container'
            },
            enableAutoResize: true,
            enableCellNavigation: true,
            enableSorting: true,
            rowHeight: 35,
            headerRowHeight: 40,
            forceFitColumns: false,
            enableAutoSizeColumns: false,
            autoFitColumnsOnFirstLoad: false,
            gridWidth: '100%'
        };
    }

    // Handle row click
    onCellClicked(e: Event, args: OnClickEventArgs): void {
        const item = (args as any)?.dataContext;
        if (item) {
            this.JobrequirementID = item.ID || 0;
            this.data = [item];
            if (this.JobrequirementID) {
                this.getJobrequirementDetails(this.JobrequirementID);
                this.getHCNSData(this.JobrequirementID);
            }
        }
    }

    // Handle row selection changed
    onSelectedRowsChanged(e: Event, args: OnSelectedRowsChangedEventArgs): void {
        if (args?.rows?.length > 0 && this.angularGrid?.dataView) {
            const selectedIdx = args.rows[0];
            const item = this.angularGrid.dataView.getItem(selectedIdx);
            if (item) {
                this.JobrequirementID = item.ID || 0;
                this.data = [item];
                if (this.JobrequirementID) {
                    this.getJobrequirementDetails(this.JobrequirementID);
                    this.getHCNSData(this.JobrequirementID);
                }
            }
        } else {
            this.JobrequirementID = 0;
            this.data = [];
        }
    }

    // Get selected data from grid
    getSelectedData(): any[] {
        if (!this.angularGrid?.slickGrid) return [];
        const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) return [];
        return selectedRows.map((idx: number) => this.angularGrid.dataView.getItem(idx)).filter((item: any) => item);
    }

    // Apply distinct filters for multiple columns after data is loaded
    private applyDistinctFilters(): void {
        const fieldsToFilter = [
            'StatusText', 'NumberRequest', 'EmployeeName', 'EmployeeDepartment',
            'FullNameApprovedTBP', 'RequiredDepartment', 'CoordinationDepartment', 'IsApprovedText'
        ];
        this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, fieldsToFilter);
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
}
