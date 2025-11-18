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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ProjectItemService } from '../../../project-item/project-item-service/project-item.service';
import { Tabulator } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WorkItemServiceService } from '../../work-item-service/work-item-service.service';

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
  templateUrl: './project-item-file.component.html',
  styleUrl: './project-item-file.component.css',
})
export class ProjectItemFileComponent implements OnInit, AfterViewInit {
  @Input() projectItemId: number = 0;
  @ViewChild('tb_FileProjectItemTable', { static: false })
  tb_FileProjectItemTableElement!: ElementRef;
  private tb_FileProjectItemTable!: Tabulator;
  fileProjectItemData: any[] = [];
  deletedFile: number[] = [];
  ngOnInit(): void {
    this.loadFileData();
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_FileProjectItemTableElement?.nativeElement) {
        this.drawTbFileProjectItemTable(this.tb_FileProjectItemTableElement.nativeElement);
      }
    }, 0);
  }
  loadFileData(): void {
    this.workItemService.getProjectItemFile(this.projectItemId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
              this.fileProjectItemData = response.data || [];
              console.log('fileProjectItemData', this.fileProjectItemData); 
          if (this.tb_FileProjectItemTable) {
            this.tb_FileProjectItemTable.setData(this.fileProjectItemData);
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


  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private workItemService: WorkItemServiceService,
    private modal: NzModalService
  ) {}

  

  closeModal() {
    this.activeModal.close({ success: true });
  }
  saveData() {
    // Lấy danh sách file cần upload (file mới chưa có ServerPath)
    const filesToUpload: File[] = this.fileProjectItemData
      .filter((f) => f.File && !f.ServerPath && !f.IsDeleted)
      .map((f) => f.File!);

    // Tạo subPath cho upload
    const subPath = this.getSubPath();

    // Nếu có file mới cần upload, upload trước
    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.workItemService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && res?.data?.length > 0) {
            // Cập nhật ServerPath cho các file đã upload
            let fileIndex = 0;
            this.fileProjectItemData.forEach((f) => {
              if (f.File && !f.ServerPath && res.data[fileIndex]) {
                f.ServerPath = res.data[fileIndex].FilePath || res.data[fileIndex].ServerPath;
                f.OriginPath = res.data[fileIndex].FilePath || res.data[fileIndex].OriginPath || f.File.name;
                fileIndex++;
              }
            });
            
            // Sau khi upload xong, lưu dữ liệu
            this.saveFileData();
          } else {
            this.notification.error('Lỗi', 'Upload file thất bại');
          }
        },
        error: (error: any) => {
          console.error('Error uploading files:', error);
          this.notification.error('Lỗi', 'Có lỗi xảy ra khi upload file');
        }
      });
    } else {
      // Không có file mới, lưu trực tiếp
      this.saveFileData();
    }
  }

  private saveFileData(): void {
    // Lấy danh sách file cần lưu
    const filesToSave = this.prepareFileData();
    
    if (filesToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu');
      return;
    }

    // Gửi tất cả file trong một lần gọi API (API nhận List<ProjectItemFile>)
    this.workItemService.saveProjectItemFile(filesToSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu file thành công!');
          this.closeModal();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error saving files:', error);
        this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu file');
      }
    });
  }


  
  prepareFileData(): any[] {
    const fileData: any[] = [];
    
    // Xử lý file đã có (có ID) - update
    this.fileProjectItemData.forEach((file: any, index: number) => {
      if (!file || file.IsDeleted) return; // Bỏ qua nếu file là null/undefined hoặc đã bị xóa
      
      if (file.ID && file.ID > 0) {
        // File đã tồn tại, cần update
        fileData.push({
          ID: file.ID,
          ProjectItemID: file.ProjectItemID || this.projectItemId,
          FileName: file.FileName || '',
          Note: file.Note || null,
          OriginPath: file.OriginPath || file.FileName || '',
          STT: file.STT || (index + 1),
          IsDeleted: false,
        });
      } else if (file.File) {
        // File mới, cần create (sau khi đã upload)
        fileData.push({
          ID: 0,
          ProjectItemID: this.projectItemId,
          FileName: file.FileName || file.File.name || '',
          Note: file.Note || null,
          OriginPath: file.OriginPath || file.ServerPath || file.File.name || '',
          STT: file.STT || (index + 1),
          IsDeleted: false,
        });
      }
    });

    // Xử lý file đã bị xóa (set IsDeleted = true)
    this.deletedFile.forEach((fileId: number) => {
      fileData.push({
        ID: fileId,
        ProjectItemID: this.projectItemId,
        IsDeleted: true,
      });
    });

    return fileData;
  }

  getSubPath(): string {
    // Tạo subPath dựa trên projectItemId
    // Format: ProjectItem/{projectItemId}/Files
    const year = new Date().getFullYear();
    return `ProjectItem/${this.projectItemId}/Files/${year}`;
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
          FileNameOrigin: file.name, // Thêm FileNameOrigin để hiển thị trong bảng
          OriginPath: file.name,
          File: file,
        };

        this.fileProjectItemData.push(newFile);
        if (this.tb_FileProjectItemTable) {
          this.tb_FileProjectItemTable.addRow(newFile);
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }
    //#region : xử lý file
  // getSubPath(): string {
  //   if(this.projectList != null && this.projectList.length > 0) {
  //     const project = this.projectList.find(p => p.ID === this.projectId);
  //     if(project) {
  //       const year = this.projectList.find(p => p.ID === this.projectId)?.CreatedDate;
  //       if(year) {
  //         const yearString = new Date(year).getFullYear();
  //         return `${yearString}\\${project.ProjectCode}\\TaiLieuChung\\GiaiPhap`;
  //       }
  //     }
  //   }
  //   return '';
  // }
 // #endregion
  drawTbFileProjectItemTable(container: HTMLElement): void {
    this.tb_FileProjectItemTable = new Tabulator(container, {
      data: this.fileProjectItemData,
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
                  const index = this.fileProjectItemData.findIndex(
                    (f) =>
                      f['FileName'] === rowData['FileName'] &&
                      f['ServerPath'] === rowData['ServerPath'] &&
                      f['ID'] === rowData['ID']
                  );
  
                  if (index > -1) {
                    const deletedFile = this.fileProjectItemData[index];
                    if (deletedFile['ID']) {
                      this.deletedFile.push(deletedFile['ID']);
                    }
                    this.fileProjectItemData.splice(index, 1);
                  }
  
                  row.delete();
                },
              });
            }
          },
        },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          editor: false as any,
          width: 70,
          formatter: 'rownum',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: false as any,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'input',
          formatter: 'textarea',
        }
      ],
    });
  }
}
