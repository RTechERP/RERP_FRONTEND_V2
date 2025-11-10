import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';
import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { CommonModule } from '@angular/common';
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
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { SelectControlComponent } from '../select-control/select-control.component';
import { ProjectComponent } from '../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';
import { BillImportServiceService } from '../../../BillImport/bill-import-service/bill-import-service.service';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';

interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  Unit: string;
  AddressBox: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
}
interface BillExport {
  Id?: number;
  TypeBill: boolean;
  Code: string;
  Address: string;
  CustomerID: number;
  UserID: number;
  SenderID: number;
  WarehouseType: string;
  GroupID: string;
  KhoTypeID: number;
  ProductType: number;
  AddressStockID: number;
  WarehouseID: number;
  Status: number;
  SupplierID: number;
  CreatDate: Date | string | null;
  RequestDate: Date | string | null;
}

@Component({
  selector: 'app-bill-export-detail',
  standalone: true,
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
    NgbModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    SelectControlComponent,
  ],
  templateUrl: './bill-export-detail.component.html',
  styleUrl: './bill-export-detail.component.css',
})
export class BillExportDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  table_billExportDetail: any;
  dataTableBillExportDetail: any[] = [];

  dataCbbUser: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  datCbbSupplierSale: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];
  customerID: number = 0;

  dataProductSale: any = [];
  productOptions: any = [];
  projectOptions: any = [];
  billID: number = 0;
  deletedDetailIds: any[] = [];
  @Input() checkConvert:any;
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;

  @Input() wareHouseCode: string = 'HN  ';
  
  cbbStatus: any = [
    { ID: 0, Name: 'Mượn' },
    { ID: 1, Name: 'Tồn Kho' },
    { ID: 2, Name: 'Đã Xuất Kho' },
    { ID: 5, Name: 'Xuất trả NCC' },
    { ID: 6, Name: 'Yêu cầu xuất kho' },
  ];
  cbbProductType: any = [
    { ID: 1, Name: 'Hàng thương mại' },
    { ID: 2, Name: 'Hàng dự án' },
  ];
  dateFormat = 'dd/MM/yyyy';
  newProductSale: ProductSale = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    AddressBox: '',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
  };
  @Input() newBillExport: BillExport = {
    TypeBill: false,
    Code: '',
    Address: '',
    CustomerID: 0,
    UserID: 0,
    SenderID: 0,
    WarehouseType: '',
    GroupID: '',
    KhoTypeID: 0,
    ProductType: 0,
    AddressStockID: 0,
    WarehouseID: 0,
    Status: 0,
    SupplierID: 0,
    CreatDate: new Date(),
    RequestDate: new Date(),
  };
  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: NgbModal,
    private modal: NzModalService,
    private fb: NonNullableFormBuilder,
    private billExportService: BillExportService,
    private billImportService: BillImportServiceService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal
  ) {
    this.validateForm = this.fb.group({
      Code: ['', [Validators.required]],
      UserID: [0, [Validators.required, Validators.min(1)]],
      SenderID: [0, [Validators.required, Validators.min(1)]],
      CustomerID: [0, [Validators.required, Validators.min(1)]],
      Address: ['', [Validators.required]],
      KhoTypeID: [0, [Validators.required, Validators.min(1)]],
      Status: [0, [Validators.required]],
      ProductType: [0, [Validators.required, Validators.min(1)]],
      CreatDate: [new Date(), [Validators.required]],
      RequestDate: [new Date()],
      SupplierID: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.getDataCbbAdressStock();
    this.getDataCbbCustomer();
    this.getDataCbbProductGroup();
    this.getDataCbbSender();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();

    this.loadOptionProject();
    if(this.checkConvert == true ){
      this.getNewCode();
        this.billImportService.getBillImportByID(this.id).subscribe({
          next: (res) => {
            if (res?.data) {
              console.log('sjhsjdhs', res.data);
              const data = Array.isArray(res.data) ? res.data[0] : res.data;
              this.newBillExport = {
                TypeBill: false,
                Code: '',
                Address: '',
                CustomerID: data.CustomerID,
                UserID: data.ReciverID,
                SenderID: data.DeliverID,
                WarehouseType: '',
                GroupID: '',
                KhoTypeID: data.KhoTypeID,
                ProductType: 0,
                AddressStockID: 0,
                WarehouseID: data.WarehouseID,
                Status: 0,
                SupplierID: data.SupplierID,
                CreatDate: data.CreatDate ? new Date(data.CreatDate) : null,
                RequestDate: data.RequestDate ? new Date(data.RequestDate) : null,
              };
              this.validateForm.patchValue(this.newBillExport);
          this.changeProductGroup(this.newBillExport.KhoTypeID);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể lấy thông tin phiếu xuất!');
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin!');
        console.error(err);
      },
    });
    }
   else if (this.isCheckmode) {
      this.getBillExportByID();
    } else {
      this.getNewCode();
      this.newBillExport = {
        TypeBill: false,
        Code: '',
        Address: '',
        CustomerID: 0,
        UserID: 0,
        SenderID: 0,
        WarehouseType: '',
        GroupID: '',
        KhoTypeID: 0,
        ProductType: 0,
        AddressStockID: 0,
        WarehouseID: 0,
        Status: 0,
        SupplierID: 0,
        CreatDate: new Date(),
        RequestDate: new Date(),
      };
      this.validateForm.patchValue(this.newBillExport);
    }

    this.validateForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((values) => {
      this.newBillExport = { ...this.newBillExport, ...values };
    });
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBillExportByID() {
    this.billExportService.getBillExportByID(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillExport = {
            Id: data.ID,
            TypeBill: data.TypeBill,
            Code: data.Code,
            Address: data.Address,
            CustomerID: data.CustomerID,
            UserID: data.UserID,
            SenderID: data.SenderID,
            WarehouseType: data.WarehouseType,
            GroupID: data.GroupID,
            KhoTypeID: data.KhoTypeID,
            ProductType: data.ProductType,
            AddressStockID: data.AddressStockID,
            WarehouseID: data.WarehouseID,
            Status: data.Status,
            SupplierID: data.SupplierID,
            CreatDate: new Date(data.CreatDate),
            RequestDate: new Date(data.RequestDate),
          };
          this.validateForm.patchValue(this.newBillExport);
          this.changeProductGroup(this.newBillExport.KhoTypeID);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể lấy thông tin phiếu xuất!');
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin!');
        console.error(err);
      },
    });
  }
  getBillExportDetailConvert(){
    this.billImportService.getBillImportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.billID = rawData[0].BillID;
          console.log("datatable", rawData);
          this.dataTableBillExportDetail = rawData.map((item: any) => {
            const productInfo = this.productOptions.find((p: any) => p.value === item.ProductID) || {};
            // Nếu không tìm thấy sản phẩm, gọi getProductById để tải bổ sung
            if (!productInfo.value && item.ProductID) {
              this.getProductById(item.ProductID);
            }
            const projectInfo = this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};
            return {
              ID: item.ID || 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || productInfo.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo.ProductCode || '',
              ProductName: item.ProductName || productInfo.ProductName || '',
              Unit: item.Unit || productInfo.Unit || '',
              TotalInventory: item.TotalInventory || productInfo.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: item.QuantityRemain || 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport: item.ProjectCodeExport || projectInfo.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || projectInfo.label || '',
              ProductFullName: item.ProductFullName || '',
              Note: item.Note || '',
              UnitPricePOKH: item.UnitPricePOKH || 0,
              UnitPricePurchase: item.UnitPricePurchase || 0,
              BillCode: item.BillCode || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              POKHID: item.POKHID || 0,
              'Add Serial': item.SerialNumber || '',
              ProductType: item.ProductType || 0,
              IsInvoice: item.IsInvoice || false,
              InvoiceNumber: item.InvoiceNumber || '',
              SerialNumber: item.SerialNumber || '',
              ReturnedStatus: item.ReturnedStatus || false,
              ProjectPartListID: item.ProjectPartListID || 0,
              TradePriceDetailID: item.TradePriceDetailID || 0,
              BillImportDetailID: item.BillImportDetailID || 0,
              ExpectReturnDate: item.ExpectReturnDate ? new Date(item.ExpectReturnDate) : new Date(),
              InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
            };
          });

          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không có dữ liệu chi tiết phiếu xuất!');
          this.dataTableBillExportDetail = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu xuất!');
        console.error(err);
        this.dataTableBillExportDetail = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
      }
    });
  }
  getBillExportDetailID() {
    this.billExportService.getBillExportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.dataTableBillExportDetail = rawData.map((item: any) => {
            const productInfo = this.productOptions.find((p: any) => p.value === item.ProductID) || {};
            const projectInfo = this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};
            return {
              ID: item.ID || 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || productInfo.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo.ProductCode || '',
              ProductName: item.ProductName || productInfo.ProductName || '',
              Unit: item.Unit || productInfo.Unit || '',
              TotalInventory: item.TotalInventory || productInfo.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: item.QuantityRemain || 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport: item.ProjectCodeExport || projectInfo.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || projectInfo.label || '',
              ProductFullName: item.ProductFullName || '',
              Note: item.Note || '',
              UnitPricePOKH: item.UnitPricePOKH || 0,
              UnitPricePurchase: item.UnitPricePurchase || 0,
              BillCode: item.BillCode || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              POKHID: item.POKHID || 0,
              'Add Serial': item.SerialNumber || '',
              ProductType: item.ProductType || 0,
              IsInvoice: item.IsInvoice || false,
              InvoiceNumber: item.InvoiceNumber || '',
              SerialNumber: item.SerialNumber || '',
              ReturnedStatus: item.ReturnedStatus || false,
              ProjectPartListID: item.ProjectPartListID || 0,
              TradePriceDetailID: item.TradePriceDetailID || 0,
              BillImportDetailID: item.BillImportDetailID || 0,
              ExpectReturnDate: item.ExpectReturnDate ? new Date(item.ExpectReturnDate) : new Date(),
              InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
            };
          });

          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không có dữ liệu chi tiết phiếu xuất!');
          this.dataTableBillExportDetail = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu xuất!');
        console.error(err);
        this.dataTableBillExportDetail = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
      },
    });
  }

  getProductById(productId: number) {
    this.productSaleService.getDataProductSalebyID(productId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const product = res.data;
          if (!this.productOptions.find((p: any) => p.value === product.ID)) {
            this.productOptions.push({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductNewCode: product.ProductNewCode,
            });
            if (this.table_billExportDetail) {
              this.table_billExportDetail.redraw(true);
            }
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi khi lấy thông tin sản phẩm!');
      },
    });
  }

  loadOptionProject() {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        console.log('pj', res.data);
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectOptions = projectData
            .filter((project) => project.ID !== null && project.ID !== undefined && project.ID !== 0)
            .map((project) => ({
              label: project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
            }));
        } else {
          this.projectOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy danh sách dự án');
        this.projectOptions = [];
      },
    });
  }

  changeProductGroup(ID: number) {
    if (!ID) {
      this.productOptions = [];
      if (this.table_billExportDetail) {
        this.table_billExportDetail.replaceData([]);
      }
      return;
    }
    // truyền đúng tham số theo BE: warehouseCode + productGroupID
    this.billExportService.getOptionProduct('HN', ID).subscribe({
      next: (res: any) => {
        const productData = res.data;
        if (Array.isArray(productData)) {
          this.productOptions = productData
            .filter((product) => product.ID !== null && product.ID !== undefined && product.ID !== 0)
            .map((product) => ({
              label: product.ProductName,
              value: product.ProductSaleID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductID: product.ProductSaleID,
              ProductNewCode: product.ProductNewCode,
            }));
        } else {
          this.productOptions = [];
          console.warn('Dữ liệu sản phẩm không phải mảng:', productData);
        }
      if(this.checkConvert == true){
        this.getBillExportDetailConvert();
      }
        else if (this.isCheckmode) {
          this.getBillExportDetailID();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi khi tải danh sách sản phẩm!');
        this.productOptions = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
      },
    });
  }

  getNewCode() {
    this.billExportService.getNewCodeBillExport(this.newBillExport.Status).subscribe({
      next: (res: any) => {
        console.log('New code received:', res);
        this.newBillExport.Code = res?.data ?? '';
        this.validateForm.patchValue({ Code: this.newBillExport.Code });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy mã phiếu');
      },
    });
  }

  changeStatus() {
    this.getNewCode();
  }

  getDataCbbSupplierSale() {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbUser() {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbUser = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbSender() {
    this.billExportService.getCbbSender().subscribe({
      next: (res: any) => {
        this.dataCbbSender = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbAdressStock() {
    this.billExportService.getCbbAddressStock(this.customerID).subscribe({
      next: (res: any) => {
        this.dataCbbAdressStock = res.data;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbCustomer() {
    this.billExportService.getCbbCustomer().subscribe({
      next: (res: any) => {
        console.log('Raw response:', res);
        
        this.dataCbbCustomer = res.data.data;
        console.log('dataCbbCustomer:', this.dataCbbCustomer);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  changeCustomer() {
    const id = this.validateForm.get('CustomerID')?.value;
    this.billExportService.getCustomerByID(id).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.newBillExport.Address = res.data.Address;
          this.validateForm.patchValue({ Address: res.data.Address });
          console.log('Address:', this.newBillExport.Address);
        } else {
          console.warn('Không tìm thấy địa chỉ khách hàng');
          this.newBillExport.Address = '';
          this.validateForm.patchValue({ Address: '' });
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu khách hàng', err);
      },
    });
    this.billExportService.getCbbAddressStock(id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.dataCbbAdressStock = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }

  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  openModalNewProduct() {
    this.newProductSale = {
      ProductCode: '',
      ProductName: '',
      Maker: '',
      Unit: '',
      AddressBox: '',
      NumberInStoreDauky: 0,
      NumberInStoreCuoiKy: 0,
      ProductGroupID: 0,
      LocationID: 0,
      FirmID: 0,
      Note: '',
    };
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductSale = this.newProductSale;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedList = [];
    modalRef.componentInstance.id = 0;
    modalRef.result.catch((result: any) => {
      if (result == true) {
        // Xử lý reload nếu cần
      }
    });
  }

  closeModal() {
    this.activeModal.close();
  }

  addRow() {
    if (this.table_billExportDetail) {
      this.table_billExportDetail.addRow({
        ProductNewCode: '',
        ProductCode: null,
        TotalInventory: 0,
        ProductName: '',
        ProductFullName: '',
        Unit: '',
        Qty: 0,
        ProductGroupName: '',
        ProductTypeText: '',
        Note: '',
        UnitPricePOKH: 0,
        UnitPricePurchase: 0,
        BillCode: '',
        ProjectCodeExport: '',
        ProjectNameText: '',
      });
    }
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => { });

      return container;
    };
  }
  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    const modalRef = this.modalService.open(BillImportChoseSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.quantity = quantity;
    modalRef.componentInstance.productCode = productCode;
    modalRef.componentInstance.existingSerials = existingSerials;
    modalRef.componentInstance.type = 2;

    modalRef.result.then(
      (serials: { ID: number; Serial: string }[]) => {
        console.log('Serials returned:', serials);
        if (Array.isArray(serials) && serials.length > 0) {
          const serialsID = serials.map(s => s.ID).join(',');
          row.update({ SerialNumber: serialsID });
          this.notification.success('Thông báo','Cập nhật serial thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error,'Dữ liệu serial không hợp lệ!');
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
    
  }

  drawTable() {
    console.log('data', this.dataTableBillExportDetail);
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
      this.table_billExportDetail = new Tabulator('#table_BillExportDetails', {
        data: this.dataTableBillExportDetail,
        layout: 'fitDataFill',
        height: '38vh',
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        // ...DEFAULT_TABLE_CONFIG,
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
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRow();
            },
            formatter: () => `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    console.log('Row Data:', rowData);
                    console.log('ID to delete:', rowData['ID']);
                    if (rowData['ID']) {
                      this.deletedDetailIds.push(rowData['ID']);
                      console.log('Updated deletedDetailIds:', this.deletedDetailIds);
                    }
                    row.delete();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            headerSort: false,
          },
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, headerSort: false, visible: false },
          { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'left', headerHozAlign: 'center' },
          {
            title: 'Mã sản phẩm',
            field: 'ProductID',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 450,
            editor: this.createdControl(SelectControlComponent, this.injector, this.appRef, () => this.productOptions, {
              valueField: 'value',
              labelField: 'label',
            }),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn sản phẩm</p> <i class="fas fa-angle-down"></i></div>';
              }
              const product = this.productOptions.find((p: any) => p.value === val);
              console.log('ProductID:', val, 'Found Product:', product);
              const productCode = product ? product.ProductCode : 'Chưa có dữ liệu';
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productCode}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProduct = this.productOptions.find((p: any) => p.value === newValue);
              if (selectedProduct) {
                row.update({
                  ProductCode: selectedProduct.ProductCode,
                  ProductNewCode: selectedProduct.ProductNewCode,
                  Unit: selectedProduct.Unit || '',
                  TotalInventory: selectedProduct.TotalInventory || 0,
                  ProductName: selectedProduct.ProductName,
                });
              }
            },
          },
          { title: 'SL tồn', field: 'TotalInventory', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'Mã sp theo dự án', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Tên sản phẩm', field: 'ProductName', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'SL xuất', field: 'Qty', hozAlign: 'right', headerHozAlign: 'center', editor: 'input' },
          { title: 'SL còn lại', field: 'QuantityRemain', hozAlign: 'right', headerHozAlign: 'center', editor: 'input' },
          {
            title: 'Dự án',
            field: 'ProjectID',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            editor: this.createdControl(SelectControlComponent, this.injector, this.appRef, () => this.projectOptions, {
              valueField: 'value',
              labelField: 'label',
            }),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const project = this.projectOptions.find((p: any) => p.value === val);
              const projectName = project ? project.label : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.projectOptions.find((p: any) => p.value === newValue);
              if (selectedProject) {
                row.update({
                  ProjectCodeExport: selectedProject.ProjectCode,
                  InventoryProjectIDs: [newValue],
                });
              }
            },
          },
          { title: 'Mã dự án', field: 'ProjectCodeExport', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Ghi chú (PO)', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Đơn giá bán', field: 'UnitPricePOKH', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Đơn giá mua', field: 'UnitPricePurchase', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Mã đơn hàng', field: 'BillCode', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Thông số kỹ thuật', field: 'Specifications', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Nhóm', field: 'GroupExport', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Người nhận', field: 'UserReceiver', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Mã sp xuất dự án', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'POKHID', field: 'POKHID', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Serial', field: 'SerialNumber', hozAlign: 'left', headerHozAlign: 'center' },
          {
            title: "Add Serial",
            field: "addRow",
            hozAlign: "center",
            width: 40,
            headerSort: false,
            titleFormatter: () => `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                    <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i>
                </div>`,
            formatter: () => `
                <i class="fas fa-plus text-success cursor-pointer" title="Thêm serial"></i>
            `,
            cellClick: (e, cell) => {
                const row = cell.getRow();
                const rowData = row.getData();
                const quantity = rowData['Qty'];
                const productCode = rowData['ProductID'];
                const serialIDsRaw = rowData['SerialNumber'];
                const type = 2;
        
                if (quantity <= 0) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số lượng xuất lớn hơn 0 trước khi chọn Serial!');
                    return;
                }
        
                if (serialIDsRaw && typeof serialIDsRaw === 'string') {
                    const serialIDs = serialIDsRaw
                        .split(',')
                        .map((id: string) => parseInt(id.trim())) // Xử lý khoảng trắng
                        .filter((id: number) => !isNaN(id) && id > 0);
        
                    if (serialIDs.length === 0) {
                        this.openSerialModal(rowData, row, quantity, productCode, []);
                        return;
                    }
        
                    const payload = {
                        Ids: serialIDs,
                        Type: type
                    };
        
                    this.billExportService.getSerialByIDs(payload).subscribe({
                        next: (res) => {
                            if (res?.status === 1 && res.data) {
                                const existingSerials = res.data.map((item: any) => ({
                                    ID: item.ID,
                                    Serial: item.SerialNumber || item.Serial || ''
                                }));
                                this.openSerialModal(rowData, row, quantity, productCode, existingSerials);
                            } else {
                                this.notification.error(NOTIFICATION_TITLE.error, 'Không tải được serial!');
                                console.error('Lỗi response:', res);
                                this.openSerialModal(rowData, row, quantity, productCode, []);
                            }
                        },
                        error: (err) => {
                            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải serial!');
                            console.error('Lỗi API:', err);
                            this.openSerialModal(rowData, row, quantity, productCode, []);
                        }
                    });
                } else {
                    this.openSerialModal(rowData, row, quantity, productCode, []);
                }
            }
        }
        ],
      });
    }
  }

  saveDataBillExport() {
    console.log('saveDataBillExport called');

    if (!this.validateForm.valid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!');
      this.validateForm.markAllAsTouched();
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const billExportDetailsFromTable = this.table_billExportDetail?.getData();
    if (!billExportDetailsFromTable || billExportDetailsFromTable.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng thêm ít nhất một sản phẩm vào bảng!');
      return;
    }

    const formValues = this.validateForm.value;

    if (this.isCheckmode) {
      const payload = {
        BillExport: {
          ID: this.newBillExport.Id,
          Code: formValues.Code,
          TypeBill: false,
          SupplierID: formValues.SupplierID,
          CustomerID: formValues.CustomerID,
          UserID: formValues.UserID,
          SenderID: formValues.SenderID,
          StockID: this.newBillExport.AddressStockID,
          Description: '',
          Address: formValues.Address,
          Status: formValues.Status,
          GroupID: this.newBillExport.GroupID,
          WarehouseType: this.newBillExport.WarehouseType,
          KhoTypeID: formValues.KhoTypeID,
          UpdatedDate: new Date(),
          CreateDate: formValues.CreatDate,
          ProductType: formValues.ProductType,
          AddressStockID: this.newBillExport.AddressStockID,
          WarehouseID: this.newBillExport.WarehouseID,
          RequestDate: formValues.RequestDate,
          BillDocumentExportType: 2,
        },
        billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log('Payload:', payload);
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal();
          }else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể cập nhật phiếu xuất!');
          }
        },
        error: (err: any) => {
          // Nếu backend trả về JSON { message: "..."} hoặc { error: "..."}
          const backendMsg =
            err?.error?.message || err?.error?.error || err?.message || 'Có lỗi xảy ra khi cập nhật!';
          this.notification.error(NOTIFICATION_TITLE.error, backendMsg);
          console.error('API error:', err);
        }
      });
    } else {
      const wareHouseCode = this.dataCbbProductGroup.find((p: any) => p.ID === formValues.KhoTypeID);
      const payload = {
        BillExport: {
          ID: this.newBillExport.Id || 0,
          Code: formValues.Code,
          TypeBill: false,
          SupplierID: formValues.SupplierID,
          CustomerID: formValues.CustomerID,
          UserID: formValues.UserID,
          SenderID: formValues.SenderID,
          StockID: this.newBillExport.AddressStockID,
          Description: '',
          Address: formValues.Address,
          CreatDate: new Date(),
          IsApproved: false,
          Status: formValues.Status,
          GroupID: this.newBillExport.GroupID,
          WarehouseType: wareHouseCode ? wareHouseCode.ProductGroupName : '',
          KhoTypeID: formValues.KhoTypeID,
          CreatedDate: formValues.CreatDate,
          UpdatedDate: new Date(),
          ProductType: formValues.ProductType,
          AddressStockID: this.newBillExport.AddressStockID,
          WarehouseID: 1,
          IsPrepared: false,
          IsReceived: false,
          RequestDate: formValues.RequestDate,
          BillDocumentExportType: 2,
          IsDeleted: false,
        },
        billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log('Payload:', payload);
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể thêm phiếu xuất!');
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi thêm mới!');
        },
      });
    }
  }

  private mapTableDataToBillExportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      return {
        ID: row.ID || 0,
        ProductID: row.ProductID || 0,
        ProductName: row.ProductName || '',
        ProductCode: row.ProductCode || '',
        ProductNewCode: row.ProductNewCode || '',
        ProductFullName: row.ProductName || '',
        Qty: row.Qty || 0,
        ProjectName: row.ProjectNameText || '',
        Note: row.Note || '',
        STT: index + 1,
        TotalQty: row.TotalQty || 0,
        ProjectID: row.ProjectID || 0,
        ProductType: this.validateForm.get('ProductType')?.value,
        POKHID: row.POKHID || 0,
        GroupExport: row.GroupExport || '',
        IsInvoice: false,
        InvoiceNumber: '',
        SerialNumber: row.SerialNumber || '',
        ReturnedStatus: false,
        ProjectPartListID: 0,
        TradePriceDetailID: 0,
        POKHDetailID: 0,
        Specifications: row.Specifications || '',
        BillImportDetailID: 0,
        TotalInventory: row.TotalInventory || 0,
        ExpectReturnDate: null,
      };
    });
  }
}