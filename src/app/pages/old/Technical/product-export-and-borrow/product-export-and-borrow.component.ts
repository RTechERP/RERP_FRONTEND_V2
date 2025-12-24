//import
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, inject, ViewEncapsulation, ViewChild, ElementRef, Inject, Optional } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProductExportAndBorrowService } from './product-export-and-borrow-service/product-export-and-borrow.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    standalone: true,
    imports: [
        NzCheckboxModule,
        NzUploadModule,
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
        NgbModalModule,
    ],
    selector: 'app-product-export-and-borrow',
    templateUrl: './product-export-and-borrow.component.html',
    styleUrls: ['./product-export-and-borrow.component.css']
})
export class ProductExportAndBorrowComponent implements OnInit, AfterViewInit {
    //request param gửi API
    Size: number = 100000;
    Page: number = 1;
    filterText: string = '';
    dateStart: Date | null = null;
    dateEnd: Date | null = null;
    warehouseID: number = 0;
    private ngbModal = inject(NgbModal);
    //Khai báo bảng, data của bảng\
    productTable: Tabulator | null = null;
    // on off trạng thái lọc
    sizeTbDetail: any = '0';
    isSearchVisible: boolean = false;
    productData: any[] = [];
    warehouseType: number = 0;
    constructor(
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private productExportAndBorrowService: ProductExportAndBorrowService,
        private route: ActivatedRoute
    ) { }
    ngOnInit() {
        // if (this.tabData?.warehouseID) {
        //   this.warehouseID = this.tabData.warehouseID;
        //   this.warehouseType = this.tabData.warehouseType;
        // }
        this.route.queryParams.subscribe(params => {
            this.warehouseID = params['warehouseID'] || 1
            this.warehouseType = params['warehouseType'] || 1;
        });
    }
    ngAfterViewInit(): void {
        this.drawTbProducts();
        const now = DateTime.now();
        this.dateStart = now.startOf('month').toJSDate();
        this.dateEnd = now.endOf('month').toJSDate();
    }
    drawTbProducts() {
        this.productTable = new Tabulator('#dataProductTableExportAndBorrow', {
            layout: "fitDataStretch",
            pagination: true,
            selectableRows: 5,
            height: '86vh',
            ajaxURL: this.productExportAndBorrowService.getProductExportAndBorrowAjax(),
            ajaxConfig: "POST",
            paginationMode: 'remote',
            columnDefaults: {
                headerWordWrap: true,
                headerVertical: false,
                headerHozAlign: "center",
                minWidth: 60,
                resizable: true
            },
            movableColumns: true,
            paginationSize: 30,
            paginationSizeSelector: [5, 10, 20, 50, 100],
            reactiveData: true,
            ajaxRequestFunc: (url, config, params) => {
                // lấy ngày đầu tháng và cuối tháng
                const request = {
                    dateStart: this.dateStart ? DateTime.fromJSDate(this.dateStart).toFormat('yyyy-MM-dd') : '2024-08-08',
                    dateEnd: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).toFormat('yyyy-MM-dd') : '2025-08-08',
                    page: params.page || 1,
                    size: params.size || 30,
                    filterText: this.filterText || "",
                    warehouseID: this.warehouseID || 1,
                };
                return this.productExportAndBorrowService.getProductExportAndBorrow(request).toPromise();
            },
            ajaxResponse: (url, params, response) => {
                return {
                    data: response.products || [],
                    last_page: response.TotalPage?.[0]?.TotalPage || 1
                };
            },
            placeholder: 'Không có dữ liệu',
            langs: {
                vi: {
                    pagination: {
                        first: '<<',
                        last: '>>',
                        prev: '<',
                        next: '>',
                    },
                },
            },
            locale: 'vi',
            dataTree: true,
            addRowPos: "bottom",
            history: true,
            columns: [
                { title: "STT", formatter: "rownum", hozAlign: "center", frozen: true },
                { title: "ID", field: "ID", visible: false, frozen: true },
                { title: "Mã sản phẩm", field: "ProductCode", frozen: true },
                { title: "Tên sản phẩm", field: "ProductName", frozen: true },
                { title: "Mã nội bộ", field: "ProductCodeRTC", frozen: true },
                { title: "Số lượng trong kho", field: "NumberInStore", hozAlign: "center" },
                { title: "Số ngày chưa nhập kho", field: "CountLastImportDay", hozAlign: "center" },
                { title: "Số ngày chưa được mượn", field: "CountLastBorrowDay", hozAlign: "center" },
                { title: "Vị trí", field: "LocationName" },
                { title: "Hãng SX", field: "Maker" },
                { title: "ĐVT", field: "UnitCountName", hozAlign: "center" },
                { title: "Nhóm sản phẩm", field: "ProductGroupName" },
                { title: "Mã nhóm", field: "ProductGroupRTCID", visible: false },
                { title: "Part Number", field: "PartNumber", visible: false },
                { title: "Số lượng", field: "Number", hozAlign: "center" },
                { title: "Ngày mượn cuối", field: "LastDateBorrow", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" }, hozAlign: "center" },
                { title: "Ngày nhập cuối", field: "LastImportDate", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" }, hozAlign: "center", width: 160 },
                { title: "Ngày xuất cuối", field: "LastDateExport", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" }, hozAlign: "center", width: 160 },
                { title: "Đồ mượn khách", field: "StatusProduct", hozAlign: "center", formatter: "tickCross" },
                { title: "Ngày tạo", field: "CreateDate", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy" }, hozAlign: "center" },
                { title: "Người tạo", field: "CreatedBy" },
                { title: "Ghi chú", field: "Note" },
                { title: "Serial", field: "Serial", visible: false },
                { title: "SL Kiểm kê", field: "SLKiemKe", hozAlign: "center", visible: false },
                { title: "Kho", field: "WarehouseID", visible: false },
                { title: "Tồn thực tế", field: "InventoryReal", hozAlign: "center", visible: false },

                { title: "Ảnh", field: "LocationImg", visible: false },

            ]
        });
    }
    // hàm ẩn hiện phần tìm kiếm
    toggleSearchPanel(): void {
        this.isSearchVisible = !this.isSearchVisible;
    }
    //hàm tìm kiếm
    onSearch(): void {
        this.productTable?.setData();
    }
    async exportToExcelProduct() {
        if (!this.productTable) return;

        const selectedData = this.productTable.getData();
        if (!selectedData || selectedData.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }

        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách thiết bị');

        const columns = this.productTable.getColumnDefinitions().filter((col: any) =>
            col.visible !== false && col.field && col.field.trim() !== ''
        );

        const headerRow = worksheet.addRow(columns.map(col => col.title || col.field));
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        selectedData.forEach((row: any) => {
            const rowData = columns.map((col: any) => {
                const value = row[col.field];
                switch (col.field) {
                    case 'BorrowCustomer':
                        return value ? 'Có' : 'Không';
                    case 'CreateDate':
                        return value ? new Date(value).toLocaleDateString('vi-VN') : '';
                    default:
                        return value !== null && value !== undefined ? value : '';
                }
            });
            worksheet.addRow(rowData);
        });
        worksheet.columns.forEach((col) => {
            col.width = 20;
        });

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                if (rowNumber === 1) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Thietbikhongsudung-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
}
