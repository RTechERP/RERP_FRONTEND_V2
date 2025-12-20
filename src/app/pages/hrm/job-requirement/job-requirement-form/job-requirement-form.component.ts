import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HandoverService } from '../../handover/handover-service/handover.service';
import { AuthService } from '../../../../auth/auth.service';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { DateTime } from 'luxon';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

@Component({
  selector: 'app-job-requirement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzModalModule,
    NzSplitterModule,
    NzCheckboxModule,
    NzSelectModule,
    NzDatePickerModule,
    NzGridModule,
    NzUploadModule,
  ],
  templateUrl: './job-requirement-form.component.html',
  styleUrl: './job-requirement-form.component.css'
})
export class JobRequirementFormComponent implements OnInit, AfterViewInit {
  @Input() JobRequirementID: number = 0;
  @Input() dataInput: any;
  @Input() isCheckmode: boolean = false;

  @ViewChild('jobRequirementDetailTable', { static: false }) tableRef!: ElementRef;
  @ViewChild('jobRequirementFileTable', { static: false }) fileTableRef!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  formGroup: FormGroup;
  cbbEmployeeGroup: any[] = [];
  dataDepartment: any[] = [];
  cbbEmployee: any;
  jobRequirementDetailData: any[] = [];
  jobRequirementDetailTable: Tabulator | null = null;
  jobRequirementFileData: any[] = [];
  jobRequirementFileTable: Tabulator | null = null;
  fileList: any[] = [];
  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private handoverService: HandoverService,
    private authService: AuthService,
    private jobRequirementService: JobRequirementService,
    private message: NzMessageService,
    private notification: NzNotificationService,
  ) {
    this.formGroup = this.fb.group({
      STT: 0,
      NameDocument: [null, [Validators.required, Validators.maxLength(100)]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      DepartmentID: ['', [Validators.required]],
      EmployeeDepartment: ['', [Validators.required]],
      RequiredDepartment: ['', [Validators.required]],
      CoordinationDepartment: ['', [Validators.required]],
      EmployeeID: ['', [Validators.required]],
      DateRequest: ['', [Validators.required]],
      DatePromulgate: ['', [Validators.required]],
      DateEffective: ['', [Validators.required]],
      SignedEmployeeID: [0],
      AffectedScope: [''],
      GroupType: 1,
      IsPromulgated: [false],
      IsOnWeb: [false],
    });
  }

  ngOnInit(): void {
    this.getdataEmployee();
    this.getdataDepartment();
    this.setDefaultRows();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawJobRequirementDetailTable();
      this.drawJobRequirementFileTable();
    }, 100);
  }
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };
  closeModal() {
    this.activeModal.close(true);
  }
  onSelectEmployee(employeeID: number): void {
    if (!employeeID) {
      this.formGroup.patchValue({
        EmployeeID: null,
        EmployeeDepartment: null,
      });
      return;
    }
    const selected = this.cbbEmployee.find((e: any) => e.ID === employeeID);
    if (selected) {
      this.formGroup.patchValue({
        EmployeeID: selected.ID,
        EmployeeDepartment: selected.DepartmentID || null
      });
    }
  }
  getdataEmployee() {
    this.handoverService.getAllEmployee().subscribe((response: any) => {
      const data = response.data || [];
      this.cbbEmployee = data;

      const groupMap = new Map<string, any[]>();
      data.forEach((item: any) => {
        if (!groupMap.has(item.DepartmentName)) {
          groupMap.set(item.DepartmentName, []);
        }
        groupMap.get(item.DepartmentName)?.push(item);
      });

      this.cbbEmployeeGroup = Array.from(
        groupMap,
        ([department, employees]) => ({
          department,
          employees,
        })
      );
    });
  }

  getdataDepartment() {
    this.handoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  setDefaultRows() {
    this.jobRequirementDetailData = [
      { STT: 1, Category: 'Nội dung yêu cầu', Description: '', Target: '', Note: '' },
      { STT: 2, Category: 'Người yêu cầu', Description: '', Target: '', Note: '' },
      { STT: 3, Category: 'Lý do', Description: '', Target: '', Note: '' },
      { STT: 4, Category: 'Số lượng', Description: '', Target: '', Note: '' },
      { STT: 5, Category: 'Chất lượng', Description: '', Target: '', Note: '' },
      { STT: 6, Category: 'Địa điểm', Description: '', Target: '', Note: '' },
      { STT: 7, Category: 'Thời gian hoàn thành đề nghị', Description: '', Target: '', Note: '' },
    ];
  }

  drawJobRequirementDetailTable(): void {
    if (!this.tableRef) {
      return;
    }

    if (this.jobRequirementDetailTable) {
      this.jobRequirementDetailTable.setData(this.jobRequirementDetailData);
    } else {
      this.jobRequirementDetailTable = new Tabulator(
        this.tableRef.nativeElement,
        {
          ...DEFAULT_TABLE_CONFIG,
          data: this.jobRequirementDetailData,
          layout: 'fitDataStretch',
          height: '100%',
          rowHeader:false,
          pagination:false,
          paginationMode: 'local',
          headerSort:false,
          columns: [
            {
              title: 'STT',
              field: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 40,
              headerSort:false,
            },
            {
              title: 'Đề mục',
              field: 'Category',
              headerHozAlign: 'center',
              headerSort:false,
              width: 150,
            },
            {
              title: 'Diễn giải',
              field: 'Description',
              headerHozAlign: 'center',
              editor: 'textarea',
              formatter: 'textarea',
              width: 200,
              headerSort:false,
            },
            {
              title: 'Mục tiêu cần đạt',
              field: 'Target',
              headerHozAlign: 'center',
              editor: 'textarea',
              formatter: 'textarea',
              width: 200,
              headerSort:false,
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              editor: 'textarea',
              formatter: 'textarea',
              headerSort:false,
            },
          ],
        }
      );
    }
  }

  getSubPath(): string {
    const dateRequest = this.formGroup.get('DateRequest')?.value;
    const code = this.formGroup.get('Code')?.value || '';
    
    if (!dateRequest) {
      return '';
    }

    const date = DateTime.fromISO(dateRequest);
    const year = date.year;
    const month = date.month;
    const day = date.day;
    
    const yearStr = `NĂM ${year}`;
    const monthStr = `THÁNG ${month}.${year}`;
    const dayStr = `${day}.${month}.${year}`;
    const codeStr = code || 'NEW';
    
    return `${yearStr}\\YÊU CẦU CÔNG VIỆC\\${monthStr}\\${dayStr}\\${codeStr}`;
  }

  beforeUpload = (file: any): boolean => {
    // Kiểm tra file trùng
    const isDuplicate = this.fileList.some(
      f => f.name === file.name && f.size === file.size
    );

    if (isDuplicate) {
      this.notification.warning('Thông báo', `File "${file.name}" đã tồn tại trong danh sách!`);
      return false;
    }

    const newFile = {
      uid: Math.random().toString(36).substring(2) + Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'new',
      originFile: file,
      FileName: '',
      FilePath: '',
      FileNameOrigin: file.name,
      IsUploaded: false,
    };

    this.fileList = [...this.fileList, newFile];
    this.updateFileTable();
    return false;
  };

  updateFileTable() {
    if (!this.jobRequirementFileTable) return;
    
    const active = (this.fileList || []).filter(
      (f: any) => !f.isDeleted && !f.IsDeleted
    );

    const rows = active.map((f: any, i: number) => ({
      ID: f.ID || i + 1,
      FileNameOrigin: f.FileNameOrigin || f.name,
      FileName: f.FileName || '',
      FilePath: f.FilePath || '',
      IsUploaded: f.IsUploaded || false,
      File: f.originFile || f.File,
      file: f,
      uid: f.uid,
    }));

    this.jobRequirementFileTable.setData(rows);
  }


  uploadFile(fileRecord: any): void {
    const file = fileRecord.File || fileRecord.originFile || fileRecord.file?.originFile;
    
    if (!file) {
      this.notification.warning('Thông báo', 'File không tồn tại!');
      return;
    }

    const subPath = this.getSubPath();
    
    if (!subPath) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin (Ngày yêu cầu và Mã) trước khi upload file!');
      return;
    }

    const loadingMsg = this.message.loading(`Đang tải lên ${fileRecord.FileNameOrigin || fileRecord.name}...`, {
      nzDuration: 0,
    }).messageId;

    this.jobRequirementService.uploadMultipleFiles([file], subPath).subscribe({
      next: (res) => {
        this.message.remove(loadingMsg);

        if (res?.status === 1 && res?.data?.length > 0) {
          const uploadedFile = res.data[0];
          
          // Tìm và cập nhật file trong fileList
          const fileIndex = this.fileList.findIndex(f => f.uid === fileRecord.uid);
          if (fileIndex !== -1) {
            this.fileList[fileIndex].FileName = uploadedFile.SavedFileName || uploadedFile.FileName;
            this.fileList[fileIndex].FilePath = uploadedFile.FilePath;
            this.fileList[fileIndex].IsUploaded = true;
            this.fileList[fileIndex].status = 'done';
          }

          this.updateFileTable();
          this.notification.success('Thành công', `Upload ${fileRecord.FileNameOrigin || fileRecord.name} hoàn tất!`);
        } else {
          this.notification.error('Lỗi', res?.message || 'Upload file thất bại!');
        }
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error('Lỗi', err?.error?.message || 'Upload file thất bại!');
      },
    });
  }

  uploadAllFiles(): void {
    const filesToUpload = this.jobRequirementFileData.filter(f => f.File && !f.IsUploaded);
    
    if (filesToUpload.length === 0) {
      this.notification.info('Thông báo', 'Không có file nào cần upload!');
      return;
    }

    filesToUpload.forEach(fileRecord => {
      this.uploadFile(fileRecord);
    });
  }


  downloadFile(file: any): void {
    if (!file.FilePath) {
      this.notification.warning('Thông báo', 'File chưa được upload, vui lòng upload trước khi tải xuống!');
      return;
    }

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.jobRequirementService.downloadFile(file.FilePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
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
        this.notification.error('Thông báo', err?.error?.message || 'Tải xuống thất bại!');
      },
    });
  }

  deleteFileByRecord(fileRecord: any): void {
    // Xóa từ fileList
    if (fileRecord.uid) {
      const fileIndex = this.fileList.findIndex(f => f.uid === fileRecord.uid);
      if (fileIndex !== -1) {
        this.fileList[fileIndex].isDeleted = true;
      }
    } else {
      // Fallback: xóa theo ID nếu không có uid
      this.fileList = this.fileList.filter(f => f.ID !== fileRecord.ID);
    }
    
    this.updateFileTable();
    this.notification.success('Thông báo', 'Đã xóa file!');
  }

  onDeleteFile(): void {
    const selectedRows = this.jobRequirementFileTable?.getSelectedData() || [];
    
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file để xóa!');
      return;
    }

    const fileToDelete = selectedRows[0];
    this.deleteFileByRecord(fileToDelete);
  }

  drawJobRequirementFileTable(): void {
    if (!this.fileTableRef) {
      return;
    }

    if (this.jobRequirementFileTable) {
      this.updateFileTable();
    } else {
      this.jobRequirementFileTable = new Tabulator(
        this.fileTableRef.nativeElement,
        {
          ...DEFAULT_TABLE_CONFIG,
          data: [],
          layout: 'fitDataStretch',
          height: '100%',
          pagination:false,
          paginationMode: 'local',
          selectableRows: 1,
          rowHeader: false,
          rowContextMenu: (e: any, row: any) => {
            const rowData = row.getData();
            const menu: any[] = [];

            if (rowData.File && !rowData.IsUploaded) {
              menu.push({
                label: 'Upload',
                action: () => {
                  this.uploadFile(rowData);
                }
              });
            }

            if (rowData.IsUploaded && rowData.FilePath) {
              menu.push({
                label: 'Tải xuống',
                action: () => {
                  this.downloadFile(rowData);
                }
              });
            }

            menu.push({
              label: 'Xóa',
              action: () => {
                this.onDeleteFile();
              }
            });

            return menu;
          },
          columns: [
            {
              title: 'ID',
              field: 'ID',
              hozAlign: 'center',
              headerHozAlign: 'center',
              visible: false,
            },
            {
              title: '',
              field: 'action',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 50,
              resizable: false,
              formatter: () => {
                return '<i class="fas fa-trash text-danger cursor-pointer" style="font-size: 16px;" title="Xóa file"></i>';
              },
              cellClick: (e: any, cell: any) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('fa-trash') || target.closest('.fa-trash')) {
                  const rowData = cell.getRow().getData();
                  this.deleteFileByRecord(rowData);
                }
              }
            },
            {
              title: 'Tên file',
              hozAlign: 'left',
              headerHozAlign: 'center',
              field: 'FileNameOrigin',
              formatter: 'textarea',
              resizable: false,
            
            },
          
          ],
        }
      );

      this.jobRequirementFileTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.downloadFile(rowData);
      });
    }
  }

  saveData() {
    // TODO: Implement save logic
  }
}
