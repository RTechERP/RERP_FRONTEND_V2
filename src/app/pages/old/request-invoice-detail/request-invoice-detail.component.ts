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
import { NzFormModule } from 'ng-zorro-antd/form';

import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { RequestInvoiceDetailService } from './request-invoice-detail-service/request-invoice-detail-service.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

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
  ],
  standalone: true,
})
export class RequestInvoiceDetailComponent implements OnInit {
  @ViewChild('tb_InvoiceFile', { static: false })
  tb_InvoiceFileElement!: ElementRef;
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

  private tb_InvoiceFile!: Tabulator;
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
  deletedFileIds: number[] = [];
  details: any[] = [];
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
    private viewPokhService: ViewPokhService,
    private RIDService: RequestInvoiceDetailService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.formData = this.getDefaultFormData();
    this.loadCustomer();
    this.loadEmployee();
    this.loadProductSale();
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
    this.RIDService.loadProductSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.products = response.data;
          this.initDataTable();
        } else {
          console.error('Lỗi khi tải Product:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Product:', error);
      }
    );
  }
  loadEmployee(): void {
    this.RIDService.loadEmployee().subscribe(
      (response) => {
        if (response.status === 1) {
          this.employees = response.data;
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

  saveAndClose(): void {
    const requestInvoices = {
      ID: this.selectedId || 0,
      Code: this.formData.Code,
      DateRequest: this.formData.requestDate,
      CustomerID: this.formData.customerId,
      TaxCompanyID: this.formData.taxCompanyId,
      EmployeeRequestID: this.formData.userId,
      Status: this.formData.status,
      Note: this.formData.note,
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
            'Lỗi',
            response.message || 'Lưu dữ liệu thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lưu dữ liệu!');
      },
    });
  }
  handleSuccess(response: any) {
    const ID = response.data.id;
    if (this.files.length > 0) {
      this.uploadFiles(ID);
    }
    this.notification.success('Thành công', 'Lưu dữ liệu thành công');
    this.selectedId = 0;
    this.activeModal.close({
      success: true,
      reloadData: true,
      data: response.data,
    });
  }
  uploadFiles(RIID: number) {
    const formData = new FormData();

    // Thêm từng file vào FormData
    this.files.forEach((fileObj: any) => {
      if (fileObj.file) {
        formData.append('files', fileObj.file);
      }
    });

    // Xử lý upload files mới
    if (this.files.length > 0) {
      this.RIDService.uploadFiles(formData, RIID).subscribe({
        next: (response) => {
          console.log('Upload files thành công');
        },
        error: (error) => {
          this.notification.error('Thông báo', 'Lỗi upload files: ' + error);
        },
      });
    }

    // Xử lý xóa files
    if (this.deletedFileIds.length > 0) {
      this.RIDService.deleteFiles(this.deletedFileIds).subscribe({
        next: (response) => {
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
            'Thông báo',
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
    };
    this.files = [...this.files, newFile];
    if (this.tb_InvoiceFile) {
      this.tb_InvoiceFile.setData(this.files);
    }
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
    };
  }
  //#region Các hàm vẽ bảng
  initInvoiceFile(): void {
    this.tb_InvoiceFile = new Tabulator(
      this.tb_InvoiceFileElement.nativeElement,
      {
        data: this.files,
        layout: 'fitDataFill',
        movableColumns: true,
        pagination: true,
        height: '21vh',
        paginationSize: 5,
        columns: [
          {
            title: '',
            field: 'actions',
            formatter: (cell) => {
              return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
            },
            width: '10%',
            hozAlign: 'center',
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('delete-btn')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa file này?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();

                    // thêm id của file đã xóa vào mảng deletedFileIds
                    if (rowData['ID']) {
                      this.deletedFileIds.push(rowData['ID']);
                    }

                    row.delete();
                    this.files = this.tb_InvoiceFile.getData();
                  },
                });
              }
            },
          },
          {
            title: 'Tên file',
            field: 'fileName',
            sorter: 'string',
            width: '70%',
          },
        ],
      }
    );
  }
  initDataTable(): void {
    this.tb_DataTable = new Tabulator(this.tb_DataTableElement.nativeElement, {
      data: this.details,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      height: '40vh',
      paginationSize: 20,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
      },
      columns: [
        {
          title: '',
          field: 'actions',
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: '5%',
          hozAlign: 'center',
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();

                  if (rowData['ID']) {
                    this.deletedRequestInvoiceDetailIds.push(rowData['ID']);
                  }

                  row.delete();
                  this.details = this.tb_DataTable.getData();
                },
              });
            }
          },
        },
        {
          title: 'STT',
          field: 'STT',
          sorter: 'number',
          width: '5%',
          hozAlign: 'center',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          width: '12%',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductSaleID',
          sorter: 'string',
          width: '12%',
          editor: 'list',
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
          title: 'Mã sản phẩm theo dự án',
          field: 'ProductByProject',
          sorter: 'string',
          width: '12%',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          sorter: 'string',
          width: '20%',
        },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: '8%' },
        {
          title: 'Số lượng',
          field: 'Quantity',
          sorter: 'number',
          width: '8%',
          hozAlign: 'right',
          editor: 'number',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          sorter: 'string',
          width: '12%',
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
          width: '10%',
          editor: 'input',
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Specifications',
          sorter: 'string',
          width: '10%',
          editor: 'input',
        },
        {
          title: 'Số hóa đơn',
          field: 'InvoiceNumber',
          sorter: 'string',
          width: '10%',
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
          fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
          fileType: file.FileName ? this.getFileType(file.FileName) : '',
          uploadDate: file.UploadDate
            ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
            : new Date().toLocaleDateString('vi-VN'),
          ServerPath: file.ServerPath || '',
        }));
        console.log('Updated files:', this.files);
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
