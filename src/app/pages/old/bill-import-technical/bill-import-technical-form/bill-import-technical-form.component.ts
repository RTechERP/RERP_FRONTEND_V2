import { log } from 'ng-zorro-antd/core/logger';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
  // REFACTOR: Không cần nữa vì đã dùng TabulatorPopupService
  // TemplateRef,
  // ViewContainerRef,
} from '@angular/core';
import { BillImportChoseProductFormComponent } from '../bill-import-chose-product-form/bill-import-chose-product-form.component';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Editor } from 'tabulator-tables';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { BillImportChoseSerialComponent } from '../bill-import-chose-serial/bill-import-chose-serial.component';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { firstValueFrom } from 'rxjs';
import { TbProductRtcService } from '../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
// REFACTOR: Import TabulatorPopupService để sử dụng reusable popup component
import { TabulatorPopupService } from '../../../../shared/components/tabulator-popup';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { BillExportService } from '../../Sale/BillExport/bill-export-service/bill-export.service';
import { BillImportChoseSerialService } from '../bill-import-chose-serial/bill-import-chose-serial.service';
import { HistoryProductRtcComponent } from '../../inventory-demo/borrow/borrow-product-history/history-product-rtc/history-product-rtc.component';

@Component({
  standalone: true,
  imports: [
    NzCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzSpinModule,
    HasPermissionDirective,
  ],
  selector: 'app-bill-import-technical-form',
  templateUrl: './bill-import-technical-form.component.html',
  styleUrls: ['./bill-import-technical-form.component.css'],
})
export class BillImportTechnicalFormComponent implements OnInit, AfterViewInit {
  title: string = 'Phiếu nhập kho';
  // danh sách loại phiếu nhập kĩ thuật
  billType: any = [
    { ID: 0, Name: '--Chọn loại--' },
    { ID: 1, Name: 'Mượn NCC' },
    { ID: 2, Name: 'Mua NCC' },
    { ID: 3, Name: 'Trả' },
    { ID: 4, Name: 'Nhập nội bộ' },
    { ID: 5, Name: 'Y/c nhập kho' },
    { ID: 6, Name: 'Nhập hàng bảo hành' },
    { ID: 7, Name: 'NCC tặng/cho' },
  ];
  cbbStatusPur: any = [
    { ID: 1, Name: 'Đã bàn giao' },
    { ID: 2, Name: 'Hủy bàn giao' },
    { ID: 3, Name: 'Không cần' },
  ];
  activePur: boolean = false;
  @ViewChild('table_DocumnetImport') tableDocumnetImport!: ElementRef;
  table_DocumnetImport!: Tabulator;
  dataTableDocumnetImport: any[] = [];
  @ViewChild('tableDeviceTemp') tableDeviceTemp!: ElementRef;
  // REFACTOR: Không cần nữa vì đã dùng TabulatorPopupService
  // @ViewChild('childTableTemplate', { static: true })
  // childTableTemplate!: TemplateRef<any>;
  // @ViewChild('vcHost', { read: ViewContainerRef, static: true })
  // vcr!: ViewContainerRef;

  isLoading: boolean = false;
  @Input() masterId!: number; //IDDetail
  @Input() dataEdit: any;
  @Input() dataInput: any;
  @Input() billImport: any;
  @Input() newBillImport: any; // Master data từ PONCC

  @Input() IsEdit: boolean = false;
  formDeviceInfo!: FormGroup;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() warehouseID: number = 1;
  @Input() warehouseType: number = 1;
  @Input() dtDetails: any[] = [];
  @Input() flag: number = 0;
  @Input() POCode: string = '';
  @Input() body: string = '';
  @Input() receiverMailID: number = 0;
  @Input() warehouseIDNew: number = 0;
  @Input() PonccID: number = 0;
  @Input() WarehouseCode: string = 'HN';

  employeeSelectOptions: { label: string; value: number }[] = [];
  documentBillImport: any[] = [];
  selectedDevices: any[] = [];
  deviceTempTable: Tabulator | null = null;
  customerList: any[] = [];
  nccList: any[] = [];
  rulePayList: any[] = [];
  emPloyeeLists: any[] = [];
  productOptions: any[] = [];
  warehouses: any[] = [];

  // REFACTOR: Định nghĩa columns cho product popup (tái sử dụng được)
  productPopupColumns: ColumnDefinition[] = [
    {
      title: 'Mã SP',
      field: 'ProductCode',
      width: 120,
      headerSort: false,
    },
    {
      title: 'Tên sản phẩm',
      field: 'ProductName',
      width: 200,
      headerSort: false,
    },
    {
      title: 'Mã nội bộ',
      field: 'ProductCodeRTC',
      width: 120,
      headerSort: false,
    },
    {
      title: 'ĐVT',
      field: 'UnitCountName',
      width: 80,
      headerSort: false,
    },
  ];

  isAdmin: boolean = false;
  currentUserID: number = 0;
  currentEmployeeID: number = 0;
  currentDepartmentID: number = 0;
  canEditRestrictedFields: boolean = false;
  isFormDisabled: boolean = false;
  approveEmployee: any[] = [];
  pendingPONCCMapping: boolean = false; // Flag để map data sau khi load xong lookups
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  constructor(
    private billImportTechnicalService: BillImportTechnicalService,
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService,
    private appUserService: AppUserService,
    private tabulatorPopupService: TabulatorPopupService,
    private billExportService: BillExportService,
    private billImportChoseSerialService: BillImportChoseSerialService
  ) { }

  supplierOrCustomerValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const parent = control.parent;
    if (!parent) return null;

    // Nếu là Mượn NCC (BillTypeNew === 1), không validate CustomerID
    const billTypeNew = parent.get('BillTypeNew')?.value;
    if (billTypeNew === 1) {
      // Chỉ validate SupplierSaleID, không cần CustomerID
      const supplierSaleID = parent.get('SupplierSaleID')?.value;
      if (!supplierSaleID) {
        return { supplierOrCustomerRequired: true };
      }
      return null;
    }

    const supplierSaleID = parent.get('SupplierSaleID')?.value;
    const customerID = parent.get('CustomerID')?.value;

    if (!supplierSaleID && !customerID) {
      return { supplierOrCustomerRequired: true };
    }

    return null;
  }
  // Khởi tạo form
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      BillCode: ['', Validators.required],
      CreatDate: [new Date(), Validators.required],
      Deliver: ['', Validators.required],
      BillType: this.warehouseType == 2,
      WarehouseType: [
        this.warehouseType == 1 ? 'demo' : 'agv',
        Validators.required,
      ],
      DeliverID: [null, Validators.required],
      ReceiverID: [this.warehouseID == 6 ? 586 : null, Validators.required],
      WarehouseID: [this.warehouseID, Validators.required],
      SupplierSaleID: [null, this.supplierOrCustomerValidator.bind(this)],
      RulePayID: [34, Validators.required],
      CustomerID: [null, this.supplierOrCustomerValidator.bind(this)],
      ApproverID: [this.warehouseID == 6 ? 558 : this.warehouseType === 2 ? 97 : 54, Validators.required], //54:Phạm Văn Quyền; 97:Bùi Mạnh Cần
      Receiver: [''],
      Status: [false],
      Suplier: [''],
      SuplierID: [null],
      GroupTypeID: [null],
      CreatedBy: [''],
      CreatedDate: [null],
      UpdatedBy: [''],
      UpdatedDate: [null],
      Image: [''],
      BillTypeNew: [0, Validators.required],
      IsBorrowSupplier: [false],
      BillDocumentImportType: [null],
      DateRequestImport: [null],
      IsNormalize: [false],
    });

    this.formDeviceInfo.get('SupplierSaleID')?.valueChanges.subscribe(() => {
      this.formDeviceInfo
        .get('CustomerID')
        ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
    this.formDeviceInfo.get('CustomerID')?.valueChanges.subscribe(() => {
      this.formDeviceInfo
        .get('SupplierSaleID')
        ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    // Subscribe to BillTypeNew changes to update column visibility and validation
    this.formDeviceInfo
      .get('BillTypeNew')
      ?.valueChanges.subscribe((billType: number) => {
        this.updateColumnVisibility(billType);
        // Update validation khi BillTypeNew thay đổi
        this.formDeviceInfo
          .get('CustomerID')
          ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.formDeviceInfo
          .get('SupplierSaleID')
          ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    // Subscribe to DeliverID changes to auto-fill Deliver (FullName) and update permissions
    this.formDeviceInfo
      .get('DeliverID')
      ?.valueChanges.subscribe((deliverID: number) => {
        console.log('📋 [DeliverID valueChanges] deliverID =', deliverID,
          '| emPloyeeLists.length =', this.emPloyeeLists?.length ?? 0);
        if (deliverID && this.emPloyeeLists && this.emPloyeeLists.length > 0) {
          const employee = this.emPloyeeLists.find(
            (e: any) => e.ID === deliverID
          );
          console.log('📋 [DeliverID valueChanges] employee found:', employee);
          if (employee && employee.FullName) {
            this.formDeviceInfo.patchValue(
              { Deliver: employee.FullName },
              { emitEvent: false }
            );
          }
          // Nếu currentUser thuộc phòng ban DepartmentID=4, set CustomerID mặc định = 10910
          if (this.currentDepartmentID === 4) {
            this.formDeviceInfo.patchValue(
              { CustomerID: 10910 },
              { emitEvent: false }
            );
          }
        } else if (deliverID) {
          console.warn('⚠️ [DeliverID valueChanges] emPloyeeLists chưa load xong khi DeliverID được set! Sẽ resolve sau khi employee list load.');
        }
        // Update canEditRestrictedFields khi DeliverID thay đổi
        this.applyFormPermissions();
      });

    // Disable WarehouseType field - không cho sửa
    this.formDeviceInfo.get('WarehouseType')?.disable();
  }

  // Method to update column visibility based on BillTypeNew
  updateColumnVisibility(billType: number) {
    if (!this.deviceTempTable) return;

    const isBorrowNCC = billType === 1; // ID: 1 = "Mượn NCC"

    // Update "Người mượn" column visibility
    const employeeBorrowColumn =
      this.deviceTempTable.getColumn('EmployeeIDBorrow');
    if (employeeBorrowColumn) {
      if (isBorrowNCC) {
        employeeBorrowColumn.show();
      } else {
        employeeBorrowColumn.hide();
      }
    }

    // Update "Hạn trả NCC" column visibility
    const deadlineReturnColumn =
      this.deviceTempTable.getColumn('DeadlineReturnNCC');
    if (deadlineReturnColumn) {
      if (isBorrowNCC) {
        deadlineReturnColumn.show();
      } else {
        deadlineReturnColumn.hide();
      }
    }
  }
  getCustomer() {
    this.billImportTechnicalService
      .getCustomer(1, 10000, '', 0, 0)
      .subscribe((res: any) => {
        // API returns { status, data: { data: [], data1: [], data2: [] } }
        this.customerList = res.data?.data || [];
        console.log('✅ [getCustomer] Customer List loaded, count =', this.customerList.length);

        // FIX TIMING: Re-apply CustomerID sau khi customerList load xong
        // vì patchDataFromPONCC() được gọi trước khi customerList có dữ liệu
        // nz-select cần list phải có data mới hiển thị được option đã chọn
        if (this.flag === 1 && this.PonccID > 0 && this.newBillImport) {
          const customerID = this.newBillImport.CustomerID || 0;
          console.log('🔵 [getCustomer] PONCC mode - re-applying CustomerID =', customerID);
          if (customerID) {
            this.formDeviceInfo.patchValue({ CustomerID: customerID }, { emitEvent: false });
            console.log('✅ [getCustomer] CustomerID re-patched:', customerID);
          }
        }
      });
  }
  getNCC() {
    // Sử dụng API endpoint mới từ BillExportService
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.nccList = res.data || [];
        console.log('NCC List:', this.nccList);
      },
      error: (err: any) => {
        console.error('Error loading NCC:', err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy dữ liệu nhà cung cấp'
        );
      },
    });
  }
  getRulepay() {
    this.billImportTechnicalService.getRulepay().subscribe((res: any) => {
      // API returns { status, data: [] } - using ApiResponseFactory
      this.rulePayList = res.data || [];
      console.log('RulePay List:', this.rulePayList);
    });
  }
  getWarehouse() {
    // Lưu warehouseID từ input trước khi gọi API (để không bị mất khi dataEdit được patch)
    const inputWarehouseID = this.warehouseID;

    this.billImportTechnicalService.getWarehouse().subscribe((res: any) => {
      const list = res.data || [];
      this.warehouses = list;
      console.log('Warehouse List:', list);

      // Ưu tiên dùng warehouseID từ input nếu đã được truyền vào
      let currentId =
        inputWarehouseID && inputWarehouseID > 0
          ? inputWarehouseID
          : this.warehouseID;

      // Nếu không có warehouseID hoặc = 0, tìm theo WarehouseCode
      if (!currentId || currentId === 0) {
        const currentWarehouse = list.find(
          (item: any) =>
            String(item.WarehouseCode).toUpperCase() ===
            String(this.WarehouseCode).toUpperCase()
        );
        currentId = currentWarehouse?.ID ?? 0;
      }

      // Nếu vẫn không có, lấy từ dataEdit (nếu có)
      if ((!currentId || currentId === 0) && this.dataEdit?.WarehouseID) {
        currentId = this.dataEdit.WarehouseID;
      }

      // Set WarehouseID và disable control để người dùng không thay đổi
      if (currentId > 0) {
        // Sử dụng setTimeout để đảm bảo form đã được khởi tạo và dataEdit đã được patch (nếu có)
        setTimeout(() => {
          // Luôn ưu tiên warehouseID từ input nếu có
          const finalWarehouseID =
            inputWarehouseID && inputWarehouseID > 0
              ? inputWarehouseID
              : currentId;
          this.formDeviceInfo.patchValue({ WarehouseID: finalWarehouseID });
          // Lưu giá trị WarehouseID vào biến instance để sử dụng khi lưu
          this.warehouseID = finalWarehouseID;
          this.formDeviceInfo.get('WarehouseID')?.disable();
        }, 300);
      }
    });
  }
  getListEmployee() {
    this.billImportTechnicalService.getUser().subscribe((respon: any) => {
      // API returns { status, data: [] } - using ApiResponseFactory
      this.emPloyeeLists = respon.data || [];
      console.log('✅ [getListEmployee] Employee List loaded, count =', this.emPloyeeLists.length);
      console.log('✅ [getListEmployee] Sample employee (first):', this.emPloyeeLists[0]);

      this.employeeSelectOptions = this.emPloyeeLists.map((e: any) => ({
        label: e.FullName,
        value: e.ID,
      }));

      // Force update table columns to refresh employee dropdown
      // Chỉ update nếu table đã được khởi tạo
      if (this.deviceTempTable && this.deviceTempTable.getColumnDefinitions) {
        try {
          this.deviceTempTable.setColumns(
            this.deviceTempTable.getColumnDefinitions()
          );
        } catch (err) {
          console.warn('Unable to update table columns:', err);
        }
      }

      // FIX TIMING: Sau khi employee list load xong, nếu đang ở luồng PONCC
      // thì re-apply Deliver name và logic department vì patchDataFromPONCC()
      // đã được gọi trước khi emPloyeeLists có dữ liệu
      if (this.flag === 1 && this.PonccID > 0) {
        const deliverID = this.formDeviceInfo.get('DeliverID')?.value;
        console.log('🔵 [getListEmployee] PONCC mode - re-applying DeliverID =', deliverID);
        const employee = this.emPloyeeLists.find((e: any) => e.ID === deliverID);
        if (deliverID) {
          console.log('🔵 [getListEmployee] Employee resolved after load:', employee);
          if (employee?.FullName) {
            this.formDeviceInfo.patchValue({ Deliver: employee.FullName }, { emitEvent: false });
            console.log('✅ [getListEmployee] Deliver name patched:', employee.FullName);
          }
        }
        // Nếu currentUser thuộc phòng ban DepartmentID=4, set CustomerID mặc định = 10910
        console.log('🔵 [getListEmployee] currentDepartmentID =', this.currentDepartmentID);
        if (this.currentDepartmentID === 4) {
          this.formDeviceInfo.patchValue({ CustomerID: 10910 }, { emitEvent: false });
          console.log('✅ [getListEmployee] CustomerID set to 10910 (currentUser dept=4)');
        }
        // Log trạng thái form sau khi resolve
        console.log('📋 [getListEmployee] Form values sau khi resolve PONCC:', {
          DeliverID: this.formDeviceInfo.get('DeliverID')?.value,
          Deliver: this.formDeviceInfo.get('Deliver')?.value,
          ReceiverID: this.formDeviceInfo.get('ReceiverID')?.value,
          CustomerID: this.formDeviceInfo.get('CustomerID')?.value,
        });
      }
    });
  }

  // Load danh sách sản phẩm cho select dropdown
  getProductList() {
    const request = {
      productGroupID: 0,
      keyWord: '',
      checkAll: 1,
      warehouseID: 0,
      productRTCID: 0,
      productGroupNo: '',
      page: 1,
      size: 100000, // Load tất cả sản phẩm
      warehouseType: this.warehouseType,
    };

    this.tbProductRtcService
      .getProductRTC(request)
      .subscribe((response: any) => {
        if (response && response.data) {
          this.productOptions = response.data.products.map((p: any) => ({
            ID: p.ID,
            ProductCode: p.ProductCode,
            ProductName: p.ProductName,
            ProductCodeRTC: p.ProductCodeRTC,
            Maker: p.Maker,
            UnitCountID: p.UnitCountID,
            UnitCountName: p.UnitCountName,
            NumberInStore: p.NumberInStore,
          }));
          console.log('✅ Product options loaded:', this.productOptions);

          // PONCC FLOW: Map detail data sau khi productOptions đã load
          if (
            this.pendingPONCCMapping &&
            this.dtDetails &&
            this.dtDetails.length > 0
          ) {
            this.mapDataFromPONCCToTable();
            this.pendingPONCCMapping = false;
          }
          if (this.deviceTempTable) {
            this.deviceTempTable.redraw(true);
          }
        }
      });
  }

  ngAfterViewInit(): void {
    this.drawTableSelectedDevices();
    // Set initial column visibility based on current BillTypeNew value
    const currentBillType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
    setTimeout(() => {
      this.updateColumnVisibility(currentBillType);
    }, 100);
  }

  //#region load quyền người dùng
  initializePermissions() {
    const currentUser = this.appUserService.currentUser;
    this.isAdmin = currentUser?.IsAdmin || false;
    this.currentUserID = currentUser?.ID || 0;
    this.currentEmployeeID = currentUser?.EmployeeID || 0;
    this.currentDepartmentID = currentUser?.DepartmentID || 0;

    this.applyFormPermissions();
  }

  applyFormPermissions() {
    const deliverID = this.formDeviceInfo.get('DeliverID')?.value || 0;
    this.canEditRestrictedFields =
      this.isAdmin || this.currentUserID === deliverID;

    const isApproved = this.formDeviceInfo.get('Status')?.value === true;
    this.isFormDisabled = isApproved && !this.isAdmin;

    // Logic cho StatusPur: chỉ cho edit khi:
    // 1. DeliverID = currentUserID (người giao là người đăng nhập)
    // 2. DepartmentID = 4 HOẶC isAdmin = true
    this.activePur = true;
    // this.currentUserID === deliverID ||
    // (this.currentDepartmentID === 4 || this.isAdmin);

    // console.log('Form Permissions:', {
    //   deliverID: deliverID,
    //   canEditRestrictedFields: this.canEditRestrictedFields,
    //   isFormDisabled: this.isFormDisabled,
    //   isApproved: isApproved,
    //   activePur: this.activePur,
    //   currentDepartmentID: this.currentDepartmentID,
    // });

    if (this.isFormDisabled) {
      this.formDeviceInfo.disable();
      console.log('Form disabled: Bill is approved and user is not admin');
    } else {
      this.formDeviceInfo.enable();

      this.formDeviceInfo.get('BillCode')?.disable();
    }
  }
  getEmployeeApprove() {
    this.billImportTechnicalService.getemployee().subscribe((res) => {
      this.approveEmployee = res.data;
    });
  }
  onDeliverIDChanged() {
    this.applyFormPermissions();

    // Auto-fill Deliver (FullName) when DeliverID changes
    const deliverID = this.formDeviceInfo.get('DeliverID')?.value;
    if (deliverID && this.emPloyeeLists && this.emPloyeeLists.length > 0) {
      const employee = this.emPloyeeLists.find((e: any) => e.ID === deliverID);
      if (employee && employee.FullName) {
        this.formDeviceInfo.patchValue(
          { Deliver: employee.FullName },
          { emitEvent: false }
        );
      }
    }
  }
  //#endregion

  //#Init
  ngOnInit() {
    // this.title =
    //   this.warehouseType === 1 ? 'Phiếu nhập kho DEMO' : 'Phiếu nhập kho AGV';
    this.initForm();

    // Khởi tạo BillTypeNew = 0 (--Chọn loại phiếu--)
    this.formDeviceInfo.patchValue({ BillTypeNew: 0 });

    // BillCode luôn ReadOnly (auto-generated)
    this.formDeviceInfo.get('BillCode')?.disable();

    // Nếu là chế độ Edit, disable các nút
    if (this.IsEdit) {
      this.isFormDisabled = true;
    }

    this.initializePermissions();

    // Nếu phiếu đã được duyệt (Status = true) và không phải Admin
    if (this.billImport?.Status === true && !this.isAdmin) {
      this.isFormDisabled = true;
    }

    // Load các lookup data trước
    this.getRulepay();
    this.getNCC();
    this.getCustomer();
    this.getDocumentImport();
    this.getListEmployee();
    this.getProductList();
    this.getEmployeeApprove();

    // Load warehouse và set WarehouseID (phải load trước khi patch dataEdit)
    this.getWarehouse();

    if (this.dataEdit) {
      // Lưu warehouseID từ input trước khi patch dataEdit (để không bị override)
      const inputWarehouseID = this.warehouseID;

      this.formDeviceInfo.patchValue({
        ...this.dataEdit,
        CreatDate: this.dataEdit?.CreatDate
          ? DateTime.fromISO(this.dataEdit.CreatDate).toJSDate()
          : null,
        DateRequestImport: this.dataEdit?.DateRequestImport
          ? DateTime.fromISO(this.dataEdit.DateRequestImport).toJSDate()
          : null,
        // Ưu tiên warehouseID từ input nếu có, nếu không thì dùng từ dataEdit
        WarehouseID:
          inputWarehouseID && inputWarehouseID > 0
            ? inputWarehouseID
            : this.dataEdit.WarehouseID || this.warehouseID,
      });

      // Restore warehouseID từ input để getWarehouse() sử dụng
      if (inputWarehouseID && inputWarehouseID > 0) {
        this.warehouseID = inputWarehouseID;
      }

      // Đảm bảo WarehouseID được set lại sau khi patch (nếu warehouseID từ input đã được set)
      if (inputWarehouseID && inputWarehouseID > 0) {
        setTimeout(() => {
          this.formDeviceInfo.patchValue({ WarehouseID: inputWarehouseID });
          this.formDeviceInfo.get('WarehouseID')?.disable();
        }, 300);
      }

      // Update column visibility after data is loaded
      setTimeout(() => {
        const billType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
        this.updateColumnVisibility(billType);
      }, 200);
    }

    if (this.masterId) {
      this.billImportTechnicalService
        .getBillImportDetail(this.masterId)
        .subscribe((res) => {
          this.selectedDevices = res.billDetail || [];
          this.drawTableSelectedDevices();
          // Update column visibility after data is loaded
          setTimeout(() => {
            const billType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
            this.updateColumnVisibility(billType);
          }, 200);
        });
    }

    // Chỉ lấy mã phiếu mới khi tạo mới (không có dataEdit)
    if (!this.dataEdit) {
      this.getNewCode();
    }
    // Set người nhận mặc định là user đang đăng nhập (chỉ khi tạo mới)
    const currentUser = this.appUserService.currentUser;
    if (!this.dataEdit) {
      this.formDeviceInfo.patchValue({ ReceiverID: 1700 });
    }

    // LUỒNG PONCC - Xử lý dữ liệu từ PONCC
    if (this.flag === 1 && this.PonccID > 0 && this.newBillImport) {
      // console.log('🔵 Luồng PONCC Technical detected');
      // console.log('🔵 PonccID:', this.PonccID);
      // console.log('🔵 Master data:', this.newBillImport);
      // console.log('🔵 Detail data (dtDetails):', this.dtDetails);

      // Patch master data từ PONCC ngay lập tức
      this.patchDataFromPONCC();

      // Map detail data từ PONCC SAU KHI productOptions đã load
      // Sử dụng flag để đánh dấu cần map data sau khi load xong
      this.pendingPONCCMapping = true;
    }
  }
  //#endregion
  changeStatus() {
    this.getNewCode();
  }
  async close() {
    const isValid = await this.checkSerial();
    if (!isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Số lượng serial lớn hơn số lượng yêu cầu, vui lòng kiểm tra lại'
      );
      return;
    }
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }

  // INTEGRATION: Mở modal lịch sử mượn
  async openBorrowHistory() {
    // // Dynamic import để tránh circular dependency
    // const { BorrowProductHistoryComponent } = await import(
    //   '../../inventory-demo/borrow/borrow-product-history/borrow-product-history.component'
    // );

    const modalRef = this.ngbModal.open(HistoryProductRtcComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen',
    });

    modalRef.componentInstance.isModalMode = true;
    modalRef.componentInstance.warehouseType = this.warehouseType;

    modalRef.result.then(
      (products: any[]) => {
        if (products && products.length > 0) {
          this.handleExportedProducts(products);
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // INTEGRATION: Xử lý dữ liệu sản phẩm được xuất từ lịch sử mượn
  private handleExportedProducts(products: any[]) {
    if (!products || products.length === 0) return;

    // Map dữ liệu từ history sang format của bill import
    const mappedProducts = products.map((product) => ({
      UID: Date.now() + Math.random(),
      ProductID: product.ProductRTCID || 0,
      ProductCode: product.ProductCode || '',
      ProductName: product.ProductName || '',
      ProductCodeRTC: product.ProductCodeRTC || '',
      UnitCountName: product.UnitCountName || '',
      UnitCountID: product.UnitCountID || 0,
      Maker: product.Maker || '',
      NumberInStore: product.NumberInStore || 0,
      Quantity: product.NumberBorrow || 1,
      Price: 0,
      TotalPrice: 0,
      TotalQuantity: product.NumberBorrow || 1,
      SerialNumber: product.SerialNumber || '',
      PartNumber: product.PartNumber || '',
      Serial: product.Serial || '',
      Note: product.Note || '',
      EmployeeIDBorrow: product.PeopleID || 0,
      DeadlineReturnNCC: product.DateReturnExpected || null,
      HistoryProductRTCID: product.ID || 0,
      ProductRTCQRCodeID: product.ProductRTCQRCodeID || 0,
    }));

    // Thêm vào selectedDevices
    this.selectedDevices = [...this.selectedDevices, ...mappedProducts];

    // Refresh table
    if (this.deviceTempTable) {
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }

  /**
   * PONCC FLOW: Patch master data từ PONCC vào form
   */
  private patchDataFromPONCC() {
    if (!this.newBillImport) {
      console.warn('⚠️ patchDataFromPONCC: Không có dữ liệu master từ PONCC');
      return;
    }

    console.log('🔵 [patchDataFromPONCC] Raw newBillImport:', this.newBillImport);
    console.log('🔵 [patchDataFromPONCC] emPloyeeLists.length tại thời điểm này =', this.emPloyeeLists?.length ?? 0);

    // Xác định giá trị cho các trường
    const receiverID =
      this.newBillImport.ReceiverID || this.newBillImport.ReciverID || 0;
    const deliverID = this.newBillImport.DeliverID || 0;
    const supplierSaleID = this.newBillImport.SupplierSaleID || 0;
    const rulePayID = this.newBillImport.RulePayID || 0;
    const customerID = this.newBillImport.CustomerID || 0;

    console.log('🔵 [patchDataFromPONCC] Các giá trị sẽ patch:', {
      deliverID, receiverID, supplierSaleID, rulePayID, customerID,
      BillTypeNew: this.newBillImport.BillTypeNew,
    });

    // Patch dữ liệu master từ PONCC vào form
    this.formDeviceInfo.patchValue({
      BillCode: this.newBillImport.BillCode || '',
      BillTypeNew: this.newBillImport.BillTypeNew || 5, // Y/c nhập kho
      ReceiverID: receiverID,
      DeliverID: deliverID,
      WarehouseID: this.newBillImport.WarehouseID || this.warehouseID,
      SupplierSaleID: supplierSaleID,
      CustomerID: customerID,
      RulePayID: rulePayID,
      CreatDate: this.newBillImport.CreatDate
        ? new Date(this.newBillImport.CreatDate)
        : new Date(),
      DateRequestImport: this.newBillImport.DateRequestImport
        ? new Date(this.newBillImport.DateRequestImport)
        : new Date(),
    });

    console.log('🔵 [patchDataFromPONCC] Form values ngay sau patchValue:', {
      DeliverID: this.formDeviceInfo.get('DeliverID')?.value,
      Deliver: this.formDeviceInfo.get('Deliver')?.value,
      ReceiverID: this.formDeviceInfo.get('ReceiverID')?.value,
      CustomerID: this.formDeviceInfo.get('CustomerID')?.value,
      SupplierSaleID: this.formDeviceInfo.get('SupplierSaleID')?.value,
    });
  }

  /**
   * PONCC FLOW: Map detail data từ PONCC vào table
   */
  private mapDataFromPONCCToTable() {
    if (!this.dtDetails || this.dtDetails.length === 0) {
      console.warn(
        '⚠️ mapDataFromPONCCToTable: Không có dữ liệu detail từ PONCC'
      );
      return;
    }

    // Map dữ liệu từ dtDetails sang format của BillImportTechnical
    const mappedProducts = this.dtDetails.map((item: any, index: number) => {
      // Ưu tiên ProductRTCID cho kho kỹ thuật
      const productID = item.ProductRTCID || item.ProductSaleID || 0;

      // Tìm thông tin sản phẩm từ productOptions
      const productInfo =
        this.productOptions.find((p: any) => p.ID === productID) || {};

      // Ưu tiên lấy unit từ item trước, nếu không có thì lấy từ productInfo
      const unitCountName =
        item.UnitName || item.Unit || productInfo.UnitCountName || '';
      const unitCountID = productInfo.UnitCountID || 0;
      console.log('unitcountnhat:', unitCountName);

      return {
        UID: Date.now() + Math.random(),
        ProductID: productID,
        ProductCode: item.ProductCode || productInfo.ProductCode || '',
        ProductName: item.ProductName || productInfo.ProductName || '',
        ProductCodeRTC: item.ProductNewCode || productInfo.ProductCodeRTC || '',
        UnitCountName: unitCountName, // ⭐ Đơn vị tính
        UnitCountID: unitCountID,
        Maker: item.Maker || productInfo.Maker || '',
        NumberInStore: productInfo.NumberInStore || 0,
        Quantity: item.QtyRequest || item.QuantityRemain || 1,
        Price: item.UnitPrice || 0,
        TotalPrice: (item.QtyRequest || 1) * (item.UnitPrice || 0),
        TotalQuantity: item.QtyRequest || item.QuantityRemain || 1,
        SerialNumber: '',
        PartNumber: '',
        Serial: '',
        Note: item.Note || '',
        EmployeeIDBorrow: 0,
        DeadlineReturnNCC: null,
        BillCodePO: item.BillCode || '',
        PONCCDetailID: item.ID || 0,
      };
    });

    console.log('✅ Dữ liệu đã map:', mappedProducts);

    // Thêm vào selectedDevices
    this.selectedDevices = [...this.selectedDevices, ...mappedProducts];

    // Refresh table
    if (this.deviceTempTable) {
      this.deviceTempTable.setData(this.selectedDevices);
      console.log('✅ Detail data từ PONCC đã được load vào table');
    } else {
      console.warn('⚠️ Table chưa được khởi tạo, dữ liệu sẽ được load sau');
    }
  }

  getDocumentImport() {
    this.billImportTechnicalService
      .getDocumentBillImport(0, this.masterId || 0)
      .subscribe((respon: any) => {
        if (respon.status === 1) {
          this.dataTableDocumnetImport = respon.document || [];
          if (this.table_DocumnetImport) {
            this.table_DocumnetImport.replaceData(this.dataTableDocumnetImport);
          }
        }
      });
  }

  loadDocumentImport() {
    this.isLoading = true;
    this.billImportTechnicalService
      .getDocumentBillImport(0, this.masterId || 0)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.dataTableDocumnetImport = res.document || [];
            if (this.table_DocumnetImport) {
              this.table_DocumnetImport.replaceData(
                this.dataTableDocumnetImport
              );
            } else {
              this.drawDocumentTable();
            }
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading document import:', err);
          this.isLoading = false;
        },
      });
  }

  onTabChange(index: number) {
    if (index === 1) {
      // Tab "Hồ sơ đi kèm" được chọn
      if (!this.table_DocumnetImport) {
        // Nếu chưa tạo bảng, tạo mới
        this.loadDocumentImport();
      }
    }
  }
  getNewCode() {
    const billType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
    this.billImportTechnicalService.getBillCode(billType).subscribe({
      next: (res: any) => {
        this.formDeviceInfo.patchValue({ BillCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy mã phiếu'
        );
      },
    });
  }
  openModalChoseProduct() {
    const modalRef = this.ngbModal.open(BillImportChoseProductFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.formSubmitted.subscribe(
      (selectedProducts: any[]) => {
        this.selectedDevices = [...this.selectedDevices, ...selectedProducts];

        if (this.deviceTempTable) {
          this.deviceTempTable.setData(this.selectedDevices);
        }
      }
    );
  }
  // Vẽ bảng tạm chọn thiết bị
  drawTableSelectedDevices() {
    this.deviceTempTable = new Tabulator(this.tableDeviceTemp.nativeElement, {
      layout: 'fitDataStretch',
      data: this.selectedDevices,
      selectableRows: true,
      height: '40vh',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        resizable: true,
      },
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          titleFormatter: () => `
          <div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
          headerClick: () => {
            this.addRow();
          },
          formatter: () =>
            `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const rowData = row.getData();
            const rowUID = rowData['UID'];

            // FIX: Xóa khỏi selectedDevices array trước khi xóa khỏi Tabulator
            this.selectedDevices = this.selectedDevices.filter(
              (device) => device['UID'] !== rowUID
            );

            // Sau đó xóa khỏi Tabulator
            row.delete();
          },
        },
        { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 60 },
        {
          title: 'Mã sản phẩm',
          field: 'ProductID',
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const productId = Number(cell.getValue());
            const product = this.productOptions.find((p) => p.ID === productId);
            const productCode = product ? product.ProductCode : '';
            return `
              <button class="btn-toggle-detail w-100 h-100" title="${productCode || 'Chọn sản phẩm'
              }">
                <span class="product-code-text">${productCode || 'Chọn SP'
              }</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.showProductPopup(cell);
          },
        },
        { title: 'Tên sản phẩm', field: 'ProductName', width: 200 },
        { title: 'Mã nội bộ', field: 'ProductCodeRTC', width: 120 },
        { title: 'Đơn vị tính', field: 'UnitCountName', width: 100 },
        {
          title: 'Số lượng',
          field: 'Quantity',
          editor: 'input',
          width: 100,
          editorParams: { elementAttributes: { type: 'number' } },
          cellEdited: (cell) => this.onQuantityChanged(cell),
        },

        {
          title: 'Đơn giá',
          field: 'Price',
          editor: this.currencyEditor.bind(this),
          width: 120,
          hozAlign: 'right',
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
          cellEdited: (cell) => this.onPriceChanged(cell),
        },
        {
          title: 'Thành tiền',
          field: 'TotalPrice',
          width: 130,
          hozAlign: 'right',
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
        },
        {
          title: 'Hãng',
          field: 'Maker',
          editor: 'input',
          width: 120,
        },
        {
          title: 'Số hóa đơn',
          field: 'SomeBill',
          editor: 'input',
          width: 120,
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'Ngày hóa đơn',
          field: 'DateSomeBill',
          editor: 'input',
          width: 130,
          editorParams: {
            elementAttributes: { type: 'date' },
          },
          mutator: (value) => (value ? new Date(value).toISOString() : null),
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString('vi-VN') : '';
          },
          cellEdited: (cell) => this.onDateSomeBillChanged(cell),
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },

        {
          title: 'Giảm thuế',
          field: 'TaxReduction',
          editor: 'input',
          width: 100,
          hozAlign: 'right',
          editorParams: { elementAttributes: { type: 'number' } },
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
          editable: () => this.canEditRestrictedFields,
        },
        {
          title: 'Đơn mua hàng',
          field: 'BillCodePO',
          width: 120,
        },
        {
          title: 'Người mượn',
          field: 'EmployeeIDBorrow',
          editor: 'list',
          width: 150,
          visible: false, // Mặc định ẩn, sẽ được cập nhật bởi updateColumnVisibility()
          editorParams: () => {
            const values: any = {};
            this.employeeSelectOptions.forEach((p) => {
              values[p.value] = p.label;
            });
            return {
              values: values,
              autocomplete: true,
              listOnEmpty: true,
              freetext: false,
              allowEmpty: false,
              emptyValue: null,
            };
          },

          formatter: (cell) => {
            const val = Number(cell.getValue());
            const emp = this.employeeSelectOptions.find(
              (e) => Number(e.value) === val
            );
            return emp ? emp.label : '';
          },

          cellEdited: (cell) => this.onEmployeeBorrowChanged(cell),
        },
        {
          title: 'Hạn trả NCC',
          field: 'DeadlineReturnNCC',
          editor: 'input',
          width: 130,
          visible: false, // Mặc định ẩn, sẽ được cập nhật bởi updateColumnVisibility()
          editorParams: {
            elementAttributes: { type: 'date' },
          },
          mutator: (value) => (value ? new Date(value).toISOString() : null),
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString('vi-VN') : '';
          },
          cellEdited: (cell) => this.onDeadlineReturnNCCChanged(cell),
        },
        { title: 'Ghi chú', field: 'Note', editor: 'input', width: 150 },
        { title: 'Serial IDs', field: 'SerialIDs', visible: false },
        { title: 'PONCCDetailID', field: 'PONCCDetailID', visible: false },
        { title: 'ProjectID', field: 'ProjectID', visible: false },
        // Chọn serial
        {
          title: '',
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
            const quantity = rowData['Quantity'];
            const productCode = rowData['ProductCode'];
            const serialIDsRaw = rowData['SerialIDs'];
            if (quantity <= 0) {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng nhập số lượng lớn hơn 0 trước khi chọn Serial!'
              );
              return;
            }
            if (serialIDsRaw) {
              const serialIDs = serialIDsRaw
                .split(',')
                .map((id: string) => parseInt(id))
                .filter((id: number) => !isNaN(id) && id > 0);

              const existingSerials: { ID: number; Serial: string }[] = [];
              let loadedCount = 0;
              serialIDs.forEach((id: number) => {
                this.billImportTechnicalService.getSerialByID(id).subscribe({
                  next: (res) => {
                    if (res?.status === 1 && res.data) {
                      existingSerials.push({
                        ID: res.data.ID,
                        Serial: res.data.SerialNumber || res.data.Serial || '',
                      });
                    }
                  },
                  error: (err) => {
                    console.error(`Lỗi khi load serial ID ${id}:`, err);
                  },
                  complete: () => {
                    loadedCount++;
                    if (loadedCount === serialIDs.length) {
                      this.openSerialModal(
                        rowData,
                        row,
                        quantity,
                        productCode,
                        existingSerials
                      );
                    }
                  },
                });
              });
            } else {
              this.openSerialModal(rowData, row, quantity, productCode, []);
            }
          },
        },
      ],
      placeholder: 'Chưa có thiết bị nào được chọn',
    });
  }
  // Mở modal chọn serial
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
    const modalRef = this.ngbModal.open(BillImportChoseSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.dataBillDetail = rowData;
    modalRef.componentInstance.type = 1;
    modalRef.componentInstance.isTechBill = true;
    modalRef.componentInstance.warehouseId = this.warehouseID;
    modalRef.componentInstance.isBillImport = true;
    modalRef.result
      .then((serials: { ID: number; Serial: string }[]) => {
        const newSerial = serials.map((s) => s.Serial).join(', ');
        const serialIDs = serials.map((s) => s.ID).join(', ');
        rowData['Serial'] = newSerial;
        rowData['SerialIDs'] = serialIDs;
        row.update(rowData);
      })
      .catch(() => { });
  }
  // Thêm dòng mới vào bảng tạm
  addRow() {
    if (this.deviceTempTable) {
      const newRow = {
        UID: Date.now() + Math.random(),
        ProductCode: '',
        ProductName: '',
        NumberInStore: 1,
        Serial: '',
        Note: '',
        Quantity: 0,
        Price: 0,
        TotalPrice: 0,
        TotalQuantity: 0,
      };
      this.selectedDevices.push(newRow);

      // FIX: Sử dụng addRow() thay vì setData() để tránh re-render toàn bộ table
      this.deviceTempTable.addRow(newRow).then((row: any) => {
        row.scrollTo().then(() => {
          setTimeout(() => {
            const cell = row.getCell('ProductCode');
            if (cell) {
              cell.edit();
            }
          }, 100);
        });
      });
    }
  }

  // PHASE 2.2: Calculation Logic - Calculate TotalPrice when Quantity or Price changes
  onQuantityChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const quantity = parseFloat(data['Quantity']) || 0;
    const price = parseFloat(data['Price']) || 0;

    // Calculate TotalPrice = Quantity * Price
    data['TotalPrice'] = quantity * price;
    data['TotalQuantity'] = quantity;

    row.update(data);

    // Recalculate totals for duplicate products
    this.recheckQty();
  }

  currencyEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'text';
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    input.inputMode = 'decimal'; // Hiển thị bàn phím số trên mobile

    const initialValue = cell.getValue();
    if (initialValue) {
      const num = parseFloat(initialValue);
      if (!isNaN(num)) {
        input.value = new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0,
        }).format(num);
      }
    }

    const formatCurrency = (inputEl: HTMLInputElement) => {
      const start = inputEl.selectionStart || 0;
      let rawValue = inputEl.value.replace(/[^0-9.]/g, '');

      if (rawValue === '') {
        inputEl.value = '';
        return;
      }

      const parts = rawValue.split('.');
      let numberPart = parts[0];
      let decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

      const num = Number(numberPart);

      if (!isNaN(num)) {
        const formattedNumber = new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0,
        }).format(num);

        inputEl.value = formattedNumber + decimalPart;
      }

      const newCaretPos = calculateCaretPosition(
        rawValue,
        inputEl.value,
        start
      );
      inputEl.setSelectionRange(newCaretPos, newCaretPos);
    };

    const calculateCaretPosition = (
      raw: string,
      formatted: string,
      oldPos: number
    ): number => {
      const rawLeft = raw.slice(0, oldPos).replace(/[^0-9]/g, '').length;
      let newPos = 0;
      let count = 0;

      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count === rawLeft + 1) {
          newPos = i + 1;
          break;
        }
      }

      return newPos || formatted.length;
    };

    // Chỉ cho phép nhập số và dấu chấm
    input.addEventListener('keypress', (e) => {
      const char = e.key;
      const currentValue = input.value;

      // Cho phép: số 0-9, dấu chấm (.), các phím điều khiển
      if (
        !/[0-9.]/.test(char) &&
        ![
          'Backspace',
          'Delete',
          'ArrowLeft',
          'ArrowRight',
          'Tab',
          'Enter',
          'Escape',
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Chỉ cho phép 1 dấu chấm
      if (char === '.' && currentValue.includes('.')) {
        e.preventDefault();
        return;
      }
    });

    input.addEventListener('input', () => formatCurrency(input));

    input.addEventListener('blur', () => {
      const rawValue = input.value.replace(/[^0-9.]/g, '');
      const num = parseFloat(rawValue);
      success(isNaN(num) ? 0 : num);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawValue = input.value.replace(/[^0-9.]/g, '');
        const num = parseFloat(rawValue);
        success(isNaN(num) ? 0 : num);
      }
      if (e.key === 'Escape') {
        cancel();
      }
    });

    onRendered(() => {
      input.focus();
      input.select();
    });

    return input;
  }

  onPriceChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const quantity = parseFloat(data['Quantity']) || 0;
    const price = parseFloat(data['Price']) || 0;

    data['TotalPrice'] = quantity * price;

    row.update(data);
  }

  onDateSomeBillChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();

    if (data['DateSomeBill'] && data['DPO']) {
      const dateSomeBill = new Date(data['DateSomeBill']);
      const dpo = parseInt(data['DPO']) || 0;

      const dueDate = new Date(dateSomeBill);
      dueDate.setDate(dueDate.getDate() + dpo);

      data['DueDate'] = dueDate.toISOString();
      row.update(data);
    }
  }

  onDPOChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();

    if (data['DateSomeBill'] && data['DPO']) {
      const dateSomeBill = new Date(data['DateSomeBill']);
      const dpo = parseInt(data['DPO']) || 0;

      const dueDate = new Date(dateSomeBill);
      dueDate.setDate(dueDate.getDate() + dpo);

      data['DueDate'] = dueDate.toISOString();
      row.update(data);
    }
  }

  onDeadlineReturnNCCChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const currentIndex = row.getPosition() as number;
    const deadline = data['DeadlineReturnNCC'];

    if (!deadline) return;
    const allRows = this.deviceTempTable?.getRows() || [];
    for (let i = currentIndex; i < allRows.length; i++) {
      const rowData = allRows[i].getData();
      rowData['DeadlineReturnNCC'] = deadline;
      allRows[i].update(rowData);
    }
  }
  onEmployeeBorrowChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const currentIndex = row.getPosition() as number;
    const employeeId = data['EmployeeIDBorrow'];

    if (!employeeId) return;
    const allRows = this.deviceTempTable?.getRows() || [];
    for (let i = currentIndex; i < allRows.length; i++) {
      const rowData = allRows[i].getData();
      rowData['EmployeeIDBorrow'] = employeeId;
      allRows[i].update(rowData);
    }
  }

  // PHASE 2.2: RecheckQty - Recalculate TotalQuantity for duplicate products
  recheckQty() {
    if (!this.deviceTempTable) return;

    const allRows = this.deviceTempTable.getRows();
    const productQtyMap = new Map<number, number>();

    // First pass: sum quantities by ProductID
    allRows.forEach((row) => {
      const data = row.getData();
      const productId = data['ProductID'];
      const quantity = parseFloat(data['Quantity']) || 0;

      if (productId) {
        const currentTotal = productQtyMap.get(productId) || 0;
        productQtyMap.set(productId, currentTotal + quantity);
      }
    });

    // Second pass: update TotalQuantity for all rows with same ProductID
    allRows.forEach((row) => {
      const data = row.getData();
      const productId = data['ProductID'];

      if (productId && productQtyMap.has(productId)) {
        data['TotalQuantity'] = productQtyMap.get(productId);
        row.update(data);
      }
    });
  }
  // PHASE 3.1: Validate BillCode uniqueness
  async validateBillCodeUniqueness(): Promise<boolean> {
    const billCode = this.formDeviceInfo.get('BillCode')?.value;
    const currentID = this.formDeviceInfo.get('ID')?.value || 0;

    if (!billCode) return true;

    try {
      const response: any = await firstValueFrom(
        this.billImportTechnicalService.getBillImportByCode(billCode)
      );
      if (
        response.status === 1 &&
        response.master &&
        response.master.length > 0
      ) {
        const existingBill = response.master[0];
        // If editing and same ID, it's ok
        if (currentID > 0 && existingBill.ID === currentID) {
          return true;
        }
        // Otherwise it's a duplicate
        this.notification.error(
          'Lỗi',
          `Mã phiếu "${billCode}" đã tồn tại. Vui lòng sử dụng mã khác.`
        );
        return false;
      }
      return true;
    } catch (error) {
      // If error (bill not found), it means it's unique
      return true;
    }
  }

  // Lưu dữ liệu
  async saveData() {
    const isValid = await this.checkSerial();
    if (!isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Số lượng serial không đủ, vui lòng kiểm tra lại'
      );
      return;
    }

    // PHASE 3.1: Validate form
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }
    // Sử dụng getRawValue() để lấy cả field bị disable như BillCode
    const formValue = this.formDeviceInfo.getRawValue();
    // Validate that all devices have ProductID
    const invalidProduct = this.selectedDevices.find(
      (d: any) => !d.ProductID || d.ProductID <= 0
    );
    if (invalidProduct) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn sản phẩm cho tất cả các dòng.'
      );
      return;
    }

    // Bỏ validation EmployeeIDBorrow và DeadlineReturnNCC cho phiếu Mượn NCC
    // (Theo yêu cầu: khi trạng thái là mượn ncc thì bỏ validate hạn trả ncc và người mượn)

    const deliverEmployee = this.emPloyeeLists.find(
      (e) => e.ID === formValue.DeliverID
    );
    const receiverEmployee = this.emPloyeeLists.find(
      (e) => e.ID === formValue.ReceiverID
    );

    const deliverText = formValue.Deliver || deliverEmployee?.FullName || '';
    const receiverText = receiverEmployee?.FullName || '';

    const payload = {
      billImportTechnical: {
        ID: formValue.ID || 0,
        BillCode: formValue.BillCode,
        CreatDate: this.toLocalISOString(formValue.CreatDate),
        Deliver: deliverText,
        Receiver: receiverText,
        Status: formValue.Status || false,
        Suplier: formValue.Suplier || '',
        BillType: this.warehouseType == 2,
        WarehouseType: formValue.WarehouseType,
        DeliverID: formValue.DeliverID,
        ReceiverID: formValue.ReceiverID,
        SuplierID: 0,
        GroupTypeID: 0,
        Image: formValue.Image || '',
        WarehouseID: formValue.WarehouseID || this.warehouseID || 1,
        SupplierSaleID: formValue.SupplierSaleID || 0,
        BillTypeNew: formValue.BillTypeNew || 0,
        IsBorrowSupplier: formValue.IsBorrowSupplier || 0,
        CustomerID: formValue.CustomerID || 0,
        BillDocumentImportType: formValue.BillDocumentImportType || 0,
        DateRequestImport: this.toLocalISOString(formValue.DateRequestImport),
        RulePayID: formValue.RulePayID,
        IsNormalize: formValue.IsNormalize || false,
        ApproverID: formValue.ApproverID || 0,
      },
      billImportDetailTechnicals: this.selectedDevices.map((device, index) => {
        // Helper function to handle null/undefined for numeric fields
        const toNumberOrNull = (value: any): number | null => {
          if (value === null || value === undefined || value === '')
            return null;
          const num = Number(value);
          return isNaN(num) ? null : num;
        };

        // Helper function specifically for integer fields
        const toIntOrNull = (value: any): number | null => {
          if (value === null || value === undefined || value === '')
            return null;
          const num = parseInt(String(value), 10);
          return isNaN(num) ? null : num;
        };

        return {
          ID: device.ID || 0,
          STT: index + 1,
          ProductID: device.ProductID || null,
          ProductCode: device.ProductCode || '',
          ProductName: device.ProductName || '',
          ProductCodeRTC: device.ProductCodeRTC || '',
          Serial: device.Serial || '',
          SerialNumber: device.SerialNumber || '',
          PartNumber: device.PartNumber || '',
          UnitCountName: device.UnitCountName || '',
          NumberInStore: device.NumberInStore || 1,
          Note: device.Note || '',
          DeadlineReturnNCC: device.DeadlineReturnNCC
            ? DateTime.fromJSDate(new Date(device.DeadlineReturnNCC)).toISO()
            : null,
          LocationName: device.LocationName || '',
          Quantity: toNumberOrNull(device.Quantity) ?? 1,
          TotalQuantity:
            toNumberOrNull(device.TotalQuantity) ??
            toNumberOrNull(device.Quantity) ??
            1,
          Price: toNumberOrNull(device.Price) ?? 0,
          TotalPrice: toNumberOrNull(device.TotalPrice) ?? 0,
          UnitID: device.UnitCountID || 0,
          UnitName: device.UnitCountName || '',
          ProjectID: device.ProjectID || 0,
          ProjectCode: device.ProjectCode || '',
          ProjectName: device.ProjectName || '',
          SomeBill: device.SomeBill || '',
          DateSomeBill: device.DateSomeBill
            ? DateTime.fromJSDate(new Date(device.DateSomeBill)).toISO()
            : null,
          DPO: toIntOrNull(device.DPO),
          DueDate: device.DueDate
            ? DateTime.fromJSDate(new Date(device.DueDate)).toISO()
            : null,
          TaxReduction: toNumberOrNull(device.TaxReduction),
          COFormE: toNumberOrNull(device.COFormE),
          Maker: device.Maker || '',
          BillCodePO: device.BillCodePO || '',
          PONCCDetailID: device.PONCCDetailID || 0,
          HistoryProductRTCID: device.HistoryProductRTCID || 0,
          ProductRTCQRCodeID: device.ProductRTCQRCodeID || 0,
          EmployeeIDBorrow: device.EmployeeIDBorrow || 0,
          WarehouseID: formValue.WarehouseID || this.warehouseID || 1,
        };
      }),
      billImportTechDetailSerials: this.selectedDevices
        .map((device, index) => {
          const serialIDs = (device.SerialIDs || '')
            .split(',')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id) && id > 0);
          const stt = device.STT ?? index + 1;
          return serialIDs.map((serialID: number) => ({
            ID: serialID || 0,
            STT: stt,
            WarehouseID: formValue.WarehouseID || this.warehouseID || 1,
          }));
        })
        .flat(),
      documentImportPONCCs: (this.table_DocumnetImport?.getData() || []).map(
        (doc: any) => ({
          ID: doc.ID || 0,
          DocumentImportID: doc.DocumentImportID || 0,
          ReasonCancel: doc.ReasonCancel || '',
          Note: doc.Note || '',
          BillImportTechnicalID: formValue.ID || 0,
          Status: doc.Status || 0,
          StatusPurchase: doc.DocumentStatusPur === true ? 1 : 2,
          UpdatedDate: new Date().toISOString(),
        })
      ),
      PonccID: this.PonccID || 0, // Sẽ được set khi vớt từ PO sang
    };

    console.log('Full Payload:', JSON.stringify(payload, null, 2));
    console.log('========================================');

    this.billImportTechnicalService.saveData(payload).subscribe({
      next: (response: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu phiếu thành công'
        );
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        console.error('Error response:', error.error);

        let errorMessage = 'Không thể lưu phiếu, vui lòng thử lại sau';
        if (error.error?.errors) {
          const errorDetails = Object.entries(error.error.errors)
            .map(
              ([field, messages]: [string, any]) =>
                `${field}: ${messages.join(', ')}`
            )
            .join('\n');
          errorMessage = `Lỗi validation:\n${errorDetails}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }
  drawDocumentTable() {
    this.isLoading = true;

    setTimeout(() => {
      this.table_DocumnetImport = new Tabulator(
        this.tableDocumnetImport.nativeElement,
        {
          data: this.dataTableDocumnetImport, // mảng chứa dữ liệu JSON
          layout: 'fitDataFill',
          height: '50vh',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,

          columns: [
            {
              title: 'Trạng thái pur',
              field: 'DocumentStatusPur',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 150,
              // Mutator: Convert numeric values (1/2) to boolean when data is loaded
              mutator: (value) => {
                if (value === 1) return true;
                if (value === 2) return false;
                return value; // Keep boolean values as-is
              },
              editor: (cell, onRendered, success, cancel) => {
                // Chỉ cho edit nếu activePur = true
                if (!this.activePur) {
                  return false;
                }

                const value = cell.getValue();

                // Create wrapper div for centering
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.justifyContent = 'center';
                wrapper.style.alignItems = 'center';
                wrapper.style.height = '100%';
                wrapper.style.width = '100%';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = value === true;
                checkbox.style.cursor = 'pointer';

                checkbox.addEventListener('change', (e) => {
                  e.stopPropagation();
                  const newValue = checkbox.checked;
                  console.log('StatusPur changed:', {
                    oldValue: value,
                    newValue: newValue,
                    row: cell.getRow().getData(),
                  });
                  success(newValue);
                });

                wrapper.appendChild(checkbox);
                return wrapper;
              },

              formatter: (cell) => {
                const value = cell.getValue();
                return value
                  ? "<div style='text-align:center'><input class='mt-1' type='checkbox' checked disabled></div>"
                  : "<div style='text-align:center'><input class='mt-1' type='checkbox' disabled></div>";
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

  // REFACTOR: Hàm mới thay thế toggleProductTable - sử dụng TabulatorPopupService
  // Code cũ: 231 dòng, phức tạp, dễ memory leak
  // Code mới: 43 dòng, đơn giản, tự động cleanup
  showProductPopup(cell: CellComponent) {
    const cellElement = cell.getElement();

    // Toggle: nếu đang mở thì đóng
    if (cellElement.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    // Mở popup mới với TabulatorPopupService
    this.tabulatorPopupService.open(
      {
        data: this.productOptions || [],
        columns: this.productPopupColumns,
        searchFields: ['ProductCode', 'ProductName', 'ProductCodeRTC'],
        searchPlaceholder: 'Tìm kiếm sản phẩm...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selectedProduct) => {
          // Fill dữ liệu vào row cha
          const parentRow = cell.getRow();
          parentRow.update({
            ProductID: selectedProduct.ID,
            ProductCode: selectedProduct.ProductCode,
            ProductName: selectedProduct.ProductName,
            ProductCodeRTC: selectedProduct.ProductCodeRTC,
            UnitCountName: selectedProduct.UnitCountName,
            UnitCountID: selectedProduct.UnitCountID,
            Maker: selectedProduct.Maker,
            NumberInStore: selectedProduct.NumberInStore,
          });

          // Đóng popup
          this.tabulatorPopupService.close();
        },
        onClosed: () => {
          // Optional: xử lý khi popup đóng
        },
      },
      cellElement
    );
  }

  /* REFACTOR NOTE: Code cũ đã được comment lại bên dưới để tham khảo
  // Toggle popup table cho chọn sản phẩm
  toggleProductTable(cell: any) {
    const cellElement = cell.getElement();

    // Nếu đang mở → đóng lại và cleanup
    if (cellElement.classList.contains('child-open')) {
      const existingChild = document.body.querySelector(
        '.child-row-container[data-cell-id="' +
          cellElement.dataset['cellId'] +
          '"]'
      );
      if (existingChild) {
        // FIX: Destroy Tabulator instance trước khi remove DOM để tránh memory leak
        const tabulatorInstance = (existingChild as any)._tabulatorInstance;
        if (tabulatorInstance) {
          tabulatorInstance.destroy();
          // console.log('✅ Destroyed Tabulator instance');
        }

        // FIX: Remove click event listener để tránh memory leak
        const clickHandler = (existingChild as any)._clickHandler;
        if (clickHandler) {
          document.removeEventListener('click', clickHandler);
          // console.log('✅ Removed click event listener');
        }

        const viewRef = (existingChild as any)._viewRef;
        if (viewRef) {
          viewRef.destroy();
        }
        existingChild.remove();
      }
      cellElement.classList.remove('child-open');
      return;
    }

    // Nếu đang đóng → mở
    cellElement.classList.add('child-open');
    const cellId = 'cell-' + Date.now();
    cellElement.dataset['cellId'] = cellId;

    // Tạo container absolute
    const childRow = document.createElement('div');
    childRow.classList.add('child-row-container');
    childRow.dataset['cellId'] = cellId;

    // Lấy vị trí của cell
    const cellRect = cellElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - cellRect.bottom;
    const spaceAbove = cellRect.top;

    // Set vị trí tuyệt đối dựa trên tọa độ cell
    childRow.style.position = 'fixed';
    childRow.style.left = cellRect.left + 'px';
    childRow.style.minWidth = '500px';
    childRow.style.maxWidth = '700px';
    childRow.style.zIndex = '10000';

    if (spaceBelow < 300 && spaceAbove > spaceBelow) {
      childRow.style.bottom = viewportHeight - cellRect.top + 'px';
    } else {
      childRow.style.top = cellRect.bottom + 'px';
    }

    // Append vào body thay vì vào cell
    document.body.appendChild(childRow);

    // Đóng popup khi click bên ngoài
    const closeOnClickOutside = (event: MouseEvent) => {
      if (
        !childRow.contains(event.target as Node) &&
        !cellElement.contains(event.target as Node)
      ) {
        const existingChild = document.body.querySelector(
          '.child-row-container[data-cell-id="' + cellId + '"]'
        );
        if (existingChild) {
          // FIX: Destroy Tabulator instance trước khi remove DOM để tránh memory leak
          const tabulatorInstance = (existingChild as any)._tabulatorInstance;
          if (tabulatorInstance) {
            tabulatorInstance.destroy();
            // console.log('✅ Destroyed Tabulator instance on click outside');
          }

          const viewRef = (existingChild as any)._viewRef;
          if (viewRef) {
            viewRef.destroy();
          }
          existingChild.remove();
        }
        cellElement.classList.remove('child-open');
        // FIX: Remove event listener sau khi đã xử lý
        document.removeEventListener('click', closeOnClickOutside);
      }
    };

    // FIX: Lưu reference của event handler để có thể remove sau này
    (childRow as any)._clickHandler = closeOnClickOutside;

    // Delay để không trigger ngay lập tức
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);

    // Tạo Angular view
    const view = this.vcr.createEmbeddedView(this.childTableTemplate, {
      row: cell.getRow().getData(),
    });

    (childRow as any)._viewRef = view;
    view.detectChanges();

    view.rootNodes.forEach((node) => {
      childRow.appendChild(node);
    });

    // Khởi tạo Tabulator
    setTimeout(() => {
      const tabDiv = view.rootNodes.find(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          node.classList?.contains('child-tabulator')
      );

      if (tabDiv) {
        const parentRow = cell.getRow();

        // Tạo input search
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Tìm kiếm sản phẩm...';
        searchInput.style.cssText =
          'width: 100%; padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px;';
        childRow.insertBefore(searchInput, tabDiv);

        const childTable = new Tabulator(tabDiv as HTMLElement, {
          height: '300px',
          data: this.productOptions || [],
          layout: 'fitColumns',
          selectableRows: 1,
          columns: [
            {
              title: 'Mã SP',
              field: 'ProductCode',
              width: 120,
              headerSort: false,
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              width: 200,
              headerSort: false,
            },
            {
              title: 'Mã nội bộ',
              field: 'ProductCodeRTC',
              width: 120,
              headerSort: false,
            },
            {
              title: 'ĐVT',
              field: 'UnitCountName',
              width: 80,
              headerSort: false,
            },
          ],
        });

        // FIX: Lưu reference của Tabulator instance để có thể destroy sau này
        (childRow as any)._tabulatorInstance = childTable;

        // Tìm kiếm trong bảng
        searchInput.addEventListener('input', (e) => {
          const value = (e.target as HTMLInputElement).value;
          childTable.setFilter([
            [
              { field: 'ProductCode', type: 'like', value: value },
              { field: 'ProductName', type: 'like', value: value },
              { field: 'ProductCodeRTC', type: 'like', value: value },
            ],
          ]);
        });

        // Khi click chọn sản phẩm
        childTable.on('rowClick', (_e, childRow) => {
          const selectedProduct = childRow.getData() as any;

          // Fill dữ liệu vào row cha
          parentRow.update({
            ProductID: selectedProduct.ID,
            ProductCode: selectedProduct.ProductCode,
            ProductName: selectedProduct.ProductName,
            ProductCodeRTC: selectedProduct.ProductCodeRTC,
            UnitCountName: selectedProduct.UnitCountName,
            UnitCountID: selectedProduct.UnitCountID,
            Maker: selectedProduct.Maker,
            NumberInStore: selectedProduct.NumberInStore,
          });

          // Đóng popup
          const existingChild = document.body.querySelector(
            '.child-row-container[data-cell-id="' +
              cellElement.dataset['cellId'] +
              '"]'
          );
          if (existingChild) {
            // FIX: Destroy Tabulator instance trước khi remove DOM để tránh memory leak
            const tabulatorInstance = (existingChild as any)._tabulatorInstance;
            if (tabulatorInstance) {
              tabulatorInstance.destroy();
              // console.log('✅ Destroyed Tabulator instance on product select');
            }

            // FIX: Remove click event listener để tránh memory leak
            const clickHandler = (existingChild as any)._clickHandler;
            if (clickHandler) {
              document.removeEventListener('click', clickHandler);
              // console.log('✅ Removed click event listener on product select');
            }

            const viewRef = (existingChild as any)._viewRef;
            if (viewRef) {
              viewRef.destroy();
            }
            existingChild.remove();
          }
          cellElement.classList.remove('child-open');
        });
      }
    }, 0);
  }
  */

  async checkSerial(): Promise<boolean> {
    // const tableData = this.deviceTempTable?.getData() || this.selectedDevices;

    // for (const detail of tableData) {
    //   const qty = detail.Quantity || detail.Qty || 0;
    //   const detailId = detail.ID;

    //   if (!detailId || detailId <= 0) {
    //     continue;
    //   }

    //   try {
    //     const result = await this.billImportChoseSerialService
    //       .countSerialBillImportTech(detailId)
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

  // Trả về ISO string với offset múi giờ local, tránh lệch ngày khi dùng toISOString() (UTC)
  private toLocalISOString(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const tzo = -d.getTimezoneOffset();
    const sign = tzo >= 0 ? '+' : '-';
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds()) +
      sign + pad(tzo / 60) + ':' + pad(tzo % 60);
  }
}
