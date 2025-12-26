import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { TrackingMarksService } from '../tracking-marks-service/tracking-marks.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-tracking-marks-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzDatePickerModule,
    NzSelectModule,
    NzTableModule,
    NzIconModule,
    NzCheckboxModule,
    NzGridModule,
    NzInputNumberModule,
  ],
  templateUrl: './tracking-marks-detail.component.html',
  styleUrl: './tracking-marks-detail.component.css'
})
export class TrackingMarksDetailComponent implements OnInit, AfterViewInit {
  @Input() trackingMarkId: number = 0;
  @Input() isEdit: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('tb_File', { static: false }) tb_FileElement!: ElementRef;
  tb_File!: Tabulator;

  form!: FormGroup;

  departments: any[] = [];
  employees: any[] = [];
  documentTypes: any[] = [];
  taxCompanies: any[] = [];
  sealRegulations: any[] = [];
  
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  currentEmployeeName: string = '';

  files: any[] = [];
  selectedFile: any = null;
  deletedFileIds: number[] = [];

  // Selected checkboxes
  selectedTaxCompanies: number[] = [];
  selectedSealRegulations: number[] = [];

  // Is urgent flag
  isUrgent: boolean = false;

  constructor(
    private fb: FormBuilder,
    private trackingMarksService: TrackingMarksService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private nzModal: NzModalService,
    public activeModal: NgbActiveModal
  ) {
    this.currentEmployeeId = this.appUserService.employeeID || 0;
    this.currentDepartmentId = this.appUserService.departmentID || 0;
    this.currentDepartmentName = this.appUserService.departmentName || '';
    this.currentEmployeeName = this.appUserService.fullName || '';
  }

  ngOnInit() {
    this.initForm();
    this.loadDepartments();
    this.loadEmployees();
    this.loadDocumentTypes();
    this.loadTaxCompanies();
    this.loadSealRegulations();
    
    if (this.trackingMarkId > 0) {
      this.loadTrackingMarkDetail();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initFileTable();
    }, 100);
  }

  initForm() {
    this.form = this.fb.group({
      registerDate: [new Date(), [Validators.required]],
      employeeSignId: [0],
      documentTypeId: [0, [Validators.required]],
      documentName: ['', [Validators.required]],
      documentQuantity: [0, [Validators.required, Validators.min(1)]],
      documentTotalPage: [0],
      deadline: [null],
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.departments = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
      }
    });
  }

  loadEmployees() {
    this.trackingMarksService.getEmployees().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          // Filter bỏ các employee có tên rỗng hoặc trắng
          this.employees = (data.data || []).filter((emp: any) => {
            const name = emp.FullName || emp.Name || '';
            return name && name.trim() !== '';
          });
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
      }
    });
  }

  loadDocumentTypes() {
    this.trackingMarksService.getDocumentTypes().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.documentTypes = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách loại văn bản:', error);
        this.documentTypes = [];
      }
    });
  }

  loadTaxCompanies() {
    this.trackingMarksService.getTaxCompanies().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.taxCompanies = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách công ty:', error);
        this.taxCompanies = [];
      }
    });
  }

  loadSealRegulations() {
    this.trackingMarksService.getSealRegulations().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.sealRegulations = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách quy cách đóng dấu:', error);
        this.sealRegulations = [];
      }
    });
  }

  loadTrackingMarkDetail() {
    this.deletedFileIds = [];
    
    this.trackingMarksService.getById(this.trackingMarkId).subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          const tracking = data.data.tracking;
          const seals = data.data.seals || [];
          const taxs = data.data.taxs || [];
          const files = data.data.files || [];
          const employee = data.data.employee;
          const department = data.data.department;

          // Lấy thông tin employee và department từ API response
          if (this.isEdit) {
            this.currentEmployeeName = employee.FullName || employee.Name || employee.EmployeeName || '';
            this.currentEmployeeId = employee.ID || employee.EmployeeID || 0;
            this.currentDepartmentName = department.Name || '';
            this.currentDepartmentId = department.ID || 0;
          } else {
            // Fallback nếu không có employee trong response
            this.currentEmployeeName = tracking.EmployeeName || this.appUserService.fullName || '';
            this.currentEmployeeId = tracking.EmployeeID || this.appUserService.employeeID || 0;
            this.currentDepartmentName = tracking.DepartmentName || this.appUserService.departmentName || '';
            this.currentDepartmentId = tracking.DepartmentID || this.appUserService.departmentID || 0;
          }

          this.form.patchValue({
            registerDate: tracking.RegisterDate ? new Date(tracking.RegisterDate) : new Date(),
            employeeSignId: tracking.EmployeeSignID || tracking.EmployeeSignId || 0,
            documentTypeId: tracking.DocumentTypeID || tracking.DocumentTypeId || 0,
            documentName: tracking.DocumentName || '',
            documentQuantity: tracking.DocumentQuantity || 0,
            documentTotalPage: tracking.DocumentTotalPage || 0,
            deadline: tracking.Deadline ? new Date(tracking.Deadline) : null,
          });

          this.isUrgent = tracking.IsUrgent || false;

          // Load selected tax companies
          this.selectedTaxCompanies = taxs.map((t: any) => t.TaxCompanyID || t.TaxCompanyId || t.TaxCompany?.ID);

          // Load selected seal regulations
          this.selectedSealRegulations = seals.map((s: any) => s.SealID || s.SealId || s.Seal?.ID);

          // Populate files
          this.files = files.map((f: any) => ({
            ID: f.ID || f.Id,
            fileName: f.FileName,
            FileName: f.FileName,
            ServerPath: f.ServerPath || '',
            file: null,
          }));

          if (this.tb_File) {
            this.tb_File.setData(this.files);
          }
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết phiếu');
      }
    });
  }

  initFileTable() {
    if (!this.tb_FileElement) {
      return;
    }

    const contextMenuItems = [
      {
        label: 'Tải xuống',
        action: () => {
          if (this.selectedFile) {
            this.downloadFile(this.selectedFile);
          } else {
            this.notification.warning('Thông báo', 'Vui lòng chọn file để tải xuống!');
          }
        },
      },
    ];

    this.tb_File = new Tabulator(this.tb_FileElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.files,
      pagination: false,
      layout: 'fitColumns',
      movableColumns: true,
      height: '17vh',
      paginationMode: 'local',
      rowHeader: false,
      selectableRows: 1,
      rowContextMenu: contextMenuItems,
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: "10%",
          frozen: true,
          headerSort: false,
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            const isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e: any, cell: any) => {
            const data = cell.getRow().getData();
            const id = data['ID'];
            const fileName = data['fileName'] || data['FileName'];
            const isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            this.nzModal.confirm({
              nzTitle: 'Bạn có chắc chắn muốn xóa file',
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
                this.tb_File.deleteRow(cell.getRow());
                this.files = this.tb_File.getData();
              },
            });
          },
        },
        {
          title: 'Tên file',
          field: 'fileName',
          sorter: 'string',
          width: '90%',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value
              ? `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`
              : '';
          },
        },
      ],
    });

    this.tb_File.on('rowSelected', (row: RowComponent) => {
      this.selectedFile = row.getData();
    });

    this.tb_File.on('rowDeselected', () => {
      const selectedRows = this.tb_File.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedFile = null;
      }
    });

    this.tb_File.on('rowDblClick', (_e: any, row: RowComponent) => {
      this.selectedFile = row.getData();
      this.downloadFile(this.selectedFile);
    });
  }

  onSelectFile(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      Array.from(selectedFiles).forEach((file: any) => {
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
      event.target.value = '';
    }
  }

  addFileToTable(file: File): void {
    const newFile = {
      ID: 0,
      fileName: file.name,
      FileName: file.name,
      ServerPath: '',
      file: file,
    };
    this.files = [...this.files, newFile];
    if (this.tb_File) {
      this.tb_File.setData(this.files);
    }
  }

  downloadFile(file: any): void {
    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file để tải xuống!');
      return;
    }
    const fileName = file.FileName || file.fileName || 'downloaded_file';
    if (!this.trackingMarkId || this.trackingMarkId === 0) {
      this.notification.error('Thông báo', 'Không thể tải file chưa được lưu');
      return;
    }
    
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.trackingMarksService.downloadFile(this.trackingMarkId, fileName).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (err: any) => {
        this.message.remove(loadingMsg);
        this.notification.error('Thông báo', 'Tải xuống thất bại!');
      },
    });
  }

  onTaxCompanyChange(id: number, checked: boolean) {
    if (checked) {
      if (!this.selectedTaxCompanies.includes(id)) {
        this.selectedTaxCompanies.push(id);
      }
    } else {
      this.selectedTaxCompanies = this.selectedTaxCompanies.filter(x => x !== id);
    }
  }

  onSealRegulationChange(id: number, checked: boolean) {
    if (checked) {
      if (!this.selectedSealRegulations.includes(id)) {
        this.selectedSealRegulations.push(id);
      }
    } else {
      this.selectedSealRegulations = this.selectedSealRegulations.filter(x => x !== id);
    }
  }

  onIsUrgentChange(checked: boolean) {
    this.isUrgent = checked;
    if (!checked) {
      this.form.patchValue({ deadline: null });
    }
  }

  save() {
    if (this.form.invalid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const formValue = this.form.getRawValue();
    
    // Validate
    if (!formValue.registerDate) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký');
      return;
    }

    if (formValue.documentTypeId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại văn bản');
      return;
    }

    if (!formValue.documentName || formValue.documentName.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tên văn bản');
      return;
    }

    if (formValue.documentQuantity <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số lượng bản');
      return;
    }

    if (this.selectedTaxCompanies.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 tên công ty');
      return;
    }

    if (this.selectedSealRegulations.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 quy cách đóng dấu');
      return;
    }

    if (this.isUrgent && !formValue.deadline) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập hạn đóng dấu');
      return;
    }

    const model = {
      ID: this.trackingMarkId,
      EmployeeID: this.currentEmployeeId,
      RegisterDate: formValue.registerDate,
      EmployeeSignID: formValue.employeeSignId || 0,
      DocumentTypeID: formValue.documentTypeId,
      DocumentName: formValue.documentName,
      DocumentQuantity: formValue.documentQuantity,
      DocumentTotalPage: formValue.documentTotalPage || 0,
      Deadline: this.isUrgent ? formValue.deadline : null,
      ListSeal: this.selectedSealRegulations.map(id => ({
        ID: 0,
        TrackingMartkID: 0,
        SealID: id
      })),
      ListTaxCompany: this.selectedTaxCompanies.map(id => ({
        ID: 0,
        TrackingMartkID: 0,
        TaxCompanyID: id
      })),
      deletedFileIds: this.deletedFileIds.length > 0 ? this.deletedFileIds : null,
    };

    this.trackingMarksService.save(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          const trackingMarkId = res.data?.id || this.trackingMarkId;
          
          // Upload files if any
          const newFiles = this.files.filter((f: any) => f.file && !f.ID); // Chỉ upload file mới (có file object và ID = 0)

          if (newFiles.length > 0 && trackingMarkId > 0) {
            const formData = new FormData();

            // Thêm từng file mới vào FormData
            newFiles.forEach((fileObj: any) => {
              formData.append('files', fileObj.file);
            });

            // key: để backend nhận biết loại tài liệu
            formData.append('key', 'TrackingMarks');

            // subPath: Năm/TM{ID} (lọc ký tự không hợp lệ trong đường dẫn)
            const year = new Date().getFullYear().toString();
            const trackingMarkIdStr = trackingMarkId.toString();
            const sanitize = (s: string) =>
              s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
            const subPath = [sanitize(year), sanitize(`TM${trackingMarkIdStr}`)]
              .filter((x) => x)
              .join('/');

            formData.append('subPath', subPath);

            // Gọi API upload
            this.trackingMarksService.uploadFile(trackingMarkId, formData).subscribe({
              next: (result: any) => {
                // API trả về format: { status: 1, message: "..." } hoặc { Status: 1, Message: "..." }
                if (result && (result.status == 1 || result.Status == 1)) {
                  console.log('Files uploaded successfully');
                } else {
                  console.warn('File upload warning:', result?.message || result?.Message);
                }
                this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
                this.onSave.emit(res.data);
                this.activeModal.close(true);
              },
              error: (err) => {
                console.error('Error uploading files:', err);
                this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công nhưng upload file thất bại');
                this.onSave.emit(res.data);
                this.activeModal.close(true);
              }
            });
          } else {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
            this.onSave.emit(res.data);
            this.activeModal.close(true);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || error?.message || 'Lỗi khi lưu phiếu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  close() {
    this.activeModal.close(false);
  }
}

