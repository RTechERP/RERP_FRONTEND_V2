import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TableModule as PrimeTableModule } from 'primeng/table';
import { ButtonModule as PrimeButtonModule } from 'primeng/button';
import { SelectModule as PrimeSelectModule } from 'primeng/select';
import { InputTextModule as PrimeInputTextModule } from 'primeng/inputtext';

import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { RequestInvoiceDetailService } from './request-invoice-detail-service/request-invoice-detail-service.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { RequestInvoiceService } from '../request-invoice/request-invoice-service/request-invoice-service.service';
import { AppUserService } from '../../../services/app-user.service';
@Component({
  selector: 'app-request-invoice-detail-new-primeng',
  templateUrl: './request-invoice-detail-new-primeng.component.html',
  styleUrls: ['./request-invoice-detail-new-primeng.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzDatePickerModule,
    NzCardModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzAutocompleteModule,
    NzUploadModule,
    NzInputNumberModule,
    NzModalModule,
    NzSwitchModule,
    NzTabsModule,
    NzDropDownModule,
    NzFormModule,
    NzSpinModule,
    PrimeTableModule,
    PrimeButtonModule,
    PrimeSelectModule,
    PrimeInputTextModule,
  ],
  standalone: true,
})
export class RequestInvoiceDetailNewPrimengComponent implements OnInit {
  // Input properties để nhận dữ liệu từ parent component
  @Input() selectedRowsData: any[] = [];
  @Input() customerID: number = 0;
  @Input() customerName: string = '';
  @Input() isFromPOKH: boolean = false;
  @Input() selectedId = 0;
  @Input() groupedData: any[] = [];
  @Input() isEditMode: boolean = false;
  @Input() isReadOnlyMode: boolean = false;
  @Input() isHeaderReadOnly: boolean = false;
  @Input() canDelete: boolean = false;
  @Input() POKHID: number = 0;

  //Form data
  formData: any = this.getDefaultFormData();

  //Data arrays
  deletedRequestInvoiceDetailIds: number[] = [];
  customers: any[] = [];
  accountingContractTypeOptions: any[] = [];
  projects: any[] = [];
  employees: any[] = [];
  taxCompanies: any[] = [];
  products: any[] = [];
  files: any[] = [];
  contractFiles: any[] = []; // File Hợp đồng (FileType = 2)
  POFiles: any[] = [];
  deletedFileIds: number[] = [];
  deletedContractFileIds: number[] = []; // IDs của File Hợp đồng đã xóa
  details: any[] = [];
  isLoading: boolean = true;
  selectedInvoiceFile: any = null;
  selectedContractFile: any = null; // File Hợp đồng đang chọn
  selectedPOFile: any = null;
  selectedDetailRows: any[] = [];
  productOptions: any[] = [];
  productEditorOptions: any[] = [];
  projectOptions: any[] = [];
  private readonly productEditorOptionLimit = 80;
  private detailRowKeySequence = 0;
  private invoiceFileKeySequence = 0;
  private poFileKeySequence = 0;
  private contractFileKeySequence = 0;
  statuses: any[] = [
    { value: 1, label: 'Yêu cầu xuất hóa đơn' },
    { value: 2, label: 'Đã xuất nháp' },
    { value: 3, label: 'Đã phát hành hóa đơn' },
  ];
  taxCompanyOptions: any[] = [
    { value: 1, label: 'RTC' },
    { value: 2, label: 'APR' },
    { value: 3, label: 'MVI' },
    { value: 4, label: 'Yonko' },
    { value: 5, label: 'R-Tech' },
  ];

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private viewPokhService: ViewPokhService,
    private RIDService: RequestInvoiceDetailService,
    private modal: NzModalService,
    private requestInvoiceService: RequestInvoiceService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.formData = this.getDefaultFormData();
    this.loadCustomer();
    this.loadAccountingContractType();
    this.loadEmployee();
    this.loadProductSale();
    this.loadPOKHFile();
    this.loadProject();

    // Xử lý dữ liệu khi ở chế độ edit
    if (this.isEditMode && this.groupedData.length > 0) {
      this.handleEditModeData();
    }

    // Chỉ tạo số phiếu mới khi không ở chế độ edit
    if (!this.isEditMode) {
      this.generateBillNumber(0);
    }
  }

  ngAfterViewInit(): void {
    this.updateDataTable();
    // Cập nhật dữ liệu bảng nếu có dữ liệu từ POKH


    // Cập nhật dữ liệu bảng nếu ở chế độ edit

  }

  //#region Load dữ liệu từ API
  loadCustomer(): void {
    this.viewPokhService.loadCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;

          // Xử lý dữ liệu từ POKH sau khi customers đã được load
          if (this.isFromPOKH && this.selectedRowsData.length > 0) {
            this.handlePOKHData();
          }
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải khách hàng',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }

  loadAccountingContractType(): void {
    this.RIDService.getAccountingContractType().subscribe(
      (response) => {
        if (response.status === 1) {
          this.accountingContractTypeOptions = response.data;

        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải loại HĐ',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }

  loadPOKHFile(): void {
    this.requestInvoiceService.getPOKHFile(this.POKHID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.POFiles = this.normalizePOFiles(response.data || []);
          this.selectedPOFile = null;
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải tệp POKH',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }

  loadProject(): void {
    this.RIDService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data;
          this.projectOptions = this.projects.map((project) => ({
            label: project.ProjectName,
            value: project.ID,
          }));
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải dự án',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }
  loadProductSale(): void {
    this.isLoading = true;
    this.RIDService.loadProductSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.products = response.data;
          this.productOptions = this.getLimitedProductOptions();
          this.productEditorOptions = [...this.productOptions];
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải sản phẩm',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
        this.isLoading = false;
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isLoading = false;
      }
    );
  }
  loadEmployee(): void {
    this.RIDService.loadEmployee().subscribe(
      (response) => {
        if (response.status === 1) {
          this.employees = response.data;
          if (!this.isEditMode) {
            const currentUser = this.employees.find(e => e.UserID === this.appUserService.id);
            if (currentUser) {
              this.formData.userId = currentUser.ID;
            }
          }
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tải danh sách nhân viên',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }
  generateBillNumber(requestInvoiceId: number): void {
    this.RIDService.generateBillNumber(requestInvoiceId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.formData.Code = response.data;
          this.notification.success('Thành công', 'Tạo số phiếu thành công!');
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Lỗi khi tạo số phiếu',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    );
  }
  //#endregion

  onCustomerChange(customerId: number): void {
    const customer = this.customers.find((c) => c.ID === customerId);
    if (customer) {
      this.formData.customerCode = customer.Code;
      this.formData.address = customer.Address;
    }
  }

  onUrgencyChange(): void {
    if (!this.formData.isUrgency) {
      // Nếu tắt checkbox "Cần gấp" thì đặt deadline về rỗng
      this.formData.deadline = null;
    }
  }

  saveAndClose(): void {
    // Validate header fields (chỉ khi không phải read-only mode)
    if (!this.isReadOnlyMode) {
      if (!this.formData.taxCompanyId) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Công ty bán');
        return;
      }
      if (!this.formData.customerId) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Khách hàng');
        return;
      }
      if (!this.formData.userId) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Người yêu cầu');
        return;
      }
      if (!this.formData.requestDate) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Ngày yêu cầu');
        return;
      }
      if (!this.formData.exportDate) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Ngày xuất');
        return;
      }
      if (!this.formData.accountingContractType) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Loại hợp đồng');
        return;
      }

      const requiredContractTypeIds = [2, 3, 15];
      if (requiredContractTypeIds.includes(this.formData.accountingContractType)) {
        if (!this.contractFiles || this.contractFiles.length === 0) {
          this.notification.warning('Thông báo', 'Vui lòng đính kèm file hợp đồng cho loại hợp đồng này');
          return;
        }
      }

      if (!this.formData.status) {
        this.notification.warning('Thông báo', 'Vui lòng chọn Trạng thái');
        return;
      }
      if (!this.validateDetails()) {
        return;
      }
    }

    const requestInvoices = {
      ID: this.selectedId || 0,
      Code: this.formData.Code,
      DateRequest: this.formData.requestDate,
      CustomerID: this.formData.customerId,
      TaxCompanyID: this.formData.taxCompanyId,
      EmployeeRequestID: this.formData.userId,
      Status: this.formData.status,
      Note: this.formData.note,
      IsUrgency: this.formData.isUrgency,
      IsCustomsDeclared: this.formData.isCustomsDeclared,
      DealineUrgency: this.formData.deadline,
      AccountingContractTypeID: this.formData.accountingContractType,
      UpdatedDate: this.toLocalISOString(new Date()),
    };

    const requestInvoiceDetails = this.details.map((item) => {
      const { __rowKey, ...detail } = item;
      return {
        ...detail,
        ProductSaleID: item.ProductSaleID === '' ? null : item.ProductSaleID,
        ProjectID: item.ProjectID === '' ? null : item.ProjectID,
        InvoiceDate: item.InvoiceDate || null,
        ExportDate: item.ExportDate || null,
        UpdatedDate: this.toLocalISOString(new Date()),
      };
    });

    const payload = {
      RequestInvoices: requestInvoices,
      RequestInvoiceDetails: requestInvoiceDetails,
      DeletedDetailIds: this.deletedRequestInvoiceDetailIds,
      AddedInvoiceFiles: this.files
        .filter((file: any) => file.file)
        .map((file: any) => file.file),
      AddedContractFiles: this.contractFiles
        .filter((file: any) => file.file)
        .map((file: any) => file.file),
      DeletedInvoiceFileIds: this.deletedFileIds,
      DeletedContractFileIds: this.deletedContractFileIds,
    };

    this.RIDService.saveData(payload).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.handleSuccess(response);
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Không thể lưu dữ liệu!',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }
  /**
   * Validate
   */
  validateDetails(): boolean {
    if (this.isReadOnlyMode) {
      return true;
    }
    const currentData = this.details;
    for (let i = 0; i < currentData.length; i++) {
      const row = currentData[i];
      const isStock = !!row.IsStock;
      const billCode = row.BillImportCode ? row.BillImportCode.toString() : '';
      const productNewCode = row.ProductNewCode || '';
      const stt = row.STT || (i + 1);
      if (!isStock) {
        const someBill = row.SomeBill || '';
        const productName = row.ProductName || '';
        if (!someBill || someBill.trim() === '') {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
            NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
            `Vì không là hàng lấy từ Tồn kho, bắt buộc phải có Hóa đơn đầu vào cho mã sản phẩm ${productNewCode} - STT: ${stt}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
          return false;
        }
      } else if (billCode && billCode.trim() !== '') {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
          NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
          `Bạn không thể chọn Tồn kho vì đã có Phiếu nhập kho [${billCode}] cho mã sản phẩm ${productNewCode} - STT: ${stt}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        return false;
      }
    }
    return true;
  }

  handleAddFileOnlySave(): void {
    const payload = {
      RequestInvoices: {
        ID: this.selectedId || 0,
      },
      RequestInvoiceDetails: [],
      DeletedDetailIds: [],
      AddedInvoiceFiles: this.files
        .filter((file: any) => file.file)
        .map((file: any) => file.file),
      AddedContractFiles: this.contractFiles
        .filter((file: any) => file.file)
        .map((file: any) => file.file),
      DeletedInvoiceFileIds: this.deletedFileIds,
      DeletedContractFileIds: this.deletedContractFileIds,
    };

    this.RIDService.saveData(payload).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu file đính kèm thành công');
          this.activeModal.close({
            success: true,
            reloadData: true,
            data: response.data,
          });
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[response.status] || 'error',
            NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Lỗi',
            response.message || 'Không thể lưu file đính kèm!',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  handleSuccess(response: any) {
    const ID = response.data.id;
    if (this.files.length > 0 || this.deletedFileIds.length > 0) {
      this.uploadFiles(ID);
    }
    if (this.contractFiles.length > 0 || this.deletedContractFileIds.length > 0) {
      this.uploadContractFiles(ID);
    }
    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công');
    this.selectedId = 0;
    this.activeModal.close({
      success: true,
      reloadData: true,
      data: response.data,
    });
  }
  // uploadFiles(RIID: number) {
  //   const formData = new FormData();

  //   // Thêm từng file vào FormData
  //   this.files.forEach((fileObj: any) => {
  //     if (fileObj.file) {
  //       formData.append('files', fileObj.file);
  //     }
  //   });

  //   // Xử lý upload files mới
  //   if (this.files.length > 0) {
  //     this.RIDService.uploadFiles(formData, RIID, 1).subscribe({
  //       next: (response) => {
  //         console.log('Upload files thành công');
  //       },
  //       error: (error) => {
  //         this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi upload files: ' + error);
  //       },
  //     });
  //   }

  //   // Xử lý xóa files
  //   if (this.deletedFileIds.length > 0) {
  //     this.RIDService.deleteFiles(this.deletedFileIds).subscribe({
  //       next: (response) => {
  //         this.deletedFileIds = [];
  //       },
  //       error: (error) => {
  //         this.notification.error('Lỗi xóa files:', error);
  //       },
  //     });
  //   }
  // }


  //#region : Hàm xử lý upload files
  uploadFiles(RIID: number) {
    // Lọc ra các file mới có thuộc tính file (giống cách làm bên TrainingRegistration)
    const newFiles = this.files.filter(
      (fileObj: any) => fileObj.file
    );
    const hasDeletedFiles = this.deletedFileIds.length > 0;

    // Nếu không có file mới và không có file bị xóa thì không gọi API
    if (newFiles.length === 0 && !hasDeletedFiles) {
      return;
    }

    if (newFiles.length > 0) {
      const formData = new FormData();

      // Thêm từng file mới vào FormData
      newFiles.forEach((fileObj: any) => {
        formData.append('files', fileObj.file);
      });

      // key: để backend nhận biết loại tài liệu
      formData.append('key', 'RequestInvoiceFile');

      // Lấy thông tin RequestInvoice để tạo subPath, sau đó mới gọi upload
      this.requestInvoiceService.getRequestInvoiceById(RIID).subscribe((data: any) => {
        const requestInvoice = data;

        const createdDate = new Date(requestInvoice.data.CreatedDate);
        const year = createdDate.getFullYear().toString();
        const month = ('0' + (createdDate.getMonth() + 1)).slice(-2);
        const code = requestInvoice.data.Code || '';

        const sanitize = (s: string) =>
          s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();

        const subPath = [
          sanitize(year),
          `T${sanitize(month)}`,
          sanitize(code)
        ].join('/');

        formData.append('subPath', subPath);

        // ✅ Gọi API upload SAU KHI đã append subPath vào formData
        this.RIDService.uploadFiles(formData, RIID, 1).subscribe({
          next: (response) => {
            if (response.status === 1) {
              const uploadedFiles = response.data as any[];
              const totalRequested = newFiles.length;
              const totalUploaded = uploadedFiles.length;

              if (totalUploaded === totalRequested) {
                this.notification.success('Thông báo', `${totalUploaded} file đã được upload thành công!`);
              } else {
                this.notification.warning('Thông báo', `${totalUploaded}/${totalRequested} file upload thành công, ${totalRequested - totalUploaded} file thất bại.`);
              }

              // Cập nhật lại danh sách file với ServerPath trả về từ server
              this.files = [
                ...this.files.filter((f: any) => !f.file),
                ...uploadedFiles.map((f: any) => ({
                  fileName: f.FileName,
                  ServerPath: f.ServerPath,
                  ID: f.ID,
                  IsDeleted: false,
                }))
              ];
              this.files = this.normalizeInvoiceFiles(this.files);
            } else {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[response.status] || 'error',
                NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Thông báo',
                response.message || 'Upload file thất bại!',
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
            }
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Thông báo',
              err?.error?.message || `${err.error}\n${err.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              }
            );
          },
        });
      });
    }

    // Xử lý xóa files
    if (hasDeletedFiles) {
      this.RIDService.deleteFiles(this.deletedFileIds).subscribe({
        next: () => {
          this.deletedFileIds = [];
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Thông báo',
            err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        },
      });
    }
  }

  uploadContractFiles(RIID: number) {
    const newFiles = this.contractFiles.filter(
      (fileObj: any) => fileObj.file
    );
    const hasDeletedFiles = this.deletedContractFileIds.length > 0;

    if (newFiles.length === 0 && !hasDeletedFiles) {
      return;
    }

    if (newFiles.length > 0) {
      const formData = new FormData();

      newFiles.forEach((fileObj: any) => {
        formData.append('files', fileObj.file);
      });

      formData.append('key', 'RequestInvoiceFile');

      this.requestInvoiceService.getRequestInvoiceById(RIID).subscribe((data: any) => {
        const requestInvoice = data;

        const createdDate = new Date(requestInvoice.data.CreatedDate);
        const year = createdDate.getFullYear().toString();
        const month = ('0' + (createdDate.getMonth() + 1)).slice(-2);
        const code = requestInvoice.data.Code || '';

        const sanitize = (s: string) =>
          s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();

        const subPath = [
          sanitize(year),
          `T${sanitize(month)}`,
          sanitize(code)
        ].join('/');

        formData.append('subPath', subPath);

        this.RIDService.uploadFiles(formData, RIID, 2).subscribe({
          next: (response) => {
            if (response.status === 1) {
              const uploadedFiles = response.data as any[];
              const totalRequested = newFiles.length;
              const totalUploaded = uploadedFiles.length;

              if (totalUploaded === totalRequested) {
                this.notification.success('Thông báo', `${totalUploaded} file hợp đồng đã được upload thành công!`);
              } else {
                this.notification.warning('Thông báo', `${totalUploaded}/${totalRequested} file hợp đồng upload thành công.`);
              }

              this.contractFiles = [
                ...this.contractFiles.filter((f: any) => !f.file),
                ...uploadedFiles.map((f: any) => ({
                  fileName: f.FileName,
                  ServerPath: f.ServerPath,
                  ID: f.ID,
                  IsDeleted: false,
                }))
              ];
              this.contractFiles = this.normalizeContractFiles(this.contractFiles);
            } else {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[response.status] || 'error',
                NOTIFICATION_TITLE_MAP[response.status as RESPONSE_STATUS] || 'Thông báo',
                response.message || 'Upload file hợp đồng thất bại!',
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
            }
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Thông báo',
              err?.error?.message || `${err.error}\n${err.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              }
            );
          },
        });
      });
    }

    if (hasDeletedFiles) {
      this.RIDService.deleteFiles(this.deletedContractFileIds).subscribe({
        next: () => {
          this.deletedContractFileIds = [];
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Thông báo',
            err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        },
      });
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        this.addFileToTable(fileObj);
      });
      // this.fileInput.nativeElement.value = '';
    }
  }

  onContractFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        this.addContractFileToTable(fileObj);
      });
    }
  }
  // Trả về chuỗi ISO 8601 theo giờ local (UTC+7) thay vì UTC
  toLocalISOString(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }
  addFileToTable(file: File): void {
    const newFile = {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.name),
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      file: file,
      ServerPath: ''
    };
    this.files = this.normalizeInvoiceFiles([...this.files, newFile]);
  }

  addContractFileToTable(file: File): void {
    const newFile = {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.name),
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      file: file,
      ServerPath: ''
    };
    this.contractFiles = this.normalizeContractFiles([...this.contractFiles, newFile]);
  }

  private buildFullFilePath(file: any): string {
    if (!file) {
      return '';
    }
    const serverPath =
      (file.ServerPath || file.serverPath || '').toString().trim();
    const fileName =
      (file.FileName ||
        file.fileName ||
        file.FileNameOrigin ||
        '').toString().trim();

    if (!serverPath) {
      return '';
    }

    if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
      return serverPath;
    }

    if (!fileName) {
      return serverPath;
    }

    const normalizedPath = serverPath.replace(/[\\/]+$/, '');
    return `${normalizedPath}\\${fileName}`;
  }

  private downloadFromServer(fullPath: string, fileName: string): void {
    if (!fullPath) {
      this.notification.create(
        NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
        NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
        'Không xác định được đường dẫn file!',
        {
          nzStyle: { whiteSpace: 'pre-line' }
        }
      );
      return;
    }

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.requestInvoiceService.downloadFile(fullPath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
            NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
            'File tải về không hợp lệ!',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        if (err?.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errText = JSON.parse(reader.result as string);
              this.notification.create(
                NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
                NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
                errText.message || 'Tải xuống thất bại!',
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
            } catch {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
                NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
                'Tải xuống thất bại!',
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
            }
          };
          reader.readAsText(err.error);
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Thông báo',
            err?.error?.message || err?.message || 'Tải xuống thất bại!',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
    });
  }

  downloadInvoiceFile(file: any): void {
    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file để tải xuống!');
      return;
    }
    const fullPath = this.buildFullFilePath(file);
    const fileName =
      file.FileName || file.fileName || file.FileNameOrigin || 'downloaded_file';
    if (!fullPath) {
      this.notification.create(
        NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
        NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
        'Không xác định được đường dẫn file! (Có thể file mới chưa được upload lên server).',
        {
          nzStyle: { whiteSpace: 'pre-line' }
        }
      );
      return;
    }
    this.downloadFromServer(fullPath, fileName);
  }

  downloadPOFile(file: any): void {
    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file để tải xuống!');
      return;
    }
    const fullPath = this.buildFullFilePath(file);
    const fileName =
      file.FileName || file.fileName || file.FileNameOrigin || 'downloaded_file';
    if (!fullPath) {
      this.notification.create(
        NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
        NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
        'Không xác định được đường dẫn file!',
        {
          nzStyle: { whiteSpace: 'pre-line' }
        }
      );
      return;
    }
    this.downloadFromServer(fullPath, fileName);
  }
  closeModal(): void {
    this.activeModal.close();
  }
  getDefaultFormData(): any {
    return {
      customerId: null,
      customerCode: '',
      Code: '',
      address: '',
      userId: null,
      requestDate: new Date().toISOString().split('T')[0],
      exportDate: new Date().toISOString().split('T')[0],
      taxCompanyId: null,
      status: null,
      note: '',
      isUrgency: false,
      isCustomsDeclared: false,
      deadline: null,
      accountingContractType: null,
    };
  }

  prepareProductEditor(rowData: any): void {
    this.productEditorOptions = this.getLimitedProductOptions('', rowData?.ProductSaleID);
  }

  filterProductOptions(event: any, rowData: any): void {
    this.productEditorOptions = this.getLimitedProductOptions(event?.filter || '', rowData?.ProductSaleID);
  }

  private getLimitedProductOptions(keyword: string = '', selectedValue: any = null): any[] {
    const normalizedKeyword = keyword.toString().trim().toLowerCase();
    const result: any[] = [];

    for (const product of this.products) {
      const productCode = (product.ProductCode || '').toString();
      const productName = (product.ProductName || '').toString();
      const productText = `${productCode} ${productName}`.toLowerCase();

      if (!normalizedKeyword || productText.includes(normalizedKeyword)) {
        result.push(this.toProductOption(product));
      }

      if (result.length >= this.productEditorOptionLimit) {
        break;
      }
    }

    if (selectedValue !== null && selectedValue !== undefined && selectedValue !== '') {
      const selectedExists = result.some((option) => option.value == selectedValue);
      if (!selectedExists) {
        const selectedProduct = this.products.find((product) => product.ID == selectedValue);
        if (selectedProduct) {
          result.unshift(this.toProductOption(selectedProduct));
        }
      }
    }

    return result;
  }

  private toProductOption(product: any): any {
    const productCode = product.ProductCode || '';
    const productName = product.ProductName || '';
    return {
      label: productName ? `${productCode} - ${productName}` : productCode,
      value: product.ID,
    };
  }

  private normalizeDetails(rows: any[]): any[] {
    return (rows || []).map((row, index) => ({
      ...row,
      __rowKey: row.__rowKey || this.createDetailRowKey(row),
      STT: index + 1,
    }));
  }

  private createDetailRowKey(row: any): string {
    const persistedKey = row?.ID || row?.RequestInvoiceDetailID;
    return persistedKey
      ? `detail-${persistedKey}`
      : `detail-new-${++this.detailRowKeySequence}`;
  }

  private normalizeInvoiceFiles(files: any[]): any[] {
    return (files || []).map((file) => ({
      ...file,
      __fileKey: file.__fileKey || this.createFileKey('invoice', file),
    }));
  }

  private normalizePOFiles(files: any[]): any[] {
    return (files || []).map((file) => ({
      ...file,
      __fileKey: file.__fileKey || this.createFileKey('po', file),
    }));
  }

  private normalizeContractFiles(files: any[]): any[] {
    return (files || []).map((file) => ({
      ...file,
      __fileKey: file.__fileKey || this.createFileKey('contract', file),
    }));
  }

  private createFileKey(type: 'invoice' | 'po' | 'contract', file: any): string {
    const persistedKey = file?.ID || file?.FileID || file?.RequestInvoiceFileID;
    if (persistedKey) {
      return `${type}-file-${persistedKey}`;
    }
    if (type === 'invoice') return `${type}-file-new-${++this.invoiceFileKeySequence}`;
    if (type === 'contract') return `${type}-file-new-${++this.contractFileKeySequence}`;
    return `${type}-file-new-${++this.poFileKeySequence}`;
  }

  updateDataTable(): void {
    this.details = this.normalizeDetails(this.details);
    const selectedKeys = new Set(this.selectedDetailRows.map((row) => row.__rowKey));
    this.selectedDetailRows = this.details.filter((row) => selectedKeys.has(row.__rowKey));
  }

  addNewRow(): void {
    const newProduct = {
      __rowKey: this.createDetailRowKey(null),
      ProductNewCode: '',
      ProductSaleID: '',
      GuestCode: '',
      ProductName: '',
      Unit: '',
      Quantity: null,
      ProjectCode: '',
      ProjectID: '',
      ProjectName: '',
      POCode: '',
      Note: '',
      PONumber: '',
      Specifications: '',
      InvoiceNumber: '',
      InvoiceDate: null,
      IsStock: false,
      BillExportCode: '',
      RequestDate: null,
      DateRequestImport: null,
      SupplierName: '',
      SomeBill: '',
      ExpectedDate: null,
      BillImportCode: '',
    };
    this.details = this.normalizeDetails([...this.details, newProduct]);
  }

  deleteDetailRow(row: any): void {
    if (!row || row.IsDeleted) {
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa dòng này?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = row.ID;
        if (id > 0 && !this.deletedRequestInvoiceDetailIds.includes(id)) {
          this.deletedRequestInvoiceDetailIds.push(id);
        }

        this.details = this.normalizeDetails(
          this.details.filter((item) => item.__rowKey !== row.__rowKey)
        );
        this.selectedDetailRows = this.selectedDetailRows.filter(
          (item) => item.__rowKey !== row.__rowKey
        );
      },
    });
  }

  deleteInvoiceFile(file: any): void {
    if (!file || file.IsDeleted) {
      return;
    }

    const fileName = this.getInvoiceFileName(file);
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa file`,
      nzContent: `${fileName}?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = file.ID;
        if (id > 0 && !this.deletedFileIds.includes(id)) {
          this.deletedFileIds.push(id);
        }

        this.files = this.files.filter((item) => item.__fileKey !== file.__fileKey);
        if (this.selectedInvoiceFile?.__fileKey === file.__fileKey) {
          this.selectedInvoiceFile = null;
        }
      },
    });
  }

  deleteContractFile(file: any): void {
    if (!file || file.IsDeleted) {
      return;
    }

    const fileName = this.getContractFileName(file);
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa file hợp đồng`,
      nzContent: `${fileName}?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = file.ID;
        if (id > 0 && !this.deletedContractFileIds.includes(id)) {
          this.deletedContractFileIds.push(id);
        }

        this.contractFiles = this.contractFiles.filter((item) => item.__fileKey !== file.__fileKey);
        if (this.selectedContractFile?.__fileKey === file.__fileKey) {
          this.selectedContractFile = null;
        }
      },
    });
  }

  onProductSaleIDChanged(rowData: any, value: any): void {
    rowData.ProductSaleID = value ?? '';
    const product = this.products.find((p) => p.ID == value);

    if (product) {
      rowData.ProductNewCode = product.ProductCode;
      rowData.ProductName = product.ProductName;
      rowData.Unit = product.Unit;
    } else if (value === null || value === undefined || value === '') {
      rowData.ProductNewCode = '';
      rowData.ProductName = '';
      rowData.Unit = '';
    }

    this.details = [...this.details];
  }

  onProjectChanged(rowData: any, value: any): void {
    rowData.ProjectID = value ?? '';
    const project = this.projects.find((p) => p.ID == value);

    if (project) {
      rowData.ProjectCode = project.ProjectCode;
      rowData.ProjectName = project.ProjectName;
    } else if (value === null || value === undefined || value === '') {
      rowData.ProjectCode = '';
      rowData.ProjectName = '';
    }

    this.details = [...this.details];
  }

  onDetailFieldChanged(rowData: any, field: string, value: any): void {
    rowData[field] = value;
    if (field === 'InvoiceNumber' || field === 'InvoiceDate' || field === 'IsStock') {
      this.syncSelectedDetailRows(rowData, field, value);
    }
    this.details = [...this.details];
  }

  onDetailSelectionChange(selection: any): void {
    this.selectedDetailRows = Array.isArray(selection) ? selection : [];
  }

  onInvoiceDateChanged(rowData: any, value: string): void {
    this.onDetailFieldChanged(rowData, 'InvoiceDate', value || null);
  }

  private syncSelectedDetailRows(editedRow: any, field: string, value: any): void {
    if (this.selectedDetailRows.length <= 1) {
      return;
    }

    const selectedKeys = new Set(this.selectedDetailRows.map((row) => row.__rowKey));
    this.details.forEach((row) => {
      if (selectedKeys.has(row.__rowKey) && row.__rowKey !== editedRow.__rowKey) {
        row[field] = value;
      }
    });
    this.selectedDetailRows = this.details.filter((row) => selectedKeys.has(row.__rowKey));
  }

  isDetailRowSelected(row: any): boolean {
    return this.selectedDetailRows.some((item) => item.__rowKey === row.__rowKey);
  }

  getInvoiceFileName(file: any): string {
    return file?.fileName || file?.FileName || file?.FileNameOrigin || '';
  }

  getPOFileName(file: any): string {
    return file?.FileName || file?.fileName || file?.FileNameOrigin || '';
  }

  getContractFileName(file: any): string {
    return file?.fileName || file?.FileName || file?.FileNameOrigin || '';
  }

  downloadContractFile(file: any): void {
    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file hợp đồng để tải xuống!');
      return;
    }
    const fullPath = this.buildFullFilePath(file);
    const fileName =
      file.FileName || file.fileName || file.FileNameOrigin || 'downloaded_file';
    if (!fullPath) {
      this.notification.create(
        NOTIFICATION_TYPE_MAP[RESPONSE_STATUS.ERROR] || 'error',
        NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR] || 'Thông báo',
        'Không xác định được đường dẫn file!',
        {
          nzStyle: { whiteSpace: 'pre-line' }
        }
      );
      return;
    }
    this.downloadFromServer(fullPath, fileName);
  }

  getProductCode(rowData: any): string {
    const product = this.products.find((p) => p.ID == rowData?.ProductSaleID);
    return product?.ProductCode || rowData?.ProductCode || rowData?.ProductSaleCode || rowData?.ProductSaleID || '';
  }

  getProjectName(rowData: any): string {
    const project = this.projects.find((p) => p.ID == rowData?.ProjectID);
    return project?.ProjectName || rowData?.ProjectName || rowData?.ProjectID || '';
  }

  formatDateVi(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  toDateInputValue(value: any): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  trackByDetailRow(_index: number, row: any): string {
    return row.__rowKey;
  }

  handlePOKHData(): void {
    if (this.selectedRowsData.length > 0) {
      const firstRow = this.selectedRowsData[0];

      // load pokh file đính kèm
      if (this.POKHID === 0 && firstRow.POKHID) {
        this.POKHID = firstRow.POKHID;
        this.loadPOKHFile();
      }

      // Tìm thông tin khách hàng từ danh sách customers
      const customer = this.customers.find((c) => c.ID === this.customerID);

      // Cập nhật form data
      this.formData.customerId = this.customerID;
      this.formData.customerCode =
        customer?.CustomerName || firstRow.CustomerName || '';
      this.formData.address = customer?.Address || firstRow.Address || '';
      this.formData.status = 1;
      this.formData.taxCompanyId = 1;

      // Cập nhật products array để hiển thị trong bảng
      this.details = this.normalizeDetails(this.selectedRowsData.map((row, index) => ({
        ...row,
        STT: index + 1,
        Note: row.Note || '',
        Specifications: row.Specifications || '',
        InvoiceNumber: row.InvoiceNumber || '',
        InvoiceDate: row.InvoiceDate || null,
      })));
    }
  }

  // Hàm xử lý dữ liệu khi ở chế độ edit
  handleEditModeData(): void {
    if (this.groupedData.length > 0) {
      const data = this.groupedData[0];

      // Cập nhật form data từ MainData
      if (data.MainData) {
        this.formData.Code = data.MainData.Code || '';
        this.formData.customerId = data.MainData.CustomerID || null;
        this.formData.customerCode = data.MainData.CustomerName || '';
        this.formData.address = data.MainData.Address || '';
        this.formData.userId = data.MainData.EmployeeRequestID || null;
        if (data.MainData.DateRequest) {
          const dateRequest = new Date(data.MainData.DateRequest);
          const year = dateRequest.getFullYear();
          const month = String(dateRequest.getMonth() + 1).padStart(2, '0');
          const day = String(dateRequest.getDate()).padStart(2, '0');
          this.formData.requestDate = `${year}-${month}-${day}`;
        } else {
          this.formData.requestDate = new Date().toISOString().split('T')[0];
        }
        this.formData.exportDate = data.MainData.ExportDate
          ? new Date(data.MainData.ExportDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        this.formData.taxCompanyId = data.MainData.TaxCompanyID || null;
        this.formData.status = data.MainData.Status || null;
        this.formData.note = data.MainData.Note || '';

        //Update 0112
        this.formData.isCustomsDeclared = data.MainData.IsCustomsDeclared || false;
        this.formData.isUrgency = data.MainData.IsUrgency || false;
        if (data.MainData.DealineUrgency) {
          const deadline = new Date(data.MainData.DealineUrgency);
          const year = deadline.getFullYear();
          const month = String(deadline.getMonth() + 1).padStart(2, '0');
          const day = String(deadline.getDate()).padStart(2, '0');
          this.formData.deadline = `${year}-${month}-${day}`;
          // Nếu có deadline thì enable checkbox "Cần gấp"
          // this.formData.isUrgency = true;
        } else {
          this.formData.deadline = null;
          this.formData.isUrgency = data.MainData.IsUrgency || false;
        }
        //END Update 0112

        this.formData.accountingContractType = data.MainData.AccountingContractTypeID || null;

        this.selectedId = data.ID || 0;
      }

      // Cập nhật details từ items
      if (data.items && data.items.length > 0) {
        this.details = this.normalizeDetails(data.items.map((item: any, index: number) => ({
          ...item,
          STT: index + 1,
          ProductNewCode: item.ProductNewCode || '',
          ProductSaleID: item.ProductSaleID || '',
          ProductByProject: item.ProductByProject || '',
          ProductName: item.ProductName || '',
          Unit: item.Unit || '',
          Quantity: item.Quantity || null,
          ProjectCode: item.ProjectCode || '',
          ProjectID: item.ProjectID || '',
          ProjectName: item.ProjectName || '',
          POCode: item.POCode || '',
          Note: item.Note || '',
          Specifications: item.Specifications || '',
          InvoiceNumber: item.InvoiceNumber || '',
          InvoiceDate: item.InvoiceDate || null,
        })));
      }

      // Cập nhật files nếu có
      if (data.files && data.files.length > 0) {
        const invoiceFiles = data.files.filter((f: any) => f.FileType === 1 || !f.FileType);
        this.files = this.normalizeInvoiceFiles(invoiceFiles.map((file: any) => ({
          ID: file.ID,
          fileName: file.FileName || file.fileName,
          FileName: file.FileName || file.fileName,
          fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
          fileType: file.FileName ? this.getFileType(file.FileName) : '',
          uploadDate: file.UploadDate
            ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN'),
          ServerPath: file.ServerPath || '',
        })));
        this.selectedInvoiceFile = null;

        const cFiles = data.files.filter((f: any) => f.FileType === 2);
        this.contractFiles = this.normalizeContractFiles(cFiles.map((file: any) => ({
          ID: file.ID,
          fileName: file.FileName || file.fileName,
          FileName: file.FileName || file.fileName,
          fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
          fileType: file.FileName ? this.getFileType(file.FileName) : '',
          uploadDate: file.UploadDate
            ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN'),
          ServerPath: file.ServerPath || '',
        })));
        this.selectedContractFile = null;
      } else {
        this.files = [];
        this.selectedInvoiceFile = null;
        this.contractFiles = [];
        this.selectedContractFile = null;
      }
    }
  }

}
