import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProjectRequestServiceService } from '../project-request/project-request-service/project-request-service.service';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectWorkerService } from '../project/project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { Tabulator } from 'tabulator-tables';

@Component({
  selector: 'app-project-request-detail',
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
    NzTableModule,
    NzModalModule,
    NzInputNumberModule,
  ],
  providers: [NzModalService],
  templateUrl: './project-request-detail.component.html',
  styleUrl: './project-request-detail.component.css',
})
export class ProjectRequestDetailComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() isEdit: boolean = false;
  @Input() requestId: number = 0; // ID của yêu cầu khi edit
  @Input() requestData: any = null; // Dữ liệu yêu cầu khi edit
  @Input() dataRequest: any[] = []; // Danh sách yêu cầu để tính STT và validate CodeRequest

  form!: FormGroup;
  projectList: any[] = [];
  @ViewChild('tb_FileRequestTable', { static: false })
  tb_FileRequestTableElement!: ElementRef;
  private tb_FileRequestTable!: Tabulator;
  fileRequestData: any[] = [];
  deletedFile: number[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      ProjectID: [
        { value: this.projectId, disabled: this.projectId > 0 },
        [Validators.required],
      ],
      STT: [1],
      DateRequest: [null],
      CodeRequest: ['', [this.trimRequiredValidator]],
      ContentRequest: ['', [this.trimRequiredValidator]],
      Note: [''],
    });
    this.loadProjectList();
    this.loadFileData();
    
    // Nếu là thêm mới, tự động generate CodeRequest và STT
    if (!this.isEdit && this.projectId > 0) {
      this.generateCodeRequest();
    }
  }

  ngAfterViewInit(): void {
    // Fill dữ liệu vào form nếu là edit mode
    if (this.isEdit && this.requestData) {
      this.fillFormData();
    }
    
    setTimeout(() => {
      if (this.tb_FileRequestTableElement?.nativeElement) {
        this.drawTbFileRequestTable(this.tb_FileRequestTableElement.nativeElement);
      }
    }, 0);
  }

  fillFormData(): void {
    if (!this.requestData) return;
    
    const data = this.requestData;
    
    // Convert date strings to Date objects nếu cần
    let dateRequest: Date | null = null;
    
    if (data.DateRequest) {
      dateRequest = new Date(data.DateRequest);
    }
    
    // Fill form với dữ liệu
    this.form.patchValue({
      ProjectID: this.projectId,
      STT: data.STT || 1,
      DateRequest: dateRequest,
      CodeRequest: data.CodeRequest || '',
      ContentRequest: data.ContentRequest || '',
      Note: data.Note || '',
    });
    
    // Load file data nếu có requestId
    if (this.requestId > 0) {
      this.loadFileData();
    }
  }

  loadFileData(): void {
    if (this.requestId <= 0) {
      this.fileRequestData = [];
      if (this.tb_FileRequestTable) {
        this.tb_FileRequestTable.setData(this.fileRequestData);
      }
      return;
    }

    this.projectRequestService.getRequestFile(this.requestId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let fileData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          if (!fileData) {
            this.fileRequestData = [];
          } else if (Array.isArray(fileData)) {
            this.fileRequestData = fileData;
          } else if (typeof fileData === 'object') {
            if (fileData.constructor === Object && Object.keys(fileData).length > 0) {
              this.fileRequestData = [fileData];
            } else {
              this.fileRequestData = [];
            }
          } else {
            this.fileRequestData = [];
          }
          
          if (this.tb_FileRequestTable) {
            this.tb_FileRequestTable.setData(this.fileRequestData);
          }
        } else {
          this.fileRequestData = [];
          if (this.tb_FileRequestTable) {
            this.tb_FileRequestTable.setData([]);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading file data:', error);
        this.notification.error('Lỗi', 'Không thể tải file dữ liệu');
        this.fileRequestData = [];
        if (this.tb_FileRequestTable) {
          this.tb_FileRequestTable.setData([]);
        }
      }
    });
  }

  generateCodeRequest(): void {
    if (this.projectId <= 0) return;
    
    // Tính STT lớn nhất + 1 theo logic backend
    // Backend: requestByProject.Max(x => (x.STT ?? 0)) + 1
    let maxSTT = 0;
    if (this.dataRequest && this.dataRequest.length > 0) {
      // Filter chỉ lấy request của project hiện tại và chưa bị xóa
      const projectRequests = this.dataRequest.filter(
        (req: any) => req.ProjectID === this.projectId && !req.IsDeleted
      );
      
      if (projectRequests.length > 0) {
        const sttValues = projectRequests
          .map((item: any) => item.STT ?? 0)
          .filter((stt: any) => stt != null && stt !== undefined && !isNaN(stt) && stt > 0);
        if (sttValues.length > 0) {
          maxSTT = Math.max(...sttValues);
        }
      }
    }
    
    // STT mới = STT lớn nhất + 1, ít nhất là 1
    // Backend: int stt = requestByProject.Count > 0 ? requestByProject.Max(x => (x.STT ?? 0)) + 1 : 1;
    const nextSTT = maxSTT > 0 ? maxSTT + 1 : 1;
    
    // Generate CodeRequest = PRQ + STT (theo yêu cầu: khi thay đổi STT thì CodeRequest cũng thay đổi)
    const codeRequest = `PRQ${nextSTT}`;
    
    this.form.patchValue({
      CodeRequest: codeRequest,
      STT: nextSTT,
    });
  }

  onProjectChange(): void {
    // Khi thay đổi project, regenerate code và STT
    if (!this.isEdit) {
      const projectId = this.form.get('ProjectID')?.value;
      if (projectId > 0) {
        // Cập nhật projectId để generate code đúng
        this.projectId = projectId;
        this.generateCodeRequest();
      }
    }
  }

  changeSTT(): void {
    // Khi thay đổi STT, tự động cập nhật CodeRequest = PRQ + STT
    const stt = this.form.get('STT')?.value;
    if (stt && stt > 0) {
      this.form.patchValue({
        CodeRequest: 'PRQ' + stt
      });
    }
  }

  loadProjectList(): void {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projectList = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading project:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách dự án');
      },
    });
  }

  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private projectRequestService: ProjectRequestServiceService,
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private modal: NzModalService
  ) {}

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0)
      return { required: true };
    return null;
  };

  closeModal() {
    this.activeModal.close({ success: true });
  }

  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const valueRaw = this.form.getRawValue();
    
    // Validate theo logic backend
    if (valueRaw.ProjectID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Dự án');
      return;
    }
    
    if (!valueRaw.CodeRequest || valueRaw.CodeRequest.trim() === '') {
      this.notification.warning('Thông báo', 'Vui lòng nhập Mã yêu cầu');
      return;
    }
    
    if (!valueRaw.ContentRequest || valueRaw.ContentRequest.trim() === '') {
      this.notification.warning('Thông báo', 'Vui lòng nhập nội dung');
      return;
    }
    
    // Kiểm tra trùng CodeRequest trong cùng ProjectID
    if (this.dataRequest && this.dataRequest.length > 0) {
      const duplicateRequest = this.dataRequest.find(
        (req: any) => 
          req.ID !== this.requestId && 
          req.CodeRequest === valueRaw.CodeRequest.trim() && 
          req.ProjectID === valueRaw.ProjectID && 
          !req.IsDeleted
      );
      
      if (duplicateRequest) {
        this.notification.warning('Thông báo', `Mã yêu cầu [${valueRaw.CodeRequest}] đã tồn tại!`);
        return;
      }
    }
    
    // Map dữ liệu từ form sang DTO theo API
    const payload: any = {
      ID: this.requestId || 0,
      ProjectID: valueRaw.ProjectID,
      STT: valueRaw.STT || 1,
      DateRequest: valueRaw.DateRequest ? new Date(valueRaw.DateRequest).toISOString() : null,
      CodeRequest: typeof valueRaw.CodeRequest === 'string' 
        ? valueRaw.CodeRequest.trim() 
        : valueRaw.CodeRequest,
      ContentRequest: typeof valueRaw.ContentRequest === 'string' 
        ? valueRaw.ContentRequest.trim() 
        : valueRaw.ContentRequest,
      Note: typeof valueRaw.Note === 'string' 
        ? valueRaw.Note.trim() 
        : valueRaw.Note || '',
      projectRequestFile: this.prepareFileData(),
      deletedFileID: this.isEdit ? this.deletedFile : [],
    };

    // Gọi API save
    this.projectRequestService.saveRequest(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu dữ liệu thành công!');
          
          // Upload file trước khi đóng modal
          const filesToUpload: File[] = this.fileRequestData
            .filter((f) => f.File && !f.ServerPath)
            .map((f) => f.File!);
          const subPath = this.getSubPath();
          
          if (filesToUpload.length > 0 && subPath) {
            this.notification.info('Đang upload', 'Đang tải file lên...');
            this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
              next: (res: any) => {
                if (res?.data?.length > 0) {
                  let fileIndex = 0;
                  this.fileRequestData.forEach((f) => {
                    if (f.File && !f.ServerPath && res.data[fileIndex]) {
                      f.ServerPath = res.data[fileIndex].FilePath;
                      fileIndex++;
                    }
                  });
                }
                this.closeModal();
              },
              error: (error: any) => {
                console.error('Error uploading files:', error);
                // Vẫn đóng modal dù upload lỗi
                this.closeModal();
              }
            });
          } else {
            this.closeModal();
          }
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error saving request:', error);
        this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  }

  prepareFileData(): any[] {
    const fileData: any[] = [];
    const subPath = this.getSubPath();
    
    this.fileRequestData.forEach((file: any) => {
      if (!file) return;
      
      if (file.ID) {
        // File đã tồn tại, cần update
        let extension = '';
        const fileName = file.FileNameOrigin || file.FileName || '';
        if (fileName) {
          const parts = fileName.split('.');
          if (parts.length > 1) {
            extension = '.' + parts.pop();
          }
        }
        
        fileData.push({
          ID: file.ID || 0,
          FileNameOrigin: file.FileNameOrigin || file.FileName || '',
          OriginPath: file.OriginPath || '',
          Extension: extension,
          ServerPath: file.ServerPath || '',
          ProjectRequestID: file.ProjectRequestID || this.requestId,
        });
      } else if (file.File) {
        // File mới, cần upload và create
        let extension = '';
        if (file.File && file.File.name) {
          const parts = file.File.name.split('.');
          if (parts.length > 1) {
            extension = '.' + parts.pop();
          }
        }
        
        fileData.push({
          ID: file.ID || 0,
          FileNameOrigin: file.FileName || (file.File ? file.File.name : ''),
          OriginPath: file.OriginPath || (file.File ? file.File.name : ''),
          Extension: extension,
          ServerPath: file.ServerPath || '',
          ProjectRequestID: file.ProjectRequestID || this.requestId,
        });
      }
    });

    return fileData;
  }

  openFileSelector() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        const newFile = {
          FileName: file.name,
          OriginPath: file.name,
          FileNameOrigin: file.name,
          File: file,
        };

        this.fileRequestData.push(newFile);
        if (this.tb_FileRequestTable) {
          this.tb_FileRequestTable.addRow(newFile);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  getSubPath(): string {
    if (this.projectList != null && this.projectList.length > 0) {
      const project = this.projectList.find(p => p.ID === this.projectId);
      if (project) {
        const year = project.CreatedDate;
        if (year) {
          const yearString = new Date(year).getFullYear();
          return `${yearString}\\${project.ProjectCode}\\TaiLieuChung\\YeuCauDuAn(REV02)`;
        }
      }
    }
    return '';
  }

  drawTbFileRequestTable(container: HTMLElement): void {
    this.tb_FileRequestTable = new Tabulator(container, {
      data: this.fileRequestData,
      layout: 'fitColumns',
      pagination: false,
      paginationSize: 10,
      height: '100%',
      columns: [
        {
          title: '',
          field: 'actions',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm file"></i></div>`,
          headerClick: () => {
            this.openFileSelector();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa file này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();
                  const id = rowData['ID'];

                  // Tìm và xóa trong fileRequestData
                  const index = this.fileRequestData.findIndex(
                    (f) =>
                      f['FileName'] === rowData['FileName'] &&
                      f['ServerPath'] === rowData['ServerPath'] &&
                      f['ID'] === rowData['ID']
                  );
  
                  if (index > -1) {
                    const deletedFile = this.fileRequestData[index];
                    if (deletedFile['ID']) {
                      this.deletedFile.push(deletedFile['ID']);
                    }
                    this.fileRequestData.splice(index, 1);
                  }

                  row.delete();
                },
              });
            }
          },
        },
        {
          title: 'Tên file',
          field: 'FileNameOrigin',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: false as any,
        },
      ],
    });
  }
}
