import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, Inject, Optional, Input } from '@angular/core';
import { NgbModal, NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';
import {
    FormsModule,
    Validators,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProductsaleServiceService } from './product-sale-service/product-sale-service.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProductSaleDetailComponent } from './product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from './product-group-detail/product-group-detail.component';
import { ImportExcelProductSaleComponent } from './import-excel-product-sale/import-excel-product-sale.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ProjectPartlistPriceRequestComponent } from '../../project-partlist-price-request/project-partlist-price-request.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { MarketingPurchaseRequestComponent } from '../../../purchase/marketing-purchase-request/marketing-purchase-request.component';
import { ProjectPartListService } from '../../../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';

interface ProductGroup {
    ID?: number;
    ProductGroupID: string;
    ProductGroupName: string;
    IsVisible: boolean;
    EmployeeID: number;
    WareHouseID: number;
}
interface ProductSale {
    Id?: number;
    ProductCode: string;
    ProductName: string;
    Maker: string;
    Unit: string;
    NumberInStoreDauky: number;
    NumberInStoreCuoiKy: number;
    ProductGroupID: number;
    LocationID: number;
    FirmID: number;
    Note: string;
    IsFix?: boolean;
}

@Component({
    selector: 'app-product-sale',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzModalModule,
        NzSelectModule,
        NzSplitterModule,
        NzIconModule,
        NzButtonModule,
        NzProgressModule,
        NzInputModule,
        NzFormModule,
        NzInputNumberModule,
        NzCheckboxModule,
        NgbModule,
        NzSpinModule,
        HasPermissionDirective
        // ProductSaleDetailComponent,
        // ImportExcelProductSaleComponent,
    ],
    templateUrl: './product-sale.component.html',
    styleUrl: './product-sale.component.css',
})
export class ProductSaleComponent implements OnInit, AfterViewInit {
    @Input() isFromPOKH: boolean = false;
    //VP tai dau
    @ViewChild('tableProductGroup') tableProductGroupRef!: ElementRef;
    @ViewChild('tablePGWarehouse') tablePGWarehouseRef!: ElementRef;
    @ViewChild('tableProductSale') tableProductSaleRef!: ElementRef;
    warehouseCode: string = 'HN';
    //biến liên quan đến dữ liệu và bảng của productSale
    table_productsale: any;
    dataProductSale: any[] = [];
    listProductSale: any[] = [];
    isLoading: boolean = false;
    sizeSearch: string = '0';
    sizeTbDetail: any = '0';
    // biến liên quan đến dữ liệu và bảng của productGroup
    table: any;
    listProductGroup: any[] = [];
    dataProducGroup: any[] = [];
    isMobile: boolean = false;
    sizeLeft: string = '25%';
    id: number = 0;
    // các biến truyền vào của hàm getDataProductSale
    idSale: number = 0;
    keyword: string = '';
    checkedALL: boolean = false;

    //list lưu dữ liệu employee
    listEmployee: any[] = [];
    //list lưu dữ liệu kho
    listWH: any[] = [];
    //data để xóa
    dataDelete: any = {};
    //biến để check thêm hay sửa
    isCheckmode: boolean = false;
    //biến liên quan đến dữ liệu và bảng của productgroupwarehouse

    //list lấy dữ liệu đơn vị productsale
    listUnitCount: any[] = [];

    //list lấy dữ liệu UnitCount để tìm ID từ UnitName
    unitCounts: any[] = [];

    //list lấy dữ liệu nhóm kho
    listProductGroupcbb: any[] = [];

    //list lấy dữ liệu hãng
    listFirm: any[] = [];
    //list lấy dữ liệu vị trí
    listLocation: any[] = [];

    //lưu các id khi click vào dòng productsale
    selectedList: any[] = [];
    //luwua các id khi click vào dòng productgroup

    table_pgwarehouse: any;
    dataPGWareHouse: any[] = [];
    listPGWareHouse: any[] = [];
    newProductGroup: ProductGroup = {
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: 0,
        IsVisible: false,
        WareHouseID: 0,
    };

    newProductSale: ProductSale = {
        ProductCode: '',
        ProductName: '',
        Maker: '',
        Unit: '',
        NumberInStoreDauky: 0,
        NumberInStoreCuoiKy: 0,
        ProductGroupID: 0,
        LocationID: 0,
        FirmID: 0,
        Note: '',
        IsFix: false,
    };

  constructor(
    private productsaleSV: ProductsaleServiceService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private projectPartListService: ProjectPartListService,
    @Optional() @Inject('tabData') private tabData: any,
    @Optional() public activeModal: NgbActiveModal
  ) {}
  @HostListener('window:resize')
  onWindowResize() {
    this.updateResponsiveFlags();
    setTimeout(() => {
      this.table_productsale?.redraw?.();
      this.table?.redraw?.();
      this.table_pgwarehouse?.redraw?.();
    }, 0);
  }
//   private updateResponsiveFlags(): void {
//     this.isMobile = window.matchMedia('(max-width: 768px)').matches;
//     this.sizeLeft = this.isMobile ? '100%' : '25%';
//   }
//   ngOnInit(): void {
//     if (this.tabData?.warehouseCode) {
//       this.warehouseCode = this.tabData.warehouseCode;
//     }
    private updateResponsiveFlags(): void {
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;
        this.sizeLeft = this.isMobile ? '100%' : '25%';
    }
    ngOnInit(): void {
        if (this.tabData?.warehouseCode) {
            this.warehouseCode = this.tabData.warehouseCode;
        }
        this.updateResponsiveFlags();
        this.loadUnitCounts();
    }

    // Load UnitCount để tìm ID từ UnitName
    loadUnitCounts(): void {
        this.projectPartListService.getUnitCount().subscribe({
            next: (response: any) => {
                if (response.status === 1 && response.data) {
                    this.unitCounts = response.data || [];
                } else if (Array.isArray(response)) {
                    this.unitCounts = response;
                } else if (response.data) {
                    this.unitCounts = response.data;
                } else {
                    this.unitCounts = [];
                }
            },
            error: (err) => {
                console.error('Error loading unit counts:', err);
                this.unitCounts = [];
            }
        });
    }
    ngAfterViewInit(): void {
        this.drawTable_ProductGroup();
        this.drawTable_PGWareHouse();
        this.drawTable_ProductSale();
        this.getProductGroup();
        this.getdataEmployee();
        this.getDataWareHouse();
        this.getdataUnit();
        this.getDataProductGroupCBB();
    }
    //#region các hàm lấy dữ liệu và mở mđ ProductGroup
    getProductGroup() {
        this.productsaleSV
            .getdataProductGroup(this.warehouseCode, false)
            .subscribe({
                next: (res) => {
                    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        this.listProductGroup = res.data;
                        this.dataProducGroup = res.data;
                        console.log('table_productgroup', this.dataProducGroup);
                        // Chỉ gán ID nếu chưa có ID được chọn
                        if (!this.id) {
                            this.id = res.data[0].ID;
                            this.getProductSaleByID(this.id);
                            this.getDataProductGroupWareHouse(this.id);
                        }
                        if (this.table) {
                            this.table.setData(this.dataProducGroup).then(() => {
                                // Lấy tất cả các hàng, đáng tin cậy hơn getRowFromPosition(0) ngay lập tức
                                const allRows = this.table.getRows();
                                // 🔹 Tìm hàng đầu tiên có IsVisible = true
                                const firstVisibleRow = allRows.find((row: any) => {
                                    const data = row.getData();
                                    return data.IsVisible === true;
                                });
                                if (firstVisibleRow) {
                                    firstVisibleRow.select();
                                    const rowData = firstVisibleRow.getData();
                                    this.dataDelete = rowData;
                                    this.id = rowData['ID'];
                                    this.getDataProductSaleByIDgroup(this.id);
                                    this.getDataProductGroupWareHouse(this.id);
                                }
                            });
                        } else {
                            this.drawTable_ProductGroup();
                        }
                    }
                },
                error: (err) => {
                    console.error('Lỗi khi lấy nhóm vật tư:', err);
                },
            });
    }
    deleteProductGroup() {
        const payload = {
            Productgroup: {
                ID: this.id,
                IsVisible: false,
                UpdatedBy: 'admin',
                UpdatedDate: new Date(),
            },
        };
        if (this.dataDelete.IsVisible == false) {
            this.notification.warning(
                'Thông báo',
                'Nhóm vật tư đang ở trạng thái đã xóa'
            );
            return;
        }
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent:
                'Bạn có chắc chắn muốn xóa nhóm [' +
                this.dataDelete.ProductGroupName +
                '] không?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.productsaleSV.savedataProductGroup(payload).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(
                                'Thông báo',
                                res.message || 'Đã xóa thành công!'
                            );
                            this.id = 0; // Set to 0 to trigger selection of first record in GetProductGroup
                            this.getProductGroup();
                        } else {
                            this.notification.warning(
                                'Thông báo',
                                res.message || 'Không thể xóa nhóm!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa!');
                        console.error(err);
                    },
                });
            },
        });
    }
    openModalProductGroup(isEditmode: boolean) {
        this.isCheckmode = isEditmode;
        console.log('is', this.isCheckmode);
        const modalRef = this.modalService.open(ProductGroupDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.newProductGroup = this.newProductGroup;
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.listWH = this.listWH;
        modalRef.componentInstance.listEmployee = this.listEmployee;
        modalRef.componentInstance.id = this.id;

        modalRef.result.catch((result) => {
            if (result == true) {
                this.getProductGroup();
                this.getDataProductGroupWareHouse(this.id);
                this.getDataProductSaleByIDgroup(this.id);
                this.drawTable_PGWareHouse();
                this.drawTable_ProductGroup();
            }
        });
    }
    //#endregion

    //#region hàm liên quan productSale
    getAllProductSale() {
        if (this.checkedALL == true) {
            this.isLoading = true;
            this.productsaleSV
                .getdataProductSalebyID(0, this.keyword, this.checkedALL)
                .subscribe({
                    next: (res) => {
                        if (res?.data) {
                            this.listProductSale = Array.isArray(res.data) ? res.data : [];
                            this.dataProductSale = res.data;
                            if (this.table_productsale) {
                                this.table_productsale.replaceData(this.dataProductSale);
                            } else {
                                this.drawTable_ProductSale();
                            }
                        }
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
                        this.isLoading = false;
                    },
                });
        } else {
            this.getDataProductSaleByIDgroup(this.id);
        }
    }
    getProductSaleByID(id: number) {
        if (!this.id) return;
        this.isLoading = true;
        this.productsaleSV
            .getdataProductSalebyID(id, this.keyword, this.checkedALL)
            .subscribe({
                next: (res) => {
                    if (res?.data) {
                        this.listProductSale = Array.isArray(res.data) ? res.data : [];
                        this.dataProductSale = res.data;
                        if (this.table_productsale) {
                            this.table_productsale.replaceData(this.dataProductSale);
                        } else {
                            this.drawTable_ProductSale();
                        }
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
                    this.isLoading = false;
                },
            });
    }
    getDataProductSaleByIDgroup(id: number) {
        if (this.checkedALL == false) {
            this.isLoading = true;
            this.productsaleSV
                .getdataProductSalebyID(id, this.keyword, false)
                .subscribe({
                    next: (res) => {
                        if (res?.data) {
                            this.listProductSale = Array.isArray(res.data) ? res.data : [];
                            this.dataProductSale = res.data;
                            if (this.table_productsale) {
                                this.table_productsale.replaceData(this.dataProductSale);
                            } else {
                                this.drawTable_ProductSale();
                            }
                        }
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
                        this.isLoading = false;
                    },
                });
        }
    }
    // hàm để fill dữ liệu lên
    updateProductSale() {
        this.isCheckmode = true;
        var dataSelect = this.table_productsale.getSelectedData();
        this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
        const ids = this.selectedList.map((item) => item.ID);
        if (ids.length == 0) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn ít nhất 1 sản phẩm để sửa!'
            );
            return;
        }
        if (ids.length > 1) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chỉ chọn 1 sản phẩm để sửa!'
            );
            return;
        } else {
            this.idSale = ids[0];
            this.productsaleSV.getDataProductSalebyID(this.idSale).subscribe({
                next: (res) => {
                    if (res?.data) {
                        const data = Array.isArray(res.data) ? res.data[0] : res.data;
                        this.newProductSale = {
                            ProductCode: data.ProductCode,
                            ProductName: data.ProductName,
                            Maker: data.Maker,
                            Unit: data.Unit,
                            NumberInStoreDauky: data.NumberInStoreDauky,
                            NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
                            ProductGroupID: data.ProductGroupID,
                            LocationID: data.LocationID,
                            FirmID: data.FirmID,
                            Note: data.Note,
                            IsFix: data.IsFix !== null && data.IsFix !== undefined ? data.IsFix : false,
                        };

                        // Tải dữ liệu location cho nhóm sản phẩm đã chọn
                        this.productsaleSV
                            .getDataLocation(this.newProductSale.ProductGroupID)
                            .subscribe({
                                next: (locationRes) => {
                                    if (locationRes?.data) {
                                        this.listLocation = Array.isArray(locationRes.data)
                                            ? locationRes.data
                                            : [];
                                        this.openModalProductSale();
                                    }
                                },
                                error: (err) => {
                                    console.error('Lỗi khi tải dữ liệu location:', err);
                                    this.openModalProductSale(); // Vẫn mở modal ngay cả khi tải location thất bại
                                },
                            });
                    } else {
                        this.notification.warning(
                            'Thông báo',
                            res.message || 'Không thể lấy thông tin nhóm!'
                        );
                    }
                },
                error: (err) => {
                    this.notification.error(
                        'Thông báo',
                        'Có lỗi xảy ra khi lấy thông tin!'
                    );
                    console.error(err);
                },
            });
        }
    }
    deleteProductSale() {
        const dataSelect: ProductSale[] = this.table_productsale.getSelectedData();
        console.log('ban ghi xoa', dataSelect);
        const payloads = dataSelect.map((item) => ({
            ProductSale: {
                ...item,
                IsDeleted: true,
                UpdatedBy: 'admin',
                UpdatedDate: new Date(),
            },
        }));
        console.log('test', payloads);

        if (dataSelect.length === 0) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn ít nhất một bản ghi để xóa!'
            );
            return;
        }
        let name = '';
        dataSelect.forEach((item) => {
            name += item.ProductName + ',';
        });
        if (dataSelect.length > 10) {
            if (name.length > 10) {
                name = name.slice(0, 10) + '...';
            }
            name += ` và ${dataSelect.length - 1} vật tư khác`;
        } else {
            if (name.length > 20) {
                name = name.slice(0, 20) + '...';
            }
        }
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa vật tư <b>[${name}]</b> không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.productsaleSV.saveDataProductSale(payloads).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công!');
                            // this.id = 0; // Set to 0 to trigger selection of first record in GetProductGroup
                            // this.getProductGroup();
                            this.idSale = 0;
                            this.getDataProductSaleByIDgroup(this.id);
                        } else {
                            this.notification.warning(
                                'Thông báo',
                                res.message || 'Không thể xóa vật tư!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa!');
                        console.error(err);
                    },
                });
            },
        });
    }
    //#endregion

    //#region  Vẽ 3 bảng
    drawTable_ProductGroup() {
        this.table = new Tabulator(this.tableProductGroupRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.dataProducGroup,
            height: '100%',
            selectableRows: 1,
            pagination: false,
            rowHeader: false,
            rowFormatter: function (row) {
                const data = row.getData();
                const el = row.getElement();
                el.classList.remove('row-inactive');
                el.classList.remove('row-disabled');

                if (data['IsVisible'] === false) {
                    el.classList.add('row-disabled');
                }
            },

            columns: [
                {
                    title: 'ID',
                    field: 'ID',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    visible: false,
                },
                {
                    title: 'Mã nhóm',
                    field: 'ProductGroupID',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: '30%',
                },
                {
                    title: 'Tên nhóm',
                    field: 'ProductGroupName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: '70%',
                },
                {
                    title: 'EmployeeID',
                    field: 'EmployeeID',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: '30%',
                    visible: false,
                }
            ],
        });

        this.table.on('rowClick', (e: MouseEvent, row: RowComponent) => {
            const rowData = row.getData();
            this.dataDelete = rowData;
            this.id = rowData['ID'];
            this.getDataProductSaleByIDgroup(this.id);
            this.getDataProductGroupWareHouse(this.id);
        });
        this.table.on('rowDblClick', (e: MouseEvent, row: RowComponent) => {
            const rowData = row.getData();
            this.id = rowData['ID'];
            this.openModalProductGroup(true);
        });
    }
    drawTable_PGWareHouse() {
        this.table_pgwarehouse = new Tabulator(this.tablePGWarehouseRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.dataPGWareHouse || [],
            layout: 'fitDataStretch',
            pagination: false,
            height: '100%',
            columns: [
                {
                    title: 'Kho',
                    field: 'WarehouseCode',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: '30%',
                },
                {
                    title: 'NV phụ trách',
                    field: 'FullName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: '60%',
                    resizable: false,
                },
            ],
        });
    }
    drawTable_ProductSale() {
        this.table_productsale = new Tabulator(this.tableProductSaleRef.nativeElement, {
            data: this.dataProductSale,
            ...DEFAULT_TABLE_CONFIG,
            paginationMode: 'local',
            layout: 'fitDataStretch',
            columns: [
                {
                    title: 'Tên nhóm',
                    field: 'ProductGroupName',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Tích xanh',
                    field: 'IsFix',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: function (cell: any) {
                        const value = cell.getValue();
                        const checked =
                            value === true ||
                            value === 'true' ||
                            value === 1 ||
                            value === '1';
                        return `<input type="checkbox" ${checked ? 'checked' : ''
                            } style="pointer-events: none; accent-color: #1677ff;" />`;
                    },
                },
                {
                    title: 'Mã Sản phẩm',
                    field: 'ProductCode',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
                {
                    title: 'Mã nội bộ',
                    field: 'ProductNewCode',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Tên Sản phẩm',
                    field: 'ProductName',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
                {
                    title: 'Hãng',
                    field: 'Maker',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
                {
                    title: 'ĐVT',
                    field: 'Unit',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Vị trí',
                    field: 'LocationName',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
                {
                    title: 'Chi tiết nhập',
                    field: 'Detail',
                    width: 400,
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
                {
                    title: 'Ghi chú',
                    field: 'Note',
                    width: 500,
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                },
            ],
        });
        this.table_productsale.on(
            'rowDblClick',
            (e: MouseEvent, row: RowComponent) => {
                const rowData = row.getData();
                this.selectedList = [rowData]; // Make it an array with single item
                this.idSale = rowData['ID'];
                this.isCheckmode = true;
                this.productsaleSV.getDataProductSalebyID(this.idSale).subscribe({
                    next: (res) => {
                        if (res?.data) {
                            const data = Array.isArray(res.data) ? res.data[0] : res.data;
                            this.newProductSale = {
                                ProductCode: data.ProductCode,
                                ProductName: data.ProductName,
                                Maker: data.Maker,
                                Unit: data.Unit,
                                NumberInStoreDauky: data.NumberInStoreDauky,
                                NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
                                ProductGroupID: data.ProductGroupID,
                                LocationID: data.LocationID,
                                FirmID: data.FirmID,
                                Note: data.Note,
                            };

                            // Tải dữ liệu location cho nhóm sản phẩm đã chọn
                            this.productsaleSV
                                .getDataLocation(this.newProductSale.ProductGroupID)
                                .subscribe({
                                    next: (locationRes) => {
                                        if (locationRes?.data) {
                                            this.listLocation = Array.isArray(locationRes.data)
                                                ? locationRes.data
                                                : [];
                                            this.openModalProductSale();
                                        }
                                    },
                                    error: (err) => {
                                        console.error('Lỗi khi tải dữ liệu location:', err);
                                        this.openModalProductSale(); // Vẫn mở modal ngay cả khi tải location thất bại
                                    },
                                });
                        } else {
                            this.notification.warning(
                                'Thông báo',
                                res.message || 'Không thể lấy thông tin nhóm!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(
                            'Thông báo',
                            'Có lỗi xảy ra khi lấy thông tin!'
                        );
                        console.error(err);
                    },
                });
            }
        );
    }
    //#endregion

    //hàm tìm kiếm
    getdataFind() {
        if (this.checkedALL == true) {
            this.getAllProductSale();
        } else {
            this.getDataProductSaleByIDgroup(this.id);
        }
    }

    getDataProductGroupWareHouse(id: number) {
        this.productsaleSV.getdataProductGroupWareHouse(id, 0).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listPGWareHouse = Array.isArray(res.data) ? res.data : [];
                    this.dataPGWareHouse = res.data;
                    if (!this.table_pgwarehouse) {
                        this.drawTable_PGWareHouse();
                    } else {
                        this.table_pgwarehouse.setData(this.dataPGWareHouse).then(() => {
                            // // Lấy tất cả các hàng, đáng tin cậy hơn getRowFromPosition(0) ngay lập tức
                            //  const allRows = this.table_pgwarehouse.getRows();
                            //  const firstRow = allRows.length > 0 ? allRows[0] : null;
                            //   if (firstRow) {
                            //     firstRow.select();
                            //     const rowData = firstRow.getData();
                            //     this.dataDelete = rowData;
                            //   }
                        });
                    }
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
            },
        });
    }
    getdataEmployee() {
        this.productsaleSV.getdataEmployee().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listEmployee = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
            },
        });
    }
    getdataUnit() {
        this.productsaleSV.getdataUnitCount().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listUnitCount = Array.isArray(res.data) ? res.data : [];
                    console.log('don vi tinh', this.listUnitCount);
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu', err);
            },
        });
    }
    getDataProductGroupCBB() {
        this.productsaleSV.getDataProductGroupcbb().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu', err);
            },
        });
    }
    getDataWareHouse() {
        this.productsaleSV.getdataWareHouse().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listWH = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu', err);
            },
        });
    }

    openModalProductSale() {
        const modalRef = this.modalService.open(ProductSaleDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.newProductSale = this.newProductSale;
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.listLocation = this.listLocation;
        modalRef.componentInstance.listUnitCount = this.listUnitCount;
        modalRef.componentInstance.listProductGroupcbb = this.listProductGroupcbb;
        modalRef.componentInstance.selectedList = this.selectedList;
        modalRef.componentInstance.id = this.idSale;

        modalRef.result.catch((result) => {
            if (result == true) {
                //this.getProductGroup();
                this.getDataProductSaleByIDgroup(this.id);
            }
        });
    }

    openModalForNewProductSale() {
        this.isCheckmode = false;
        this.newProductSale = {
            ProductCode: '',
            ProductName: '',
            Maker: '',
            Unit: '',
            NumberInStoreDauky: 0,
            NumberInStoreCuoiKy: 0,
            ProductGroupID: 0,
            LocationID: 0,
            FirmID: 0,
            Note: '',
            IsFix: false,
        };
        this.openModalProductSale();
    }

    openModalImportExcel() {
        const modalRef = this.modalService.open(ImportExcelProductSaleComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.id = this.id;

        modalRef.result.catch((result) => {
            if (result == true) {
                this.getDataProductSaleByIDgroup(this.id);
            }
        });
    }
    //#region xuất excel
    async exportExcel() {
        const table = this.table_productsale;
        if (!table) return;

        const data = table.getData();
        if (!data || data.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách vật tư');

        const columns = table.getColumns();
        // Bỏ qua cột đầu tiên
        const filteredColumns = columns.slice(1);
        const headers = [
            'STT',
            ...filteredColumns.map((col: any) => col.getDefinition().title),
        ];
        worksheet.addRow(headers);

        data.forEach((row: any, index: number) => {
            const rowData = [
                index + 1,
                ...filteredColumns.map((col: any) => {
                    const field = col.getField();
                    let value = row[field];

                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                        value = new Date(value);
                    }

                    return value;
                }),
            ];

            worksheet.addRow(rowData);
        });

        // Format cột có giá trị là Date
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // bỏ qua tiêu đề
            row.eachCell((cell, colNumber) => {
                if (cell.value instanceof Date) {
                    cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
                }
            });
        });

        // Tự động căn chỉnh độ rộng cột
        worksheet.columns.forEach((column: any) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                // Giới hạn độ dài tối đa của cell là 50 ký tự
                maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
                cell.alignment = { wrapText: true, vertical: 'middle' };
            });
            // Giới hạn độ rộng cột tối đa là 30
            column.width = Math.min(maxLength, 30);
        });

        // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
        worksheet.autoFilter = {
            from: {
                row: 1,
                column: 1,
            },
            to: {
                row: 1,
                column: filteredColumns.length,
            },
        };

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const formattedDate = new Date()
            .toISOString()
            .slice(2, 10)
            .split('-')
            .reverse()
            .join('');

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `DanhSachVatTuKhoSale.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    }

    //#endregion

    //#region Yêu cầu báo giá
    openPriceRequest(): void {
        const modalRef = this.modalService.open(ProjectPartlistPriceRequestNewComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });

        // Truyền dữ liệu vào component - theo rule của component cũ
        modalRef.componentInstance.projectPartlistPriceRequestTypeID = 4;
        // Tự động set showHeader và headerText khi mở từ modal
        modalRef.componentInstance.showHeader = true;
        modalRef.componentInstance.headerText = 'Yêu cầu báo giá';
        modalRef.componentInstance.showCloseButton = true;

        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
            },
            (reason) => {
                console.log('Modal dismissed:', reason);
            }
        );
    }

    closeModal(): void {
        if (this.activeModal) {
            this.activeModal.close();
        }
    }
    //#endregion

    //#region Yêu cầu mua hàng
    openPurchaseRequest(): void {
        // Lấy các dòng đã chọn từ table ProductSale
        const selectedRows: ProductSale[] = this.table_productsale.getSelectedData();
        
        // if (selectedRows.length === 0) {
        //     this.notification.warning(
        //         NOTIFICATION_TITLE.warning,
        //         'Vui lòng chọn ít nhất một sản phẩm để tạo yêu cầu mua hàng!'
        //     );
        //     return;
        // }

        // Kiểm tra ProductGroupID (theo WinForm: check ProductGroupID = "MK")
        // Trong Angular, this.id là ProductGroupID đã chọn từ table ProductGroup
        if (!this.id || this.id <= 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn nhóm sản phẩm!'
            );
            return;
        }

        // Tạo dataset từ các dòng đã chọn
        const dataset: any[] = [];
        let countSTT = 0;

        selectedRows.forEach((row: any) => {
            countSTT++;
            
            // Tìm UnitCountID từ UnitName
            const unitName = String(row.Unit || '').trim();
            let unitCountID = 0;
            
            if (unitName) {
                const unitCount = this.unitCounts.find((u: any) => 
                    String(u.UnitName || '').toLowerCase().trim() === unitName.toLowerCase().trim()
                );
                if (unitCount && unitCount.ID) {
                    unitCountID = unitCount.ID;
                }
            }

            const newRow: any = {
                id: Date.now() + countSTT, // Temporary ID
                TT: countSTT,
                ProductCode: String(row.ProductCode || '').trim(),
                ProductNewCode: String(row.ProductNewCode || '').trim(),
                ProductName: String(row.ProductName || '').trim(),
                UnitName: unitCountID, // Set ID, không phải tên
                Manufacturer: String(row.Maker || '').trim(),
                ProductGroupID: this.id, // ProductGroupID từ table selection
                SupplierSaleID: null,
                DateReturnExpected: null,
                Quantity: 0,
                CurrencyID: null,
                CurrencyRate: 0,
                Note: '',
                ID: 0 // New row
            };

            dataset.push(newRow);
        });

        // Mở modal với MarketingPurchaseRequestComponent
        const modalRef = this.modalService.open(MarketingPurchaseRequestComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });

        // Truyền dữ liệu vào component
        modalRef.componentInstance.requestTypeID = 7; // Marketing
        modalRef.componentInstance.initialDataset = dataset; // Truyền dataset đã tạo

        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
            },
            (reason) => {
                console.log('Modal dismissed:', reason);
            }
        );
    }
    //#endregion
}
