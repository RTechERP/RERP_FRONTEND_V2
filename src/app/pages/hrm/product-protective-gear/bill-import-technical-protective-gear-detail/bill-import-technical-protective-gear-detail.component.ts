import { PONCCDetail } from '../../../purchase/poncc/poncc.model';
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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DateTime } from 'luxon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorPopupComponent } from '../../../../shared/components/tabulator-popup/tabulator-popup.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { MenuItem, PrimeIcons, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import {
  BillImportTechnicalProtectiveGear,
  BillImportTechnicalProtectiveGearField,
} from '../model/bill-import-technical-protective-gear';
import { BillImportDetailTechnicalProtectiveGear } from '../model/bill-import-detail-technical-protective-gear';

@Component({
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
    NzTabsModule,
    NzSpinModule,
    TabulatorPopupComponent,
    HasPermissionDirective,
  ],
  selector: 'app-bill-import-technical-protective-gear-detail',
  templateUrl: './bill-import-technical-protective-gear-detail.component.html',
  // styleUrls: ['./bill-import-technical-protective-gear-detail.component.css']
})
export class BillImportTechnicalProtectiveGearDetailComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  billImportTechnicalProtectiveGearField =
    BillImportTechnicalProtectiveGearField;
  supplierList: any[] = [];
  customerList: any[] = [];
  receiverAndDeliverList: any[] = [];
  warehouseList: any[] = [];
  rulePayList: any[] = [];
  productList: any[] = [];

  isVisible: boolean = true;
  private warehouseIdHN: number = 0;
  table_billImportDetail: any;
  dataTableBillImportDetail: any[] = [];
  table_DocumnetImport: any;
  dataTableDocumnetImport: any[] = [];
  menuBars: MenuItem[] = [];

  isLoading: boolean = false;
  isSaving: boolean = false; // Loading state cho nút lưu
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

  productOptions: any = [];
  projectOptions: any = [];

  billID: number = 0;
  deliverID: number = 0;
  labelReceiver: string = '';

  //tao phieu tra
  @Input() createImport: any;
  @Input() dataHistory: any[] = [];
  @Input() groupID: number = 0; // Thêm groupID để nhận từ tab
  //
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;
  @Input() isEmbedded: boolean = false; // Để biết component đang được nhúng trong tab hay modal độc lập

  @Input() warehouseID = 0;
  @Output() saveSuccess = new EventEmitter<void>(); // Emit khi save thành công trong chế độ embedded

  @Input() newBillImport: BillImportTechnicalProtectiveGear = {
    ID: 0,
    BillCode: '',
    CreatDate: null,

    Deliver: '',
    Receiver: '',
    Status: false,

    Suplier: '',
    BillType: false,
    WarehouseType: '',

    DeliverID: null,
    ReceiverID: null,
    SuplierID: null,
    GroupTypeID: null,

    CreatedBy: null,
    CreatedDate: null,
    UpdatedBy: null,
    UpdatedDate: null,

    Image: '',
    WarehouseID: null,
    SupplierSaleID: null,
    BillTypeNew: null,

    IsBorrowSupplier: null,
    CustomerID: null,
    BillDocumentImportType: null,
    DateRequestImport: null,
    RulePayID: null,
    IsNormalize: false,
    ApproverID: null,
    IsDeleted: false,
  };

  isEditPM: boolean = true;
  cbbStatus: any[] = [
    { ID: 0, Name: '--Chọn loại--' },
    { ID: 1, Name: 'Mượn NCC' },
    { ID: 2, Name: 'Mua NCC' },
    { ID: 3, Name: 'Trả' },
    { ID: 4, Name: 'Nhập nội bộ' },
    { ID: 5, Name: 'Y/c nhập kho' },
    { ID: 6, Name: 'Nhập hàng bảo hành' },
  ];

  @ViewChild('table_BillImportDetails') tableBillImportDetails!: ElementRef;

  private initialBillTypeNew: number | null = null; // Thêm biến này
  private isInitialLoad: boolean = true; // Cờ để biết có đang load lần đầu không
  dateFormat = 'dd/MM/yyyy';

  validateForm!: FormGroup;
  private destroy$ = new Subject<void>();

  // Popup state management
  showProductPopup: boolean = false;
  showProjectPopup: boolean = false;
  currentEditingCell: any = null;
  popupPosition: { top: string; left: string } = { top: '0px', left: '0px' };

  // Các field để search trong popup
  productSearchFields: string[] = [
    'ProductCode',
    'ProductCodeRTC',
    'ProductName',
  ];

  // Product popup columns
  productPopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã SP',
      field: 'ProductCode',
      width: 120,
      headerHozAlign: 'center',
    },
    {
      title: 'Tên SP',
      field: 'ProductName',
      width: 250,
      headerHozAlign: 'center',
    },
    {
      title: 'Hãng',
      field: 'Maker',
      width: 250,
      headerHozAlign: 'center',
    },
    {
      title: 'Mã nội bộ',
      field: 'ProductCodeRTC',
      width: 250,
      headerHozAlign: 'center',
    },
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

  constructor(
    private modalService: NgbModal,
    private modal: NzModalService,
    private fb: NonNullableFormBuilder,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal,
    private appUserService: AppUserService,
    private ProductProtectiveGearService: ProductProtectiveGearService,
  ) {}

  ngOnInit(): void {
    this.getSupplier();
    this.getCustomer();
    this.getReceiverAndDeliver();
    this.getWarehouse();
    this.getRulePay();
    this.getProduct();
    this.initFormGroup();
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
      });

    this.validateForm
      .get('SupplierID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeSuplierSale();
      });

    // Tự động đổ tên người giao khi chọn
    this.validateForm
      .get('DeliverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((deliverID: number) => {
        if (deliverID) {
          const deliverer = this.receiverAndDeliverList.find(
            (p) => p.ID === deliverID,
          );
          if (deliverer) {
            this.validateForm.patchValue(
              {
                Deliver: deliverer.FullName,
              },
              { emitEvent: false },
            );
          }
        }
      });

    // Tự động đổ tên người nhận khi chọn
    this.validateForm
      .get('ReceiverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((receiverID: number) => {
        if (receiverID) {
          const receiver = this.receiverAndDeliverList.find(
            (p) => p.ID === receiverID,
          );
          if (receiver) {
            this.validateForm.patchValue(
              {
                Receiver: receiver.FullName,
              },
              { emitEvent: false },
            );
          }
        }
      });
    this.validateForm
      .get('DeliverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((deliverID: number) => {
        this.clearRestrictedFieldsIfNeeded(deliverID);
      });

    // Kiểm tra chế độ: Sửa hay Thêm mới
    if (this.isCheckmode && this.id > 0) {
      // Chế độ sửa - load data từ API
      this.getBillImportByID();
    } else {
      // Chế độ thêm mới - reset form và data
      this.resetFormForNewRecord();
    }

    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.newBillImport = { ...this.newBillImport, ...values };
      });
  }
  initFormGroup() {
    this.validateForm = this.fb.group({
      ID: this.fb.control(this.newBillImport.ID),
      BillCode: this.fb.control(this.newBillImport.BillCode, [
        Validators.required,
      ]),
      CreatDate: this.fb.control(this.newBillImport.CreatDate),
      Deliver: this.fb.control(this.newBillImport.Deliver),
      Receiver: this.fb.control(this.newBillImport.Receiver),
      Status: this.fb.control(this.newBillImport.Status),
      Suplier: this.fb.control(this.newBillImport.Suplier),
      BillType: this.fb.control(this.newBillImport.BillType),
      WarehouseType: this.fb.control(this.newBillImport.WarehouseType),
      DeliverID: this.fb.control(this.newBillImport.DeliverID, [
        Validators.required,
      ]),
      ReceiverID: this.fb.control(this.newBillImport.ReceiverID, [
        Validators.required,
      ]),
      SuplierID: this.fb.control(this.newBillImport.SuplierID),
      GroupTypeID: this.fb.control(this.newBillImport.GroupTypeID),
      CreatedBy: this.fb.control(this.newBillImport.CreatedBy),
      CreatedDate: this.fb.control(this.newBillImport.CreatedDate),
      UpdatedBy: this.fb.control(this.newBillImport.UpdatedBy),
      UpdatedDate: this.fb.control(this.newBillImport.UpdatedDate),
      Image: this.fb.control(this.newBillImport.Image),
      WarehouseID: this.fb.control(this.newBillImport.WarehouseID),
      SupplierSaleID: this.fb.control(this.newBillImport.SupplierSaleID),
      BillTypeNew: this.fb.control(this.newBillImport.BillTypeNew, [
        Validators.required,
      ]),
      IsBorrowSupplier: this.fb.control(this.newBillImport.IsBorrowSupplier),
      CustomerID: this.fb.control(this.newBillImport.CustomerID),
      BillDocumentImportType: this.fb.control(
        this.newBillImport.BillDocumentImportType,
      ),
      DateRequestImport: this.fb.control(this.newBillImport.DateRequestImport),
      RulePayID: this.fb.control(this.newBillImport.RulePayID, [
        Validators.required,
      ]),
      IsNormalize: this.fb.control(this.newBillImport.IsNormalize),
      ApproverID: this.fb.control(this.newBillImport.ApproverID),
      IsDeleted: this.fb.control(this.newBillImport.IsDeleted),
    });
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private getSupplier() {
    this.ProductProtectiveGearService.getSupplier().subscribe({
      next: (res) => {
        this.supplierList = res.data;
        console.log('supplierList', this.supplierList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  private getCustomer() {
    this.ProductProtectiveGearService.getCustomer().subscribe({
      next: (res) => {
        this.customerList = res.data;
        console.log('customerList', this.customerList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  private getReceiverAndDeliver() {
    this.ProductProtectiveGearService.getReceiverAndDeliver().subscribe({
      next: (res) => {
        this.receiverAndDeliverList = res.data;
        console.log('receiverAndDeliverList', this.receiverAndDeliverList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  private getWarehouse() {
    this.ProductProtectiveGearService.getWarehouse().subscribe({
      next: (res) => {
        this.warehouseList = res.data;
        console.log('warehouseList', this.warehouseList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  private getRulePay() {
    this.ProductProtectiveGearService.getRulePay().subscribe({
      next: (res) => {
        this.rulePayList = res.data;
        console.log('rulePayList', this.rulePayList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  private getProduct() {
    this.ProductProtectiveGearService.getProduct(this.warehouseID).subscribe({
      next: (res) => {
        this.productList = res.data;
        console.log('productList', this.productList);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  // Reset form và data khi thêm mới
  private resetFormForNewRecord() {
    // Reset newBillImport về giá trị mặc định
    this.newBillImport = {
      ID: 0,
      BillCode: '',
      CreatDate: null,
      Deliver: '',
      Receiver: '',
      Status: false,
      Suplier: '',
      BillType: false,
      WarehouseType: 'Đồ bảo hộ',
      DeliverID: null,
      ReceiverID: null,
      SuplierID: null,
      GroupTypeID: null,
      CreatedBy: null,
      CreatedDate: null,
      UpdatedBy: null,
      UpdatedDate: null,
      Image: '',
      WarehouseID: 5, // Default: Kho đồ bảo hộ
      SupplierSaleID: null,
      BillTypeNew: 0, // Default: Mượn NCC (index 0 trong cbbStatus)
      IsBorrowSupplier: null,
      CustomerID: null,
      BillDocumentImportType: null,
      DateRequestImport: null,
      RulePayID: null,
      IsNormalize: false,
      ApproverID: null,
      IsDeleted: false,
    };

    // Reset form
    if (this.validateForm) {
      this.validateForm.reset();
      this.validateForm.patchValue({
        ID: 0,
        CreatDate: new Date(),
        BillTypeNew: 0, // Default: index 0 trong cbbStatus
        WarehouseID: 5, // Default: Kho đồ bảo hộ
        RulePayID: 34,
        WarehouseType: 'Đồ bảo hộ', // Default: Loại kho đồ bảo hộ
      });
    }

    // Reset table data
    this.dataTableBillImportDetail = [];
    this.deletedDetailIds = [];

    // Refresh table nếu đã được khởi tạo
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData([]);
    }
  }

  private patchNewBillImportFromHistory() {
    if (!this.dataHistory || this.dataHistory.length === 0) return;

    const firstHistory = this.dataHistory[0];

    // Cập nhật thông tin phiếu mới dựa trên phiếu cũ
    this.newBillImport.BillCode = ''; // sẽ tạo mã mới
    this.newBillImport.Deliver = firstHistory.FullName;
    this.newBillImport.DeliverID = firstHistory.UserID;
    // this.newBillImport.KhoTypeID = firstHistory.ProductGroupID;
    // this.newBillImport.KhoType = firstHistory.ProductGroupName;

    this.validateForm.patchValue(
      {
        // BillImportCode: this.newBillImport.BillImportCode,
        // DeliverID: this.newBillImport.DeliverID,
        // KhoTypeID: this.newBillImport.KhoTypeID,
        // BillTypeNew: GIỮ NGUYÊN giá trị đã set = 1, không patch lại
      },
      { emitEvent: false },
    );
    this.isInitialLoad = false;
    // if (this.newBillImport.KhoTypeID) {
    //   this.changeProductGroup(this.newBillImport.KhoTypeID);
    // }
  }

  changeStatus() {
    this.getNewCode();
  }

  changeSuplierSale() {
    const supplierId = this.validateForm.get('SupplierID')?.value;
    const specialSuppliers = [1175, 16677];
    this.validateForm.patchValue({
      RulePayID: specialSuppliers.includes(supplierId) ? 34 : 0,
    });
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

  getBillImportByID() {
    if (this.id <= 0) return;

    this.isLoading = true;
    this.ProductProtectiveGearService.getBillImportByID(this.id).subscribe({
      next: (res) => {
        if (res?.status === 1 && res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillImport = data;

          // Patch data vào form
          this.validateForm.patchValue(
            {
              ID: data.ID || 0,
              BillCode: data.BillCode || '',
              CreatDate: data.CreatDate ? new Date(data.CreatDate) : null,
              Deliver: data.Deliver || '',
              Receiver: data.Receiver || '',
              Status: data.Status || false,
              Suplier: data.Suplier || '',
              BillType: data.BillType || false,
              WarehouseType: data.WarehouseType || '',
              DeliverID: data.DeliverID || null,
              ReceiverID: data.ReceiverID || null,
              SuplierID: data.SuplierID || null,
              GroupTypeID: data.GroupTypeID || null,
              CreatedBy: data.CreatedBy || null,
              CreatedDate: data.CreatedDate ? new Date(data.CreatedDate) : null,
              UpdatedBy: data.UpdatedBy || null,
              UpdatedDate: data.UpdatedDate ? new Date(data.UpdatedDate) : null,
              Image: data.Image || '',
              WarehouseID: data.WarehouseID || null,
              SupplierSaleID: data.SupplierSaleID || null,
              BillTypeNew: data.BillTypeNew || null,
              IsBorrowSupplier: data.IsBorrowSupplier || null,
              CustomerID: data.CustomerID || null,
              BillDocumentImportType: data.BillDocumentImportType || null,
              DateRequestImport: data.DateRequestImport
                ? new Date(data.DateRequestImport)
                : null,
              RulePayID: data.RulePayID || null,
              IsNormalize: data.IsNormalize || false,
              ApproverID: data.ApproverID || null,
              IsDeleted: data.IsDeleted || false,
            },
            { emitEvent: false },
          );

          console.log('Loaded bill import:', data);

          // Load chi tiết sản phẩm
          this.getBillImportDetailByID(this.id);

          this.isInitialLoad = false;
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể lấy thông tin phiếu nhập!',
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin!',
        );
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  // Load chi tiết sản phẩm của phiếu nhập
  private getBillImportDetailByID(id: number) {
    if (id <= 0) return;

    this.ProductProtectiveGearService.getBillImportDetail(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.dataTableBillImportDetail = res.data;
          console.log(
            'Loaded bill import details:',
            this.dataTableBillImportDetail,
          );

          // Refresh table với data mới
          if (this.table_billImportDetail) {
            this.table_billImportDetail.replaceData(
              this.dataTableBillImportDetail,
            );
            setTimeout(() => {
              this.table_billImportDetail.redraw(true);
            }, 100);
          }
        }
      },
      error: (err) => {
        console.error('Error loading bill import details:', err);
      },
    });
  }

  getNewCode() {
    const billType = this.validateForm.get('BillTypeNew')?.value;

    // Kiểm tra billType có giá trị hợp lệ
    if (billType === null || billType === undefined) {
      return;
    }

    // Nếu đang ở chế độ sửa và đang load lần đầu, không generate code mới
    if (this.isCheckmode && this.isInitialLoad) {
      return;
    }

    this.ProductProtectiveGearService.getBillCode(billType).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.newBillImport.BillCode = res.data;
          this.validateForm.patchValue({ BillCode: res.data });
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy mã phiếu');
      },
    });
  }

  async closeModal() {
    // const isValid = await this.checkSerial();
    // if (!isValid) {
    //   this.notification.warning(
    //     NOTIFICATION_TITLE.warning,
    //     'Số lượng serial không đủ, vui lòng kiểm tra lại'
    //   );
    //   return;
    // }

    this.activeModal.close();
  }

  mapTableDataToBillImportDetails(tableData: any[]) {
    return tableData.map((row, index) => ({
      ID: row.ID || 0,
      STT: row.STT || index + 1, // Tính STT từ index nếu không có
      BillImportTechID: this.newBillImport.ID || 0,
      ProductID: row.ProductID ?? 0,

      Quantity: row.Quantity ?? row.Qty ?? 0,
      TotalQuantity: row.TotalQuantity ?? 0,
      Price: row.Price ?? 0,
      TotalPrice: row.TotalPrice ?? 0,

      UnitID: row.UnitID ?? 0,
      UnitName: row.UnitName ?? '',

      ProjectID: row.ProjectID ?? 0,
      ProjectCode: row.ProjectCode ?? '',
      ProjectName: row.ProjectName ?? '',

      SomeBill: row.SomeBill ?? '',

      CreatedBy: row.CreatedBy ?? '',
      CreatedDate: row.CreatedDate ?? null,
      UpdatedBy: row.UpdatedBy ?? '',
      UpdatedDate: row.UpdatedDate ?? null,

      Note: row.Note ?? '',
      InternalCode: row.InternalCode ?? '',

      HistoryProductRTCID: row.HistoryProductRTCID ?? 0,
      ProductRTCQRCodeID: row.ProductRTCQRCodeID ?? 0,
      WarehouseID: row.WarehouseID ?? 5,

      IsBorrowSupplier: row.IsBorrowSupplier ?? 0,
      QtyRequest: row.QtyRequest ?? 0,

      PONCCDetailID: row.PONCCDetailID ?? 0,
      BillCodePO: row.BillCodePO ?? '',

      EmployeeIDBorrow: row.EmployeeIDBorrow ?? 0,
      DeadlineReturnNCC: row.DeadlineReturnNCC ?? null,
      DateSomeBill: row.DateSomeBill ?? null,

      COFormE: row.COFormE ?? 0,
      TaxReduction: row.TaxReduction ?? 0,
      DueDate: row.DueDate ?? null,
      DPO: row.DPO ?? 0,

      IsDeleted: row.IsDeleted ?? null,

      ProductName: row.ProductName ?? '',
      ProductCode: row.ProductCode ?? '',
      UnitCountName: row.UnitCountName ?? null,
      WarehouseType: row.WarehouseType ?? '',
      ProductCodeRTC: row.ProductCodeRTC ?? '',
      Maker: row.Maker ?? '',
      ProductQRCode: row.ProductQRCode ?? null,
      EmployeeBorrowName: row.EmployeeBorrowName ?? '',
    }));
  }
  checkBillCode(billCode: string, id: number) {
    this.ProductProtectiveGearService.validateBillCode(billCode, id).subscribe({
      next: (res: any) => {
        if (res.status == 1) {
          if (res.data == 1) {
            // thông báo số phiếu được thay đổi
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Số phiếu đã được thay đổi',
            );
            this.getNewCode();
          }
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy mã phiếu');
      },
    });
  }

  async saveDataBillImport() {
    // const isValid = await this.checkSerial();
    // if (!isValid) {
    //   this.notification.warning(
    //     NOTIFICATION_TITLE.warning,
    //     'Số lượng serial lớn hơn số lượng yêu cầu, vui lòng kiểm tra lại'
    //   );
    //   return;
    // }

    if (!this.validateForm.valid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!',
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
    if (!formValues.BillCode || formValues.BillCode.trim() === '') {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền số phiếu.',
      );
      return;
    }

    if (!formValues.BillTypeNew || formValues.BillTypeNew <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn loại phiếu.',
      );
      return;
    }
    this.checkBillCode(formValues.BillCode, this.newBillImport.ID);

    if (!formValues.ReceiverID || formValues.ReceiverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn người nhận.',
      );
      return;
    }

    if (!formValues.DeliverID || formValues.DeliverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn người giao.',
      );
      return;
    }

    if (!formValues.RulePayID || formValues.RulePayID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn điều khoản thanh toán.',
      );
      return;
    }

    const billImportDetailsFromTable = this.table_billImportDetail?.getData();
    console.log('billImportdetailfromtable:', billImportDetailsFromTable);

    if (
      !billImportDetailsFromTable ||
      billImportDetailsFromTable.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất một sản phẩm vào bảng!',
      );
      return;
    }

    // Validate số lượng trong từng row
    for (let i = 0; i < billImportDetailsFromTable.length; i++) {
      const row = billImportDetailsFromTable[i];
      const quantity = row.Quantity || row.Qty || 0;

      // Kiểm tra số lượng không được trống hoặc = 0
      if (!quantity || quantity <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Dòng ${i + 1}: Số lượng phải lớn hơn 0!`,
        );
        return;
      }

      // Kiểm tra số lượng không được âm
      if (quantity < 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Dòng ${i + 1}: Số lượng không được âm!`,
        );
        return;
      }

      // Kiểm tra phải chọn sản phẩm
      if (!row.ProductID || row.ProductID <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Dòng ${i + 1}: Vui lòng chọn sản phẩm!`,
        );
        return;
      }
    }
    const documentsFromTable = this.table_DocumnetImport?.getData();

    // Backend expect: List<BillImportTechnicalProtectiveGearDTO> (array trực tiếp)
    const payload = [
      {
        BillImportTechnical: {
          ID: this.newBillImport.ID || 0,
          BillCode: formValues.BillCode,
          CreatDate: formValues.CreatDate,
          Deliver:
            formValues.Deliver ||
            this.receiverAndDeliverList.find(
              (item) => item.ID === formValues.DeliverID,
            )?.FullName ||
            '',
          Receiver:
            formValues.Receiver ||
            this.receiverAndDeliverList.find(
              (item) => item.ID === formValues.ReceiverID,
            )?.FullName ||
            '',
          Status: formValues.Status || false,
          Suplier: formValues.Suplier || '',
          BillType: formValues.BillType || false,
          WarehouseType: formValues.WarehouseType || '',
          DeliverID: formValues.DeliverID || 0,
          ReceiverID: formValues.ReceiverID || 0,
          SuplierID: formValues.SuplierID || 0,
          GroupTypeID: formValues.GroupTypeID || 0,
          WarehouseID:
            formValues.WarehouseID || this.newBillImport.WarehouseID || 5,
          CreatedBy: formValues.CreatedBy || this.newBillImport.CreatedBy,
          CreatedDate: formValues.CreatedDate || formValues.CreatDate,
          UpdatedBy: this.newBillImport.UpdatedBy,
          UpdatedDate: new Date(),
          Image: formValues.Image || '',
          SupplierSaleID: formValues.SupplierSaleID || 0,
          BillTypeNew: formValues.BillTypeNew,
          IsBorrowSupplier: formValues.IsBorrowSupplier || 0,
          CustomerID: formValues.CustomerID || 0,
          BillDocumentImportType: formValues.BillDocumentImportType || 0,
          DateRequestImport: formValues.DateRequestImport,
          RulePayID: formValues.RulePayID,
          IsNormalize: formValues.IsNormalize || false,
          ApproverID: formValues.ApproverID || 0,
          IsDeleted: formValues.IsDeleted || false,
        },
        BillImportDetailTechnical: this.mapTableDataToBillImportDetails(
          billImportDetailsFromTable,
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
      },
    ];
    console.log('payload', payload);

    // Bật loading để tránh spam click
    this.isSaving = true;

    // Gọi API để lưu phiếu nhập
    this.ProductProtectiveGearService.saveBillImport(payload).subscribe({
      next: (res) => {
        this.isSaving = false; // Tắt loading
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!',
          );
          this.activeModal.close('saved');
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message ||
              (this.isCheckmode ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!'),
          );
        }
      },
      error: (err: any) => {
        this.isSaving = false; // Tắt loading
        console.error('Save error:', err);
        // Log chi tiết validation errors
        if (err.error && err.error.errors) {
          console.error('Validation errors:', err.error.errors);
        }
        let errorMessage =
          'Có lỗi xảy ra khi ' + (this.isCheckmode ? 'cập nhật!' : 'thêm mới!');
        if (err.error && err.error.message) {
          errorMessage += ' Chi tiết: ' + err.error.message;
        }
        if (err.error && err.error.errors) {
          const validationErrors = Object.entries(err.error.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
          errorMessage += ' Lỗi: ' + validationErrors;
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
        'Vui lòng chọn 1 phiếu xuất để sửa',
      );
      this.id = 0;
      return;
    }
    // const modalRef = this.modalService.open(BillImportDetailComponent, {
    //   centered: true,
    //   // windowClass: 'full-screen-modal',
    //   size: 'xl',
    //   backdrop: 'static',
    //   keyboard: false,
    // });

    // modalRef.componentInstance.newBillImport = this.newBillImport;
    // modalRef.componentInstance.isCheckmode = this.isCheckmode;
    // modalRef.componentInstance.id = this.id;

    // modalRef.result.catch((result) => {
    //   if (result == true) {
    //     this.id = 0;
    //     // this.loadDataBillExport();
    //   }
    // });
  }

  addRow() {
    if (this.table_billImportDetail) {
      this.table_billImportDetail.addRow({
        ID: 0,
        STT: 0,
        BillImportTechID: this.newBillImport.ID || 0,
        ProductID: 0,
        ProductCode: '',
        ProductName: '',
        ProductCodeRTC: '',
        Quantity: 0,
        TotalQuantity: 0,
        Price: 0,
        TotalPrice: 0,
        UnitID: 0,
        UnitName: '',
        ProjectID: 0,
        ProjectCode: '',
        ProjectName: '',
        SomeBill: '',
        CreatedBy: '',
        CreatedDate: null,
        UpdatedBy: '',
        UpdatedDate: null,
        Note: '',
        InternalCode: '',
        HistoryProductRTCID: 0,
        ProductRTCQRCodeID: 0,
        WarehouseID: 5,
        IsBorrowSupplier: 0,
        QtyRequest: 0,
        PONCCDetailID: 0,
        BillCodePO: '',
        EmployeeIDBorrow: 0,
        DeadlineReturnNCC: null,
        DateSomeBill: null,
        COFormE: 0,
        TaxReduction: 0,
        DueDate: null,
        DPO: 0,
        IsDeleted: false,
        UnitCountName: null,
        WarehouseType: '',
        Maker: '',
        ProductQRCode: null,
        EmployeeBorrowName: '',
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
    },
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      let data = getData();
      data = data.map((p: any) => ({
        ...p,
        productLabel: `${p.ProductNewCode || ''} | ${p.ProductCode || ''} | ${
          p.ProductName || ''
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
      onRendered(() => {});

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
        left: `${rect.left + window.scrollX}px`,
      };
    } else {
      this.popupPosition = {
        top: `${rect.top + window.scrollY - popupHeight}px`,
        left: `${rect.left + window.scrollX}px`,
      };
    }

    // Populate productOptions từ productList (dùng đúng field names từ API)
    this.productOptions = this.productList.map((p: any) => ({
      ID: p.ID,
      ProductCode: p.ProductCode,
      ProductCodeRTC: p.ProductCodeRTC,
      ProductName: p.ProductName,
      UnitCountName: p.UnitCountName,
      UnitCountID: p.UnitCountID,
      Maker: p.Maker,
    }));

    console.log('Product popup opened, options:', this.productOptions.length);
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
    // this.billImportService.getProductOption(1, ID).subscribe({
    //   next: (res: any) => {
    //     const productData = res.data;
    //     if (Array.isArray(productData)) {
    //       this.productOptions = productData
    //         .filter((product) => product.ID > 0)
    //         .map((product) => ({
    //           label: product.ProductName,
    //           value: product.ID,
    //           ProductCode: product.ProductCode,
    //           TotalInventory: product.TotalQuantityLast,
    //           ProductName: product.ProductName,
    //           Unit: product.Unit,
    //           Note: product.Note,
    //           ProductNewCode: product.ProductNewCode,
    //         }));

    //       if (this.table_billImportDetail) {
    //         this.table_billImportDetail.redraw(true);
    //       }
    //     } else {
    //       this.productOptions = [];
    //       this.notification.warning(
    //         NOTIFICATION_TITLE.warning,
    //         'Dữ liệu sản phẩm không hợp lệ!'
    //       );
    //     }
    //     // Gọi hàm map data SAU KHI productOptions đã load xong
    //     // LUỒNG PONCC - Ưu tiên cao nhất
    //     if (
    //       this.poNCCId > 0 &&
    //       this.selectedList &&
    //       this.selectedList.length > 0
    //     ) {
    //       console.log('🔵 changeProductGroup: Xử lý luồng PONCC');
    //       this.isEditPM = false; // Không cho phép chỉnh sửa PM

    //       // Patch master data từ PONCC (đã có sẵn trong newBillImport)
    //       this.patchDataFromPONCC();

    //       // Map detail data từ PONCC vào table
    //       this.mapDataFromPONCCToTable();
    //     }
    //     // LUỒNG PHIẾU TRẢ - Từ lịch sử mượn
    //     else if (
    //       this.createImport == true &&
    //       this.dataHistory &&
    //       this.dataHistory.length > 0
    //     ) {
    //       this.isEditPM = false;
    //       this.mapDataHistoryToTable();
    //     }
    //     // LUỒNG CHỈNH SỬA - Load dữ liệu từ ID
    //     else if (this.isCheckmode) {
    //       this.getBillImportDetailID();
    //     }
    //   },
    //   error: (err) => {
    //     console.error(err);
    //     this.notification.error(
    //       NOTIFICATION_TITLE.error,
    //       'Có lỗi khi tải danh sách sản phẩm!'
    //     );
    //     this.productOptions = [];
    //   },
    // });
  }

  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[],
  ) {
    // const modalRef = this.modalService.open(BillImportChoseSerialComponent, {
    //   size: 'md',
    //   centered: true,
    //   backdrop: 'static',
    //   keyboard: false,
    // });
    // modalRef.componentInstance.quantity = quantity;
    // modalRef.componentInstance.productCode = productCode;
    // modalRef.componentInstance.existingSerials = existingSerials;
    // modalRef.componentInstance.type = 1;
    // modalRef.componentInstance.dataBillDetail = rowData;
    // console.log('3', rowData);
    // modalRef.result.then(
    //   (serials: { ID: number; Serial: string }[]) => {
    //     if (Array.isArray(serials) && serials.length > 0) {
    //       const serialsID = serials.map((s) => s.ID).join(',');
    //       row.update({ SerialNumber: serialsID });
    //       this.notification.success(
    //         NOTIFICATION_TITLE.success,
    //         'Cập nhật serial thành công!'
    //       );
    //     } else {
    //       this.notification.error(
    //         NOTIFICATION_TITLE.error,
    //         'Dữ liệu serial không hợp lệ!'
    //       );
    //     }
    //   },
    //   (reason) => {
    //     console.log('Modal dismissed:', reason);
    //   }
    // );
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
          selectableRows: true,
          columns: [
            {
              title: '',
              formatter: 'rowSelection',
              titleFormatter: 'rowSelection',
              hozAlign: 'center',
              headerHozAlign: 'center',
              headerSort: false,
              width: 40,
              frozen: true,
              cellClick: (e, cell) => {
                cell.getRow().toggleSelect();
              },
            },
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
              title: 'STT',
              field: 'STT',
              formatter: 'rownum',
              hozAlign: 'center',
              width: 60,
              headerSort: false,
              frozen: true,
            },

            {
              title: 'Mã sản phẩm',
              field: 'ProductID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }

                const rowData = cell.getRow().getData();
                let productcode = rowData['ProductCode'] || '';

                if (!productcode) {
                  const product = this.productList.find(
                    (p: any) => p.value === val,
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
              width: 150,
            },

            {
              title: 'ĐVT',
              field: 'UnitName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },

            {
              title: 'Số lượng',
              field: 'Quantity',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'number',
            },

            {
              title: 'Mã nội bộ',
              field: 'ProductCodeRTC',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
            },
            {
              title: 'Hãng',
              field: 'Maker',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
            },
            {
              title: 'Số đơn mua hàng',
              field: 'BillCodePO',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },

            {
              title: 'Ghi chú',
              field: 'Note',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
            },
          ],
        },
      );
      this.isLoading = false; // Kết thúc loading
    }
  }

  // async checkSerial(): Promise<boolean> {
  //   const tableData = this.table_billImportDetail?.getData();

  //   for (const detail of tableData) {
  //     const qty = detail.Quantity || detail.Qty || 0;
  //     const detailId = detail.ID;

  //     if (!detailId || detailId <= 0) {
  //       continue;
  //     }

  //     try {
  //       // const result = await this.billImportChoseSerialService
  //       //   .countSerialBillImport(detailId)
  //       //   .toPromise();

  //       // if (qty < (result?.data || 0)) {
  //       //   return false;
  //       // }
  //     } catch (error) {
  //       console.error('Lỗi check serial', detailId, error);
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  // Khi chọn sản phẩm từ popup
  onProductSelected(selectedProduct: any): void {
    if (!this.currentEditingCell) return;

    const row = this.currentEditingCell.getRow();

    // Update row data với thông tin sản phẩm đã chọn
    row.update({
      ProductID: selectedProduct.ID || selectedProduct.value,
      ProductCode: selectedProduct.ProductCode,
      ProductCodeRTC: selectedProduct.ProductCodeRTC,
      ProductName: selectedProduct.ProductName,
      UnitName: selectedProduct.UnitCountName || '', // Sửa từ 'Unit' thành 'UnitName'
      UnitCountName: selectedProduct.UnitCountName || '',
      UnitCountID: selectedProduct.UnitCountID || 0,
      UnitID: selectedProduct.UnitCountID || 0,
      Maker: selectedProduct.Maker || '',
    });

    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  // Đóng popup
  onPopupClosed(): void {
    this.showProductPopup = false;
    this.currentEditingCell = null;
  }
  // Handle Product Selection
}
