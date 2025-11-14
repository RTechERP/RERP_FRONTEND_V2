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
// import * as bootstrap from 'bootstrap';

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

import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
// Thêm các import này vào đầu file
import { ProjectComponent } from '../../../../project/project.component';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
import { BillImportComponent } from '../../bill-import.component';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SelectControlComponent } from '../../../BillExport/Modal/select-control/select-control.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { AppUserService } from '../../../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';


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
interface BillImport {
  Id?: number;
  BillImportCode: string;
  ReciverID: number;
  Reciver: string;
  DeliverID: number;
  Deliver: string;
  KhoTypeID: number;
  KhoType: string;
  WarehouseID: number;
  BillTypeNew: number;
  SupplierID: number;
  Supplier: string;
  RulePayID: number;
  CreatDate: Date | string | null;
  DateRequest: Date | string | null;
}
@Component({
  selector: 'app-bill-import-detail',
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
    NzFormModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    NzTabsModule,
    NzSpinModule,

  ],
  templateUrl: './bill-import-detail.component.html',
  styleUrl: './bill-import-detail.component.css'
})
export class BillImportDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  isVisible: boolean = true;
  private warehouseIdHN: number = 0;
  warehouses: any[] = [];
  table_billImportDetail: any;
  dataTableBillImportDetail: any[] = [];
  table_DocumnetImport: any;
  dataTableDocumnetImport: any[] = [];

 @Input() WarehouseCode = "HN";
  isLoading: boolean = false;
  deletedDetailIds: number[] = [];

  dataCbbReciver: any[] = [];
  dataCbbDeliver: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  datCbbSupplierSale: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];
  dataCbbRulePay: any[] = [];
  customerID: number = 0;

  dataProductSale: any = [];
  productOptions: any = [];
  projectOptions: any = [];
  billID: number = 0;
  deliverID:number = 0;
  //tao phieu tra
  @Input() createImport: any;
  @Input() dataHistory: any[] = [];
  //
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;

  cbbStatus: any = [
    { ID: 0, Name: "Phiếu nhập kho" },
    { ID: 1, Name: "Phiếu trả" },
    { ID: 3, Name: "Phiếu mượn NCC" },
    { ID: 4, Name: "Yêu cầu nhập kho" }
  ];
  cbbProductType: any = [
    { ID: 1, Name: "Hàng thương mại" },
    { ID: 2, Name: "Hàng dự án" },
  ]
    private initialBillTypeNew: number | null = null; // Thêm biến này
  private isInitialLoad: boolean = true; // Cờ để biết có đang load lần đầu không
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
  @Input() newBillImport: BillImport = {
    Id: 0,
    BillImportCode: '',
    ReciverID: 0,
    Reciver: "",
    DeliverID: 0,
    Deliver: "",
    KhoType: "",
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: "",
    CreatDate: new Date(),
    RulePayID: 0,
    DateRequest: new Date(),
  };

  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: NgbModal,
    private modal: NzModalService,
    private fb: NonNullableFormBuilder,
    private billImportService: BillImportServiceService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal,
    private billExportService: BillExportService,
    private appUserService: AppUserService
  ) {
    this.validateForm = this.fb.group({
      BillImportCode: [{ value: '', disabled: true }, [Validators.required,]],
      BillTypeNew: [0, [Validators.required]],
      ReciverID: [0, [Validators.required, Validators.min(1)]],
      WarehouseName: [{ value: 'HN', disabled: true }],
      // Thêm WarehouseID để auto-binding dựa vào kho hoạt động đúng
      WarehouseID: [0, [Validators.required, Validators.min(1)]],
      SupplierID: [0, [Validators.required, Validators.min(1)]],
      DeliverID: [0, [Validators.required, Validators.min(1)]],
      CreatDate: [null],
      KhoTypeID: [0, [Validators.required, Validators.min(1)]],
      RulePayID: [0, [Validators.required, Validators.min(1)]],
      DateRequest: [null]
    });
  }

  ngOnInit(): void {
    console.log('iddd', this.id);
    this.billImportService.getWarehouse().subscribe((res: any) => {
      const list = res.data || [];
      this.warehouses = list;
      console.log('list', list);

      // Xác định kho hiện tại dựa trên mã WarehouseName (ví dụ: HN, HCM)
      const currentWarehouse = list.find((item: any) =>

        String(item.WarehouseCode).toUpperCase() === String(this.WarehouseCode).toUpperCase()
      );
      const currentId = currentWarehouse?.ID ?? 0;

      // Lấy ID kho HN để phục vụ logic người giao ở HCM
      const hnId = list.find((item: any) =>
        String(item.WareHouseCode).toUpperCase().includes('HN')
      )?.ID ?? 1;

      console.log('WarehouseId', currentId);

      // Set WarehouseID và hiển thị tên kho; đồng thời khóa control để người dùng không chỉnh
      this.validateForm.controls['WarehouseID'].setValue(currentId);
      this.validateForm.controls['WarehouseName'].setValue(currentWarehouse?.WarehouseName || this.WarehouseCode);
      this.validateForm.controls['WarehouseID'].disable();

      this.warehouseIdHN = hnId;
      console.log('warehouseIdHN', hnId);

      // Người giao mặc định là user hiện tại
      this.validateForm.controls['DeliverID'].setValue(this.appUserService.id || 0);

      // Áp dụng logic nhận/giao theo kho và NCC
      this.updateReceiverDeliver();
    });
 // Theo dõi thay đổi BillTypeNew
  this.validateForm.get('BillTypeNew')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((newValue: number) => {
      // // Bỏ qua lần đầu load dữ liệu
      // if (this.isInitialLoad) {
      //   this.isInitialLoad = false;
      //   this.initialBillTypeNew = newValue;
      //   return;
      // }
      // debugger
      // // Chỉ gọi changeStatus khi người dùng chủ động thay đổi
      // // VÀ giá trị mới khác với giá trị ban đầu
      // if (!this.isCheckmode || newValue !== this.initialBillTypeNew) {
      //   this.changeStatus();
      // }
      console.log('BillTypeNew changed:', newValue, 'isInitialLoad:', this.isInitialLoad, 'initial:', this.initialBillTypeNew, 'isCheckmode:', this.isCheckmode);  // THÊM: Để debug

    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      this.initialBillTypeNew = newValue;
      console.log('Skipped as initial load');  // THÊM
      return;
    }

    if (!this.isCheckmode || newValue !== this.initialBillTypeNew) {
      console.log('Calling changeStatus');  // THÊM
      this.changeStatus();
    } else {
      console.log('Skipped: same as initial in edit mode');  // THÊM
    }
    });
    // Theo dõi thay đổi Loại kho và NCC để áp dụng lại logic
    this.validateForm.get('KhoTypeID')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productGroupId: number) =>{
        this.changeProductGroup(productGroupId);
        this.updateReceiverDeliver();
      } );

    this.validateForm.get('SupplierID')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() =>{
        this.changeSuplierSale();
        this.updateReceiverDeliver();
      } );

    this.validateForm.get('WarehouseID')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateReceiverDeliver();
      });
if (this.createImport) {
  this.newBillImport.BillTypeNew = 1;
  this.initialBillTypeNew = 1;
  this.isInitialLoad = false;  // THÊM: Set false ngay để lần user change đầu gọi getNewCode
  this.getNewCode();
  this.patchNewBillImportFromHistory();
}
else if (this.isCheckmode && this.id > 0) {
  this.getBillImportByID();
}
else if (!this.newBillImport.Id || this.newBillImport.Id === 0) {
  this.initialBillTypeNew = 0;
  this.isInitialLoad = false;  // THÊM: Set false để lần user change đầu gọi getNewCode
  this.getNewCode();
}


    this.getDataCbbProductGroup();
    this.getDataCbbRulePay();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
    this.loadOptionProject();
    this.loadDocumentImport();

    // //trường hợp tạo phiếu trả
    // if (this.createImport == true) {
    //   this.newBillImport.BillTypeNew = 1;
    //   this.getNewCode();
    //   console.log("mã phiếu mới: ", this.newBillImport.BillImportCode);
    //   console.log("binh: ", this.dataHistory);
    //   this.newBillImport.Deliver = this.dataHistory[0].FullName
    //   this.newBillImport.DeliverID = this.dataHistory[0].UserID
    //   this.newBillImport.KhoTypeID = this.dataHistory[0].ProductGroupID
    //   this.newBillImport.KhoType = this.dataHistory[0].ProductGroupName

    //   this.validateForm.patchValue(this.newBillImport);
    //   this.changeProductGroup(this.newBillImport.KhoTypeID)
    //   ///map detail
    //   this.dataTableBillImportDetail = this.dataHistory.map((item: any) => {
    //     const productInfo = this.productOptions.find((p: any) => p.value === item.ProductID) || {};
    //     // Nếu không tìm thấy sản phẩm, gọi getProductById để tải bổ sung
    //     if (!productInfo.value && item.ProductID) {
    //       this.getProductById(item.ProductID);
    //     }
    //     const projectInfo = this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};
    //     return {
    //       ID: item.ID || 0,
    //       POKHDetailID: item.POKHDetailID || 0,
    //       ProductID: item.ProductID || 0,
    //       ProductNewCode: item.ProductNewCode || productInfo.ProductNewCode || '',
    //       ProductCode: item.ProductCode || productInfo.ProductCode || '',
    //       ProductName: item.ProductName || productInfo.ProductName || '',
    //       Unit: item.Unit || productInfo.Unit || '',
    //       TotalInventory: item.TotalInventory || productInfo.TotalInventory || 0,
    //       Qty: item.BorrowQty || 0,
    //       QuantityRemain: item.QuantityRemain || 0,
    //       ProjectID: item.ProjectID || 0,
    //       ProjectCodeExport: item.ProjectCodeExport || projectInfo.ProjectCode || '',
    //       ProjectNameText: item.ProjectNameText || projectInfo.label || '',
    //       ProductFullName: item.ProductFullName || '',
    //       Note: item.Note || '',
    //       UnitPricePOKH: item.UnitPricePOKH || 0,
    //       UnitPricePurchase: item.UnitPricePurchase || 0,
    //       BillCode: item.BillCode || '',
    //       Specifications: item.Specifications || '',
    //       GroupExport: item.GroupExport || '',
    //       UserReceiver: item.UserReceiver || '',
    //       POKHID: item.POKHID || 0,
    //       'Add Serial': item.SerialNumber || '',
    //       ProductType: item.ProductType || 0,
    //       IsInvoice: item.IsInvoice || false,
    //       InvoiceNumber: item.InvoiceNumber || '',
    //       SerialNumber: item.SerialNumber || '',
    //       ReturnedStatus: item.ReturnedStatus || false,
    //       ProjectPartListID: item.ProjectPartListID || 0,
    //       TradePriceDetailID: item.TradePriceDetailID || 0,
    //       BillImportDetailID: item.BillImportDetailID || 0,
    //       ExpectReturnDate: item.ExpectReturnDate ? new Date(item.ExpectReturnDate) : new Date(),
    //       InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
    //     };
    //   });

    //   if (this.table_billImportDetail) {
    //     this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    //     setTimeout(() => {
    //       this.table_billImportDetail.redraw(true);
    //     }, 100);
    //   }
    // }
    // else if (this.isCheckmode) {
    //   this.getBillImportByID();
    // } else {
    //   this.getNewCode();
    //   this.newBillImport = {
    //     BillImportCode: '',
    //     ReciverID: 0,
    //     Reciver: '',
    //     DeliverID: 0,
    //     Deliver: '',
    //     KhoType: '',
    //     KhoTypeID: 0,
    //     WarehouseID: 1,
    //     BillTypeNew: 0,
    //     SupplierID: 0,
    //     Supplier: '',
    //     CreatDate: null,
    //     DateRequest: null,
    //     RulePayID: 0,
    //   };
    //   this.validateForm.patchValue(this.newBillImport);
    // }

    // Theo dõi thay đổi form để đồng bộ với newBillImport
    this.validateForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((values) => {
      this.newBillImport = { ...this.newBillImport, ...values };
    });
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.drawDocumentTable
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchNewBillImportFromHistory() {
  if (!this.dataHistory || this.dataHistory.length === 0) return;

  const firstHistory = this.dataHistory[0];

  // Cập nhật thông tin phiếu mới dựa trên phiếu cũ
  this.newBillImport.BillImportCode = ''; // sẽ tạo mã mới
  this.newBillImport.Deliver = firstHistory.FullName;
  this.newBillImport.DeliverID = firstHistory.UserID;
  this.newBillImport.KhoTypeID = firstHistory.ProductGroupID;
  this.newBillImport.KhoType = firstHistory.ProductGroupName;
// SỬA: Patch mà không trigger valueChanges
  this.validateForm.patchValue(this.newBillImport, { emitEvent: false });

  // THÊM: Đảm bảo flag (dù đã set ở ngOnInit)
  this.isInitialLoad = false;
  // Patch vào form
  // this.validateForm.patchValue(this.newBillImport);

  // Map chi tiết sản phẩm từ dataHistory
  this.dataTableBillImportDetail = this.dataHistory.map((item: any) => {
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
      Qty: item.BorrowQty || 0,
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

  // Load dữ liệu vào table nếu table đã khởi tạo
  if (this.table_billImportDetail) {
    this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    setTimeout(() => {
      this.table_billImportDetail.redraw(true);
    }, 100);
  }
}

  changeStatus() {
    this.getNewCode();
    const billTypeNew = this.validateForm.get('BillTypeNew')?.value;
    if (billTypeNew === 4) {
      this.validateForm.patchValue({ CreatDate: null, DateRequest: new Date() });
    } else {
      this.validateForm.patchValue({ DateRequest: null, CreatDate: new Date() });
    }
  }

  changeSuplierSale() {
    const supplierId = this.validateForm.get('SupplierID')?.value;
    const specialSuppliers = [1175, 16677];
    this.validateForm.patchValue({
      RulePayID: specialSuppliers.includes(supplierId) ? 34 : 0
    });
  }

  /**
   * LoadDataReciver - Giống WinForm frmBillImportDetail.cs lines 1850-1882
   * Logic tự động set Receiver và Deliverer dựa trên Warehouse, KhoType, và Supplier
   */
  private updateReceiverDeliver(): void {
    // Chỉ chạy khi tạo mới phiếu (giống WinForm: if (billImport.ID > 0) return;)
    if (this.isCheckmode && this.id > 0) return;

    const khoTypeId = this.validateForm.controls['KhoTypeID'].value || 0;
    const warehouseId = this.validateForm.controls['WarehouseID'].value || 0;
    const supplierId = this.validateForm.controls['SupplierID'].value || 0;

    // Nếu chưa chọn kho type thì không làm gì
    if (!khoTypeId || !warehouseId) return;

    const isHCM = String(this.WarehouseCode).toUpperCase().includes('HCM');
    const specialSuppliers = [1175, 16677]; // Giống WinForm line 1848

    if (isHCM) {
      // === LOGIC KHO HCM (WinForm lines 1868-1881) ===

      // 1. Người nhận = user hiện tại (line 1870)
      this.validateForm.controls['ReciverID'].setValue(this.appUserService.id || 0);

      // 2. Người giao: Chỉ set nếu NCC thuộc nhóm đặc biệt
      if (specialSuppliers.includes(supplierId) && this.warehouseIdHN) {
        // Lấy mapping từ kho HN (warehouseID = 1) - line 1871-1873
        this.productSaleService
          .getdataProductGroupWareHouse(khoTypeId, this.warehouseIdHN)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              this.validateForm.controls['DeliverID'].setValue(userId); // line 1878
            },
            error: () => {
              this.validateForm.controls['DeliverID'].setValue(0);
            }
          });
      } else {
        // Nếu không phải NCC đặc biệt -> Người giao = 0 (line 1880)
        this.validateForm.controls['DeliverID'].setValue(0);
      }
    } else {
      // === LOGIC KHO HN hoặc kho khác (WinForm lines 1856-1865) ===

      // Lấy mapping ProductGroupWarehouse cho kho hiện tại
      this.productSaleService
        .getdataProductGroupWareHouse(khoTypeId, warehouseId)
        .subscribe({
          next: (res: any) => {
            const userId = res?.data?.[0]?.UserID || 0;
            // Set Người nhận từ mapping (line 1863)
            this.validateForm.controls['ReciverID'].setValue(userId);
          },
          error: () => {
            this.validateForm.controls['ReciverID'].setValue(0);
          }
        });

      // Người giao đã được set = Global.UserID ở ngOnInit (line 245)
      // Không cần set lại ở đây
    }
  }
  getBillImportByID() {
    this.billImportService.getBillImportByID(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillImport = {
            Id: data.ID,
            BillImportCode: data.BillImportCode,
            Reciver: data.Reciver,
            Deliver: data.Deliver,
            KhoType: data.KhoType,
            Supplier: data.Suplier,
            ReciverID: data.ReciverID,
            DeliverID: data.DeliverID,
            KhoTypeID: data.KhoTypeID,
            WarehouseID: data.WarehouseID,
            BillTypeNew: data.BillTypeNew,
            SupplierID: data.SupplierID,
            CreatDate: data.CreatDate ? new Date(data.CreatDate) : null,
            DateRequest: data.RequestDate ? new Date(data.RequestDate) : null,
            RulePayID: data.RulePayID,
          };
// Lưu giá trị ban đầu của BillTypeNew
        this.initialBillTypeNew = data.BillTypeNew;

        // SỬA: Patch mà không trigger valueChanges
        this.validateForm.patchValue(this.newBillImport, { emitEvent: false });

        // THÊM: Set flag sau patch
        this.isInitialLoad = false;
          // this.validateForm.patchValue(this.newBillImport); // Đồng bộ dữ liệu vào form
          this.changeProductGroup(this.newBillImport.KhoTypeID);
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể lấy thông tin phiếu nhập!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin!');
        console.error(err);
      }
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
            if (this.table_billImportDetail) {
              this.table_billImportDetail.redraw(true); // Làm mới bảng để hiển thị sản phẩm mới
            }
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi lấy thông tin sản phẩm!');
      }
    });
  }
  getBillImportDetailID() {
    this.billImportService.getBillImportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.billID = rawData[0].BillID;
          console.log("datatable", rawData);
          this.dataTableBillImportDetail = rawData.map((item: any) => {
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
              DPO: item.DPO || 0,
              DueDate: item.DueDate ? new Date(item.DueDate) : new Date(),
              TaxReduction: item.TaxReduction || 0,
              COFormE: item.COFormE || 0,
              IsNotKeep: item.IsNotKeep || false,
              POKHDetailQuantity: item.POKHDetailQuantity || 0,
              ProjectIDKeep: item.ProjectIDKeep || 0,
            };
          });

          if (this.table_billImportDetail) {
            this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
            setTimeout(() => {
              this.table_billImportDetail.redraw(true);
            }, 100);
          }
        } else {
          this.notification.warning('Thông báo', res.message || 'Không có dữ liệu chi tiết phiếu xuất!');
          this.dataTableBillImportDetail = [];
          if (this.table_billImportDetail) {
            this.table_billImportDetail.replaceData([]);
          }
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu xuất!');
        console.error(err);
        this.dataTableBillImportDetail = [];
        if (this.table_billImportDetail) {
          this.table_billImportDetail.replaceData([]);
        }
      }
    });
  }
  loadDocumentImport() {
    this.billImportService.getDocumentImport(0, this.id).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.dataTableDocumnetImport = res.data;
          if (this.table_DocumnetImport) {
            this.table_DocumnetImport.replaceData(this.dataTableDocumnetImport);
          } else {
            console.log('>>> Bảng chưa tồn tại, dữ liệu sẽ được load khi drawTable() được gọi');
          }
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu documentImport');
      }
    });
  }
  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });

  }
  getDataCbbRulePay() {
    this.billImportService.getDataRulePay().subscribe({
      next: (res: any) => {
        this.dataCbbRulePay = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbUser() {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbReciver = res.data;
        this.dataCbbDeliver = this.dataCbbReciver;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbSupplierSale() {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getNewCode() {
    this.billImportService.getNewCode(this.newBillImport.BillTypeNew).subscribe({
      next: (res: any) => {
        console.log('New code received:', res.data);
        this.newBillImport.BillImportCode = res.data;
        this.validateForm.patchValue({ BillImportCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi mã phiếu');
      }
    });
  }
  loadOptionProject() {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        console.log("pj", res.data);
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectOptions = projectData.filter(project => project.ID !== null && project.ID !== undefined && project.ID !== 0)
            .map(project => { // <-- SỬA Ở ĐÂY
              return {
                label: project.ProjectName,
                value: project.ID,
                ProjectCode: project.ProjectCode,
              };
            });
        } else {
          this.projectOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy danh sách dự án');
        this.projectOptions = [];
      }

    })
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
      keyboard: false
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
  private mapTableDataToBillImportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      return {
        ID: row.ID || 0,
        BillImportID: row.BillImportID || 0,
        ProductID: row.ProductID || 0,
        Qty: row.Qty || 0,
        Price: row.Price || 1,
        TotalPrice: row.Qty * row.Price,
        ProjectName: row.ProjectName || "",
        ProjectCode: row.ProjectCode || "",
        SomeBill: row.SomeBill || "",
        Note: row.Note || "",
        STT: row.STT || index + 1,
        TotalQty: row.TotalQty,
        CreatedDate: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : new Date().toISOString(),
        UpdatedDate: new Date().toISOString(),
        ProjectID: row.ProjectID || 0,
        PONCCDetailID: row.PONCCDetailID || 0,
        SerialNumber: row.SerialNumber || "",
        CodeMaPhieuMuon: row.CodeMaPhieuMuon || "",
        BillExportDetailID: row.BillExportDetailID || null,
        ProjectPartListID: row.ProjectPartListID || 0,
        IsKeepProject: row.IsKeepProject || false,
        QtyRequest: row.QtyRequest,
        BillCodePO: row.BillCodePO || "",
        ReturnedStatus: row.ReturnedStatus || false,
        InventoryProjectID: row.InventoryProjectID || 0,
        DateSomeBill: row.DateSomeBill ? new Date(row.DateSomeBill).toISOString() : null,
        isDeleted: row.isDeleted || false,
        DPO: row.DPO || 0,
        DueDate: row.DueDate ? new Date(row.DueDate).toISOString() : new Date().toISOString(),
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
        IsNotKeep: row.IsNotKeep || false,
        Unit: row.Unit || "PCS",
        CreatedBy: "system",
        UpdatedBy: "system",
      };
    });
  }
  saveDataBillImport() {
    console.log('saveDataBillImport called');

    if (!this.validateForm.valid) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!');
      this.validateForm.markAllAsTouched(); // Đánh dấu tất cả control là touched
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const billImportDetailsFromTable = this.table_billImportDetail?.getData();
    if (!billImportDetailsFromTable || billImportDetailsFromTable.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng thêm ít nhất một sản phẩm vào bảng!');
      return;
    }

    const formValues = this.validateForm.getRawValue();

    const payload = {
      billImport: {
        ID: this.newBillImport.Id || 0,
        BillImportCode: formValues.BillImportCode,
        BillType: false,
        Reciver: this.dataCbbReciver.find(item => item.ID === formValues.ReciverID)?.FullName || '',
        Deliver: this.dataCbbDeliver.find(item => item.ID === formValues.DeliverID)?.FullName || '',
        KhoType: this.dataCbbProductGroup.find(item => item.ID === formValues.KhoTypeID)?.ProductGroupName || '',
        GroupID: String(formValues.KhoTypeID || ''),
        Suplier: this.dataCbbSupplier.find(item => item.ID === formValues.SupplierID)?.NameNCC || '',
        SupplierID: formValues.SupplierID,
        ReciverID: formValues.ReciverID,
        DeliverID: formValues.DeliverID,
        KhoTypeID: formValues.KhoTypeID,
        WarehouseID: formValues.WarehouseID || this.newBillImport.WarehouseID,
        CreatDate: formValues.CreatDate,
        DateRequestImport: formValues.DateRequest,
        UpdatedDate: new Date(),
        BillTypeNew: formValues.BillTypeNew,
        BillDocumentImportType: 2,
        CreatedDate: formValues.CreatDate,
        Status: false,
        PTNB: false,
        UnApprove: 1,
        RulePayID: formValues.RulePayID,
        IsDeleted: false,
        CreatedBy: 'system',
        UpdatedBy: 'system',
        DPO: formValues.DPO || 0,
        DueDate: formValues.DueDate ? new Date(formValues.DueDate).toISOString() : new Date().toISOString(),
        TaxReduction: formValues.TaxReduction || 0,
        COFormE: formValues.COFormE || 0,
        IsNotKeep: formValues.IsNotKeep || false,
      },
      billImportDetail: this.mapTableDataToBillImportDetails(billImportDetailsFromTable),
      DeletedDetailIds: this.deletedDetailIds || [],
    };

    console.log('Payload before sending:', JSON.stringify(payload, null, 2));
    this.billImportService.saveBillImport(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning('Thông báo', res.message || (this.isCheckmode ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!'));
        }
      },
      error: (err: any) => {
        console.error('Save error:', err);
        let errorMessage = 'Có lỗi xảy ra khi ' + (this.isCheckmode ? 'cập nhật!' : 'thêm mới!');
        if (err.error && err.error.message) {
          errorMessage += ' Chi tiết: ' + err.error.message;
        }
        this.notification.error('Thông báo', errorMessage);
      }
    });
  }

  openModalBillExportDetail(ischeckmode: boolean) {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất để sửa');
      this.id = 0;
      return
    }
    console.log('is', this.isCheckmode);
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.id = 0;
          // this.loadDataBillExport();
        }
      },
    );
  }

  addRow() {
    if (this.table_billImportDetail) {
      this.table_billImportDetail.addRow({
        // ID: 0,
        ProductNewCode: '',
        ProductCode: null, // cần là null để select hoạt động
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
        IsNotKeep: false,
        SerialNumber: '',
        DPO: 0,
        TaxReduction: 0,
        COFormE: 0,
        ProjectID: 0,

      });
    }
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    // Thêm tham số config để nhận cấu hình
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

      // Truyền các cấu hình vào instance của component
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

  onTabChange(index: number): void {
    console.log('Tab changed to:', index);
    this.isLoading = true;

    switch (index) {
      case 0:
        if (!this.table_billImportDetail) {
          this.drawTable();
        } else {
          this.isLoading = false;
        }
        break;
      case 1:
        if (!this.table_DocumnetImport) {
          // ví dụ nếu sau có bảng hồ sơ
          this.drawDocumentTable();
        } else {
          this.isLoading = false;
        }
        break;
    }
  }
  changeProductGroup(ID: number) {
    if (!ID) {
      this.productOptions = [];
      if (this.table_billImportDetail) {
        this.table_billImportDetail.replaceData([]);
      }
      return;
    }
    this.billImportService.getProductOption(1, ID).subscribe({
      next: (res: any) => {
        const productData = res.data;
        console.log('productData:', productData); // Log để kiểm tra
        if (Array.isArray(productData)) {
          this.productOptions = productData
            .filter(product => product.ID > 0)
            .map(product => ({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductNewCode: product.ProductNewCode,
            }));
          console.log('productOptions:', this.productOptions); // Log để kiểm tra

          // Redraw the table to update all existing rows with new product options
          if (this.table_billImportDetail) {
            this.table_billImportDetail.redraw(true);
          }
        } else {
          this.productOptions = [];
          this.notification.warning('Thông báo', 'Dữ liệu sản phẩm không hợp lệ!');
        }
        if (this.createImport == true) {
          //this.getBillExportDetailConvert();
        }
        else if (this.isCheckmode) {
          this.getBillImportDetailID();
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi tải danh sách sản phẩm!');
        this.productOptions = [];
      }
    });
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
    modalRef.componentInstance.type = 1;

    modalRef.result.then(
      (serials: { ID: number; Serial: string }[]) => {
        console.log('Serials returned:', serials);
        if (Array.isArray(serials) && serials.length > 0) {
          const serialsID = serials.map(s => s.ID).join(',');
          row.update({ SerialNumber: serialsID });
          this.notification.success('Thông báo', 'Cập nhật serial thành công!');
        } else {
          this.notification.error('Thông báo', 'Dữ liệu serial không hợp lệ!');
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );

  }
  //vẽ bảng
  drawTable() {
    this.isLoading = true; // Bắt đầu loading
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    } else {
      this.table_billImportDetail = new Tabulator('#table_BillImportDetails', {
        data: this.dataTableBillImportDetail,
        layout: 'fitDataFill',
        height: "38vh",
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: "",
            field: "addRow",
            hozAlign: "center",
            width: 40,
            headerSort: false,
            titleFormatter: () => `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => { this.addRow(); },
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
                    if (rowData['ID']) {
                      this.deletedDetailIds.push(rowData['ID']);
                    }
                    row.delete();
                  }
                });
              }
            }

          },
          { title: "ID", field: "ID", hozAlign: "center", width: 60, headerSort: false, visible: false },
          { title: "STT", field: "STT", formatter: "rownum", hozAlign: "center", width: 60, headerSort: false },
          { title: "Mã nội bộ", field: "ProductCode", hozAlign: "left", headerHozAlign: "center" },
          {
            title: "Mã hàng", field: "ProductID", hozAlign: "left", headerHozAlign: "center", width: 450,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.productOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                // Hiển thị placeholder nếu chưa có giá trị
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const product = this.productOptions.find((p: any) => p.value === val);
              const productcode = product ? product.ProductCode : '';
              const productnewcode = product ? product.ProductNewCode : '';
              console.log('productnewcode',productnewcode);

              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productnewcode} - ${productcode}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              // Giá trị này có thể là toàn bộ đối tượng sản phẩm hoặc chỉ là ID
              const selectedValue = cell.getValue();

              let selectedProduct;

              // Kiểm tra xem editor có trả về toàn bộ đối tượng không
              if (typeof selectedValue === 'object' && selectedValue !== null) {
                selectedProduct = selectedValue;
              } else {
                // Phương án dự phòng: nếu chỉ là ID, tìm đối tượng đầy đủ
                selectedProduct = this.productOptions.find((p: any) => p.value === selectedValue);
              }

              // Nếu tìm thấy thông tin sản phẩm, cập nhật toàn bộ hàng
              if (selectedProduct) {
                row.update({
                  // SỬA LỖI QUAN TRỌNG: Đảm bảo ProductID là giá trị số, không phải đối tượng.
                  ProductID: selectedProduct.value,

                  // Cập nhật tất cả các trường liên quan khác
                  ProductCode: selectedProduct.ProductCode,
                  ProductNewCode: selectedProduct.ProductNewCode,
                  Unit: selectedProduct.Unit || '',
                  ProductName: selectedProduct.ProductName,
                });
              }
            },
          },
          { title: "Tên sản phẩm", field: "ProductName", hozAlign: "left", headerHozAlign: "center", editor: 'input' },

          { title: "ĐVT", field: "Unit", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Mã theo dự án", field: "ProjectPartListID", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "SL yêu cầu", field: "QtyRequest", hozAlign: "right", headerHozAlign: "center", editor: 'number' },
          { title: "SL thực tế", field: "Qty", hozAlign: "right", headerHozAlign: "center", editor: 'number' },
          {title:"Không giữ", field:"IsNotKeep", hozAlign: "center", headerHozAlign: "center", editor: 'tickCross'},
          {
            title: "Mã dự án/Công ty", field: "ProjectID", hozAlign: "left", headerHozAlign: "center", width: 200,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.projectOptions,
              // Cung cấp thêm đối tượng cấu hình
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            // SỬ DỤNG FORMATTER MỚI ĐỂ HIỂN THỊ ĐẸP HƠN
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                // Hiển thị placeholder nếu chưa có giá trị
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              // Tìm label tương ứng với value để hiển thị
              const project = this.projectOptions.find((p: any) => p.value === val);
              const ProjectCode = project ? project.ProjectCode : val;

              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${ProjectCode}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              // cell là component của ô vừa được chỉnh sửa
              const row = cell.getRow();
              const newValue = cell.getValue(); // ID của sản phẩm mới

              // 1. Tìm thông tin đầy đủ của sản phẩm vừa được chọn
              const selectedProject = this.projectOptions.find((p: any) => p.value === newValue);

              // 2. Nếu tìm thấy sản phẩm, cập nhật các ô khác trên cùng một dòng
              if (selectedProject) {
                row.update({
                  'ProjectCodeExport': selectedProject.ProjectCode,
                  'ProjectName': selectedProject.ProjectName,
                  InventoryProjectIDs: [newValue]
                });
              }
            }
          },
          {
            title:"Tên dự án/Công ty", field:"ProjectName", hozAlign: "left", headerHozAlign: "center",
          },
          { title: "Khách hàng", field: "Customer", hozAlign: "left", headerHozAlign: "center", editor: 'input' }, // Giả định có thêm trường Customer
          { title: "Đơn mua hàng", field: "BillCodePO", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Ghi chú (PO)", field: "Note", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Số hóa đơn", field: "SomeBill", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Ngày hóa đơn", field: "DateSomeBill", hozAlign: "left", headerHozAlign: "center", formatter: "datetime", editor: 'input' },
          {title:"Số ngày công nợ", field:"DPO", hozAlign: "right", headerHozAlign: "center", editor: 'number'},
          {title:"Ngày tới hạn", field:"DueDate", hozAlign: "left", headerHozAlign: "center", formatter: "datetime", editor: 'input'},
          {title:"Tiền thuế giảm", field:"TaxReduction", hozAlign: "right", headerHozAlign: "center", editor: 'number'},
          {title:"Chi phí FE", field:"COFormE", hozAlign: "right", headerHozAlign: "center", editor: 'number'},
          { title: "Phiếu mượn", field: "CodeMaPhieuMuon", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Serial Number", field: "SerialNumber", hozAlign: "left", headerHozAlign: "center", visible: false },
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
              const type = 1; // dành cho phiếu nhập

              if (quantity <= 0) {
                this.notification.warning('Cảnh báo', 'Vui lòng nhập số lượng xuất lớn hơn 0 trước khi chọn Serial!');
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
                  next: (res:any) => {
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
                  error: (err:any) => {
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
        ]
      });
      this.isLoading = false; // Kết thúc loading
    }
  }
  drawDocumentTable() {
    this.isLoading = true;

    setTimeout(() => {
      this.table_DocumnetImport = new Tabulator('#table_DocumnetImport', {
        data: this.dataTableDocumnetImport, // mảng chứa dữ liệu JSON
        layout: 'fitDataFill',
        height: "38vh",
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,

        columns: [
          { title: "Mã chứng từ", field: "DocumentImportCode", headerHozAlign: "center", hozAlign: "left" },
          { title: "Tên chứng từ", field: "DocumentImportName", headerHozAlign: "center", hozAlign: "left" },
          { title: "Trạng thái", field: "StatusText", headerHozAlign: "center", hozAlign: "left" },
          {
            title: "Ngày nhận / hủy nhận",
            field: "DateRecive",
            headerHozAlign: "center",
            hozAlign: "center",
            formatter: "datetime",
            formatterParams: {
              inputFormat: "iso",
              outputFormat: "dd/MM/yyyy HH:mm"
            }
          },
          { title: "Người nhận / Hủy", field: "FullNameRecive", headerHozAlign: "center", hozAlign: "left" },
          { title: "Lý do huỷ", field: "ReasonCancel", headerHozAlign: "center", hozAlign: "left" },
          { title: "Ghi chú", field: "Note", headerHozAlign: "center", hozAlign: "left" },
        ]
      });

      this.isLoading = false;
    }, 300);
  }


}
