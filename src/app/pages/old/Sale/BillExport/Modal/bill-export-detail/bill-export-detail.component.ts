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
import {
  NgbActiveModal,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { SelectControlComponent } from '../select-control/select-control.component';
import { BillImportServiceService } from '../../../BillImport/bill-import-service/bill-import-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';

import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';

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
    HasPermissionDirective,
    NzSpinModule,
  ],
  templateUrl: './bill-export-detail.component.html',
  styleUrl: './bill-export-detail.component.css',
})
export class BillExportDetailComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  table_billExportDetail: any;
 @Input() dataTableBillExportDetail: any[] = [];

  isLoading: boolean = false;
  isFormDisabled: boolean = false;

  dataCbbUser: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  datCbbSupplierSale: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];

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
  @Input() wareHouseCode: string = 'HN  ';
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
      Code: [{ value: '', disabled: true }, [Validators.required]],
      UserID: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(1)],
      ],
      SenderID: [0, [Validators.required, Validators.min(1)]],
      CustomerID: [0, [Validators.required, Validators.min(1)]],
      Address: [{ value: '', disabled: true }, [Validators.required]],
      AddressStockID: [0, [Validators.required, Validators.min(1)]],
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
     this.validateForm.get('CustomerID')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.changeCustomer();
    });
     this.validateForm.get('AddressStockID')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.onAddressStockChange(value);
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
    } else if (!this.isBorrow && !this.isFromProjectPartList && !this.isFromWarehouseRelease) {
      // Skip reset when:
      // - isBorrow = true (preserve values set from inventory component)
      // - isFromProjectPartList = true (preserve values from ProjectPartList)
      // - isFromWarehouseRelease = true (preserve values from WarehouseRelease)
      // NOTE: getNewCode() will be called later after Status is set to 2 (see line ~355)
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
    } else if (!this.isBorrow && !this.isFromProjectPartList && !this.isFromWarehouseRelease) {
      // Skip getBillExportDetailID when:
      // - isBorrow = true (data will be filled from selectedList)
      // - isFromProjectPartList = true (data already provided from ProjectPartList)
      // - isFromWarehouseRelease = true (data already provided from WarehouseRelease)
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

      // Only call getNewCode for pure "Add New Bill" from BillExport component
      // Conditions: Status was 0 initially (from bill-export.component default)
      // AND not from other flows (no KhoTypeID, no isPOKH, no isAddExport, no lstBillImportID)
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

    // LUỒNG RIÊNG: ProjectPartList → BillExport (Yêu cầu xuất kho từ dự án)
    if (this.isFromProjectPartList) {
      // DEBUG: Check if newBillExport has data
      console.log('🔍 DEBUG isFromProjectPartList - this.newBillExport:', this.newBillExport);
      console.log('🔍 DEBUG - Code:', this.newBillExport.Code);
      console.log('🔍 DEBUG - UserID:', this.newBillExport.UserID);
      console.log('🔍 DEBUG - SenderID:', this.newBillExport.SenderID);
      console.log('🔍 DEBUG - CustomerID:', this.newBillExport.CustomerID);
      console.log('🔍 DEBUG - KhoTypeID:', this.newBillExport.KhoTypeID);

      // Matching C# frmBillExportDetail_Load + loadBillExportDetail logic when isPOKH = true
      // Bind ALL form fields from newBillExport (matching C# code)
      this.validateForm.patchValue({
        Code: this.newBillExport.Code || '',              // txtCode.Text = billExport.Code
        Address: this.newBillExport.Address || '',        // txtAddress.Text = billExport.Address
        CustomerID: this.newBillExport.CustomerID || 0,   // cboCustomer.EditValue = billExport.CustomerID
        UserID: this.newBillExport.UserID || 0,           // cboUser.EditValue = billExport.UserID
        SenderID: this.newBillExport.SenderID || 0,       // cboSender.EditValue = billExport.SenderID
        KhoTypeID: this.newBillExport.KhoTypeID || 0,     // cbKhoType.EditValue = billExport.KhoTypeID
        ProductType: this.newBillExport.ProductType || 0, // cbProductType.EditValue = billExport.ProductType
        Status: this.newBillExport.Status || 6,           // cboStatusNew.EditValue = 6 (when isPOKH)
        SupplierID: this.newBillExport.SupplierID || 0,   // cboSupplier.EditValue = billExport.SupplierID
        RequestDate: this.newBillExport.RequestDate || new Date(), // dtpRequestDate.EditValue = billExport.RequestDate
        CreatDate: this.newBillExport.CreatDate || new Date(),
        WarehouseID: this.newBillExport.WarehouseID || 0,
      });

      // Sync back to model (important!)
      this.newBillExport.Status = this.newBillExport.Status || 6;

      // Auto-fill SenderID from ProductGroupWareHouse if not provided by backend
      // Matching C# cbKhoType_EditValueChanged logic
      if (this.newBillExport.KhoTypeID > 0 && this.newBillExport.WarehouseID > 0 && this.newBillExport.SenderID === 0) {
        this.productSaleService
          .getdataProductGroupWareHouse(this.newBillExport.KhoTypeID, this.newBillExport.WarehouseID)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (userId > 0) {
                console.log('Auto-filling SenderID from ProductGroupWareHouse:', userId);
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              }
            },
            error: (err) => {
              console.error('Error getting SenderID from ProductGroupWareHouse:', err);
            },
          });
      }

      console.log('ProjectPartList flow - Bound all form data:', {
        Code: this.newBillExport.Code,
        Status: this.newBillExport.Status,
        CustomerID: this.newBillExport.CustomerID,
        KhoTypeID: this.newBillExport.KhoTypeID,
        UserID: this.newBillExport.UserID,
        SenderID: this.newBillExport.SenderID,
        SupplierID: this.newBillExport.SupplierID,
        WarehouseID: this.newBillExport.WarehouseID
      });
    }
    // LUỒNG RIÊNG: Warehouse Release Request → BillExport
    else if (this.isFromWarehouseRelease) {
      console.log('🔍 DEBUG WarehouseRelease - BEFORE patchValue, this.newBillExport.Status:', this.newBillExport.Status);

      // Bind ALL master fields from newBillExport (similar to ProjectPartList flow)
      this.validateForm.patchValue({
        Code: this.newBillExport.Code || '',              // txtCode.Text
        Address: this.newBillExport.Address || '',        // txtAddress.Text
        CustomerID: this.newBillExport.CustomerID || 0,   // cboCustomer.EditValue
        UserID: this.newBillExport.UserID || 0,           // cboUser.EditValue
        SenderID: this.newBillExport.SenderID || 0,       // cboSender.EditValue
        KhoTypeID: this.newBillExport.KhoTypeID || 0,     // cbKhoType.EditValue
        ProductType: this.newBillExport.ProductType || 1, // cbProductType.EditValue
        Status: this.newBillExport.Status || 6,           // cboStatusNew.EditValue = 6
        SupplierID: this.newBillExport.SupplierID || 0,   // cboSupplier.EditValue
        RequestDate: this.newBillExport.RequestDate || new Date(), // dtpRequestDate.EditValue
        CreatDate: this.newBillExport.CreatDate || new Date(),
        WarehouseID: this.newBillExport.WarehouseID || 0,
      });

      // Sync back to model
      this.newBillExport.Status = this.newBillExport.Status || 6;

      // Auto-fill SenderID from ProductGroupWareHouse if not provided
      if (this.newBillExport.KhoTypeID > 0 && this.newBillExport.WarehouseID > 0 && this.newBillExport.SenderID === 0) {
        this.productSaleService
          .getdataProductGroupWareHouse(this.newBillExport.KhoTypeID, this.newBillExport.WarehouseID)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (userId > 0) {
                console.log('WarehouseRelease - Auto-filling SenderID from ProductGroupWareHouse:', userId);
                this.validateForm.patchValue({ SenderID: userId });
                this.newBillExport.SenderID = userId;
              }
            },
            error: (err) => {
              console.error('WarehouseRelease - Error getting SenderID from ProductGroupWareHouse:', err);
            },
          });
      }

      // Generate new code if Code is empty (similar to ProjectPartList flow)
      if (!this.newBillExport.Code || this.newBillExport.Code === '') {
        this.getNewCode();
      }

      console.log('WarehouseRelease flow - Bound all form data:', {
        Code: this.newBillExport.Code,
        Status: this.newBillExport.Status,
        CustomerID: this.newBillExport.CustomerID,
        KhoTypeID: this.newBillExport.KhoTypeID,
        UserID: this.newBillExport.UserID,
        SenderID: this.newBillExport.SenderID,
        SupplierID: this.newBillExport.SupplierID,
        WarehouseID: this.newBillExport.WarehouseID
      });
    }
    // LUỒNG: Flow khác có KhoTypeID (backup)
    else if (this.KhoTypeID > 0 && !this.isBorrow) {
      // Skip this block when isBorrow = true (will be handled below)
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

    if (this.isPOKH && !this.isFromProjectPartList && !this.isFromWarehouseRelease) {
      // Skip if from ProjectPartList or WarehouseRelease (đã xử lý ở trên)
      this.validateForm.patchValue({ Status: 6 });
      this.newBillExport.Status = 6;
    }

    if (this.isBorrow) {
      // Set Status = 7 (Yêu cầu mượn) (C# line 145)
      this.newBillExport.Status = 7;
      this.newBillExport.KhoTypeID = this.KhoTypeID;

      this.validateForm.patchValue({
        Status: 7,
        KhoTypeID: this.KhoTypeID,
        RequestDate: new Date()
      });

      // Get new code for borrow bill (after Status is set)
      this.getNewCode();

      // Get SenderID (người giao) from ProductGroupWareHouse based on KhoTypeID
      // For borrow bills, SenderID is always determined by KhoTypeID
      if (this.KhoTypeID > 0 && this.newBillExport.WarehouseID) {
        this.productSaleService
          .getdataProductGroupWareHouse(this.KhoTypeID, this.newBillExport.WarehouseID)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              console.log('Setting SenderID for borrow bill:', userId);
              this.validateForm.patchValue({ SenderID: userId });
              this.newBillExport.SenderID = userId;
            },
            error: (err) => {
              console.error('Error getting SenderID:', err);
              this.validateForm.patchValue({ SenderID: 0 });
            },
          });
      }

      // Fill detail data from selectedList (matching C# form lines 143-155)
      if (this.selectedList && this.selectedList.length > 0) {
        console.log('isBorrow - filling detail data from selectedList:', this.selectedList);
        this.dataTableBillExportDetail = this.selectedList.map((item: any) => ({
          ID: item.ID || 0,
          POKHDetailID: item.POKHDetailID || 0,
          ProductID: item.ProductSaleID || item.ProductID || 0,
          ProductNewCode: item.ProductNewCode || '',
          ProductCode: item.ProductCode || '',
          ProductName: item.ProductName || '',
          Unit: item.Unit || '',
          TotalInventory: item.TotalInventory || item.TotalQuantityLast || 0,
          Qty: item.Qty || 0, // User will fill this (default 0)
          QuantityRemain: 0,
          ProjectID: item.ProjectID || 0,
          ProjectCodeExport: item.ProjectCodeExport || item.ProjectCode || '',
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
          ExpectReturnDate: item.ExpectReturnDate ? new Date(item.ExpectReturnDate) : new Date(),
          InventoryProjectIDs: item.InventoryProjectIDs || [],
          CustomerResponse: item.CustomerResponse || '',
          POKHDetailIDActual: item.POKHDetailIDActual || 0,
          PONumber: item.PONumber || '',
        }));
        console.log('Mapped dataTableBillExportDetail:', this.dataTableBillExportDetail);

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
        console.log('change status calling.....');

      });

    // Listen for KhoTypeID changes to auto-set SenderID (matching C# cbKhoType_EditValueChanged)
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

  ngAfterViewInit(): void {
    this.drawTable();

    // C# form lines 164-171: Load inventory project for all rows when creating new bill (ID <= 0)
    // Trigger after table is drawn and data is loaded
    setTimeout(() => {
      if (
        !this.isCheckmode &&
        (!this.newBillExport.Id || this.newBillExport.Id <= 0)
      ) {
        const tableData = this.table_billExportDetail?.getData() || [];
        if (tableData.length > 0) {
          console.log(
            'Auto-loading inventory project for',
            tableData.length,
            'rows'
          );
          tableData.forEach((row: any, index: number) => {
            this.loadInventoryProjectForRow(row, index);
          });
        }
      }
    }, 1500); // Wait for data to load (increased timeout for data stability)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          };
          this.validateForm.patchValue(this.newBillExport);
          this.changeProductGroup(this.newBillExport.KhoTypeID);
 this.changeCustomer();
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
            console.log('Form disabled: Bill is approved');
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
          console.log('Convert datatable from bill import', rawData);

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
          this.dataTableBillExportDetail = rawData.map((item: any) => {
            const productInfo =
              this.productOptions.find(
                (p: any) => p.value === item.ProductID
              ) || {};
            const projectInfo =
              this.projectOptions.find(
                (p: any) => p.value === item.ProjectID
              ) || {};
            return {
              ID: item.ID || 0,
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
              BillImportDetailID: item.BillImportDetailID || 0,
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
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu xuất!'
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
        this.notification.error(
          'Thông báo',
          'Có lỗi khi lấy thông tin sản phẩm!'
        );
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
        console.log('pj', res.data);
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
    // truyền đúng tham số theo BE: warehouseCode + productGroupID
    this.billExportService.getOptionProduct(this.wareHouseCode, ID).subscribe({
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
        if (this.checkConvert == true) {
          this.getBillExportDetailConvert([this.id]);
        } else if (this.isCheckmode && !this.isBorrow) {
          // Skip reload when isBorrow = true to preserve selectedList data
          this.getBillExportDetailID();
        }
        // Don't reload when isAddExport or isBorrow is true - data is loaded in ngOnInit
        // This prevents duplicate loading when converting from bill import or borrow request
      },
      error: (err: any) => {
        console.error(err);
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
    const status = this.validateForm.get('Status')?.value
    this.billExportService
      .getNewCodeBillExport(this.newBillExport.Status)
      .subscribe({
        next: (res: any) => {
          console.log('New code received:', res);
          this.newBillExport.Code = res?.data ?? '';
          this.validateForm.patchValue({ Code: this.newBillExport.Code });
        },
        error: (err: any) => {
          console.error(err);
          this.notification.error(
            'Thông báo',
            'Có lỗi xảy ra khi lấy mã phiếu'
          );
        },
      });
  }

  changeStatus() {
    this.getNewCode();
  }

  /**
   * Handle KhoTypeID change - auto set SenderID from ProductGroupWarehouse
   * Matching C# cbKhoType_EditValueChanged logic
   */
  onKhoTypeChange(khoTypeID: number) {
    if (!khoTypeID || khoTypeID <= 0) {
      return;
    }

    // Load products for this KhoTypeID
    this.changeProductGroup(khoTypeID);

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
            console.log('Auto-setting SenderID from KhoType change:', userId);
            this.validateForm.patchValue({ SenderID: userId });
            this.newBillExport.SenderID = userId;
          } else {
            // Default SenderID logic (C# lines 48-53)
            // For HCM warehouse: default to 88, for others: current user
            const defaultSenderId = this.wareHouseCode?.includes('HCM') ? 88 : 0;
            this.validateForm.patchValue({ SenderID: defaultSenderId });
          }
        },
        error: (err) => {
          console.error('Error getting SenderID from ProductGroupWarehouse:', err);
          const defaultSenderId = this.wareHouseCode?.includes('HCM') ? 88 : 0;
          this.validateForm.patchValue({ SenderID: defaultSenderId });
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
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
      },
    });
  }

  getDataCbbSender() {
    this.billExportService.getCbbSender().subscribe({
      next: (res: any) => {
        this.dataCbbSender = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
      },
    });
  }

  getDataCbbAdressStock() {
    this.billExportService.getCbbAddressStock(this.customerID).subscribe({
      next: (res: any) => {
        this.dataCbbAdressStock = res.data;
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
      },
    });
  }

  getDataCbbCustomer() {
    this.billExportService.getCbbCustomer().subscribe({
      next: (res: any) => {
        console.log('Raw response:', res);
        // Updated to match new API response structure
        this.dataCbbCustomer = Array.isArray(res.data) ? res.data : [];
        console.log('dataCbbCustomer:', this.dataCbbCustomer);
      },
      error: () => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
      },
    });
  }

  changeCustomer() {
    const id = this.validateForm.get('CustomerID')?.value;
    if (!id || id <= 0) {
      this.dataCbbAdressStock = [];
      this.validateForm.patchValue({ AddressStockID: 0, Address: '' });
      return;
    }
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
          const currentAddressStockID = this.validateForm.get('AddressStockID')?.value;
          this.onAddressStockChange(currentAddressStockID);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }
onAddressStockChange(id: number) {
    const selected = this.dataCbbAdressStock.find(addr => addr.ID === id);
    if (selected) {
      this.validateForm.patchValue({ Address: selected.Address });
      this.newBillExport.Address = selected.Address;
    } else {
      this.validateForm.patchValue({ Address: '' });
      this.newBillExport.Address = '';
    }
  }
  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dữ liệu'
        );
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
      onRendered(() => {});

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
          const serialsID = serials.map((s) => s.ID).join(',');
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
                    console.log('Row Data:', rowData);
                    console.log('ID to delete:', rowData['ID']);
                    if (rowData['ID']) {
                      this.deletedDetailIds.push(rowData['ID']);
                      console.log(
                        'Updated deletedDetailIds:',
                        this.deletedDetailIds
                      );
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

              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productNewCode} - ${productCode}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProduct = this.productOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProduct) {
                row.update({
                  ProductCode: selectedProduct.ProductCode,
                  ProductNewCode: selectedProduct.ProductNewCode,
                  Unit: selectedProduct.Unit || '',
                  TotalInventory: selectedProduct.TotalInventory || 0,
                  ProductName: selectedProduct.ProductName,
                });

                // treeList1_CellValueChanged: if (e.Column.FieldName == "ProductID")
                const rowData = row.getData();
                if (
                  this.newBillExport.Status === 2 ||
                  this.newBillExport.Status === 6
                ) {
                  this.loadInventoryProjectForRow(rowData);
                }
              }
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
              //treeList1_CellValueChanged: if (e.Column.FieldName == "Qty")
              const row = cell.getRow();
              const rowData = row.getData();
              if (
                this.newBillExport.Status === 2 ||
                this.newBillExport.Status === 6
              ) {
                this.loadInventoryProjectForRow(rowData);
              }
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
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.projectOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const project = this.projectOptions.find(
                (p: any) => p.value === val
              );
              const projectName = project ? project.label : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.projectOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProject) {
                row.update({
                  ProjectCodeExport: selectedProject.ProjectCode,
                  InventoryProjectIDs: [newValue],
                });
                // treeList1_CellValueChanged: if (e.Column.FieldName == "ProjectCodeExport")
                const rowData = row.getData();
                if (
                  this.newBillExport.Status === 2 ||
                  this.newBillExport.Status === 6
                ) {
                  this.loadInventoryProjectForRow(rowData);
                }
              }
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
              }
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
            // visible: false,
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
                  this.openSerialModal(rowData, row, quantity, productCode, []);
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
      });
    }
  }


  private validateFormData(): { isValid: boolean; message: string } {
    const formValues = this.validateForm.value;
    const status = formValues.Status;

    // Validate Code (Bill Number)
    if (!formValues.Code || formValues.Code.trim() === '') {
      return { isValid: false, message: 'Xin hãy điền số phiếu.' };
    }

    // Validate Customer or Supplier (at least one required)
    if (
      (!formValues.CustomerID || formValues.CustomerID <= 0) &&
      (!formValues.SupplierID || formValues.SupplierID <= 0)
    ) {
      return {
        isValid: false,
        message: 'Xin hãy chọn Khách hàng hoặc Nhà cung cấp!',
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
  private validateInventoryStock(): { isValid: boolean; message: string } {
    const status = this.validateForm.value.Status;

    // Only validate for status 2 (Exported) or 6 (Request export)
    if (status !== 2 && status !== 6) {
      return { isValid: true, message: '' };
    }

    const tableData = this.table_billExportDetail?.getData() || [];
    if (tableData.length === 0) {
      return { isValid: false, message: 'Không có dữ liệu để xuất kho!' };
    }

    const grouped = new Map<string, any>();

    tableData.forEach((row: any) => {
      const pokhDetailId = row.POKHDetailIDActual || row.POKHDetailID || 0;
      const projectId = pokhDetailId > 0 ? 0 : row.ProjectID || 0;
      const key = `${row.ProductID}_${projectId}_${pokhDetailId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          ProductID: row.ProductID,
          ProjectID: projectId,
          POKHDetailID: pokhDetailId,
          ProductNewCode: row.ProductNewCode || '',
          ProductCode: row.ProductCode || '',
          TotalQty: 0,
          Unit: row.Unit || '',
          TotalInventory: row.TotalInventory || 0,
        });
      }

      const group = grouped.get(key);
      group.TotalQty += parseFloat(row.Qty || 0);
    });

    for (const [key, group] of grouped.entries()) {
      if (group.TotalQty <= 0) {
        continue;
      }

      const unitName = (group.Unit || '').toLowerCase().trim();
      if (unitName === 'm' || unitName === 'mét' || unitName === 'met') {
        continue;
      }

      if (
        group.TotalInventory !== undefined &&
        group.TotalInventory < group.TotalQty
      ) {
        const productDisplay =
          group.ProductNewCode || group.ProductCode || `ID:${group.ProductID}`;
        return {
          isValid: false,
          message:
            `Số lượng còn lại sản phẩm [${productDisplay}] không đủ!\n` +
            `SL xuất: ${group.TotalQty.toFixed(
              2
            )}, SL tồn: ${group.TotalInventory.toFixed(2)}`,
        };
      }
    }

    return { isValid: true, message: '' };
  }

  onRecheckQty() {
    const currentData = this.table_billExportDetail?.getData();
    if (!currentData || currentData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để tính lại!');
      return;
    }

    const productQtyMap = new Map<number, number>();

    currentData.forEach((row: any) => {
      const productId = row.ProductID;
      if (productId) {
        const currentSum = productQtyMap.get(productId) || 0;
        productQtyMap.set(productId, currentSum + parseFloat(row.Qty || 0));
      }
    });

    const updatedData = currentData.map((row: any) => {
      if (row.ProductID) {
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
      this.notification.success('Thông báo', 'Đã cập nhật lại tổng số lượng!');
    }
  }


  loadInventoryProjectForRow(rowData: any, rowIndex?: number): void {
    const qty = parseFloat(rowData.Qty || 0);
    const productID = rowData.ProductID || 0;
    const projectID = rowData.ProjectID || 0;
    const poKHDetailID =
      rowData.POKHDetailIDActual || rowData.POKHDetailID || 0;

    if (qty <= 0 || productID <= 0 || (projectID <= 0 && poKHDetailID <= 0)) {
      return;
    }

    rowData.ChosenInventoryProject = '';
    rowData.ProductCodeExport = '';

    const warehouseID = this.newBillExport.WarehouseID || 0;
    const billExportDetailID = rowData.ID || 0;

    this.billExportService
      .getInventoryProject(
        warehouseID,
        productID,
        projectID,
        poKHDetailID,
        billExportDetailID
      )
      .subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            const inventoryProjects = res.inventoryProjects || [];
            const stock = res.stock || [];

            const totalStockAvailable =
              stock.length > 0
                ? parseFloat(stock[0].TotalQuantityLast || 0)
                : 0;

            if (inventoryProjects.length === 0) {
              if (totalStockAvailable >= qty) {
                return;
              } else {
                return;
              }
            }

            const allTableData = this.table_billExportDetail?.getData() || [];
            const currentRowChildID = rowData.ChildID || rowData.ID || rowIndex;
            const usedQuantityByInventoryID = new Map<number, number>();

            const relatedRows = allTableData.filter((row: any) => {
              const rowPokhDetailId =
                row.POKHDetailIDActual || row.POKHDetailID || 0;
              const rowProjectId = rowPokhDetailId > 0 ? 0 : row.ProjectID || 0;
              const rowChildID = row.ChildID || row.ID;

              return (
                row.ProductID === productID &&
                rowProjectId === (poKHDetailID > 0 ? 0 : projectID) &&
                rowPokhDetailId === poKHDetailID &&
                rowChildID !== currentRowChildID
              );
            });

            relatedRows.forEach((row: any) => {
              const chosenStr = row.ChosenInventoryProject || '';
              if (chosenStr) {
                const parts = chosenStr.split(';');
                parts.forEach((part: string) => {
                  if (part.includes('-')) {
                    const [idStr, qtyStr] = part.split('-');
                    const id = parseInt(idStr);
                    const allocatedQty = parseFloat(qtyStr);
                    if (!isNaN(id) && !isNaN(allocatedQty)) {
                      const current = usedQuantityByInventoryID.get(id) || 0;
                      usedQuantityByInventoryID.set(id, current + allocatedQty);
                    }
                  }
                });
              }
            });

            let availableFromKeep = 0;
            inventoryProjects.forEach((inv: any) => {
              const totalRemain = parseFloat(inv.TotalQuantityRemain || 0);
              const used = usedQuantityByInventoryID.get(inv.ID) || 0;
              const available = Math.max(0, totalRemain - used);
              availableFromKeep += available;
            });

            if (availableFromKeep >= qty) {
              const selectedInventory: { [key: number]: number } = {};
              let remainingQty = qty;

              for (const inv of inventoryProjects) {
                if (remainingQty <= 0) break;

                const id = inv.ID;
                const totalRemain = parseFloat(inv.TotalQuantityRemain || 0);
                const used = usedQuantityByInventoryID.get(id) || 0;
                const available = Math.max(0, totalRemain - used);

                if (available > 0) {
                  const allocateQty = Math.min(available, remainingQty);
                  selectedInventory[id] = allocateQty;
                  remainingQty -= allocateQty;
                }
              }

              if (Object.keys(selectedInventory).length > 0) {
                const result = Object.keys(selectedInventory)
                  .map((id) => `${id}-${selectedInventory[parseInt(id)]}`)
                  .join(';');

                const codes = inventoryProjects
                  .filter((inv: any) => selectedInventory[inv.ID])
                  .map((inv: any) => inv.ProductCode)
                  .join(';');

                rowData.ChosenInventoryProject = result;
                rowData.ProductCodeExport = codes;

                if (this.table_billExportDetail) {
                  this.table_billExportDetail.updateData([rowData]);
                }
              }
            } else {
              if (totalStockAvailable >= qty) {
                rowData.ChosenInventoryProject = '';
                rowData.ProductCodeExport = '';
              } else {
              }
            }
          }
        },
        error: (err) => {
          console.error('Error loading inventory project:', err);
          this.notification.error(
            'Thông báo',
            err.error.message || 'Có lỗi xảy ra khi tải thông tin kho giữ!'
          );
        },
      });
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
        console.error('Error validating inventory:', error);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi kiểm tra tồn kho!'
        );
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

  async saveDataBillExport() {
    console.log('saveDataBillExport called');

    this.onRecheckQty();

    if (!this.validateForm.valid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!'
      );
      this.validateForm.markAllAsTouched();
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const formValidation = this.validateFormData();
    if (!formValidation.isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.error,
        formValidation.message
      );
      return;
    }
    const inventoryValidation = this.validateInventoryStock();
    if (!inventoryValidation.isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.error,
        inventoryValidation.message
      );
      return;
    }

    const billExportDetailsFromTable = this.table_billExportDetail?.getData();
    if (
      !billExportDetailsFromTable ||
      billExportDetailsFromTable.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất một sản phẩm vào bảng!'
      );
      return;
    }

    const formValues = this.validateForm.value;
    const status = formValues.Status || this.newBillExport.Status || 0;

    if (status === 2 || status === 6) {
      const isValidKeep = await this.validateKeep();
      if (!isValidKeep) {
        return;
      }
    }
    if (status === 7 || status === 0) {
      for (const row of billExportDetailsFromTable) {
        const expectReturnDate = row.ExpectReturnDate;
        const projectID = row.ProjectID || 0;
        const stt = row.STT || '';

        if (!expectReturnDate || expectReturnDate === '') {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Ngày dự kiến trả dòng [${stt}]`
          );
          return;
        }

        if (projectID <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Dự án dòng [${stt}]`
          );
          return;
        }
      }
    }

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
        billExportDetail: this.mapTableDataToBillExportDetails(
          billExportDetailsFromTable
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log('Payload:', payload);
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Cập nhật thành công!'
            );
            this.closeModal();
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              res.message || 'Không thể cập nhật phiếu xuất!'
            );
          }
        },
        error: (err: any) => {
          // Nếu backend trả về JSON { message: "..."} hoặc { error: "..."}
          const backendMsg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Có lỗi xảy ra khi cập nhật!';
          this.notification.error(NOTIFICATION_TITLE.error, backendMsg);
          console.error('API error:', err);
        },
      });
    } else {
      const wareHouseCode = this.dataCbbProductGroup.find(
        (p: any) => p.ID === formValues.KhoTypeID
      );
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
        billExportDetail: this.mapTableDataToBillExportDetails(
          billExportDetailsFromTable
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log('Payload:', payload);
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Thêm mới thành công!'
            );
            this.closeModal();
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              res.message || 'Không thể thêm phiếu xuất!'
            );
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi thêm mới!'
          );
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
        ProjectPartListID: row.ProjectPartListID || 0,
        TradePriceDetailID: row.TradePriceDetailID || 0,
        POKHDetailID: row.POKHDetailID || 0,
        Specifications: row.Specifications || '',
        BillImportDetailID: row.ImportDetailID || 0,
        TotalInventory: row.TotalInventory || 0,
        ExpectReturnDate: row.ExpectReturnDate || null,
        CustomerResponse: row.CustomerResponse || '',
        POKHDetailIDActual: row.POKHDetailIDActual || 0,
        PONumber: row.PONumber || '',
        ChosenInventoryProject: row.ChosenInventoryProject || '', // Format: "id1-qty1;id2-qty2"
      };
    });
  }
}
