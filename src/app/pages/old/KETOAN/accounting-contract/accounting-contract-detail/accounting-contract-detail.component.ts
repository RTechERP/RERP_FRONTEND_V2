import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AccountingContractService } from '../accounting-contract-service/accounting-contract.service';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { SupplierSaleDetailComponent } from '../../../../purchase/supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { CustomerDetailComponent } from '../../../../crm/customers/customer-detail/customer-detail.component';

@Component({
  selector: 'app-accounting-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTableModule,
    NzIconModule,
  ],
  templateUrl: './accounting-contract-detail.component.html',
  styleUrl: './accounting-contract-detail.component.css'
})
export class AccountingContractDetailComponent implements OnInit, AfterViewInit {
  @Input() editId: number = 0;
  @Input() isCopyMode: boolean = false;
  @Input() isReceivedContractMode: boolean = false;
  @ViewChild('tb_ContractFile', { static: false })
  tb_ContractFileElement!: ElementRef;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  private tb_ContractFile!: Tabulator;

  // Form data
  dateInput: Date = new Date();
  dateReceived: Date | null = null;
  quantityDocument: number = 0;
  company: number = 0;
  contractGroup: number = 0;
  accountingContractTypeId: number | null = null;
  contractNumber: string = '';
  contractValue: number = 0;
  unit: string = 'VND';
  dateContract: Date | null = null;
  dateExpired: Date | null = null;
  customerId: number | null = null;
  supplierId: number | null = null;
  dateIsApprovedGroup: Date | null = null;
  employeeId: number | null = null;
  contractId: number | null = null;
  contractContent: string = '';
  contentPayment: string = '';
  note: string = '';

  // Lists
  accountingContractTypes: any[] = [];
  customers: any[] = [];
  suppliers: any[] = [];
  employeesGrouped: any[] = [];
  contracts: any[] = [];
  files: any[] = [];
  deletedFileIds: number[] = [];
  selectedContractFile: any = null;

  // Original data for comparison
  originalContract: any = null;
  originalNote: string = '';

  // UI State
  showDateIsApprovedGroupRequired: boolean = false;
  showUploadFile: boolean = false;
  isCustomerRequired: boolean = false;
  isSupplierRequired: boolean = false;
  isCustomerDisabled: boolean = false;
  isSupplierDisabled: boolean = false;

  // Errors
  errors: any = {
    dateReceived: '',
    company: '',
    contractGroup: '',
    accountingContractTypeId: '',
    contractNumber: '',
    customerId: '',
    supplierId: '',
    contractContent: '',
    contentPayment: '',
    note: '',
  };

  constructor(
    public activeModal: NgbActiveModal,
    private accountingContractService: AccountingContractService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private message: NzMessageService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadData();
    if (this.editId > 0) {
      this.loadExistingData();
    }
  }

  ngAfterViewInit(): void {
    this.initContractFile();
    if (this.editId > 0) {
      this.loadContractFiles();
    }
  }

  loadData(): void {
    // Load dropdown data
    this.loadAccountingContractTypes();
    this.loadCustomers();
    this.loadSuppliers();
    this.loadEmployees();
    this.loadContracts();
  }

  loadExistingData(): void {
    if (this.editId <= 0) {
      return;
    }

    this.accountingContractService.getAccountingContractDetail(this.editId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const data = response.data;
          
          // Map dữ liệu từ API vào form
          this.dateInput = data.DateInput ? new Date(data.DateInput) : new Date();
          this.dateReceived = data.DateReceived ? new Date(data.DateReceived) : null;
          this.quantityDocument = data.QuantityDocument || 0;
          this.company = data.Company || 0;
          this.contractGroup = data.ContractGroup || null;
          this.accountingContractTypeId = data.AccountingContractTypeID || null;
          this.contractNumber = data.ContractNumber || '';
          this.contractValue = data.ContractValue || 0;
          this.unit = data.Unit || 'VND';
          this.dateContract = data.DateContract ? new Date(data.DateContract) : null;
          this.dateExpired = data.DateExpired ? new Date(data.DateExpired) : null;
          this.customerId = data.CustomerID || null;
          this.supplierId = data.SupplierSaleID || null;
          this.dateIsApprovedGroup = data.DateIsApprovedGroup ? new Date(data.DateIsApprovedGroup) : null;
          this.employeeId = data.EmployeeID || null;
          this.contractId = data.ParentID && data.ParentID > 0 ? data.ParentID : null;
          this.contractContent = data.ContractContent || '';
          this.contentPayment = data.ContentPayment || '';
          this.note = data.Note || '';

          // Lưu giá trị ban đầu để so sánh khi save
          this.originalContract = {
            DateInput: this.dateInput,
            Company: this.company,
            ContractGroup: this.contractGroup,
            AccountingContractTypeID: this.accountingContractTypeId,
            CustomerID: this.customerId,
            SupplierSaleID: this.supplierId,
            ContractNumber: this.contractNumber,
            ContractValue: this.contractValue,
            DateExpired: this.dateExpired,
            DateIsApprovedGroup: this.dateIsApprovedGroup,
            EmployeeID: this.employeeId,
            ContractContent: this.contractContent,
            ContentPayment: this.contentPayment,
            ParentID: this.contractId,
            DateContract: this.dateContract,
            Unit: this.unit,
          };
          this.originalNote = this.note;

          // Cập nhật trạng thái disable/enable và required dựa trên contractGroup
          this.onContractGroupChange();

          // Nếu là copy mode, xóa data các trường không cần thiết
          if (this.isCopyMode) {
            this.dateReceived = null;
            this.quantityDocument = 0;
            this.contractNumber = '';
            this.dateContract = null;
            this.contractId = null;
          }

          // Load files sau khi load data
          this.loadContractFiles();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error loading existing data:', error);
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải dữ liệu');
      }
    });
  }

  loadAccountingContractTypes(): void {
    this.accountingContractService.getContractType().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.accountingContractTypes = (response.data || []).map((item: any) => ({
            value: item.ID || item.id,
            label: item.TypeCode + ' - ' + item.TypeName || ''
          }));
        }
      },
      error: (error) => {
        console.error('Error loading accounting contract types:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách loại HĐ');
      }
    });
  }

  loadCustomers(): void {
    this.accountingContractService.getCustomers().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customers = (response.data || []).map((item: any) => ({
            value: item.ID || item.id,
            label: `${item.CustomerCode || item.customerCode} - ${item.CustomerName || item.customerName}`
          }));
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.accountingContractService.getSuppliers().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.suppliers = (response.data || []).map((item: any) => ({
            value: item.ID || item.id,
            label: `${item.CodeNCC || item.codeNCC} - ${item.NameNCC || item.nameNCC}`
          }));
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadEmployees(): void {
    this.accountingContractService.getEmployees().subscribe({
      next: (response) => {
        if (response.status === 1) {
          const employees = response.data || [];
          this.employeesGrouped = this.groupEmployeesByDepartment(employees);
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
      }
    });
  }

  private groupEmployeesByDepartment(employees: any[]): any[] {
    const grouped: { [key: string]: any[] } = {};
    
    employees.forEach((emp) => {
      const deptName = emp.DepartmentName || emp.departmentName || 'Khác';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push({
        ID: emp.ID || emp.id || emp.EmployeeID || emp.employeeID,
        Code: emp.Code || emp.code || '',
        FullName: emp.FullName || emp.fullName || ''
      });
    });

    return Object.keys(grouped).map((deptName) => ({
      department: deptName,
      list: grouped[deptName]
    }));
  }

  loadContracts(): void {
    this.accountingContractService.getContract().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.contracts = (response.data || []).map((item: any) => ({
            value: item.ID || item.id,
            label: item.ContractNumber || item.contractNumber || ''
          }));
        }
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách hợp đồng');
      }
    });
  }

  loadContractFiles(): void {
    if (this.editId > 0) {
      this.accountingContractService.getAccountingContractFile(this.editId).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.files = (response.data || []).map((file: any) => ({
              ID: file.ID,
              fileName: file.FileName || file.fileName,
              FileName: file.FileName || file.fileName,
              fileSize: file.FileSize ? this.formatFileSize(file.FileSize) : '',
              fileType: file.FileName ? this.getFileType(file.FileName) : '',
              uploadDate: file.UploadDate
                ? new Date(file.UploadDate).toLocaleDateString('vi-VN')
                : new Date().toLocaleDateString('vi-VN'),
              ServerPath: file.ServerPath || file.serverPath || '',
            }));
            if (this.tb_ContractFile) {
              this.tb_ContractFile.setData(this.files);
            }
          }
        },
        error: (error) => {
          console.error('Error loading contract files:', error);
        }
      });
    }
  }

  onContractGroupChange(): void {
    if (this.contractGroup === 1) {
      // Hợp đồng mua vào
      this.isCustomerRequired = false;
      this.isSupplierRequired = true;
      this.isCustomerDisabled = true;
      this.isSupplierDisabled = false;
      this.errors.customerId = '';
    } else if (this.contractGroup === 2) {
      // Hợp đồng bán ra
      this.isCustomerRequired = true;
      this.isSupplierRequired = false;
      this.isCustomerDisabled = false;
      this.isSupplierDisabled = true;
      this.errors.supplierId = '';
    } else {
      // Chưa chọn hoặc giá trị khác
      this.isCustomerRequired = false;
      this.isSupplierRequired = false;
      this.isCustomerDisabled = false;
      this.isSupplierDisabled = false;
      this.errors.customerId = '';
      this.errors.supplierId = '';
    }
  }

  onAddType(): void {
    this.notification.info('Thông báo', 'Chức năng thêm loại HĐ đang được phát triển');
  }

  onAddCustomer(): void {
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.warehouseId = 1;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadCustomers();
        }
      },
      (reason) => {
        console.log('Modal closed:', reason);
      }
    );
  }

  onAddSupplier(): void {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadSuppliers();
        }
      },
      (reason) => {
        console.log('Modal closed:', reason);
      }
    );
  }

  onChooseFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        if (fileObj.size > MAX_FILE_SIZE) {
          this.notification.error(
            'Lỗi',
            `File ${fileObj.name} vượt quá giới hạn dung lượng cho phép (50MB)`
          );
          return;
        }
        this.addFileToTable(fileObj);
      });
      this.fileInput.nativeElement.value = '';
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
      ServerPath: '',
      ID: 0,
    };
    this.files = [...this.files, newFile];
    if (this.tb_ContractFile) {
      this.tb_ContractFile.setData(this.files);
    }
  }

  initContractFile(): void {
    const contextMenuItems = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedContractFile) {
            this.downloadContractFile(this.selectedContractFile);
          } else {
            this.notification.warning(
              'Thông báo',
              'Vui lòng chọn file để tải xuống!'
            );
          }
        },
      },
    ];

    this.tb_ContractFile = new Tabulator(
      this.tb_ContractFileElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.files,
        pagination: false,
        layout: 'fitColumns',
        movableColumns: true,
        height: '140px',
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
                  if (id > 0) {
                    if (!this.deletedFileIds.includes(id)) {
                      this.deletedFileIds.push(id);
                    }
                  }
                  this.tb_ContractFile.deleteRow(cell.getRow());
                  this.files = this.tb_ContractFile.getData();
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

    this.tb_ContractFile.on('rowSelected', (row: RowComponent) => {
      this.selectedContractFile = row.getData();
    });

    this.tb_ContractFile.on('rowDeselected', () => {
      const selectedRows = this.tb_ContractFile.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedContractFile = null;
      }
    });

    this.tb_ContractFile.on('rowDblClick', (_e, row: RowComponent) => {
      this.selectedContractFile = row.getData();
      this.downloadContractFile(this.selectedContractFile);
    });
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

    this.accountingContractService.downloadFile(fullPath).subscribe({
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

  downloadContractFile(file: any): void {
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

  uploadFiles(accountingContractId: number): void {
    const newFiles = this.files.filter((fileObj: any) => fileObj.file);
    const hasDeletedFiles = this.deletedFileIds.length > 0;

    if (newFiles.length === 0 && !hasDeletedFiles) {
      return;
    }

    if (newFiles.length > 0) {
      const formData = new FormData();
      newFiles.forEach((fileObj: any) => {
        formData.append('files', fileObj.file);
      });

      // key: để backend nhận biết loại tài liệu
      // formData.append('key', 'PathAccounting');
      formData.append('key', 'TuanBeoTest');

      // Lấy thông tin hợp đồng để tạo subPath
      this.accountingContractService.getAccountingContractDetail(accountingContractId).subscribe({
        next: (data: any) => {
          if (data.status === 1 && data.data) {
            const accountingContract = data.data;

            const createdDate = new Date(accountingContract.DateInput || accountingContract.CreatedDate || new Date());
            const year = createdDate.getFullYear().toString();
            const month = ('0' + (createdDate.getMonth() + 1)).slice(-2);
            const contractNumber = accountingContract.ContractNumber || '';

            const sanitize = (s: string) =>
              s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();

            const subPath = [
              sanitize(year),
              `T${sanitize(month)}`,
              sanitize(contractNumber)
            ].join('/');

            formData.append('subPath', subPath);

            // Gọi API upload sau khi đã có subPath
            this.accountingContractService.uploadFiles(formData, accountingContractId).subscribe({
              next: () => {
                console.log('Upload files thành công');
              },
              error: (error) => {
                this.notification.error('Thông báo', 'Lỗi upload files: ' + (error?.error?.message || error?.message || error));
              },
            });
          } else {
            // Nếu không lấy được thông tin hợp đồng, vẫn upload nhưng không có subPath
            this.accountingContractService.uploadFiles(formData, accountingContractId).subscribe({
              next: () => {
                console.log('Upload files thành công');
              },
              error: (error) => {
                this.notification.error('Thông báo', 'Lỗi upload files: ' + (error?.error?.message || error?.message || error));
              },
            });
          }
        },
        error: (error) => {
          // Nếu lỗi khi lấy thông tin hợp đồng, vẫn upload nhưng không có subPath
          this.accountingContractService.uploadFiles(formData, accountingContractId).subscribe({
            next: () => {
              console.log('Upload files thành công');
            },
            error: (uploadError) => {
              this.notification.error('Thông báo', 'Lỗi upload files: ' + (uploadError?.error?.message || uploadError?.message || uploadError));
            },
          });
        }
      });
    }

    // Xử lý xóa files
    if (hasDeletedFiles) {
      this.accountingContractService.deleteFiles(this.deletedFileIds).subscribe({
        next: () => {
          this.deletedFileIds = [];
        },
        error: (error) => {
          this.notification.error('Lỗi xóa files:', error?.error?.message || error?.message || error);
        },
      });
    }
  }

  private formatLocalDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private toString(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      // Kiểm tra Date hợp lệ
      if (isNaN(value.getTime())) {
        return '';
      }
      // Chỉ so sánh ngày, không so sánh giờ phút giây
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Chuyển số về string để so sánh nhất quán
    if (typeof value === 'number') {
      return String(value);
    }
    return String(value).trim();
  }

  private deepEquals(obj: any, another: any): { equal: boolean; property: string[] } {
    const propertyNames: string[] = [];

    if (!obj || !another) {
      return { equal: propertyNames.length === 0, property: propertyNames };
    }

    // Lấy các property từ object đầu tiên
    const objKeys = Object.keys(obj);
    objKeys.forEach((property) => {
      const objValue = this.toString(obj[property]);
      const anotherValue = this.toString(another[property]);

      if (objValue !== anotherValue) {
        propertyNames.push(property);
      }
    });

    return {
      equal: propertyNames.length === 0,
      property: propertyNames,
    };
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      DateInput: 'Ngày nhập',
      Company: 'Công ty',
      ContractGroup: 'Phân loại HĐ chính',
      AccountingContractTypeID: 'Loại HĐ',
      CustomerID: 'Khách hàng',
      SupplierSaleID: 'Nhà cung cấp',
      ContractNumber: 'Số HĐ/PL',
      ContractValue: 'Giá trị HĐ',
      DateExpired: 'Hiệu lực HĐ',
      DateIsApprovedGroup: 'Ngày duyệt trên nhóm',
      EmployeeID: 'NV phụ trách',
      ContractContent: 'Nội dung HĐ',
      ContentPayment: 'Nội dung thanh toán',
      ParentID: 'Thuộc HĐ',
      DateContract: 'Ngày HĐ',
      Unit: 'ĐVT',
    };
    return labels[fieldName] || fieldName;
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = {
      dateReceived: '',
      company: '',
      contractGroup: '',
      accountingContractTypeId: '',
      contractNumber: '',
      customerId: '',
      supplierId: '',
      contractContent: '',
      contentPayment: '',
    };

    // Company validation - required
    if (!this.company || Number(this.company) <= 0) {
      this.errors.company = 'Vui lòng chọn công ty';
      isValid = false;
    }

    // ContractGroup validation - required
    if (!this.contractGroup || this.contractGroup <= 0) {
      this.errors.contractGroup = 'Vui lòng chọn phân loại HĐ chính';
      isValid = false;
    }

    // AccountingContractTypeID validation - required
    if (!this.accountingContractTypeId || this.accountingContractTypeId <= 0) {
      this.errors.accountingContractTypeId = 'Vui lòng chọn loại HĐ';
      isValid = false;
    }

    // ContractNumber validation - required
    if (!this.contractNumber || !this.contractNumber.trim()) {
      this.errors.contractNumber = 'Vui lòng nhập số HĐ/PL';
      isValid = false;
    }

    // EmployeeID validation - required
    if (!this.employeeId || this.employeeId <= 0) {
      isValid = false;
    }

    // ContractContent validation - required
    if (!this.contractContent || !this.contractContent.trim()) {
      this.errors.contractContent = 'Vui lòng nhập nội dung HĐ';
      isValid = false;
    }

    // ContentPayment validation - required
    if (!this.contentPayment || !this.contentPayment.trim()) {
      this.errors.contentPayment = 'Vui lòng nhập nội dung thanh toán';
      isValid = false;
    }

    // Validate based on contract group
    if (this.contractGroup === 1) {
      // Hợp đồng mua vào - cần nhà cung cấp
      if (!this.supplierId || this.supplierId <= 0) {
        this.errors.supplierId = 'Vui lòng chọn nhà cung cấp';
        isValid = false;
      }
    } else if (this.contractGroup === 2) {
      // Hợp đồng bán ra - cần khách hàng
      if (!this.customerId || this.customerId <= 0) {
        this.errors.customerId = 'Vui lòng chọn khách hàng';
        isValid = false;
      }
    }

    // DateReceived validation - bắt buộc nếu isReceivedContract = true
    if (this.isReceivedContractMode) {
      if (!this.dateReceived) {
        this.errors.dateReceived = 'Vui lòng nhập Ngày trả hồ sơ gốc';
        isValid = false;
      } else if (this.quantityDocument <= 0) {
        this.errors.dateReceived = 'Vui lòng nhập SL hồ sơ khi có ngày trả hồ sơ gốc';
        isValid = false;
      }
    } else {
      // DateReceived validation - nếu có DateReceived thì cần QuantityDocument
      if (this.dateReceived && this.quantityDocument <= 0) {
        this.errors.dateReceived = 'Vui lòng nhập SL hồ sơ khi có ngày trả hồ sơ gốc';
        isValid = false;
      }
    }

    // Validate thay đổi thông tin - yêu cầu nhập nội dung thay đổi
    if (this.editId > 0 && this.originalContract) {
      const currentContract = {
        DateInput: this.dateInput,
        Company: this.company,
        ContractGroup: this.contractGroup,
        AccountingContractTypeID: this.accountingContractTypeId,
        CustomerID: this.customerId,
        SupplierSaleID: this.supplierId,
        ContractNumber: this.contractNumber?.trim() || '',
        ContractValue: this.contractValue,
        DateExpired: this.dateExpired,
        DateIsApprovedGroup: this.dateIsApprovedGroup,
        EmployeeID: this.employeeId,
        ContractContent: this.contractContent?.trim() || '',
        ContentPayment: this.contentPayment?.trim() || '',
        ParentID: this.contractId,
        DateContract: this.dateContract,
        Unit: this.unit?.trim() || '',
      };

      const resultCompare = this.deepEquals(this.originalContract, currentContract);
      
      if (!resultCompare.equal) {
        // Có thay đổi thông tin
        const changedFields = resultCompare.property.map(field => this.getFieldLabel(field));
        const propertyText = changedFields.join('; ');

        // Kiểm tra note có rỗng hoặc giống với note cũ không
        const currentNote = this.note?.trim() || '';
        if (!currentNote || currentNote.toLowerCase() === this.originalNote.trim().toLowerCase()) {
          this.errors.note = `Bạn vừa thay đổi thông tin [${propertyText}]. Vui lòng nhập Nội dung thay đổi!`;
          isValid = false;
        }
      }
    }

    return isValid;
  }

  saveAndClose(): void {
    if (!this.validateForm()) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Build DTO theo format API yêu cầu
    const accountingContract = {
      ID: this.isCopyMode ? 0 : (this.editId || 0),
      DateInput: this.formatLocalDate(this.dateInput),
      Company: Number(this.company) || 0,
      ContractGroup: this.contractGroup || 0,
      Unit: this.unit?.trim().toUpperCase() || '',
      AccountingContractTypeID: this.accountingContractTypeId || 0,
      CustomerID: this.customerId || null,
      SupplierSaleID: this.supplierId || null,
      ContractNumber: this.contractNumber?.trim() || '',
      ContractValue: this.contractValue || 0,
      DateExpired: this.formatLocalDate(this.dateExpired),
      DateIsApprovedGroup: this.formatLocalDate(this.dateIsApprovedGroup),
      EmployeeID: this.employeeId || 0,
      ContractContent: this.contractContent?.trim() || '',
      ContentPayment: this.contentPayment?.trim() || '',
      Note: this.note?.trim() || '',
      ParentID: this.contractId && this.contractId > 0 ? this.contractId : 0,
      DateReceived: this.formatLocalDate(this.dateReceived),
      QuantityDocument: this.quantityDocument || 0,
      DateContract: this.formatLocalDate(this.dateContract),
      IsReceivedContract: this.isReceivedContractMode || false
    };

    // Gọi API save
    this.accountingContractService.saveData(accountingContract).subscribe({
      next: (response) => {
        if (response.status === 1) {
          // Lấy ID từ response hoặc từ editId
          const savedId = response.data?.ID || response.data?.id || this.editId || accountingContract.ID || 0;
          
          // Upload files sau khi save thành công (chỉ khi có ID hợp lệ)
          if (savedId > 0 && (this.files.length > 0 || this.deletedFileIds.length > 0)) {
            this.uploadFiles(savedId);
          }

          this.notification.success('Thành công', response.message || 'Lưu dữ liệu thành công');
          this.activeModal.close('saved');
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (error) => {
        console.error('Error saving data:', error);
        const errorMessage = error?.error?.message || error?.message || 'Lỗi kết nối khi lưu dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }


  resetForm(): void {
    this.dateInput = new Date();
    this.dateReceived = null;
    this.quantityDocument = 0;
    this.company = 0;
    this.contractGroup = 0;
    this.accountingContractTypeId = null;
    this.contractNumber = '';
    this.contractValue = 0;
    this.unit = 'VND';
    this.dateContract = null;
    this.dateExpired = null;
    this.customerId = null;
    this.supplierId = null;
    this.dateIsApprovedGroup = null;
    this.employeeId = null;
    this.contractId = null;
    this.contractContent = '';
    this.contentPayment = '';
    this.note = '';
    this.files = [];
    this.deletedFileIds = [];
    this.selectedContractFile = null;
    if (this.tb_ContractFile) {
      this.tb_ContractFile.setData(this.files);
    }
    this.errors = {
      dateReceived: '',
      company: '',
      contractGroup: '',
      accountingContractTypeId: '',
      contractNumber: '',
      customerId: '',
      supplierId: '',
      contractContent: '',
      contentPayment: '',
      note: '',
    };
    this.originalContract = null;
    this.originalNote = '';
  }

  cancel(): void {
    this.activeModal.close();
  }

  // Number formatters
  numberFormatter = (value: number): string => {
    if (!value) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  numberParser = (value: string): number => {
    const parsed = value.replace(/\$\s?|(,*)/g, '');
    return parsed ? Number(parsed) : 0;
  };

  currencyFormatter = (value: number): string => {
    if (!value) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  currencyParser = (value: string): number => {
    const parsed = value.replace(/\$\s?|(,*)/g, '');
    return parsed ? Number(parsed) : 0;
  };
}
