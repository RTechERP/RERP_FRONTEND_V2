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
import {
  BillExportTechnicalProtectiveGear,
  BillExportTechnicalProtectiveGearField,
} from '../model/bill-export-technical-protective-gear';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';

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
  selector: 'app-bill-export-technical-protective-gear-detail',
  templateUrl: './bill-export-technical-protective-gear-detail.component.html',
  styleUrls: ['./bill-export-technical-protective-gear-detail.component.css'],
})
export class BillExportTechnicalProtectiveGearDetailComponent implements OnInit {
  billExportTechnicalProtectiveGearField =
    BillExportTechnicalProtectiveGearField;
  supplierList: any[] = [];
  customerList: any[] = [];
  receiverAndDeliverList: any[] = [];
  warehouseList: any[] = [];
  rulePayList: any[] = [];
  productList: any[] = [];

  isVisible: boolean = true;
  private warehouseIdHN: number = 0;
  table_billExportDetail: any;
  dataTableBillExportDetail: any[] = [];
  table_DocumnetExport: any;
  dataTableDocumnetExport: any[] = [];
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

  @Input() newBillExport: BillExportTechnicalProtectiveGear = {
    ID: 0,
    Code: null,

    BillType: null,
    CustomerID: null,

    Receiver: null,
    Deliver: null,
    Addres: null,

    Status: null,
    WarehouseType: null,
    Note: null,
    Image: null,

    ReceiverID: null,
    DeliverID: null,
    SupplierID: null,

    CustomerName: null,
    SupplierName: null,

    CheckAddHistoryProductRTC: null,
    ExpectedDate: null,
    ProjectName: null,

    WarehouseID: 5,

    CreatedBy: null,
    CreatedDate: null,
    UpdatedBy: null,
    UpdatedDate: null,

    SupplierSaleID: null,
    BillDocumentExportType: null,
    ApproverID: null,
  };
  isEditPM: boolean = true;
  cbbStatus: any[] = [
    { ID: 0, Name: 'Trả' },
    { ID: 1, Name: 'Cho mượn' },
    { ID: 2, Name: 'Tặng / Bán' },
    { ID: 3, Name: 'Mất' },
    { ID: 4, Name: 'Bảo hành' },
    { ID: 5, Name: 'Xuất dự án' },
    { ID: 6, Name: 'Hỏng' },
    { ID: 7, Name: 'Xuất kho' },
  ];

  @ViewChild('table_BillExportDetails') tableBillExportDetails!: ElementRef;

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
      .get('BillType')
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
      this.getBillExportByID();
    } else {
      // Chế độ thêm mới - reset form và data
      this.resetFormForNewRecord();
    }

    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.newBillExport = { ...this.newBillExport, ...values };
      });
  }
  initFormGroup() {
    this.validateForm = this.fb.group({
      ID: this.fb.control(this.newBillExport.ID),
      Code: this.fb.control(this.newBillExport.Code, [Validators.required]),
      BillType: this.fb.control(this.newBillExport.BillType, [
        Validators.required,
      ]),
      CustomerID: this.fb.control(this.newBillExport.CustomerID),
      Receiver: this.fb.control(this.newBillExport.Receiver),
      Deliver: this.fb.control(this.newBillExport.Deliver),
      Addres: this.fb.control(this.newBillExport.Addres),
      Status: this.fb.control(this.newBillExport.Status),
      WarehouseType: this.fb.control(this.newBillExport.WarehouseType),
      Note: this.fb.control(this.newBillExport.Note),
      Image: this.fb.control(this.newBillExport.Image),
      ReceiverID: this.fb.control(this.newBillExport.ReceiverID),
      DeliverID: this.fb.control(this.newBillExport.DeliverID),
      SupplierID: this.fb.control(this.newBillExport.SupplierID),
      CustomerName: this.fb.control(this.newBillExport.CustomerName),
      SupplierName: this.fb.control(this.newBillExport.SupplierName),
      CheckAddHistoryProductRTC: this.fb.control(
        this.newBillExport.CheckAddHistoryProductRTC,
      ),
      ExpectedDate: this.fb.control(this.newBillExport.ExpectedDate),
      ProjectName: this.fb.control(this.newBillExport.ProjectName),
      WarehouseID: this.fb.control(this.newBillExport.WarehouseID),
      CreatedBy: this.fb.control(this.newBillExport.CreatedBy),
      CreatedDate: this.fb.control(this.newBillExport.CreatedDate),
      UpdatedBy: this.fb.control(this.newBillExport.UpdatedBy),
      UpdatedDate: this.fb.control(this.newBillExport.UpdatedDate),
      SupplierSaleID: this.fb.control(this.newBillExport.SupplierSaleID),
      BillDocumentExportType: this.fb.control(
        this.newBillExport.BillDocumentExportType,
      ),
      ApproverID: this.fb.control(this.newBillExport.ApproverID),
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
    this.newBillExport = {
      ID: 0,
      Code: null,
      BillType: null,
      CustomerID: null,
      Receiver: null,
      Deliver: null,
      Addres: null,
      Status: null,
      WarehouseType: null,
      Note: null,
      Image: null,
      ReceiverID: null,
      DeliverID: null,
      SupplierID: null,
      CustomerName: null,
      SupplierName: null,
      CheckAddHistoryProductRTC: null,
      ExpectedDate: null,
      ProjectName: null,
      WarehouseID: null,
      CreatedBy: null,
      CreatedDate: null,
      UpdatedBy: null,
      UpdatedDate: null,
      SupplierSaleID: null,
      BillDocumentExportType: null,
      ApproverID: null,
    };

    // Reset form
    if (this.validateForm) {
      this.validateForm.reset();
      this.validateForm.patchValue({
        ID: 0,
        CreatedDate: new Date(), // Ngày xuất mặc định là ngày hiện tại
        WarehouseType: 'Đồ phòng sạch',
        BillType: 0,
        Deliver: this.appUserService.fullName || '', // Tên đầy đủ của người đăng nhập
        DeliverID: this.appUserService.id || null, // ID của người đăng nhập
      });
    }

    // Reset table data
    this.dataTableBillExportDetail = [];
    this.deletedDetailIds = [];

    // Refresh table nếu đã được khởi tạo
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData([]);
    }
  }

  private patchNewBillImportFromHistory() {
    if (!this.dataHistory || this.dataHistory.length === 0) return;

    const firstHistory = this.dataHistory[0];

    // Cập nhật thông tin phiếu mới dựa trên phiếu cũ
    this.newBillExport.Code = ''; // sẽ tạo mã mới
    this.newBillExport.Deliver = firstHistory.FullName;
    this.newBillExport.DeliverID = firstHistory.UserID;
    // this.newBillExport.KhoTypeID = firstHistory.ProductGroupID;
    // this.newBillExport.KhoType = firstHistory.ProductGroupName;

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
    if (!canEdit && this.table_billExportDetail) {
      const allRows = this.table_billExportDetail.getRows();
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

  getBillExportByID() {
    if (this.id <= 0) return;

    this.isLoading = true;
    this.ProductProtectiveGearService.getBillExportByID(this.id).subscribe({
      next: (res) => {
        if (res?.status === 1 && res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillExport = data;

          // Patch data vào form
          this.validateForm.patchValue(
            {
              ID: data.ID || 0,
              Code: data.Code || null,
              BillType: data.BillType || null,
              CustomerID: data.CustomerID || null,
              Receiver: data.Receiver || null,
              Deliver: data.Deliver || null,
              Addres: data.Addres || null,
              Status: data.Status || null,
              WarehouseType: data.WarehouseType || null,
              Note: data.Note || null,
              Image: data.Image || null,
              ReceiverID: data.ReceiverID || null,
              DeliverID: data.DeliverID || null,
              SupplierID: data.SupplierID || null,
              CustomerName: data.CustomerName || null,
              SupplierName: data.SupplierName || null,
              CheckAddHistoryProductRTC: data.CheckAddHistoryProductRTC || null,
              ExpectedDate: data.ExpectedDate
                ? new Date(data.ExpectedDate)
                : null,
              ProjectName: data.ProjectName || null,
              WarehouseID: data.WarehouseID || null,
              CreatedBy: data.CreatedBy || null,
              CreatedDate: data.CreatedDate ? new Date(data.CreatedDate) : null,
              UpdatedBy: data.UpdatedBy || null,
              UpdatedDate: data.UpdatedDate ? new Date(data.UpdatedDate) : null,
              SupplierSaleID: data.SupplierSaleID || null,
              BillDocumentExportType: data.BillDocumentExportType || null,
              ApproverID: data.ApproverID || null,
            },
            { emitEvent: false },
          );

          console.log('Loaded bill export:', data);

          // Load chi tiết sản phẩm
          this.getBillExportDetailByID(this.id);

          this.isInitialLoad = false;
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể lấy thông tin phiếu xuất!',
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

  // Load chi tiết sản phẩm của phiếu xuất
  private getBillExportDetailByID(id: number) {
    if (id <= 0) return;

    this.ProductProtectiveGearService.getBillExportDetail(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.dataTableBillExportDetail = res.data;
          console.log(
            'Loaded bill export details:',
            this.dataTableBillExportDetail,
          );

          // Refresh table với data mới
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData(
              this.dataTableBillExportDetail,
            );
            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
        }
      },
      error: (err) => {
        console.error('Error loading bill export details:', err);
      },
    });
  }

  getNewCode() {
    const billType = this.validateForm.get('BillType')?.value;

    // Kiểm tra billType có giá trị hợp lệ
    if (billType === null || billType === undefined) {
      return;
    }

    // Nếu đang ở chế độ sửa và đang load lần đầu, không generate code mới
    if (this.isCheckmode && this.isInitialLoad) {
      return;
    }

    this.ProductProtectiveGearService.getBillCodeExport(billType).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.newBillExport.Code = res.data;
          this.validateForm.patchValue({ Code: res.data });
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

  mapTableDataToBillExportDetails(tableData: any[]) {
    return tableData.map((row, index) => ({
      ID: row.ID || 0,
      STT: row.STT || index + 1,
      BillExportTechID: this.newBillExport.ID || 0,
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

      ProductName: row.ProductName ?? '',
      ProductCode: row.ProductCode ?? '',
      UnitCountName: row.UnitCountName ?? null,
      WarehouseType: row.WarehouseType ?? '',
      ProductCodeRTC: row.ProductCodeRTC ?? '',
      Maker: row.Maker ?? '',
      ProductQRCode: row.ProductQRCode ?? null,

      IsDeleted: row.IsDeleted ?? null,
    }));
  }

  async saveDataBillExport() {
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
    if (!formValues.Code || formValues.Code.trim() === '') {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền số phiếu.',
      );
      return;
    }

    if (formValues.BillType === null || formValues.BillType === undefined) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn loại phiếu.',
      );
      return;
    }

    const billExportDetailsFromTable = this.table_billExportDetail?.getData();
    console.log('billExportDetailFromTable:', billExportDetailsFromTable);

    if (
      !billExportDetailsFromTable ||
      billExportDetailsFromTable.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất một sản phẩm vào bảng!',
      );
      return;
    }

    // Validate số lượng trong từng row
    for (let i = 0; i < billExportDetailsFromTable.length; i++) {
      const row = billExportDetailsFromTable[i];
      const quantity = row.Quantity || row.Qty || 0;

      if (!quantity || quantity <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Dòng ${i + 1}: Số lượng phải lớn hơn 0!`,
        );
        return;
      }

      if (!row.ProductID || row.ProductID <= 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Dòng ${i + 1}: Vui lòng chọn sản phẩm!`,
        );
        return;
      }
    }

    // Backend expect: List<BillExportTechnicalProtectiveGearDTO>
    const payload = [
      {
        BillExportTechnical: {
          ID: this.newBillExport.ID || 0,
          Code: formValues.Code,
          BillType: formValues.BillType,
          CustomerID: formValues.CustomerID || null,
          Receiver:
            formValues.Receiver ||
            this.receiverAndDeliverList.find(
              (item) => item.ID === formValues.ReceiverID,
            )?.FullName ||
            null,
          Deliver:
            formValues.Deliver ||
            this.receiverAndDeliverList.find(
              (item) => item.ID === formValues.DeliverID,
            )?.FullName ||
            null,
          Addres: formValues.Addres || null,
          Status: formValues.Status || null,
          WarehouseType: formValues.WarehouseType || null,
          Note: formValues.Note || null,
          Image: formValues.Image || null,
          ReceiverID: formValues.ReceiverID || null,
          DeliverID: formValues.DeliverID || null,
          SupplierID: formValues.SupplierID || null,
          CustomerName: formValues.CustomerName || null,
          SupplierName: formValues.SupplierName || null,
          CheckAddHistoryProductRTC:
            formValues.CheckAddHistoryProductRTC || null,
          ExpectedDate: formValues.ExpectedDate || null,
          ProjectName: formValues.ProjectName || null,
          WarehouseID:
            formValues.WarehouseID || this.newBillExport.WarehouseID || 5,
          CreatedBy: formValues.CreatedBy || this.newBillExport.CreatedBy,
          CreatedDate: formValues.CreatedDate || new Date(),
          UpdatedBy: this.newBillExport.UpdatedBy,
          UpdatedDate: new Date(),
          SupplierSaleID: formValues.SupplierSaleID || null,
          BillDocumentExportType: formValues.BillDocumentExportType || null,
          ApproverID: formValues.ApproverID || null,
        },
        BillExportDetailTechnical: this.mapTableDataToBillExportDetails(
          billExportDetailsFromTable,
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
      },
    ];
    console.log('payload', payload);

    this.isSaving = true;

    // Gọi API để lưu phiếu xuất
    this.ProductProtectiveGearService.saveBillExport(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
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
        this.isSaving = false;
        console.error('Save error:', err);
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
    if (this.table_billExportDetail) {
      this.table_billExportDetail.addRow({
        ID: 0,
        STT: 0,
        BillExportTechID: this.newBillExport.ID || 0,
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
        UnitCountName: null,
        WarehouseType: '',
        Maker: '',
        ProductQRCode: null,
        IsDeleted: false,
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
        if (!this.table_billExportDetail) {
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
      if (this.table_billExportDetail) {
        this.table_billExportDetail.replaceData([]);
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

  //vẽ bảng
  drawTable() {
    this.isLoading = true; // Bắt đầu loading
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
      this.table_billExportDetail = new Tabulator(
        this.tableBillExportDetails.nativeElement,
        {
          data: this.dataTableBillExportDetail,
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
              title: 'Mã nội bộ',
              field: 'ProductCodeRTC',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
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
              title: 'Số lượng xuất',
              field: 'Quantity',
              hozAlign: 'right',
              headerHozAlign: 'center',
              editor: 'number',
            },
            {
              title: 'Hãng',
              field: 'Maker',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 150,
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              hozAlign: 'left',
              headerHozAlign: 'center',
              editor: 'input',
              width: 200,
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
      UnitName: selectedProduct.UnitCountName || '',
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
