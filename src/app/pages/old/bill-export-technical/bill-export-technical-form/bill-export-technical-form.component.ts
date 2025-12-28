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
  TemplateRef,
  ViewContainerRef,
  ElementRef,
} from '@angular/core';
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
import { TbProductRtcFormComponent } from '../../tb-product-rtc/tb-product-rtc-form/tb-product-rtc-form.component';
import { TbProductRtcService } from '../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { BillExportTechnicalService } from '../bill-export-technical-service/bill-export-technical.service';
import { BillExportService } from '../../Sale/BillExport/bill-export-service/bill-export.service';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BillExportChoseSerialComponent } from '../bill-export-chose-serial/bill-export-chose-serial.component';
import { BillImportChoseProductFormComponent } from '../../bill-import-technical/bill-import-chose-product-form/bill-import-chose-product-form.component';
import { CustomerServiceService } from '../../customer/customer-service/customer-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AppUserService } from '../../../../services/app-user.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { TabulatorPopupService } from '../../../../shared/components/tabulator-popup';
import { forkJoin } from 'rxjs';
import { BillImportChoseSerialComponent } from '../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { BillImportChoseSerialService } from '../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.service';
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
    HasPermissionDirective,
  ],
  selector: 'app-bill-export-technical-form',
  templateUrl: './bill-export-technical-form.component.html',
  styleUrls: ['./bill-export-technical-form.component.css'],
})
export class BillExportTechnicalFormComponent implements OnInit, AfterViewInit {
  @Input() masterId!: number;
  @Input() dataEdit: any;
  @Input() dataInput: any;
  formDeviceInfo!: FormGroup;
  @Output() formSubmitted = new EventEmitter<void>();
  notification = inject(NzNotificationService);
  @Output() closeModal = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  deviceTempTable: Tabulator | null = null;
  selectedDevices: any[] = [];
  @ViewChild('childTableTemplate', { static: true })
  childTableTemplate!: TemplateRef<any>;
  @ViewChild('vcHost', { read: ViewContainerRef, static: true })
  vcr!: ViewContainerRef;
  @ViewChild('deviceTempTable', { static: false })
  deviceTempTableRef!: ElementRef;
  productOptions: any[] = [];
  productOptionsLoaded: boolean = false;
  employeesLoaded: boolean = false;
  customerList: any[] = [];
  nccList: any[] = [];
  projectList: any[] = [];
  emPloyeeLists: any[] = [];
  employeeSelectOptions: { label: string; value: number }[] = [];
  approveEmployee: any[] = [];
  IsApproved: boolean = false;
  @Input() IDDetail: number = 0;
  @Input() warehouseID: number = 0;
  @Input() warehouseType: number = 1;
  @Input() openFrmSummary: boolean = false;
  @Input() customerID: number = 0;
  @Input() deliverID: number = 0;
  @Input() supplierID: number = 0;
  @Input() BillCode: string = '';
  @Input() fromBorrowHistory: boolean = false; // Flag để phân biệt luồng từ lịch sử mượn
  title: string = 'Phiếu xuất kho';
  private ngbModal = inject(NgbModal);
  private appUserService = inject(AppUserService);
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
      title: 'Tồn kho',
      field: 'InventoryReal',
      width: 100,
      headerSort: false,
      hozAlign: 'right',
      formatter: (cell) => {
        const val = cell.getValue();
        return val !== null && val !== undefined ? val : '0';
      },
    },
  ];

  constructor(
    private billExportTechnicalService: BillExportTechnicalService,
    private billImportTechnicalService: BillImportTechnicalService,
    private billExportService: BillExportService,
    private tabulatorPopupService: TabulatorPopupService,
    private billImportChoseSerialService: BillImportChoseSerialService
  ) {}
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
  ngOnInit() {
    this.initForm();
    //this.title = this.warehouseType === 1 ? 'Phiếu xuất kho DEMO' : 'Phiếu xuất kho AGV';

    // Load tất cả dữ liệu từ API cùng lúc và đợi tất cả xong
    forkJoin({
      customer: this.billExportTechnicalService.getCustomers(
        1,
        10000,
        '',
        0,
        0
      ),
      employee: this.billExportTechnicalService.getUser(),
      ncc: this.billExportService.getCbbSupplierSale(),
      project: this.billExportTechnicalService.getProject(),
      approveEmployee: this.billImportTechnicalService.getemployee(),
    }).subscribe({
      next: (results) => {
        // Gán dữ liệu vào các list
        this.customerList = results.customer?.data?.data || [];
        this.emPloyeeLists = results.employee?.data || [];
        this.nccList = results.ncc?.data || [];
        this.projectList = results.project?.data || [];
        this.approveEmployee = results.approveEmployee?.data || [];

        // Tạo employeeSelectOptions
        this.employeeSelectOptions = this.emPloyeeLists.map((e: any) => ({
          label: e.FullName,
          value: e.ID,
        }));

        // Patch dữ liệu cơ bản
        this.formDeviceInfo.patchValue({
          Deliver: this.appUserService.fullName || 'ADMIN',
        });

        // Xử lý luồng từ check-history-tech (trả hàng từ lịch sử mượn NCC)
        if (this.openFrmSummary && this.fromBorrowHistory && !this.dataEdit) {
          // Set BillType = 0 (Trả) theo mặc định
          this.formDeviceInfo.patchValue({
            BillType: 0,
            SupplierSaleID: this.supplierID || 0,
            CustomerID: this.customerID || 0,
            DeliverID: this.deliverID || 0,
            SupplierID: this.supplierID || 0,
            Note: this.BillCode || '',
            CreatedDate: new Date(),
          });

          // Tìm và set tên NCC/Customer nếu có
          if (this.supplierID > 0) {
            const supplier = this.nccList.find(
              (n: any) => n.ID === this.supplierID
            );
            if (supplier) {
              this.formDeviceInfo.patchValue({
                SupplierName: supplier.Name || supplier.FullName || '',
              });
            }
          }

          if (this.customerID > 0) {
            const customer = this.customerList.find(
              (c: any) => c.ID === this.customerID
            );
            if (customer) {
              this.formDeviceInfo.patchValue({
                CustomerName: customer.Name || customer.FullName || '',
              });
            }
          }

          // Lấy mã phiếu mới cho loại "Trả" (BillType = 0)
          this.getNewCode();
        }

        // Patch dữ liệu edit sau khi đã load xong tất cả dropdown data
        if (this.dataEdit) {
          if (this.dataEdit.Status == 1 && !this.appUserService.isAdmin)
            this.IsApproved = true;

          this.formDeviceInfo.patchValue({
            ...this.dataEdit,
            CreatedDate: this.dataEdit.CreatedDate
              ? new Date(this.dataEdit.CreatedDate)
              : null,
            ExpectedDate: this.dataEdit.ExpectedDate
              ? new Date(this.dataEdit.ExpectedDate)
              : null,
          });

          // Disable form nếu đã được duyệt
          if (this.IsApproved) {
            this.formDeviceInfo.disable();
            // Vẽ lại bảng để disable các editor (sau khi bảng đã được vẽ trong ngAfterViewInit)
            setTimeout(() => {
              if (this.deviceTempTable) {
                const currentData = this.deviceTempTable.getData();
                this.selectedDevices = currentData;
                this.deviceTempTable.destroy();
                this.drawTableSelectedDevices();
              }
            }, 500);
          }
        } else if (this.dataInput && !this.openFrmSummary) {
          // Chỉ patch dataInput nếu không phải luồng từ check-history-tech
          this.formDeviceInfo.patchValue(this.dataInput);
        }

        if (this.warehouseID === 2)
          this.formDeviceInfo.patchValue({ Deliver: 'Nguyễn Thị Phương Thủy' });

        // Lấy mã phiếu nếu chưa có (chỉ khi tạo mới, không phải khi sửa hoặc xem)
        // Không lấy mã mới nếu đã lấy ở trên (luồng từ check-history-tech)
        if (
          (!this.dataEdit || !this.dataEdit.ID || this.dataEdit.ID <= 0) &&
          !this.masterId &&
          !this.IDDetail &&
          !this.fromBorrowHistory &&
          !this.openFrmSummary
        ) {
          this.getNewCode();
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi tải dữ liệu'
        );
      },
    });

    // Load product list (không cần đợi vì không ảnh hưởng đến form)
    this.getProductList();
  }
  ngAfterViewInit(): void {
    // Kiểm tra xem có dữ liệu detail truyền vào không
    const injectedDetails = this.dataInput?.details;

    if (Array.isArray(injectedDetails) && injectedDetails.length > 0) {
      this.selectedDevices = this.normalizeDetails(injectedDetails);
      this.drawTableSelectedDevices(); // Vẽ bảng với dữ liệu có sẵn
    } else if (this.masterId || this.IDDetail) {
      // Load chi tiết từ API nếu có masterId hoặc IDDetail
      const billID = this.masterId || this.IDDetail;

      // Xác định có cần load billMaster không:
      // - Có masterId (luồng edit từ bill-export-technical) → load billMaster
      // - Có fromBorrowHistory flag (luồng từ lịch sử mượn) → load billMaster
      // - Chỉ có IDDetail (luồng từ material-detail) → KHÔNG load billMaster
      const shouldLoadBillMaster = this.masterId > 0 || this.fromBorrowHistory;

      // Load detail trước, sau đó load master data nếu cần
      this.loadBillDetail(billID, shouldLoadBillMaster);
    } else {
      // Không có dữ liệu, vẽ bảng rỗng
      this.drawTableSelectedDevices();
    }
  }

  /**
   * Load bill detail từ API
   * @param billID - ID của phiếu xuất
   * @param shouldLoadBillMaster - Có cần load master data không
   */
  private loadBillDetail(
    billID: number,
    shouldLoadBillMaster: boolean = false
  ): void {
    this.billExportTechnicalService.getBillExportDetail(billID).subscribe({
      next: (res) => {
        // Nếu response có billMaster và chưa có dataEdit, dùng billMaster từ response
        if (res.billMaster && !this.dataEdit) {
          this.patchMasterDataToForm(res.billMaster);
        } else if (shouldLoadBillMaster && !this.dataEdit) {
          // Nếu cần load master nhưng không có trong detail response, gọi getBillExportById để lấy master data
          this.billExportTechnicalService.getBillExportById(billID).subscribe({
            next: (masterRes) => {
              // Theo API C# code: response có structure { status, data }
              const masterData = masterRes?.data || masterRes;

              if (masterData) {
                this.patchMasterDataToForm(masterData);
              }
            },
            error: (err) => {
              // Error loading master data
            },
          });
        }

        // Luôn load billDetail bất kể luồng nào
        this.selectedDevices = this.normalizeDetails(res.billDetail || []);
        this.drawTableSelectedDevices(); // Vẽ bảng sau khi load xong

        // Nếu bill đã approved, redraw table để disable editors
        if (this.IsApproved) {
          setTimeout(() => {
            if (this.deviceTempTable) {
              const currentData = this.deviceTempTable.getData();
              this.selectedDevices = currentData;
              this.deviceTempTable.destroy();
              this.drawTableSelectedDevices();
            }
          }, 700);
        }
      },
      error: (err) => {
        this.drawTableSelectedDevices(); // Vẽ bảng rỗng nếu lỗi
      },
    });
  }

  /**
   * Patch master data vào form
   */
  private patchMasterDataToForm(masterData: any): void {
    if (masterData.Status === true || masterData.Status === 1) {
      this.IsApproved = true;
    }

    // Đợi dropdown data load xong trước khi patch form
    setTimeout(() => {
      this.formDeviceInfo.patchValue({
        ID: masterData.ID || 0,
        Code: masterData.Code || '',
        BillType: masterData.BillType ?? 0,
        CustomerID: masterData.CustomerID || 0,
        Receiver: masterData.Receiver || '',
        Deliver: masterData.Deliver || '',
        Addres: masterData.Addres || masterData.Address || '',
        Status: masterData.Status,
        WarehouseType:
          masterData.WarehouseType ||
          (this.warehouseType === 1 ? 'Demo' : 'AGV'),
        Note: masterData.Note || '',
        Image: masterData.Image || '',
        ReceiverID: masterData.ReceiverID || 0,
        DeliverID: masterData.DeliverID || 0,
        SupplierID: masterData.SupplierID || 0,
        SupplierSaleID: masterData.SupplierSaleID || 0,
        CustomerName: masterData.CustomerName || '',
        SupplierName: masterData.SupplierName || '',
        CheckAddHistoryProductRTC: masterData.CheckAddHistoryProductRTC,
        ExpectedDate: masterData.ExpectedDate
          ? new Date(masterData.ExpectedDate)
          : null,
        ProjectName: masterData.ProjectName || '',
        ProjectID: masterData.ProjectID || 0,
        WarehouseID: masterData.WarehouseID || this.warehouseID,
        CreatedBy: masterData.CreatedBy || '',
        CreatedDate: masterData.CreatedDate
          ? new Date(masterData.CreatedDate)
          : null,
        UpdatedBy: masterData.UpdatedBy || '',
        UpdatedDate: masterData.UpdatedDate
          ? new Date(masterData.UpdatedDate)
          : null,
        BillDocumentExportType: masterData.BillDocumentExportType,
        ApproverID:
          masterData.ApproverID || (this.warehouseType === 2 ? 97 : 54),
        IsDeleted: masterData.IsDeleted || false,
        QRCode: masterData.QRCode || '',
      });

      // Disable form nếu đã duyệt
      if (this.IsApproved) {
        this.formDeviceInfo.disable();
      }
    }, 500);
  }

  normalizeDetails(rows: any[]): any[] {
    const byCode = (code: string) =>
      this.productOptions.find((p) => p.ProductCode === code);
    const byRTC = (rtc: string) =>
      this.productOptions.find((p) => p.ProductCodeRTC === rtc);
    return (rows || []).map((r: any, idx: number) => {
      const prod = r.ProductCode
        ? byCode(String(r.ProductCode))
        : r.ProductCodeRTC
        ? byRTC(String(r.ProductCodeRTC))
        : null;
      const productId = r.ProductID ?? prod?.ID ?? null;
      return {
        ID: r.ID ?? 0,
        STT: r.STT ?? idx + 1,
        ProductID: productId,
        ProductCode: r.ProductCode ?? prod?.ProductCode ?? '',
        ProductName: r.ProductName ?? prod?.ProductName ?? '',
        ProductCodeRTC: r.ProductCodeRTC ?? prod?.ProductCodeRTC ?? '',
        UnitName: r.UnitName ?? r.UnitCountName ?? '',
        Quantity: r.Quantity ?? r.Qty ?? 1,
        TotalQuantity: r.TotalQuantity ?? r.Qty ?? 1,
        Maker: r.Maker ?? '',
        WarehouseType: r.WarehouseType ?? '',
        Note: r.Note ?? '',
        InternalCode: r.InternalCode ?? '',
        HistoryProductRTCID: r.HistoryProductRTCID ?? 0,
        ProductRTCQRCodeID: r.ProductRTCQRCodeID ?? 0,
        PONCCDetailID: r.PONCCDetailID ?? 0,
        BillImportDetailTechnicalID: r.BillImportDetailTechnicalID ?? 0,
      };
    });
  }
  getProductList() {
    // Sử dụng API load-product
    // status: 1 = spGetProductRTC, warehouseID: 1 = spGetProductRTCQRCode, else = spGetInventoryDemo
    const status = this.formDeviceInfo.get('BillType')?.value ?? 0; // Lấy tất cả sản phẩm
    const warehouseID = this.warehouseID || 1; // Mặc định warehouse 1
    const warehouseType = this.warehouseType;
    this.billExportTechnicalService
      .loadProduct(status, warehouseID, warehouseType)
      .subscribe((response: any) => {
        if (response && response.status === 1 && response.data) {
          this.productOptions = response.data.map((p: any) => ({
            ID: status === 1 ? p.ID : p.ProductRTCID, // Nếu status != 1 thì dùng ProductRTCID
            ProductCode: p.ProductCode,
            ProductName: p.ProductName,
            ProductCodeRTC: p.ProductCodeRTC,
            Maker: p.Maker,
            UnitCountID: p.UnitCountID,
            UnitCountName: p.UnitCountName,
            NumberInStore: p.NumberInStore,
            TotalQuantityReal: p.TotalQuantityReal || 0,
            InventoryReal: p.InventoryReal || p.TotalQuantityReal || 0, // Tồn kho
            ProductRTCQRCodeID: p.ProductRTCQRCodeID || p.ID, // Lưu ProductRTCQRCodeID
            ProjectID: p.ProjectID || null, // Lưu ProjectID từ API
            ProjectName: p.ProjectName || '', // Lưu ProjectName từ API
          }));
          this.productOptionsLoaded = true;
          if (this.deviceTempTable) {
            this.deviceTempTable.setColumns(
              this.deviceTempTable.getColumnDefinitions()
            );
          }
        }
      });
  }
  // Hàm khởi tạo form
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      Code: ['', Validators.required],
      BillType: [0, Validators.required], // Mặc định là 0 (Trả)
      CustomerID: ['', Validators.required],
      Receiver: [null],
      Deliver: [
        { value: this.appUserService.fullName || 'ADMIN', disabled: false },
        Validators.required,
      ],
      Addres: [null],
      Status: [null],
      WarehouseType: [
        { value: this.warehouseType == 1 ? 'Demo' : 'AGV', disabled: false },
        Validators.required,
      ],
      Note: [null],
      Image: [null],
      ReceiverID: [null], // Chỉ required khi BillType = 1 (Cho mượn)
      DeliverID: [null],
      SupplierID: [''],
      CustomerName: [false],
      SupplierName: [''],
      CheckAddHistoryProductRTC: [null],
      ExpectedDate: [null], // Chỉ required khi BillType = 1 (Cho mượn)
      ProjectName: [''],
      ProjectID: [null],
      WarehouseID: this.warehouseID,
      CreatedBy: [''],
      CreatedDate: [null, Validators.required],
      UpdatedBy: [''],
      UpdatedDate: [null],
      SupplierSaleID: [0, Validators.required],
      BillDocumentExportType: [null],
      ApproverID: [this.warehouseType === 2 ? 97 : 54, Validators.required], //54:Phạm Văn Quyền; 97:Bùi Mạnh Cần
      IsDeleted: [false],
      QRCode: [''],
    });

    // Subscribe to BillType changes to update field visibility
    this.formDeviceInfo
      .get('BillType')
      ?.valueChanges.subscribe((billType: number) => {
        this.updateBorrowFieldsVisibility(billType);
      });
  }

  // Getter để kiểm tra xem có phải loại "Cho mượn" không
  get isBorrowType(): boolean {
    const billType = this.formDeviceInfo?.get('BillType')?.value;
    return billType === 1;
  }

  // Cập nhật visibility và validation cho các trường liên quan đến "Cho mượn"
  updateBorrowFieldsVisibility(billType: number) {
    const isBorrow = billType === 1;
    const receiverIDControl = this.formDeviceInfo.get('ReceiverID');
    const expectedDateControl = this.formDeviceInfo.get('ExpectedDate');

    if (isBorrow) {
      // Khi là "Cho mượn", set required validators
      receiverIDControl?.setValidators([Validators.required]);
      expectedDateControl?.setValidators([Validators.required]);
    } else {
      // Khi không phải "Cho mượn", clear validators và reset values
      receiverIDControl?.clearValidators();
      expectedDateControl?.clearValidators();
      receiverIDControl?.setValue(null);
      expectedDateControl?.setValue(null);
    }

    receiverIDControl?.updateValueAndValidity({ emitEvent: false });
    expectedDateControl?.updateValueAndValidity({ emitEvent: false });
  }
  //Hàm sinh code của phiếu xuất
  getNewCode() {
    const billType = this.formDeviceInfo.get('BillType')?.value ?? 0;
    this.billExportTechnicalService.getBillCode(billType).subscribe({
      next: (res: any) => {
        this.formDeviceInfo.patchValue({ Code: res.data });
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy mã phiếu'
        );
      },
    });
  }
  //Lấy thông tin khách hàng
  getCustomer() {
    this.billExportTechnicalService
      .getCustomers(1, 10000, '', 0, 0)
      .subscribe((res: any) => {
        // API returns { status, data: { data: [], data1: [], data2: [] } }
        this.customerList = res.data?.data || [];
      });
  }
  //Lấy thông tin nhà cung cấp
  getNCC() {
    // Sử dụng API endpoint mới từ BillExportService giống như các component khác
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.nccList = res.data || [];
      },
      error: (err: any) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy dữ liệu nhà cung cấp'
        );
      },
    });
  }
  //Lấy danh sách dự án
  getProject() {
    this.billExportTechnicalService.getProject().subscribe((res: any) => {
      this.projectList = res?.data || [];
    });
  }
  //Lấy danh sách nhân viên
  getListEmployee() {
    this.billExportTechnicalService.getUser().subscribe((respon: any) => {
      // API returns { status, data: [] } - using ApiResponseFactory
      this.emPloyeeLists = respon.data || [];

      this.employeeSelectOptions = this.emPloyeeLists.map((e: any) => ({
        label: e.FullName,
        value: e.ID,
      }));

      // Force update table columns to refresh employee dropdown
      if (this.deviceTempTable) {
        this.deviceTempTable.setColumns(
          this.deviceTempTable.getColumnDefinitions()
        );
      }
    });
  }
  //Lấy danh sách người duyệt
  getEmployeeApprove() {
    this.billImportTechnicalService.getemployee().subscribe((res) => {
      this.approveEmployee = res.data;
    });
  }
  //Vẽ bảng tạm để chọn sản phẩm
  drawTableSelectedDevices() {
    if (!this.deviceTempTableRef?.nativeElement) return;
    this.deviceTempTable = new Tabulator(
      this.deviceTempTableRef.nativeElement,
      {
        layout: 'fitDataStretch',
        data: this.selectedDevices,
        selectableRows: true,
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
              if (!this.IsApproved) this.addRow();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if (!this.IsApproved) cell.getRow().delete();
            },
          },
          { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 60 },
          {
            title: 'Mã sản phẩm (Theo QR)',
            field: 'ProductID',
            width: 300,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const productId = Number(cell.getValue());
              const product = this.productOptions.find(
                (p) => p.ID === productId
              );
              const productCode = product ? product.ProductCode : '';
              return `
              <button class="btn-toggle-detail w-100 h-100" title="${
                productCode || 'Chọn sản phẩm'
              }">
                <span class="product-code-text">${
                  productCode || 'Chọn SP'
                }</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
            },
            cellClick: (e, cell) => {
              if (!this.IsApproved) this.showProductPopup(cell);
            },
          },
          { title: 'Mã sản phẩm', field: 'ProductCode', visible: false },
          { title: 'Mã nội bộ', field: 'ProductCodeRTC' },
          { title: 'Tên sản phẩm', field: 'ProductName', width: 300 },
          { title: 'DVT', field: 'UnitCountName' },
          {
            title: 'Số lượng xuất',
            field: 'Quantity',
            editor: this.IsApproved ? undefined : 'number',
            editorParams: {
              min: 0,
              step: 1,
              selectContents: true,
            },
          },
          { title: 'Hãng', field: 'Maker' },
          {
            title: 'Mã dự án',
            field: 'ProjectID',
            width: 200,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const projectId = Number(cell.getValue());
              const project = this.projectList.find(
                (p: any) => p.ID === projectId
              );
              const projectCode = project ? project.ProjectCode || '' : '';
              return `
              <button class="btn-toggle-detail w-100 h-100" title="${
                projectCode || 'Chọn dự án'
              }">
                <span class="product-code-text">${
                  projectCode || 'Chọn DA'
                }</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
            },
            cellClick: (e, cell) => {
              if (!this.IsApproved) this.toggleProjectTable(cell);
            },
          },
          { title: 'Tên dự án', field: 'ProjectName', width: 300 },

          {
            title: 'Ghi chú',
            field: 'Note',
            editor: this.IsApproved ? undefined : 'input',
            width: 300,
          },
          // { title: "Serial IDs", field: "SerialIDs" },
          // { title: "UnitCountID", field: "UnitCountID" },
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
              if (this.IsApproved) return;
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
                  this.billExportTechnicalService.getSerialByID(id).subscribe({
                    next: (res) => {
                      if (res?.status === 1 && res.data) {
                        existingSerials.push({
                          ID: res.data.ID,
                          Serial:
                            res.data.SerialNumber || res.data.Serial || '',
                        });
                      }
                    },
                    error: (err) => {
                      // Error loading serial
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
      }
    );
  }
  onProductSelected(cell: CellComponent) {
    const productId = Number(cell.getValue());
    const product = this.productOptions.find((p) => p.ID === productId);
    if (!product) return;
    const row = cell.getRow();
    row.update({
      ProductCode: product.ProductCode,
      ProductName: product.ProductName,
      ProductCodeRTC: product.ProductCodeRTC,
      UnitCountName: product.UnitCountName,
      UnitCountID: product.UnitCountID,
      Maker: product.Maker,
    });
  }

  // Toggle popup table cho chọn dự án
  toggleProjectTable(cell: any) {
    const cellElement = cell.getElement();

    // Nếu đang mở → đóng lại và cleanup
    if (cellElement.classList.contains('child-open')) {
      const existingChild = document.body.querySelector(
        '.child-row-container[data-cell-id="' +
          cellElement.dataset['cellId'] +
          '"]'
      );
      if (existingChild) {
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

    // Responsive: điều chỉnh width cho màn hình nhỏ
    if (window.innerWidth < 768) {
      childRow.style.minWidth = '90vw';
      childRow.style.maxWidth = '90vw';
      childRow.style.left = '5vw';
    }

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
          const viewRef = (existingChild as any)._viewRef;
          if (viewRef) {
            viewRef.destroy();
          }
          existingChild.remove();
        }
        cellElement.classList.remove('child-open');
        document.removeEventListener('click', closeOnClickOutside);
      }
    };

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
        searchInput.placeholder = 'Tìm kiếm dự án...';
        searchInput.style.cssText =
          'width: 100%; padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px;';
        childRow.insertBefore(searchInput, tabDiv);

        const childTable = new Tabulator(tabDiv as HTMLElement, {
          height: '300px',
          data: this.projectList || [],
          layout: 'fitDataStretch',
          selectableRows: 1,
          columns: [
            {
              title: 'Mã dự án',
              field: 'ProjectCode',
              width: 150,
              headerSort: false,
            },
            {
              title: 'Tên dự án',
              field: 'ProjectName',
              width: 250,
              headerSort: false,
              formatter: (cell) => {
                const data = cell.getData() as any;
                return data.ProjectName || data.Name || '';
              },
            },
          ],
        });

        searchInput.addEventListener('input', (e) => {
          const value = (e.target as HTMLInputElement).value;
          childTable.setFilter([
            [
              { field: 'ProjectCode', type: 'like', value: value },
              { field: 'ProjectName', type: 'like', value: value },
            ],
          ]);
        });

        childTable.on('rowClick', (_e, childRow) => {
          const selectedProject = childRow.getData() as any;

          // Update parent row với ProjectID và ProjectName
          parentRow.update({
            ProjectID: selectedProject.ID,
            ProjectName:
              selectedProject.ProjectName || selectedProject.Name || '',
          });

          const existingChild = document.body.querySelector(
            '.child-row-container[data-cell-id="' +
              cellElement.dataset['cellId'] +
              '"]'
          );
          if (existingChild) {
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

  // REFACTOR: Hàm mới thay thế toggleProductTable - sử dụng TabulatorPopupService
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
          const parentRow = cell.getRow();
          const selectedProductRTCQRCodeID = selectedProduct.ProductRTCQRCodeID;

          // Chỉ kiểm tra duplicate nếu ProductRTCQRCodeID có giá trị
          if (selectedProductRTCQRCodeID) {
            const currentRowIndex = parentRow.getPosition();
            const allRows = this.deviceTempTable?.getData() || [];

            // Kiểm tra duplicate ProductRTCQRCodeID (chỉ so sánh với các row khác, không phải row hiện tại)
            for (let i = 0; i < allRows.length; i++) {
              // Bỏ qua row hiện tại
              if (i === currentRowIndex) continue;

              const row = allRows[i];
              // Chỉ kiểm tra nếu row có ProductRTCQRCodeID và trùng với sản phẩm đang chọn
              if (
                row.ProductRTCQRCodeID &&
                row.ProductRTCQRCodeID === selectedProductRTCQRCodeID
              ) {
                this.notification.warning(
                  NOTIFICATION_TITLE.warning,
                  `Sản phẩm "${selectedProduct.ProductCode}" đã được chọn. Vui lòng chọn sản phẩm khác.`
                );
                return; // Không cho chọn
              }
            }
          }

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
            Quantity: 1,
            ProductRTCQRCodeID: selectedProductRTCQRCodeID,
          });

          // Đóng popup
          this.tabulatorPopupService.close();

          // Focus vào cell Quantity sau khi chọn sản phẩm
          setTimeout(() => {
            const quantityCell = parentRow.getCell('Quantity');
            if (quantityCell) {
              quantityCell.edit();
            }
          }, 100);
        },
        onClosed: () => {
          // Optional: xử lý khi popup đóng
        },
      },
      cellElement
    );
  }

  // Toggle popup table cho chọn sản phẩm (DEPRECATED - giữ lại để tham khảo)
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

    // Responsive: điều chỉnh width cho màn hình nhỏ
    if (window.innerWidth < 768) {
      childRow.style.minWidth = '90vw';
      childRow.style.maxWidth = '90vw';
      childRow.style.left = '5vw';
    }

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
          const viewRef = (existingChild as any)._viewRef;
          if (viewRef) {
            viewRef.destroy();
          }
          existingChild.remove();
        }
        cellElement.classList.remove('child-open');
        document.removeEventListener('click', closeOnClickOutside);
      }
    };

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
              title: 'Mã QRCode',
              field: 'ProductCode',
              width: 120,
              headerSort: false,
            },
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
            {
              title: 'SL trong kho',
              field: 'TotalQuantityReal',
              width: 80,
              headerSort: false,
            },
          ],
        });

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

        childTable.on('rowClick', (_e, childRow) => {
          const selectedProduct = childRow.getData() as any;
          const selectedProductRTCQRCodeID = selectedProduct.ProductRTCQRCodeID;

          const currentRowIndex = parentRow.getPosition();
          const allRows = this.deviceTempTable?.getData() || [];

          for (let i = 0; i < allRows.length; i++) {
            if (i !== currentRowIndex) {
              if (
                allRows[i].ProductRTCQRCodeID === selectedProductRTCQRCodeID
              ) {
                this.notification.warning(
                  NOTIFICATION_TITLE.warning,
                  `Sản phẩm "${selectedProduct.ProductCode}" đã được chọn. Vui lòng chọn sản phẩm khác.`
                );
                return; // Không cho chọn
              }
            }
          }

          parentRow.update({
            ProductID: selectedProduct.ID,
            ProductCode: selectedProduct.ProductCode,
            ProductName: selectedProduct.ProductName,
            ProductCodeRTC: selectedProduct.ProductCodeRTC,
            UnitCountName: selectedProduct.UnitCountName,
            UnitCountID: selectedProduct.UnitCountID,
            Maker: selectedProduct.Maker,
            NumberInStore: selectedProduct.NumberInStore,
            Quantity: 1,
            ProductRTCQRCodeID: selectedProductRTCQRCodeID, // Lưu ProductRTCQRCodeID
          });

          const existingChild = document.body.querySelector(
            '.child-row-container[data-cell-id="' +
              cellElement.dataset['cellId'] +
              '"]'
          );
          if (existingChild) {
            const viewRef = (existingChild as any)._viewRef;
            if (viewRef) {
              viewRef.destroy();
            }
            existingChild.remove();
          }
          cellElement.classList.remove('child-open');

          setTimeout(() => {
            const quantityCell = parentRow.getCell('Quantity');
            if (quantityCell) {
              quantityCell.edit();
            }
          }, 100);
        });
      }
    }, 0);
  }
  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    const modalRef = this.ngbModal.open(BillImportChoseSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.dataBillDetail = rowData;
    modalRef.componentInstance.type = 2;
    modalRef.componentInstance.isTechBill = true;
    modalRef.componentInstance.warehouseId = this.warehouseID;
    modalRef.result
      .then((serials: { ID: number; Serial: string }[]) => {
        const newSerial = serials.map((s) => s.Serial).join(', ');
        const serialIDs = serials.map((s) => s.ID).join(', ');
        rowData['Serial'] = newSerial;
        rowData['SerialIDs'] = serialIDs;
        row.update(rowData);
      })
      .catch(() => {});
  }
  // Mở modal chọn sản phẩm
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

  // INTEGRATION: Mở modal lịch sử mượn
  async openBorrowHistory() {
    // Dynamic import để tránh circular dependency
    const { BorrowProductHistoryComponent } = await import(
      '../../inventory-demo/borrow/borrow-product-history/borrow-product-history.component'
    );

    const modalRef = this.ngbModal.open(BorrowProductHistoryComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen',
    });

    // Set isModalMode = true để hiển thị nút Xuất
    modalRef.componentInstance.isModalMode = true;
    modalRef.componentInstance.warehouseType = this.warehouseType;

    // FIX: Chỉ dùng modalRef.result, không dùng productsExported.subscribe
    // để tránh xử lý data 2 lần (gây ra duplicate rows)
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

    // Map dữ liệu từ history sang format của bill export
    const mappedProducts = products.map((product, idx) => {
      // Tìm sản phẩm từ productOptions để lấy thông tin đầy đủ
      const productInfo = this.productOptions.find(
        (p) =>
          p.ProductCode === product.ProductCode ||
          p.ProductCodeRTC === product.ProductCodeRTC
      );

      return {
        ID: 0,
        STT: this.selectedDevices.length + idx + 1,
        ProductID: productInfo?.ID || product.ProductRTCID || 0,
        ProductCode: product.ProductCode || productInfo?.ProductCode || '',
        ProductName: product.ProductName || productInfo?.ProductName || '',
        ProductCodeRTC:
          product.ProductCodeRTC || productInfo?.ProductCodeRTC || '',
        UnitName: product.UnitCountName || productInfo?.UnitCountName || '',
        UnitCountName:
          product.UnitCountName || productInfo?.UnitCountName || '',
        UnitCountID: product.UnitCountID || productInfo?.UnitCountID || 0,
        Quantity: product.NumberBorrow || 1,
        TotalQuantity: product.NumberBorrow || 1,
        Maker: product.Maker || productInfo?.Maker || '',
        WarehouseType: this.warehouseType,
        Note: product.Note || '',
        InternalCode: product.InternalCode || '',
        HistoryProductRTCID: product.ID || 0,
        ProductRTCQRCodeID:
          product.ProductRTCQRCodeID || productInfo?.ProductRTCQRCodeID || 0,
        PONCCDetailID: 0,
        BillImportDetailTechnicalID: 0,
        ProjectID: product.ProjectID || 0,
        ProjectName: product.Project || '',
      };
    });

    // Thêm vào selectedDevices
    this.selectedDevices = [...this.selectedDevices, ...mappedProducts];

    // Refresh table
    if (this.deviceTempTable) {
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }
  // Thêm dòng trống vào bảng
  addRow() {
    if (this.deviceTempTable) {
      const newRow = {
        ProductCode: '',
        ProductName: '',
        Quantity: 1,

        Note: '',
      };
      this.selectedDevices.push(newRow);
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }
  // mở modal thêm sản phẩm
  openModalAddProduct() {
    const modalRef = this.ngbModal.open(TbProductRtcFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
  }
  onReceiverChange(selectedId: number) {
    const selected = this.emPloyeeLists.find((e) => e.ID === selectedId);
    if (selected) {
      this.formDeviceInfo.patchValue({
        ReceiverName: selected.FullName,
      });
    }
  }
  getReceiverNameById(id: number): string {
    const emp = this.emPloyeeLists.find((e) => e.ID === id);
    return emp ? emp.FullName : '';
  }
  onProjectChange(selectedId: number) {
    const selected = this.projectList.find((p: any) => p.ID === selectedId);
    if (selected) {
      this.formDeviceInfo.patchValue({
        ProjectName: selected.ProjectName || selected.Name || '',
      });
    }
  }
  onBillTypeChange(billType: number) {
    const expectedDateControl = this.formDeviceInfo.get('ExpectedDate');
    const receiverIDControl = this.formDeviceInfo.get('ReceiverID');

    if (billType === 1) {
      expectedDateControl?.setValidators([Validators.required]);
      receiverIDControl?.setValidators([Validators.required]);
    } else {
      expectedDateControl?.clearValidators();
      receiverIDControl?.clearValidators();
    }
    expectedDateControl?.updateValueAndValidity();
    receiverIDControl?.updateValueAndValidity();
    // Chỉ lấy mã mới khi tạo mới, không phải khi sửa
    if (!this.dataEdit || !this.dataEdit.ID || this.dataEdit.ID <= 0) {
      this.billExportTechnicalService.getBillCode(billType).subscribe({
        next: (res: any) => {
          this.formDeviceInfo.patchValue({ Code: res.data });
        },
        error: (err: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lấy mã phiếu'
          );
        },
      });
    }
  }
  async saveData() {
    const isValid = await this.checkSerial();
    if (!isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Số lượng serial không khớp với số lượng yêu cầu, vui lòng kiểm tra lại'
      );
      return;
    }

    // Sử dụng getRawValue() để lấy giá trị của các trường disabled (như Code)
    const formValue = this.formDeviceInfo.getRawValue();
    const isBorrow = formValue.BillType === 1;
    const expectedDateControl = this.formDeviceInfo.get('ExpectedDate');
    const receiverIDControl = this.formDeviceInfo.get('ReceiverID');

    if (isBorrow) {
      expectedDateControl?.setValidators([Validators.required]);
      receiverIDControl?.setValidators([Validators.required]);
    } else {
      expectedDateControl?.clearValidators();
      receiverIDControl?.clearValidators();
    }
    expectedDateControl?.updateValueAndValidity();
    receiverIDControl?.updateValueAndValidity();

    // 1. Validate form
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

    // Lấy dữ liệu trực tiếp từ bảng Tabulator để đảm bảo có dữ liệu mới nhất (bao gồm ProjectID)
    const tableData = this.deviceTempTable?.getData() || this.selectedDevices;

    // 2. Validate chi tiết phiếu
    if (!tableData || tableData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất 1 sản phẩm vào phiếu xuất'
      );
      return;
    }

    // 3. Validate từng dòng sản phẩm
    const invalidRows: number[] = [];
    tableData.forEach((device: any, index: number) => {
      if (!device.ProductID || device.ProductID <= 0) {
        invalidRows.push(index + 1);
      }
      if (!device.Quantity || device.Quantity <= 0) {
        invalidRows.push(index + 1);
      }
    });

    if (invalidRows.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng kiểm tra lại thông tin sản phẩm tại dòng: ${[
          ...new Set(invalidRows),
        ].join(', ')}`
      );
      return;
    }

    // 4. Validate ngày tháng
    const createdDate = this.formDeviceInfo.get('CreatedDate')?.value;
    const expectedDate = this.formDeviceInfo.get('ExpectedDate')?.value;

    // Chỉ validate ngày dự kiến trả và người mượn khi loại phiếu là "Cho mượn" (BillType = 1)
    if (isBorrow) {
      if (!formValue.ReceiverID) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn người mượn cho phiếu mượn'
        );
        return;
      }
      if (!expectedDate) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng nhập ngày dự kiến trả cho phiếu mượn'
        );
        return;
      }
      if (createdDate && new Date(expectedDate) < new Date(createdDate)) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Ngày dự kiến trả không được nhỏ hơn ngày xuất'
        );
        return;
      }
    }

    // Format date sang ISO string cho backend
    const formatDate = (date: any) => {
      if (!date) return null;
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return null;
        // ASP.NET Core thường chấp nhận ISO 8601
        return d.toISOString();
      } catch (e) {
        return null;
      }
    };

    const payload: any = {
      billExportTechnical: {
        ID: formValue.ID || 0,
        Code: formValue.Code || 0,
        ReceiverID: formValue.ReceiverID || 0,
        Deliver: formValue.Deliver || '',
        SupplierSaleID: formValue.SupplierSaleID || 0,
        ProjectID: 0,
        ProjectName: formValue.ProjectName || '',
        CustomerID: formValue.CustomerID || 0,
        ApproverID: formValue.ApproverID || 0,
        WarehouseType: formValue.WarehouseType || '',
        CreatedDate: formatDate(formValue.CreatedDate),
        ExpectedDate: isBorrow ? formatDate(formValue.ExpectedDate) : null, // Chỉ gửi khi là phiếu mượn
        BillType: formValue.BillType,
        Status: formValue.Status ?? (isBorrow ? 1 : 0), // Lấy Status từ form, nếu không có thì mặc định theo BillType
        Addres: '',
        Note: '',
        Image: '',
        Receiver: this.getReceiverNameById(formValue.ReceiverID),
        DeliverID: 0,
        SupplierID: 0,
        CustomerNam: '',
        SupplierName: '',
        CheckAddHistoryProductRTC: isBorrow,
        WarehouseTypeBill: this.warehouseType,
        WarehouseID: this.warehouseID,
      },
      billExportDetailTechnicals: tableData.map(
        (device: any, index: number) => ({
          ID: 0,
          STT: index + 1,
          UnitID: device.UnitCountID || 0,
          UnitName: device.UnitCountName || '',
          ProjectID: device.ProjectID || 0,
          ProductID: device.ProductID || 0,
          Quantity: device.Quantity || 1,
          Note: device.Note || '',
          WarehouseID: 1,
          TotalQuantity: device.Quantity || 0,
          BillImportDetailTechnicalID: device.BillImportDetailTechnicalID || 0,
        })
      ),
      billExportTechDetailSerials: tableData.flatMap((device: any) => {
        const detailID = device.ID || 0;
        const serialIDs = (device.SerialIDs || '')
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id) && id > 0);

        return serialIDs.map((serialID: number) => ({
          BillExportDetailID: detailID,
          ID: serialID,
        }));
      }),
    };

    this.billExportTechnicalService.saveData(payload).subscribe({
      next: (response: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu phiếu thành công'
        );
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể lưu phiếu, vui lòng thử lại sau'
        );
      },
    });
  }

  async checkSerial(): Promise<boolean> {
    const tableData = this.deviceTempTable?.getData() || this.selectedDevices;

    for (const detail of tableData) {
      const qty = detail.Quantity || detail.Qty || 0;
      const detailId = detail.ID;

      if (!detailId || detailId <= 0) {
        continue;
      }

      try {
        const result = await this.billImportChoseSerialService
          .countSerialBillExportTech(detailId)
          .toPromise();

        if (qty < (result?.data || 0)) {
          return false;
        }
      } catch (error) {
        console.error('Lỗi check serial', detailId, error);
        return false;
      }
    }

    return true;
  }
}
