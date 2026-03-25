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
  OnChanges,
  SimpleChanges,
  Input,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  NgbActiveModal,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { SelectControlComponent } from '../select-control/select-control.component';
import { TabulatorPopupComponent } from '../../../../../../shared/components/tabulator-popup/tabulator-popup.component';
import { BillImportServiceService } from '../../../BillImport/bill-import-service/bill-import-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';

import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { PermissionService } from '../../../../../../services/permission.service';
import { BillImportChoseSerialService } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.service';
import { BillImportDetailComponent } from '../../../BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { BillImportDetailNewComponent } from '../../../BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';

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
  IsApproved?: boolean; // C# form line 114-117: Disable buttons when approved
  IsTransfer: boolean;
  TransferType?: number;
  ProductGroupTransferID?: number;
  BillImportTechID?: number;
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
    // ProductSaleDetailComponent,
    // SelectControlComponent,
    TabulatorPopupComponent,
    HasPermissionDirective,
    NzSpinModule,
    NzCheckboxModule,
  ],
  templateUrl: './bill-export-detail.component.html',
  styleUrl: './bill-export-detail.component.css',
})
export class BillExportDetailComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('tableBillExportDetails', { static: false })
  tableBillExportDetailsRef!: ElementRef;
  table_billExportDetail: any;
  @Input() dataTableBillExportDetail: any[] = [];
  private productAvailableInventoryMap: Map<number, number> = new Map();

  isLoading: boolean = false;
  isSaving: boolean = false;
  isFormDisabled: boolean = false;

  dataCbbUser: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  datCbbSupplierSale: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];
  dataCbbWareHouseTransfer: any[] = [];
  referenceLinks: any[] = [];

  dataProductSale: any = [];
  productOptions: any = [];
  projectOptions: any = [];
  billID: number = 0;
  deletedDetailIds: any[] = [];

  @Input() IDDetail: number = 0;
  @Input() checkConvert: any;
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;
  @Input() lstBillImportID: number[] = [];
  @Input() billImport: any;
  @Input() isAddExport: boolean = false;
  @Input() wareHouseCode: string = 'HN'; // ✅ Removed trailing spaces from default value
  @Input() isPOKH: boolean = false;
  @Input() customerID: number = 0;
  @Input() KhoTypeID: number = 0;
  @Input() saleAdminID: number = 0;
  @Input() supplierId: number = 0;
  @Input() warehouseTypeId: number = 0;
  @Input() lstTonCk: any[] = [];
  @Input() isBorrow: boolean = false;
  @Input() isFromProjectPartList: boolean = false; // Flag riêng cho luồng ProjectPartList → BillExport
  @Input() isFromWarehouseRelease: boolean = false; // Flag riêng cho luồng Warehouse Release Request → BillExport
  @Input() isReturnToSupplier: boolean = false; // Flag cho luồng Xuất trả NCC (Status = 5)
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
  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Popup state management
  showProductPopup: boolean = false;
  showProjectPopup: boolean = false;
  currentEditingCell: any = null;
  popupPosition: { top: string; left: string } = { top: '0px', left: '0px' };

  // Error popup state
  showErrorPopup: boolean = false;
  errorMessage: string = '';

  // Product popup columns
  productPopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã SP',
      field: 'ProductCode',
      width: 120,
      headerHozAlign: 'center',
    },
    {
      title: 'Mã nội bộ',
      field: 'ProductNewCode',
      width: 120,
      headerHozAlign: 'center',
    },
    {
      title: 'Tên SP',
      field: 'ProductName',
      width: 250,
      headerHozAlign: 'center',
    },
    { title: 'ĐVT', field: 'Unit', width: 80, headerHozAlign: 'center' },
    {
      title: 'SL tồn',
      field: 'TotalInventory',
      width: 100,
      headerHozAlign: 'center',
      hozAlign: 'right',
    },
  ];

  productSearchFields: string[] = [
    'ProductCode',
    'ProductNewCode',
    'ProductName',
  ];

  // Project popup columns
  projectPopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã dự án',
      field: 'ProjectCode',
      width: 150,
      headerHozAlign: 'center',
    },
    {
      title: 'Tên dự án',
      field: 'label',
      width: 300,
      headerHozAlign: 'center',
    },
  ];

  projectSearchFields: string[] = ['ProjectCode', 'label'];
  private originalInventoryRelatedData: Map<
    number,
    {
      ProductID: number;
      Qty: number;
      ProjectID: number;
      POKHDetailID: number;
    }
  > = new Map(); // Key = row ID hoặc index
  private productInventoryDetailMap: Map<number, {
    keepByProject: Map<number, number>,
    generalStock: number
  }> = new Map();

  private hasInventoryRelatedChange: boolean = false;

  // Flag để ngăn việc gọi lặp changeProductGroup khi đang load data edit
  private isLoadingEditData: boolean = false;

  // Flag để ngăn việc gọi lặp getBillExportDetailID
  private hasBillExportDetailLoaded: boolean = false;
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
    public activeModal: NgbActiveModal,
    private permissionService: PermissionService,
    private billImportChoseSerialService: BillImportChoseSerialService
  ) {
    this.validateForm = this.fb.group({
      Code: [{ value: '', disabled: true }], // Bỏ required vì Code disabled và được tự động generate
      UserID: [{ value: 0 }, [Validators.required, Validators.min(1)]],
      SenderID: [{ value: 0 }, [Validators.required, Validators.min(1)]],
      CustomerID: [0, [Validators.required, Validators.min(1)]],
      Address: [{ value: '', disabled: true }], // Bỏ required cho địa chỉ
      AddressStockID: [0],
      KhoTypeID: [0, [Validators.required, Validators.min(1)]],
      Status: [0, [Validators.required]],
      ProductType: [0], // Bỏ required và min(1) cho loại hàng
      CreatDate: [new Date(), [Validators.required]],
      RequestDate: [new Date()],
      SupplierID: [0],
      IsTransfer: [false],
      Reference: [''],
      WareHouseTranferID: [null],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wareHouseCode']) {
      const currValue = changes['wareHouseCode'].currentValue;

      // Normalize ngay khi có thay đổi từ component cha
      if (currValue && typeof currValue === 'string') {
        const trimmed = currValue.trim();
        if (trimmed) {
          this.wareHouseCode = trimmed;

          // Nếu đã có WarehouseID hoặc đang trong quá trình init, update lại
          // Delay một chút để đảm bảo các initialization khác đã hoàn thành
          setTimeout(() => {
            this.getWarehouseID();
          }, 50);
        }
      }
    }
  }

  ngOnInit(): void {
    // ✅ Normalize wareHouseCode ngay từ đầu để đảm bảo giá trị đúng (trim spaces)
    // Fix issue: giá trị mặc định 'HN  ' (có khoảng trắng) hoặc giá trị từ component cha có thể có khoảng trắng
    const trimmed = (this.wareHouseCode || '').trim();
    if (trimmed && trimmed !== '') {
      // Có giá trị hợp lệ, normalize nó
      this.wareHouseCode = trimmed;
    } else if (!this.wareHouseCode || this.wareHouseCode === '') {
      // Chỉ set default nếu thực sự không có giá trị
      // Nhưng delay một chút để đợi component cha set giá trị (nếu có)
      setTimeout(() => {
        const delayedValue = this.wareHouseCode;
        const delayedTrimmed = (delayedValue || '').trim();
        if (delayedTrimmed && delayedTrimmed !== '') {
          this.wareHouseCode = delayedTrimmed;
          this.getWarehouseID();
        } else {
          this.wareHouseCode = 'HN';
          this.getWarehouseID();
        }
      }, 100);
    }

    // Get WarehouseID from wareHouseCode - Delay để đợi @Input được set từ component cha
    // Nếu wareHouseCode đã có giá trị hợp lệ, gọi ngay
    if (
      this.wareHouseCode &&
      this.wareHouseCode.trim() !== '' &&
      this.wareHouseCode !== 'HN'
    ) {
      this.getWarehouseID();
    } else {
      // Delay để đợi component cha set giá trị
      setTimeout(() => {
        this.getWarehouseID();
      }, 150);
    }

    this.getDataCbbAdressStock();
    this.getDataCbbCustomer();
    this.getDataCbbProductGroup();
    this.getDataCbbSender();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
    this.getDataCbbWareHouseTransfer();

    this.loadOptionProject();
    this.validateForm
      .get('CustomerID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.changeCustomer();
      });
    this.validateForm
      .get('AddressStockID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onAddressStockChange(value);
      });
    this.validateForm
      .get('Status')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onStatusChange(value);
      });
    // if (this.checkConvert == true) {
    //   this.getNewCode();
    //   this.billImportService.getBillImportByID(this.id).subscribe({
    //     next: (res) => {
    //       if (res?.data) {
    //         const data = Array.isArray(res.data) ? res.data[0] : res.data;
    //         this.newBillExport = {
    //           TypeBill: false,
    //           Code: '',
    //           Address: '',
    //           CustomerID: data.CustomerID,
    //           UserID: data.ReciverID,
    //           SenderID: data.DeliverID,
    //           WarehouseType: '',
    //           GroupID: '',
    //           KhoTypeID: data.KhoTypeID,
    //           ProductType: 0,
    //           AddressStockID: 0,
    //           WarehouseID: data.WarehouseID,
    //           Status: 2,
    //           SupplierID: data.SupplierID,
    //           CreatDate: data.CreatDate ? new Date(data.CreatDate) : null,
    //           RequestDate: data.RequestDate ? new Date(data.RequestDate) : null,
    //         };
    //         this.validateForm.patchValue(this.newBillExport);
    //         this.changeProductGroup(this.newBillExport.KhoTypeID);
    //       } else {
    //         this.notification.warning(
    //           'Thông báo',
    //           res.message || 'Không thể lấy thông tin phiếu xuất!'
    //         );
    //       }
    //     },
    //     error: (err) => {
    //       this.notification.error(
    //         'Thông báo',
    //         'Có lỗi xảy ra khi lấy thông tin!'
    //       );
    //       console.error(err);
    //     },
    //   });
    // } else
    if (this.isCheckmode) {
      this.getBillExportByID();
    } else if (
      !this.isBorrow &&
      !this.isFromProjectPartList &&
      !this.isFromWarehouseRelease &&
      !this.isReturnToSupplier
    ) {
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
        IsTransfer: false,
      };
      this.validateForm.patchValue(this.newBillExport);
    }
    if (this.lstBillImportID && this.lstBillImportID.length > 0) {
      // Wait for product options to load before converting
      setTimeout(() => {
        this.getBillExportDetailConvert(this.lstBillImportID);
        this.validateForm.patchValue({
          KhoTypeID: this.billImport.KhoTypeID,
          UserID: this.billImport.ReciverID,
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
      !this.isBorrow && // Skip when isBorrow = true (Status will be set to 7 below)
      !this.isFromWarehouseRelease && // Skip when isFromWarehouseRelease = true (Status already set to 6)
      !this.isFromProjectPartList // Skip when isFromProjectPartList = true (Status already set to 6)
    ) {
      const previousStatus = this.newBillExport.Status; // Store original status
      this.validateForm.patchValue({ Status: 2 });
      this.newBillExport.Status = 2;

      if (
        previousStatus === 0 &&
        !this.KhoTypeID &&
        !this.isPOKH &&
        !this.isAddExport &&
        (!this.lstBillImportID || this.lstBillImportID.length === 0)
      ) {
        this.getNewCode();
      }
    }

    if (this.isFromProjectPartList) {
      this.validateForm.patchValue({
        Code: this.newBillExport.Code || '', // txtCode.Text = billExport.Code
        Address: this.newBillExport.Address || '', // txtAddress.Text = billExport.Address
        CustomerID: this.newBillExport.CustomerID || 0, // cboCustomer.EditValue = billExport.CustomerID
        UserID: this.newBillExport.UserID || 0, // cboUser.EditValue = billExport.UserID
        SenderID: this.newBillExport.SenderID || 0, // cboSender.EditValue = billExport.SenderID
        KhoTypeID: this.newBillExport.KhoTypeID || 0, // cbKhoType.EditValue = billExport.KhoTypeID
        ProductType: this.newBillExport.ProductType || 0, // cbProductType.EditValue = billExport.ProductType
        Status: this.newBillExport.Status || 6, // cboStatusNew.EditValue = 6 (when isPOKH)
        SupplierID: this.newBillExport.SupplierID || 0, // cboSupplier.EditValue = billExport.SupplierID
        RequestDate: this.newBillExport.RequestDate || new Date(), // dtpRequestDate.EditValue = billExport.RequestDate
        CreatDate: this.newBillExport.CreatDate || new Date(),
        WarehouseID: this.newBillExport.WarehouseID || 0,
        IsTransfer: this.newBillExport.IsTransfer || false,
      });

      // Sync back to model (important!)
      this.newBillExport.Status = this.newBillExport.Status || 6;

      if (
        this.newBillExport.KhoTypeID > 0 &&
        this.newBillExport.WarehouseID > 0 &&
        this.newBillExport.SenderID === 0
      ) {
        this.productSaleService
          .getdataProductGroupWareHouse(
            this.newBillExport.KhoTypeID,
            this.newBillExport.WarehouseID
          )
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (userId > 0) {
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              }
            },
            error: (err) => {
              console.error(
                'Error getting SenderID from ProductGroupWareHouse:',
                err
              );
            },
          });
      }

      // ✅ QUAN TRỌNG: Gọi changeProductGroup để load productOptions
      // patchValue có thể không trigger valueChanges nếu giá trị giống nhau hoặc timing issue
      if (this.newBillExport.KhoTypeID > 0) {
        this.changeProductGroup(this.newBillExport.KhoTypeID);
      }
    }
    // LUỒNG RIÊNG: Warehouse Release Request → BillExport
    else if (this.isFromWarehouseRelease) {
      // Bind ALL master fields from newBillExport (similar to ProjectPartList flow)
      this.validateForm.patchValue({
        Code: this.newBillExport.Code || '', // txtCode.Text
        Address: this.newBillExport.Address || '', // txtAddress.Text
        CustomerID: this.newBillExport.CustomerID || 0, // cboCustomer.EditValue
        UserID: this.newBillExport.UserID || 0, // cboUser.EditValue
        SenderID: this.newBillExport.SenderID || 0, // cboSender.EditValue
        KhoTypeID: this.newBillExport.KhoTypeID || 0, // cbKhoType.EditValue
        ProductType: this.newBillExport.ProductType || 1, // cbProductType.EditValue
        Status: this.newBillExport.Status || 6, // cboStatusNew.EditValue = 6
        SupplierID: this.newBillExport.SupplierID || 0, // cboSupplier.EditValue
        RequestDate: this.newBillExport.RequestDate || new Date(), // dtpRequestDate.EditValue
        CreatDate: this.newBillExport.CreatDate || new Date(),
        WarehouseID: this.newBillExport.WarehouseID || 0,
        IsTransfer: this.newBillExport.IsTransfer || false,
      });

      // Sync back to model
      this.newBillExport.Status = this.newBillExport.Status || 6;

      // Auto-fill SenderID from ProductGroupWareHouse if not provided
      if (
        this.newBillExport.KhoTypeID > 0 &&
        this.newBillExport.WarehouseID > 0 &&
        this.newBillExport.SenderID === 0
      ) {
        this.productSaleService
          .getdataProductGroupWareHouse(
            this.newBillExport.KhoTypeID,
            this.newBillExport.WarehouseID
          )
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (userId > 0) {
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              }
            },
            error: (err) => {
              console.error(
                'WarehouseRelease - Error getting SenderID from ProductGroupWareHouse:',
                err
              );
            },
          });
      }

      // Generate new code if Code is empty (similar to ProjectPartList flow)
      if (!this.newBillExport.Code || this.newBillExport.Code === '') {
        this.getNewCode();
      }

      // Load product options for KhoTypeID (CRITICAL: must call changeProductGroup to load products)
      if (this.newBillExport.KhoTypeID > 0) {
        this.changeProductGroup(this.newBillExport.KhoTypeID);
        // Note: updateTotalInventoryForExistingRows will be called from changeProductGroup after productOptions load
        // This is just a backup in case the one in changeProductGroup doesn't run (reduced timeout)
        setTimeout(() => {
          this.updateTotalInventoryForExistingRows();
        }, 300);
      }
    }
    // LUỒNG: Flow khác có KhoTypeID (backup)
    else if (this.KhoTypeID > 0 && !this.isBorrow) {
      this.validateForm.patchValue({
        Status: 6, // Yêu cầu xuất kho
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

    // LUỒNG: Xuất trả NCC (Status = 5)
    if (this.isReturnToSupplier) {
      this.validateForm.patchValue({
        Code: this.newBillExport.Code || '',
        Status: 5, // Xuất trả NCC
        SupplierID: this.newBillExport.SupplierID || 0,
        KhoTypeID: this.newBillExport.KhoTypeID || 0,
        WarehouseID: this.newBillExport.WarehouseID || 0,
        ProductType: 1, // Hàng thương mại
        RequestDate: this.newBillExport.RequestDate || new Date(),
        CreatDate: this.newBillExport.CreatDate || new Date(),
      });

      this.newBillExport.Status = 5;

      this.getNewCode();

      if (
        this.newBillExport.KhoTypeID > 0 &&
        this.newBillExport.WarehouseID > 0
      ) {
        this.productSaleService
          .getdataProductGroupWareHouse(
            this.newBillExport.KhoTypeID,
            this.newBillExport.WarehouseID
          )
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (userId > 0) {
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              }
            },
            error: (err) => {
              console.error(
                'Error getting SenderID from ProductGroupWareHouse:',
                err
              );
            },
          });
      }

      // Fill detail data from selectedList
      if (this.selectedList && this.selectedList.length > 0) {
        console.log(
          '🟠 [ngOnInit - isReturnToSupplier] selectedList:',
          this.selectedList
        );
        this.dataTableBillExportDetail = this.selectedList.map(
          (item: any, index: number) => {
            const mappedItem = {
              ID: item.ID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || '',
              ProductCode: item.ProductCode || '',
              ProductName: item.ProductName || '',
              Unit: item.Unit || '',
              TotalInventory: item.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: 0,
              ProductFullName: item.ProductFullName || '',
              Note: item.Note || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              SerialNumber: item.SerialNumber || '',
              BillImportDetailID: item.BillImportDetailID || 0,
              ProductGroupID: item.ProductGroupID || 0,
            };
            return mappedItem;
          }
        );
        console.log(
          '🟠 [ngOnInit - isReturnToSupplier] Final dataTableBillExportDetail:',
          this.dataTableBillExportDetail
        );
      }
    } else if (this.isBorrow) {
      // Set Status = 7 (Yêu cầu mượn) (C# line 145)
      this.newBillExport.Status = 7;
      this.newBillExport.KhoTypeID = this.KhoTypeID;

      this.validateForm.patchValue({
        Status: 7,
        KhoTypeID: this.KhoTypeID,
        RequestDate: new Date(),
      });

      // Get new code for borrow bill (after Status is set)
      this.getNewCode();

      // Get SenderID (người giao) from ProductGroupWareHouse based on KhoTypeID
      // For borrow bills, SenderID is always determined by KhoTypeID
      if (this.KhoTypeID > 0 && this.newBillExport.WarehouseID) {
        this.productSaleService
          .getdataProductGroupWareHouse(
            this.KhoTypeID,
            this.newBillExport.WarehouseID
          )
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              this.validateForm.patchValue({ SenderID: userId });
              this.newBillExport.SenderID = userId;
            },
            error: (err) => {
              console.error('Error getting SenderID:', err);
              this.validateForm.patchValue({ SenderID: 0 });
            },
          });
      }

      if (this.selectedList && this.selectedList.length > 0) {
        console.log(
          '🟠 [ngOnInit - isBorrow] selectedList:',
          this.selectedList
        );
        this.dataTableBillExportDetail = this.selectedList.map(
          (item: any, index: number) => {
            const mappedItem = {
              ID: item.ID || 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductSaleID || item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || '',
              ProductCode: item.ProductCode || '',
              ProductName: item.ProductName || '',
              Unit: item.Unit || '',
              TotalInventory: 0,
              Qty: item.Qty || 0, // User will fill this (default 0)
              QuantityRemain: 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport:
                item.ProjectCodeExport || item.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || item.ProjectName || '',
              ProductFullName: item.ProductFullName || '',
              Note: item.Note || '',
              UnitPricePOKH: item.UnitPricePOKH || 0,
              UnitPricePurchase: item.UnitPricePurchase || 0,
              BillCode: item.BillCode || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              POKHID: item.POKHID || 0,
              'Add Serial': item['Add Serial'] || '',
              ProductType: item.ProductType || 0,
              IsInvoice: item.IsInvoice || false,
              InvoiceNumber: item.InvoiceNumber || '',
              SerialNumber: item.SerialNumber || '',
              ReturnedStatus: item.ReturnedStatus || false,
              ProjectPartListID: item.ProjectPartListID || 0,
              TradePriceDetailID: item.TradePriceDetailID || 0,
              BillImportDetailID: item.BillImportDetailID || 0,
              ExpectReturnDate: item.ExpectReturnDate
                ? new Date(item.ExpectReturnDate)
                : new Date(),
              InventoryProjectIDs: item.InventoryProjectIDs || [],
              CustomerResponse: item.CustomerResponse || '',
              POKHDetailIDActual: item.POKHDetailIDActual || 0,
              PONumber: item.PONumber || '',
            };
            return mappedItem;
          }
        );
        console.log(
          '🟠 [ngOnInit - isBorrow] Final dataTableBillExportDetail:',
          this.dataTableBillExportDetail
        );

        // Trigger changeProductGroup to load product options (needed for dropdowns)
        // Then refresh table after product options are loaded
        if (this.KhoTypeID > 0) {
          this.changeProductGroup(this.KhoTypeID);

          // Refresh table after product options are loaded
          // Increase timeout to ensure changeProductGroup() completes
          setTimeout(() => {
            if (this.table_billExportDetail) {
              this.table_billExportDetail.redraw(true);
            }
            // Update TotalInventory from productOptions after they are loaded
            this.updateTotalInventoryForExistingRows();
          }, 800);
        }
      }
    }

    if (this.isAddExport) {
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
    this.validateForm
      .get('Status')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue: number) => {
        this.changeStatus();
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

  // ngAfterViewInit(): void {
  //   this.drawTable();

  //   setTimeout(() => {
  //     if (
  //       !this.isCheckmode &&
  //       (!this.newBillExport.Id || this.newBillExport.Id <= 0)
  //     ) {
  //       const tableData = this.table_billExportDetail?.getData() || [];
  //       if (tableData.length > 0) {
  //         tableData.forEach((row: any, index: number) => {
  //           this.loadInventoryProjectForRow(row);
  //         });
  //       }
  //     }

  //     // Update TotalInventory for rows if productOptions are already loaded
  //     // This is important for data coming from PO (warehouse-release-request)
  //     if (this.isFromWarehouseRelease || this.isFromProjectPartList) {
  //       // Only update if productOptions are loaded, otherwise it will be called from changeProductGroup
  //       if (this.productOptions.length > 0) {
  //         this.updateTotalInventoryForExistingRows();
  //       }
  //     }
  //   }, 1500); // Wait for data to load (increased timeout for data stability)
  // }
  ngAfterViewInit(): void {
    this.drawTable();
    // ✅ CHỈ GIỮ LẠI PHẦN UPDATE TotalInventory
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

  /**
   * Xử lý khi Status thay đổi - cập nhật visibility của cột "Ngày dự kiến trả"
   * Cột chỉ hiển thị khi Status = 0 (Mượn) hoặc Status = 7 (Yêu cầu mượn)
   */
  onStatusChange(value: number): void {
    // Cập nhật newBillExport.Status để đồng bộ
    this.newBillExport.Status = value;

    // Cập nhật visibility của cột "Ngày dự kiến trả" dựa trên Status mới
    const shouldShowExpectReturnDate = this.isBorrow || value === 0 || value === 7;

    if (this.table_billExportDetail) {
      const column = this.table_billExportDetail.getColumn('ExpectReturnDate');
      if (column) {
        if (shouldShowExpectReturnDate) {
          column.show();
        } else {
          column.hide();
        }
      }
    }
  }

  /**
   * Load danh sách link tham chiếu (Link Bill Import Transfer)
   * Từ logic WinForms: LinkBillImportTrasfer()
   * Nếu phiếu xuất có IsTransfer = true, lấy phiếu nhập liên quan
   */
  loadReferenceLinks(): void {
    this.referenceLinks = [];

    // Kiểm tra điều kiện: có ID và IsTransfer = true
    const billExportID = this.newBillExport.Id || 0;
    const isTransfer = this.validateForm.get('IsTransfer')?.value || false;

    if (billExportID <= 0 || !isTransfer) {
      return;
    }

    // Gọi API lấy phiếu nhập theo BillExportID
    this.billExportService.getBillImportByBillExportID(billExportID, 2).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res?.data) {
          const billImport = res.data;

          if (billImport && billImport.ID > 0) {
            const warehouse = this.dataCbbWareHouseTransfer.find((item: any) => item.ID === billImport.WarehouseID);
            // Tạo link tham chiếu
            const linkData = {
              id: billImport.ID,
              text: billImport.IsDeleted
                ? `${billImport.BillImportCode} - đã xóa`
                : billImport.BillImportCode,
              khoTypeID: billImport.KhoTypeID || 0,
              warehouseCode: warehouse?.Code || '',
              warehouseName: warehouse?.Name || '',
              isDeleted: billImport.IsDeleted || false,
            };

            this.referenceLinks = [linkData];
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading reference links:', err.error.message);
        this.referenceLinks = [];
      },
    });
  }

  /**
   * Xử lý khi click vào link tham chiếu - mở modal BillImportDetail
   * Từ logic WinForms: linkLabel.LinkClicked
   */
  onReferenceLinkClick(link: any): void {
    if (!link || link.isDeleted) {
      return; // Không mở nếu link đã bị xóa
    }

    // Mở modal BillImportDetail
    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-fullscreen',
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.id = link.id;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.WarehouseCode = link.warehouseCode;

    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        // Reload data nếu có thay đổi
        if (result === 'saved') {
          this.getBillExportByID();
          this.loadReferenceLinks();
        }
      },
      () => {
        // Dismissed - không làm gì
      }
    );
  }
  getBillExportByID() {
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

          // Patch thêm các trường chuyển kho nếu có
          this.validateForm.patchValue({
            IsTransfer: data.IsTransfer || false,
            WareHouseTranferID: data.WareHouseTranferID || null,
          });

          // Set flag để ngăn onKhoTypeChange gọi lại changeProductGroup
          this.isLoadingEditData = true;
          this.changeProductGroup(this.newBillExport.KhoTypeID);
          this.isLoadingEditData = false;

          this.changeCustomer();

          // Load reference links cho phiếu chuyển kho
          this.loadReferenceLinks();

          // Make Code and Address readonly and grayed out
          this.validateForm.get('Code')?.disable();
          this.validateForm.get('Address')?.disable();
          // C# form lines 114-117: Disable form if bill is approved
          // if (!(Global.IsAdmin && Global.EmployeeID <= 0))
          // Note: Simplified version - always disable if approved
          // TODO: Add admin/employee check if needed
          if (this.newBillExport.IsApproved) {
            this.isFormDisabled = true;
            this.validateForm.disable();
          }
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lấy thông tin phiếu xuất!'
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin!'
        );
        console.error(err);
        this.isLoading = false;
      },
    });
  }
  getBillExportDetailConvert(ids: number[] = [this.id]) {
    this.isLoading = true;

    this.billExportService.getBillImportDetail(ids).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];

          this.dataTableBillExportDetail = rawData.map((item: any) => {
            const productInfo =
              this.productOptions.find(
                (p: any) => p.value === item.ProductID
              ) || {};
            if (!productInfo.value && item.ProductID) {
              this.getProductById(item.ProductID);
            }
            const projectInfo =
              this.projectOptions.find(
                (p: any) => p.value === item.ProjectID
              ) || {};

            return {
              ID: 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode:
                item.ProductNewCode || productInfo.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo.ProductCode || '',
              ProductName: item.ProductName || productInfo.ProductName || '',
              Unit: item.Unit || productInfo.Unit || '',
              TotalInventory:
                item.TotalInventory || productInfo.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: item.QuantityRemain || 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport:
                item.ProjectCodeExport || projectInfo.ProjectCode || '',
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
              BillImportDetailID: item.BillImportDetailID || item.ID || 0,
              ExpectReturnDate: item.ExpectReturnDate
                ? new Date(item.ExpectReturnDate)
                : new Date(),
              InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
              CustomerResponse: item.CustomerResponse || '',
              POKHDetailIDActual: item.POKHDetailIDActual || 0,
              PONumber: item.PONumber || '',
            };
          });

          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData(
              this.dataTableBillExportDetail
            );
            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
          this.isLoading = false;
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không có dữ liệu chi tiết phiếu nhập để chuyển đổi!'
          );
          this.dataTableBillExportDetail = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu nhập!'
        );
        console.error(err);
        this.dataTableBillExportDetail = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
        this.isLoading = false;
      },
    });
  }
  getBillExportDetailID() {
    this.isLoading = true;
    this.billExportService.getBillExportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];

          this.dataTableBillExportDetail = rawData.map(
            (item: any, index: number) => {
              const productInfo =
                this.productOptions.find(
                  (p: any) => p.value === item.ProductID
                ) || {};
              const projectInfo =
                this.projectOptions.find(
                  (p: any) => p.value === item.ProjectID
                ) || {};

              // ✅ LẤY TotalInventory từ productOptions (đã được map từ TotalQuantityLast)
              const totalInventory =
                productInfo.TotalInventory ??
                productInfo.TotalQuantityLast ??
                0;

              const mappedItem = {
                ID: item.ID || 0,
                POKHDetailID: item.POKHDetailID || 0,
                ProductID: item.ProductID || 0,
                ProductNewCode:
                  item.ProductNewCode || productInfo.ProductNewCode || '',
                ProductCode: item.ProductCode || productInfo.ProductCode || '',
                ProductName: item.ProductName || productInfo.ProductName || '',
                Unit: item.Unit || productInfo.Unit || '',
                TotalInventory: totalInventory, // ✅ FIXED: Đã khai báo ở trên
                Qty: item.Qty || 0,
                QuantityRemain: item.QuantityRemain || 0,
                ProjectID: item.ProjectID || 0,
                ProjectCodeExport:
                  item.ProjectCodeExport || projectInfo.ProjectCode || '',
                ProjectNameText:
                  item.ProjectNameText || projectInfo.label || '',
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
                ExpectReturnDate: item.ExpectReturnDate
                  ? new Date(item.ExpectReturnDate)
                  : new Date(),
                InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
                CustomerResponse: item.CustomerResponse || '',
                POKHDetailIDActual: item.POKHDetailIDActual || 0,
                PONumber: item.PONumber || '',
              };

              // ✅ LƯU CHỈ CÁC FIELD LIÊN QUAN ĐẾN INVENTORY
              const rowKey = item.ID || index;
              this.originalInventoryRelatedData.set(rowKey, {
                ProductID: item.ProductID || 0,
                Qty: item.Qty || 0,
                ProjectID: item.ProjectID || 0,
                POKHDetailID: item.POKHDetailIDActual || item.POKHDetailID || 0,
              });

              return mappedItem;
            }
          );

          // ✅ RESET FLAG
          this.hasInventoryRelatedChange = false;

          if (this.table_billExportDetail) {
            const oldData = this.table_billExportDetail.getData();

            this.table_billExportDetail.replaceData(
              this.dataTableBillExportDetail
            );

            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
          this.isLoading = false;
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không có dữ liệu chi tiết phiếu xuất!'
          );
          this.dataTableBillExportDetail = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', err.error.message);
        console.error(err);
        this.dataTableBillExportDetail = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
        this.isLoading = false;
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
              // Hiển thị đầy đủ: ProductNewCode | ProductCode | ProductName khi popup
              label: `${product.ProductNewCode || ''} | ${product.ProductCode || ''
                } | ${product.ProductName || ''}`,
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
        this.notification.error('Thông báo', err.error.message);
      },
    });
  }
  // onRecheckQty() {
  //   // Get current data from table
  //   const currentData = this.table_billExportDetail?.getData();
  //   if (!currentData || currentData.length === 0) {
  //     this.notification.warning('Thông báo', 'Không có dữ liệu để tính lại!');
  //     return;
  //   }

  //   this.billExportService.recheckQty(currentData).subscribe({
  //     next: (res) => {
  //       if (res.status === 1) {
  //         this.dataTableBillExportDetail = res.data;
  //         // Update table with recalculated data
  //         if (this.table_billExportDetail) {
  //           this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
  //           this.notification.success('Thông báo', 'Đã cập nhật lại tổng số lượng!');
  //         }
  //         console.log('Đã cập nhật TotalQty:', this.dataTableBillExportDetail);
  //       } else {
  //         this.notification.warning('Thông báo', res.message || 'Không thể tính lại số lượng!');
  //       }
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tính lại tổng số lượng!');
  //     }
  //   });
  // }
  loadOptionProject() {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectOptions = projectData
            .filter(
              (project) =>
                project.ID !== null &&
                project.ID !== undefined &&
                project.ID !== 0
            )
            .map((project) => ({
              label: project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
            }));

          // Redraw table để update formatter với projectOptions mới
          if (this.table_billExportDetail) {
            this.table_billExportDetail.redraw(true);
          }
        } else {
          this.projectOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách dự án'
        );
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

    // Special handling for Kho Vision (ID = 4) - set minimum date
    if (ID === 4 && (!this.newBillExport.Id || this.newBillExport.Id <= 0)) {
    }

    // ✅ Normalize wareHouseCode: trim spaces and ensure it's not empty
    // This fixes the issue where default value 'HN  ' (with spaces) or component parent value might be used incorrectly
    const normalizedWareHouseCode = (this.wareHouseCode || '').trim() || 'HN';

    // Auto-set SenderID from ProductGroupWarehouse (matching C# cbKhoType_EditValueChanged)
    // Only when creating new bill, not when updating existing bill
    if (!this.newBillExport.Id || this.newBillExport.Id <= 0) {
      const warehouseID = this.newBillExport.WarehouseID || 0;

      if (warehouseID > 0) {
        this.productSaleService
          .getdataProductGroupWareHouse(ID, warehouseID)
          .subscribe({
            next: (res: any) => {
              if (res?.data && res.data.length > 0) {
                const userId = res.data[0].UserID || 0;
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              } else {
                const defaultSenderId = normalizedWareHouseCode.includes('HCM')
                  ? 88
                  : 0;
                this.validateForm.patchValue({ SenderID: defaultSenderId });
              }
            },
            error: (err) => {
              console.error(
                'Error getting SenderID from ProductGroupWarehouse:',
                err
              );
              const defaultSenderId = normalizedWareHouseCode.includes('HCM')
                ? 88
                : 0;
              this.validateForm.patchValue({ SenderID: defaultSenderId });
            },
          });
      }
    }

    // truyền đúng tham số theo BE: warehouseCode + productGroupID
    // ✅ Sử dụng normalizedWareHouseCode thay vì this.wareHouseCode trực tiếp
    this.billExportService
      .getOptionProduct(normalizedWareHouseCode, ID)
      .subscribe({
        next: (res: any) => {
          const productData = res.data;

          if (Array.isArray(productData)) {
            this.productOptions = productData
              .filter(
                (product) =>
                  product.ID !== null &&
                  product.ID !== undefined &&
                  product.ID !== 0
              )
              .map((product) => {
                const mappedProduct = {
                  label: `${product.ProductNewCode || ''} | ${product.ProductCode || ''
                    } | ${product.ProductName || ''}`,
                  value: product.ProductSaleID,
                  ProductCode: product.ProductCode,
                  TotalInventory: product.TotalQuantityLast,
                  ProductName: product.ProductName,
                  Unit: product.Unit,
                  Note: product.Note,
                  ProductID: product.ProductSaleID,
                  ProductNewCode: product.ProductNewCode,
                  TotalQuantityLast: product.TotalQuantityLast,
                };

                return mappedProduct;
              });
          } else {
            this.productOptions = [];
          }

          // Update TotalInventory for existing rows after productOptions are loaded
          // This is especially important for data coming from PO (warehouse-release-request)
          if (this.isFromWarehouseRelease || this.isFromProjectPartList) {
            // Use shorter timeout since productOptions are now loaded
            setTimeout(() => {
              this.updateTotalInventoryForExistingRows();
            }, 50);
          }

          if (this.checkConvert == true) {
            this.getBillExportDetailConvert([this.id]);
          } else if (this.isCheckmode && !this.isBorrow && !this.hasBillExportDetailLoaded) {
            // Skip reload when isBorrow = true to preserve selectedList data
            // Chỉ load 1 lần duy nhất khi edit
            this.hasBillExportDetailLoaded = true;
            this.getBillExportDetailID();
          }
        },
        error: (err: any) => {
          console.error('Error getting product options:', err);
          this.notification.error(
            'Thông báo',
            'Có lỗi khi tải danh sách sản phẩm!'
          );
          this.productOptions = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
        },
      });
  }

  getNewCode() {
    const status = this.validateForm.get('Status')?.value;
    this.billExportService
      .getNewCodeBillExport(this.newBillExport.Status)
      .subscribe({
        next: (res: any) => {
          this.newBillExport.Code = res?.data ?? '';
          this.validateForm.patchValue({ Code: this.newBillExport.Code });
        },
        error: (err: any) => {
          this.notification.error(
            'Thông báo',
            'Có lỗi xảy ra khi lấy mã phiếu'
          );
        },
      });
  }

  changeStatus() {
    // Chỉ lấy mã mới khi thêm mới, không lấy khi sửa phiếu
    if (!this.isCheckmode && (!this.newBillExport.Id || this.newBillExport.Id <= 0)) {
      this.getNewCode();
    }
  }

  /**
   * Handle KhoTypeID change - auto set SenderID from ProductGroupWarehouse
   * Matching C# cbKhoType_EditValueChanged logic
   */
  onKhoTypeChange(khoTypeID: number) {
    if (!khoTypeID || khoTypeID <= 0) {
      return;
    }

    // Nếu đang load data edit, bỏ qua để tránh gọi lặp changeProductGroup
    if (this.isLoadingEditData) {
      return;
    }

    // ✅ Clear product available inventory map khi thay đổi KhoTypeID
    // Vì khi đổi kho thì số lượng tồn kho sẽ khác, cần load lại
    this.clearProductAvailableInventoryMap();

    // Load products for this KhoTypeID
    this.changeProductGroup(khoTypeID);

    // Special handling for Kho Vision (ID = 4) - set minimum date
    if (
      khoTypeID === 4 &&
      (!this.newBillExport.Id || this.newBillExport.Id <= 0)
    ) {
    }

    // Only auto-set SenderID when creating new bill (not when updating existing bill)
    // C# line: if (billExport.ID > 0) return;
    if (this.newBillExport.Id && this.newBillExport.Id > 0) {
      return;
    }

    // Get SenderID from ProductGroupWarehouse
    const warehouseID = this.newBillExport.WarehouseID || 0;
    if (warehouseID <= 0) {
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
          } else {
            // Default SenderID logic (C# lines: else case)
            // For HCM warehouse: default to 88, for others: current user
            const defaultSenderId = this.wareHouseCode?.includes('HCM')
              ? 88
              : 0;
            this.validateForm.patchValue({ SenderID: defaultSenderId });
          }
        },
        error: (err) => {
          console.error(
            'Error getting SenderID from ProductGroupWarehouse:',
            err
          );
          const defaultSenderId = this.wareHouseCode?.includes('HCM') ? 88 : 0;
          this.validateForm.patchValue({ SenderID: defaultSenderId });
        },
      });
  }

  /**
   * Get WarehouseID from wareHouseCode
   * This is needed for getdataProductGroupWareHouse API call
   */
  getWarehouseID() {
    this.billExportService.getWarehouses().subscribe({
      next: (res: any) => {
        const list = res.data || [];

        // Find current warehouse by WarehouseCode (e.g., HN, HCM)
        const searchCode = String(this.wareHouseCode).toUpperCase().trim();

        const currentWarehouse = list.find(
          (item: any) =>
            String(item.WarehouseCode).toUpperCase().trim() === searchCode
        );

        if (currentWarehouse) {
          const warehouseID = currentWarehouse.ID || 0;
          this.newBillExport.WarehouseID = warehouseID;
        }
      },
      error: (err: any) => {
        console.error('Error getting warehouse:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy thông tin kho'
        );
      },
    });
  }

  /**
   * Lấy danh sách kho để chọn làm kho đích chuyển kho
   */
  getDataCbbWareHouseTransfer() {
    this.billExportService.getWarehouses().subscribe({
      next: (res: any) => {
        const list = res.data || [];
        this.dataCbbWareHouseTransfer = list.filter((item: any) => item.WarehouseCode !== this.wareHouseCode).map((item: any) => ({
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

  getDataCbbSupplierSale() {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
      },
    });
  }

  getDataCbbUser() {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbUser = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  getDataCbbSender() {
    this.billExportService.getCbbSender().subscribe({
      next: (res: any) => {
        this.dataCbbSender = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  getDataCbbAdressStock() {
    this.billExportService.getCbbAddressStock(this.customerID).subscribe({
      next: (res: any) => {
        this.dataCbbAdressStock = res.data;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  getDataCbbCustomer() {
    this.billExportService.getCbbCustomer().subscribe({
      next: (res: any) => {
        // Updated to match new API response structure
        this.dataCbbCustomer = Array.isArray(res.data) ? res.data : [];

        // Sau khi load xong customer data, trigger changeCustomer nếu đang ở flow ProjectPartList hoặc WarehouseRelease
        if (
          (this.isFromProjectPartList || this.isFromWarehouseRelease) &&
          this.newBillExport.CustomerID > 0
        ) {
          this.changeCustomer();
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  changeCustomer() {
    const id = this.validateForm.get('CustomerID')?.value;
    if (!id || id <= 0) {
      this.dataCbbAdressStock = [];
      this.validateForm.patchValue({ Address: '', AddressStockID: 0 });
      this.newBillExport.Address = '';
      return;
    }

    // Get customer address from dataCbbCustomer (data already loaded)
    const customer = this.dataCbbCustomer.find((x) => x.ID === id);
    if (customer && customer.Address) {
      this.newBillExport.Address = customer.Address;
      this.validateForm.patchValue({ Address: customer.Address });
    } else {
      this.newBillExport.Address = '';
      this.validateForm.patchValue({ Address: '' });
    }

    // Load AddressStock list for this customer
    this.billExportService.getCbbAddressStock(id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.dataCbbAdressStock = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Error getting AddressStock:', err.error.message);
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  onAddressStockChange(id: number) {
    // AddressStockID and Address are separate fields
    // AddressStockID is for delivery address selection
    // Address is for customer's main address (from Customer.Address)
    // So we don't update Address when AddressStockID changes
  }



  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
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

  async closeModal() {
    const isValid = await this.checkSerial();
    if (!isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Số lượng serial lớn hơn số lượng yêu cầu, vui lòng kiểm tra lại'
      );
      return;
    }

    this.activeModal.close();
  }

  getCustomerName(customerId: number): string {
    const customer = this.dataCbbCustomer.find((c) => c.ID === customerId);
    return customer ? customer.CustomerName : '';
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.dataCbbSupplier.find((s) => s.ID === supplierId);
    return supplier ? supplier.NameNCC : '';
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

      // ✅ THÊM ROW = THAY ĐỔI INVENTORY
      this.hasInventoryRelatedChange = true;
      console.log('🟡 Row added - inventory related change');
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

  // Toggle Product Popup
  toggleProductPopup(cell: any) {
    this.currentEditingCell = cell;
    const cellElement = cell.getElement();
    const rect = cellElement.getBoundingClientRect();

    // Calculate position
    const viewportHeight = window.innerHeight;
    const popupHeight = 350;
    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow >= popupHeight) {
      this.popupPosition = {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    } else {
      this.popupPosition = {
        top: `${rect.top + window.scrollY - popupHeight}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    }

    this.showProductPopup = true;
  }

  // Toggle Project Popup
  toggleProjectPopup(cell: any) {
    this.currentEditingCell = cell;
    const cellElement = cell.getElement();
    const rect = cellElement.getBoundingClientRect();

    // Calculate position
    const viewportHeight = window.innerHeight;
    const popupHeight = 350;
    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow >= popupHeight) {
      this.popupPosition = {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    } else {
      this.popupPosition = {
        top: `${rect.top + window.scrollY - popupHeight}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    }

    this.showProjectPopup = true;
  }

  onProductSelected(selectedProduct: any) {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const rowData = row.getData();
    const rowKey = rowData.ID || rowData.ChildID || row.getPosition();

    const oldProductID = rowData.ProductID;
    const newProductID =
      selectedProduct.value ||
      selectedProduct.ProductID ||
      selectedProduct.ProductSaleID ||
      selectedProduct.ID;

    // ✅ CHỈ ĐÁNH DẤU NẾU PRODUCTID THAY ĐỔI
    const original = this.originalInventoryRelatedData.get(rowKey);
    if (original && original.ProductID !== newProductID) {
      this.hasInventoryRelatedChange = true;
      console.log('🟡 ProductID changed:', {
        rowKey,
        old: original.ProductID,
        new: newProductID,
      });
    }

    let totalInventory =
      selectedProduct.TotalInventory ?? selectedProduct.TotalQuantityLast ?? 0;

    if (!totalInventory || totalInventory === 0) {
      const fullProduct = this.productOptions.find(
        (p: any) =>
          p.value === newProductID ||
          p.ProductID === newProductID ||
          p.ProductSaleID === newProductID
      );
      if (fullProduct) {
        totalInventory =
          fullProduct.TotalInventory ?? fullProduct.TotalQuantityLast ?? 0;
      }
    }

    row.update({
      ProductID: newProductID,
      ProductCode: selectedProduct.ProductCode || '',
      ProductNewCode: selectedProduct.ProductNewCode || '',
      Unit: selectedProduct.Unit || '',
      TotalInventory: totalInventory,
      ProductName: selectedProduct.ProductName || '',
      // ✅ XÓA ChosenInventoryProject KHI PRODUCT THAY ĐỔI
      ChosenInventoryProject: '',
      ProductCodeExport: '',
    });

    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  // Handle Project Selection
  onProjectSelected(selectedProject: any) {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const rowData = row.getData();
    const rowKey = rowData.ID || rowData.ChildID || row.getPosition();

    const oldProjectID = rowData.ProjectID;
    const newProjectID = selectedProject.value || selectedProject.ID;

    // ✅ CHỈ ĐÁNH DẤU NẾU PROJECTID THAY ĐỔI
    const original = this.originalInventoryRelatedData.get(rowKey);
    if (original && original.ProjectID !== newProjectID) {
      this.hasInventoryRelatedChange = true;
      console.log('🟡 ProjectID changed:', {
        rowKey,
        old: original.ProjectID,
        new: newProjectID,
      });
    }

    const projectLabel =
      selectedProject.label || selectedProject.ProjectName || '';
    row.update({
      ProjectID: newProjectID,
      ProjectCodeExport: selectedProject.ProjectCode || '',
      InventoryProjectIDs: [newProjectID],
      ProjectName: projectLabel,
      ProjectNameText: projectLabel,
      // ✅ XÓA ChosenInventoryProject KHI PROJECT THAY ĐỔI
      ChosenInventoryProject: '',
      ProductCodeExport: '',
    });

    this.showProjectPopup = false;
    this.currentEditingCell = null;
  }

  // Handle Popup Close
  onPopupClosed() {
    this.showProductPopup = false;
    this.showProjectPopup = false;
    this.currentEditingCell = null;
  }

  // Handle Product Cleared - xóa giá trị sản phẩm đã chọn
  onProductCleared() {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const rowData = row.getData();
    const rowKey = rowData.ID || rowData.ChildID || row.getPosition();

    // Đánh dấu có thay đổi liên quan đến inventory
    const original = this.originalInventoryRelatedData.get(rowKey);
    if (original && original.ProductID !== 0) {
      this.hasInventoryRelatedChange = true;
      console.log('🟡 Product cleared:', { rowKey, oldProductID: original.ProductID });
    }

    // Xóa các giá trị liên quan đến sản phẩm
    row.update({
      ProductID: 0,
      ProductCode: '',
      ProductNewCode: '',
      ProductName: '',
      Unit: '',
      TotalInventory: 0,
      ChosenInventoryProject: '',
      ProductCodeExport: '',
    });

    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  // Handle Project Cleared - xóa giá trị dự án đã chọn
  onProjectCleared() {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const rowData = row.getData();
    const rowKey = rowData.ID || rowData.ChildID || row.getPosition();

    // Đánh dấu có thay đổi liên quan đến inventory
    const original = this.originalInventoryRelatedData.get(rowKey);
    if (original && original.ProjectID !== 0) {
      this.hasInventoryRelatedChange = true;
      console.log('🟡 Project cleared:', { rowKey, oldProjectID: original.ProjectID });
    }

    // Xóa các giá trị liên quan đến dự án
    row.update({
      ProjectID: 0,
      ProjectCodeExport: '',
      ProjectName: '',
      ProjectNameText: '',
      InventoryProjectIDs: [],
      ChosenInventoryProject: '',
      ProductCodeExport: '',
    });

    this.showProjectPopup = false;
    this.currentEditingCell = null;
  }

  // Method to show error notification popup
  showErrorNotification(message: string): void {
    this.errorMessage = message;
    this.showErrorPopup = true;
  }

  // Method to close error notification popup
  closeErrorPopup(): void {
    this.showErrorPopup = false;
    this.errorMessage = '';
  }

  /**
   * Update TotalInventory for existing rows in table based on productOptions
   * This is called after productOptions are loaded to ensure TotalInventory is filled correctly
   * Especially important for data coming from PO (warehouse-release-request)
   * Made public so it can be called from warehouse-release-request after data is set
   */
  private updateTotalInventoryCallCount = 0;

  public updateTotalInventoryForExistingRows(): void {
    this.updateTotalInventoryCallCount++;
    const callId = this.updateTotalInventoryCallCount;
    const timestamp = new Date().toISOString();
    console.log(
      `\n🟡 [updateTotalInventoryForExistingRows #${callId}] START at ${timestamp}`
    );
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] Call stack:`,
      new Error().stack?.split('\n').slice(1, 4).join('\n')
    );
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] table_billExportDetail exists:`,
      !!this.table_billExportDetail
    );
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] productOptions:`,
      this.productOptions.length
    );

    if (!this.table_billExportDetail || this.productOptions.length === 0) {
      console.log(
        `⚠️ [updateTotalInventoryForExistingRows #${callId}] EARLY RETURN - Missing table or productOptions`
      );
      return;
    }

    const tableData = this.table_billExportDetail.getData() || [];
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] tableData length:`,
      tableData.length
    );
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] tableData:`,
      tableData
    );

    if (tableData.length === 0) {
      console.log(
        `⚠️ [updateTotalInventoryForExistingRows #${callId}] EARLY RETURN - No table data`
      );
      return;
    }

    // ✅ LUÔN LUÔN lấy TotalInventory từ productOptions (giá trị mới nhất từ API)
    // Không check allRowsHaveInventory để đảm bảo luôn update từ productOptions
    // Điều này đảm bảo số lượng tồn kho luôn chính xác và mới nhất
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] Will update all rows from productOptions to get latest TotalInventory`
    );

    let hasUpdates = false;
    const allRows = this.table_billExportDetail.getRows();
    console.log(
      `🟡 [updateTotalInventoryForExistingRows #${callId}] allRows length:`,
      allRows.length
    );

    // Update each row directly using index to avoid matching issues with duplicate ProductIDs
    tableData.forEach((row: any, index: number) => {
      const productID = row.ProductID || 0;
      console.log(
        `\n🔵 [updateTotalInventoryForExistingRows #${callId}] Processing row ${index}:`,
        {
          ProductID: productID,
          ProductCode: row.ProductCode,
          ProductNewCode: row.ProductNewCode,
          CurrentTotalInventory: row.TotalInventory,
        }
      );

      if (!productID || productID <= 0) {
        console.log(
          `⚠️ [updateTotalInventoryForExistingRows #${callId}] Row ${index} - SKIP: Invalid ProductID`
        );
        return;
      }

      // ✅ LUÔN LUÔN lấy TotalInventory từ productOptions (giá trị mới nhất từ API)
      // Không dùng giá trị cũ từ data để đảm bảo luôn có số lượng tồn kho chính xác
      const currentInventory = parseFloat(String(row.TotalInventory || 0));
      const isWarehouseReleaseFlow =
        this.isFromWarehouseRelease || this.isFromProjectPartList;

      // Log để debug
      if (currentInventory > 0) {
        console.log(
          `🟡 [updateTotalInventoryForExistingRows #${callId}] Row ${index} - Current inventory is ${currentInventory}, will update from productOptions to get latest value`
        );
      }

      // Find product in productOptions
      const product = this.productOptions.find(
        (p: any) =>
          p.value === productID ||
          p.ProductID === productID ||
          p.ProductSaleID === productID
      );

      console.log(
        `🔍 [updateTotalInventoryForExistingRows #${callId}] Row ${index} - Found by ProductID:`,
        product
      );

      const finalProduct =
        product ||
        this.productOptions.find(
          (p: any) =>
            p.ProductCode === row.ProductCode ||
            p.ProductNewCode === row.ProductNewCode
        );

      console.log(
        `🔍 [updateTotalInventoryForExistingRows #${callId}] Row ${index} - Final product found:`,
        finalProduct
      );

      if (finalProduct) {
        const newTotalInventory =
          finalProduct.TotalInventory || finalProduct.TotalQuantityLast || 0;
        console.log(
          `✅ [updateTotalInventoryForExistingRows #${callId}] Row ${index} - Updating TotalInventory:`,
          {
            from: row.TotalInventory,
            to: newTotalInventory,
            source: {
              TotalInventory: finalProduct.TotalInventory,
              TotalQuantityLast: finalProduct.TotalQuantityLast,
            },
          }
        );

        if (allRows[index]) {
          // Get current value before update to verify
          const beforeUpdate = allRows[index].getData().TotalInventory;
          allRows[index].update({ TotalInventory: newTotalInventory });
          // Verify after update
          const afterUpdate = allRows[index].getData().TotalInventory;
          hasUpdates = true;
          console.log(
            `✅ [updateTotalInventoryForExistingRows #${callId}] Row ${index} - UPDATE SUCCESS: ${beforeUpdate} → ${afterUpdate}`
          );
        } else {
          console.log(
            `❌ [updateTotalInventoryForExistingRows #${callId}] Row ${index} - UPDATE FAILED: Row not found at index`
          );
        }
      } else {
        console.log(
          `❌ [updateTotalInventoryForExistingRows #${callId}] Row ${index} - UPDATE FAILED: Product not found in productOptions`
        );
        console.log(
          `   Available productOptions:`,
          this.productOptions.map((p: any) => ({
            ProductID: p.ProductID,
            ProductCode: p.ProductCode,
            ProductNewCode: p.ProductNewCode,
            TotalInventory: p.TotalInventory,
          }))
        );
      }
    });

    // Redraw table to reflect changes
    if (hasUpdates) {
      console.log(
        `✅ [updateTotalInventoryForExistingRows #${callId}] Redrawing table`
      );
      this.table_billExportDetail.redraw(true);

      // Verify final values after redraw
      setTimeout(() => {
        const finalData = this.table_billExportDetail.getData() || [];
        console.log(
          `🔍 [updateTotalInventoryForExistingRows #${callId}] Final verification after redraw:`,
          finalData.map((r: any) => ({
            ProductID: r.ProductID,
            ProductCode: r.ProductCode,
            TotalInventory: r.TotalInventory,
          }))
        );
      }, 100);
    } else {
    }
  }

  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    if (rowData.ID == null || rowData.ID <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Các mã sản phẩm thêm mới cần lưu trước khi chọn serial!'
      );
      return;
    }
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
    modalRef.componentInstance.dataBillDetail = rowData;
    console.log('2', rowData);

    // modalRef.result.then(
    //   (serials: { ID: number; Serial: string }[]) => {
    //     if (Array.isArray(serials) && serials.length > 0) {
    //       const serialsID = serials.map((s) => s.ID).join(',');
    //       row.update({ SerialNumber: serialsID });
    //       this.notification.success('Thông báo', 'Cập nhật serial thành công!');
    //     } else {
    //       this.notification.error('Thông báo', 'Dữ liệu serial không hợp lệ!');
    //     }
    //   },
    //   (reason) => {}
    // );
  }

  drawTable() {
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
      if (!this.tableBillExportDetailsRef?.nativeElement) {
        return;
      }
      this.table_billExportDetail = new Tabulator(
        this.tableBillExportDetailsRef.nativeElement,
        {
          data: this.dataTableBillExportDetail,
          layout: 'fitDataFill',
          height: '38vh',
          pagination: false,
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 1,
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
              formatter: () =>
                `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
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

                      // ✅ XÓA ROW = THAY ĐỔI INVENTORY
                      this.hasInventoryRelatedChange = true;
                      console.log('🟡 Row deleted - inventory related change');
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
            {
              title: 'ID',
              field: 'ID',
              hozAlign: 'center',
              width: 60,
              headerSort: false,
              visible: false,
            },
            {
              title: 'Mã nội bộ',
              field: 'ProductNewCode',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Mã sản phẩm',
              field: 'ProductID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 450,
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn sản phẩm</p> <i class="fas fa-angle-down"></i></div>';
                }

                // Lấy ProductCode và ProductNewCode từ data của row (đã được bind sẵn)
                const rowData = cell.getRow().getData();
                let productCode = rowData['ProductCode'] || '';
                let productNewCode = rowData['ProductNewCode'] || '';

                // Nếu không có trong rowData, tìm trong productOptions
                if (!productCode && !productNewCode) {
                  const product = this.productOptions.find(
                    (p: any) => p.value === val
                  );
                  productCode = product ? product.ProductCode : '';
                  productNewCode = product ? product.ProductNewCode : '';
                }

                // Chỉ hiển thị ProductCode khi đã chọn
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productCode}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellClick: (e, cell) => {
                this.toggleProductPopup(cell);
              },
            },
            {
              title: 'SL tồn',
              field: 'TotalInventory',
              hozAlign: 'right',
              headerHozAlign: 'center',
            },
            {
              title: 'Mã sp theo dự án',
              field: 'ProductFullName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              hozAlign: 'center',
              headerHozAlign: 'center',
            },
            {
              title: 'ĐVT',
              field: 'Unit',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'SL xuất',
              field: 'Qty',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'input',
              cellEdited: (cell) => {
                const row = cell.getRow();
                const rowData = row.getData();
                const rowKey =
                  rowData['ID'] || rowData['ChildID'] || row.getPosition();

                // ✅ KIỂM TRA XEM QTY CÓ THAY ĐỔI KHÔNG
                const original = this.originalInventoryRelatedData.get(rowKey);
                const newQty = parseFloat(rowData['Qty'] || 0);

                if (original && original.Qty !== newQty) {
                  this.hasInventoryRelatedChange = true;
                  console.log('🟡 Qty changed:', {
                    rowKey,
                    old: original.Qty,
                    new: newQty,
                  });
                }

                // ✅ XÓA ChosenInventoryProject KHI QTY THAY ĐỔI
                row.update({
                  ChosenInventoryProject: '',
                  ProductCodeExport: '',
                });
              },
            },
            {
              title: 'SL còn lại',
              field: 'QuantityRemain',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Dự án',
              field: 'ProjectID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 200,
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }

                // Lấy ProjectName từ row data (đã được cập nhật khi chọn)
                const rowData = cell.getRow().getData();
                let projectName =
                  rowData['ProjectName'] || rowData['ProjectNameText'] || '';

                // Nếu không có ProjectName trong row data, tìm trong projectOptions bằng ProjectID
                if (!projectName) {
                  const project = this.projectOptions.find(
                    (p: any) => p.value === val
                  );
                  projectName = project ? project.label : '';
                }

                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectName || 'Chọn dự án'
                  }</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellClick: (e, cell) => {
                this.toggleProjectPopup(cell);
              },
            },
            {
              title: 'Mã dự án',
              field: 'ProjectCodeExport',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Ghi chú (PO)',
              field: 'Note',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Ngày dự kiến trả',
              field: 'ExpectReturnDate',
              hozAlign: 'left',
              headerHozAlign: 'center',
              visible: this.isBorrow || this.newBillExport.Status === 0 || this.newBillExport.Status === 7,
              formatter: (cell) => {
                const value = cell.getValue();
                if (!value) return '';
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  return '';
                }
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              },
              editor: (cell, onRendered, success, cancel) => {
                const input = document.createElement('input');
                input.type = 'date';
                const currentValue = cell.getValue();
                if (currentValue) {
                  const date = new Date(currentValue);
                  input.value = date.toISOString().split('T')[0];
                }
                input.style.width = '100%';
                input.style.boxSizing = 'border-box';

                let isProcessed = false;

                const submitValue = () => {
                  if (!isProcessed) {
                    isProcessed = true;
                    success(input.value ? new Date(input.value) : null);
                  }
                };

                onRendered(() => {
                  input.focus();
                });

                input.addEventListener('change', () => {
                  submitValue();
                });

                input.addEventListener('blur', () => {
                  submitValue();
                });

                input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') {
                    submitValue();
                  }
                  if (e.key === 'Escape') {
                    if (!isProcessed) {
                      isProcessed = true;
                      cancel(cell.getValue());
                    }
                  }
                });
                return input;
              },
            },
            {
              title: 'Đơn giá bán',
              field: 'UnitPricePOKH',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Đơn giá mua',
              field: 'UnitPricePurchase',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Mã đơn hàng',
              field: 'BillCode',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Thông số kỹ thuật',
              field: 'Specifications',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Nhóm',
              field: 'GroupExport',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Phản hồi của khách hàng',
              field: 'CustomerResponse',
              headerHozAlign: 'center',
              hozAlign: 'left',
              editor: 'input',
            },
            {
              title: 'Người nhận',
              field: 'UserReceiver',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Mã sp xuất dự án',
              field: 'ProductFullName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'POKHID',
              field: 'POKHID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              visible: false,
            },
            {
              title: 'Serial',
              visible: false,
              field: 'SerialNumber',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'POKHDetailIDActual',
              field: 'POKHDetailIDActual',
              hozAlign: 'left',
              headerHozAlign: 'center',
              visible: false,
            },
            {
              title: 'Tồn dự án xuất',
              field: 'ChosenInventoryProject',
              hozAlign: 'left',
              headerHozAlign: 'center',
              visible: false,
              width: 150,
              tooltip:
                'Định dạng: "inventoryProjectID-quantity;inventoryProjectID-quantity". Ví dụ: "123-10;456-5"',
            },
            {
              title: 'Add Serial',
              field: 'addRow',
              hozAlign: 'center',
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
                  this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Vui lòng nhập số lượng xuất lớn hơn 0 trước khi chọn Serial!'
                  );
                  return;
                }

                if (serialIDsRaw && typeof serialIDsRaw === 'string') {
                  const serialIDs = serialIDsRaw
                    .split(',')
                    .map((id: string) => parseInt(id.trim())) // Xử lý khoảng trắng
                    .filter((id: number) => !isNaN(id) && id > 0);

                  if (serialIDs.length === 0) {
                    this.openSerialModal(
                      rowData,
                      row,
                      quantity,
                      productCode,
                      []
                    );
                    return;
                  }

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
                        this.openSerialModal(
                          rowData,
                          row,
                          quantity,
                          productCode,
                          existingSerials
                        );
                      } else {
                        this.notification.error(
                          NOTIFICATION_TITLE.error,
                          'Không tải được serial!'
                        );
                        console.error('Lỗi response:', res);
                        this.openSerialModal(
                          rowData,
                          row,
                          quantity,
                          productCode,
                          []
                        );
                      }
                    },
                    error: (err) => {
                      this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Lỗi khi tải serial!'
                      );
                      console.error('Lỗi API:', err);
                      this.openSerialModal(
                        rowData,
                        row,
                        quantity,
                        productCode,
                        []
                      );
                    },
                  });
                } else {
                  this.openSerialModal(rowData, row, quantity, productCode, []);
                }
              },
            },
          ],
        }
      );
    }
  }

  private validateFormData(): { isValid: boolean; message: string } {
    // Sử dụng getRawValue() để lấy cả disabled fields (Code, SenderID, Address)
    const formValues = this.validateForm.getRawValue();
    const status = formValues.Status;

    // Validate Code (Bill Number)
    if (!formValues.Code || formValues.Code.trim() === '') {
      return { isValid: false, message: 'Xin hãy điền số phiếu.' };
    }

    // Validate Customer (required)
    if (!formValues.CustomerID || formValues.CustomerID <= 0) {
      return {
        isValid: false,
        message: 'Xin hãy chọn Khách hàng!',
      };
    }

    // Validate User (Receiver)
    if (!formValues.UserID || formValues.UserID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn nhân viên.' };
    }

    // Validate Warehouse Type
    if (!formValues.KhoTypeID || formValues.KhoTypeID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn kho quản lý.' };
    }

    // Validate Sender
    if (!formValues.SenderID || formValues.SenderID <= 0) {
      return { isValid: false, message: 'Xin hãy chọn người giao.' };
    }

    // Validate Status
    if (status === null || status === undefined || status < 0) {
      return { isValid: false, message: 'Xin hãy chọn trạng thái.' };
    }

    // Validate Creation Date (except for status 6 - Request export)
    if (status !== 6 && !formValues.CreatDate) {
      return { isValid: false, message: 'Xin hãy chọn Ngày xuất!' };
    }

    // Validate table data
    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) {
      return {
        isValid: false,
        message: 'Vui lòng thêm ít nhất một sản phẩm vào bảng!',
      };
    }

    // Validate details for borrow status (0 - Mượn, 7 - Yêu cầu mượn)
    if (status === 0 || status === 7) {
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];

        // Check ExpectReturnDate
        if (!row.ExpectReturnDate) {
          return {
            isValid: false,
            message: `Vui lòng nhập Ngày dự kiến trả cho dòng ${i + 1}!`,
          };
        }

        // Check ProjectID
        if (!row.ProjectID || row.ProjectID <= 0) {
          return {
            isValid: false,
            message: `Vui lòng nhập Dự án cho dòng ${i + 1}!`,
          };
        }
      }
    }

    // Validate each detail row has required fields
    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];

      if (!row.ProductID || row.ProductID <= 0) {
        return {
          isValid: false,
          message: `Vui lòng chọn sản phẩm cho dòng ${i + 1}!`,
        };
      }

      if (!row.Qty || parseFloat(row.Qty) <= 0) {
        return {
          isValid: false,
          message: `Vui lòng nhập số lượng xuất cho dòng ${i + 1}!`,
        };
      }
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validate inventory/stock based on desktop form ValidateKeep logic
   * Only validates for status 2 (Exported) and 6 (Request Export)
   * Groups by ProductID, ProjectID, POKHDetailID and checks stock availability
   */
  // private validateInventoryStock(): { isValid: boolean; message: string } {
  //   const status = this.validateForm.value.Status;

  //   // Only validate for status 2 (Exported) or 6 (Request export)
  //   if (status !== 2 && status !== 6) {
  //     return { isValid: true, message: '' };
  //   }

  //   const tableData = this.table_billExportDetail?.getData() || [];
  //   if (tableData.length === 0) {
  //     return { isValid: false, message: 'Không có dữ liệu để xuất kho!' };
  //   }

  //   const grouped = new Map<string, any>();

  //   tableData.forEach((row: any) => {
  //     const pokhDetailId = row.POKHDetailIDActual || row.POKHDetailID || 0;
  //     const projectId = pokhDetailId > 0 ? 0 : row.ProjectID || 0;
  //     const key = `${row.ProductID}_${projectId}_${pokhDetailId}`;

  //     if (!grouped.has(key)) {
  //       grouped.set(key, {
  //         ProductID: row.ProductID,
  //         ProjectID: projectId,
  //         POKHDetailID: pokhDetailId,
  //         ProductNewCode: row.ProductNewCode || '',
  //         ProductCode: row.ProductCode || '',
  //         TotalQty: 0,
  //         Unit: row.Unit || '',
  //         TotalInventory: row.TotalInventory || 0,
  //       });
  //     }

  //     const group = grouped.get(key);
  //     group.TotalQty += parseFloat(row.Qty || 0);
  //   });

  //   // Thu thập tất cả các sản phẩm không đủ số lượng
  //   const insufficientProducts: string[] = [];

  //   for (const [key, group] of grouped.entries()) {
  //     if (group.TotalQty <= 0) {
  //       continue;
  //     }

  //     const unitName = (group.Unit || '').toLowerCase().trim();
  //     if (unitName === 'm' || unitName === 'mét' || unitName === 'met') {
  //       continue;
  //     }

  //     if (
  //       group.TotalInventory !== undefined &&
  //       group.TotalInventory < group.TotalQty
  //     ) {
  //       const productDisplay =
  //         group.ProductNewCode || group.ProductCode || `ID:${group.ProductID}`;
  //       const productMessage = `[${productDisplay}] - SL xuất: ${group.TotalQty.toFixed(
  //         2
  //       )}, SL tồn: ${group.TotalInventory.toFixed(2)}`;
  //       insufficientProducts.push(productMessage);
  //     }
  //   }

  //   // Nếu có sản phẩm không đủ, gộp tất cả vào 1 message
  //   if (insufficientProducts.length > 0) {
  //     const message =
  //       'Số lượng tồn kho không đủ cho các sản phẩm sau:\n\n' +
  //       insufficientProducts.join('\n');
  //     return {
  //       isValid: false,
  //       message: message,
  //     };
  //   }

  //   return { isValid: true, message: '' };
  // }
  private validateInventoryStock(): { isValid: boolean; message: string } {
    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) return { isValid: true, message: '' };

    const insufficientMessages: string[] = [];

    // Bước 1: Gom nhóm yêu cầu xuất từ Grid theo ProductID
    // productUsage: ProductID -> { totalRequested, projectDemands }
    const productUsage = new Map<number, {
      totalRequested: number,
      projectDemands: Map<number, number>
    }>();

    tableData.forEach((row: any) => {
      const pId = Number(row.ProductID);
      if (pId <= 0) return;

      const qty = parseFloat(row.Qty || 0);
      const projId = Number(row.ProjectID || 0);

      if (!productUsage.has(pId)) {
        productUsage.set(pId, { totalRequested: 0, projectDemands: new Map() });
      }

      const usage = productUsage.get(pId)!;
      usage.totalRequested += qty;

      // Lưu lượng yêu cầu riêng cho từng dự án trong phiếu này
      const currentProjQty = usage.projectDemands.get(projId) || 0;
      usage.projectDemands.set(projId, currentProjQty + qty);
    });

    // Bước 2: Đối soát với dữ liệu đã nạp trong Map
    productUsage.forEach((usage, pId) => {
      const invInfo = this.productInventoryDetailMap.get(pId);
      if (!invInfo) {
        insufficientMessages.push(`Sản phẩm ID ${pId}: Chưa nạp được dữ liệu tồn kho.`);
        return;
      }

      // Công thức WinForms: Tổng tồn khả dụng = Tồn CK + Tổng các lô giữ của các dự án có trong phiếu
      let totalKeepAvailable = 0;
      usage.projectDemands.forEach((qtyNeeded, projId) => {
        // Lấy hàng giữ cho dự án này (nếu có)
        totalKeepAvailable += (invInfo.keepByProject.get(projId) || 0);
      });

      const totalPossibleStock = invInfo.generalStock + totalKeepAvailable;

      // Kiểm tra đơn vị tính (bỏ qua m, mét theo logic gốc)
      const rowSample = tableData.find((r: any) => r.ProductID === pId);
      const unit = (rowSample?.Unit || '').toLowerCase().trim();
      if (unit === 'm' || unit === 'mét' || unit === 'met') return;

      if (usage.totalRequested > totalPossibleStock) {
        const productDisplay = rowSample?.ProductNewCode || rowSample?.ProductCode || `ID:${pId}`;
        insufficientMessages.push(
          `[${productDisplay}]: Xuất ${usage.totalRequested.toFixed(2)} > Khả dụng ${totalPossibleStock.toFixed(2)} ` +
          `(Giữ dự án: ${totalKeepAvailable.toFixed(2)} + Tồn CK: ${invInfo.generalStock.toFixed(2)})`
        );
      }
    });

    return {
      isValid: insufficientMessages.length === 0,
      message: insufficientMessages.join('\n')
    };
  }

  // ✅ Có thể thêm method để clear map khi cần (ví dụ khi thay đổi KhoTypeID hoặc WarehouseID)
  private clearProductAvailableInventoryMap(): void {
    this.productAvailableInventoryMap.clear();
  }

  // Load inventory cho tất cả rows (chạy song song, không block)
  // Chỉ load cho các ProductID chưa có trong productAvailableInventoryMap
  private async loadInventoryForAllRows(): Promise<void> {
    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) return;

    const productIds = new Set<number>();
    const productRowMap = new Map<number, any>();

    tableData.forEach((row: any) => {
      const productID = row.ProductID;
      if (productID > 0 && !this.productAvailableInventoryMap.has(productID)) {
        productIds.add(productID);
        if (!productRowMap.has(productID)) {
          productRowMap.set(productID, row);
        }
      }
    });

    if (productIds.size === 0) {
      console.log('🟢 Inventory cache đã đủ, không cần load');
      return;
    }

    console.log(
      `🟢 Loading inventory cho ${productIds.size} sản phẩm`,
      Array.from(productIds)
    );

    const tasks = Array.from(productIds).map((id) =>
      this.loadInventoryProjectForRow(productRowMap.get(id))
    );

    await Promise.all(tasks);

    console.log('🟢 Load inventory hoàn tất');
  }

  onRecheckQty() {
    const currentData = this.table_billExportDetail?.getData();
    if (!currentData || currentData.length === 0) {
      // this.showErrorNotification('Không có dữ liệu để tính lại!');
      return;
    }

    console.log('🟢 [onRecheckQty] START - Calculating total Qty by ProductID');

    // Tính tổng Qty theo ProductID
    const productQtyMap = new Map<number, number>();
    const productRowsMap = new Map<number, any[]>(); // Lưu tất cả rows của mỗi ProductID

    currentData.forEach((row: any) => {
      const productId = row.ProductID;
      if (productId && productId > 0) {
        const currentSum = productQtyMap.get(productId) || 0;
        const qty = parseFloat(row.Qty || 0);
        productQtyMap.set(productId, currentSum + qty);

        // Lưu row vào map để có thể log sau
        if (!productRowsMap.has(productId)) {
          productRowsMap.set(productId, []);
        }
        productRowsMap.get(productId)!.push(row);
      }
    });

    console.log(
      '🟢 [onRecheckQty] Total Qty by ProductID:',
      Array.from(productQtyMap.entries()).map(([id, qty]) => ({
        ProductID: id,
        TotalQty: qty,
      }))
    );

    // ✅ So sánh tổng Qty với TotalInventory
    // Ưu tiên dùng productAvailableInventoryMap (data từ loadInventoryProjectForRow - chính xác hơn)
    // Fallback sang productOptions nếu map chưa có data
    const validationErrors: string[] = [];
    const productsNeedLoad: number[] = []; // Lưu các ProductID chưa có data trong map

    productQtyMap.forEach((totalQty, productId) => {
      const unitName = (productRowsMap.get(productId)?.[0]?.Unit || '')
        .toLowerCase()
        .trim();

      // Bỏ qua validation cho đơn vị m, mét (có thể xuất vượt tồn)
      if (unitName === 'm' || unitName === 'mét' || unitName === 'met') {
        console.log(
          `🟢 [onRecheckQty] ProductID ${productId}: Skip validation for unit '${unitName}'`
        );
        return;
      }

      // ✅ Ưu tiên: Lấy từ productAvailableInventoryMap (data chính xác từ loadInventoryProjectForRow)
      let totalInventory: number | undefined =
        this.productAvailableInventoryMap.get(productId);
      let productCode: string = '';
      let dataSource = 'productAvailableInventoryMap';

      // ✅ Fallback: Nếu chưa có trong map, lấy từ productOptions
      if (totalInventory === undefined) {
        const product = this.productOptions.find(
          (p: any) =>
            p.value === productId ||
            p.ProductID === productId ||
            p.ProductSaleID === productId
        );

        if (product) {
          totalInventory =
            product.TotalInventory || product.TotalQuantityLast || 0;
          productCode =
            product.ProductCode || product.ProductNewCode || `ID:${productId}`;
          dataSource = 'productOptions';
          // Đánh dấu product này chưa có data chính xác trong map
          productsNeedLoad.push(productId);
        } else {
          console.warn(
            `⚠️ [onRecheckQty] ProductID ${productId} not found in productOptions`
          );
          productsNeedLoad.push(productId);
          return;
        }
      } else {
        // Nếu có trong map, lấy productCode từ row data
        const row = productRowsMap.get(productId)?.[0];
        productCode =
          row?.ProductNewCode || row?.ProductCode || `ID:${productId}`;
      }

      // Validate chỉ khi đã có data inventory
      if (totalInventory !== undefined) {
        if (totalQty > totalInventory) {
          const rows = productRowsMap.get(productId) || [];
          const rowNumbers = rows
            .map((r: any, idx: number) => idx + 1)
            .join(', ');

          // Nếu data từ productOptions (chưa load chính xác), thêm cảnh báo
          const warningNote =
            dataSource === 'productOptions'
              ? ' (Lưu ý: Dữ liệu tồn kho có thể chưa cập nhật, vui lòng chờ load xong)'
              : '';

          validationErrors.push(
            `Sản phẩm [${productCode}]: Tổng SL xuất (${totalQty.toFixed(
              2
            )}) vượt quá SL tồn (${totalInventory.toFixed(
              2
            )})${warningNote} - Dòng: ${rowNumbers}`
          );
        }

        console.log(`🟢 [onRecheckQty] ProductID ${productId}:`, {
          ProductCode: productCode,
          TotalQty: totalQty,
          TotalInventory: totalInventory,
          DataSource: dataSource,
          isValid: totalQty <= totalInventory,
        });
      }
    });

    // Chỉ hiển thị cảnh báo nếu có validation errors
    // Nếu có products chưa load, sẽ validate lại sau khi loadInventoryProjectForRow hoàn tất
    if (validationErrors.length > 0) {
      const message =
        'Có sản phẩm vượt quá số lượng tồn kho:\n\n' +
        validationErrors.join('\n');
      this.showErrorNotification(message);
    } else if (productsNeedLoad.length > 0) {
      console.log(
        `🟡 [onRecheckQty] Một số sản phẩm chưa có dữ liệu tồn kho chính xác (sẽ được cập nhật khi loadInventoryProjectForRow):`,
        productsNeedLoad
      );
    }

    // Update TotalQty cho từng row
    const updatedData = currentData.map((row: any) => {
      if (row.ProductID && row.ProductID > 0) {
        return {
          ...row,
          TotalQty: productQtyMap.get(row.ProductID) || 0,
        };
      }
      return row;
    });

    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(updatedData);
      this.dataTableBillExportDetail = updatedData;
      console.log('🟢 [onRecheckQty] Updated data with TotalQty:', updatedData);
    }

    console.log('🟢 [onRecheckQty] END');
  }

  // loadInventoryProjectForRow(rowData: any, rowIndex?: number): void {
  //   const qty = parseFloat(rowData.Qty || 0);
  //   const productID = rowData.ProductID || 0;
  //   let projectID = rowData.ProjectID || 0;
  //   const poKHDetailID =
  //     rowData.POKHDetailIDActual || rowData.POKHDetailID || 0;

  //   // If poKHDetailID > 0, set projectID = 0 (matching C# logic)
  //   if (poKHDetailID > 0) {
  //     projectID = 0;
  //   }

  //   if (qty <= 0 || productID <= 0 || (projectID <= 0 && poKHDetailID <= 0)) {
  //     return;
  //   }

  //   // Find the row in the table to update
  //   // Try to find by ID first (most accurate), then by index, then by matching fields
  //   const allRows = this.table_billExportDetail?.getRows() || [];
  //   let currentRow: any = null;

  //   // First try: find by ID or ChildID if available
  //   if (rowData.ID || rowData.ChildID) {
  //     currentRow = allRows.find((row: any) => {
  //       const data = row.getData();
  //       return (data.ID && data.ID === rowData.ID) ||
  //              (data.ChildID && data.ChildID === rowData.ChildID);
  //     });

  //   }

  //   // Second try: find by index if provided
  //   if (!currentRow && rowIndex !== undefined && allRows[rowIndex]) {
  //     const rowDataAtIndex = allRows[rowIndex].getData();
  //     if (rowDataAtIndex.ProductID === productID &&
  //         rowDataAtIndex.ProjectID === projectID &&
  //         (rowDataAtIndex.POKHDetailIDActual || rowDataAtIndex.POKHDetailID || 0) === poKHDetailID) {
  //       currentRow = allRows[rowIndex];
  //     }
  //   }

  //   // Third try: find by matching key fields
  //   if (!currentRow) {
  //     currentRow = allRows.find((row: any) => {
  //       const data = row.getData();
  //       return data.ProductID === productID &&
  //              data.ProjectID === projectID &&
  //              (data.POKHDetailIDActual || data.POKHDetailID || 0) === poKHDetailID &&
  //              Math.abs(parseFloat(data.Qty || 0) - qty) < 0.001; // Match Qty as well for accuracy
  //     });
  //   }

  //   // Reset values (matching C# code)
  //   currentRow.update({
  //     ChosenInventoryProject: '',
  //     ProductCodeExport: ''
  //   });

  //   const warehouseID = this.newBillExport.WarehouseID || 0;
  //   const billExportDetailID = rowData.ID || 0;

  //   this.billExportService
  //     .getInventoryProject(
  //       warehouseID,
  //       productID,
  //       projectID,
  //       poKHDetailID,
  //       billExportDetailID
  //     )
  //     .subscribe({
  //       next: (res: any) => {
  //         if (res.status === 1) {
  //           const inventoryProjects = (res.inventoryProjects || [])
  //             .filter((inv: any) => parseFloat(inv.TotalQuantityRemain || 0) > 0)
  //             .sort((a: any, b: any) => {
  //               // Sort by CreatedDate if available (matching C# OrderBy)
  //               const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0;
  //               const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0;
  //               return dateA - dateB;
  //             });

  //           const stock = res.stock || [];
  //           const totalStockAvailable = Math.max(0,
  //             stock.length > 0
  //               ? parseFloat(stock[0].TotalQuantityLast || 0)
  //               : 0
  //           );

  //           // If no inventory projects, check stock and return
  //           if (inventoryProjects.length === 0) {
  //             if (totalStockAvailable >= qty) {
  //               // Enough stock, leave ChosenInventoryProject empty to take from stock
  //               currentRow.update({
  //                 ChosenInventoryProject: '',
  //                 ProductCodeExport: ''
  //               });
  //             } else {
  //             }
  //             return;
  //           }

  //           // Get all table data to calculate used quantities
  //           const allTableData = this.table_billExportDetail?.getData() || [];
  //           const currentRowChildID = rowData.ChildID || rowData.ID || rowIndex;
  //           const usedQuantityByInventoryID = new Map<number, number>();

  //           // Filter related rows (same ProductID, ProjectID/POKHDetailID, different ChildID)
  //           const relatedRows = allTableData.filter((row: any) => {
  //             const rowPokhDetailId =
  //               row.POKHDetailIDActual || row.POKHDetailID || 0;
  //             const rowProjectId = rowPokhDetailId > 0 ? 0 : row.ProjectID || 0;
  //             const rowChildID = row.ChildID || row.ID;

  //             return (
  //               row.ProductID === productID &&
  //               rowProjectId === projectID &&
  //               rowPokhDetailId === poKHDetailID &&
  //               rowChildID !== currentRowChildID
  //             );
  //           });

  //           // Calculate used quantities from other rows
  //           relatedRows.forEach((row: any) => {
  //             const chosenStr = row.ChosenInventoryProject || '';
  //             if (chosenStr) {
  //               const parts = chosenStr.split(';');
  //               parts.forEach((part: string) => {
  //                 if (part.includes('-')) {
  //                   const [idStr, qtyStr] = part.split('-');
  //                   const id = parseInt(idStr);
  //                   const allocatedQty = parseFloat(qtyStr);
  //                   if (!isNaN(id) && !isNaN(allocatedQty)) {
  //                     const current = usedQuantityByInventoryID.get(id) || 0;
  //                     usedQuantityByInventoryID.set(id, current + allocatedQty);
  //                   }
  //                 }
  //               });
  //             }
  //           });

  //           // Calculate total available from keep
  //           let availableFromKeep = 0;
  //           inventoryProjects.forEach((inv: any) => {
  //             const totalRemain = parseFloat(inv.TotalQuantityRemain || 0);
  //             const used = usedQuantityByInventoryID.get(inv.ID) || 0;
  //             const available = Math.max(0, totalRemain - used);
  //             availableFromKeep += available;
  //           });
  //           availableFromKeep = Math.max(0, availableFromKeep);

  //           // Allocate from keep if enough (matching C# logic: if (availableFromKeep >= qty))
  //           let remainingQty = qty;
  //           const selectedInventory: { [key: number]: number } = {};

  //           if (availableFromKeep >= qty) {
  //             // Đủ kho giữ - Lấy từ kho giữ (matching C# logic)
  //             for (const inv of inventoryProjects) {
  //               if (remainingQty <= 0) break;

  //               const id = inv.ID;
  //               const totalRemain = parseFloat(inv.TotalQuantityRemain || 0);
  //               const used = usedQuantityByInventoryID.get(id) || 0;
  //               const available = Math.max(0, totalRemain - used);

  //               if (available > 0) {
  //                 const allocateQty = Math.min(available, remainingQty);
  //                 selectedInventory[id] = allocateQty;
  //                 remainingQty -= allocateQty;
  //               }
  //             }

  //             if (Object.keys(selectedInventory).length > 0) {
  //               const result = Object.keys(selectedInventory)
  //                 .map((id) => `${id}-${selectedInventory[parseInt(id)]}`)
  //                 .join(';');

  //               const codes = inventoryProjects
  //                 .filter((inv: any) => selectedInventory[inv.ID])
  //                 .map((inv: any) => inv.ProductCode)
  //                 .join(';');

  //               currentRow.update({
  //                 ChosenInventoryProject: result,
  //                 ProductCodeExport: codes
  //               });
  //             } else {
  //               }
  //           } else {
  //             // Kho giữ không đủ - Kiểm tra tồn kho (matching C# else branch)
  //             // C#: if (totalStockAvailable >= remainingQty) - nhưng remainingQty ở đây = qty vì chưa allocate
  //             if (totalStockAvailable >= qty) {
  //               // Bỏ qua kho giữ, lấy toàn bộ từ tồn kho (matching C#)
  //               // Để trống ChosenInventoryProject để lấy từ tồn kho
  //               currentRow.update({
  //                 ChosenInventoryProject: '',
  //                 ProductCodeExport: ''
  //               });
  //             } else {
  //               // Không đủ cả kho giữ lẫn tồn kho
  //               // Không làm gì, để validation xử lý (matching C#)
  //               currentRow.update({
  //                 ChosenInventoryProject: '',
  //                 ProductCodeExport: ''
  //               });
  //             }
  //           }
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error loading inventory project:', err);
  //         this.notification.error(
  //           'Thông báo',
  //           err.error.message
  //         );
  //       },
  //     });
  // }
  private async loadInventoryProjectForRow(rowData: any): Promise<void> {
    const qty = Number(rowData.Qty || 0);
    const productID = Number(rowData.ProductID || 0);
    let projectID = Number(rowData.ProjectID || 0);
    const poKHDetailID = Number(
      rowData.POKHDetailIDActual || rowData.POKHDetailID || 0
    );

    if (poKHDetailID > 0) projectID = 0;

    if (qty <= 0 || productID <= 0 || (projectID <= 0 && poKHDetailID <= 0)) {
      return;
    }

    const warehouseID = this.newBillExport.WarehouseID || 0;
    const billExportDetailID = rowData.ID || 0;

    try {
      const res: any = await firstValueFrom(
        this.billExportService.getInventoryProject(
          warehouseID,
          productID,
          projectID,
          poKHDetailID,
          billExportDetailID
        )
      );

      if (res.status !== 1) return;

      const inventoryProjects = res.inventoryProjects || [];
      const totalInventoryFromProjects = inventoryProjects.reduce(
        (sum: number, inv: any) => sum + Number(inv.TotalQuantity || 0),
        0
      );

      const stock = res.stock || [];
      const totalStockAvailable =
        stock.length > 0 ? Number(stock[0].TotalQuantityLast || 0) : 0;

      const totalAvailable = totalInventoryFromProjects + totalStockAvailable;

      this.productAvailableInventoryMap.set(productID, totalAvailable);

      console.log(`🟢 Product ${productID} available = ${totalAvailable}`);
    } catch (err) {
      console.error(`❌ Load inventory failed - ProductID ${productID}`, err);
    }
  }

  private async validateKeep(): Promise<boolean> {
    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) return false;

    const skipUnitNames = ['m', 'mét'];
    const groups = this.groupRowsForValidation(tableData);

    for (const group of groups) {
      if (skipUnitNames.includes((group.UnitName || '').trim().toLowerCase())) {
        continue;
      }

      try {
        const inventoryData = await this.getInventoryDataForValidation(group);

        const totalStock =
          inventoryData.totalQuantityKeep +
          inventoryData.totalQuantityRemain +
          inventoryData.totalQuantityLast;

        // C# line 1296-1302: Validate stock
        if (totalStock < group.TotalQty) {
          this.notification.error(
            'Thông báo',
            `Số lượng còn lại của sản phẩm [${group.ProductNewCode}] không đủ!\n` +
            `SL xuất: ${group.TotalQty}\n` +
            `SL giữ: ${inventoryData.totalQuantityKeepShow} | ` +
            `Tồn CK: ${inventoryData.totalQuantityLastShow} | ` +
            `Tổng: ${totalStock}`
          );
          return false;
        }
      } catch (error) {
        this.notification.error('Thông báo', (error as any).error.message);
        return false;
      }
    }

    return true;
  }

  private groupRowsForValidation(tableData: any[]): any[] {
    const groupMap = new Map<string, any>();

    tableData.forEach((row: any) => {
      const productId = row.ProductID || 0;
      const projectId = row.ProjectID || 0;
      const pokhDetailId = row.POKHDetailIDActual || row.POKHDetailID || 0;
      const id = row.ID || 0;

      const effectiveProjectId = pokhDetailId > 0 ? 0 : projectId;
      const effectivePokhDetailId = pokhDetailId > 0 ? pokhDetailId : 0;

      const groupKey = `${productId}-${effectiveProjectId}-${effectivePokhDetailId}-${id}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          BillExportDetailID: id,
          ProductID: productId,
          ProjectID: effectiveProjectId,
          POKHDetailIDActual: effectivePokhDetailId,
          ID: id,
          ProductNewCode: row.ProductNewCode || '',
          ProjectCodeExport: row.ProjectCodeExport || '',
          PONumber: row.PONumber || '',
          TotalQty: 0,
          UnitName: row.Unit || '',
        });
      }

      const group = groupMap.get(groupKey);
      group.TotalQty += parseFloat(row.Qty || 0);
    });

    return Array.from(groupMap.values()).filter(
      (g) => g.POKHDetailIDActual > 0 || g.ProjectID > 0 || g.ProductID > 0
    );
  }

  private getInventoryDataForValidation(group: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const warehouseID = this.newBillExport.WarehouseID || 0;

      this.billExportService
        .getInventoryProject(
          warehouseID,
          group.ProductID,
          group.ProjectID,
          group.POKHDetailIDActual,
          group.BillExportDetailID
        )
        .subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              const inventoryProjects = res.inventoryProjects || [];
              const imports = res.imports || [];
              const exports = res.exports || [];
              const stock = res.stock || [];
              const totalQuantityKeep =
                inventoryProjects.length > 0
                  ? parseFloat(inventoryProjects[0].TotalQuantity || 0)
                  : 0;
              const totalQuantityLast =
                stock.length > 0
                  ? parseFloat(stock[0].TotalQuantityLast || 0)
                  : 0;

              const totalImport =
                imports.length > 0
                  ? parseFloat(imports[0].TotalImport || 0)
                  : 0;
              const totalExport =
                exports.length > 0
                  ? parseFloat(exports[0].TotalExport || 0)
                  : 0;
              const totalQuantityRemain = Math.max(
                0,
                totalImport - totalExport
              );

              resolve({
                totalQuantityKeep: Math.max(0, totalQuantityKeep),
                totalQuantityKeepShow: totalQuantityKeep,
                totalQuantityRemain: totalQuantityRemain,
                totalQuantityLast: Math.max(0, totalQuantityLast),
                totalQuantityLastShow: totalQuantityLast,
              });
            } else {
              reject(new Error('API returned non-success status'));
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  // async saveDataBillExport() {
  //   this.onRecheckQty();

  //   if (!this.validateForm.valid) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!'
  //     );
  //     this.validateForm.markAllAsTouched();
  //     Object.values(this.validateForm.controls).forEach((control) => {
  //       if (control.invalid) {
  //         control.markAsDirty();
  //         control.updateValueAndValidity({ onlySelf: true });
  //       }
  //     });
  //     return;
  //   }

  //   const formValidation = this.validateFormData();
  //   if (!formValidation.isValid) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.error,
  //       formValidation.message
  //     );
  //     return;
  //   }
  //   const inventoryValidation = this.validateInventoryStock();
  //   if (!inventoryValidation.isValid) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.error,
  //       inventoryValidation.message
  //     );
  //     return;
  //   }

  //   let billExportDetailsFromTable = this.table_billExportDetail?.getData();
  //   if (
  //     !billExportDetailsFromTable ||
  //     billExportDetailsFromTable.length === 0
  //   ) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng thêm ít nhất một sản phẩm vào bảng!'
  //     );
  //     return;
  //   }

  //   const formValues = this.validateForm.getRawValue();
  //   const status = formValues.Status || this.newBillExport.Status || 0;

  //   if (status === 7 || status === 0) {
  //     for (const row of billExportDetailsFromTable) {
  //       const expectReturnDate = row.ExpectReturnDate;
  //       const projectID = row.ProjectID || 0;
  //       const stt = row.STT || '';

  //       if (!expectReturnDate || expectReturnDate === '') {
  //         this.notification.warning(
  //           'Thông báo',
  //           `Vui lòng nhập Ngày dự kiến trả dòng [${stt}]`
  //         );
  //         return;
  //       }

  //       if (projectID <= 0) {
  //         this.notification.warning(
  //           'Thông báo',
  //           `Vui lòng nhập Dự án dòng [${stt}]`
  //         );
  //         return;
  //       }
  //     }
  //   }

  //   if (this.isCheckmode) {
  //     const payload = {
  //       BillExport: {
  //         ID: this.newBillExport.Id,
  //         Code: formValues.Code,
  //         TypeBill: false,
  //         SupplierID: formValues.SupplierID,
  //         CustomerID: formValues.CustomerID,
  //         UserID: formValues.UserID,
  //         SenderID: formValues.SenderID,
  //         StockID: this.newBillExport.AddressStockID,
  //         Description: '',
  //         Address: formValues.Address,
  //         Status: formValues.Status,
  //         GroupID: this.newBillExport.GroupID,
  //         WarehouseType: this.newBillExport.WarehouseType,
  //         KhoTypeID: formValues.KhoTypeID,
  //         UpdatedDate: new Date(),
  //         CreateDate: formValues.CreatDate,
  //         ProductType: formValues.ProductType,
  //         AddressStockID: this.newBillExport.AddressStockID,
  //         WarehouseID: this.newBillExport.WarehouseID,
  //         RequestDate: formValues.RequestDate,
  //         BillDocumentExportType: 2,
  //       },
  //       billExportDetail: this.mapTableDataToBillExportDetails(
  //         billExportDetailsFromTable
  //       ),
  //       DeletedDetailIds: this.deletedDetailIds || [],
  //     };
  //     this.billExportService.saveBillExport(payload).subscribe({
  //       next: (res: any) => {
  //         if (res.status === 1) {
  //           this.notification.success(
  //             NOTIFICATION_TITLE.success,
  //             'Cập nhật thành công!'
  //           );
  //           this.closeModal();
  //         } else {
  //           this.notification.warning(
  //             NOTIFICATION_TITLE.warning,
  //             res.message || 'Không thể cập nhật phiếu xuất!'
  //           );
  //         }
  //       },
  //       error: (err: any) => {
  //         const backendMsg =
  //           err?.error?.message ||
  //           err?.error?.error ||
  //           err?.message ||
  //           'Có lỗi xảy ra khi cập nhật!';
  //         this.notification.error(NOTIFICATION_TITLE.error, backendMsg);
  //         console.error('API error:', err);
  //       },
  //     });
  //   } else {
  //     const wareHouseCode = this.dataCbbProductGroup.find(
  //       (p: any) => p.ID === formValues.KhoTypeID
  //     );
  //     const payload = {
  //       BillExport: {
  //         ID: this.newBillExport.Id || 0,
  //         Code: formValues.Code,
  //         TypeBill: false,
  //         SupplierID: formValues.SupplierID,
  //         CustomerID: formValues.CustomerID,
  //         UserID: formValues.UserID,
  //         SenderID: formValues.SenderID,
  //         StockID: this.newBillExport.AddressStockID,
  //         Description: '',
  //         Address: formValues.Address,
  //         CreatDate: new Date(),
  //         IsApproved: false,
  //         Status: formValues.Status,
  //         GroupID: this.newBillExport.GroupID,
  //         WarehouseType: wareHouseCode ? wareHouseCode.ProductGroupName : '',
  //         KhoTypeID: formValues.KhoTypeID,
  //         CreatedDate: formValues.CreatDate,
  //         UpdatedDate: new Date(),
  //         ProductType: formValues.ProductType,
  //         AddressStockID: this.newBillExport.AddressStockID,
  //         WarehouseID: 1,
  //         IsPrepared: false,
  //         IsReceived: false,
  //         RequestDate: formValues.RequestDate,
  //         BillDocumentExportType: 2,
  //         IsDeleted: false,
  //       },
  //       billExportDetail: this.mapTableDataToBillExportDetails(
  //         billExportDetailsFromTable
  //       ),
  //       DeletedDetailIds: this.deletedDetailIds || [],
  //     };
  //     this.billExportService.saveBillExport(payload).subscribe({
  //       next: (res) => {
  //         if (res.status === 1) {
  //           this.notification.success(
  //             NOTIFICATION_TITLE.success,
  //             'Thêm mới thành công!'
  //           );
  //           this.closeModal();
  //         } else {
  //           this.notification.warning(
  //             NOTIFICATION_TITLE.warning,
  //             res.message || 'Không thể thêm phiếu xuất!'
  //           );
  //         }
  //       },
  //       error: (err: any) => {
  //         console.error('Save error:', err);
  //         this.notification.error(
  //           NOTIFICATION_TITLE.error,
  //           err.error.message || 'Có lỗi xảy ra khi thêm mới!'
  //         );
  //       },
  //     });
  //   }
  // }
  // async saveDataBillExport() {
  //  const formValues = this.validateForm.getRawValue();
  //  const status =
  //    formValues.Status ||
  //    this.validateForm.value.Status ||
  //    this.newBillExport.Status ||
  //    0;
  //   //  let isPermission = this.permissionService.hasPermission('N27,N1,N33,N34,N69');
  //   const billID = this.newBillExport.Id || 0;
  //   if(billID > 0 || this.id > 0) {
  //     if(!this.permissionService.hasPermission('N27,N1,N33,N34,N69')) {
  //       this.showErrorNotification('Bạn không có quyền thực hiện hành động này!');
  //       return;
  //     }
  //   }
  //   // this.onRecheckQty();

  //   // ================= VALIDATE FORM =================
  //   if (!this.validateForm.valid) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!'
  //     );
  //     this.validateForm.markAllAsTouched();
  //     Object.values(this.validateForm.controls).forEach((control) => {
  //       if (control.invalid) {
  //         control.markAsDirty();
  //         control.updateValueAndValidity({ onlySelf: true });
  //       }
  //     });
  //     return;
  //   }

  //   const formValidation = this.validateFormData();
  //   if (!formValidation.isValid) {
  //     this.notification.warning(NOTIFICATION_TITLE.error, formValidation.message);
  //     return;
  //   }

  //   // ================= LOAD INVENTORY TRƯỚC KHI VALIDATE =================

  //   // if (status === 2 || status === 6) {
  //   //   console.log('🟢 Loading inventory before validate...');
  //   //   this.loadInventoryForAllRows();

  //   //   console.log(
  //   //     '🟢 Inventory loaded:',
  //   //     Array.from(this.productAvailableInventoryMap.entries())
  //   //   );
  //   // }

  //   // ================= VALIDATE INVENTORY =================
  //   // const inventoryValidation = this.validateInventoryStock();
  //   // if (!inventoryValidation.isValid) {
  //   //     this.showErrorNotification(inventoryValidation.message);
  //   //     return;
  //   // }

  //   const billExportDetailsFromTable =
  //     this.table_billExportDetail?.getData() || [];

  //   if (billExportDetailsFromTable.length === 0) {
  //     this.notification.warning(
  //       NOTIFICATION_TITLE.warning,
  //       'Vui lòng thêm ít nhất một sản phẩm vào bảng!'
  //     );
  //     return;
  //   }

  //   // ================= VALIDATE PHIẾU MƯỢN =================
  //   if (status === 7 || status === 0) {
  //     for (const row of billExportDetailsFromTable) {
  //       if (!row.ExpectReturnDate) {
  //         this.notification.warning(
  //           'Thông báo',
  //           `Vui lòng nhập Ngày dự kiến trả dòng [${row.STT}]`
  //         );
  //         return;
  //       }

  //       if (!row.ProjectID || row.ProjectID <= 0) {
  //         this.notification.warning(
  //           'Thông báo',
  //           `Vui lòng nhập Dự án dòng [${row.STT}]`
  //         );
  //         return;
  //       }
  //     }
  //   }
  //   // ✅ Tiếp tục với logic save như cũ
  //   if (this.isCheckmode) {
  //     const payload = {
  //       BillExport: {
  //         ID: this.newBillExport.Id,
  //         Code: formValues.Code,
  //         TypeBill: false,
  //         SupplierID: formValues.SupplierID,
  //         CustomerID: formValues.CustomerID,
  //         UserID: formValues.UserID,
  //         SenderID: formValues.SenderID,
  //         StockID: this.newBillExport.AddressStockID,
  //         Description: '',
  //         Address: formValues.Address,
  //         Status: formValues.Status,
  //         GroupID: this.newBillExport.GroupID,
  //         WarehouseType: this.newBillExport.WarehouseType,
  //         KhoTypeID: formValues.KhoTypeID,
  //         UpdatedDate: new Date(),
  //         CreatDate: formValues.CreatDate,
  //         ProductType: formValues.ProductType,
  //         AddressStockID: this.newBillExport.AddressStockID,
  //         WarehouseID: this.newBillExport.WarehouseID,
  //         RequestDate: formValues.RequestDate,
  //         BillDocumentExportType: 2,
  //       },
  //       billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),
  //       DeletedDetailIds: this.deletedDetailIds || [],
  //     };

  //     this.billExportService.saveBillExport(payload).subscribe({
  //       next: (res: any) => {
  //         if (res.status === 1) {
  //           this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
  //           this.closeModal();
  //         } else {
  //           this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể cập nhật phiếu xuất!');
  //         }
  //       },
  //       error: (err: any) => {
  //         const backendMsg = err?.error?.message || err?.error?.error || err?.message || 'Có lỗi xảy ra khi cập nhật!';
  //         this.notification.error(NOTIFICATION_TITLE.error, backendMsg);
  //         console.error('API error:', err);
  //       },
  //     });
  //   } else {
  //     const wareHouseCode = this.dataCbbProductGroup.find((p: any) => p.ID === formValues.KhoTypeID);
  //     const payload = {
  //       BillExport: {
  //         ID: this.newBillExport.Id || 0,
  //         Code: formValues.Code,
  //         TypeBill: false,
  //         SupplierID: formValues.SupplierID,
  //         CustomerID: formValues.CustomerID,
  //         UserID: formValues.UserID,
  //         SenderID: formValues.SenderID,
  //         StockID: this.newBillExport.AddressStockID,
  //         Description: '',
  //         Address: formValues.Address,
  //         CreatDate: new Date(),
  //         IsApproved: false,
  //         Status: formValues.Status,
  //         GroupID: this.newBillExport.GroupID,
  //         WarehouseType: wareHouseCode ? wareHouseCode.ProductGroupName : '',
  //         KhoTypeID: formValues.KhoTypeID,
  //         CreatedDate: formValues.CreatDate,
  //         UpdatedDate: new Date(),
  //         ProductType: formValues.ProductType,
  //         AddressStockID: this.newBillExport.AddressStockID,
  //         WarehouseID: 1,
  //         IsPrepared: false,
  //         IsReceived: false,
  //         RequestDate: formValues.RequestDate,
  //         BillDocumentExportType: 2,
  //         IsDeleted: false,
  //       },
  //       billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),
  //       DeletedDetailIds: this.deletedDetailIds || [],
  //     };

  //     this.billExportService.saveBillExport(payload).subscribe({
  //       next: (res) => {
  //         if (res.status === 1) {
  //           this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công!');
  //           this.closeModal();
  //         } else {
  //           this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể thêm phiếu xuất!');
  //         }
  //       },
  //       error: (err: any) => {
  //         console.error('Save error:', err);
  //         this.showErrorNotification(err?.error?.message || err?.message);
  //       },
  //     });
  //   }
  // }
  async saveDataBillExport() {
    // --- 1. KIỂM TRA SERIAL ---
    const isSerialValid = await this.checkSerial();
    if (!isSerialValid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng serial không đủ, vui lòng kiểm tra lại');
      return;
    }

    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng thêm ít nhất một sản phẩm vào bảng!');
      return;
    }

    // --- 2. KIỂM TRA QUYỀN & FORM ---
    const formValues = this.validateForm.getRawValue();
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

    // --- 3. NẠP TỒN KHO BẤT ĐỒNG BỘ (TRỌNG TÂM SỬA LỖI) ---
    this.isSaving = true; // Hiện loading spinner và disable nút lưu
    try {
      const status = formValues.Status || this.newBillExport.Status || 0;

      // Chỉ nạp tồn kho và validate nếu là trạng thái xuất (2) hoặc yêu cầu xuất (6) hoặc mượn (0,7)
      // Thực tế mọi trạng thái xuất đều nên nạp tồn kho để đảm bảo an toàn
      // Sử dụng <number> cho Set để chỉ định rõ kiểu dữ liệu bên trong
      const uniqueProductIds: number[] = [...new Set<number>(
        tableData.map((r: any) => Number(r.ProductID)).filter((id: number) => id > 0)
      )];

      console.log('⏳ Đang nạp dữ liệu tồn kho dự án và hàng tự do...');
      // Đợi tất cả API nạp xong mới chạy tiếp
      await Promise.all(uniqueProductIds.map(id => this.loadInventoryForValidation(id)));
      console.log('✅ Nạp dữ liệu hoàn tất.');

      // --- 4. VALIDATE TỒN KHO ---
      const inventoryValidation = this.validateInventoryStock();
      if (!inventoryValidation.isValid) {
        this.showErrorNotification(inventoryValidation.message);
        this.isSaving = false;
        return; // Dừng lại không cho lưu
      }

      // --- 5. GỬI PAYLOAD LƯU ---
      console.log('🚀 Gửi dữ liệu lưu...');
      const payload = {
        BillExport: { ...this.newBillExport, ...formValues },
        billExportDetail: this.mapTableDataToBillExportDetails(tableData),
        DeletedDetailIds: this.deletedDetailIds || [],
      };

      this.billExportService.saveBillExport(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
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

    } catch (error) {
      console.error('Lỗi quy trình lưu:', error);
      this.notification.error('Lỗi', 'Không thể kiểm tra tồn kho');
      this.isSaving = false;
    }
  }

  private async loadInventoryForValidation(productID: number): Promise<void> {
    if (productID <= 0) return;
    const tableData = this.table_billExportDetail?.getData() || [];
    const warehouseID = this.newBillExport.WarehouseID || 0;
    console.log('tableData', tableData);

    try {
      let pokhdetailID = tableData[0].POKHDetailID || 0;
      let projectID = tableData[0].ProjectID || 0;
      let billDetailID = tableData[0].ID || 0;
      if (pokhdetailID > 0) {
        projectID = 0;
      }
      // Gọi API lấy thông tin tổng hợp (Hàng giữ + Tồn CK)
      // spGetInventoryProjectImportExport trả về 4 bảng: [0] Keep, [1] Import, [2] Export, [3] Stock
      const res: any = await firstValueFrom(
        this.billExportService.getInventoryProject(warehouseID, productID, projectID, pokhdetailID, billDetailID)
      );

      if (res && res.status === 1) {
        // 1. Lấy tồn kho tự do (Hàng CK) từ bảng Stock [index 3]
        const stockTable = res.stock || [];
        const generalStock = stockTable.length > 0 ? Number(stockTable[0].TotalQuantityLast || 0) : 0;

        // 2. Lấy tồn giữ theo từng Dự án từ bảng Keep [index 0]
        const keepTable = res.inventoryProjects || [];
        const keepMap = new Map<number, number>();

        keepTable.forEach((inv: any) => {
          const pId = Number(inv.ProjectID || 0);
          const remainQty = Number(inv.TotalQuantity || 0);
          const currentSum = keepMap.get(pId) || 0;
          keepMap.set(pId, currentSum + remainQty);
        });

        // 3. Cập nhật Map tổng cho sản phẩm này
        this.productInventoryDetailMap.set(productID, {
          keepByProject: keepMap,
          generalStock: Math.max(0, generalStock)
        });

        console.log(`✅ Nạp xong tồn kho SP ${productID}: CK=${generalStock}, Dự án=${keepMap.size}`);
      }
    } catch (err) {
      console.error(`❌ Lỗi API tồn kho SP ${productID}:`, err);
      // Nếu lỗi API, mặc định tồn = 0 để tránh lọt lưới validate
      this.productInventoryDetailMap.set(productID, { keepByProject: new Map(), generalStock: 0 });
    }
  }
  private mapTableDataToBillExportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      const rowKey = row.ID || index;
      const original = this.originalInventoryRelatedData.get(rowKey);

      // Check nếu có thay đổi inventory-related fields
      const hasInventoryChange =
        original &&
        (original.ProductID !== (row.ProductID || 0) ||
          original.Qty !== (row.Qty || 0) ||
          original.ProjectID !== (row.ProjectID || 0) ||
          original.POKHDetailID !==
          (row.POKHDetailIDActual || row.POKHDetailID || 0));
      return {
        ID: row.ID || 0,
        ProductID: row.ProductID || 0,
        ProductName: row.ProductName || '',
        ProductCode: row.ProductCode || '',
        ProductNewCode: row.ProductNewCode || '', // ✅ Thêm field này
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
        ProjectPartListID: row.ProjectPartListID || 0,
        TradePriceDetailID: row.TradePriceDetailID || 0,
        POKHDetailID: row.POKHDetailID || 0,
        Specifications: row.Specifications || '',
        BillImportDetailID: row.ImportDetailID || 0,
        TotalInventory: row.TotalInventory || 0,
        ExpectReturnDate: row.ExpectReturnDate || null,
        CustomerResponse: row.CustomerResponse || '',
        POKHDetailIDActual: row.POKHDetailIDActual || 0, // ✅ Quan trọng
        PONumber: row.PONumber || '',
        ChosenInventoryProject: row.ChosenInventoryProject || '',
        Unit: row.Unit || '', // ✅ Thêm field này để backend skip validation
        UnitName: row.Unit || '', // ✅ Thêm field này
        ChildID: row.ChildID || row.ID || 0, // ✅ Thêm field này
        ImportDetailID: row.ImportDetailID || row.BillImportDetailID || 0, // ✅ Alias
        ForceReallocate: hasInventoryChange || (row.ID || 0) <= 0,
      };
    });
  }

  async checkSerial(): Promise<boolean> {
    // const tableData = this.table_billExportDetail?.getData();

    // for (const detail of tableData) {
    //   const qty = detail.Quantity || detail.Qty || 0;
    //   const detailId = detail.ID;

    //   if (!detailId || detailId <= 0) {
    //     continue;
    //   }

    //   try {
    //     const result = await this.billImportChoseSerialService
    //       .countSerialBillExport(detailId)
    //       .toPromise();

    //     if (qty < (result?.data || 0)) {
    //       return false;
    //     }
    //   } catch (error) {
    //     console.error('Lỗi check serial', detailId, error);
    //     return false;
    //   }
    // }

    return true;
  }
}
