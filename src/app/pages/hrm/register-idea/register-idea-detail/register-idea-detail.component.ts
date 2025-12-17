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
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { RegisterIdeaService } from '../register-idea-service/register-idea.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-register-idea-detail',
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
    NzUploadModule,
    NzGridModule,
  ],
  templateUrl: './register-idea-detail.component.html',
  styleUrl: './register-idea-detail.component.css'
})
export class RegisterIdeaDetailComponent implements OnInit, AfterViewInit {
  @Input() ideaId: number = 0;
  @Input() isEdit: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('tb_Detail', { static: false }) tb_DetailElement!: ElementRef;
  tb_Detail!: Tabulator;
  
  @ViewChild('tb_File', { static: false }) tb_FileElement!: ElementRef;
  tb_File!: Tabulator;

  form!: FormGroup;
  detailForm!: FormGroup;

  departments: any[] = [];
  registerTypes: any[] = [];
  
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  currentEmployeeName: string = '';
  currentHeadofDepartment: number = 0;

  ideaDetails: any[] = [
    { STT: 1, Category: 'Tên ý tưởng', Description: '', Note: '', DateStart: null, DateEnd: null },
    { STT: 2, Category: 'Đối tượng áp dụng', Description: '', Note: '', DateStart: null, DateEnd: null },
    { STT: 3, Category: 'Chi phí thực hiện', Description: '', Note: '', DateStart: null, DateEnd: null },
    { STT: 4, Category: 'Địa điểm áp dụng', Description: '', Note: '', DateStart: null, DateEnd: null },
    { STT: 5, Category: 'Thời gian triển khai', Description: '', Note: '', DateStart: null, DateEnd: null },
  ];

  files: any[] = [];
  selectedFile: any = null;
  deletedFileIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private registerIdeaService: RegisterIdeaService,
    private departmentService: DepartmentServiceService,
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
    this.currentHeadofDepartment = Number(this.appUserService.currentUser?.HeadofDepartment) || 0;
  }

  ngOnInit() {
    this.initForm();
    this.loadDepartments();
    this.loadRegisterTypes();
    
    if (this.ideaId > 0) {
      this.loadIdeaDetail();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initDetailTable();
      this.initFileTable();
    }, 100);
  }

  initForm() {
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 30);
    const dateEnd = new Date();

    this.form = this.fb.group({
      employeeId: [{ value: this.currentEmployeeId, disabled: true }],
      departmentId: [{ value: this.currentDepartmentId, disabled: true }],
      dateStart: [dateStart, [Validators.required]],
      dateEnd: [dateEnd, [Validators.required]],
      departmentOrganizationID: [0],
      registerIdeaTypeID: [0],
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

  loadRegisterTypes() {
    this.registerIdeaService.getCourseCatalog().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.registerTypes = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách loại đề tài:', error);
      }
    });
  }

  loadIdeaDetail() {
    this.deletedFileIds = [];
    
    this.registerIdeaService.getIdeaDetail(this.ideaId, this.currentEmployeeId).subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          const idea = data.data.rgt;
          const details = data.data.rgtd || [];
          const employees = data.data.em || [];
          const departments = data.data.de || [];
          const files = data.data.rgtf || [];

          this.form.patchValue({
            departmentOrganizationID: idea.DepartmentOrganizationID || 0,
            registerIdeaTypeID: idea.RegisterIdeaTypeID || 0,
          });

          if (idea.EmployeeID && employees && employees.length > 0) {
            const employee = employees.find((emp: any) => emp.ID === idea.EmployeeID);
            if (employee) {
              this.currentEmployeeName = employee.FullName || employee.Name || '';
              this.currentEmployeeId = idea.EmployeeID;
            }
          }

          if (departments.length > 0) {
            const department = departments.find((dept: any) => dept.ID === idea.DepartmentOrganizationID);
            if (department) {
              this.currentDepartmentName = department.Name || '';
              this.currentDepartmentId = idea.DepartmentOrganizationID;
            }
          }

          if (details.length > 0) {
            this.ideaDetails = details.map((d: any) => ({
              STT: d.STT,
              Category: d.Category,
              Description: d.Description || '',
              Note: d.Note || '',
              DateStart: d.DateStart ? new Date(d.DateStart) : null,
              DateEnd: d.DateEnd ? new Date(d.DateEnd) : null,
            }));

            // Lấy dateStart và dateEnd từ dòng đầu tiên của detail
            const firstDetail = this.ideaDetails.find((d: any) => d.STT === 1) || this.ideaDetails[0];
            if (firstDetail) {
              this.form.patchValue({
                dateStart: firstDetail.DateStart || null,
                dateEnd: firstDetail.DateEnd || null,
              });
            }
          } else {
            // Nếu không có detail, lấy từ idea
            this.form.patchValue({
              dateStart: idea.DateStart ? new Date(idea.DateStart) : null,
              dateEnd: idea.DateEnd ? new Date(idea.DateEnd) : null,
            });
          }

          // Populate files
          this.files = files.map((f: any) => ({
            ID: f.ID,
            fileName: f.FileName,
            FileName: f.FileName,
            ServerPath: f.ServerPath || '',
            file: null, // File object chỉ có khi upload mới
          }));

          if (this.tb_Detail) {
            this.tb_Detail.replaceData(this.ideaDetails);
          }
          
          if (this.tb_File) {
            this.tb_File.setData(this.files);
          }
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết ý tưởng');
      }
    });
  }

  initDetailTable() {
    if (!this.tb_DetailElement) {
      return;
    }

    this.tb_Detail = new Tabulator(this.tb_DetailElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      rowHeader: false,
      height: '300px',
      data: this.ideaDetails,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          width: 60,

        },
        {
          title: 'Hạng mục',
          field: 'Category',
          width: 150,
        },
        {
          title: 'Diễn giải',
          field: 'Description',
          editor: 'textarea',
          formatter: 'textarea',
        },
        {
          title: 'Chú thích',
          field: 'Note',
          editor: 'textarea',
          formatter: 'textarea',
        },
      ],
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
      height: '165px',
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
                // Thêm id của file đã xóa vào mảng deletedFileIds
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
      // Reset input
      event.target.value = '';
    }
  }

  addFileToTable(file: File): void {
    const newFile = {
      ID: 0, // ID = 0 cho file mới
      fileName: file.name,
      FileName: file.name,
      ServerPath: '',
      file: file, // Lưu File object để upload sau
    };
    this.files = [...this.files, newFile];
    if (this.tb_File) {
      this.tb_File.setData(this.files);
    }
  }

  private buildFullFilePath(file: any): string {
    if (!file) {
      return '';
    }
    const serverPath = (file.ServerPath || file.serverPath || '').toString().trim();
    const fileName = (file.FileName || file.fileName || '').toString().trim();

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

    this.registerIdeaService.downloadFile(fullPath).subscribe({
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
      error: (err: any) => {
        this.message.remove(loadingMsg);
        if (err?.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errText.message || 'Tải xuống thất bại!');
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

  downloadFile(file: any): void {
    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file để tải xuống!');
      return;
    }
    const fullPath = this.buildFullFilePath(file);
    const fileName = file.FileName || file.fileName || 'downloaded_file';
    if (!fullPath) {
      this.notification.error(
        'Thông báo',
        'Không xác định được đường dẫn file! (Có thể file mới chưa được upload lên server).'
      );
      return;
    }
    this.downloadFromServer(fullPath, fileName);
  }

  save() {
    if (this.form.invalid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const formValue = this.form.getRawValue();
    
    // Validate form dates
    if (!formValue.dateStart || !formValue.dateEnd) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      return;
    }

    if (new Date(formValue.dateEnd) < new Date(formValue.dateStart)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Ngày kết thúc phải lớn hơn ngày bắt đầu');
      return;
    }

    // Validate details - chỉ kiểm tra Description
    const details = this.tb_Detail?.getData() || this.ideaDetails;
    const invalidDetails = details.filter((d: any) => {
      if (!d.Description || d.Description.trim() === '') return true;
      return false;
    });

    if (invalidDetails.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin chi tiết');
      return;
    }
    const model = {
      ID: this.ideaId,
      EmployeeID: this.currentEmployeeId,
      HeadofDepartment: this.currentHeadofDepartment,
      DepartmentOrganizationID: formValue.departmentOrganizationID,
      RegisterIdeaTypeID: formValue.registerIdeaTypeID,
      RegisterIdeaDetails: details.map((d: any) => ({
        STT: d.STT,
        Category: d.Category,
        Description: d.Description,
        Note: d.Note || '',
        DateStart: formValue.dateStart,
        DateEnd: formValue.dateEnd,
      })),
      deletedFileIds: this.deletedFileIds.length > 0 ? this.deletedFileIds : null,
    };

    this.registerIdeaService.saveIdea(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          const ideaId = res.data?.id || this.ideaId;
          
          // Upload files if any
          const newFiles = this.files.filter((f: any) => f.file && !f.ID); // Chỉ upload file mới (có file object và ID = 0)

          if (newFiles.length > 0 && ideaId > 0) {
            const formData = new FormData();

            // Thêm từng file mới vào FormData
            newFiles.forEach((fileObj: any) => {
              formData.append('files', fileObj.file);
            });

            // key: để backend nhận biết loại tài liệu
            formData.append('key', 'RegisterIdeaFile');

            // subPath: Năm/RegisterID (lọc ký tự không hợp lệ trong đường dẫn)
            const year = new Date().getFullYear().toString();
            const registerIdStr = ideaId.toString();
            const sanitize = (s: string) =>
              s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
            const subPath = [sanitize(year), sanitize(registerIdStr)]
              .filter((x) => x)
              .join('/');

            formData.append('subPath', subPath);

            // Gọi API upload
            this.registerIdeaService.uploadFile(ideaId, this.currentEmployeeId, formData).subscribe({
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu ý tưởng');
      }
    });
  }

  close() {
    this.activeModal.close(false);
  }
}

