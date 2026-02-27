import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';

import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Editors,
  OnClickEventArgs,
} from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  MultipleSelectOption,
  OperatorType,
  AutocompleterOption,
} from '@slickgrid-universal/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillExportService } from '../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../ProductSale/product-sale-service/product-sale-service.service';
import { BillImportServiceService } from '../../BillImport/bill-import-service/bill-import-service.service';
import { PermissionService } from '../../../../../services/permission.service';
import { ProductSaleDetailComponent } from '../../ProductSale/product-sale-detail/product-sale-detail.component';
import { BillImportDetailComponent } from '../../BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { ClipboardService } from '../../../../../services/clipboard.service';
import { BillImportChoseSerialComponent } from '../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { AppUserService } from '../../../../../services/app-user.service';
import { BillImportDetailNewComponent } from '../../BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';

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
  IsApproved?: boolean;
  IsTransfer: boolean;
}

@Component({
  selector: 'app-bill-export-detail-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzModalModule,
    NzCheckboxModule,
    NzSpinModule,
    HasPermissionDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-export-detail-new.component.html',
  styleUrls: ['./bill-export-detail-new.component.css'],
})
export class BillExportDetailNewComponent
  implements OnInit, AfterViewInit, OnDestroy {
  //#region Khai bao
  isLoading: boolean = false;
  isSaving: boolean = false;
  isFormDisabled: boolean = false;

  // Unique grid ID for this component instance
  gridUniqueId: string = `billExportDetail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  dataCbbUser: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];
  dataCbbWareHouseTransfer: any[] = [];
  referenceLinks: any[] = [];

  productOptions: any[] = [];
  projectOptions: any[] = [];
  deletedDetailIds: any[] = [];

  @Input() IDDetail: number = 0;
  @Input() checkConvert: any;
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;
  @Input() lstBillImportID: number[] = [];
  @Input() billImport: any;
  @Input() isAddExport: boolean = false;
  @Input() wareHouseCode: string = 'HN';
  @Input() isPOKH: boolean = false;
  @Input() customerID: number = 0;
  @Input() KhoTypeID: number = 0;
  @Input() saleAdminID: number = 0;
  @Input() supplierId: number = 0;
  @Input() warehouseTypeId: number = 0;
  @Input() lstTonCk: any[] = [];
  @Input() isBorrow: boolean = false;
  @Input() isFromProjectPartList: boolean = false;
  @Input() isFromWarehouseRelease: boolean = false;
  @Input() isReturnToSupplier: boolean = false;

  cbbStatus: any = [
    { ID: 0, Name: 'Mượn' },
    { ID: 1, Name: 'Tồn Kho' },
    { ID: 2, Name: 'Đã Xuất Kho' },
    { ID: 5, Name: 'Xuất trả NCC' },
    { ID: 6, Name: 'Yêu cầu xuất kho' },
    { ID: 7, Name: 'Yêu cầu mượn' },
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
    IsTransfer: false,
  };

  @Input() dataTableBillExportDetail: any[] = [];

  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  // SlickGrid
  angularGridDetail!: AngularGridInstance;
  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  dataDetail: any[] = [];

  // Cache for product/project grid collections
  productGridCollection: any[] = [];
  projectGridCollection: any[] = [];

  private isLoadingEditData: boolean = false;
  private hasBillExportDetailLoaded: boolean = false;
  private productAvailableInventoryMap: Map<number, number> = new Map();
  // private productInventoryDetailMap: Map<number, {
  //   keepByProject: Map<number, number>;
  //   generalStock: number;
  // }> = new Map();
  // ✅ Key = "ProductID-ProjectID-POKHDetailID"
  private productInventoryDetailMap: Map<string, {
    totalQuantityKeep: number;      // SL giữ
    totalQuantityRemain: number;    // SL còn lại (Import - Export)
    totalQuantityLast: number;      // Tồn CK
  }> = new Map();
  private originalInventoryRelatedData: Map<number, any> = new Map();
  private hasInventoryRelatedChange: boolean = false;

  // Error popup
  showErrorPopup: boolean = false;
  errorMessage: string = '';

  //#endregion

  constructor(
    private fb: NonNullableFormBuilder,
    private modal: NzModalService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private billExportService: BillExportService,
    private billImportService: BillImportServiceService,
    private productSaleService: ProductsaleServiceService,
    private permissionService: PermissionService,
    private clipboardService: ClipboardService,
    private appUserService: AppUserService
  ) {
    this.validateForm = this.fb.group({
      Code: [{ value: '', disabled: true }],
      UserID: [{ value: 0 }, [Validators.required, Validators.min(1)]],
      SenderID: [{ value: 0 }, [Validators.required, Validators.min(1)]],
      CustomerID: [0, [Validators.required, Validators.min(1)]],
      Address: [{ value: '', disabled: true }],
      AddressStockID: [0],
      KhoTypeID: [0, [Validators.required, Validators.min(1)]],
      Status: [0, [Validators.required]],
      ProductType: [0],
      CreatDate: [new Date(), [Validators.required]],
      RequestDate: [new Date()],
      SupplierID: [0],
      IsTransfer: [false],
      Reference: [''],
      WareHouseTranferID: [null],
    });

    // Setup initial date validators based on default status
    this.updateDateValidators(0);
  }

  //#region Lifecycle hooks
  ngOnInit(): void {
    const trimmed = (this.wareHouseCode || '').trim();
    if (trimmed && trimmed !== '') {
      this.wareHouseCode = trimmed;
    } else {
      this.wareHouseCode = 'HN';
    }

    this.initGridColumns();
    this.initGridOptions();

    this.getWarehouseID();
    this.getDataCbbAdressStock();
    this.getDataCbbCustomer();
    this.getDataCbbProductGroup();
    this.getDataCbbSender();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
    this.getDataCbbWareHouseTransfer();
    this.loadOptionProject();

    this.setupFormSubscriptions();
    this.initializeFormData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.isFromWarehouseRelease || this.isFromProjectPartList) {
        if (this.productOptions.length > 0) {
          this.updateTotalInventoryForExistingRows();
        }
      }
    }, 1500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Form subscriptions - Đăng ký lắng nghe thay đổi form

  /** Đăng ký các sự kiện thay đổi giá trị trên form */
  private setupFormSubscriptions(): void {
    this.validateForm
      .get('CustomerID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeCustomer();
      });

    this.validateForm
      .get('Status')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onStatusChange(value);
      });

    this.validateForm
      .get('KhoTypeID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((khoTypeID: number) => {
        this.onKhoTypeChange(khoTypeID);
      });

    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.newBillExport = { ...this.newBillExport, ...values };
      });
  }

  /** Khởi tạo dữ liệu form ban đầu (thêm mới hoặc chỉnh sửa) */
  private initializeFormData(): void {
    if (this.isCheckmode) {
      this.getBillExportByID();
    } else if (
      !this.isBorrow &&
      !this.isFromProjectPartList &&
      !this.isFromWarehouseRelease &&
      !this.isReturnToSupplier
    ) {
      // Lấy employeeID từ người đăng nhập hiện tại cho Người Nhận
      const currentEmployeeId = this.appUserService.id || 0;

      this.newBillExport = {
        TypeBill: false,
        Code: '',
        Address: '',
        CustomerID: 0,
        UserID: currentEmployeeId, // Người Nhận = người đăng nhập hiện tại
        SenderID: 0, // Người Giao = sẽ lấy từ ProductGroupWarehouse
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
        IsTransfer: false,
      };
      this.validateForm.patchValue(this.newBillExport);
    }

    if (this.lstBillImportID && this.lstBillImportID.length > 0) {
      setTimeout(() => {
        this.getBillExportDetailConvert(this.lstBillImportID);
        this.validateForm.patchValue({
          KhoTypeID: this.billImport.KhoTypeID,
          //UserID: this.billImport.ReciverID,
          UserID: this.id > 0 ? this.billImport.ReciverID : this.appUserService.id,
          WarehouseID: this.billImport.WarehouseID,
          SenderID: this.billImport.DeliverID,
          SupplierID: this.billImport.SupplierID,
          Status: 2,
        });
        this.changeProductGroup(this.newBillExport.KhoTypeID);
        this.getNewCode();
      }, 500);
    } else if (
      !this.isBorrow &&
      !this.isFromProjectPartList &&
      !this.isFromWarehouseRelease &&
      !this.isReturnToSupplier
    ) {
      this.getBillExportDetailID();
    }

    if (
      !this.isCheckmode &&
      (!this.newBillExport.Id || this.newBillExport.Id <= 0) &&
      !this.isBorrow &&
      !this.isFromWarehouseRelease &&
      !this.isFromProjectPartList
    ) {
      this.validateForm.patchValue({ Status: 2 });
      this.newBillExport.Status = 2;
      this.getNewCode();
    }

    this.handleSpecialFlows();
  }

  /** Xử lý các luồng đặc biệt: dự án, xuất kho, trả NCC, mượn */
  private handleSpecialFlows(): void {
    if (this.isFromProjectPartList) {
      this.handleProjectPartListFlow();
    } else if (this.isFromWarehouseRelease) {
      this.handleWarehouseReleaseFlow();
    } else if (this.KhoTypeID > 0 && !this.isBorrow) {
      this.validateForm.patchValue({
        Status: 6,
        KhoTypeID: this.KhoTypeID,
        CustomerID: this.customerID,
      });
      this.newBillExport.Status = 6;
      this.newBillExport.KhoTypeID = this.KhoTypeID;
      if (this.saleAdminID > 0) {
        this.validateForm.patchValue({ UserID: this.saleAdminID });
      }
    }

    if (
      this.isPOKH &&
      !this.isFromProjectPartList &&
      !this.isFromWarehouseRelease
    ) {
      this.validateForm.patchValue({ Status: 6 });
      this.newBillExport.Status = 6;
    }

    if (this.isReturnToSupplier) {
      this.handleReturnToSupplierFlow();
    } else if (this.isBorrow) {
      this.handleBorrowFlow();
    }

    if (this.isAddExport) {
      this.handleAddExportFlow();
    }
  }

  /** Luồng tạo phiếu xuất từ danh sách vật tư dự án */
  private handleProjectPartListFlow(): void {
    console.log('🟢 [handleProjectPartListFlow] START');
    console.log('🟢 [handleProjectPartListFlow] selectedList:', this.selectedList);
    console.log('🟢 [handleProjectPartListFlow] newBillExport:', this.newBillExport);

    this.validateForm.patchValue({
      Code: this.newBillExport.Code || '',
      Address: this.newBillExport.Address || '',
      CustomerID: this.newBillExport.CustomerID || 0,
      UserID: this.newBillExport.UserID || 0,
      SenderID: this.newBillExport.SenderID || 0,
      KhoTypeID: this.newBillExport.KhoTypeID || 0,
      ProductType: this.newBillExport.ProductType || 0,
      Status: this.newBillExport.Status || 6,
      SupplierID: this.newBillExport.SupplierID || 0,
      RequestDate: this.newBillExport.RequestDate || new Date(),
      CreatDate: this.newBillExport.CreatDate || new Date(),
      WarehouseID: this.newBillExport.WarehouseID || 0,
      IsTransfer: this.newBillExport.IsTransfer || false,
    });
    this.newBillExport.Status = this.newBillExport.Status || 6;

    // Bind selectedList vào dataDetail
    if (this.selectedList && this.selectedList.length > 0) {
      this.dataDetail = this.selectedList.map((item: any, index: number) => ({
        ID: -(index + 1),
        POKHDetailID: item.POKHDetailID || 0,
        ProductID: item.ProductSaleID || item.ProductID || 0,
        ProductNewCode: item.ProductNewCode || '',
        ProductCode: item.ProductCode || '',
        ProductName: item.ProductName || '',
        Unit: item.Unit || '',
        TotalInventory: item.TotalInventory || 0,
        Qty: item.Qty || 0,
        QuantityRemain: item.QuantityRemain || 0,
        ProjectID: item.ProjectID || 0,
        ProjectCodeExport: item.ProjectCodeExport || item.ProjectCode || '',
        ProjectNameText: item.ProjectNameText || item.ProjectName || '',
        Note: item.Note || '',
        ExpectReturnDate: item.ExpectReturnDate
          ? new Date(item.ExpectReturnDate)
          : new Date(),
        UnitPricePOKH: item.UnitPricePOKH || 0,
        UnitPricePurchase: item.UnitPricePurchase || 0,
        BillCode: item.BillCode || '',
        Specifications: item.Specifications || '',
        GroupExport: item.GroupExport || '',
        UserReceiver: item.UserReceiver || '',
        CustomerResponse: item.CustomerResponse || '',
        SerialNumber: item.SerialNumber || '',
        POKHID: item.POKHID || 0,
        ProductFullName: item.ProductFullName || '',
        ProductType: item.ProductType || 0,
        IsInvoice: item.IsInvoice || false,
        InvoiceNumber: item.InvoiceNumber || '',
        ReturnedStatus: item.ReturnedStatus || false,
        ProjectPartListID: item.ProjectPartListID || 0,
        TradePriceDetailID: item.TradePriceDetailID || 0,
        BillImportDetailID: item.BillImportDetailID || 0,
        POKHDetailIDActual: item.POKHDetailIDActual || 0,
        PONumber: item.PONumber || '',
      }));
      console.log('🟢 [handleProjectPartListFlow] dataDetail after mapping:', this.dataDetail);
    }

    if (this.newBillExport.KhoTypeID > 0) {
      console.log('🟢 [handleProjectPartListFlow] Calling changeProductGroup with KhoTypeID:', this.newBillExport.KhoTypeID);
      this.changeProductGroup(this.newBillExport.KhoTypeID);
      // Refresh grid sau khi productOptions được load
      setTimeout(() => {
        console.log('🟢 [handleProjectPartListFlow] Refreshing grid after timeout, dataDetail:', this.dataDetail);
        this.refreshGrid();
        this.updateTotalInventoryForExistingRows();
      }, 500);
    }
    console.log('🟢 [handleProjectPartListFlow] END');
  }

  /** Luồng tạo phiếu xuất từ yêu cầu xuất kho */
  private handleWarehouseReleaseFlow(): void {
    console.log('🔵 [handleWarehouseReleaseFlow] START');
    console.log('🔵 [handleWarehouseReleaseFlow] selectedList:', this.selectedList);
    console.log('🔵 [handleWarehouseReleaseFlow] newBillExport:', this.newBillExport);

    this.validateForm.patchValue({
      Code: this.newBillExport.Code || '',
      Address: this.newBillExport.Address || '',
      CustomerID: this.newBillExport.CustomerID || 0,
      UserID: this.newBillExport.UserID || 0,
      SenderID: this.newBillExport.SenderID || 0,
      KhoTypeID: this.newBillExport.KhoTypeID || 0,
      ProductType: this.newBillExport.ProductType || 1,
      Status: this.newBillExport.Status || 6,
      SupplierID: this.newBillExport.SupplierID || 0,
      RequestDate: this.newBillExport.RequestDate || new Date(),
      CreatDate: this.newBillExport.CreatDate || new Date(),
      WarehouseID: this.newBillExport.WarehouseID || 0,
      IsTransfer: this.newBillExport.IsTransfer || false,
    });
    this.newBillExport.Status = this.newBillExport.Status || 6;

    if (!this.newBillExport.Code || this.newBillExport.Code === '') {
      this.getNewCode();
    }

    // Bind selectedList vào dataDetail
    if (this.selectedList && this.selectedList.length > 0) {
      this.dataDetail = this.selectedList.map((item: any, index: number) => ({
        ID: -(index + 1),
        POKHDetailID: item.POKHDetailID || 0,
        ProductID: item.ProductSaleID || item.ProductID || 0,
        ProductNewCode: item.ProductNewCode || '',
        ProductCode: item.ProductCode || '',
        ProductName: item.ProductName || '',
        Unit: item.Unit || '',
        TotalInventory: item.TotalInventory || 0,
        Qty: item.Qty || 0,
        QuantityRemain: item.QuantityRemain || 0,
        ProjectID: item.ProjectID || 0,
        ProjectCodeExport: item.ProjectCodeExport || '',
        ProjectNameText: item.ProjectNameText || item.ProjectName || '',
        Note: item.Note || '',
        ProjectCode: item.ProjectCode || '',
        ExpectReturnDate: item.ExpectReturnDate
          ? new Date(item.ExpectReturnDate)
          : new Date(),
        UnitPricePOKH: item.UnitPricePOKH || 0,
        UnitPricePurchase: item.UnitPricePurchase || 0,
        BillCode: item.BillCode || '',
        Specifications: item.Specifications || '',
        GroupExport: item.GroupExport || '',
        UserReceiver: item.UserReceiver || '',
        CustomerResponse: item.CustomerResponse || '',
        SerialNumber: item.SerialNumber || '',
        POKHID: item.POKHID || 0,
        ProductFullName: item.ProductFullName || '',
        ProductType: item.ProductType || 0,
        IsInvoice: item.IsInvoice || false,
        InvoiceNumber: item.InvoiceNumber || '',
        ReturnedStatus: item.ReturnedStatus || false,
        ProjectPartListID: item.ProjectPartListID || 0,
        TradePriceDetailID: item.TradePriceDetailID || 0,
        BillImportDetailID: item.BillImportDetailID || 0,
        POKHDetailIDActual: item.POKHDetailIDActual || 0,
        PONumber: item.PONumber || '',
      }));
      console.log('🔵 [handleWarehouseReleaseFlow] dataDetail after mapping:', this.dataDetail);
    }

    if (this.newBillExport.KhoTypeID > 0) {
      console.log('🔵 [handleWarehouseReleaseFlow] Calling changeProductGroup with KhoTypeID:', this.newBillExport.KhoTypeID);
      this.changeProductGroup(this.newBillExport.KhoTypeID);
      // Refresh grid sau khi productOptions được load
      setTimeout(() => {
        console.log('🔵 [handleWarehouseReleaseFlow] Refreshing grid after timeout, dataDetail:', this.dataDetail);
        this.refreshGrid();
        this.updateTotalInventoryForExistingRows();
      }, 500);
    }
    console.log('🔵 [handleWarehouseReleaseFlow] END');
  }

  /** Luồng tạo phiếu xuất trả nhà cung cấp */
  private handleReturnToSupplierFlow(): void {
    this.validateForm.patchValue({
      Code: this.newBillExport.Code || '',
      Status: 5,
      SupplierID: this.newBillExport.SupplierID || 0,
      KhoTypeID: this.newBillExport.KhoTypeID || 0,
      WarehouseID: this.newBillExport.WarehouseID || 0,
      ProductType: 1,
      RequestDate: this.newBillExport.RequestDate || new Date(),
      CreatDate: this.newBillExport.CreatDate || new Date(),
    });
    this.newBillExport.Status = 5;
    this.getNewCode();

    if (this.selectedList && this.selectedList.length > 0) {
      this.dataDetail = this.selectedList.map((item: any, index: number) => ({
        ID: -(index + 1),
        ProductID: item.ProductID || 0,
        ProductNewCode: item.ProductNewCode || '',
        ProductCode: item.ProductCode || '',
        ProductName: item.ProductName || '',
        Unit: item.Unit || '',
        TotalInventory: item.TotalInventory || 0,
        Qty: item.Qty || 0,
        QuantityRemain: 0,
        Note: item.Note || '',
        SerialNumber: item.SerialNumber || '',
        BillImportDetailID: item.BillImportDetailID || 0,
      }));
      this.refreshGrid();
    }
  }

  /** Luồng tạo phiếu mượn hàng */
  private handleBorrowFlow(): void {
    this.newBillExport.Status = 7;
    this.newBillExport.KhoTypeID = this.KhoTypeID;

    this.validateForm.patchValue({
      Status: 7,
      KhoTypeID: this.KhoTypeID,
      RequestDate: new Date(),
    });

    this.getNewCode();

    if (this.selectedList && this.selectedList.length > 0) {
      this.dataDetail = this.selectedList.map((item: any, index: number) => ({
        ID: -(index + 1),
        POKHDetailID: item.POKHDetailID || 0,
        ProductID: item.ProductSaleID || item.ProductID || 0,
        ProductNewCode: item.ProductNewCode || '',
        ProductCode: item.ProductCode || '',
        ProductName: item.ProductName || '',
        Unit: item.Unit || '',
        TotalInventory: 0,
        Qty: item.Qty || 0,
        QuantityRemain: 0,
        ProjectID: item.ProjectID || 0,
        ProjectCodeExport: item.ProjectCodeExport || item.ProjectCode || '',
        ProjectNameText: item.ProjectNameText || item.ProjectName || '',
        Note: item.Note || '',
        ExpectReturnDate: item.ExpectReturnDate
          ? new Date(item.ExpectReturnDate)
          : new Date(),
        POKHID: item.POKHID || 0,
        SerialNumber: item.SerialNumber || '',
      }));

      if (this.KhoTypeID > 0) {
        this.changeProductGroup(this.KhoTypeID);
        setTimeout(() => {
          this.refreshGrid();
          this.updateTotalInventoryForExistingRows();
        }, 800);
      }
    }
  }

  /** Luồng thêm phiếu xuất từ phiếu nhập */
  private handleAddExportFlow(): void {
    if (this.billImport) {
      const defaults: any = {
        SupplierID: this.billImport.SupplierID || 0,
        UserID: this.billImport.ReciverID || 0,
        SenderID: this.billImport.DeliverID || 0,
        KhoTypeID: this.billImport.KhoTypeID || 0,
        WarehouseID: this.billImport.WarehouseID || 0,
        ProductType: 2,
        RequestDate: new Date(),
        Status: this.isPOKH ? 6 : 5,
      };
      this.newBillExport = { ...this.newBillExport, ...defaults };
      this.validateForm.patchValue(defaults);

      if (defaults.KhoTypeID) {
        this.changeProductGroup(defaults.KhoTypeID);
      }
      this.getNewCode();
    }
  }
  //#endregion

  //#region SlickGrid configuration - Cấu hình grid chi tiết phiếu xuất

  /** Khởi tạo tùy chọn grid (kích thước, filter, checkbox, ...) */
  initGridOptions(): void {
    this.gridOptionsDetail = {
      enableGridMenu: true,
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,

      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: false,
      showFooterRow: false,
      forceFitColumns: false,
      frozenColumn: 6,
      enableColumnReorder: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      rowHeight: 60,
      enableCellMenu: true,
      cellMenu: {
        commandItems: [
          {
            command: 'copy',
            title: 'Sao chép (Copy)',
            iconCssClass: 'fa fa-copy',
            positionOrder: 1,
            action: (_e, args) => {
              this.clipboardService.copy(args.value);
            },
          },
        ],
      },
    };
  }

  /** Khởi tạo cấu hình cột cho grid chi tiết phiếu xuất */
  initGridColumns(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'action',
        name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm dòng mới"></i>',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: () => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa dòng"></i></div>`;
        },
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        sortable: true,
        filterable: false,
        formatter: (_row, _cell, _value, _column, dataContext) => {
          const idx =
            this.dataDetail.findIndex((d) => d.ID === dataContext.ID) + 1;
          return `<span style="display:block; text-align:center;">${idx}</span>`;
        },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductID',
        name: 'Mã sản phẩm',
        field: 'ProductID',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _columnDef, dataContext) => {
          if (!value) return '';
          // Chỉ hiển thị ProductCode trong cell, với tooltip đầy đủ
          const productCode = dataContext?.ProductCode || '';
          const productName = dataContext?.ProductName || '';
          if (productCode) {
            const tooltipText = `Mã: ${productCode}\nTên: ${productName}`;
            return `<span title="${tooltipText.replace(/"/g, '&quot;')}">${productCode}</span>`;
          }
          const found = this.productGridCollection.find(
            (x: any) => x.value === Number(value)
          );
          if (found) {
            const tooltipText = `Mã: ${found.ProductCode || ''}\nTên: ${found.ProductName || ''}`;
            return `<span title="${tooltipText.replace(/"/g, '&quot;')}">${found.ProductCode || ''}</span>`;
          }
          return '';
        },
        editor: {
          model: Editors['autocompleter'],
          alwaysSaveOnEnterKey: true,
          editorOptions: {
            minLength: 0,
            forceUserInput: false,
            openSearchListOnFocus: true,
            labelField: 'ProductCode',
            fetch: (searchTerm: string, callback: (items: false | any[]) => void) => {
              const products = this.productGridCollection || [];
              if (!searchTerm || searchTerm.length === 0) {
                callback(products);
              } else {
                const filtered = products.filter((product: any) => {
                  const code = (product.ProductCode || '').toLowerCase();
                  const newCode = (product.ProductNewCode || '').toLowerCase();
                  const name = (product.ProductName || '').toLowerCase();
                  const term = searchTerm.toLowerCase();
                  return code.includes(term) || newCode.includes(term) || name.includes(term);
                });
                callback(filtered);
              }
            },
            renderItem: {
              layout: 'twoRows',
              templateCallback: (item: any) => {
                // Custom template: mã bên trên, tên bên dưới, số lượng tồn bên phải
                const code = item?.ProductCode || '';
                const name = item?.ProductName || '';
                const inventory = item?.TotalInventory ?? 0;
                const formattedInventory = new Intl.NumberFormat('vi-VN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(inventory);
                // Màu đỏ nếu tồn kho < 0, màu xanh nếu >= 0
                const inventoryColor = inventory < 0 ? '#ff4d4f' : '#52c41a';
                // Tooltip hiển thị đầy đủ thông tin
                const tooltipText = `Mã: ${code}\nTên: ${name}\nTồn kho: ${formattedInventory}`;
                return `<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 4px 0; gap: 8px;" title="${tooltipText.replace(/"/g, '&quot;')}">
                  <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #1890ff; word-wrap: break-word; overflow-wrap: break-word;">${code}</div>
                    <div style="font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 4.2em;">${name}</div>
                  </div>
                  <div style="text-align: right; min-width: 70px; flex-shrink: 0; font-weight: 500; color: ${inventoryColor}; padding-top: 2px;">${formattedInventory}</div>
                </div>`;
              },
            },
          } as AutocompleterOption,
        },
      },
      {
        id: 'TotalInventory',
        name: 'SL tồn',
        field: 'TotalInventory',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
      },
      {
        id: 'ProductFullName',
        name: 'Mã sp theo dự án',
        field: 'ProductFullName',
        width: 400,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div title="${String(value).replace(/"/g, '&quot;')}" style="white-space: pre-wrap; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${value}</div>`;
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 400,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div title="${String(value).replace(/"/g, '&quot;')}" style="white-space: pre-wrap; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${value}</div>`;
        },
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Qty',
        name: 'SL xuất',
        field: 'Qty',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 2 },
      },
      {
        id: 'QuantityRemain',
        name: 'SL còn lại',
        field: 'QuantityRemain',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 2 },
      },
      {
        id: 'ProjectID',
        name: 'Dự án',
        field: 'ProjectID',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          const found = this.projectGridCollection.find(
            (x: any) => x.value === Number(value)
          );
          const projectName = found?.ProjectName ?? '';
          if (!projectName) return '';
          return `<div title="${String(projectName).replace(/"/g, '&quot;')}" style="white-space: pre-wrap; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${projectName}</div>`;
        },
        editor: {
          model: Editors['singleSelect'],
          collectionOptions: { addBlankEntry: true },
          collection: this.projectGridCollection,
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,

        },
      },
      {
        id: 'ProjectCodeExport',
        name: 'Mã dự án',
        field: 'ProjectCodeExport',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'] }, // nvarchar(max) - không giới hạn
      },
      {
        id: 'ExpectReturnDate',
        name: 'Ngày dự kiến trả',
        field: 'ExpectReturnDate',
        width: 140,
        sortable: true,
        filterable: true,
        hidden: true, // Mặc định ẩn, chỉ hiển thị khi Status = 0 (Mượn) hoặc Status = 7 (Yêu cầu mượn)
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        editor: { model: Editors['date'] },
      },
      {
        id: 'UnitPricePOKH',
        name: 'Đơn giá bán',
        field: 'UnitPricePOKH',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
      },
      {
        id: 'UnitPricePurchase',
        name: 'Đơn giá mua',
        field: 'UnitPricePurchase',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
      },
      {
        id: 'BillCode',
        name: 'Mã đơn hàng',
        field: 'BillCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Specifications',
        name: 'Thông số kỹ thuật',
        field: 'Specifications',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 550 }, // nvarchar(550)
      },
      {
        id: 'GroupExport',
        name: 'Nhóm',
        field: 'GroupExport',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 350 }, // nvarchar(350)
      },
      {
        id: 'UserReceiver',
        name: 'Người nhận',
        field: 'UserReceiver',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'] }, // Không có trong DB schema, cần kiểm tra
      },
      {
        id: 'CustomerResponse',
        name: 'Phản hồi KH',
        field: 'CustomerResponse',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 550 }, // nvarchar(550)
      },
      {
        id: 'SerialNumber',
        name: 'Serial',
        field: 'SerialNumber',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        hidden: true,
        editor: { model: Editors['text'], maxLength: 50 }, // nvarchar(50)
      },
      {
        id: 'AddSerial',
        name: '<i class="fas fa-plus" style="color:#52c41a;" title=""></i>',
        field: 'AddSerial',
        width: 40,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: () => {
          return `<div style="text-align:center;"><i class="fas fa-plus" style="cursor:pointer; color:#52c41a;" title="Thêm serial"></i></div>`;
        },
      },
      {
        id: 'POKHID',
        name: '<i class="fas fa-download" style="color:#1890ff;" title=""></i>',
        field: 'POKHID',
        width: 40,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: () => {
          return `<div style="text-align:center;"><i class="fas fa-download" style="cursor:pointer; color:#1890ff;" title="Tải File PO"></i></div>`;
        },
      },

      {
        id: 'POKHDetailID',
        name: 'POKHDetailID',
        field: 'POKHDetailID',
        width: 80,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        hidden: true,
      },
    ];
  }

  /** Callback khi grid detail đã sẵn sàng - đăng ký sự kiện click, change */
  angularGridDetailReady(angularGrid: AngularGridInstance): void {
    this.angularGridDetail = angularGrid;

    // Delay để đảm bảo checkbox selector đã được SlickGrid thêm vào
    setTimeout(() => {
      // Hide columns that should not be visible, but preserve checkbox selector
      const hiddenColumnIds = ['SerialNumber', 'POKHDetailID'];
      const visibleColumns = angularGrid.slickGrid.getColumns().filter(
        (col: any) => col.id === '_checkbox_selector' || !hiddenColumnIds.includes(col.id)
      );
      angularGrid.slickGrid.setColumns(visibleColumns);
    }, 0);

    // Subscribe to header click for add row
    angularGrid.slickGrid.onHeaderClick.subscribe((_e: any, args: any) => {
      this.onGridDetailHeaderClick(_e, args);
    });

    // Subscribe to cell click for delete row
    angularGrid.slickGrid.onClick.subscribe((_e: any, args: any) => {
      this.onGridDetailClick(_e, args);
    });

    // Subscribe to cell change for product selection
    angularGrid.slickGrid.onCellChange.subscribe((_e: any, args: any) => {
      this.onCellChange(args);
    });

    // CRITICAL: If dataDetail already has data (from warehouserelease/projectpartlist flows),
    // populate the grid with this data now that the grid is ready

    if (this.dataDetail && this.dataDetail.length > 0) {
      this.angularGridDetail.dataView.setItems(this.dataDetail);
      this.angularGridDetail.slickGrid.invalidate();
      this.angularGridDetail.slickGrid.render();
    }

    // Resize grid after render and update footer
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateDetailFooter();
      // Apply initial column visibility based on current Status
      this.updateColumnVisibility();
    }, 100);
  }

  /** Xử lý click header grid (nút thêm dòng mới) */
  onGridDetailHeaderClick(e: Event, args: any): void {
    if (this.newBillExport.IsApproved) return;

    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;
      if (clickedElement.classList.contains('fa-plus')) {
        this.hasInventoryRelatedChange = true;
        this.addNewRow();
      }
    }
  }

  /** Xử lý click cell (xóa dòng, thêm serial, download PO) */
  onGridDetailClick(e: Event, args: OnClickEventArgs): void {
    const column = args.grid.getColumns()[args.cell];
    const clickedElement = e.target as HTMLElement;

    // Handle delete action (only if not approved)
    if (column.id === 'action' && !this.newBillExport.IsApproved) {
      if (clickedElement.classList.contains('fa-trash')) {
        const item = args.grid.getDataItem(args.row);
        this.modal.confirm({
          nzTitle: 'Thông báo',
          nzContent: `Bạn có chắc chắn muốn xóa dòng này không?`,
          nzOnOk: () => {
            this.deleteRow(item);
          },
        });
      }
    }

    // Handle Add Serial click
    if (column.id === 'AddSerial') {
      if (clickedElement.classList.contains('fa-plus')) {
        const item = args.grid.getDataItem(args.row);
        this.openAddSerialModal(item);
      }
    }

    // Handle POKHID download click
    if (column.id === 'POKHID') {
      if (clickedElement.classList.contains('fa-download')) {
        const item = args.grid.getDataItem(args.row);
        const poNumber = item.PONumber;
        console.log('Download PO clicked, PONumber:', poNumber, 'Data:', item);
        if (poNumber) {
          this.downloadPOFiles(poNumber);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy số PO');
        }
      }
    }
  }

  /** Xử lý thay đổi giá trị cell (chọn sản phẩm, dự án, số lượng) */
  onCellChange(args: any): void {
    const columnDef = this.angularGridDetail.slickGrid.getColumns()[args.cell];

    if (columnDef.field === 'ProductID') {
      // Handle both object (from autocompleter) and number (from other editors)
      const productIdValue = args.item.ProductID;
      let productId: number;
      let selectedProduct: any;

      if (typeof productIdValue === 'object' && productIdValue !== null) {
        // Autocompleter returned the full object
        productId = productIdValue.value || 0;
        selectedProduct = productIdValue;
        // Update the ProductID to just store the value (number)
        args.item.ProductID = productId;
      } else {
        productId = Number(productIdValue) || 0;
        selectedProduct = this.productGridCollection.find(
          (p: any) => p.value === productId
        );
      }

      if (selectedProduct) {
        args.item.ProductCode = selectedProduct.ProductCode || '';
        args.item.ProductNewCode = selectedProduct.ProductNewCode || '';
        args.item.ProductName = selectedProduct.ProductName || '';
        args.item.Unit = selectedProduct.Unit || '';
        args.item.TotalInventory = selectedProduct.TotalInventory || 0;
      } else {
        args.item.ProductCode = '';
        args.item.ProductNewCode = '';
        args.item.ProductName = '';
        args.item.Unit = '';
        args.item.TotalInventory = 0;
      }

      // ✅ Clear inventory allocation when ProductID changes
      args.item.ChosenInventoryProject = '';
      args.item.ProductCodeExport = '';
      this.hasInventoryRelatedChange = true;

      this.angularGridDetail.gridService.updateItem(args.item);
    }

    if (columnDef.field === 'ProjectID') {
      const selectedProject = this.projectGridCollection.find(
        (p: any) => p.value === Number(args.item.ProjectID)
      );

      if (selectedProject) {
        args.item.ProjectCodeExport = selectedProject.ProjectCode || '';
        args.item.ProjectNameText = selectedProject.ProjectName || '';
      } else {
        args.item.ProjectCodeExport = '';
        args.item.ProjectNameText = '';
      }
      this.angularGridDetail.gridService.updateItem(args.item);
    }

    // --- BULK EDIT LOGIC ---
    // Update other selected rows with the same value
    const selectedRows = this.angularGridDetail.slickGrid.getSelectedRows();
    if (selectedRows.length > 1) {
      const field = columnDef.field;
      const editingId = args.item.ID;
      const isEditingRowSelected = selectedRows.includes(args.row);

      if (isEditingRowSelected) {
        selectedRows.forEach((rowIndex: number) => {
          if (rowIndex !== args.row) {
            const rowItem = this.angularGridDetail.slickGrid.getDataItem(rowIndex);
            if (rowItem) {
              // Copy the edited value
              rowItem[field] = args.item[field];

              // If editing ProductID, copy related product fields
              if (field === 'ProductID') {
                rowItem.ProductCode = args.item.ProductCode;
                rowItem.ProductNewCode = args.item.ProductNewCode;
                rowItem.ProductName = args.item.ProductName;
                rowItem.Unit = args.item.Unit;
                rowItem.TotalInventory = args.item.TotalInventory;
              }
              // If editing ProjectID, copy related project fields
              else if (field === 'ProjectID') {
                rowItem.ProjectCodeExport = args.item.ProjectCodeExport;
                rowItem.ProjectNameText = args.item.ProjectNameText;
              }

              this.angularGridDetail.gridService.updateItem(rowItem);
            }
          }
        });
        this.angularGridDetail.slickGrid.invalidate();
      }
    }

    if (columnDef.field === 'ProductID' || columnDef.field === 'Qty') {
      if (columnDef.field === 'Qty') {
        // ✅ Clear inventory allocation when Qty changes
        args.item.ChosenInventoryProject = '';
        args.item.ProductCodeExport = '';
        this.hasInventoryRelatedChange = true;
        this.angularGridDetail.gridService.updateItem(args.item);
      }
      this.updateDetailFooter();
    }
  }

  /** Thêm dòng trống mới vào grid chi tiết */
  addNewRow(): void {
    const tempIds = this.dataDetail
      .filter((x) => Number(x?.ID) < 0)
      .map((x) => Math.abs(Number(x?.ID)));
    const nextTempId = tempIds.length > 0 ? Math.max(...tempIds) + 1 : 1;

    const newRow = {
      ID: -nextTempId,
      ProductID: 0,
      ProductNewCode: '',
      ProductCode: '',
      ProductFullName: '',
      ProductName: '',
      Unit: '',
      TotalInventory: 0,
      Qty: 0,
      QuantityRemain: 0,
      ProjectID: 0,
      ProjectCodeExport: '',
      ProjectNameText: '',
      Note: '',
      ExpectReturnDate: new Date(),
      UnitPricePOKH: 0,
      UnitPricePurchase: 0,
      BillCode: '',
      Specifications: '',
      GroupExport: '',
      UserReceiver: '',
      CustomerResponse: '',
      SerialNumber: '',
      POKHID: 0,
      POKHDetailID: 0,
    };

    this.dataDetail = [...this.dataDetail, newRow];
    this.refreshGrid();
    setTimeout(() => this.updateDetailFooter(), 0);
  }

  /** Xóa dòng chi tiết khỏi grid */
  deleteRow(item: any): void {
    const rowId = item?.ID;
    if (rowId !== undefined && rowId !== null) {
      if (rowId > 0) {
        this.deletedDetailIds.push(rowId);
      }
      this.dataDetail = this.dataDetail.filter(
        (x) => Number(x?.ID) !== Number(rowId)
      );
      this.refreshGrid();
      setTimeout(() => this.updateDetailFooter(), 0);
    }
  }

  /** Refresh grid: cập nhật lại dữ liệu & giữ nguyên selected rows */
  refreshGrid(): void {
    if (this.angularGridDetail?.dataView) {
      // Lưu lại selected rows trước khi refresh
      const selectedRows = this.angularGridDetail.slickGrid?.getSelectedRows() || [];
      const selectedIds = selectedRows.map(rowIndex => {
        const item = this.angularGridDetail.slickGrid.getDataItem(rowIndex);
        return item?.ID;
      }).filter(id => id != null);

      // Refresh data
      this.angularGridDetail.dataView.setItems(this.dataDetail);
      this.angularGridDetail.slickGrid?.invalidate();
      this.angularGridDetail.slickGrid?.render();

      // Restore selected rows dựa trên ID
      if (selectedIds.length > 0) {
        setTimeout(() => {
          const rowsToSelect: number[] = [];
          this.dataDetail.forEach((item: any, index: number) => {
            if (selectedIds.includes(item.ID)) {
              rowsToSelect.push(index);
            }
          });
          if (rowsToSelect.length > 0) {
            this.angularGridDetail.slickGrid?.setSelectedRows(rowsToSelect);
          }
        }, 0);
      }
    }
  }

  /** Cập nhật footer grid: tổng sản phẩm, tổng số lượng */
  private updateDetailFooter(): void {
    const grid = this.angularGridDetail?.slickGrid;
    if (!grid) return;

    const rows = this.dataDetail || [];
    const countProduct = rows.filter(
      (x: any) => Number(x?.ProductID || 0) > 0
    ).length;

    const sumQty = rows.reduce(
      (acc: number, x: any) => acc + (Number(x?.Qty) || 0),
      0
    );

    const formattedQty = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(sumQty);

    const footerData: any = {
      ProductID: `<div style="text-align:right; font-weight:600;">${countProduct}</div>`,
      Qty: `<div style="text-align:right; font-weight:600;">${formattedQty}</div>`,
    };

    const columns = grid.getColumns();
    columns.forEach((col: any) => {
      if (footerData[col.id] !== undefined) {
        const footerElm = grid.getFooterRowColumn(col.id);
        if (footerElm) {
          footerElm.innerHTML = footerData[col.id];
        }
      }
    });
  }

  private updateTotalInventoryForExistingRows(): void {
    if (!this.angularGridDetail || this.productGridCollection.length === 0) {
      return;
    }

    let hasUpdates = false;
    this.dataDetail.forEach((row: any) => {
      const productID = row.ProductID || 0;
      if (productID <= 0) return;

      const product = this.productGridCollection.find(
        (p: any) => p.value === productID
      );

      if (product) {
        const newTotalInventory = product.TotalInventory || 0;
        if (row.TotalInventory !== newTotalInventory) {
          row.TotalInventory = newTotalInventory;
          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      this.refreshGrid();
    }
  }
  //#endregion

  //#region API calls - Gọi API lấy dữ liệu phiếu xuất

  /** Lấy thông tin phiếu xuất theo ID (chế độ chỉnh sửa) */
  getBillExportByID(): void {
    this.isLoading = true;
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
            AddressStockID: data.AddressStockID || 0,
            WarehouseID: data.WarehouseID,
            Status: data.Status,
            SupplierID: data.SupplierID,
            CreatDate: new Date(data.CreatDate),
            RequestDate: new Date(data.RequestDate),
            IsApproved: data.IsApproved || false,
            IsTransfer: data.IsTransfer || false,
          };
          this.validateForm.patchValue(this.newBillExport);
          this.validateForm.patchValue({
            IsTransfer: data.IsTransfer || false,
            WareHouseTranferID: data.WareHouseTranferID || null,
          });

          this.isLoadingEditData = true;
          this.changeProductGroup(this.newBillExport.KhoTypeID);
          this.isLoadingEditData = false;

          this.changeCustomer();
          this.loadReferenceLinks();

          this.validateForm.get('Code')?.disable();
          this.validateForm.get('Address')?.disable();

          if (this.newBillExport.IsApproved) {
            this.isFormDisabled = true;
            this.validateForm.disable();
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error('Thong bao', err.error?.message || err.message);
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  /** Lấy danh sách chi tiết phiếu xuất theo BillExport ID */
  getBillExportDetailID(): void {
    this.isLoading = true;
    this.billExportService.getBillExportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.dataDetail = rawData.map((item: any) => {
            const productInfo = this.productGridCollection.find(
              (p: any) => p.value === item.ProductID
            );
            const projectInfo = this.projectGridCollection.find(
              (p: any) => p.value === item.ProjectID
            );

            return {
              ID: item.ID || 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || productInfo?.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo?.ProductCode || '',
              ProductName: item.ProductName || productInfo?.ProductName || '',
              Unit: item.Unit || productInfo?.Unit || '',
              TotalInventory: productInfo?.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: item.QuantityRemain || 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport: item.ProjectCodeExport || projectInfo?.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || projectInfo?.ProjectName || '',
              Note: item.Note || '',
              ExpectReturnDate: item.ExpectReturnDate
                ? new Date(item.ExpectReturnDate)
                : new Date(),
              UnitPricePOKH: item.UnitPricePOKH || 0,
              UnitPricePurchase: item.UnitPricePurchase || 0,
              BillCode: item.BillCode || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              CustomerResponse: item.CustomerResponse || '',
              SerialNumber: item.SerialNumber || '',
              POKHID: item.POKHID || 0,
              ProductFullName: item.ProductFullName || '',
              ProductType: item.ProductType || 0,
              IsInvoice: item.IsInvoice || false,
              InvoiceNumber: item.InvoiceNumber || '',
              ReturnedStatus: item.ReturnedStatus || false,
              ProjectPartListID: item.ProjectPartListID || 0,
              TradePriceDetailID: item.TradePriceDetailID || 0,
              BillImportDetailID: item.BillImportDetailID || 0,
              POKHDetailIDActual: item.POKHDetailIDActual || 0,
              PONumber: item.PONumber || '',
            };
          });
          this.refreshGrid();
          setTimeout(() => this.updateDetailFooter(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || err.message);
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  /** Lấy chi tiết phiếu nhập để chuyển đổi sang phiếu xuất */
  getBillExportDetailConvert(ids: number[]): void {
    this.isLoading = true;
    this.billExportService.getBillImportDetail(ids).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.dataDetail = rawData.map((item: any, index: number) => ({
            ID: -(index + 1),
            POKHDetailID: item.POKHDetailID || 0,
            ProductID: item.ProductID || 0,
            ProductNewCode: item.ProductNewCode || '',
            ProductCode: item.ProductCode || '',
            ProductName: item.ProductName || '',
            Unit: item.Unit || '',
            TotalInventory: item.TotalInventory || 0,
            Qty: item.Qty || 0,
            QuantityRemain: item.QuantityRemain || 0,
            ProjectID: item.ProjectID || 0,
            ProjectCodeExport: item.ProjectCodeExport || '',
            ProjectNameText: item.ProjectNameText || '',
            Note: item.Note || '',
            ExpectReturnDate: item.ExpectReturnDate
              ? new Date(item.ExpectReturnDate)
              : new Date(),
            UnitPricePOKH: item.UnitPricePOKH || 0,
            UnitPricePurchase: item.UnitPricePurchase || 0,
            BillCode: item.BillCode || '',
            Specifications: item.Specifications || '',
            GroupExport: item.GroupExport || '',
            UserReceiver: item.UserReceiver || '',
            CustomerResponse: item.CustomerResponse || '',
            SerialNumber: item.SerialNumber || '',
            POKHID: item.POKHID || 0,
            BillImportDetailID: item.BillImportDetailID || item.ID || 0,
          }));
          this.refreshGrid();
          setTimeout(() => this.updateDetailFooter(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || err.message);
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Load SenderID (Người Nhận) từ ProductGroupWarehouse khi ở chế độ thêm mới
   */
  private loadSenderFromProductGroupWarehouse(khoTypeID: number, warehouseID: number): void {
    if (!khoTypeID || !warehouseID || khoTypeID <= 0 || warehouseID <= 0) {
      return;
    }

    this.productSaleService
      .getdataProductGroupWareHouse(khoTypeID, warehouseID)
      .subscribe({
        next: (res: any) => {
          if (res?.data && res.data.length > 0) {
            const userId = res.data[0].UserID || 0;
            this.validateForm.patchValue({ SenderID: userId });
            this.newBillExport.SenderID = userId;
            if (userId <= 0) {
              this.validateForm.patchValue({ SenderID: this.appUserService.id });
              this.newBillExport.SenderID = this.appUserService.id || 0;
            }
          }
        },
        error: (err: any) => {
          console.error('Error loading sender from ProductGroupWarehouse:', err);
        },
      });
  }

  /** Thay đổi loại kho -> load lại danh sách sản phẩm cho grid */
  changeProductGroup(ID: number): void {
    if (!ID) {
      this.productGridCollection = [];
      this.initGridColumns();
      return;
    }

    const normalizedWareHouseCode = (this.wareHouseCode || '').trim() || 'HN';

    // Load SenderID từ ProductGroupWarehouse khi thêm mới
    if (!this.newBillExport.Id || this.newBillExport.Id <= 0) {
      const warehouseID = this.newBillExport.WarehouseID || 0;
      if (warehouseID > 0) {
        this.loadSenderFromProductGroupWarehouse(ID, warehouseID);
      }
    }

    this.billExportService
      .getOptionProduct(normalizedWareHouseCode, ID)
      .subscribe({
        next: (res: any) => {
          const productData = res.data;
          if (Array.isArray(productData)) {
            this.productGridCollection = productData
              .filter((p) => p.ID !== null && p.ID !== undefined && p.ID !== 0)
              .map((product) => ({
                label: `${product.ProductCode || ''}`,
                value: product.ProductSaleID,
                ProductCode: product.ProductCode,
                ProductNewCode: product.ProductNewCode,
                ProductName: product.ProductName,
                Unit: product.Unit,
                TotalInventory: product.TotalQuantityLast || 0,
              }));
          } else {
            this.productGridCollection = [];
          }

          this.initGridColumns();

          if (this.isFromWarehouseRelease || this.isFromProjectPartList) {
            setTimeout(() => this.updateTotalInventoryForExistingRows(), 50);
          }

          if (this.isCheckmode && !this.isBorrow && !this.hasBillExportDetailLoaded) {
            this.hasBillExportDetailLoaded = true;
            this.getBillExportDetailID();
          }
        },
        error: (err: any) => {
          console.error('Error getting product options:', err);
          this.productGridCollection = [];
          this.initGridColumns();
        },
      });
  }

  /** Load danh sách dự án cho dropdown trong grid */
  loadOptionProject(): void {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectGridCollection = projectData
            .filter((p) => p.ID !== null && p.ID !== undefined && p.ID !== 0)
            .map((project) => ({
              label: project.ProjectCode + ' | ' + project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
              ProjectName: project.ProjectName,
            }));
        } else {
          this.projectGridCollection = [];
        }
        this.initGridColumns();
      },
      error: (err: any) => {
        console.error(err);
        this.projectGridCollection = [];
      },
    });
  }

  /** Lấy mã phiếu xuất mới từ server */
  getNewCode(): void {
    this.billExportService
      .getNewCodeBillExport(this.newBillExport.Status)
      .subscribe({
        next: (res: any) => {
          this.newBillExport.Code = res?.data ?? '';
          this.validateForm.patchValue({ Code: this.newBillExport.Code });
        },
        error: (err: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || err.message);
        },
      });
  }

  /** Khi thay đổi trạng thái phiếu -> cập nhật cột hiển thị & validator ngày */
  onStatusChange(value: number): void {
    this.newBillExport.Status = value;
    this.updateColumnVisibility();
    this.updateDateValidators(value);
  }

  /**
   * Cập nhật validators cho CreatDate và RequestDate dựa trên Status
   * - Status = 6 (Yêu cầu xuất kho): RequestDate bắt buộc, CreatDate không bắt buộc
   * - Các status khác: CreatDate bắt buộc, RequestDate không bắt buộc
   */
  private updateDateValidators(status: number): void {
    const creatDateControl = this.validateForm.get('CreatDate');
    const requestDateControl = this.validateForm.get('RequestDate');

    if (status === 6) {
      // Status = 6 (Yêu cầu xuất kho): RequestDate bắt buộc, CreatDate không bắt buộc
      creatDateControl?.clearValidators();
      requestDateControl?.setValidators([Validators.required]);
    } else {
      // Các status khác: CreatDate bắt buộc, RequestDate không bắt buộc
      creatDateControl?.setValidators([Validators.required]);
      requestDateControl?.clearValidators();
    }

    creatDateControl?.updateValueAndValidity();
    requestDateControl?.updateValueAndValidity();
  }

  /**
   * Cập nhật visibility của cột "Ngày dự kiến trả" (ExpectReturnDate)
   * Cột chỉ hiển thị khi Status = 0 (Mượn) hoặc Status = 7 (Yêu cầu mượn) hoặc isBorrow = true
   */
  private updateColumnVisibility(): void {
    if (!this.angularGridDetail?.slickGrid) return;

    const status = this.validateForm.get('Status')?.value ?? this.newBillExport.Status;
    const shouldShowExpectReturnDate = this.isBorrow || status === 0 || status === 7;

    const grid = this.angularGridDetail.slickGrid;
    let currentColumns = grid.getColumns();

    // Lưu lại checkbox column để đảm bảo không bị mất
    const checkboxColumn = currentColumns.find((col: any) => col.id === '_checkbox_selector');

    // Loại bỏ checkbox column tạm thời khỏi danh sách để xử lý
    currentColumns = currentColumns.filter((col: any) => col.id !== '_checkbox_selector');

    // Tìm index của cột ExpectReturnDate trong danh sách hiện tại
    const columnIndex = currentColumns.findIndex((col: any) => col.id === 'ExpectReturnDate');

    if (columnIndex === -1) {
      // Cột chưa có trong grid, cần thêm vào nếu shouldShow = true
      if (shouldShowExpectReturnDate) {
        const expectReturnDateColumn = this.columnDefinitionsDetail.find(col => col.id === 'ExpectReturnDate');
        if (expectReturnDateColumn) {
          // Thêm cột vào vị trí trước UnitPricePOKH
          const insertIndex = currentColumns.findIndex((col: any) => col.id === 'UnitPricePOKH');
          if (insertIndex > -1) {
            currentColumns.splice(insertIndex, 0, { ...expectReturnDateColumn, hidden: false });
          } else {
            currentColumns.push({ ...expectReturnDateColumn, hidden: false });
          }

          // Thêm lại checkbox column vào đầu
          if (checkboxColumn) {
            currentColumns = [checkboxColumn, ...currentColumns];
          }

          grid.setColumns(currentColumns);
          grid.invalidate();
        }
      }
    } else {
      // Cột đã có trong grid, chỉ cần update hidden property
      const column = currentColumns[columnIndex];
      const isCurrentlyHidden = column.hidden === true;
      const shouldBeHidden = !shouldShowExpectReturnDate;

      if (isCurrentlyHidden !== shouldBeHidden) {
        column.hidden = shouldBeHidden;

        // Thêm lại checkbox column vào đầu
        if (checkboxColumn) {
          currentColumns = [checkboxColumn, ...currentColumns];
        }

        grid.setColumns(currentColumns);
        grid.invalidate();
      }
    }
  }

  /** Khi thay đổi loại kho -> clear cache tồn kho & load lại sản phẩm */
  onKhoTypeChange(khoTypeID: number): void {
    if (!khoTypeID || khoTypeID <= 0) return;
    if (this.isLoadingEditData) return;

    this.productAvailableInventoryMap.clear();
    this.changeProductGroup(khoTypeID);
  }

  /** Load danh sách phiếu nhập liên kết (khi phiếu xuất là chuyển kho) */
  loadReferenceLinks(): void {
    this.referenceLinks = [];
    const billExportID = this.newBillExport.Id || 0;
    const isTransfer = this.validateForm.get('IsTransfer')?.value || false;

    if (billExportID <= 0 || !isTransfer) return;

    this.billExportService.getBillImportByBillExportID(billExportID).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res?.data) {
          const billImport = res.data;
          if (billImport && billImport.ID > 0) {
            const warehouse = this.dataCbbWareHouseTransfer.find(
              (item: any) => item.ID === billImport.WarehouseID
            );
            this.referenceLinks = [{
              id: billImport.ID,
              text: billImport.IsDeleted
                ? `${billImport.BillImportCode} - đã xóa`
                : billImport.BillImportCode,
              khoTypeID: billImport.KhoTypeID || 0,
              warehouseCode: warehouse?.Code || '',
              warehouseName: warehouse?.Name || '',
              isDeleted: billImport.IsDeleted || false,
            }];
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading reference links:', err);
        this.referenceLinks = [];
      },
    });
  }

  /** Click vào link phiếu nhập liên kết -> mở modal xem chi tiết phiếu nhập */
  onReferenceLinkClick(link: any): void {
    if (!link || link.isDeleted) return;

    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-fullscreen',
    });
    modalRef.componentInstance.id = link.id;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.WarehouseCode = link.warehouseCode;

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.getBillExportByID();
          this.loadReferenceLinks();
        }
      },
      () => { }
    );
  }
  //#endregion

  //#region Dropdown data - Load dữ liệu dropdown

  /** Lấy ID kho theo mã kho hiện tại */
  getWarehouseID(): void {
    this.billExportService.getWarehouses().subscribe({
      next: (res: any) => {
        const list = res.data || [];
        const searchCode = String(this.wareHouseCode).toUpperCase().trim();
        const currentWarehouse = list.find(
          (item: any) =>
            String(item.WarehouseCode).toUpperCase().trim() === searchCode
        );
        if (currentWarehouse) {
          this.newBillExport.WarehouseID = currentWarehouse.ID || 0;

          // Nếu đang ở chế độ thêm mới và đã có KhoTypeID, load SenderID từ ProductGroupWarehouse
          if ((!this.newBillExport.Id || this.newBillExport.Id <= 0) && this.newBillExport.KhoTypeID > 0) {
            this.loadSenderFromProductGroupWarehouse(this.newBillExport.KhoTypeID, this.newBillExport.WarehouseID);
          }
        }
      },
      error: (err: any) => {
        console.error('Error getting warehouse:', err);
      },
    });
  }

  /** Load danh sách kho chuyển (loại bỏ kho hiện tại) */
  getDataCbbWareHouseTransfer(): void {
    this.billExportService.getWarehouses().subscribe({
      next: (res: any) => {
        const list = res.data || [];
        this.dataCbbWareHouseTransfer = list
          .filter((item: any) => item.WarehouseCode !== this.wareHouseCode)
          .map((item: any) => ({
            ID: item.ID,
            Name: item.WarehouseName || '',
            Code: item.WarehouseCode || '',
          }));
      },
      error: (err: any) => {
        console.error('Error getting warehouse list:', err);
        this.dataCbbWareHouseTransfer = [];
      },
    });
  }

  /** Load danh sách nhà cung cấp */
  getDataCbbSupplierSale(): void {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        console.error('Error getting suppliers:', err);
      },
    });
  }

  /** Load danh sách người nhận */
  getDataCbbUser(): void {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbUser = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        console.error('Error getting users:', err);
      },
    });
  }

  /** Load danh sách người giao */
  getDataCbbSender(): void {
    this.billExportService.getCbbSender().subscribe({
      next: (res: any) => {
        this.dataCbbSender = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        console.error('Error getting senders:', err);
      },
    });
  }

  /** Load danh sách địa chỉ kho */
  getDataCbbAdressStock(): void {
    this.billExportService.getCbbAddressStock(this.customerID).subscribe({
      next: (res: any) => {
        this.dataCbbAdressStock = res.data || [];
      },
      error: (err: any) => {
        console.error('Error getting address stock:', err);
      },
    });
  }

  /** Load danh sách khách hàng */
  getDataCbbCustomer(): void {
    this.billExportService.getCbbCustomer().subscribe({
      next: (res: any) => {
        this.dataCbbCustomer = Array.isArray(res.data) ? res.data : [];
        if (
          (this.isFromProjectPartList || this.isFromWarehouseRelease) &&
          this.newBillExport.CustomerID > 0
        ) {
          this.changeCustomer();
        }
      },
      error: (err: any) => {
        console.error('Error getting customers:', err);
      },
    });
  }

  /** Khi thay đổi khách hàng -> cập nhật địa chỉ & load danh sách địa chỉ kho */
  changeCustomer(): void {
    const id = this.validateForm.get('CustomerID')?.value;
    if (!id || id <= 0) {
      this.dataCbbAdressStock = [];
      this.validateForm.patchValue({ Address: '', AddressStockID: 0 });
      this.newBillExport.Address = '';
      return;
    }

    const customer = this.dataCbbCustomer.find((x) => x.ID === id);
    if (customer && customer.Address) {
      this.newBillExport.Address = customer.Address;
      this.validateForm.patchValue({ Address: customer.Address });
    } else {
      this.newBillExport.Address = '';
      this.validateForm.patchValue({ Address: '' });
    }

    this.billExportService.getCbbAddressStock(id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.dataCbbAdressStock = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Error getting AddressStock:', err);
      },
    });
  }

  /** Load danh sách loại kho (nhóm sản phẩm) */
  getDataCbbProductGroup(): void {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = Array.isArray(res?.data) ? res.data : [];

        this.dataCbbProductGroup = this.dataCbbProductGroup?.filter(
          (x: any) => x.Isvisible != false && x.ParentID == 0
            || x.ParentID == null || x.ParentID == undefined
        );
      },
      error: (err: any) => {
        console.error('Error getting product groups:', err);
      },
    });


  }

  getCustomerName(customerId: number): string {
    const customer = this.dataCbbCustomer.find((c) => c.ID === customerId);
    return customer ? customer.CustomerName : '';
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.dataCbbSupplier.find((s) => s.ID === supplierId);
    return supplier ? supplier.NameNCC : '';
  }
  //#endregion

  //#region Modal actions
  openModalNewProduct(): void {
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
  }

  closeModal(): void {
    this.activeModal.close();
  }
  //#endregion

  //#region Save & Validate - Lưu phiếu xuất & kiểm tra hợp lệ

  /** Hiển thị popup thông báo lỗi */
  showErrorNotification(message: string): void {
    this.errorMessage = message;
    this.showErrorPopup = true;
  }

  /** Đóng popup thông báo lỗi */
  closeErrorPopup(): void {
    this.showErrorPopup = false;
    this.errorMessage = '';
  }

  /** Kiểm tra dữ liệu form hợp lệ trước khi lưu */
  private validateFormData(): { isValid: boolean; message: string } {
    const formValues = this.validateForm.getRawValue();
    const status = formValues.Status;

    if (!formValues.Code || formValues.Code.trim() === '') {
      return { isValid: false, message: 'Xin hãy điền số phiếu.' };
    }

    if (!formValues.CustomerID || formValues.CustomerID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn Khách hàng!' };
    }

    if (!formValues.UserID || formValues.UserID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn nhân viên.' };
    }

    if (!formValues.KhoTypeID || formValues.KhoTypeID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn kho quản lý.' };
    }

    if (!formValues.SenderID || formValues.SenderID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn người giao.' };
    }

    if (status === null || status === undefined || status < 0) {
      return { isValid: false, message: 'Xin hãy chọn trạng thái.' };
    }

    if (status !== 6 && !formValues.CreatDate) {
      return { isValid: false, message: 'Xin hãy chọn Ngày xuất!' };
    }

    if (this.dataDetail.length === 0) {
      return { isValid: false, message: 'Vui lòng thêm ít nhất một sản phẩm vào bảng!' };
    }

    if (status === 0 || status === 7) {
      for (let i = 0; i < this.dataDetail.length; i++) {
        const row = this.dataDetail[i];
        if (!row.ExpectReturnDate) {
          return { isValid: false, message: `Vui lòng nhập Ngày dự kiến trả cho dòng ${i + 1}!` };
        }
        if (!row.ProjectID || row.ProjectID <= 0) {
          return { isValid: false, message: `Vui lòng nhập Dự án cho dòng ${i + 1}!` };
        }
      }
    }

    for (let i = 0; i < this.dataDetail.length; i++) {
      const row = this.dataDetail[i];
      if (!row.ProductID || row.ProductID <= 0) {
        return { isValid: false, message: `Vui lòng chọn sản phẩm cho dòng ${i + 1}!` };
      }
      if (!row.Qty || parseFloat(row.Qty) <= 0) {
        return { isValid: false, message: `Vui lòng nhập số lượng xuất cho dòng ${i + 1}!` };
      }
    }

    return { isValid: true, message: '' };
  }

  // private validateInventoryStock(): { isValid: boolean; message: string } {
  //   const tableData = this.dataDetail || [];
  //   if (tableData.length === 0) return { isValid: true, message: '' };

  //   const insufficientMessages: string[] = [];

  //   // Bước 1: Gom nhóm yêu cầu xuất từ Grid theo ProductID
  //   const productUsage = new Map<number, {
  //     totalRequested: number,
  //     projectDemands: Map<number, number>
  //   }>();

  //   tableData.forEach((row: any) => {
  //     const pId = Number(row.ProductID);
  //     if (pId <= 0) return;

  //     const qty = parseFloat(row.Qty || 0);
  //     const projId = Number(row.ProjectID || 0);

  //     if (!productUsage.has(pId)) {
  //       productUsage.set(pId, { totalRequested: 0, projectDemands: new Map() });
  //     }

  //     const usage = productUsage.get(pId)!;
  //     usage.totalRequested += qty;

  //     const currentProjQty = usage.projectDemands.get(projId) || 0;
  //     usage.projectDemands.set(projId, currentProjQty + qty);
  //   });

  //   // Bước 2: Đối soát với dữ liệu đã nạp trong Map
  //   productUsage.forEach((usage, pId) => {
  //     const invInfo = this.productInventoryDetailMap.get(pId);
  //     if (!invInfo) {
  //       insufficientMessages.push(`Sản phẩm ID ${pId}: Chưa nạp được dữ liệu tồn kho.`);
  //       return;
  //     }

  //     // Công thức: Tổng tồn khả dụng = Tồn CK + Tổng các lô giữ của các dự án có trong phiếu
  //     let totalKeepAvailable = 0;
  //     usage.projectDemands.forEach((_qtyNeeded, projId) => {
  //       totalKeepAvailable += (invInfo.keepByProject.get(projId) || 0);
  //     });

  //     const totalPossibleStock = invInfo.generalStock + totalKeepAvailable;

  //     // Kiểm tra đơn vị tính (bỏ qua m, mét theo logic gốc)
  //     const rowSample = tableData.find((r: any) => r.ProductID === pId);
  //     const unit = (rowSample?.Unit || '').toLowerCase().trim();
  //     if (unit === 'm' || unit === 'mét' || unit === 'met') return;

  //     if (usage.totalRequested > totalPossibleStock) {
  //       const productDisplay = rowSample?.ProductNewCode || rowSample?.ProductCode || `ID:${pId}`;
  //       insufficientMessages.push(
  //         `[${productDisplay}]: Xuất ${usage.totalRequested.toFixed(2)} > Khả dụng ${totalPossibleStock.toFixed(2)} ` +
  //         `(Giữ dự án: ${totalKeepAvailable.toFixed(2)} + Tồn CK: ${invInfo.generalStock.toFixed(2)})`
  //       );
  //     }
  //   });

  //   return {
  //     isValid: insufficientMessages.length === 0,
  //     message: insufficientMessages.join('\n')
  //   };
  // }

  // private async loadInventoryForValidation(productID: number): Promise<void> {
  //   if (productID <= 0) return;
  //   const tableData = this.dataDetail || [];
  //   const warehouseID = this.newBillExport.WarehouseID || 0;

  //   try {
  //     let pokhdetailID = tableData[0]?.POKHDetailID || 0;
  //     let projectID = tableData[0]?.ProjectID || 0;
  //     let billDetailID = tableData[0]?.ID || 0;
  //     if (pokhdetailID > 0) {
  //       projectID = 0;
  //     }

  //     const res: any = await firstValueFrom(
  //       this.billExportService.getInventoryProject(warehouseID, productID, projectID, pokhdetailID, billDetailID)
  //     );

  //     if (res && res.status === 1) {
  //       // Lấy tồn kho tự do (Hàng CK) từ bảng Stock
  //       const stockTable = res.stock || [];
  //       const generalStock = stockTable.length > 0 ? Number(stockTable[0].TotalQuantityLast || 0) : 0;

  //       // Lấy tồn giữ theo từng Dự án từ bảng Keep
  //       const keepTable = res.inventoryProjects || [];
  //       const keepMap = new Map<number, number>();

  //       keepTable.forEach((inv: any) => {
  //         const pId = Number(inv.ProjectID || 0);
  //         const remainQty = Number(inv.TotalQuantity || 0);
  //         const currentSum = keepMap.get(pId) || 0;
  //         keepMap.set(pId, currentSum + remainQty);
  //       });

  //       // Cập nhật Map tổng cho sản phẩm này
  //       this.productInventoryDetailMap.set(productID, {
  //         keepByProject: keepMap,
  //         generalStock: Math.max(0, generalStock)
  //       });

  //       console.log(`✅ Nạp xong tồn kho SP ${productID}: CK=${generalStock}, Dự án=${keepMap.size}`);
  //     }
  //   } catch (err) {
  //     console.error(`❌ Lỗi API tồn kho SP ${productID}:`, err);
  //     this.productInventoryDetailMap.set(productID, { keepByProject: new Map(), generalStock: 0 });
  //   }
  // }

  /** Kiểm tra tồn kho đủ hay không trước khi lưu phiếu xuất */
  private validateInventoryStock(): { isValid: boolean; message: string } {
    const tableData = this.dataDetail || [];
    if (tableData.length === 0) return { isValid: true, message: '' };

    const insufficientMessages: string[] = [];
    const skipUnitNames = ['m', 'mét', 'met'];

    // ✅ Nhóm theo ProductID + ProjectID + POKHDetailID
    const groups = new Map<string, {
      productID: number;
      projectID: number;
      pokhDetailID: number;
      totalQty: number;
      sampleRow: any;
    }>();

    tableData.forEach((row: any) => {
      const productID = Number(row.ProductID || 0);
      const projectID = Number(row.ProjectID || 0);
      const pokhDetailID = Number(row.POKHDetailIDActual || row.POKHDetailID || 0);
      const qty = parseFloat(row.Qty || 0);

      if (productID <= 0 || qty <= 0) return;

      // ✅ Nếu có POKHDetailID thì ProjectID = 0
      const finalProjectID = pokhDetailID > 0 ? 0 : projectID;
      const key = `${productID}-${finalProjectID}-${pokhDetailID}`;

      if (!groups.has(key)) {
        groups.set(key, {
          productID,
          projectID: finalProjectID,
          pokhDetailID,
          totalQty: 0,
          sampleRow: row
        });
      }

      groups.get(key)!.totalQty += qty;
    });

    // ✅ Kiểm tra từng nhóm
    groups.forEach((group, key) => {
      const invInfo = this.productInventoryDetailMap.get(key);

      if (!invInfo) {
        insufficientMessages.push(`Nhóm [${key}]: Chưa nạp được dữ liệu tồn kho.`);
        return;
      }

      // ✅ Skip đơn vị mét
      const unit = (group.sampleRow?.Unit || '').toLowerCase().trim();
      if (skipUnitNames.includes(unit)) return;

      // ✅ Tổng tồn = Giữ + Còn lại + Tồn CK
      const totalStock = invInfo.totalQuantityKeep + invInfo.totalQuantityRemain + invInfo.totalQuantityLast;

      if (group.totalQty > totalStock) {
        const productDisplay = group.sampleRow?.ProductNewCode || group.sampleRow?.ProductCode || `ID:${group.productID}`;

        let locationInfo = '';
        if (group.projectID > 0) {
          locationInfo = ` (Dự án: ${group.projectID})`;
        } else if (group.pokhDetailID > 0) {
          locationInfo = ` (POKH Detail: ${group.pokhDetailID})`;
        }

        const showKeepQty = group.projectID > 0 && group.pokhDetailID > 0;

        const keepQtyText = showKeepQty
          ? `SL giữ: ${invInfo.totalQuantityKeep.toFixed(2)} + `
          : '';

        insufficientMessages.push(
          `[${productDisplay}]\n` +
          `SL xuất: ${group.totalQty.toFixed(2)} > Tổng tồn: ${totalStock.toFixed(2)}\n` +
          `(${keepQtyText}SL giữ: ${invInfo.totalQuantityRemain.toFixed(2)} + Tồn CK: ${invInfo.totalQuantityLast.toFixed(2)})`
        );

      }
    });

    return {
      isValid: insufficientMessages.length === 0,
      message: insufficientMessages.join('\n\n')
    };
  }

  /** Nạp dữ liệu tồn kho (tồn dự án + hàng tự do) để validate trước khi lưu */
  // private async loadInventoryForValidation(): Promise<void> {
  //     const tableData = this.dataDetail || [];
  //     const warehouseID = this.newBillExport.WarehouseID || 0;

  //     // ✅ Nhóm theo ProductID + ProjectID + POKHDetailID
  //     const groups = new Map<string, {
  //         productID: number;
  //         projectID: number;
  //         pokhDetailID: number;
  //         billExportDetailIDs: number[];
  //     }>();

  //     tableData.forEach((row: any) => {
  //         const productID = Number(row.ProductID || 0);
  //         const projectID = Number(row.ProjectID || 0);
  //         const pokhDetailID = Number(row.POKHDetailIDActual || row.POKHDetailID || 0);

  //         if (productID <= 0) return;

  //         // ✅ Nếu có POKHDetailID thì ProjectID = 0
  //         const finalProjectID = pokhDetailID > 0 ? 0 : projectID;
  //         const key = `${productID}-${finalProjectID}-${pokhDetailID}`;

  //         if (!groups.has(key)) {
  //             groups.set(key, {
  //                 productID,
  //                 projectID: finalProjectID,
  //                 pokhDetailID,
  //                 billExportDetailIDs: []
  //             });
  //         }

  //         // ✅ Chỉ thêm ID > 0 (detail đang sửa)
  //         if (row.ID > 0) {
  //             groups.get(key)!.billExportDetailIDs.push(row.ID);
  //         }
  //     });

  //     // ✅ Gọi API cho từng nhóm
  //     for (const [key, group] of groups) {
  //         try {
  //             // ✅ Chuyển array thành CSV: [123, 456] → "123,456"
  //             const billExportDetailIDs = group.billExportDetailIDs.join(',');

  //             const res: any = await firstValueFrom(
  //                 this.billExportService.getInventoryProjectImportExport(
  //                     warehouseID,
  //                     group.productID,
  //                     group.projectID,
  //                     group.pokhDetailID,
  //                     billExportDetailIDs  // ✅ Truyền CSV
  //                 )
  //             );

  //             if (res && res.status === 1) {
  //                 // ✅ Lấy 4 bảng từ API
  //                 const inventoryProjects = res.inventoryProjects || []; // Bảng 0: Keep
  //                 const dtImport = res.import || [];                     // Bảng 1: Import
  //                 const dtExport = res.export || [];                     // Bảng 2: Export
  //                 const dtStock = res.stock || [];                       // Bảng 3: Stock

  //                 // ✅ Tính toán tồn kho
  //                 const totalQuantityKeep = inventoryProjects.length > 0
  //                     ? Number(inventoryProjects[0].TotalQuantity || 0)
  //                     : 0;

  //                 const totalImport = dtImport.length > 0
  //                     ? Number(dtImport[0].TotalImport || 0)
  //                     : 0;

  //                 const totalExport = dtExport.length > 0
  //                     ? Number(dtExport[0].TotalExport || 0)
  //                     : 0;

  //                 const totalQuantityLast = dtStock.length > 0
  //                     ? Number(dtStock[0].TotalQuantityLast || 0)
  //                     : 0;

  //                 const totalQuantityRemain = Math.max(totalImport - totalExport, 0);

  //                 // ✅ Lưu vào Map với key là string
  //                 this.productInventoryDetailMap.set(key, {
  //                     totalQuantityKeep: Math.max(totalQuantityKeep, 0),
  //                     totalQuantityRemain,
  //                     totalQuantityLast: Math.max(totalQuantityLast, 0)
  //                 });

  //                 console.log(`✅ Nạp tồn kho [${key}]:`, {
  //                     Giữ: totalQuantityKeep,
  //                     'Còn lại': totalQuantityRemain,
  //                     'Tồn CK': totalQuantityLast,
  //                     'Tổng': totalQuantityKeep + totalQuantityRemain + totalQuantityLast
  //                 });
  //             }
  //         } catch (err) {
  //             console.error(`❌ Lỗi API tồn kho [${key}]:`, err);
  //             // ✅ Lưu giá trị 0 nếu lỗi
  //             this.productInventoryDetailMap.set(key, {
  //                 totalQuantityKeep: 0,
  //                 totalQuantityRemain: 0,
  //                 totalQuantityLast: 0
  //             });
  //         }
  //     }
  // }

  private async loadInventoryForValidation(): Promise<void> {
    const tableData = this.dataDetail || [];
    const warehouseID = this.newBillExport.WarehouseID || 0;

    // ✅ Bước 1: Gộp tất cả detail ID theo ProductID (không phân biệt ProjectID/POKHDetailID)
    const productDetailIDsMap = new Map<number, number[]>();
    tableData.forEach((row: any) => {
      const productID = Number(row.ProductID || 0);
      if (productID <= 0) return;
      if (row.ID > 0) {
        if (!productDetailIDsMap.has(productID)) {
          productDetailIDsMap.set(productID, []);
        }
        productDetailIDsMap.get(productID)!.push(row.ID);
      }
    });

    // ✅ Bước 2: Nhóm theo ProductID + ProjectID + POKHDetailID để gọi API
    const groups = new Map<string, {
      productID: number;
      projectID: number;
      pokhDetailID: number;
    }>();

    tableData.forEach((row: any) => {
      const productID = Number(row.ProductID || 0);
      const projectID = Number(row.ProjectID || 0);
      const pokhDetailID = Number(row.POKHDetailID || 0);

      if (productID <= 0) return;

      // ✅ Nếu có POKHDetailID thì ProjectID = 0
      const finalProjectID = pokhDetailID > 0 ? 0 : projectID;
      const key = `${productID}-${finalProjectID}-${pokhDetailID}`;

      if (!groups.has(key)) {
        groups.set(key, {
          productID,
          projectID: finalProjectID,
          pokhDetailID
        });
      }
    });

    // ✅ Gọi API cho từng nhóm
    for (const [key, group] of groups) {
      try {
        // ✅ Lấy tất cả detail IDs cùng ProductID (gộp từ mọi group cùng sản phẩm)
        const allDetailIDs = productDetailIDsMap.get(group.productID) || [];
        const billExportDetailIDs = allDetailIDs.join(',');

        const res: any = await firstValueFrom(
          this.billExportService.getInventoryProjectImportExport(
            warehouseID,
            group.productID,
            group.projectID,
            group.pokhDetailID,
            billExportDetailIDs  // ✅ Truyền CSV gộp theo ProductID
          )
        );

        if (res && res.status === 1) {
          // ✅ Lấy 4 bảng từ API
          const inventoryProjects = res.inventoryProjects || []; // Bảng 0: Keep
          const dtImport = res.import || [];                     // Bảng 1: Import
          const dtExport = res.export || [];                     // Bảng 2: Export
          const dtStock = res.stock || [];                       // Bảng 3: Stock

          // ✅ Tính toán tồn kho
          const totalQuantityKeep = inventoryProjects.length > 0
            ? Number(inventoryProjects[0].TotalQuantity || 0)
            : 0;

          const totalImport = dtImport.length > 0
            ? Number(dtImport[0].TotalImport || 0)
            : 0;

          const totalExport = dtExport.length > 0
            ? Number(dtExport[0].TotalExport || 0)
            : 0;

          const totalQuantityLast = dtStock.length > 0
            ? Number(dtStock[0].TotalQuantityLast || 0)
            : 0;

          const totalQuantityRemain = Math.max(totalImport - totalExport, 0);

          // ✅ Lưu vào Map với key là string
          this.productInventoryDetailMap.set(key, {
            totalQuantityKeep: Math.max(totalQuantityKeep, 0),
            totalQuantityRemain,
            totalQuantityLast: Math.max(totalQuantityLast, 0)
          });

          console.log(`✅ Nạp tồn kho [${key}]:`, {
            Giữ: totalQuantityKeep,
            'Còn lại': totalQuantityRemain,
            'Tồn CK': totalQuantityLast,
            'Tổng': totalQuantityKeep + totalQuantityRemain + totalQuantityLast,
            'Detail IDs (theo ProductID)': billExportDetailIDs
          });
        }
      } catch (err) {
        console.error(`❌ Lỗi API tồn kho [${key}]:`, err);

        // ✅ Lưu giá trị 0 nếu lỗi
        this.productInventoryDetailMap.set(key, {
          totalQuantityKeep: 0,
          totalQuantityRemain: 0,
          totalQuantityLast: 0
        });
      }
    }
  }

  /** Map dữ liệu từ bảng grid sang payload gửi API lưu chi tiết phiếu xuất */
  private mapTableDataToBillExportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      const rowKey = row.ID || index;
      const original = this.originalInventoryRelatedData.get(rowKey);

      const hasInventoryChange =
        original &&
        (original.ProductID !== (row.ProductID || 0) ||
          original.Qty !== (row.Qty || 0) ||
          original.ProjectID !== (row.ProjectID || 0) ||
          original.POKHDetailID !== (row.POKHDetailIDActual || row.POKHDetailID || 0));

      return {
        ID: row.ID > 0 ? row.ID : 0,
        ProductID: row.ProductID || 0,
        ProductName: row.ProductName || '',
        ProductCode: row.ProductCode || '',
        ProductNewCode: row.ProductNewCode || '',
        ProductFullName: row.ProductFullName || '',
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
        ProjectPartListID: row.ProjectPartListID || 0,
        TradePriceDetailID: row.TradePriceDetailID || 0,
        POKHDetailID: row.POKHDetailID || 0,
        Specifications: row.Specifications || '',
        BillImportDetailID: row.ImportDetailID || row.BillImportDetailID || 0,
        TotalInventory: row.TotalInventory || 0,
        ExpectReturnDate: row.ExpectReturnDate || null,
        CustomerResponse: row.CustomerResponse || '',
        POKHDetailIDActual: row.POKHDetailIDActual || 0,
        PONumber: row.PONumber || '',
        ChosenInventoryProject: row.ChosenInventoryProject || '',
        Unit: row.Unit || '',
        UnitName: row.Unit || '',
        ChildID: row.ChildID || row.ID || 0,
        ImportDetailID: row.ImportDetailID || row.BillImportDetailID || 0,
        ForceReallocate: hasInventoryChange || (row.ID || 0) <= 0,
        UnitPricePOKH: row.UnitPricePOKH || 0,
        UnitPricePurchase: row.UnitPricePurchase || 0,
        BillCode: row.BillCode || '',
        UserReceiver: row.UserReceiver || '',
      };
    });
  }

  /** Kiểm tra số lượng serial đã đủ chưa trước khi lưu */
  async checkSerial(): Promise<boolean> {
    // Placeholder - implement serial check if needed
    return true;
  }

  /** Lưu phiếu xuất: kiểm tra serial, quyền, form, tồn kho, trùng mã phiếu rồi gửi API */
  async saveDataBillExport(): Promise<void> {
    // --- 1. KIỂM TRA SERIAL ---
    const isSerialValid = await this.checkSerial();
    if (!isSerialValid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng serial không đủ, vui lòng kiểm tra lại');
      return;
    }

    const tableData = this.dataDetail || [];
    if (tableData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng thêm ít nhất một sản phẩm vào bảng!');
      return;
    }

    // --- 2. KIỂM TRA QUYỀN & FORM ---
    let formValues = this.validateForm.getRawValue();
    const billID = this.newBillExport.Id || 0;
    if ((billID > 0 || this.id > 0) && !this.permissionService.hasPermission('N27,N1,N33,N34,N69')) {
      this.showErrorNotification('Bạn không có quyền thực hiện hành động này!');
      return;
    }

    if (!this.validateForm.valid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      this.validateForm.markAllAsTouched();
      return;
    }

    const formValidation = this.validateFormData();
    if (!formValidation.isValid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, formValidation.message);
      return;
    }

    this.isSaving = true;
    try {
      // Lấy danh sách ProductID unique
      const uniqueProductIds: number[] = [...new Set<number>(
        tableData.map((r: any) => Number(r.ProductID)).filter((id: number) => id > 0)
      )];

      console.log('⏳ Đang nạp dữ liệu tồn kho dự án và hàng tự do...');
      // Chỉ gọi 1 lần vì loadInventoryForValidation nạp toàn bộ
      await this.loadInventoryForValidation();
      console.log('✅ Nạp dữ liệu hoàn tất.');

      // --- 4. VALIDATE TỒN KHO ---
      const inventoryValidation = this.validateInventoryStock();
      if (!inventoryValidation.isValid) {
        this.showErrorNotification(inventoryValidation.message);
        this.isSaving = false;
        return;
      }

      // --- 4.5. KIỂM TRA TRÙNG MÃ PHIẾU (chỉ khi thêm mới) ---
      if (!this.isCheckmode || (this.newBillExport.Id || 0) === 0) {
        try {
          const checkRes = await firstValueFrom(
            this.billExportService.checkBillCode(formValues.Code)
          );
          if (checkRes.status === 1 && checkRes.data === true) {
            const oldCode = formValues.Code;
            const newCodeRes = await firstValueFrom(
              this.billExportService.getNewCodeBillExport(this.newBillExport.Status)
            );
            if (newCodeRes.data) {
              const newCode = newCodeRes.data;
              const confirmed = await new Promise<boolean>((resolve) => {
                this.modal.confirm({
                  nzTitle: 'Xác nhận',
                  nzContent: `Mã phiếu [${oldCode}] đã tồn tại, đổi thành [${newCode}] và tiếp tục lưu?`,
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => resolve(true),
                  nzOnCancel: () => resolve(false),
                });
              });
              if (!confirmed) {
                this.isSaving = false;
                return;
              }
              this.validateForm.patchValue({ Code: newCode });
              formValues = this.validateForm.getRawValue();
            }
          }
        } catch (err) {
          console.error('Check bill code error:', err);
        }
      }

      // --- 5. GỬI PAYLOAD LƯU ---

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
          Status: formValues.Status,
          GroupID: this.newBillExport.GroupID,
          WarehouseType: wareHouseCode ? wareHouseCode.ProductGroupName : this.newBillExport.WarehouseType,
          KhoTypeID: formValues.KhoTypeID,
          CreatDate: formValues.CreatDate,
          CreatedDate: formValues.CreatDate,
          UpdatedDate: new Date(),
          ProductType: formValues.ProductType,
          AddressStockID: formValues.AddressStockID || this.newBillExport.AddressStockID,
          WarehouseID: this.newBillExport.WarehouseID,
          RequestDate: formValues.RequestDate,
          BillDocumentExportType: 2,
          IsApproved: this.newBillExport.IsApproved || false,
          IsTransfer: formValues.IsTransfer,
          WareHouseTranferID: formValues.WareHouseTranferID,
          IsPrepared: false,
          IsReceived: false,
          IsDeleted: false,
        },
        billExportDetail: this.mapTableDataToBillExportDetails(tableData),
        DeletedDetailIds: this.deletedDetailIds || [],
      };

      this.billExportService.saveBillExport(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'
            );
            this.activeModal.close(true);
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Lỗi khi lưu phiếu');
          }
          this.isSaving = false;
        },
        error: (err: any) => {
          this.showErrorNotification(err?.error?.message || 'Có lỗi xảy ra khi lưu!');
          this.isSaving = false;
        },
      });

    } catch (error: any) {
      console.error('Lỗi quy trình lưu:', error);
      this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
      this.isSaving = false;
    }
  }
  //#endregion

  //#region Download PO Files
  /**
   * Download all files associated with a PO Number
   * @param poNumber - The PO Number to download files for
   */
  downloadPOFiles(poNumber: string): void {
    if (!poNumber) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có số PO để tải file');
      return;
    }

    this.isLoading = true;

    // First, get list of files for this PO
    this.billExportService.getPOKHFiles(poNumber).subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data && res.data.length > 0) {
          const files = res.data;
          this.notification.success(
            'Thông báo',
            `Đang tải ${files.length} file...`
          );

          // Download each file
          files.forEach((file: any, index: number) => {
            this.downloadSinglePOFile(poNumber, file.FileName || file.fileName, index === files.length - 1);
          });
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Không tìm thấy file nào cho PO ${poNumber}`
          );
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error('Error getting PO files:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi lấy danh sách file: ${err?.error?.message || err?.message}`
        );
        this.isLoading = false;
      },
    });
  }

  /**
   * Download a single file from PO
   * @param poNumber - The PO Number
   * @param fileName - The file name to download
   * @param isLast - Whether this is the last file (to hide loading)
   */
  private downloadSinglePOFile(poNumber: string, fileName: string, isLast: boolean): void {
    this.billExportService.downloadPOKHFile(poNumber, fileName).subscribe({
      next: (blob: Blob) => {
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        if (isLast) {
          this.isLoading = false;
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Đã tải xong files cho PO ${poNumber}`
          );
        }
      },
      error: (err: any) => {
        console.error(`Error downloading file ${fileName}:`, err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi tải file ${fileName}: ${err?.error?.message || err?.message}`
        );
        if (isLast) {
          this.isLoading = false;
        }
      },
    });
  }
  //#endregion

  //#region Serial Management
  /**
   * Open modal to add/edit serial numbers for a bill export detail row
   * @param rowData - The row data from the grid
   */
  openAddSerialModal(rowData: any): void {
    // Validate that the row has valid data
    if (!rowData || !rowData.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn dòng hợp lệ để thêm Serial!'
      );
      return;
    }

    // Check if the bill is approved - if so, don't allow editing
    if (this.newBillExport.IsApproved) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Phiếu đã được duyệt, không thể chỉnh sửa Serial!'
      );
      return;
    }

    // Get quantity and product code from row data
    const quantity = rowData.Qty || 0;
    const productCode = rowData.ProductID || '';
    const serialIDsRaw = rowData.SerialNumber;
    const type = 2;

    // Validate quantity
    if (quantity <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập số lượng xuất lớn hơn 0 trước khi chọn Serial!'
      );
      return;
    }

    // Helper function to open modal with serial data
    const openModal = (existingSerials: { ID: number; Serial: string }[]) => {
      const modalRef = this.modalService.open(BillImportChoseSerialComponent, {
        size: 'md',
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });

      modalRef.componentInstance.quantity = quantity;
      modalRef.componentInstance.productCode = productCode;
      modalRef.componentInstance.existingSerials = existingSerials;
      modalRef.componentInstance.type = type;
      modalRef.componentInstance.dataBillDetail = rowData;

      // Handle modal result
      modalRef.result.then(
        (result) => {
          if (result) {
            // Reload detail data after serial is saved
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Đã lưu Serial thành công!'
            );
            // Optionally refresh the grid or specific row data
            if (this.id > 0) {
              this.getBillExportDetailID();
            }
          }
        },
        (reason) => {
          // Modal dismissed without saving
          console.log('Serial modal dismissed:', reason);
        }
      );
    };

    // Check if there are existing serial IDs to fetch
    if (serialIDsRaw && typeof serialIDsRaw === 'string') {
      const serialIDs = serialIDsRaw
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id) && id > 0);

      if (serialIDs.length === 0) {
        // No valid serial IDs, open modal with empty array
        openModal([]);
        return;
      }

      // Fetch serial details from API
      const payload = {
        Ids: serialIDs,
        Type: type,
      };

      this.billExportService.getSerialByIDs(payload).subscribe({
        next: (res) => {
          if (res?.status === 1 && res.data) {
            const existingSerials = res.data.map((item: any) => ({
              ID: item.ID,
              Serial: item.SerialNumber || item.Serial || '',
            }));
            openModal(existingSerials);
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Không tải được serial!'
            );
            console.error('Lỗi response:', res);
            openModal([]);
          }
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải serial!'
          );
          console.error('Lỗi API:', err);
          openModal([]);
        },
      });
    } else {
      // No serial IDs, open modal with empty array
      openModal([]);
    }
  }
  // /**
  //  * Close the current modal
  //  */
  // closeModal(): void {
  //   this.activeModal.close();
  // }
  //#endregion
}
