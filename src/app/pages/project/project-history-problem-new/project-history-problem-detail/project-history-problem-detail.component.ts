import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalRef, NzModalModule, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ProjectHistoryProblemNewService } from '../project-history-problem-service/project-history-problem-new.service';
import { AppUserService } from '../../../../services/app-user.service';

@Component({
  selector: 'app-project-history-problem-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzCardModule,
    NzTableModule
  ],
  templateUrl: './project-history-problem-detail.component.html',
  styleUrl: './project-history-problem-detail.component.css'
})
export class ProjectHistoryProblemDetailComponent implements OnInit {
  private nzModalData = inject(NZ_MODAL_DATA);
  data: any = null;

  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private projectHistoryProblemNewService = inject(ProjectHistoryProblemNewService);
  private appUserService = inject(AppUserService);

  form!: FormGroup;

  priorityOptions = [
    { label: 'Thấp', value: 1 },
    { label: 'Trung bình', value: 2 },
    { label: 'Cao', value: 3 },
    { label: 'Rất cao', value: 4 }
  ];

  statusOptions = [
    { label: 'Chờ xử lý', value: 1 },
    { label: 'Đang xử lý', value: 2 },
    { label: 'Đã xử lý', value: 3 }
  ];

  employeeOptions: { label: string, value: number }[] = [];
  departmentOptions: { label: string, value: number }[] = [];
  projectOptions: { label: string, value: number }[] = [];
  projectItemOptions: { label: string, value: number }[] = [];
  isProjectLocked: boolean = false;

  attachedFiles: any[] = [];

  issueLogTypeOptions = [
    { label: 'Khách hàng', value: 1 },
    { label: 'Nội bộ', value: 2 }
  ];

  ngOnInit(): void {
    this.data = this.nzModalData?.data || null;
    this.initForm();
    this.loadDropdowns();

    if (this.data) {
      if (this.data.ReceiverID && typeof this.data.ReceiverID === 'string') {
        try {
          this.data.ReceiverID = JSON.parse(this.data.ReceiverID);
        } catch { this.data.ReceiverID = []; }
      }
      if (this.data.TeamDepartment && typeof this.data.TeamDepartment === 'string') {
        try {
          this.data.TeamDepartment = JSON.parse(this.data.TeamDepartment);
        } catch { this.data.TeamDepartment = []; }
      }
      this.form.patchValue(this.data);
      if (this.data.ProjectID) {
        this.isProjectLocked = true;
        this.form.get('ProjectID')?.disable();
        // Load project items cho dropdown
        this.loadProjectItems(this.data.ProjectID);
      }
      // Load ảnh đính kèm đã có trên server
      if (this.data.ID && this.data.ID > 0) {
        this.loadExistingFiles(this.data.ID);
        this.loadLinkedProjectItems(this.data.ID);
      } else {
        this.form.patchValue({ CreatorID: this.appUserService.employeeID || null });
      }
    } else {
      this.form.patchValue({ CreatorID: this.appUserService.employeeID || null });
    }
  }

  loadExistingFiles(problemId: number): void {
    this.projectHistoryProblemNewService.getFiles(problemId).subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data) {
          this.attachedFiles = res.data.map((f: any) => ({
            fileName: f.FileName,
            fileSize: '',
            fileType: this.getFileType(f.FileName),
            file: null, // file cũ trên server, không có File object
            serverFile: true,
            id: f.ID
          }));
        }
      },
      error: () => { }
    });
  }

  loadDropdowns(): void {
    this.projectHistoryProblemNewService.getEmployees().subscribe((res: any) => {
      if (res.status === 1 && res.data) {
        this.employeeOptions = res.data.map((x: any) => ({ label: `${x.Code} - ${x.FullName}`, value: x.ID }));
      }
    });

    this.projectHistoryProblemNewService.getDepartments().subscribe((res: any) => {
      if (res.status === 1 && res.data) {
        this.departmentOptions = res.data.map((x: any) => ({ label: x.Name, value: x.ID }));
      }
    });

    this.projectHistoryProblemNewService.getProjects().subscribe((res: any) => {
      if (res.status === 1 && res.data) {
        this.projectOptions = res.data.map((x: any) => ({ label: `${x.ProjectCode} - ${x.ProjectName}`, value: x.ID }));
      }
    });
  }

  loadProjectItems(projectID: number): void {
    this.projectHistoryProblemNewService.getProjectItems(projectID).subscribe((res: any) => {
      if (res.status === 1 && res.data) {
        this.projectItemOptions = res.data.map((x: any) => ({
          label: `${x.Code || ''} - ${x.Mission || ''}`,
          value: x.ID
        }));
      }
    });
  }

  loadLinkedProjectItems(problemId: number): void {
    this.projectHistoryProblemNewService.getDataHistoryProblemDetail(problemId).subscribe((res: any) => {
      if (res.status === 1 && res.data) {
        const linkedIds = Array.isArray(res.data.dtProjectItemLink)
          ? res.data.dtProjectItemLink.map((x: any) => x.ID)
          : [];
        this.form.patchValue({ ProjectItemIds: linkedIds }, { emitEvent: false });
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      ProjectID: [null, [Validators.required]],
      TeamDepartment: [[], [Validators.required]],
      IssueLogType: [null, [Validators.required]],

      ContentError: [null, [Validators.required]],
      Reason: [null],
      Remedies: [null],
      IssueConclusion: [null],

      DateProblem: [null, [Validators.required]],
      DateImplementation: [null],

      CreatorID: [null, [Validators.required]],
      PerformerID: [null, [Validators.required]],
      EmployeeID: [null],
      PIC: [null, [Validators.required]],
      ReceiverID: [[], [Validators.required]],

      PriorityLevel: [null, [Validators.required]],
      StatusProblem: [null, [Validators.required]],

      ProjectItemIds: [[]],

      IsApproved_PM: [{ value: false, disabled: true }],
      IsApproved_TP: [{ value: false, disabled: true }],
      IsApproved_PP: [{ value: false, disabled: true }]
    });

    // Khi thay đổi ProjectID, load lại dropdown project items và xóa sạch các item đã chọn cũ
    this.form.get('ProjectID')?.valueChanges.subscribe((projectId: number) => {
      // Reset các item đã chọn về rỗng vì chúng thuộc project cũ (hoặc chưa có project)
      this.form.get('ProjectItemIds')?.setValue([], { emitEvent: false });

      if (projectId && projectId > 0) {
        this.loadProjectItems(projectId);

        // Tự động Gợi ý chọn các trưởng dự án (IsLeader = true) vào Người tiếp nhận khi THÊM MỚI
        if (!this.data?.ID) {
          this.projectHistoryProblemNewService.getEmployeeSuggest(projectId).subscribe((res: any) => {
            if (res && (res.isSuccess || res.status === 1) && res.data) {
              const leaders = res.data
                .filter((x: any) => x.IsLeader === true || x.isLeader === true)
                .map((x: any) => x.EmployeeID || x.employeeId);

              if (leaders && leaders.length > 0) {
                // Binding leaders vào form
                this.form.patchValue({ ReceiverID: leaders });
              } else {
                 // Nếu không có leader, có thể xóa rỗng hoặc để nguyên
                 this.form.patchValue({ ReceiverID: [] });
              }
            }
          });
        }
      } else {
        this.projectItemOptions = [];
      }
    });

    this.form.get('ReceiverID')?.valueChanges.subscribe((employeeIds: number[]) => {
      if (employeeIds && employeeIds.length > 0) {
        this.projectHistoryProblemNewService.getDepartmentByEmployees(employeeIds).subscribe((res: any) => {
          if (res.status === 1) {
            const deptIds = res.data || [];
            this.form.patchValue({ TeamDepartment: deptIds }, { emitEvent: false });
          }
        });
      } else {
        this.form.patchValue({ TeamDepartment: [] }, { emitEvent: false });
      }
    });
  }

  submitForm(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const isNew = (!formValue.ID || formValue.ID === 0);
      const payloadItem = this.mapFormDataToApi(formValue);

      const payload = [{
        projectHistoryProblem: payloadItem,
        receiverIds: formValue.ReceiverID || [],
        projectItemIds: formValue.ProjectItemIds || [],
        deleteIdsMaster: []
      }];

      this.projectHistoryProblemNewService.saveData(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            const savedId = res.data?.id || res.data?.ID || formValue.ID;
            if (this.attachedFiles.length > 0 && savedId > 0) {
              this.uploadFiles(savedId);
            }
            
            // Gửi mail khi thêm mới
            if (isNew && savedId > 0) {
              this.projectHistoryProblemNewService.sendEmailProblem(savedId).subscribe();
            }
            
            this.message.success('Lưu dữ liệu thành công!');
            this.modalRef.close(true);
          } else {
            this.message.error(res.message || 'Lỗi khi lưu dữ liệu!');
          }
        },
        error: (err: any) => {
          console.error(err);
          this.message.error('Có lỗi xảy ra khi lưu!');
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng điền đủ thông tin bắt buộc');
    }
  }

  mapFormDataToApi(item: any): any {
    return {
      ID: item.ID && item.ID > 0 ? item.ID : 0,
      ProjectID: item.ProjectID,
      STT: item.STT || 1,
      IssueLogType: item.IssueLogType ? item.IssueLogType.toString() : '',
      ContentError: item.ContentError || '',
      Reason: item.Reason || '',
      Remedies: item.Remedies || '',
      IssueConclusion: item.IssueConclusion || '',
      DateProblem: item.DateProblem || null,
      DateImplementation: item.DateImplementation || null,
      PIC: item.PIC || '',
      EmployeeID: item.EmployeeID || null,
      CreatorID: item.CreatorID || null,
      PerformerID: item.PerformerID || null,
      PriorityLevel: item.PriorityLevel || null,
      StatusProblem: item.StatusProblem || null,
      IsDeleted: item.IsDeleted || false,
    };
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        if (!fileObj.type.startsWith('image/')) {
          this.message.error(`${fileObj.name} không phải file ảnh!`);
          return;
        }
        if (fileObj.size > MAX_FILE_SIZE) {
          this.message.error(`File ${fileObj.name} vượt quá 50MB!`);
          return;
        }
        this.attachedFiles = [...this.attachedFiles, {
          fileName: fileObj.name,
          fileSize: this.formatFileSize(fileObj.size),
          fileType: this.getFileType(fileObj.name),
          file: fileObj
        }];
      });
    }
  }

  removeFile(index: number): void {
    this.attachedFiles = this.attachedFiles.filter((_, i) => i !== index);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }

  uploadFiles(problemId: number): void {
    const newFiles = this.attachedFiles.filter((f: any) => f.file);
    if (newFiles.length === 0) return;

    const formData = new FormData();
    newFiles.forEach((fileObj: any) => {
      formData.append('files', fileObj.file);
    });
    formData.append('key', 'TuanBeoTest');

    this.projectHistoryProblemNewService.uploadFiles(formData, problemId, 1).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const uploaded = response.data as any[];
          this.message.success(`${uploaded.length} file đã được tải lên!`);
        } else {
          this.message.error(response.message || 'Upload file thất bại!');
        }
      },
      error: (err: any) => {
        console.error('Upload error:', err);
        this.message.error('Lỗi khi upload file!');
      }
    });
  }

  destroyModal(): void {
    this.modalRef.close();
  }
}
