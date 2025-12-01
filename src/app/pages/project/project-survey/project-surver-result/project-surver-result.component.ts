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
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProjectSurveyService } from '../project-survey-service/project-survey.service';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { AuthService } from '../../../../auth/auth.service';
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
  @Input() canEdit: boolean = true;

  @ViewChild('tb_projectSurveyFile', { static: false })
  tb_projectSurveyFileElement!: ElementRef;
  
  private tb_projectSurveyFile!: Tabulator;

  // Form
  form!: FormGroup;

  // Form data
  fileListResult: any[] = [];
  fileDeletedIds: any[] = [];
  canSave: boolean = false;
  currentUser: any = null;
  selectedFileData: any = null;
  
  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private projectSurveyService: ProjectSurveyService,
    private modal: NzModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private message: NzMessageService
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


  downloadFile() {
    // Sử dụng selectedFileData nếu có (từ table selection), nếu không thì lấy từ fileListResult
    const file = this.selectedFileData || (this.fileListResult && this.fileListResult.length > 0 ? this.fileListResult[0] : null);

    if (!file) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    const filePath = file.FilePath || file.ServerPath;
    if (!filePath) {
      this.notification.error('Thông báo', 'Không có đường dẫn file để tải xuống!');
      return;
    }

    // Hiển thị loading message
    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.projectSurveyService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileName || file.FileNameOrigin || file.name || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải xuống thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        this.message.remove(loadingMsg);
        console.error('Lỗi khi tải file:', res);

        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        }
      },
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
      // Reset fileDeletedIds khi load lại
      this.fileDeletedIds = [];
      
      let data = {
        projectSurveyDetailId: this.projectSurveyDetailId,
      };
      this.projectSurveyService.getDetailByid(data).subscribe({
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

            // Load files - chỉ load file chưa bị xóa
            const files = (response.data.files || []).filter((f: any) => !f.IsDeleted);
            this.fileListResult = files.map((file: any) => ({
              uid: Math.random().toString(36).substring(2) + Date.now(),
              name: file.FileName || '',
              size: 0,
              type: '',
              status: 'done',
              originFile: null,
              FileName: file.FileName || '',
              ServerPath: file.ServerPath || '',
              OriginName: file.OriginPath || file.FileName || '',
              ID: file.ID || 0,
              IsDeleted: false,
              isDeleted: false,
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
    
    // Kiểm tra nếu có file mới nhưng không có subPath
    if (filesToUpload.length > 0 && !subPath) {
      this.notification.error(
        'Thông báo',
        'Không thể xác định đường dẫn lưu file. Vui lòng kiểm tra thông tin dự án!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }
    
    // Nếu có file mới cần upload
    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.projectSurveyService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
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
          
          // Sau khi upload xong, gọi save
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
    // Tạo payload theo ProjectSurveyResultDTO
    const payload: any = {
      result: typeof result === 'string' ? result.trim() : result,
      projectId: this.projectId,
      projectSurveyDetailId: this.projectSurveyDetailId || 0,
      projectTypeId: this.projectTypeId || 0,
      file: this.prepareFileData(),
      deletedFileID: this.fileDeletedIds.length > 0 ? this.fileDeletedIds : null,
    };

    this.projectSurveyService.saveProjectSurveyResult(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            response.message || 'Đã lưu kết quả khảo sát!',
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
          error?.error?.message || 'Lỗi lưu kết quả khảo sát!',
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
      },
    });
  }

  prepareFileData(): any[] {
    const fileData: any[] = [];
    
    // Lấy danh sách file không bị xóa
    const activeFiles = this.fileListResult.filter(
      (file: any) => !file.isDeleted && !file.IsDeleted
    );
    
    activeFiles.forEach((file: any) => {
      if (!file) return;
      
      if (file.ID && file.ID > 0) {
        // File đã tồn tại, cần update
        fileData.push({
          ID: file.ID || 0,
          FileName: file.FileName || file.name || '',
          OriginPath: file.OriginName || file.name || '',
          ServerPath: file.ServerPath || '',
          ProjectSurveyDetailID: this.projectSurveyDetailId,
          ProjectSurveyID: this.projectSurveyId || null,
          IsDeleted: false,
        });
      } else if (file.originFile && file.ServerPath) {
        // File mới đã upload, cần create
        fileData.push({
          ID: 0,
          FileName: file.FileName || file.name || '',
          OriginPath: file.OriginName || file.name || '',
          ServerPath: file.ServerPath || '',
          ProjectSurveyDetailID: this.projectSurveyDetailId,
          ProjectSurveyID: this.projectSurveyId || null,
          IsDeleted: false,
        });
      }
    });
    
    return fileData;
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
        FilePath: file.ServerPath || '',
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
    
    // Tạo context menu
    const contextMenuItems: any[] = [
      {
        label: 'Tải xuống',
        action: () => {
          this.downloadFile();
        }
      }
    ];
    
    this.tb_projectSurveyFile = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      rowHeader: false,
      pagination: false,
      selectableRows: 1,
      rowContextMenu: contextMenuItems,
      data: this.fileListResult.map((file: any) => ({
        ID: file.ID || 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        FilePath: file.ServerPath || '',
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
            let isDeleted = data['IsDeleted'] || data['isDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            // Chỉ xử lý khi click vào icon hoặc button
            const target = e.target as HTMLElement;
            if (!target.classList.contains('fas') && !target.classList.contains('fa-trash') && target.tagName !== 'BUTTON') {
              return;
            }
            
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fileName = data['FileName'];
            
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa file`,
              nzContent: `${fileName}?`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  // File đã tồn tại trên server, thêm vào danh sách xóa
                  if (!this.fileDeletedIds.includes(id)) {
                    this.fileDeletedIds.push(id);
                  }
                  // Đánh dấu file là đã xóa trong fileListResult
                  const fileToDelete = this.fileListResult.find(
                    (f) => f.ID === id
                  );
                  if (fileToDelete) {
                    fileToDelete.IsDeleted = true;
                    fileToDelete.isDeleted = true;
                  }
                } else {
                  // File mới chưa upload, xóa trực tiếp khỏi danh sách
                  this.fileListResult = this.fileListResult.filter(
                    (f) => f.name !== fileName && f.FileName !== fileName
                  );
                }
                // Xóa khỏi table
                this.updateFileTable();
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
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value) {
              return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
            }
            return '';
          },
        },
      ],
    });

    // Thêm sự kiện rowSelected
    this.tb_projectSurveyFile.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      this.selectedFileData = rowData['file'] || rowData;
    });

    // Thêm sự kiện rowDeselected
    this.tb_projectSurveyFile.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.tb_projectSurveyFile.getSelectedRows();
      if (selectedRows.length === 0) {
        this.selectedFileData = null;
      }
    });

    // Double click vào tên file để tải xuống
    this.tb_projectSurveyFile.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      // Set selectedFileData để downloadFile() có thể sử dụng
      this.selectedFileData = rowData['file'] || rowData;
      this.downloadFile();
    });
  }
}
