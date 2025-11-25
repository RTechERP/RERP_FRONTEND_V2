import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';
import { Tabulator } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ProjectRequestDetailComponent } from '../../../../project-request-detail/project-request-detail.component';
import { ProjectRequestServiceService } from '../../../../project-request/project-request-service/project-request-service.service';

@Component({
  selector: 'app-project-solution-detail',
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
    NzCheckboxModule,
    NzDatePickerModule,
    NzTableModule,
    NzModalModule,
  ],
  providers: [NzModalService],
  templateUrl: './project-solution-detail.component.html',
  styleUrl: './project-solution-detail.component.css',
})
export class ProjectSolutionDetailComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() dataSolution: any[] = [];
  @Input() isEdit: boolean = false;
  @Input() solutionId: number = 0; // ID của giải pháp khi edit
  @Input() solutionData: any = null; // Dữ liệu giải pháp khi edit
  @Input() projectRequestID: number = 0; // ID của yêu cầu dự án được chọn từ bảng yêu cầu
  form!: FormGroup;
  projectList: any[] = [];
  projectRequestList: any[] = [];
  tableData: any[] = [];
  @ViewChild('tb_FileSolutionTable', { static: false })
  tb_FileSolutionTableElement!: ElementRef;
  private tb_FileSolutionTable!: Tabulator;
  fileSolutionData: any[] = [];
  deletedFile: number[] = [];
  dataRequest: any[] = [];
  ngOnInit(): void {
     // Set ngày yêu cầu mặc định là ngày hôm nay khi thêm mới
     const today = new Date();
     today.setHours(0, 0, 0, 0); // Set về 00:00:00 để tránh vấn đề timezone
    this.form = this.fb.group({
      ProjectID: [
        { value: this.projectId, disabled: this.projectId > 0 },
        [Validators.required],
      ],
      RequestID: [null, [Validators.required]],
      SolutionCode: ['', [this.trimRequiredValidator]],
      STT: [1],
      IsPO: [false],
      SolutionDate: [!this.isEdit ? today : null],
      DeadlinePrice: [null],
      Content: [''],
    });
    this.loadProjectList();
    this.loadProjectRequestList();
    this.loadFileData();
    this.loadTableData();
    
    // Nếu là thêm mới và có projectRequestID được truyền vào, set giá trị và generate mã giải pháp
    if (!this.isEdit && this.projectRequestID > 0) {
      setTimeout(() => {
        this.form.patchValue({
          RequestID: this.projectRequestID
        });
        // Gọi onRequestChange để generate mã giải pháp
        this.onRequestChange();
      }, 100);
    }
  }
  ngAfterViewInit(): void {
    // Fill dữ liệu vào form nếu là edit mode
    if (this.isEdit && this.solutionData) {
      this.fillFormData();
    }
    
    setTimeout(() => {
      if (this.tb_FileSolutionTableElement?.nativeElement) {
        this.drawTbFileSolutionTable(this.tb_FileSolutionTableElement.nativeElement);
      }
    }, 0);
  }
  addRequest() {
    if (this.projectId <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    // Load danh sách request từ API để truyền vào modal (cần cho logic tính STT)
    this.projectRequestService.getProjectRequest2(this.projectId, '').subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let requestData = response.data;
          
          // Xử lý dữ liệu: có thể là array, object, hoặc null
          let dataRequest: any[] = [];
          if (!requestData) {
            dataRequest = [];
          } else if (Array.isArray(requestData)) {
            dataRequest = requestData;
          } else if (typeof requestData === 'object') {
            if (requestData.constructor === Object && Object.keys(requestData).length > 0) {
              dataRequest = [requestData];
            } else {
              dataRequest = [];
            }
          }

          // Mở modal sau khi đã load xong danh sách request
          const modalRef = this.ngbModal.open(ProjectRequestDetailComponent, {
            centered: true,
            size: 'xl',
            keyboard: false,
          });

          // Set các Input properties
          modalRef.componentInstance.projectId = this.projectId;
          modalRef.componentInstance.isEdit = false;
          modalRef.componentInstance.requestId = 0;
          modalRef.componentInstance.dataRequest = dataRequest; // Truyền danh sách request đã load

          modalRef.result
            .then((result: any) => {
              if (result && result.success) {
                // Reload danh sách yêu cầu sau khi lưu thành công
                this.loadProjectRequestList();
              }
            })
            .catch((error: any) => {
              console.log('Modal dismissed:', error);
            });
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách yêu cầu!');
        }
      },
      error: (error: any) => {
        console.error('Error loading project request:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách yêu cầu!');
      }
    });
  }

  fillFormData(): void {
    if (!this.solutionData) return;
    
    const data = this.solutionData;
    
    // Convert date strings to Date objects nếu cần
    let solutionDate: Date | null = null;
    let deadlinePrice: Date | null = null;
    
    if (data.DateSolution) {
      solutionDate = new Date(data.DateSolution);
    }
    if (data.PriceReportDeadline) {
      deadlinePrice = new Date(data.PriceReportDeadline);
    }
    
    // Fill form với dữ liệu
    this.form.patchValue({
      ProjectID: this.projectId,
      RequestID: data.ProjectRequestID || null,
      SolutionCode: data.CodeSolution || '',
      STT: data.STT || 1,
      IsPO: data.StatusSolution ===1 ? true : false, // 2 = PO
      SolutionDate: solutionDate,
      DeadlinePrice: deadlinePrice,
      Content: data.ContentSolution || '',
    });
    
    // Load file data nếu có solutionId
    if (this.solutionId > 0) {
      this.loadFileData();
    }
  }

  loadFileData(): void {
    this.projectWorkerService.getSolutionFile(this.solutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.fileSolutionData = response.data || [];
          if (this.tb_FileSolutionTable) {
            this.tb_FileSolutionTable.setData(this.fileSolutionData);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading file data:', error);
        this.notification.error('Lỗi', 'Không thể tải file dữ liệu');
      }
    });
  }

  onRequestChange() {
    //#region Tính STT lớn nhất + 1 theo RequestID
    let maxSTT = 0;
    if (!this.isEdit) {
      const currentRequestID = this.form.get('RequestID')?.value;

      if (
        currentRequestID &&
        this.dataSolution &&
        this.dataSolution.length > 0
      ) {
        // Filter data theo RequestID hiện tại
        const filteredData = this.dataSolution.filter(
          (item: any) => item.ProjectRequestID === currentRequestID
        );

        if (filteredData.length > 0) {
          const sttValues = filteredData
            .map((item: any) => item.STT)
            .filter(
              (stt: any) => stt != null && stt !== undefined && !isNaN(stt)
            );
          if (sttValues.length > 0) {
            maxSTT = Math.max(...sttValues);
          }
        }
      }
      // STT mới = STT lớn nhất + 1, ít nhất là 1
      const nextSTT = Math.max(1, maxSTT + 1);
      //#endregion
      this.form.patchValue({
        SolutionCode: 'GP' + nextSTT,
        STT: nextSTT,
      });
    }
  }

  loadProjectList(): void {
    this.projectWorkerService.getAllProject().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projectList = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading project:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách dự án');
      },
    });
    this.projectList = [];
  }

  loadProjectRequestList(): void {
    this.projectWorkerService.getProjectRequest(this.projectId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projectRequestList = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading project request:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách yêu cầu dự án');
      },
    });
    this.projectRequestList = [];
  }

  loadTableData(): void {
    // TODO: Implement load table data
    this.tableData = [];
  }



  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private projectWorkerService: ProjectWorkerService,
    private projectRequestService: ProjectRequestServiceService,
    private modal: NzModalService,
    private ngbModal: NgbModal
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
    
    // Map dữ liệu từ form sang DTO theo API
    const payload: any = {
      ID: this.solutionId || 0,
      ProjectRequestID: valueRaw.RequestID,
      STT: valueRaw.STT || 1,
      CodeSolution: typeof valueRaw.SolutionCode === 'string' 
        ? valueRaw.SolutionCode.trim() 
        : valueRaw.SolutionCode,
      ContentSolution: typeof valueRaw.Content === 'string' 
        ? valueRaw.Content.trim() 
        : valueRaw.Content,
      DateSolution: valueRaw.SolutionDate ? new Date(valueRaw.SolutionDate).toISOString() : null,
      PriceReportDeadline: valueRaw.DeadlinePrice ? new Date(valueRaw.DeadlinePrice).toISOString() : null,
      StatusSolution: valueRaw.IsPO ? 1 : 0, 
      projectSolutionFile: this.prepareFileData(),
      deletedFileID : this.isEdit ? this.deletedFile : [],
    };

    // Gọi API save
    this.projectWorkerService.saveSolution(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu dữ liệu thành công!');
          this.closeModal();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error saving solution:', error);
        this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });

    const filesToUpload: File[] = this.fileSolutionData
      .filter((f) => f.File && !f.ServerPath)
      .map((f) => f.File!);
    const subPath = this.getSubPath();
    console.log('filesToUpload', filesToUpload);
    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.data?.length > 0) {
            let fileIndex = 0;
            this.fileSolutionData.forEach((f) => {
              if (f.File && !f.ServerPath && res.data[fileIndex]) {
                f.ServerPath = res.data[fileIndex].FilePath;
                fileIndex++;
              }
            });
          }
        }
      });
    }
  }

  prepareFileData(): any[] {
    const fileData: any[] = [];
    const subPath = this.getSubPath();
    // Xử lý file đã có (có ID)
    console.log('fileSolutionData', this.fileSolutionData);
    this.fileSolutionData.forEach((file: any) => {
      if (!file) return; // Bỏ qua nếu file là null/undefined
      
      if (file.ID) {
        // File đã tồn tại, cần update
        console.log('file', file);
        
        // Lấy extension từ FileName hoặc FileNameOrigin nếu có
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
          ProjectSolutionID: file.ProjectSolutionID || this.solutionId,
        });
      } else if (file.File) {
        // File mới, cần upload và create
        // Lưu ý: Cần upload file trước, sau đó mới tạo record
        console.log('file', file);
        
        // Lấy extension từ file name
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
          ProjectSolutionID: file.ProjectSolutionID || this.solutionId,
        });
        console.log('fileData1', fileData);
      }
    });

    // Xử lý file đã bị xóa
    this.deletedFile.forEach((fileId: number) => {
      fileData.push({
        ID: fileId,
        IsDeleted: true,
      });
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

        this.fileSolutionData.push(newFile);
        if (this.tb_FileSolutionTable) {
          this.tb_FileSolutionTable.addRow(newFile);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }
    //#region : xử lý file
  getSubPath(): string {
    if(this.projectList != null && this.projectList.length > 0) {
      const project = this.projectList.find(p => p.ID === this.projectId);
      if(project) {
        const year = this.projectList.find(p => p.ID === this.projectId)?.CreatedDate;
        if(year) {
          const yearString = new Date(year).getFullYear();
          return `${yearString}\\${project.ProjectCode}\\TaiLieuChung\\GiaiPhap`;
        }
      }
    }
    return '';
  }
  //#endregion
  drawTbFileSolutionTable(container: HTMLElement): void {
    this.tb_FileSolutionTable = new Tabulator(container, {
      data: this.fileSolutionData,
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

                  // Tìm và xóa trong fileDatas
                  const index = this.fileSolutionData.findIndex(
                    (f) =>
                      f['FileName'] === rowData['FileName'] &&
                      f['ServerPath'] === rowData['ServerPath'] &&
                      f['ID'] === rowData['ID']
                  );
  
                  if (index > -1) {
                    const deletedFile = this.fileSolutionData[index];
                    if (deletedFile['ID']) {
                      this.deletedFile.push(deletedFile['ID']);
                    }
                    this.fileSolutionData.splice(index, 1);
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
