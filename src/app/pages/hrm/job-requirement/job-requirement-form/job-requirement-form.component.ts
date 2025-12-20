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
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { DateTime } from 'luxon';

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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  formGroup: FormGroup;
  cbbEmployeeGroup: any[] = [];
  dataDepartment: any[] = [];
  cbbEmployee: any;
  jobRequirementDetailData: any[] = [];
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
    const today = DateTime.now().toFormat('yyyy-MM-dd');
    
    this.formGroup = this.fb.group({
      STT: 0,
      NameDocument: [null, [Validators.maxLength(100)]],
      Code: ['', [Validators.maxLength(100)]],
      DepartmentID: ['', [Validators.required]],
      EmployeeDepartment: [''],
      RequiredDepartment: ['', [Validators.required]],
      CoordinationDepartment: [''],
      EmployeeID: ['', [Validators.required]],
      DateRequest: [today, [Validators.required]],
      DeadlineRequest: [today, [Validators.required]],
      DatePromulgate: [''],
      DateEffective: [''],
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
    
    // Subscribe to DeadlineRequest changes to update Description of STT 7
    this.formGroup.get('DeadlineRequest')?.valueChanges.subscribe((value) => {
      if (value) {
        const dt = DateTime.fromFormat(value, 'yyyy-MM-dd');
        if (dt.isValid) {
          const formattedDate = dt.toFormat('dd/MM/yyyy');
          const row7 = this.jobRequirementDetailData.find((row: any) => row.STT === 7);
          if (row7 && row7.Category === 'Thời gian hoàn thành đề nghị') {
            row7.Description = formattedDate;
          }
        }
      }
    });
    
    this.setDefaultRows();
  }

  ngAfterViewInit(): void {
    // No longer needed with HTML tables
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
    const today = DateTime.now().toFormat('dd/MM/yyyy');
    const deadlineRequest = this.formGroup?.get('DeadlineRequest')?.value || today;
    const deadlineFormatted = deadlineRequest 
      ? (DateTime.fromFormat(deadlineRequest, 'yyyy-MM-dd').isValid 
          ? DateTime.fromFormat(deadlineRequest, 'yyyy-MM-dd').toFormat('dd/MM/yyyy')
          : today)
      : today;
    
    this.jobRequirementDetailData = [
      { STT: 1, Category: 'Nội dung yêu cầu', Description: '', Target: '', Note: '' },
      { STT: 2, Category: 'Người yêu cầu', Description: '', Target: '', Note: '' },
      { STT: 3, Category: 'Lý do', Description: '', Target: '', Note: '' },
      { STT: 4, Category: 'Số lượng', Description: '', Target: '', Note: '' },
      { STT: 5, Category: 'Chất lượng', Description: '', Target: '', Note: '' },
      { STT: 6, Category: 'Địa điểm', Description: '', Target: '', Note: '' },
      { STT: 7, Category: 'Thời gian hoàn thành đề nghị', Description: deadlineFormatted, Target: '', Note: '' },
    ];
  }

  onlyNumberKey(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumber(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericValue = pastedText.replace(/[^0-9]/g, '');
    const target = event.target as HTMLInputElement;
    if (target && numericValue) {
      const row4 = this.jobRequirementDetailData.find((row: any) => row.Category === 'Số lượng');
      if (row4) {
        row4.Description = numericValue;
      }
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
    return false;
  };

  getActiveFiles(): any[] {
    return (this.fileList || []).filter(
      (f: any) => !f.isDeleted && !f.IsDeleted
    );
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
    const filesToUpload = this.fileList.filter(f => f.originFile && !f.IsUploaded && !f.isDeleted && !f.IsDeleted);
    
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
    
    this.notification.success('Thông báo', 'Đã xóa file!');
  }

  async saveData() {
    // Validate form
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    // Upload tất cả file chưa upload
    const filesToUpload = this.fileList.filter(f => f.originFile && !f.IsUploaded && !f.isDeleted && !f.IsDeleted);
    
    if (filesToUpload.length > 0) {
      const loadingMsg = this.message.loading('Đang upload files...', { nzDuration: 0 }).messageId;
      
      try {
        // Upload từng file
        for (const fileRecord of filesToUpload) {
          await this.uploadFileAsync(fileRecord);
        }
        this.message.remove(loadingMsg);
      } catch (error) {
        this.message.remove(loadingMsg);
        this.notification.error('Lỗi', 'Upload file thất bại! Vui lòng thử lại.');
        return;
      }
    }

    // Prepare payload
    const formValue = this.formGroup.value;
    const payload = {
      ID: this.JobRequirementID || 0,
      NumberRequest: '',
      DateRequest: formValue.DateRequest ? DateTime.fromFormat(formValue.DateRequest, 'yyyy-MM-dd').toISO() : null,
      DeadlineRequest: formValue.DeadlineRequest ? DateTime.fromFormat(formValue.DeadlineRequest, 'yyyy-MM-dd').toISO() : null,
      EmployeeID: formValue.EmployeeID || 0,
      CoordinationDepartmentID: formValue.CoordinationDepartment || 0,
      RequiredDepartmentID: formValue.RequiredDepartment || 0,
      ApprovedTBPID: formValue.DepartmentID || 0,
      IsApprovedTBP: false,
      DateApprovedTBP: null,
      IsApprovedHR: false,
      DateApprovedHR: null,
      ApprovedHRID: null,
      IsApprovedBGD: false,
      DateApprovedBGD: null,
      ApprovedBGDID: null,
      EvaluateCompletion: '',
      IsDeleted: false,
      CreatedBy: '',
      CreatedDate: new Date().toISOString(),
      UpdatedBy: '',
      UpdatedDate: new Date().toISOString(),
      IsRequestBuy: false,
      Status: 0,
      Note: '',
      IsRequestBGDApproved: false,
      IsRequestPriceQuote: false,
      JobRequirementDetails: this.jobRequirementDetailData.map((item: any) => ({
        ID: item.ID || 0,
        JobRequirementID: this.JobRequirementID || 0,
        STT: item.STT || 0,
        Category: item.Category || '',
        Description: item.Description || '',
        Target: item.Target || '',
        Note: item.Note || '',
        IsDeleted: false
      })),
      JobRequirementFiles: this.fileList
        .filter(f => f.IsUploaded && !f.isDeleted && !f.IsDeleted)
        .map((file: any) => ({
          ID: file.ID || 0,
          JobRequirementID: this.JobRequirementID || 0,
          FileName: file.FileName || '',
          FilePath: file.FilePath || '',
          ServerPath: this.getServerPathFromFilePath(file.FilePath) || '',
          OriginPath: '',
          IsDeleted: false
        }))
    };

    // Save data
    const savingMsg = this.message.loading('Đang lưu dữ liệu...', { nzDuration: 0 }).messageId;
    
    this.jobRequirementService.saveDataJobRequirement(payload).subscribe({
      next: (response: any) => {
        this.message.remove(savingMsg);
        if (response && response.status === 1) {
          this.notification.success('Thành công', 'Lưu phiếu yêu cầu công việc thành công!');
          this.closeModal();
        } else {
          this.notification.error('Lỗi', response?.message || 'Lưu dữ liệu thất bại!');
        }
      },
      error: (error: any) => {
        this.message.remove(savingMsg);
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
        this.notification.error('Lỗi', `Lưu dữ liệu thất bại: ${errorMessage}`);
      }
    });
  }

  private getServerPathFromFilePath(filePath: string): string {
    if (!filePath) return '';
    // FilePath format: "path\to\file\filename.ext"
    // ServerPath should be: "path\to\file"
    const lastSlashIndex = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
    if (lastSlashIndex > 0) {
      return filePath.substring(0, lastSlashIndex);
    }
    return '';
  }

  private uploadFileAsync(fileRecord: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fileRecord.File || fileRecord.originFile || fileRecord.file?.originFile;
      
      if (!file) {
        reject(new Error('File không tồn tại!'));
        return;
      }

      const subPath = this.getSubPath();
      
      if (!subPath) {
        reject(new Error('Vui lòng điền đầy đủ thông tin (Ngày yêu cầu và Mã) trước khi upload file!'));
        return;
      }

      this.jobRequirementService.uploadMultipleFiles([file], subPath).subscribe({
        next: (res) => {
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
            resolve();
          } else {
            reject(new Error(res?.message || 'Upload file thất bại!'));
          }
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
