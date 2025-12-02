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
  Output,
  EventEmitter,
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
// import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
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
import { ProjectService } from '../../../../../project/project-service/project.service';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SelectControlComponent } from '../../../BillExport/Modal/select-control/select-control.component';
import { TabulatorPopupComponent } from '../../../../../../shared/components/tabulator-popup/tabulator-popup.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { AppUserService } from '../../../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { BillReturnComponent } from '../bill-return/bill-return.component';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';

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
  DateRequest?: Date | string | null;
  DateRequestImport: Date | string | null;
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
    TabulatorPopupComponent,
    HasPermissionDirective
  ],
  templateUrl: './bill-import-detail.component.html',
  styleUrl: './bill-import-detail.component.css',
})
export class BillImportDetailComponent
  implements OnInit, AfterViewInit, OnDestroy {
  cbbStatusPur: any = [
    { ID: 1, Name: 'Đã bàn giao' },
    { ID: 2, Name: 'Hủy bàn giao' },
    { ID: 3, Name: 'Không cần' },
  ];
  activePur: boolean = false;
  isVisible: boolean = true;
  private warehouseIdHN: number = 0;
  warehouses: any[] = [];
  table_billImportDetail: any;
  dataTableBillImportDetail: any[] = [];
  table_DocumnetImport: any;
  dataTableDocumnetImport: any[] = [];

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
  deliverID: number = 0;
  labelReceiver: string = '';
  isApproved: boolean = false;

  // Label động theo loại phiếu
  labelSupplier: string = 'Nhà cung cấp';
  labelDeliver: string = 'Người giao';
  placeholderSupplier: string = 'Chọn nhà cung cấp';
  placeholderDeliver: string = 'Chọn người giao';
  errorMessageSupplier: string = 'Vui lòng chọn nhà cung cấp!';
  errorMessageDeliver: string = 'Vui lòng chọn người giao!';
  //tao phieu tra
  @Input() createImport: any;
  @Input() dataHistory: any[] = [];
  @Input() groupID: number = 0; // Thêm groupID để nhận từ tab
  //
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;
  @Input() isEmbedded: boolean = false; // Để biết component đang được nhúng trong tab hay modal độc lập

  @Input() WarehouseCode = 'HN';
  @Input() poNCCId = 0;
  @Output() saveSuccess = new EventEmitter<void>(); // Emit khi save thành công trong chế độ embedded

  @Input() newBillImport: BillImport = {
    Id: 0,
    BillImportCode: '',
    ReciverID: 0,
    Reciver: '',
    DeliverID: 0,
    Deliver: '',
    KhoType: '',
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: '',
    CreatDate: new Date(),
    RulePayID: 0,
    DateRequestImport: new Date(),
  };
  isEditPM: boolean = true;
  cbbStatus: any = [
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];
  cbbProductType: any = [
    { ID: 1, Name: 'Hàng thương mại' },
    { ID: 2, Name: 'Hàng dự án' },
  ];
  @ViewChild('table_BillImportDetails') tableBillImportDetails!: ElementRef;
  @ViewChild('table_DocumnetImport') tableDocumnetImport!: ElementRef;

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


  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Popup state management
  showProductPopup: boolean = false;
  showProjectPopup: boolean = false;
  currentEditingCell: any = null;
  popupPosition: { top: string; left: string } = { top: '0px', left: '0px' };

  // Product popup columns
  productPopupColumns: ColumnDefinition[] = [
    { title: 'Mã SP', field: 'ProductCode', width: 120, headerHozAlign: 'center' },
    { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120, headerHozAlign: 'center' },
    { title: 'Tên SP', field: 'ProductName', width: 250, headerHozAlign: 'center' },
    { title: 'ĐVT', field: 'Unit', width: 80, headerHozAlign: 'center' },
  ];

  productSearchFields: string[] = ['ProductCode', 'ProductNewCode', 'ProductName'];

  // Project popup columns
  projectPopupColumns: ColumnDefinition[] = [
    { title: 'Mã dự án', field: 'ProjectCode', width: 150, headerHozAlign: 'center' },
    { title: 'Tên dự án', field: 'label', width: 300, headerHozAlign: 'center' },
  ];

  projectSearchFields: string[] = ['ProjectCode', 'label'];

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
    private appUserService: AppUserService,
    private projectService: ProjectService
  ) {
    this.validateForm = this.fb.group({
      BillImportCode: [{ value: '', disabled: true }, [Validators.required]],
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
      DateRequestImport: [null],
    });
  }

  /**
   * Cập nhật quyền sửa StatusPur dựa trên:
   * - Admin: luôn có quyền
   * - Phòng Purchasing (departmentID === 4): luôn có quyền
   * - Người giao (DeliverID === user.id): có quyền
   */
  private updateActivePur(): void {
    const currentDeliverID = this.validateForm.get('DeliverID')?.value || 0;
    const isDeliverer = currentDeliverID === this.appUserService.id;

    this.activePur =
      this.appUserService.isAdmin ||
      this.appUserService.departmentID === 4 ||
      isDeliverer;
  }

  ngOnInit(): void {
    // Khởi tạo activePur ban đầu
    this.updateActivePur();

    if (this.id > 0) {
      this.billImportService.getBillImportByID(this.id).subscribe((res) => {
        const data = res.data;
        if (data && (data.Status === true || data.Status === 1)) {
          this.isApproved = true;
        }
      });
    }
    this.billImportService.getWarehouse().subscribe((res: any) => {
      const list = res.data || [];
      this.warehouses = list;
      // Xác định kho hiện tại dựa trên mã WarehouseName (ví dụ: HN, HCM)
      const currentWarehouse = list.find(
        (item: any) =>
          String(item.WarehouseCode).toUpperCase() ===
          String(this.WarehouseCode).toUpperCase()
      );
      const currentId = currentWarehouse?.ID ?? 0;

      // Lấy ID kho HN để phục vụ logic người giao ở HCM
      const hnId =
        list.find((item: any) =>
          String(item.WareHouseCode).toUpperCase().includes('HN')
        )?.ID ?? 1;


      // Set WarehouseID và hiển thị tên kho; đồng thời khóa control để người dùng không chỉnh
      this.validateForm.controls['WarehouseID'].setValue(currentId);
      this.validateForm.controls['WarehouseName'].setValue(
        currentWarehouse?.WarehouseName || this.WarehouseCode
      );
      this.validateForm.controls['WarehouseID'].disable();

      this.warehouseIdHN = hnId;

      // Chỉ set DeliverID mặc định nếu KHÔNG có dataHistory
      if (!this.dataHistory || this.dataHistory.length === 0) {
        this.validateForm.controls['DeliverID'].setValue(
          this.appUserService.id || 0
        );
      }
      this.updateReceiverDeliver();
    });
    this.validateForm
      .get('BillTypeNew')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue: number) => {
        this.changeStatus();
      });
    this.validateForm
      .get('KhoTypeID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productGroupId: number) => {
        this.changeProductGroup(productGroupId);
        this.updateReceiverDeliver();
      });

    this.validateForm
      .get('SupplierID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeSuplierSale();
        this.updateReceiverDeliver();
      });
    this.validateForm
      .get('DeliverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateActivePur();
        if (this.table_DocumnetImport) {
          this.drawDocumentTable();
        }
      });

    this.validateForm
      .get('WarehouseID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateReceiverDeliver();
      });

    this.validateForm
      .get('DeliverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((deliverID: number) => {
        this.clearRestrictedFieldsIfNeeded(deliverID);
      });

    // LUỒNG RIÊNG CHO PONCC - Kiểm tra nếu dữ liệu đến từ PONCC
    if (this.poNCCId > 0 && this.newBillImport && this.newBillImport.BillImportCode) {
      // Đây là luồng từ PONCC - Yêu cầu nhập kho từ PO NCC
      console.log('🔵 Luồng PONCC detected - poNCCId:', this.poNCCId);
      console.log('🔵 Master data:', this.newBillImport);
      console.log('🔵 Detail data (selectedList):', this.selectedList);
      
      this.initialBillTypeNew = this.newBillImport.BillTypeNew || 4;
      this.isInitialLoad = false;

      // Cập nhật label theo loại phiếu
      this.updateLabels(this.newBillImport.BillTypeNew || 4);

      // Sẽ được xử lý trong patchDataFromPONCC() sau khi load lookups
    } else if (this.createImport) {
      this.newBillImport.BillTypeNew = 1;

      this.initialBillTypeNew = 1;
      this.validateForm.patchValue({
        BillTypeNew: 1,
        CreatDate: new Date(),
        DateRequestImport: null,
      });

      // Cập nhật label cho phiếu trả
      this.updateLabels(1);

      this.getNewCode();
      this.patchNewBillImportFromHistory();
    } else if (this.isCheckmode && this.id > 0) {
      this.getBillImportByID();
    } else if (!this.newBillImport.Id || this.newBillImport.Id === 0) {
      this.initialBillTypeNew = 0;
      this.isInitialLoad = false;
      // Cập nhật label cho loại phiếu mặc định
      this.updateLabels(0);
      this.getNewCode();
    }

    this.getDataCbbProductGroup();
    this.getDataCbbRulePay();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
    this.loadOptionProject();
    this.loadDocumentImport();

    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.newBillImport = { ...this.newBillImport, ...values };
      });

    // Xử lý luồng PONCC sau khi tất cả lookups đã được load
    // Gọi sau khi loadDocumentImport() để đảm bảo các combo đã sẵn sàng
    if (this.poNCCId > 0 && this.newBillImport && this.newBillImport.BillImportCode) {
      // Patch master data từ PONCC vào form
      this.patchDataFromPONCC();
      
      // Sau đó gọi changeProductGroup để load product options và map detail data
      // changeProductGroup sẽ detect luồng PONCC và gọi mapDataFromPONCCToTable()
      if (this.newBillImport.KhoTypeID && this.newBillImport.KhoTypeID > 0) {
        this.changeProductGroup(this.newBillImport.KhoTypeID);
      } else {
        console.warn('⚠️ PONCC: KhoTypeID không hợp lệ');
      }
    }
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.drawDocumentTable;
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

    this.validateForm.patchValue(
      {
        BillImportCode: this.newBillImport.BillImportCode,
        DeliverID: this.newBillImport.DeliverID,
        KhoTypeID: this.newBillImport.KhoTypeID,
        // BillTypeNew: GIỮ NGUYÊN giá trị đã set = 1, không patch lại
      },
      { emitEvent: false }
    );

    // Cập nhật activePur sau khi patch DeliverID từ history
    this.updateActivePur();

    this.isInitialLoad = false;
    if (this.newBillImport.KhoTypeID) {
      this.changeProductGroup(this.newBillImport.KhoTypeID);
    }
  }

  /**
   * Hàm xử lý dữ liệu master từ PONCC
   * Map dữ liệu từ newBillImport (được truyền từ PONCC) vào form
   * LƯU Ý: Không gọi changeProductGroup ở đây để tránh recursion
   */
  private patchDataFromPONCC() {
    if (!this.newBillImport || !this.newBillImport.BillImportCode) {
      console.warn('⚠️ patchDataFromPONCC: Không có dữ liệu master từ PONCC');
      return;
    }

    console.log('🔵 Đang patch master data từ PONCC:', this.newBillImport);

    // Patch dữ liệu master từ PONCC vào form
    this.validateForm.patchValue(
      {
        BillImportCode: this.newBillImport.BillImportCode || '',
        BillTypeNew: this.newBillImport.BillTypeNew || 4, // Yêu cầu nhập kho
        ReciverID: this.newBillImport.ReciverID || 0,
        WarehouseID: this.newBillImport.WarehouseID || 0,
        SupplierID: this.newBillImport.SupplierID || 0,
        DeliverID: this.newBillImport.DeliverID || 0,
        CreatDate: this.newBillImport.CreatDate ? new Date(this.newBillImport.CreatDate) : null,
        KhoTypeID: this.newBillImport.KhoTypeID || 0,
        RulePayID: this.newBillImport.RulePayID || 0,
        DateRequestImport: this.newBillImport.DateRequestImport 
          ? new Date(this.newBillImport.DateRequestImport) 
          : new Date(),
      },
      { emitEvent: false }
    );

    // Cập nhật activePur sau khi patch DeliverID từ PONCC
    this.updateActivePur();

    console.log('✅ Master data từ PONCC đã được patch vào form');
  }

  private mapDataHistoryToTable() {
    if (!this.dataHistory || this.dataHistory.length === 0) {
      return;
    }

    this.dataTableBillImportDetail = this.dataHistory.map((item: any) => {
      const productInfo =
        this.productOptions.find((p: any) => p.value === item.ProductID) || {};
      const projectInfo =
        this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};

      return {
        ID: item.ID || 0,
        POKHDetailID: item.POKHDetailID || null,
        ProductID: item.ProductID || null,
        ProductNewCode:
          item.ProductNewCode || productInfo.ProductNewCode || null,
        ProductCode: item.ProductCode || productInfo.ProductCode || '',
        ProductName: item.ProductName || productInfo.ProductName || '',
        Unit: item.Unit || productInfo.Unit || '',
        TotalInventory: item.TotalInventory || productInfo.TotalInventory || 0,
        Qty: item.BorrowQty || 0,
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
        BillCodePO: item.BillCodePO || '',
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
        ProjectPartListID: item.ProjectPartListID || null,
        TradePriceDetailID: item.TradePriceDetailID || 0,
        BillImportDetailID: item.BillImportDetailID || 0,
        ExpectReturnDate: item.ExpectReturnDate
          ? new Date(item.ExpectReturnDate)
          : new Date(),
        InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
        SomeBill: item.SomeBill || '',
        DateSomeBill: item.DateSomeBill ? new Date(item.DateSomeBill) : null,
        DPO: item.DPO || 0,
        DueDate: item.DueDate ? new Date(item.DueDate) : null,
        TaxReduction: item.TaxReduction || 0,
        COFormE: item.COFormE || 0,
        ReturnStatus: item.ReturnStatus || 0,
        BillExportDetailID: item.BorrowID || 0,
        CodeMaPhieuMuon: item.BorrowCode || '',
        ProjectCode: item.ProjectCode || ''
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

  /**
   * Hàm xử lý dữ liệu detail từ PONCC
   * Map dữ liệu từ selectedList (được truyền từ PONCC) vào table
   */
  private mapDataFromPONCCToTable() {
    if (!this.selectedList || this.selectedList.length === 0) {
      console.warn('⚠️ mapDataFromPONCCToTable: Không có dữ liệu detail từ PONCC');
      return;
    }

    console.log('🔵 Đang map detail data từ PONCC:', this.selectedList);

    // Map dữ liệu từ selectedList (PO detail) sang cấu trúc BillImportDetail
    this.dataTableBillImportDetail = this.selectedList.map((item: any, index: number) => {
      // Log từng item để debug
      if (index === 0) {
        console.log('🔍 Cấu trúc item đầu tiên từ PONCC:', item);
        console.log('🔍 Các keys có sẵn:', Object.keys(item));
      }
      
      // Tìm thông tin sản phẩm từ productOptions dựa trên ProductSaleID
      // ProductID trong PONCC data thực chất là ProductSaleID
      const productInfo =
        this.productOptions.find((p: any) => p.value === item.ProductSaleID) || {};
      
      // Tìm thông tin dự án từ projectOptions nếu có
      const projectInfo =
        this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};

      return {
        ID: 0, // Mới tạo, chưa có ID
        PONCCDetailID: item.ID || 0, // Lưu ID của PO detail để trace back
        
        // ProductID map từ ProductSaleID trong data PONCC
        ProductID: item.ProductSaleID || null,
        
        // Các trường sản phẩm: ưu tiên từ item, fallback về productInfo
        ProductNewCode: item.ProductNewCode || productInfo.ProductNewCode || '',
        ProductCode: item.ProductCode || productInfo.ProductCode || '',
        ProductName: item.ProductName || productInfo.ProductName || '',
        Unit: item.UnitName || item.Unit || productInfo.Unit || '',
        TotalInventory: productInfo.TotalInventory || 0,
        
        // Số lượng yêu cầu từ PO
        Qty: item.QtyRequest || item.QuantityRemain || 0,
        QuantityRemain: item.QuantityRemain || 0,
        QtyRequest: item.QtyRequest || 0,
        
        // Thông tin dự án
        ProjectID: item.ProjectID || 0,
        ProjectCodeExport: item.ProjectCode || projectInfo.ProjectCode || '',
        ProjectNameText: item.ProjectName || projectInfo.label || '',
        
        // Giá và thông tin khác từ PO
        ProductFullName: item.ProductName || '',
        // Note: item.Note || '',
        UnitPricePOKH: item.UnitPrice || 0,
        UnitPricePurchase: item.UnitPrice || 0,
        
        // Mã đơn hàng
        Note: item.POCode || '', // Để trống, sẽ được tạo khi lưu phiếu nhập
        BillCodePO: item.BillCode || '', // Mã đơn mua hàng từ PONCC
        
        // Thông tin khác
        Specifications: item.Specifications || '',
        GroupExport: '',
        UserReceiver: '',
        POKHID: 0,
        'Add Serial': '',
        ProductType: item.ProductType || 0,
        IsInvoice: item.IsBill || false,
        InvoiceNumber: '',
        SerialNumber: '',
        ReturnedStatus: false,
        ProjectPartListID: item.ProjectPartListID || null,
        TradePriceDetailID: 0,
        BillImportDetailID: 0,
        ExpectReturnDate: new Date(),
        InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
        
        // Thông tin thuế và giảm giá
        SomeBill: '',
        DateSomeBill: null,
        DPO: 0,
        DueDate: null,
        TaxReduction: 0,
        COFormE: 0,
        ReturnStatus: 0,
        BillExportDetailID: 0,
        CodeMaPhieuMuon: '',
        ProjectCode: item.ProjectCode || '',
        
        // Thêm các trường từ PO NCC
        PONCCCode: item.POCode || '',
        VAT: item.VAT || 0,
        VATMoney: item.VATMoney || 0,
        DiscountPercent: item.DiscountPercent || 0,
        Discount: item.Discount || 0,
        FeeShip: item.FeeShip || 0,
        TotalPrice: item.TotalPrice || 0,
        DeadlineDelivery: item.DeadlineDelivery ? new Date(item.DeadlineDelivery) : null,
        ExpectedDate: item.ExpectedDate ? new Date(item.ExpectedDate) : null,
        ActualDate: item.ActualDate ? new Date(item.ActualDate) : null,
      };
    });

    console.log('🔵 Dữ liệu đã map:', this.dataTableBillImportDetail);
    if (this.dataTableBillImportDetail.length > 0) {
      console.log('🔍 ProductSaleID của item đầu tiên:', this.dataTableBillImportDetail[0].ProductSaleID);
      console.log('🔍 BillCode của item đầu tiên:', this.dataTableBillImportDetail[0].BillCode);
    }

    // Load dữ liệu vào table nếu table đã khởi tạo
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
      setTimeout(() => {
        this.table_billImportDetail.redraw(true);
        console.log('✅ Detail data từ PONCC đã được load vào table');
      }, 100);
    } else {
      console.warn('⚠️ Table chưa được khởi tạo, dữ liệu sẽ được load sau');
    }
  }

  // Method để cập nhật label theo loại phiếu
  private updateLabels(billTypeNew: number) {
    if (billTypeNew === 0 || billTypeNew === 4) {
      // Phiếu nhập kho (0) hoặc Yêu cầu nhập kho (4)
      this.labelSupplier = 'Nhà cung cấp';
      this.labelDeliver = 'Người giao';
      this.placeholderSupplier = 'Chọn nhà cung cấp';
      this.placeholderDeliver = 'Chọn người giao';
      this.errorMessageSupplier = 'Vui lòng chọn nhà cung cấp!';
      this.errorMessageDeliver = 'Vui lòng chọn người giao!';
    } else if (billTypeNew === 1) {
      // Phiếu trả (1)
      this.labelSupplier = 'Bộ phận';
      this.labelDeliver = 'Người trả';
      this.placeholderSupplier = 'Chọn bộ phận';
      this.placeholderDeliver = 'Chọn người trả';
      this.errorMessageSupplier = 'Vui lòng chọn bộ phận!';
      this.errorMessageDeliver = 'Vui lòng chọn người trả!';
    } else if (billTypeNew === 3) {
      // Phiếu mượn NCC (3)
      this.labelSupplier = 'Nhà cung cấp';
      this.labelDeliver = 'Người giao';
      this.placeholderSupplier = 'Chọn nhà cung cấp';
      this.placeholderDeliver = 'Chọn người giao';
      this.errorMessageSupplier = 'Vui lòng chọn nhà cung cấp!';
      this.errorMessageDeliver = 'Vui lòng chọn người giao!';
    } else {
      // Các trường hợp khác (default)
      this.labelSupplier = 'Bộ phận';
      this.labelDeliver = 'Người trả';
      this.placeholderSupplier = 'Chọn bộ phận';
      this.placeholderDeliver = 'Chọn người trả';
      this.errorMessageSupplier = 'Vui lòng chọn bộ phận!';
      this.errorMessageDeliver = 'Vui lòng chọn người trả!';
    }
  }

  changeStatus() {
    const billTypeNew = this.validateForm.get('BillTypeNew')?.value;

    // Cập nhật label theo loại phiếu
    this.updateLabels(billTypeNew);

    // Cập nhật ngày tháng theo loại phiếu
    if (billTypeNew === 1) {
      // Phiếu trả: CreatDate = ngày hiện tại, DateRequestImport = null
      this.validateForm.patchValue({
        CreatDate: new Date(),
        DateRequestImport: null,
        DateRequest: null,
      });
    } else if (billTypeNew === 4) {
      // Loại phiếu 4: CreatDate = null, DateRequestImport = ngày hiện tại
      this.validateForm.patchValue({
        CreatDate: null,
        DateRequestImport: new Date(),
        DateRequest: null,
      });
    } else {
      // Các loại phiếu khác: DateRequest = null, DateRequestImport = ngày hiện tại
      this.validateForm.patchValue({
        DateRequest: null,
        DateRequestImport: new Date(),
      });
    }
    this.getNewCode();
  }

  changeSuplierSale() {
    const supplierId = this.validateForm.get('SupplierID')?.value;
    const specialSuppliers = [1175, 16677];
    this.validateForm.patchValue({
      RulePayID: specialSuppliers.includes(supplierId) ? 34 : 0,
    });
  }

  private updateReceiverDeliver(): void {
    if (this.isCheckmode && this.id > 0) return;

    const khoTypeId = this.validateForm.controls['KhoTypeID'].value || 0;
    const warehouseId = this.validateForm.controls['WarehouseID'].value || 0;
    const supplierId = this.validateForm.controls['SupplierID'].value || 0;

    if (!khoTypeId || !warehouseId) return;

    const isHCM = String(this.WarehouseCode).toUpperCase().includes('HCM');
    const specialSuppliers = [1175, 16677];

    // Nếu đang load từ history và có dataHistory, không ghi đè DeliverID
    const hasHistoryDeliverer = this.dataHistory && this.dataHistory.length > 0 && this.dataHistory[0].UserID;
    const shouldPreserveDeliverer = hasHistoryDeliverer && this.isInitialLoad;

    if (isHCM) {
      this.validateForm.controls['ReciverID'].setValue(
        this.appUserService.id || 0
      );

      if (specialSuppliers.includes(supplierId) && this.warehouseIdHN) {
        this.productSaleService
          .getdataProductGroupWareHouse(khoTypeId, this.warehouseIdHN)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              // Chỉ set DeliverID nếu không đang load từ history
              if (!shouldPreserveDeliverer) {
                this.validateForm.controls['DeliverID'].setValue(userId); // line 1878
              }
            },
            error: () => {
              if (!shouldPreserveDeliverer) {
                this.validateForm.controls['DeliverID'].setValue(0);
              }
            },
          });
      } else {
        // Chỉ set DeliverID = 0 nếu không đang load từ history
        if (!shouldPreserveDeliverer) {
          this.validateForm.controls['DeliverID'].setValue(0);
        }
      }
    } else {
      this.productSaleService
        .getdataProductGroupWareHouse(khoTypeId, warehouseId)
        .subscribe({
          next: (res: any) => {
            const userId = res?.data?.[0]?.UserID || 0;
            this.validateForm.controls['ReciverID'].setValue(userId);
          },
          error: () => {
            this.validateForm.controls['ReciverID'].setValue(0);
          },
        });
    }
  }

  private clearRestrictedFieldsIfNeeded(deliverID: number): void {
    // Kiểm tra xem user có quyền chỉnh sửa hay không
    const canEdit = !(
      this.appUserService.id != deliverID && !this.appUserService.isAdmin
    );

    // Nếu không có quyền chỉnh sửa, clear các trường restricted
    if (!canEdit && this.table_billImportDetail) {
      const allRows = this.table_billImportDetail.getRows();
      allRows.forEach((row: any) => {
        const rowData = row.getData();
        // Clear các trường nếu có giá trị
        const needsClear =
          rowData.SomeBill ||
          rowData.DateSomeBill ||
          rowData.DPO ||
          rowData.DueDate ||
          rowData.TaxReduction ||
          rowData.COFormE;

        if (needsClear) {
          row.update({
            SomeBill: '',
            DateSomeBill: null,
            DPO: 0,
            DueDate: null,
            TaxReduction: 0,
            COFormE: 0,
          });
        }
      });
    }
  }

  private recheckTotalQty(): void {
    if (!this.table_billImportDetail) return;

    const allRows = this.table_billImportDetail.getData();
    const productQtyMap = new Map<number, number>();

    // Bước 1: Tính tổng số lượng cho mỗi ProductID
    allRows.forEach((row: any) => {
      const productId = row.ProductID;
      const qty = parseFloat(row.Qty) || 0;

      if (productId) {
        const currentTotal = productQtyMap.get(productId) || 0;
        productQtyMap.set(productId, currentTotal + qty);
      }
    });

    // Bước 2: Cập nhật TotalQty cho tất cả các dòng có cùng ProductID
    allRows.forEach((row: any) => {
      const productId = row.ProductID;
      if (productId && productQtyMap.has(productId)) {
        const totalQty = productQtyMap.get(productId);
        // Tìm row trong table và update
        const tableRow = this.table_billImportDetail
          .getRows()
          .find((r: any) => r.getData() === row);
        if (tableRow) {
          tableRow.update({ TotalQty: totalQty });
        }
      }
    });
  }

  private calculateDueDate(row: any): void {
    const rowData = row.getData();
    const dateSomeBill = rowData.DateSomeBill;
    const dpo = parseInt(rowData.DPO) || 0;

    if (dateSomeBill && dpo > 0) {
      const someBillDate = new Date(dateSomeBill);
      const dueDate = new Date(someBillDate);
      dueDate.setDate(dueDate.getDate() + dpo);

      row.update({ DueDate: dueDate });
    } else if (!dateSomeBill || dpo === 0) {
      // Xóa DueDate nếu không có đủ dữ liệu
      row.update({ DueDate: null });
    }
  }

  private calculateQuantityKeep(
    quantityReal: number,
    quantityRequest: number
  ): number {
    let quantityKeep = quantityReal;

    // If both are > 0, keep the minimum
    if (quantityReal > 0 && quantityRequest > 0) {
      quantityKeep = Math.min(quantityReal, quantityRequest);
    }

    return quantityKeep;
  }

  private prepareInventoryProjectData(detailRow: any): any | null {
    const formValues = this.validateForm.getRawValue();

    if (detailRow.IsNotKeep === true) {
      return null;
    }

    if (formValues.BillTypeNew !== 0) {
      return null;
    }
    const projectID = detailRow.ProjectID || detailRow.ProjectIDKeep || 0;
    const pokhDetailID = detailRow.POKHDetailID || 0;
    if (projectID <= 0 && pokhDetailID <= 0) {
      return null;
    }
    const quantityReal = parseFloat(detailRow.Qty) || 0;
    const quantityRequest = parseFloat(detailRow.QuantityRequestBuy) || 0;
    let quantityKeep = this.calculateQuantityKeep(
      quantityReal,
      quantityRequest
    );
    const inventoryProject = {
      ID: detailRow.InventoryProjectID || 0,
      ProjectID: projectID,
      ProductSaleID: detailRow.ProductID,
      WarehouseID: formValues.WarehouseID,
      Quantity: quantityKeep,
      QuantityOrigin: quantityKeep,
      Note: detailRow.Note || '',
      POKHDetailID: pokhDetailID,
      CustomerID: detailRow.CustomerID || 0,
      EmployeeID: formValues.DeliverID || 0,
      IsDeleted: quantityKeep <= 0,
    };

    return inventoryProject;
  }

  getBillImportByID() {
    this.isLoading = true;
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
            DateRequest: data.DateRequestImport
              ? new Date(data.DateRequestImport)
              : null,
            DateRequestImport: data.DateRequestImport
              ? new Date(data.DateRequestImport)
              : null,
            RulePayID: data.RulePayID,
          };
          this.initialBillTypeNew = data.BillTypeNew;

          this.validateForm.patchValue(this.newBillImport, {
            emitEvent: false,
          });

          // Cập nhật label theo loại phiếu đã load
          this.updateLabels(data.BillTypeNew);

          // Cập nhật activePur sau khi load dữ liệu
          this.updateActivePur();

          this.isInitialLoad = false;
          this.changeProductGroup(this.validateForm.get('KhoTypeID')?.value);
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lấy thông tin phiếu nhập!'
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
        this.notification.error(
          'Thông báo',
          'Có lỗi khi lấy thông tin sản phẩm!'
        );
      },
    });
  }

  getProjectById(projectId: number) {
    this.projectService.getProject(projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const project = res.data;
          if (!this.projectOptions.find((p: any) => p.value === project.ID)) {
            this.projectOptions.push({
              label: project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
              ProjectName: project.ProjectName,
            });
            if (this.table_billImportDetail) {
              this.table_billImportDetail.redraw(true); // Làm mới bảng để hiển thị dự án mới
            }
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi lấy thông tin dự án!');
      },
    });
  }
  getBillImportDetailID() {
    this.isLoading = true;
    this.billImportService.getBillImportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];

          // Load tất cả các project cần thiết trước
          const projectIds = [
            ...new Set(
              rawData
                .map((item: any) => item.ProjectID)
                .filter((id: number) => id > 0)
            ),
          ] as number[];
          const projectLoadPromises = projectIds.map((projectId: number) => {
            if (!this.projectOptions.find((p: any) => p.value === projectId)) {
              return new Promise<void>((resolve) => {
                this.projectService.getProject(projectId).subscribe({
                  next: (res: any) => {
                    if (res?.data) {
                      const project = res.data;
                      this.projectOptions.push({
                        label: project.ProjectName,
                        value: project.ID,
                        ProjectCode: project.ProjectCode,
                        ProjectName: project.ProjectName,
                      });
                    }
                    resolve();
                  },
                  error: () => resolve(),
                });
              });
            }
            return Promise.resolve();
          });

          // Đợi tất cả project được load xong
          Promise.all(projectLoadPromises).then(() => {
            this.dataTableBillImportDetail = rawData.map((item: any) => {
              const productInfo =
                this.productOptions.find(
                  (p: any) => p.value === item.ProductID
                ) || {};
              // Nếu không tìm thấy sản phẩm, gọi getProductById để tải bổ sung
              if (!productInfo.value && item.ProductID) {
                this.getProductById(item.ProductID);
              }
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
                Unit: item.Unit || '',
                Qty: item.Qty || 0,
                QtyRequest: item.QtyRequest || 0,
                QuantityRemain: item.QuantityRemain || 0,
                ProjectID: item.ProjectID || 0,
                ProjectCodeExport: item.ProjectCodeExport || '',
                ProjectNameText: item.ProjectNameText || '',
                CustomerFullName: item.CustomerFullName || '',
                CustomerID: item.CustomerID || 0,
                ProductFullName: item.ProductFullName || '',
                Note: item.Note || '',
                PONumber: item.PONumber || '',
                BillCode: item.BillCode || '',
                BillCodePO: item.BillCodePO || '',
                Specifications: item.Specifications || '',
                GroupExport: item.GroupExport || '',
                UserReceiver: item.UserReceiver || '',
                CodeMaPhieuMuon: item.CodeMaPhieuMuon || '',
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
                SomeBill: item.SomeBill || '',
                DateSomeBill: item.DateSomeBill
                  ? new Date(item.DateSomeBill)
                  : null,
                DPO: item.DPO || 0,
                DueDate: item.DueDate ? new Date(item.DueDate) : null,
                TaxReduction: item.TaxReduction || 0,
                COFormE: item.COFormE || 0,
                IsNotKeep: item.IsNotKeep || false,
                POKHDetailQuantity: item.POKHDetailQuantity || '',
                ProjectIDKeep: item.ProjectIDKeep || 0,
                StatusQCText: item.StatusQCText || '',
              };
            });

            if (this.table_billImportDetail) {
              this.table_billImportDetail.replaceData(
                this.dataTableBillImportDetail
              );
              setTimeout(() => {
                this.table_billImportDetail.redraw(true);
              }, 100);
            }
            this.isLoading = false;
          });
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không có dữ liệu chi tiết phiếu xuất!'
          );
          this.dataTableBillImportDetail = [];
          if (this.table_billImportDetail) {
            this.table_billImportDetail.replaceData([]);
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
        this.dataTableBillImportDetail = [];
        if (this.table_billImportDetail) {
          this.table_billImportDetail.replaceData([]);
        }
        this.isLoading = false;
      },
    });
  }
  loadDocumentImport() {
    this.isLoading = true;
    this.billImportService.getDocumentImport(0, this.id).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.dataTableDocumnetImport = res.data;
          if (this.table_DocumnetImport) {
            this.table_DocumnetImport.replaceData(this.dataTableDocumnetImport);
          } else {
            this.drawDocumentTable();
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu documentImport'
        );
        this.isLoading = false;
      },
    });
  }
  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }
  getDataCbbRulePay() {
    this.billImportService.getDataRulePay().subscribe({
      next: (res: any) => {
        this.dataCbbRulePay = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }
  getDataCbbUser() {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbReciver = res.data;
        this.dataCbbDeliver = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }
  getDataCbbSupplierSale() {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }
  getNewCode() {
    const billTypeNew = this.validateForm.get('BillTypeNew')?.value;
    this.billImportService.getNewCode(billTypeNew).subscribe({
      next: (res: any) => {
        this.newBillImport.BillImportCode = res.data;
        this.validateForm.patchValue({ BillImportCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi mã phiếu');
      },
    });
  }
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
            .map((project) => {
              // <-- SỬA Ở ĐÂY
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
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách dự án'
        );
        this.projectOptions = [];
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

  private mapTableDataToBillImportDetails(tableData: any[]): any[] {
    const parsePOKHList = (
      pokhString: string
    ): Array<{ POKHDetailID: number; QuantityRequest: number }> => {
      if (!pokhString || pokhString.trim() === '') {
        return [];
      }

      return pokhString
        .split(',')
        .map((s) => {
          const parts = s.split('-').map((x) => x.trim());
          if (parts.length !== 2) return null;

          const id = Number(parts[0]);
          const qty = Number(parts[1]);

          // Chỉ return nếu cả id và qty đều hợp lệ (> 0)
          if (!isNaN(id) && !isNaN(qty) && id > 0 && qty > 0) {
            return { POKHDetailID: id, QuantityRequest: qty };
          }
          return null;
        })
        .filter(
          (x): x is { POKHDetailID: number; QuantityRequest: number } =>
            x !== null
        );
    };

    return tableData.map((row: any, index: number) => {
      // Parse POKHList từ POKHDetailQuantity
      const pokhList = parsePOKHList(row.POKHDetailQuantity || '');

      // Lấy POKHDetailID: ưu tiên từ row, nếu không có thì lấy từ item đầu tiên trong POKHList
      // Gửi null nếu không có giá trị (match với int? trong C#)
      let pokhDetailID: number | null = null;
      if (row.POKHDetailID && Number(row.POKHDetailID) > 0) {
        pokhDetailID = Number(row.POKHDetailID);
      } else if (pokhList.length > 0 && pokhList[0].POKHDetailID > 0) {
        pokhDetailID = pokhList[0].POKHDetailID;
      }

      return {
        ID: row.ID || 0,
        BillImportID: row.BillImportID || 0,
        ProductID: row.ProductID || 0,
        Qty: row.Qty || 0,
        Price: row.Price || 1,
        TotalPrice: (row.Qty || 0) * (row.Price || 1),
        ProjectName: row.ProjectName || '',
        ProjectCode: row.ProjectCode || '',
        SomeBill: row.SomeBill || '',
        Note: row.Note || '',
        STT: row.STT || index + 1,
        TotalQty: row.TotalQty || 0,
        CreatedDate: row.CreatedDate
          ? new Date(row.CreatedDate).toISOString()
          : new Date().toISOString(),
        UpdatedDate: new Date().toISOString(),
        ProjectID: row.ProjectID || 0,
        PONCCDetailID: row.PONCCDetailID || 0,
        SerialNumber: row.SerialNumber || '',
        CodeMaPhieuMuon: row.CodeMaPhieuMuon || '',
        BillExportDetailID: row.BillExportDetailID || 0,
        ProjectPartListID:
          row.ProjectPartListID && !isNaN(Number(row.ProjectPartListID))
            ? Number(row.ProjectPartListID)
            : 0,
        IsKeepProject: row.IsKeepProject || false,
        QtyRequest: row.QtyRequest || 0,
        BillCodePO: row.BillCodePO || '',
        ReturnedStatus: row.ReturnedStatus || false,
        InventoryProjectID: row.InventoryProjectID || 0,
        DateSomeBill: row.DateSomeBill
          ? new Date(row.DateSomeBill).toISOString()
          : null,
        isDeleted: row.isDeleted || false,
        DPO: row.DPO || 0,
        DueDate: row.DueDate ? new Date(row.DueDate).toISOString() : null,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
        IsNotKeep: row.IsNotKeep || false,
        Unit: row.Unit || 'PCS',
        POKHDetailID: pokhDetailID, // null hoặc number, match với int? trong C#
        POKHDetailQuantity: row.POKHDetailQuantity || null,
        CustomerID:
          row.CustomerID && Number(row.CustomerID) > 0
            ? Number(row.CustomerID)
            : null,
        QuantityRequestBuy:
          row.QuantityRequestBuy && Number(row.QuantityRequestBuy) > 0
            ? Number(row.QuantityRequestBuy)
            : null,
        POKHList: pokhList,
      };
    });
  }
  saveDataBillImport() {
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

    const formValues = this.validateForm.getRawValue();

    // Validate các trường bắt buộc
    if (!formValues.BillImportCode || formValues.BillImportCode.trim() === '') {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền số phiếu.'
      );
      return;
    }
    if (!formValues.SupplierID || formValues.SupplierID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Xin hãy điền thông tin ${this.labelSupplier.toLowerCase()}.`
      );
      return;
    }
    if (!formValues.ReciverID || formValues.ReciverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền thông tin người nhập.'
      );
      return;
    }
    if (!formValues.KhoTypeID || formValues.KhoTypeID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn kho quản lý.'
      );
      return;
    }
    if (!formValues.DeliverID || formValues.DeliverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Xin hãy điền thông tin ${this.labelDeliver.toLowerCase()}.`
      );
      return;
    }
    if (formValues.BillTypeNew !== 4 && !formValues.CreatDate) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng nhập Ngày nhập!'
      );
      return;
    }
    if (!formValues.RulePayID || formValues.RulePayID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng nhập Điều khoản TT!'
      );
      return;
    }

    const billImportDetailsFromTable = this.table_billImportDetail?.getData();
    if (
      !billImportDetailsFromTable ||
      billImportDetailsFromTable.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất một sản phẩm vào bảng!'
      );
      return;
    }
    const documentsFromTable = this.table_DocumnetImport?.getData();

    // Gửi array trực tiếp, không wrap trong object
    // Backend expect: List<BillImportDTO> (array trực tiếp)
    const payload = [
      {
        billImport: {
          ID: this.newBillImport.Id || 0,
          BillImportCode: formValues.BillImportCode,
          BillType: false,
          Reciver:
            this.dataCbbReciver.find((item) => item.ID === formValues.ReciverID)
              ?.FullName || '',
          Deliver:
            this.dataCbbDeliver.find((item) => item.ID === formValues.DeliverID)
              ?.FullName || '',
          KhoType:
            this.dataCbbProductGroup.find(
              (item) => item.ID === formValues.KhoTypeID
            )?.ProductGroupName || '',
          GroupID: String(formValues.KhoTypeID || ''),
          Suplier:
            this.dataCbbSupplier.find(
              (item) => item.ID === formValues.SupplierID
            )?.NameNCC || '',
          SupplierID: formValues.SupplierID,
          ReciverID: formValues.ReciverID,
          DeliverID: formValues.DeliverID,
          KhoTypeID: formValues.KhoTypeID,
          WarehouseID: formValues.WarehouseID || this.newBillImport.WarehouseID,
          CreatDate: formValues.CreatDate,
          DateRequestImport: formValues.DateRequestImport,
          UpdatedDate: new Date(),
          BillTypeNew: formValues.BillTypeNew,
          BillDocumentImportType: 2,
          CreatedDate: formValues.CreatDate,
          Status: false,
          PTNB: false,
          UnApprove: 1,
          RulePayID: formValues.RulePayID,
          IsDeleted: false,
          // Loại bỏ các trường không có trong BillImport entity:
          // DPO, DueDate, TaxReduction, COFormE, IsNotKeep
          // Các trường này chỉ có trong BillImportDetail
        },
        billImportDetail: this.mapTableDataToBillImportDetails(
          billImportDetailsFromTable
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
        billDocumentImports: this.mapTableDataToDocumentImports(
          documentsFromTable || []
        ),
      },
    ];


    this.billImportService.saveBillImport(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'
          );

          if (this.isEmbedded) {
            this.saveSuccess.emit();
          } else {
            this.closeModal();
          }
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message ||
            (this.isCheckmode ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!')
          );
        }
      },
      error: (err: any) => {
        console.error('Save error:', err);
        let errorMessage =
          'Có lỗi xảy ra khi ' + (this.isCheckmode ? 'cập nhật!' : 'thêm mới!');
        if (err.error && err.error.message) {
          errorMessage += ' Chi tiết: ' + err.error.message;
        }
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  openModalBillExportDetail(ischeckmode: boolean) {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info(
        NOTIFICATION_TITLE.success,
        'Vui lòng chọn 1 phiếu xuất để sửa'
      );
      this.id = 0;
      return;
    }
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.id = 0;
        // this.loadDataBillExport();
      }
    });
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

      let data = getData();
      data = data.map((p: any) => ({
        ...p,
        productLabel: `${p.ProductNewCode || ''} | ${p.ProductCode || ''} | ${p.ProductName || ''
          }`,
      }));
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

  // Toggle Product Popup
  toggleProductPopup(cell: any) {
    this.currentEditingCell = cell;
    const cellElement = cell.getElement();
    const rect = cellElement.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const popupHeight = 350;
    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow >= popupHeight) {
      this.popupPosition = {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`
      };
    } else {
      this.popupPosition = {
        top: `${rect.top + window.scrollY - popupHeight}px`,
        left: `${rect.left + window.scrollX}px`
      };
    }

    this.showProductPopup = true;
  }

  // Toggle Project Popup
  toggleProjectPopup(cell: any) {
    this.currentEditingCell = cell;
    const cellElement = cell.getElement();
    const rect = cellElement.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const popupHeight = 350;
    const spaceBelow = viewportHeight - rect.bottom;

    if (spaceBelow >= popupHeight) {
      this.popupPosition = {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`
      };
    } else {
      this.popupPosition = {
        top: `${rect.top + window.scrollY - popupHeight}px`,
        left: `${rect.left + window.scrollX}px`
      };
    }

    this.showProjectPopup = true;
  }

  // Handle Product Selection
  onProductSelected(selectedProduct: any) {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const productValue = selectedProduct.value || selectedProduct.ID;

    row.update({
      ProductID: productValue,
      ProductCode: selectedProduct.ProductCode,
      ProductNewCode: selectedProduct.ProductNewCode,
      Unit: selectedProduct.Unit || '',
      ProductName: selectedProduct.ProductName,
    });

    this.recheckTotalQty();
    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  // Handle Project Selection
  onProjectSelected(selectedProject: any) {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();
    const projectValue = selectedProject.value || selectedProject.ID;

    row.update({
      ProjectID: projectValue,
      ProjectCodeExport: selectedProject.ProjectCode,
      ProjectName: selectedProject.label,
      ProjectNameText: selectedProject.label,
      InventoryProjectIDs: [projectValue],
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

  onTabChange(index: number): void {
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
        if (Array.isArray(productData)) {
          this.productOptions = productData
            .filter((product) => product.ID > 0)
            .map((product) => ({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductNewCode: product.ProductNewCode,
            }));

          if (this.table_billImportDetail) {
            this.table_billImportDetail.redraw(true);
          }
        } else {
          this.productOptions = [];
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Dữ liệu sản phẩm không hợp lệ!'
          );
        }
        // Gọi hàm map data SAU KHI productOptions đã load xong
        // LUỒNG PONCC - Ưu tiên cao nhất
        if (this.poNCCId > 0 && this.selectedList && this.selectedList.length > 0) {
          console.log('🔵 changeProductGroup: Xử lý luồng PONCC');
          this.isEditPM = false; // Không cho phép chỉnh sửa PM
          
          // Patch master data từ PONCC (đã có sẵn trong newBillImport)
          this.patchDataFromPONCC();
          
          // Map detail data từ PONCC vào table
          this.mapDataFromPONCCToTable();
        }
        // LUỒNG PHIẾU TRẢ - Từ lịch sử mượn
        else if (
          this.createImport == true &&
          this.dataHistory &&
          this.dataHistory.length > 0
        ) {
          this.isEditPM = false;
          this.mapDataHistoryToTable();
        } 
        // LUỒNG CHỈNH SỬA - Load dữ liệu từ ID
        else if (this.isCheckmode) {
          this.getBillImportDetailID();
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi khi tải danh sách sản phẩm!'
        );
        this.productOptions = [];
      },
    });
  }
  mapTableDataToDocumentImports(documents: any[]): any[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    return documents.map((doc) => ({
      ID: doc.ID || 0,
      DocumentImportID: doc.DocumentImportID || 0,
      ReasonCancel: (doc.ReasonCancel || '').trim(),
      Note: (doc.Note || '').trim(),
      Status: doc.Status || 0,
      StatusPurchase: doc.DocumentStatusPur || 0,
      BillImportID: this.newBillImport.Id || 0,
      UpdatedDate: new Date().toISOString(),
    }));
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
        if (Array.isArray(serials) && serials.length > 0) {
          const serialsID = serials.map((s) => s.ID).join(',');
          row.update({ SerialNumber: serialsID });
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Cập nhật serial thành công!'
          );
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Dữ liệu serial không hợp lệ!'
          );
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  openBillReturnModal(rowData: any, row: RowComponent) {
    const modalRef = this.modalService.open(BillReturnComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Set input properties
    modalRef.componentInstance.productID = rowData.ProductID || 0;
    modalRef.componentInstance.Type = 1;

    // Subscribe to output event
    modalRef.componentInstance.maphieuSelected.subscribe((maphieu: string) => {
      if (maphieu) {
        row.update({ CodeMaPhieuMuon: maphieu });
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Cập nhật phiếu mượn thành công!'
        );
        modalRef.close();
      }
    });
  }

  //vẽ bảng
  drawTable() {
    this.isLoading = true; // Bắt đầu loading
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    } else {
      this.table_billImportDetail = new Tabulator(
        this.tableBillImportDetails.nativeElement,
        {
          data: this.dataTableBillImportDetail,
          layout: 'fitDataFill',
          height: '38vh',
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
              frozen: true,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
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
                    },
                  });
                }
              },
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
              title: 'STT',
              field: 'STT',
              formatter: 'rownum',
              hozAlign: 'center',
              width: 60,
              headerSort: false,
              frozen: true,
            },
            {
              title: 'Mã nội bộ',
              field: 'ProductNewCode',
              hozAlign: 'left',
              headerHozAlign: 'center',
              frozen: true,
            },
            {
              title: 'Mã hàng',
              field: 'ProductID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 450,
              frozen: true,
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }

                const rowData = cell.getRow().getData();
                let productcode = rowData['ProductCode'] || '';

                if (!productcode) {
                  const product = this.productOptions.find(
                    (p: any) => p.value === val
                  );
                  productcode = product ? product.ProductCode : '';
                }

                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productcode}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellClick: (e, cell) => {
                this.toggleProductPopup(cell);
              },
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
              frozen: true,

              width: 450,
            },

            {
              title: 'ĐVT',
              field: 'Unit',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Mã theo dự án',
              field: 'ProjectCodeExport',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'SL yêu cầu',
              field: 'QtyRequest',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'number',
            },
            {
              title: 'SL thực tế',
              field: 'Qty',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'number',
              cellEdited: (cell) => {
                this.recheckTotalQty();
              },
            },
            // {
            //   title: 'Tổng SL',
            //   field: 'TotalQty',
            //   hozAlign: 'right',
            //   headerHozAlign: 'center',
            //   editor: 'number',
            //   tooltip: 'Tổng số lượng (tự động tính khi có sản phẩm trùng)',
            //   visible: false,
            // },
            // {
            //   title: 'SL còn lại',
            //   field: 'QtyRemain',
            //   hozAlign: 'right',
            //   headerHozAlign: 'center',
            //   visible: false,
            // },
            {
              title: 'Không giữ',
              field: 'IsNotKeep',
              hozAlign: 'center',
              headerHozAlign: 'center',
              formatter: function (cell) {
                const value = cell.getValue();
                const checked = value ? 'checked' : '';
                return `<input type="checkbox" ${checked} class="tabulator-custom-checkbox mt-2 w-100"/>`;
              },
              cellClick: function (_e, cell) {
                // Toggle giá trị khi click vào cell
                const currentValue = cell.getValue();
                cell.setValue(!currentValue);
              },
            },
            // {
            //   title: 'ID Kho giữ',
            //   field: 'InventoryProjectID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID bản ghi trong bảng InventoryProject',
            // },
            // {
            //   title: 'Dự án giữ',
            //   field: 'ProjectIDKeep',
            //   hozAlign: 'left',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID dự án để giữ hàng',
            // },
            // {
            //   title: 'ID Mượn',
            //   field: 'BorrowID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID phiếu mượn để theo dõi trả hàng',
            // },
            // {
            //   title: 'ID PO NCC',
            //   field: 'PONCCDetailID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID chi tiết đơn mua hàng NCC',
            // },
            // {
            //   title: 'ID POKH',
            //   field: 'POKHDetailID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID chi tiết POKH',
            // },

            // {
            //   title: 'ID Mapping',
            //   field: 'IdMapping',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID mapping hóa đơn',
            // },
            // {
            //   title: 'Tồn kho?',
            //   field: 'IsStock',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   formatter: 'tickCross',
            //   visible: false,
            // },
            // {
            //   title: 'ID KH',
            //   field: 'CustomerID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            // },
            // {
            //   title: 'SL yêu cầu mua',
            //   field: 'QuantityRequestBuy',
            //   hozAlign: 'right',
            //   headerHozAlign: 'center',
            //   visible: false,
            // },
            // {
            //   title: 'ID QC',
            //   field: 'BillImportQCID',
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   visible: false,
            //   tooltip: 'ID yêu cầu kiểm tra QC',
            // },
            // {
            //   title: 'Trạng thái QC',
            //   field: 'StatusQCText',
            //   hozAlign: 'left',
            //   headerHozAlign: 'center',
            //   visible: false,
            // },
            {
              title: 'Mã dự án/Công ty',
              field: 'ProjectID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 200,
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }
                const project = this.projectOptions.find(
                  (p: any) => p.value === val
                );
                const ProjectCode = project ? project.ProjectCode : val;

                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${ProjectCode}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellClick: (e, cell) => {
                this.toggleProjectPopup(cell);
              },
            },
            {
              title: 'Tên dự án/Công ty',
              field: 'ProjectNameText',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Khách hàng',
              field: 'CustomerFullName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Đơn mua hàng',
              field: 'BillCodePO',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Số POKH',
              field: 'PONumber',
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
              title: 'Số hóa đơn',
              field: 'SomeBill',
              hozAlign: 'left',
              headerHozAlign: 'center',

              editor: (cell, onRendered, success, cancel) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = cell.getValue() || '';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(input.value);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(input.value);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                } else {
                  // Clear giá trị khi không được phép chỉnh sửa
                  if (cell.getValue()) {
                    cell.setValue('');
                  }
                }
                return false;
              },
              mutator: (value, data) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );

                if (!canEdit) {
                  return null; // auto clear
                }

                return value;
              },
            },
            {
              title: 'Ngày hóa đơn',
              field: 'DateSomeBill',
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
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'date';
                  const currentValue = cell.getValue();
                  if (currentValue) {
                    const date = new Date(currentValue);
                    input.value = date.toISOString().split('T')[0];
                  }
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(input.value ? new Date(input.value) : null);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(input.value ? new Date(input.value) : null);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                } else {
                  // Clear giá trị khi không được phép chỉnh sửa
                  if (cell.getValue()) {
                    cell.setValue(null);
                  }
                }
                return false;
              },
              cellEdited: (cell) => {
                const row = cell.getRow();
                this.calculateDueDate(row);
              },
              mutator: (value, data) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );

                if (!canEdit) {
                  return null; // auto clear
                }

                return value;
              },
            },

            {
              title: 'Số ngày công nợ',
              field: 'DPO',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: (cell, onRendered, success, cancel) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'number';
                  input.value = cell.getValue() || '';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(parseFloat(input.value) || 0);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(parseFloat(input.value) || 0);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                } else {
                  // Clear giá trị khi không được phép chỉnh sửa
                  if (cell.getValue()) {
                    cell.setValue(0);
                  }
                }
                return false;
              },
              mutator: (value, data) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );

                if (!canEdit) {
                  return null; // auto clear
                }

                return value;
              },
              cellEdited: (cell) => {
                const row = cell.getRow();
                this.calculateDueDate(row);
              },
            },
            {
              title: 'Ngày tới hạn',
              field: 'DueDate',
              hozAlign: 'left',
              headerHozAlign: 'center',
              formatter: (cell) => {
                const value = cell.getValue();
                if (!value) return '';
                const date = new Date(value);
                if (isNaN(date.getTime())) return '';
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              },
              editor: (cell, onRendered, success, cancel) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'date';
                  const currentValue = cell.getValue();
                  if (currentValue) {
                    const date = new Date(currentValue);
                    input.value = date.toISOString().split('T')[0];
                  }
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(input.value ? new Date(input.value) : null);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(input.value ? new Date(input.value) : null);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                } else {
                  // Clear giá trị khi không được phép chỉnh sửa
                  if (cell.getValue()) {
                    cell.setValue(null);
                  }
                }
                return false;
              },
              mutator: (value, data) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );

                if (!canEdit) {
                  return null; // auto clear
                }

                return value;
              },
              editable: false,
            },
            {
              title: 'Tiền thuế giảm',
              field: 'TaxReduction',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: (cell, onRendered, success, cancel) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'number';
                  input.value = cell.getValue() || '';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(parseFloat(input.value) || 0);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(parseFloat(input.value) || 0);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                }
                return false;
              },
              formatter: function (cell) {
                let value = cell.getValue();
                if (value == null || value === '') return '';
                return Number(value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              },
            },
            {
              title: 'Chi phí FE',
              field: 'COFormE',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: (cell, onRendered, success, cancel) => {
                const canEdit = !(
                  this.appUserService.id != this.newBillImport.DeliverID &&
                  !this.appUserService.isAdmin
                );
                if (canEdit) {
                  const input = document.createElement('input');
                  input.type = 'number';
                  input.value = cell.getValue() || '';
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';
                  onRendered(() => {
                    input.focus();
                  });
                  input.addEventListener('blur', () => {
                    success(parseFloat(input.value) || 0);
                  });
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      success(parseFloat(input.value) || 0);
                    }
                    if (e.key === 'Escape') {
                      cancel(cell.getValue());
                    }
                  });
                  return input;
                }
                return false;
              },
              formatter: function (cell) {
                let value = cell.getValue();
                if (value == null || value === '') return '';
                return Number(value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              },
            },
            {
              title: 'Trạng thái QC',
              field: 'StatusQCText',
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
            {
              title: 'Phiếu mượn',
              field: 'CodeMaPhieuMuon',
              hozAlign: 'left',
              headerHozAlign: 'center',
              cellClick: (_e: any, cell: any) => {
                if (!this.isEditPM) return;
                const row = cell.getRow();
                const rowData = row.getData();
                this.openBillReturnModal(rowData, row);
              },
            },
            // {
            //   title: 'Serial Number',
            //   field: 'SerialNumber',
            //   hozAlign: 'left',
            //   headerHozAlign: 'center',
            //   visible: false,
            // },
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
                const type = 1; // dành cho phiếu nhập

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
                    next: (res: any) => {
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
                    error: (err: any) => {
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
      this.isLoading = false; // Kết thúc loading
    }
  }
  drawDocumentTable() {
    this.isLoading = true;

    setTimeout(() => {
      this.table_DocumnetImport = new Tabulator(
        this.tableDocumnetImport.nativeElement,
        {
          data: this.dataTableDocumnetImport, // mảng chứa dữ liệu JSON
          layout: 'fitDataFill',
          height: '38vh',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,

          columns: [
            {
              title: 'Trạng thái pur',
              field: 'DocumentStatusPur',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
              editable: this.activePur,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.cbbStatusPur,
                { valueField: 'ID', labelField: 'Name' }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if ((!val && val !== 0) || val == 0)
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p><i class="fas fa-angle-down"></i></div>';
                const st = this.cbbStatusPur.find(
                  (p: any) => p.ID === parseInt(val) || p.ID === val
                );
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${st ? st.Name : val
                  }</p><i class="fas fa-angle-down"></i></div>`;
              },
            },
            {
              title: 'Mã chứng từ',
              field: 'DocumentImportCode',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Tên chứng từ',
              field: 'DocumentImportName',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Trạng thái',
              field: 'StatusText',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Ngày nhận / hủy nhận',
              field: 'DateRecive',
              headerHozAlign: 'center',
              hozAlign: 'center',
              formatter: 'datetime',
              formatterParams: {
                inputFormat: 'iso',
                outputFormat: 'dd/MM/yyyy HH:mm',
              },
            },
            {
              title: 'Người nhận / Hủy',
              field: 'FullNameRecive',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Lý do huỷ',
              field: 'ReasonCancel',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              hozAlign: 'left',
              width: 300,
            },
          ],
        }
      );

      this.isLoading = false;
    }, 300);
  }
}
