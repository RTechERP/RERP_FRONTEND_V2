import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { ProjectService } from '../../project-service/project.service';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-project-surver-result',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzFormModule,
    NzDatePickerModule,
    NzModalModule,
    NzUploadModule,
  ],
  providers: [NzModalService],
  templateUrl: './project-surver-result.component.html',
  styleUrl: './project-surver-result.component.css',
})
export class ProjectSurverResultComponent implements OnInit, AfterViewInit {
  @Input() projectSurveyDetailId: number = 0;
  @Input() projectSurveyId: number = 0;
  @Input() projectId: number = 0;
  @Input() projectTypeId: number = 0;
  @Input() employeeID: number = 0;
  @Input() projects: any[] = [];
  @Input() employees: any[] = [];

  @ViewChild('tb_projectSurveyFile', { static: false })
  tb_projectSurveyFileElement!: ElementRef;
  
  private tb_projectSurveyFile!: Tabulator;

  // Form
  form!: FormGroup;

  // Form data
  fileListResult: any[] = [];
  fileDeletedIds: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private modal: NzModalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDetail();
  }

  initForm(): void {
    this.form = this.fb.group({
      employeeIdResult: [{ value: this.employeeID || 0, disabled: true }],
      dateResult: [{ value: DateTime.local().toISO(), disabled: true }],
      result: ['', [Validators.required, this.trimRequiredValidator]],
    });
  }

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0)
      return { required: true };
    return null;
  };

  // Getters for form controls
  get employeeIdResultControl() {
    return this.form.get('employeeIdResult');
  }

  get dateResultControl() {
    return this.form.get('dateResult');
  }

  get resultControl() {
    return this.form.get('result');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_projectSurveyFileElement?.nativeElement) {
        this.drawTbProjectSurveyFile(this.tb_projectSurveyFileElement.nativeElement);
      }
    }, 100);
  }

  loadDetail(): void {
    if (this.projectSurveyDetailId > 0) {
      let data = {
        projectSurveyDetailId: this.projectSurveyDetailId,
      };
      this.projectService.getDetailByid(data).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            // Fill form data
            const employeeId = response.data.detail?.EmployeeID || 0;
            const dateSurvey = response.data.detail?.DateSurvey
              ? DateTime.fromJSDate(new Date(response.data.detail.DateSurvey)).toISO()
              : DateTime.local().toISO();
            const result = response.data.detail?.Result || '';

            this.form.patchValue({
              employeeIdResult: employeeId,
              dateResult: dateSurvey,
              result: result,
            });

            // Load files
            const files = response.data.files || [];
            this.fileListResult = files.map((file: any) => ({
              uid: Math.random().toString(36).substring(2) + Date.now(),
              name: file.FileName || '',
              size: 0,
              type: '',
              status: 'done',
              originFile: null,
              FileName: file.FileName || '',
              ServerPath: file.ServerPath || '',
              OriginName: file.FileName || '',
              ID: file.ID || 0,
            }));

            // Update table
            if (this.tb_projectSurveyFile) {
              this.updateFileTable();
            }
          }
        },
        error: (error: any) => {
          console.error('Lỗi:', error);
          this.notification.error(
            'Thông báo',
            'Không tìm thấy nội dung kết quả khảo sát!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        },
      });
    }
  }

  closeModal() {
    this.resetForm();
    this.activeModal.close({ success: true });
  }

  resetForm() {
    this.fileDeletedIds = [];
    this.fileListResult = [];
    this.form.reset();
    this.initForm();
  }

  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const result = formValue.result || '';

    // Upload file mới trước (nếu có) để lấy ServerPath
    const filesToUpload: File[] = this.fileListResult
      .filter((f) => f.originFile && !f.ServerPath)
      .map((f) => f.originFile as File);
    
    const subPath = this.getSubPath();
    
    // Nếu có file mới cần upload
    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.projectService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.data?.length > 0) {
            // Cập nhật ServerPath vào fileListResult sau khi upload thành công
            let fileIndex = 0;
            this.fileListResult.forEach((f) => {
              if (f.originFile && !f.ServerPath && res.data[fileIndex]) {
                f.ServerPath = res.data[fileIndex].FilePath;
                fileIndex++;
              }
            });
          }
          
          // Sau khi upload xong, gọi save như cũ
          this.callSaveProjectSurveyResultApi(result);
        },
        error: (error: any) => {
          console.error('Lỗi upload file:', error);
          this.notification.error(
            'Thông báo',
            'Upload file thất bại. Vui lòng thử lại!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        }
      });
    } else {
      // Không có file mới, save trực tiếp
      this.callSaveProjectSurveyResultApi(result);
    }
  }

  callSaveProjectSurveyResultApi(result: string): void {
    // Giữ nguyên logic save cũ với FormData
    const formData = new FormData();
    let data = this.projects.find((p: any) => p.ID === this.projectId);
    let year = data?.CreatedDate ? new Date(data.CreatedDate).getFullYear() : new Date().getFullYear();

    // Append files
    this.fileListResult.forEach((f) => {
      if (f.originFile) {
        formData.append('files', f.originFile as File, f.name);
      }
    });

    formData.append('projectSurveyId', `${this.projectSurveyId}`);
    formData.append('projectTypeId', `${this.projectTypeId}`);
    formData.append('result', result);
    formData.append('projectSurveyDetailId', `${this.projectSurveyDetailId}`);
    formData.append('projectId', `${this.projectId}`);

    this.projectService.saveProjectSurveyResult(formData).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            'Đã lưu kết quả khảo sát!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          this.closeModal();
        } else {
          this.notification.error(
            'Thông báo',
            response.message || 'Không thể lưu kết quả khảo sát!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        }
      },
      error: (error: any) => {
        console.error('Lỗi:', error);
        this.notification.error(
          'Thông báo',
          `Lỗi lưu kết quả khảo sát!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
      },
    });
  }

  getSubPath(): string {
    if (this.projects != null && this.projects.length > 0) {
      const project = this.projects.find((p: any) => p.ID === this.projectId);
      if (project && project.CreatedDate && project.ProjectCode) {
        const year = new Date(project.CreatedDate).getFullYear();
        return `${year}\\${project.ProjectCode}\\KetQuaKhaoSat`;
      }
    }
    return '';
  }

  beforeUpload = (file: any): boolean => {
    // Check duplicate
    const isDuplicate = this.fileListResult.some(f => 
      f.name === file.name && f.size === file.size
    );
    
    if (isDuplicate) {
      console.warn('File đã tồn tại:', file.name);
      return false;
    }
    
    const newFile = {
      uid: Math.random().toString(36).substring(2) + Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'new',
      originFile: file,
      FileName: file.name,
      ServerPath: '',
      OriginName: file.name,
      ID: 0,
    };
    this.fileListResult = [...this.fileListResult, newFile];
    this.updateFileTable();
    return false;
  };

  updateFileTable() {
    if (this.tb_projectSurveyFile) {
      // Clear table trước
      this.tb_projectSurveyFile.clearData();
      
      const activeFiles = this.fileListResult.filter(
        (file: any) => !file.isDeleted && !file.IsDeleted
      );
  
      const fileData = activeFiles.map((file: any) => ({
        ID: file.ID || 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        file: file,
      }));
      
      this.tb_projectSurveyFile.addData(fileData);
    }
  }

  drawTbProjectSurveyFile(container: HTMLElement) {
    if (this.tb_projectSurveyFile) {
      try {
        this.tb_projectSurveyFile.destroy();
      } catch (e) {
        console.warn('Lỗi khi destroy bảng cũ:', e);
      }
    }
    
    this.tb_projectSurveyFile = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      rowHeader: false,
      pagination: false,
      data: this.fileListResult.map((file: any) => ({
        ID: file.ID || 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        file: file,
      })),
      placeholder: 'Chưa có file đính kèm',
      columns: [
        {
          title: '',
          headerHozAlign: 'center',
          headerSort: false,
          width: 50,
          frozen: true,
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted && data['ID'] <= 0
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fileName = data['FileName'];
            if (id > 0) return;
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa file`,
              nzContent: `${fileName}?`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.fileDeletedIds.includes(id))
                    this.fileDeletedIds.push(id);
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                } else {
                  this.fileListResult = this.fileListResult.filter(
                    (f) => f.name !== fileName
                  );
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                }
              },
            });
          },
          hozAlign: 'center',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          headerHozAlign: 'center',
          widthGrow: 1,
          formatter: 'textarea',
        },
      ],
    });
  }
}
