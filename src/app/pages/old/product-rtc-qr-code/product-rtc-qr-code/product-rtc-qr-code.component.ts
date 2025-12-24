import { inject, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ProductRtcQrCodeFormComponent } from '../product-rtc-qr-code-form/product-rtc-qr-code-form.component';
import { ProductRtcQrCodeImportExcelComponent } from '../product-rtc-qr-code-import-excel/product-rtc-qr-code-import-excel.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ProductRtcQrCodeService } from '../product-rtc-qr-code-service/product-rtc-qr-code.service';
import { forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { ActivatedRoute } from '@angular/router';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        NzCardModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzLayoutModule,
        NzFlexModule,
        NzSplitterModule,
        NgbModalModule,
        NzModalModule,
        HasPermissionDirective
    ],
    selector: 'app-product-rtc-qr-code',
    templateUrl: './product-rtc-qr-code.component.html',
    styleUrl: './product-rtc-qr-code.component.css'
})
export class ProductRtcQrCodeComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('qrCodeTableRef', { static: true }) qrCodeTableRef!: ElementRef<HTMLDivElement>;

    private ngbModal = inject(NgbModal);
    qrCodeTable: Tabulator | null = null;
    filterText: string = "";
    warehouseID: number = 1; // Default warehouse ID, can be configured
    qrCodeData: any[] = [];
    modulaLocationGroups: any[] = [];
    selectedModulaLocationID: number | null = null;
    private searchSubject = new Subject<string>();

    constructor(
        private notification: NzNotificationService,
        private qrCodeService: ProductRtcQrCodeService,
        private modal: NzModalService,
        private route: ActivatedRoute
    ) { }

    ngAfterViewInit(): void {
        this.drawTable();
        this.loadData();
        this.loadModulaLocations();
    }

    ngOnInit() {
        // if (this.tabData?.warehouseID) {
        //     this.warehouseID = this.tabData.warehouseID;
        // }

        this.route.queryParams.subscribe(params => {
            this.warehouseID = params['warehouseID'] || 1
            // this.warehouseType = params['warehouseType'] || 1;
        });

        // Setup debounce cho tìm kiếm
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadData();
        });
    }

    ngOnDestroy() {
        this.searchSubject.complete();
    }

    loadData() {
        this.qrCodeService.getQRCodeList(this.warehouseID, this.filterText || "").subscribe({
            next: (response: any) => {
                console.log('response getQRCodeList = ', response);
                // API returns: { status: 1, data: { dataList: [...] } }
                if (response?.status === 1 && response?.data?.dataList) {
                    this.qrCodeData = response.data.dataList || [];
                } else {
                    this.qrCodeData = [];
                }
                if (this.qrCodeTable) {
                    this.qrCodeTable.setData(this.qrCodeData);
                }
            },
            error: (err: any) => {
                console.error('Error loading QR code data:', err);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu QR code');
                this.qrCodeData = [];
                if (this.qrCodeTable) {
                    this.qrCodeTable.setData([]);
                }
            }
        });
    }

    loadModulaLocations() {
        this.qrCodeService.getLocationModula().subscribe({
            next: (res: any) => {
                if (res?.status === 1 && res?.data?.dataList) {
                    this.groupModulaLocations(res.data.dataList);
                }
            },
            error: (res: any) => {
                console.error('Error loading modula locations:', res);
            }
        });
    }

    groupModulaLocations(dataList: any[]) {
        // Group theo ModulaLocationID (Tray)
        const grouped = new Map<number, any[]>();

        dataList.forEach((item: any) => {
            const trayId = item.ModulaLocationID;
            if (trayId) {
                if (!grouped.has(trayId)) {
                    grouped.set(trayId, []);
                }
                grouped.get(trayId)!.push(item);
            }
        });

        // Convert to array format for nz-option-group
        this.modulaLocationGroups = Array.from(grouped.entries()).map(([trayId, items]) => {
            // Lấy tên Tray từ item đầu tiên (Name là tên Tray)
            const trayName = items[0]?.Name || items[0]?.Code || `Tray ${trayId}`;
            return {
                label: trayName,
                options: items.map((item: any) => ({
                    value: item.ModulaLocationDetailID,
                    label: item.LocationName || `${trayName} - ${item.ModulaLocationDetailName || item.ModulaLocationDetailCode || ''}`
                }))
            };
        });
    }

    filterOption = (input: string, option: any): boolean => {
        if (!input) return true;
        const searchText = input.toLowerCase();
        const label = option.nzLabel?.toLowerCase() || '';
        return label.includes(searchText);
    };

    onSetModulaLocation() {
        if (!this.selectedModulaLocationID) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí modula');
            return;
        }

        // Lấy các bản ghi được chọn (tích) từ bảng
        const selectedRows = this.qrCodeTable?.getSelectedData() || [];
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần set vị trí');
            return;
        }

        const count = selectedRows.length;
        const content = `Bạn có muốn set vị trí modula cho ${count} bản ghi đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận set vị trí',
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Build payload chỉ cho các records được chọn
                const payload = selectedRows.map((row: any) => ({
                    ID: row.ID || 0,
                    ProductRTCID: row.ProductRTCID,
                    ProductQRCode: row.ProductQRCode || '',
                    SerialNumber: row.SerialNumber || '',
                    Status: row.Status || 1,
                    ModulaLocationDetailID: this.selectedModulaLocationID,
                    WarehouseID: row.WarehouseID || this.warehouseID,
                    IsDeleted: false
                }));

                this.qrCodeService.saveLocation(payload).subscribe({
                    next: (res: any) => {
                        if (res?.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, `Đã set vị trí modula cho ${count} bản ghi`);
                            this.qrCodeTable?.deselectRow?.(this.qrCodeTable.getSelectedRows());
                            this.loadData();
                            this.selectedModulaLocationID = null;
                        } else {
                            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Set vị trí modula thất bại');
                        }
                    },
                    error: (res: any) => {
                        const errorMessage = res?.error?.message || 'Có lỗi xảy ra khi set vị trí modula';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            }
        });
    }

    drawTable() {
        this.qrCodeTable = new Tabulator(this.qrCodeTableRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,

            selectableRows: true,
            data: this.qrCodeData,
            paginationMode: 'local', // Sử dụng phân trang local
            layout: 'fitDataStretch',
            addRowPos: "bottom",
            history: true,
            initialSort: [
                { column: "ID", dir: "desc" }
            ],
            columnDefaults: {
                ...DEFAULT_TABLE_CONFIG.columnDefaults,
                cssClass: 'tabulator-cell-12px'
            },
            columns: [
                { title: "ID", field: "ID", visible: false },
                {
                    title: "Trạng thái",
                    field: "StatusText",
                    hozAlign: "left",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const status = rowData['Status'];
                        switch (status) {
                            case 1: return "Trong kho";
                            case 2: return "Đang mượn";
                            case 3: return "Đã xuất kho";
                            case 4: return "Lost";
                            default: return cell.getValue() || "";
                        }
                    }
                },

                {
                    title: "Mã QR Code",
                    field: "ProductQRCode",
                    hozAlign: "left"
                    , bottomCalc: 'count'
                    , width: 120
                },
                {
                    title: "SerialNumber",
                    field: "SerialNumber",
                    hozAlign: "left"
                    , bottomCalc: 'count',
                    width: 120
                },
                {
                    title: "Mã sản phẩm",
                    field: "ProductCode",
                    hozAlign: "left"
                    , bottomCalc: 'count',
                    width: 120
                },
                {
                    title: "Tên sản phẩm",
                    field: "ProductName",
                    hozAlign: "left",
                    formatter: 'textarea',
                },
                {
                    title: "Mã nội bộ",
                    field: "ProductCodeRTC",
                    hozAlign: "left"
                },
                {
                    title: "Vị trí",
                    field: "AddressBox",
                    hozAlign: "left"
                    , width: 120
                },

                {
                    title: "Vị trí modula",
                    field: "ModulaLocationName",
                    hozAlign: "left"
                },
                {
                    title: "Ghi chú",
                    field: "Note",
                    hozAlign: "left",
                    formatter: (cell: any) => {
                        const value = cell.getValue() || '';
                        const maxLength = 50; // Số ký tự tối đa hiển thị

                        if (!value) {
                            return '';
                        }

                        // Nếu text dài hơn maxLength, cắt và thêm "..."
                        if (value.length > maxLength) {
                            const truncated = value.substring(0, maxLength) + '...';
                            // Sử dụng HTML với title attribute để hiển thị tooltip
                            return `<span title="${value.replace(/"/g, '&quot;')}" style="cursor: help;">${truncated.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
                        }

                        return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    }
                },
            ]
        });
    }

    onAddQRCode() {
        const modalRef = this.ngbModal.open(ProductRtcQrCodeFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = { ID: 0, WarehouseID: this.warehouseID };
        modalRef.result.then(
            (result) => {
                this.loadData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    onEditQRCode() {
        const selectedData = this.qrCodeTable?.getSelectedData();
        if (!selectedData || selectedData.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn QR code cần sửa!');
            return;
        }
        const selectedRow = selectedData[0];

        const modalRef = this.ngbModal.open(ProductRtcQrCodeFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = {
            ...selectedRow,
            WarehouseID: this.warehouseID
        };
        modalRef.result.then(
            (result) => {
                this.loadData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    onDeleteQRCode() {
        const selectedRows = this.qrCodeTable?.getSelectedData() || [];
        if (!selectedRows.length) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
            return;
        }

        const count = selectedRows.length;
        const content = `Bạn có muốn xóa ${count} QR code đã chọn không?`;

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const deleteRequests = selectedRows.map((row: any) => {
                    const payload = [{
                        ID: row.ID,
                        ProductRTCID: row.ProductRTCID,
                        ProductQRCode: row.ProductQRCode,
                        SerialNumber: row.SerialNumber,
                        Status: row.Status,
                        ModulaLocationDetailID: row.ModulaLocationDetailID,
                        WarehouseID: row.WarehouseID || this.warehouseID,
                        IsDeleted: true
                    }];
                    return this.qrCodeService.saveData(payload);
                });

                forkJoin(deleteRequests).subscribe({
                    next: (responses: any[]) => {
                        const success = responses.filter(r => r?.status === 1).length;
                        const failed = responses.length - success;

                        if (failed === 0) {
                            this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa ${success} QR code.`);
                        } else if (success === 0) {
                            this.notification.error(NOTIFICATION_TITLE.error, 'Không xóa được QR code nào.');
                        } else {
                            this.notification.warning(NOTIFICATION_TITLE.warning, `Xóa thành công ${success}, lỗi ${failed}.`);
                        }

                        this.qrCodeTable?.deselectRow?.(this.qrCodeTable.getSelectedRows());
                        this.loadData();
                    },
                    error: (error: any) => {
                        const errorMessage = error?.error?.message || 'Có lỗi xảy ra khi xóa';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            }
        });
    }

    searchQRCode() {
        this.searchSubject.next(this.filterText);
    }

    async exportExcel() {
        if (!this.qrCodeTable) return;

        const data = this.qrCodeData;
        if (!data || data.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách QR Code');

        // Headers
        const headers = [
            'Trạng thái',
            'ID',
            'ProductRTCID',
            'Mã QR Code',
            'Mã sản phẩm',
            'Tên sản phẩm',
            'Mã nội bộ',
            'Vị trí',
            'Ghi chú',
            'SerialNumber',
            'Vị trí modula'
        ];
        worksheet.addRow(headers);

        // Style header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Data rows
        data.forEach((row: any) => {
            const statusText = row.Status === 1 ? 'Trong kho' :
                row.Status === 2 ? 'Đang mượn' :
                    row.Status === 3 ? 'Đã xuất kho' :
                        row.Status === 4 ? 'Lost' :
                            row.StatusText || '';

            worksheet.addRow([
                statusText,
                row.ID || '',
                row.ProductRTCID || '',
                row.ProductQRCode || '',
                row.ProductCode || '',
                row.ProductName || '',
                row.ProductCodeRTC || '',
                row.AddressBox || '',
                row.Note || '',
                row.SerialNumber || '',
                row.ModulaLocationName || ''
            ]);
        });

        // Auto fit columns
        worksheet.columns.forEach((column: any) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length + 2);
            });
            column.width = maxLength;
        });

        // Add borders
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (rowNumber === 1) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        });

        // Add filter
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: headers.length }
        };

        // Export file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const formattedDate = new Date()
            .toISOString()
            .slice(0, 10)
            .split('-')
            .reverse()
            .join('');
        const fileName = `QRCode_${formattedDate}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    }

    openModalImportExcel() {
        const modalRef = this.ngbModal.open(ProductRtcQrCodeImportExcelComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.warehouseID = this.warehouseID;
        modalRef.result.then(
            (result) => {
                this.loadData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }
}
