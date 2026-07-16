import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin, Observable } from 'rxjs';

import { ProjectGateStepService } from '../project-gate-step.service';
import { ProjectWorkerService } from '../../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-project-gate-step-files-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule
  ],
  templateUrl: './project-gate-step-files-modal.component.html',
  styleUrls: ['./project-gate-step-files-modal.component.css']
})
export class ProjectGateStepFilesModalComponent implements OnInit {
  @Input() checklistLink!: any; // CheckListLinkDto
  @Input() gateCode: string = '';
  @Input() gateName: string = '';

  selectedFileIds = new Set<number>();
  allChecked = false;
  indeterminate = false;

  constructor(
    public activeModal: NgbActiveModal,
    private projectGateStepService: ProjectGateStepService,
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {
    if (this.checklistLink?.ID) {
      this.loadFiles();
    } else {
      this.updateCheckedState();
    }
  }

  loadFiles(): void {
    this.projectGateStepService.getFiles(this.checklistLink.ID).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.checklistLink.Files = res.data || [];
          this.updateCheckedState();
        }
      },
      error: (err: any) => {
        console.error('Lỗi tải danh sách file:', err);
      }
    });
  }

  getRelativeSubPath(pathFolder: string): string {
    if (!pathFolder) return '';
    const match = pathFolder.match(/[\\\/]projects[\\\/](.*)$/i);
    if (match) {
      return match[1];
    }
    return pathFolder.replace(/^\\\\192\.168\.1\.190\\duan\\projects\\/i, '')
                     .replace(/^\\\\192\.168\.1\.190\\duan\\/i, '')
                     .replace(/^\\+/g, '');
  }

  getFileIcon(contentType: string, fileName: string): string {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
    const mime = (contentType || '').toLowerCase();

    if (mime.startsWith('image/') || ['png','jpg','jpeg','gif','bmp','webp','svg'].includes(ext))
      return 'fa-solid fa-file-image text-success';
    if (mime === 'application/pdf' || ext === 'pdf')
      return 'fa-solid fa-file-pdf text-danger';
    if (['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime) || ['doc','docx'].includes(ext))
      return 'fa-solid fa-file-word text-primary';
    if (['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mime) || ['xls','xlsx'].includes(ext))
      return 'fa-solid fa-file-excel text-success';
    if (['application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mime) || ['ppt','pptx'].includes(ext))
      return 'fa-solid fa-file-powerpoint text-warning';
    if (['application/zip','application/x-rar-compressed','application/x-7z-compressed'].includes(mime) || ['zip','rar','7z','tar','gz'].includes(ext))
      return 'fa-solid fa-file-zipper text-secondary';
    if (mime.startsWith('video/') || ['mp4','avi','mov','mkv'].includes(ext))
      return 'fa-solid fa-file-video text-info';
    if (mime.startsWith('audio/') || ['mp3','wav','ogg'].includes(ext))
      return 'fa-solid fa-file-audio text-info';
    if (ext === 'dwg' || ext === 'dxf')
      return 'fa-solid fa-drafting-compass text-primary';

    return 'fa-solid fa-file text-secondary';
  }

  onAllChecked(checked: boolean): void {
    const files = this.checklistLink?.Files || [];
    files.forEach((file: any) => {
      if (checked) {
        this.selectedFileIds.add(file.ID);
      } else {
        this.selectedFileIds.delete(file.ID);
      }
    });
    this.updateCheckedState();
  }

  onItemChecked(id: number, checked: boolean): void {
    if (checked) {
      this.selectedFileIds.add(id);
    } else {
      this.selectedFileIds.delete(id);
    }
    this.updateCheckedState();
  }

  updateCheckedState(): void {
    const files = this.checklistLink?.Files || [];
    if (files.length === 0) {
      this.allChecked = false;
      this.indeterminate = false;
      return;
    }
    const checkedCount = this.selectedFileIds.size;
    this.allChecked = checkedCount === files.length;
    this.indeterminate = checkedCount > 0 && checkedCount < files.length;
  }

  triggerUpload(): void {
    if (!this.checklistLink) return;
    const pathFolder = this.checklistLink.PathFolder;
    const subPath = this.getRelativeSubPath(pathFolder);

    if (!subPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xác định đường dẫn lưu file!');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      const filesToUpload = Array.from(files);
      this.notification.info('Đang upload', 'Đang tải file lên...');

      this.projectWorkerService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            const uploadedFiles: any[] = res.data || [];
            if (uploadedFiles.length > 0) {
              const saveRequests: Observable<any>[] = uploadedFiles.map((fData: any) => {
                const fileDto = {
                  FileName: fData.savedFileName || fData.SavedFileName || fData.originalFileName || fData.OriginalFileName,
                  FilePath: fData.filePath || fData.FilePath,
                  FileSize: fData.fileSize || fData.FileSize,
                  ContentType: fData.contentType || fData.ContentType
                };
                return this.projectGateStepService.saveFile(this.checklistLink.ID, fileDto);
              });

              (forkJoin(saveRequests) as any).subscribe({
                next: (saveResults: any[]) => {
                  this.notification.success(NOTIFICATION_TITLE.success, `Đã tải lên và lưu thành công ${uploadedFiles.length} file!`);
                  this.checklistLink.IsPass = true;
                  this.loadFiles();
                },
                error: (saveErr: any) => {
                  console.error('Lỗi lưu file vào DB:', saveErr);
                  this.notification.error(NOTIFICATION_TITLE.error, 'Upload thành công nhưng lưu DB thất bại.');
                  this.loadFiles();
                }
              });
            }
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Upload file thất bại.');
          }
        },
        error: (error: any) => {
          console.error('Lỗi upload:', error);
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối upload file.');
        }
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  deleteOneFile(fileId: number): void {
    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa file này không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.projectGateStepService.deleteFile(fileId).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa file thành công!');
              if (this.checklistLink?.Files) {
                this.checklistLink.Files = this.checklistLink.Files.filter((f: any) => f.ID !== fileId);
              }
              this.selectedFileIds.delete(fileId);
              this.updateCheckedState();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa file không thành công.');
            }
          },
          error: (err: any) => {
            console.error('Lỗi xóa file:', err);
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống khi xóa file.');
          }
        });
      }
    });
  }

  deleteSelectedFiles(): void {
    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa nhiều file',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedFileIds.size} file đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteRequests = Array.from(this.selectedFileIds).map(id => this.projectGateStepService.deleteFile(id));
        this.notification.info('Đang xóa', 'Đang thực hiện xóa các file đã chọn...');

        (forkJoin(deleteRequests) as any).subscribe({
          next: (results: any[]) => {
            const deletedIds = Array.from(this.selectedFileIds);
            this.checklistLink.Files = this.checklistLink.Files.filter((f: any) => !deletedIds.includes(f.ID));
            this.selectedFileIds.clear();
            this.updateCheckedState();
            this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${deletedIds.length} file!`);
          },
          error: (err: any) => {
            console.error('Lỗi xóa nhiều file:', err);
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra trong quá trình xóa hàng loạt file.');
          }
        });
      }
    });
  }

  downloadFile(file: any): void {
    if (!file || !file.FilePath) return;
    this.projectGateStepService.downloadFile(file.FilePath).subscribe({
      next: (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.FileName || 'downloaded_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err: any) => {
        console.error('Lỗi tải file:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải file xuống.');
      }
    });
  }
}
