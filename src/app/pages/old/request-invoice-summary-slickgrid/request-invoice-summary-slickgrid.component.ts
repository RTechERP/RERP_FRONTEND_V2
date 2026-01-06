import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    IterableDiffers,
    Optional,
    Inject,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
    NzUploadModule,
    NzUploadFile,
    NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    FieldType,
    Filters,
    Formatter,
    Formatters,
    GridOption,
    MenuCommandItem,
    MenuCommandItemCallbackArgs,
    OnEventArgs,
    SlickGrid,
} from 'angular-slickgrid';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as ExcelJS from 'exceljs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { RequestInvoiceService } from '../request-invoice/request-invoice-service/request-invoice-service.service'
import { RequestInvoiceStatusLinkComponent } from '../request-invoice-status-link/request-invoice-status-link.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { ActivatedRoute } from '@angular/router';
import { Menubar } from 'primeng/menubar';

// Custom formatter for checkbox display
const checkboxFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    const checked = value ? 'checked' : '';
    return `<div style="text-align: center;">
        <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
    </div>`;
};

// Custom formatter for date display
const dateFormatter: Formatter = (row, cell, value, columnDef, dataContext) => {
    if (value) {
        return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
    }
    return '';
};

@Component({
    selector: 'app-request-invoice-summary-slickgrid',
    standalone: true,
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
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
        NzInputNumberModule,
        NzSelectModule,
        NzTableModule,
        NzTabsModule,
        NzModalModule,
        NzUploadModule,
        NzSwitchModule,
        NzCheckboxModule,
        NzSpinModule,
        CommonModule,
        AngularSlickgridModule,
        Menubar,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './request-invoice-summary-slickgrid.component.html',
    styleUrl: './request-invoice-summary-slickgrid.component.css'
})
export class RequestInvoiceSummarySlickgridComponent implements OnInit, AfterViewInit {

    // SlickGrid properties for main table
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];
    isLoading: boolean = false;

    // SlickGrid properties for File table
    angularGridFile!: AngularGridInstance;
    columnDefinitionsFile: Column[] = [];
    gridOptionsFile: GridOption = {};
    datasetFile: any[] = [];

    // SlickGrid properties for POFile table
    angularGridPOFile!: AngularGridInstance;
    columnDefinitionsPOFile: Column[] = [];
    gridOptionsPOFile: GridOption = {};
    datasetPOFile: any[] = [];

    isPOFileGridRendered: boolean = false;

    mainData: any[] = [];
    dataFile: any[] = [];
    dataFilePO: any[] = [];
    customers: any[] = [];
    users: any[] = [];
    selectedFile: any = null;
    selectedPOFile: any = null;
    selectedId: number = 0;
    dateStart: Date = new Date();
    dateEnd: Date = new Date();
    customerId: number = 0;
    userId: number = 0;
    status: number = 0;
    keywords: string = '';
    warehouseId: number = 0;

    constructor(
        @Optional() public activeModal: NgbActiveModal,
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private message: NzMessageService,
        private modal: NzModalService,
        private injector: EnvironmentInjector,
        private appRef: ApplicationRef,
        private requestInvoiceService: RequestInvoiceService,
        private viewPokhService: ViewPokhService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) {
        // Nhận data từ tab nếu có
        if (this.tabData && this.tabData.warehouseId) {
            this.warehouseId = this.tabData.warehouseId;
        }
    }

    sizeSearch: string = '0';

    menuBars: any[] = [];

    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.exportToExcel();
                }
            },
            {
                label: 'Quản lý trạng thái',
                icon: 'fa-solid fa-list-check fa-lg text-warning',

                command: () => {
                    this.openRequestInvoiceStatusLinkModal();
                }
            }
        ];
    }

    onFilesTabChange(tabIndex: number): void {
        // Lazy render POFile grid only when user opens the tab
        if (tabIndex === 1 && !this.isPOFileGridRendered) {
            setTimeout(() => {
                this.isPOFileGridRendered = true;
            }, 0);
        }

        // Resize grids after tab DOM becomes visible
        setTimeout(() => {
            if (tabIndex === 0 && this.angularGridFile?.resizerService) {
                this.angularGridFile.resizerService.resizeGrid();
            }
            if (tabIndex === 1 && this.angularGridPOFile?.resizerService) {
                this.angularGridPOFile.resizerService.resizeGrid();
            }
        }, 150);
    }

    ngOnInit(): void {
        this.initMenuBar();
        // Set title cho trang
        document.title = 'TỔNG HỢP YÊU CẦU XUẤT HÓA ĐƠN';

        // Lấy warehouseId từ query params
        this.route.queryParams.subscribe(params => {
            if (params['warehouseId']) {
                this.warehouseId = params['warehouseId'];
            }
        });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1); // Lấy dữ liệu 1 ngày trước
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        this.dateStart = startDate;
        this.dateEnd = endDate;

        // Initialize SlickGrid
        this.initGrid();
        this.initGridFile();
        this.initGridPOFile();

        this.loadMainData();
    }

    ngAfterViewInit(): void {
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.close({ success: true, reloadData: true });
        }
    }

    loadMainData() {
        const start = new Date(this.dateStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(this.dateEnd);
        end.setHours(23, 59, 59, 999);

        this.isLoading = true;
        this.requestInvoiceService.getRequestInvoiceSummary(
            start,
            end,
            this.customerId,
            this.userId,
            0,
            this.keywords
        ).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.status === 1) {
                    this.mainData = response.data;
                    // Update dataset for SlickGrid
                    this.dataset = this.mainData.map((item: any, index: number) => ({
                        ...item,
                        id: `${item.ID1}_${index}`
                    }));

                    // Apply distinct filters after data is loaded
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, ['Name', 'Unit', 'CompanyText']);
                    }, 500);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadFileData(requestInvoiceId: number): void {
        this.requestInvoiceService.getDetail(requestInvoiceId).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.dataFile = response.files;
                    this.selectedFile = null; // Reset selected file
                    this.datasetFile = this.dataFile.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `file_${index}`
                    }));
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadFilePOData(pokhId: number): void {
        this.requestInvoiceService.getPOKHFile(pokhId).subscribe(
            (response) => {
                if (response.status === 1) {
                    this.dataFilePO = response.data;
                    this.selectedPOFile = null; // Reset selected PO file
                    this.datasetPOFile = this.dataFilePO.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `pofile_${index}`
                    }));
                }
            },
            (error) => {
                console.error('Lỗi kết nối khi tải POKHFile:', error);
            }
        );
    }


    loadCustomer(): void {
        this.requestInvoiceService.getCustomer().subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.customers = response.data;
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadUser(): void {
        this.viewPokhService.loadUser().subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.users = response.data;
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    openRequestInvoiceStatusLinkModal(): void {
        const modalRef = this.modalService.open(RequestInvoiceStatusLinkComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.requestInvoiceID = this.selectedId;

        modalRef.result.then(
            (result) => {
                if (result.success && result.reloadData) {
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    exportToExcel(): void {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        // Define columns (keys and widths only)
        worksheet.columns = [
            { key: 'IsUrgency', width: 15 },
            { key: 'DealineUrgency', width: 15 },
            { key: 'StatusText', width: 20 },
            { key: 'Code', width: 20 },
            { key: 'IsCustomsDeclared', width: 15 },
            { key: 'AmendReason', width: 30 },
            { key: 'FullName', width: 20 },
            { key: 'CustomerName', width: 30 },
            { key: 'Address', width: 40 },
            { key: 'Name', width: 20 },
            { key: 'Note', width: 30 },
            { key: 'ProductNewCode', width: 15 },
            { key: 'ProductCode', width: 20 },
            { key: 'GuestCode', width: 20 },
            { key: 'ProductName', width: 30 },
            { key: 'Unit', width: 10 },
            { key: 'Quantity', width: 15 },
            { key: 'ProjectCode', width: 20 },
            { key: 'ProjectName', width: 20 },
            { key: 'NotePO', width: 30 },
            { key: 'Specifications', width: 20 },
            { key: 'InvoiceNumber', width: 20 },
            { key: 'InvoiceDate', width: 15 },
            { key: 'PONumber', width: 20 },
            { key: 'POCode', width: 20 },
            { key: 'RequestDate', width: 15 },
            { key: 'DateRequestImport', width: 15 },
            { key: 'SupplierName', width: 30 },
            { key: 'SomeBill', width: 20 },
            { key: 'ExpectedDate', width: 15 },
            { key: 'BillImportCode', width: 20 },
            { key: 'CompanyText', width: 20 },
        ];

        // Add Band Row (Row 1)
        const bandValues = new Array(25).fill('');
        bandValues.push('Thông tin đầu vào');
        const bandRow = worksheet.addRow(bandValues);

        // Merge cells for Band
        worksheet.mergeCells('A1:Y1');
        worksheet.mergeCells('Z1:AF1');

        // Add Header Row (Row 2)
        const headerRow = worksheet.addRow([
            'Yêu cầu gấp', 'Deadline', 'Trạng thái', 'Mã lệnh', 'Tờ khai HQ',
            'Lý do yêu cầu bổ sung', 'Người yêu cầu', 'Khách hàng', 'Địa chỉ', 'Công ty bán',
            'Ghi chú', 'Mã nội bộ', 'Mã sản phẩm', 'Mã theo khách', 'Tên sản phẩm',
            'ĐVT', 'Số lượng', 'Mã dự án', 'Dự án', 'Ghi chú (PO)',
            'Thông số kỹ thuật', 'Số hóa đơn', 'Ngày hóa đơn', 'Số PO', 'Mã PO',
            'Ngày đặt hàng', 'Ngày hàng về', 'Nhà cung cấp', 'Hóa đơn đầu vào', 'Ngày hàng về dự kiến', 'PNK', 'Công ty nhập'
        ]);

        // Style Band Row
        bandRow.eachCell((cell) => {
            cell.font = { bold: true, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDCE6F1' }, // Light Blue
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Style Header Row
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDCE6F1' }, // Light Blue
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Add data
        this.mainData.forEach((item) => {
            const row = worksheet.addRow({
                IsUrgency: item.IsUrgency ? 'Có' : '',
                DealineUrgency: item.DealineUrgency ? DateTime.fromISO(item.DealineUrgency).toFormat('dd/MM/yyyy') : '',
                StatusText: item.StatusText,
                Code: item.Code,
                IsCustomsDeclared: item.IsCustomsDeclared ? 'Có' : '',
                AmendReason: item.AmendReason,
                FullName: item.FullName,
                CustomerName: item.CustomerName,
                Address: item.Address,
                Name: item.Name,
                Note: item.Note,
                ProductNewCode: item.ProductNewCode,
                ProductCode: item.ProductCode,
                GuestCode: item.GuestCode,
                ProductName: item.ProductName,
                Unit: item.Unit,
                Quantity: item.Quantity,
                ProjectCode: item.ProjectCode,
                ProjectName: item.ProjectName,
                NotePO: item.Note,
                Specifications: item.Specifications,
                InvoiceNumber: item.InvoiceNumber,
                InvoiceDate: item.InvoiceDate ? DateTime.fromISO(item.InvoiceDate).toFormat('dd/MM/yyyy') : '',
                PONumber: item.PONumber,
                POCode: item.POCode,
                RequestDate: item.RequestDate ? DateTime.fromISO(item.RequestDate).toFormat('dd/MM/yyyy') : '',
                DateRequestImport: item.DateRequestImport ? DateTime.fromISO(item.DateRequestImport).toFormat('dd/MM/yyyy') : '',
                SupplierName: item.SupplierName,
                SomeBill: item.SomeBill,
                ExpectedDate: item.ExpectedDate ? DateTime.fromISO(item.ExpectedDate).toFormat('dd/MM/yyyy') : '',
                BillImportCode: item.BillImportCode,
                CompanyText: item.CompanyText || '',
            });

            // Color row if IsUrgency is true
            if (item.IsUrgency) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFA500' }, // Orange
                    };
                });
            }

            // Add borders to all cells
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        // Save file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'TongHopYeuCauXuatHoaDon.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    private buildFullFilePath(file: any): string {
        if (!file) {
            return '';
        }
        const serverPath = (file.ServerPath || '').trim();
        const fileName = (file.FileName || file.FileNameOrigin || '').trim();

        if (!serverPath) {
            return '';
        }

        // Nếu ServerPath đã chứa tên file thì dùng luôn
        if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
            return serverPath;
        }

        if (!fileName) {
            return serverPath;
        }

        const normalizedPath = serverPath.replace(/[\\\/]+$/, '');
        return `${normalizedPath}\\${fileName}`;
    }

    downloadFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
            return;
        }

        const fullPath = this.buildFullFilePath(file);
        if (!fullPath) {
            this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
            return;
        }

        // Hiển thị loading message
        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.requestInvoiceService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                // Kiểm tra xem có phải là blob hợp lệ không
                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải xuống thành công!');
                } else {
                    this.notification.error('Thông báo', 'File tải về không hợp lệ!');
                }
            },
            error: (res: any) => {
                this.message.remove(loadingMsg);
                console.error('Lỗi khi tải file:', res);

                // Nếu error response là blob (có thể server trả về lỗi dạng blob)
                if (res.error instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorText = JSON.parse(reader.result as string);
                            this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
                        } catch {
                            this.notification.error('Thông báo', 'Tải xuống thất bại!');
                        }
                    };
                    reader.readAsText(res.error);
                } else {
                    const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
                    this.notification.error('Thông báo', errorMsg);
                }
            },
        });
    }

    downloadPOFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
            return;
        }

        const fullPath = this.buildFullFilePath(file);
        if (!fullPath) {
            this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
            return;
        }

        // Hiển thị loading message
        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.requestInvoiceService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                // Kiểm tra xem có phải là blob hợp lệ không
                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải xuống thành công!');
                } else {
                    this.notification.error('Thông báo', 'File tải về không hợp lệ!');
                }
            },
            error: (res: any) => {
                this.message.remove(loadingMsg);
                console.error('Lỗi khi tải file:', res);

                // Nếu error response là blob (có thể server trả về lỗi dạng blob)
                if (res.error instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorText = JSON.parse(reader.result as string);
                            this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
                        } catch {
                            this.notification.error('Thông báo', 'Tải xuống thất bại!');
                        }
                    };
                    reader.readAsText(res.error);
                } else {
                    const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
                    this.notification.error('Thông báo', errorMsg);
                }
            },
        });
    }

    //#region SlickGrid Main Table
    initGrid(): void {
        this.columnDefinitions = [
            // {
            //     id: 'ID',
            //     name: 'ID',
            //     field: 'ID',
            //     width: 80,
            //     sortable: true,
            //     excludeFromExport: true,
            // },
            {
                id: 'IsUrgency',
                name: 'Yêu cầu gấp',
                field: 'IsUrgency',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 80,
                minWidth: 80,
                sortable: true,
                filterable: true,
                formatter: checkboxFormatter,
                cssClass: 'text-center',
                filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] }
            },
            {
                id: 'DealineUrgency',
                name: 'Deadline',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                field: 'DealineUrgency',
                width: 100,
                minWidth: 100,
                sortable: true,
                formatter: dateFormatter,
                cssClass: 'text-center',
            },
            {
                id: 'StatusText',
                name: 'Trạng thái',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                field: 'StatusText',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Code',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                name: 'Mã lệnh',
                field: 'Code',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'IsCustomsDeclared',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                name: 'Tờ khai HQ',
                field: 'IsCustomsDeclared',
                width: 80,
                minWidth: 70,
                sortable: true,
                filterable: true,
                formatter: checkboxFormatter,
                cssClass: 'text-center',
                filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] }
            },
            {
                id: 'FullName',
                name: 'Người yêu cầu',
                field: 'FullName',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CustomerName',
                name: 'Khách hàng',
                field: 'CustomerName',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 250,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Address',
                name: 'Địa chỉ',
                field: 'Address',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 300,
                minWidth: 300,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Name',
                name: 'Công ty bán',
                field: 'Name',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 140,
                minWidth: 140,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, }
            },
            {
                id: 'Note',
                name: 'Ghi chú',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                field: 'Note',
                width: 200,
                minWidth: 200,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProductNewCode',
                name: 'Mã nội bộ',
                field: 'ProductNewCode',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 100,
                minWidth: 100,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProductCode',
                name: 'Mã sản phẩm',
                field: 'ProductCode',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'GuestCode',
                name: 'Mã theo khách',
                field: 'GuestCode',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProductName',
                name: 'Tên sản phẩm',
                field: 'ProductName',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 200,
                minWidth: 200,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Unit',
                name: 'ĐVT',
                field: 'Unit',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 100,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, }
            },
            {
                id: 'Quantity',
                name: 'Số lượng',
                field: 'Quantity',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 100,
                minWidth: 150,
                sortable: true,
                type: FieldType.number,
                cssClass: 'text-end',
            },
            {
                id: 'ProjectCode',
                name: 'Mã dự án',
                field: 'ProjectCode',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProjectName',
                name: 'Dự án',
                field: 'ProjectName',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'NotePO',
                name: 'Ghi chú (PO)',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                field: 'Note',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Specifications',
                name: 'Thông số kỹ thuật',
                field: 'Specifications',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'InvoiceNumber',
                name: 'Số hóa đơn',
                field: 'InvoiceNumber',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'AmendReason',
                name: 'Lý do yêu cầu bổ sung',
                field: 'AmendReason',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 215,
                minWidth: 215,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'InvoiceDate',
                name: 'Ngày hóa đơn',
                field: 'InvoiceDate',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 120,
                minWidth: 150,
                sortable: true,
                formatter: dateFormatter,
                cssClass: 'text-center',
            },
            {
                id: 'PONumber',
                name: 'Số PO',
                field: 'PONumber',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'POCode',
                name: 'Mã PO',
                columnGroup: 'Chung',
                columnGroupKey: 'Chung',
                field: 'POCode',
                width: 150,
                minWidth: 150,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            // Thông tin đầu vào columns
            {
                id: 'RequestDate',
                name: 'Ngày đặt hàng',
                field: 'RequestDate',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                width: 120,
                minWidth: 150,
                sortable: true,
                formatter: dateFormatter,
                cssClass: 'text-center',
            },
            {
                id: 'DateRequestImport',
                name: 'Ngày hàng về',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                field: 'DateRequestImport',
                width: 120,
                minWidth: 150,
                sortable: true,
                formatter: dateFormatter,
                cssClass: 'text-center',
            },
            {
                id: 'SupplierName',
                name: 'Nhà cung cấp',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                field: 'SupplierName',
                width: 250,
                minWidth: 250,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'SomeBill',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                name: 'Hóa đơn đầu vào',
                field: 'SomeBill',
                width: 200,
                minWidth: 250,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ExpectedDate',
                name: 'Ngày hàng về dự kiến',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                field: 'ExpectedDate',
                width: 150,
                minWidth: 150,
                sortable: true,
                formatter: dateFormatter,
                cssClass: 'text-center',
            },
            {
                id: 'BillImportCode',
                name: 'PNK',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                field: 'BillImportCode',
                width: 200,
                minWidth: 250,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CompanyText',
                columnGroup: 'Thông tin đầu vào',
                columnGroupKey: 'Thông tin đầu vào',
                name: 'Công ty nhập',
                field: 'CompanyText',
                width: 120,
                minWidth: 120,
                sortable: true,
                filterable: true,
                type: FieldType.string,
                filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, }
            },
        ];

        this.gridOptions = {
            gridWidth: '100%',
            enableCellNavigation: true,
            enableColumnReorder: true,
            enableSorting: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            multiSelect: false,
            rowHeight: 35,
            headerRowHeight: 40,
            enablePagination: false,
            editable: false,
            autoEdit: false,
            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
            frozenColumn: 5,
        };
    }

    rowStyleMain(previousItemMetadata: any, angularGrid: AngularGridInstance) {
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
                } catch {
                    // ignore
                }
            }

            if (item && item['IsUrgency'] === true) {
                meta.cssClasses = (meta.cssClasses || '') + ' urgent-row';
            }

            return meta;
        };
    }

    onAngularGridCreated(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;

        if (this.angularGrid?.dataView) {
            this.angularGrid.dataView.getItemMetadata = this.rowStyleMain(
                this.angularGrid.dataView.getItemMetadata,
                this.angularGrid
            );
        }

        this.setupColumnGrouping();

        this.angularGrid.slickGrid?.onClick.subscribe((e: any, args: any) => {
            const grid = args.grid;
            const rowData = grid.getDataItem(args.row);
            if (rowData) {
                this.handleMainRowSelection(rowData);
            }
        });
    }

    private setupColumnGrouping(): void {
        if (!this.angularGrid?.slickGrid) {
            return;
        }

        const grid = this.angularGrid.slickGrid;
        const columns = grid.getColumns();

        const groupedColumns: { [key: string]: any[] } = {};

        columns.forEach((col: any) => {
            const group = col.columnGroup || 'Default';
            if (!groupedColumns[group]) {
                groupedColumns[group] = [];
            }
            groupedColumns[group].push(col);
        });

        console.log('Column Groups:', groupedColumns);

        // TODO: Implement visual grouping with CSS or custom solution
        // since setPreHeaderColumns doesn't exist in this version
    }
    //#endregion

    //#region SlickGrid File Table
    initGridFile(): void {
        this.columnDefinitionsFile = [
            { id: 'FileName', name: 'Tên file', field: 'FileName', width: 150, minWidth: 100, sortable: true },
        ];

        this.gridOptionsFile = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: false,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            enableContextMenu: true,
            contextMenu: {
                commandItems: this.getFileContextMenuOptions(),
                onCommand: (e, args) => this.handleFileContextMenuCommand(e, args),
            },
        };
    }

    angularGridReadyFile(angularGrid: AngularGridInstance): void {
        this.angularGridFile = angularGrid;
    }

    private getFileContextMenuOptions(): MenuCommandItem[] {
        return [
            {
                iconCssClass: 'fa fa-download',
                title: 'Tải xuống',
                command: 'download',
                positionOrder: 60,
            }
        ];
    }

    handleFileContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
        const command = args.command;
        const dataContext = args.dataContext;

        switch (command) {
            case 'download':
                this.selectedFile = dataContext;
                this.downloadFile(dataContext);
                break;
        }
    }

    onFileRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedFile = item;
        }
    }

    onFileRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedFile = item;
            this.downloadFile(item);
        }
    }
    //#endregion

    //#region SlickGrid POFile Table
    initGridPOFile(): void {
        this.columnDefinitionsPOFile = [
            { id: 'FileName', name: 'Tên file', field: 'FileName', width: 350, minWidth: 200, sortable: true },
        ];

        this.gridOptionsPOFile = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-pofile',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: false,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            enableContextMenu: true,
            contextMenu: {
                commandItems: this.getPOFileContextMenuOptions(),
                onCommand: (e, args) => this.handlePOFileContextMenuCommand(e, args),
            },
        };
    }

    angularGridReadyPOFile(angularGrid: AngularGridInstance): void {
        this.angularGridPOFile = angularGrid;
        setTimeout(() => {
            if (this.angularGridPOFile?.resizerService) {
                this.angularGridPOFile.resizerService.resizeGrid();
            }
        }, 150);
    }

    private getPOFileContextMenuOptions(): MenuCommandItem[] {
        return [
            {
                iconCssClass: 'fa fa-download',
                title: 'Tải xuống',
                command: 'download',
                positionOrder: 60,
            }
        ];
    }

    handlePOFileContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
        const command = args.command;
        const dataContext = args.dataContext;

        switch (command) {
            case 'download':
                this.selectedPOFile = dataContext;
                this.downloadPOFile(dataContext);
                break;
        }
    }

    onPOFileRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedPOFile = item;
        }
    }

    onPOFileRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedPOFile = item;
            this.downloadPOFile(item);
        }
    }
    //#endregion

    private handleMainRowSelection(rowData: any): void {
        this.selectedId = rowData.ID;
        if (!rowData) {
            return;
        }

        const requestInvoiceId = rowData.RequestInvoiceID ?? rowData.ID;
        if (requestInvoiceId) {
            this.loadFileData(requestInvoiceId);
        } else {
            this.dataFile = [];
            this.datasetFile = [];
        }

        const pokhId = rowData.POKHID ?? rowData.PokhId ?? rowData.POKHId;
        if (pokhId) {
            this.loadFilePOData(pokhId);
        } else {
            this.dataFilePO = [];
            this.datasetPOFile = [];
        }
    }

    private applyDistinctFiltersToGrid(
        angularGrid: AngularGridInstance,
        columnDefinitions: Column[],
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

        // Update column definitions
        columnDefinitions.forEach((colDef: any) => {
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
