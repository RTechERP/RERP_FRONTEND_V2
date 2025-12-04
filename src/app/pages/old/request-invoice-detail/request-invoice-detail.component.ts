import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  OnInit,
  AfterViewInit,
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
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
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

import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { RequestInvoiceDetailService } from './request-invoice-detail-service/request-invoice-detail-service.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { RequestInvoiceService } from '../request-invoice/request-invoice-service/request-invoice-service.service';
import { AppUserService } from '../../../services/app-user.service';
@Component({
  selector: 'app-request-invoice-detail',
  templateUrl: './request-invoice-detail.component.html',
  styleUrls: ['./request-invoice-detail.component.css'],
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
  ],
  standalone: true,
})
export class RequestInvoiceDetailComponent implements OnInit {
  @ViewChild('tb_InvoiceFile', { static: false })
  tb_InvoiceFileElement!: ElementRef;
  @ViewChild('tb_POFile', { static: false })
  tb_POFileElement!: ElementRef;
  @ViewChild('tb_DataTable', { static: false })
  tb_DataTableElement!: ElementRef;

  // Input properties để nhận dữ liệu từ parent component
  @Input() selectedRowsData: any[] = [];
  @Input() customerID: number = 0;
  @Input() customerName: string = '';
  @Input() isFromPOKH: boolean = false;
  @Input() selectedId = 0;
  @Input() groupedData: any[] = [];
  @Input() isEditMode: boolean = false;
  @Input() POKHID: number = 0;
  private tb_InvoiceFile!: Tabulator;
  private tb_POFile!: Tabulator;
  private tb_DataTable!: Tabulator;

  //Form data
  formData: any = this.getDefaultFormData();

  //Data arrays
  deletedRequestInvoiceDetailIds: number[] = [];
  customers: any[] = [];
  projects: any[] = [];
  employees: any[] = [];
  taxCompanies: any[] = [];
  products: any[] = [];
  files: any[] = [];
  POFiles: any[] = [];
  deletedFileIds: number[] = [];
  details: any[] = [];
  isLoading: boolean = true;
  selectedInvoiceFile: any = null;
  selectedPOFile: any = null;
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
    this.initInvoiceFile();
    this.initPOFile();
    // Cập nhật dữ liệu bảng nếu có dữ liệu từ POKH
    if (this.isFromPOKH && this.selectedRowsData.length > 0) {
      setTimeout(() => {
        this.updateDataTable();
      }, 100);
    }

    // Cập nhật dữ liệu bảng nếu ở chế độ edit
    if (this.isEditMode && this.groupedData.length > 0) {
      setTimeout(() => {
        this.updateDataTable();
        if (this.tb_InvoiceFile) {
          this.tb_InvoiceFile.setData(this.files);
        }
      }, 100);
    }
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
          console.error('Lỗi khi tải Customer:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }

  loadPOKHFile(): void {
    this.requestInvoiceService.getPOKHFile(this.POKHID).subscribe(
      (response) => {
        if (response.status === 1) {
          this.POFiles = response.data;
          this.selectedPOFile = null;
          if (this.tb_POFile) {
            this.tb_POFile.setData(this.POFiles);
          }
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải POKHFile:', error);
      }
    );
  }

  loadProject(): void {
    this.RIDService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          console.error('Lỗi khi tải Project:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Project:', error);
      }
    );
  }
  loadProductSale(): void {
    this.isLoading = true;
    this.RIDService.loadProductSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.products = response.data;
          this.initDataTable();
        } else {
          console.error('Lỗi khi tải Product:', response.message);
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Product:', error);
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
          console.error('Lỗi khi tải Employees:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Employees:', error);
      }
    );
  }
  generateBillNumber(requestInvoiceId: number): void {
    this.RIDService.generateBillNumber(requestInvoiceId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.formData.Code = response.data;
        } else {
          console.error('Lỗi khi tạo số phiếu:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tạo số phiếu', error);
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
    if (!this.validateDetails()) {
      return;
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
    };

    const requestInvoiceDetails = this.tb_DataTable.getData().map((item) => ({
      ...item,
      ProductSaleID: item.ProductSaleID === '' ? null : item.ProductSaleID,
      ProjectID: item.ProjectID === '' ? null : item.ProjectID,
    }));

    const payload = {
      RequestInvoices: requestInvoices,
      RequestInvoiceDetails: requestInvoiceDetails,
      DeletedDetailIds: this.deletedRequestInvoiceDetailIds,
    };

    this.RIDService.saveData(payload).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.handleSuccess(response);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response.message || 'Không thể lưu dữ liệu!'
          );
        }
      },
      error: (err) => {
        const message = err.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, message);
      },
    });
  }
  /**
   * Validate
   */
  validateDetails(): boolean {
    for (let i = 0; i < this.details.length; i++) {
      const row = this.details[i];
      const isStock = !!row.IsStock;
      const billCode = row.BillImportCode ? row.BillImportCode.toString() : '';
      const productNewCode = row.ProductNewCode || '';
      const stt = row.STT || (i + 1);
      if (!isStock) {
        const someBill = row.SomeBill || '';
        const productName = row.ProductName || '';
        if (!someBill || someBill.trim() === '') {
          this.notification.error(
            'Thông báo',
            `Vì không là hàng lấy từ Tồn kho, bắt buộc phải có Hóa đơn đầu vào cho mã sản phẩm ${productNewCode} - STT: ${stt}`
          );
          return false;
        }
      } else if (billCode && billCode.trim() !== '') {
        this.notification.error(
          'Thông báo',
          `Bạn không thể chọn Tồn kho vì đã có Phiếu nhập kho [${billCode}] cho mã sản phẩm ${productNewCode} - STT: ${stt}`
        );
        return false;
      }
    }
    return true;
  }
  handleSuccess(response: any) {
    const ID = response.data.id;
    if (this.files.length > 0) {
      this.uploadFiles(ID);
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
      formData.append('key', 'TuanBeoTest');

      this.requestInvoiceService.getRequestInvoiceById(RIID).subscribe((data: any) => {
        const requestInvoice = data;

        const createdDate = new Date(requestInvoice.CreatedDate);
        const year = createdDate.getFullYear().toString();
        const month = ('0' + (createdDate.getMonth() + 1)).slice(-2);
        const code = requestInvoice.Code || '';

        const sanitize = (s: string) =>
          s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();

        const subPath = [
          sanitize(year),
          `T${sanitize(month)}`,
          sanitize(code)
        ].join('/');

        formData.append('subPath', subPath);
      });


      // const sanitize = (s: string) =>
      //   s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
      // const subPath = [sanitize(year), sanitize(customerName), sanitize(poCode)]
      //   .filter((x) => x)
      //   .join('/');

      // formData.append('subPath', subPath);

      // Gọi API upload
      this.RIDService.uploadFiles(formData, RIID, 1).subscribe({
        next: () => {
          console.log('Upload files thành công');
        },
        error: (error) => {
          this.notification.error('Thông báo', 'Lỗi upload files: ' + error);
        },
      });
    }

    // Xử lý xóa files
    if (hasDeletedFiles) {
      this.RIDService.deleteFiles(this.deletedFileIds).subscribe({
        next: () => {
          this.deletedFileIds = [];
        },
        error: (error) => {
          this.notification.error('Lỗi xóa files:', error);
        },
      });
    }
  }
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        if (fileObj.size > MAX_FILE_SIZE) {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            `File ${fileObj.name} vượt quá giới hạn dung lượng cho phép (50MB)`
          );
          return;
        }
        this.addFileToTable(fileObj);
      });
      // this.fileInput.nativeElement.value = '';
    }
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
    this.files = [...this.files, newFile];
    if (this.tb_InvoiceFile) {
      this.tb_InvoiceFile.setData(this.files);
    }
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
      this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
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
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        if (err?.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errText = JSON.parse(reader.result as string);
              this.notification.error(
                'Thông báo',
                errText.message || 'Tải xuống thất bại!'
              );
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(err.error);
        } else {
          this.notification.error(
            'Thông báo',
            err?.error?.message || err?.message || 'Tải xuống thất bại!'
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
      this.notification.error(
        'Thông báo',
        'Không xác định được đường dẫn file! (Có thể file mới chưa được upload lên server).'
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
      this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
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
    };
  }
  //#region Các hàm vẽ bảng
  initInvoiceFile(): void {
    const contextMenuItems = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedInvoiceFile) {
            this.downloadInvoiceFile(this.selectedInvoiceFile);
          } else {
            this.notification.warning(
              'Thông báo',
              'Vui lòng chọn file để tải xuống!'
            );
          }
        },
      },
    ];

    this.tb_InvoiceFile = new Tabulator(
      this.tb_InvoiceFileElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.files,
        pagination: false,
        layout: 'fitColumns',
        movableColumns: true,
        height: '26.5vh',
        rowHeader: false,
        selectableRows: 1,
        rowContextMenu: contextMenuItems,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen: true,
            headerSort: false,
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let fileName = data['fileName'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa file`,
                nzContent: `${fileName}?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  // thêm id của file đã xóa vào mảng deletedFileIds
                  if (id > 0) {
                    if (!this.deletedFileIds.includes(id)) {
                      this.deletedFileIds.push(id);
                    }
                  }
                  this.tb_InvoiceFile.deleteRow(cell.getRow());
                  this.files = this.tb_InvoiceFile.getData();
                },
              });
            },
          },
          {
            title: 'Tên file',
            field: 'fileName',
            sorter: 'string',
            width: '100%',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`
                : '';
            },
          },
        ],
      }
    );

    this.tb_InvoiceFile.on('rowSelected', (row: RowComponent) => {
      this.selectedInvoiceFile = row.getData();
    });

    this.tb_InvoiceFile.on('rowDeselected', () => {
      const selectedRows = this.tb_InvoiceFile.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedInvoiceFile = null;
      }
    });

    this.tb_InvoiceFile.on('rowDblClick', (_e, row: RowComponent) => {
      this.selectedInvoiceFile = row.getData();
      this.downloadInvoiceFile(this.selectedInvoiceFile);
    });
  }

  initPOFile(): void {
    const contextMenuItems = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedPOFile) {
            this.downloadPOFile(this.selectedPOFile);
          } else {
            this.notification.warning(
              'Thông báo',
              'Vui lòng chọn file để tải xuống!'
            );
          }
        },
      },
    ];

    this.tb_POFile = new Tabulator(this.tb_POFileElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.POFiles,
      pagination: false,
      layout: 'fitColumns',
      movableColumns: true,
      height: '42vh',
      rowHeader: false,
      selectableRows: 1,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: 'Tên file',
          field: 'FileName',
          sorter: 'string',
          width: '100%',
          formatter: (cell) => {
            const value = cell.getValue();
            return value
              ? `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`
              : '';
          },
        },
      ],
    });

    this.tb_POFile.on('rowSelected', (row: RowComponent) => {
      this.selectedPOFile = row.getData();
    });

    this.tb_POFile.on('rowDeselected', () => {
      const selectedRows = this.tb_POFile.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedPOFile = null;
      }
    });

    this.tb_POFile.on('rowDblClick', (_e, row: RowComponent) => {
      this.selectedPOFile = row.getData();
      this.downloadPOFile(this.selectedPOFile);
    });
  }

  initDataTable(): void {
    this.tb_DataTable = new Tabulator(this.tb_DataTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.details,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      height: '42vh',
      paginationSize: 20,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
      },
      columns: [
        {
          title: '',
          field: '',
          columns: [
            {
              title: '',
              field: 'addRow',
              hozAlign: 'center',
              width: 40,
              frozen: true,
              headerSort: false,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus cursor-pointer" style="color: #22c55e;" title="Thêm dòng"></i></div>`,
              headerClick: () => {
                this.addNewRow();
              },
              formatter: (cell) => {
                const data = cell.getRow().getData();
                let isDeleted = data['IsDeleted'];
                return !isDeleted
                  ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                  : '';
              },
              cellClick: (e, cell) => {
                let data = cell.getRow().getData();
                let id = data['ID'];
                let isDeleted = data['IsDeleted'];
                if (isDeleted) {
                  return;
                }
                this.modal.confirm({
                  nzTitle: `Bạn có chắc chắn muốn xóa dòng này?`,
                  nzOkText: 'Xóa',
                  nzOkType: 'primary',
                  nzCancelText: 'Hủy',
                  nzOkDanger: true,
                  nzOnOk: () => {
                    if (id > 0) {
                      if (!this.deletedRequestInvoiceDetailIds.includes(id)) {
                        this.deletedRequestInvoiceDetailIds.push(id);
                      }
                    }
                    this.tb_DataTable.deleteRow(cell.getRow());
                    this.details = this.tb_DataTable.getData();
                  },
                });
              },
            },
            {
              title: 'STT',
              field: 'STT',
              sorter: 'number',
              width: '5%',
              hozAlign: 'center',
              frozen: true,
            },
            {
              title: 'Mã nội bộ',
              field: 'ProductNewCode',
              sorter: 'string',
              width: 200,
              frozen: true,
            },
            {
              title: 'Mã sản phẩm',
              field: 'ProductSaleID',
              sorter: 'string',
              width: 200,
              editor: 'list',
              frozen: true,
              editorParams: {
                values: this.products.map((product) => ({
                  label: product.ProductCode,
                  value: product.ID,
                })),
              },
              formatter: (cell) => {
                const value = cell.getValue();
                const product = this.products.find((p) => p.ID === value);
                return product ? product.ProductCode : value;
              },
              cellEdited: (cell: CellComponent) => {
                this.onProductSaleIDChanged(cell);
              },
            },
            {
              title: 'Mã theo khách',
              field: 'GuestCode',
              sorter: 'string',
              width: 200,
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              sorter: 'string',
              width: 200,
            },
            { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 100 },
            {
              title: 'Số lượng',
              field: 'Quantity',
              sorter: 'number',
              width: 150,
              hozAlign: 'right',
              editor: 'number',
            },
            {
              title: 'Mã dự án',
              field: 'ProjectCode',
              sorter: 'string',
              width: 200,
            },
            {
              title: 'Dự án',
              field: 'ProjectID',
              sorter: 'string',
              width: '15%',
              editor: 'list',
              editorParams: {
                values: this.projects.map((project) => ({
                  label: project.ProjectName,
                  value: project.ID,
                })),
              },
              formatter: (cell) => {
                const value = cell.getValue();
                const project = this.projects.find((p) => p.ID === value);
                return project ? project.ProjectName : value;
              },
              cellEdited: (cell: CellComponent) => {
                this.onProjectChanged(cell);
              },
            },
            // { title: 'Số PO', field: 'POCode', sorter: 'string', width: "8%" },
            {
              title: 'Ghi chú',
              field: 'Note',
              sorter: 'string',
              width: 200,
              editor: 'textarea',
            },
            {
              title: 'Số POKH',
              field: 'PONumber',
              sorter: 'string',
              width: 100,
            },
            {
              title: 'Thông số kỹ thuật',
              field: 'Specifications',
              sorter: 'string',
              width: '10%',
              editor: 'input',
              visible: false,
            },
            {
              title: 'Số hóa đơn',
              field: 'InvoiceNumber',
              sorter: 'string',
              width: 200,
              editor: 'input',
            },
            {
              title: 'Ngày hóa đơn',
              field: 'InvoiceDate',
              sorter: 'date',
              width: '10%',
              editor: 'date',
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'Tồn kho',
              field: 'IsStock',
              sorter: 'boolean',
              width: 80,
              hozAlign: 'center',
              editor: undefined,
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
            <input type="checkbox" ${checked} style="width: 16px; height: 16px;"/>
          </div>`;
              },
              cellClick: (e, cell) => {
                cell.setValue(!cell.getValue());
              },
            },
            {
              title: 'Mã phiếu xuất',
              field: 'BillExportCode',
              sorter: 'string',
              width: 200,
            },
          ]
        },
        {
          title: 'Thông tin đầu vào',
          field: '',
          sorter: 'string',
          width: 200,
          columns: [
            {
              title: 'Ngày đặt hàng',
              field: 'RequestDate',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'Ngày hàng về',
              field: 'DateRequestImport',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'Nhà cung cấp',
              field: 'SupplierName',
              sorter: 'string',
              formatter: 'textarea',
              width: 250,
            },
            {
              title: 'Hóa đơn đầu vào',
              field: 'SomeBill',
              sorter: 'string',
              width: 250,
            },
            {
              title: 'Ngày hàng về dự kiến',
              field: 'ExpectedDate',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const date = cell.getValue();
                return date ? new Date(date).toLocaleDateString('vi-VN') : '';
              },
            },
            {
              title: 'PNK',
              field: 'BillImportCode',
              sorter: 'string',
              width: 250,
            },
          ]
        }

      ],
    });
  }
  //#endregion

  // Hàm xử lý dữ liệu từ POKH
  handlePOKHData(): void {
    if (this.selectedRowsData.length > 0) {
      const firstRow = this.selectedRowsData[0];

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
      this.details = this.selectedRowsData.map((row, index) => ({
        ...row,
        STT: index + 1,
        Note: row.Note || '',
        Specifications: row.Specifications || '',
        InvoiceNumber: row.InvoiceNumber || '',
        InvoiceDate: row.InvoiceDate || null,
      }));
    }
  }

  // Hàm xử lý dữ liệu khi ở chế độ edit
  handleEditModeData(): void {
    console.log('Handling edit mode data:', this.groupedData);
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

        this.selectedId = data.ID || 0;
      }

      // Cập nhật details từ items
      if (data.items && data.items.length > 0) {
        this.details = data.items.map((item: any, index: number) => ({
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
        }));
      }

      // Cập nhật files nếu có
      if (data.files && data.files.length > 0) {
        this.files = data.files.map((file: any) => ({
          ID: file.ID,
          fileName: file.FileName || file.fileName,
          FileName: file.FileName || file.fileName,
          fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
          fileType: file.FileName ? this.getFileType(file.FileName) : '',
          uploadDate: file.UploadDate
            ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN'),
          ServerPath: file.ServerPath || '',
        }));
        console.log('Updated files:', this.files);
        this.selectedInvoiceFile = null;
        if (this.tb_InvoiceFile) {
          this.tb_InvoiceFile.setData(this.files);
        }
      } else {
        this.files = [];
        this.selectedInvoiceFile = null;
        if (this.tb_InvoiceFile) {
          this.tb_InvoiceFile.setData(this.files);
        }
      }
    }
  }

  // Hàm cập nhật bảng dữ liệu
  updateDataTable(): void {
    if (this.tb_DataTable && this.details.length > 0) {
      this.tb_DataTable.setData(this.details);
    }
  }

  // Thêm dòng mới vào bảng sản phẩm
  addNewRow(): void {
    // Tạo sản phẩm mới với các trường mặc định
    const newProduct = {
      STT: this.details.length + 1,
      ProductNewCode: '',
      ProductSaleID: '',
      ProductName: '',
      Unit: '',
      Quantity: null,
      ProjectCode: '',
      ProjectName: '',
      POCode: '',
      Note: '',
      Specifications: '',
      InvoiceNumber: '',
      InvoiceDate: null,
    };
    this.details = [...this.details, newProduct];
    // Cập nhật lại STT cho tất cả sản phẩm
    this.details = this.details.map((item, idx) => ({ ...item, STT: idx + 1 }));
    // Nếu bảng đã khởi tạo thì cập nhật lại dữ liệu
    if (this.tb_DataTable) {
      this.tb_DataTable.setData(this.details);
    }
  }

  onProductSaleIDChanged(cell: CellComponent): void {
    const row = cell.getRow();
    const rowData = row.getData();
    const newValue = cell.getValue();
    const product = this.products.find((p) => p.ID === newValue);

    if (product) {
      rowData['ProductNewCode'] = product.ProductCode;
      rowData['ProductName'] = product.ProductName;
      rowData['Unit'] = product.Unit;

      row.update(rowData);
    }
  }

  onProjectChanged(cell: CellComponent): void {
    const row = cell.getRow();
    const rowData = row.getData();
    const newValue = cell.getValue();
    const project = this.projects.find((p) => p.ID === newValue);

    if (project) {
      rowData['ProjectCode'] = project.ProjectCode;
      rowData['ProjectName'] = project.ProjectName;

      row.update(rowData);
    }
  }
}
