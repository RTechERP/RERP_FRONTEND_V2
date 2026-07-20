import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { forkJoin, Observable } from 'rxjs';

import { ProjectGateStepService } from '../project-gate-step.service';
import { ProjectWorkerService } from '../../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-project-gate-step-files-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule,
    TableModule
  ],
  templateUrl: './project-gate-step-files-modal.component.html',
  styleUrls: ['./project-gate-step-files-modal.component.css']
})
export class ProjectGateStepFilesModalComponent implements OnInit {
  @Input() checklists: any[] = [];
  @Input() gateCode: string = '';
  @Input() gateName: string = '';
  @Input() stepLinkId!: number;
  @Input() selectedRuleId: number | null = null;

  selectedRule: any = null;
  allChecked = false;
  indeterminate = false;
  selectedFileIds = new Set<number>();
  invalidRuleIds = new Set<number>();

  // Cached properties — tránh gọi method trong template gây lag
  displayFiles: any[] = [];
  isUserLeader = false;

  @ViewChild('fileInputHidden') fileInputHidden!: ElementRef<HTMLInputElement>;

  constructor(
    public activeModal: NgbActiveModal,
    private projectGateStepService: ProjectGateStepService,
    private projectWorkerService: ProjectWorkerService,
    public appUserService: AppUserService,
    private notification: NzNotificationService,
    private modalService: NzModalService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isUserLeader = this.checkIsLeader();
    if (this.stepLinkId) {
      this.loadCheckLists();
    } else if (this.checklists) {
      this.initCheckLists();
    }
  }

  loadCheckLists(): void {
    this.projectGateStepService.getCheckListsByStep(this.stepLinkId).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.checklists = res.data || [];
          this.initCheckLists();
        }
      },
      error: (err: any) => {
        console.error('Lỗi tải danh sách checklist:', err);
      }
    });
  }

  refreshDisplayFiles(): void {
    if (this.selectedRule) {
      this.displayFiles = (this.selectedRule.Files || []).map((f: any) => ({
        ...f,
        ruleId: this.selectedRule.ID,
        ruleDescription: this.selectedRule.Description || this.selectedRule.FileRule,
        isRuleApproved: this.selectedRule.IsApprovedTBP === 1
      }));
    } else {
      const list: any[] = [];
      if (this.checklists) {
        this.checklists.forEach(cl => {
          if (cl.Files && cl.Files.length > 0) {
            cl.Files.forEach((f: any) => {
              list.push({ 
                ...f, 
                ruleId: cl.ID, 
                ruleDescription: cl.Description || cl.FileRule,
                isRuleApproved: cl.IsApprovedTBP === 1
              });
            });
          }
        });
      }
      this.displayFiles = list;
    }
    this.cdr.markForCheck();
  }

  reloadChecklists(): void {
    if (this.selectedRule) {
      this.selectedRuleId = this.selectedRule.ID;
    }
    this.loadCheckLists();
  }

  initCheckLists(): void {
    this.invalidRuleIds.clear();
    this.checklists.forEach(cl => {
      cl._selected = false;
      cl.Files = cl.Files || [];
    });

    if (this.selectedRuleId) {
      this.selectedRule = this.checklists.find(cl => cl.ID === this.selectedRuleId) || null;
    }
    this.refreshDisplayFiles();
  }

  private checkIsLeader(): boolean {
    const user = this.appUserService.currentUser;
    return user?.IsLeader === 1 || user?.IsAdmin === true;
  }

  loadFilesForRule(cl: any): void {
    this.projectGateStepService.getFiles(cl.ID).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          cl.Files = res.data || [];
          this.refreshDisplayFiles();
        }
      },
      error: (err: any) => {
        console.error('Lỗi tải file cho quy tắc:', cl.ID, err);
      }
    });
  }

  onRowSelect(event: any): void {
    this.selectedFileIds.clear();
    this.allChecked = false;
    this.indeterminate = false;
    if (this.selectedRule) {
      this.loadFilesForRule(this.selectedRule);
    } else {
      this.refreshDisplayFiles();
    }
  }

  onRowUnselect(event: any): void {
    this.selectedFileIds.clear();
    this.allChecked = false;
    this.indeterminate = false;
    this.refreshDisplayFiles();
  }

  // Đã xóa getAllFiles() và getDisplayFiles() — dùng property displayFiles thay thế

  confirmCompleteRule(cl: any, isCompleted: boolean): void {
    const actionText = isCompleted ? 'xác nhận hoàn thành' : 'hủy xác nhận hoàn thành';
    this.modalService.confirm({
      nzTitle: 'Xác nhận thay đổi',
      nzContent: `Bạn có chắc chắn muốn ${actionText} quy tắc: "${cl.Description || 'Quy tắc này'}"?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.projectGateStepService.completeRules([cl.ID], isCompleted).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              cl.IsPass = isCompleted;
              this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
              this.reloadChecklists();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Thao tác không thành công.');
            }
          },
          error: (err: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi kết nối.');
          }
        });
      }
    });
  }

  confirmApproveRule(cl: any, isApproved: boolean): void {
    const nextStatus = isApproved ? 1 : 0;
    const actionText = isApproved ? 'phê duyệt' : 'hủy phê duyệt';
    const empId = this.appUserService.currentUser?.EmployeeID || 0;

    this.modalService.confirm({
      nzTitle: 'Xác nhận phê duyệt',
      nzContent: `Bạn có chắc chắn muốn ${actionText} quy tắc: "${cl.Description || 'Quy tắc này'}"?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.projectGateStepService.approveRule(cl.ID, nextStatus, empId).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              cl.IsApprovedTBP = nextStatus;
              cl.ApprovedTBPBy = empId;
              cl.ApprovedTBPDate = new Date();
              this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
              this.reloadChecklists();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Thao tác không thành công.');
            }
          },
          error: (err: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Lỗi kết nối.');
          }
        });
      }
    });
  }

  hasSelectedChecklists(): boolean {
    return this.checklists && this.checklists.some(cl => cl._selected);
  }

  isAllChecklistsSelected(): boolean {
    if (!this.checklists || this.checklists.length === 0) return false;
    return this.checklists.every(cl => cl._selected);
  }

  toggleSelectAllChecklists(checked: boolean): void {
    if (this.checklists) {
      this.checklists.forEach(cl => cl._selected = checked);
    }
  }

  bulkComplete(isCompleted: boolean): void {
    let selectedRules = this.checklists.filter(cl => cl._selected);
    if (selectedRules.length === 0) {
      if (this.selectedRule) {
        selectedRules = [this.selectedRule];
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng tích chọn checkbox hoặc click chọn dòng quy tắc để thực hiện!');
        return;
      }
    }

    const actionText = isCompleted ? 'xác nhận hoàn thành' : 'hủy xác nhận hoàn thành';
    const isSingle = selectedRules.length === 1;
    const contentText = isSingle 
      ? `Bạn có chắc chắn muốn ${actionText} check list: "${selectedRules[0].Description || 'này'}"?`
      : `Bạn có chắc chắn muốn ${actionText} cho ${selectedRules.length} check list đã chọn?`;

    if (!isCompleted) {
      this.executeBulkComplete(selectedRules, isCompleted, actionText, isSingle, contentText);
      return;
    }

    const detailLinkIds = selectedRules.map(cl => cl.ID);
    this.projectGateStepService.checkRequiredFiles(detailLinkIds).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data && res.data.length > 0) {
          const violationContent = '<div class="text-danger fw-bold mb-2">Có check list chưa tải đủ số lượng file yêu cầu.</div><div>Bạn có chắc chắn muốn tiếp tục thực hiện hay không?</div>';

          this.modalService.confirm({
            nzTitle: 'Cảnh báo thiếu file đính kèm',
            nzContent: violationContent,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
              this.invalidRuleIds.clear();
              this.cdr.markForCheck();
              this.executeBulkComplete(selectedRules, isCompleted, actionText, isSingle, contentText, true);
            },
            nzOnCancel: () => {
              this.invalidRuleIds.clear();
              res.data.forEach((v: any) => {
                this.invalidRuleIds.add(v.DetailLinkID);
              });
              this.cdr.markForCheck();
            }
          });
        } else {
          this.invalidRuleIds.clear();
          this.cdr.markForCheck();
          this.executeBulkComplete(selectedRules, isCompleted, actionText, isSingle, contentText);
        }
      },
      error: (err: any) => {
        console.error('Lỗi kiểm tra file:', err);
        this.executeBulkComplete(selectedRules, isCompleted, actionText, isSingle, contentText);
      }
    });
  }

  private executeBulkComplete(selectedRules: any[], isCompleted: boolean, actionText: string, isSingle: boolean, contentText: string, skipConfirm = false): void {
    const detailLinkIds = selectedRules.map(cl => cl.ID);
    const performAction = () => {
      this.notification.info('Đang xử lý', 'Đang cập nhật trạng thái...');
      this.projectGateStepService.completeRules(detailLinkIds, isCompleted).subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            selectedRules.forEach(cl => cl.IsPass = isCompleted);
            this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
            this.reloadChecklists();
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Thao tác thất bại.');
          }
        },
        error: (err: any) => {
          console.error('Lỗi cập nhật trạng thái:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi cập nhật.');
        }
      });
    };

    if (skipConfirm) {
      performAction();
    } else {
      this.modalService.confirm({
        nzTitle: isSingle ? 'Xác nhận thay đổi' : 'Xác nhận hàng loạt',
        nzContent: contentText,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          performAction();
        }
      });
    }
  }

  bulkApprove(status: number): void {
    let selectedRules = this.checklists.filter(cl => cl._selected);
    if (selectedRules.length === 0) {
      if (this.selectedRule) {
        selectedRules = [this.selectedRule];
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng tích chọn checkbox hoặc click chọn dòng quy tắc để thực hiện!');
        return;
      }
    }

    const actionText = status === 1 ? 'phê duyệt' : 'hủy phê duyệt';
    const isSingle = selectedRules.length === 1;
    const contentText = isSingle 
      ? `Bạn có chắc chắn muốn ${actionText} check list: "${selectedRules[0].Description || 'này'}"?`
      : `Bạn có chắc chắn muốn ${actionText} cho ${selectedRules.length} check list đã chọn?`;

    if (status !== 1) {
      this.executeBulkApprove(selectedRules, status, actionText, isSingle, contentText);
      return;
    }

    const detailLinkIds = selectedRules.map(cl => cl.ID);
    this.projectGateStepService.checkRequiredFiles(detailLinkIds).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data && res.data.length > 0) {
          const violationContent = '<div class="text-danger fw-bold mb-2">Có check list chưa tải đủ số lượng file yêu cầu.</div><div>Bạn có chắc chắn muốn tiếp tục thực hiện hay không?</div>';

          this.modalService.confirm({
            nzTitle: 'Cảnh báo thiếu file đính kèm',
            nzContent: violationContent,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
              this.invalidRuleIds.clear();
              this.cdr.markForCheck();
              this.executeBulkApprove(selectedRules, status, actionText, isSingle, contentText, true);
            },
            nzOnCancel: () => {
              this.invalidRuleIds.clear();
              res.data.forEach((v: any) => {
                this.invalidRuleIds.add(v.DetailLinkID);
              });
              this.cdr.markForCheck();
            }
          });
        } else {
          this.invalidRuleIds.clear();
          this.cdr.markForCheck();
          this.executeBulkApprove(selectedRules, status, actionText, isSingle, contentText);
        }
      },
      error: (err: any) => {
        console.error('Lỗi kiểm tra file:', err);
        this.executeBulkApprove(selectedRules, status, actionText, isSingle, contentText);
      }
    });
  }

  private executeBulkApprove(selectedRules: any[], status: number, actionText: string, isSingle: boolean, contentText: string, skipConfirm = false): void {
    const empId = this.appUserService.currentUser?.EmployeeID || 0;
    const performAction = () => {
      const requests = selectedRules.map(cl => this.projectGateStepService.approveRule(cl.ID, status, empId));
      this.notification.info('Đang xử lý', 'Đang thực hiện phê duyệt...');

      (forkJoin(requests) as any).subscribe({
        next: (results: any[]) => {
          selectedRules.forEach(cl => {
            cl.IsApprovedTBP = status;
            cl.ApprovedTBPBy = empId;
            cl.ApprovedTBPDate = new Date();
          });
          this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
          this.reloadChecklists();
        },
        error: (err: any) => {
          console.error('Lỗi duyệt:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi duyệt.');
        }
      });
    };

    if (skipConfirm) {
      performAction();
    } else {
      this.modalService.confirm({
        nzTitle: isSingle ? 'Xác nhận phê duyệt' : 'Xác nhận phê duyệt hàng loạt',
        nzContent: contentText,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          performAction();
        }
      });
    }
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

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
      return 'fa-solid fa-file-image text-success';
    if (mime === 'application/pdf' || ext === 'pdf')
      return 'fa-solid fa-file-pdf text-danger';
    if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime) || ['doc', 'docx'].includes(ext))
      return 'fa-solid fa-file-word text-primary';
    if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mime) || ['xls', 'xlsx'].includes(ext))
      return 'fa-solid fa-file-excel text-success';
    if (['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mime) || ['ppt', 'pptx'].includes(ext))
      return 'fa-solid fa-file-powerpoint text-warning';
    if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mime) || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
      return 'fa-solid fa-file-zipper text-secondary';
    if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv'].includes(ext))
      return 'fa-solid fa-file-video text-info';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext))
      return 'fa-solid fa-file-audio text-info';
    if (ext === 'dwg' || ext === 'dxf')
      return 'fa-solid fa-drafting-compass text-primary';

    return 'fa-solid fa-file text-secondary';
  }

  triggerUpload(): void {
    if (!this.selectedRule) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng checklist từ bảng checklist phía trên để tải file lên!');
      return;
    }

    if (this.fileInputHidden) {
      // Clear value cũ để cho phép chọn cùng 1 file liên tiếp nếu cần
      this.fileInputHidden.nativeElement.value = '';
      this.fileInputHidden.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const activeRule = this.selectedRule;
    if (!activeRule) return;

    const pathFolder = activeRule.PathFolder || activeRule.pathFolder;
    const subPath = this.getRelativeSubPath(pathFolder);

    if (!subPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xác định đường dẫn lưu file!');
      return;
    }

    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    // ── VALIDATION LỚP FRONTEND ──
    for (const file of filesToUpload) {
      const fileName = file.name;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      // 1. Kiểm tra định dạng (Type / FileFormat)
      const ruleType = activeRule.Type || activeRule.type;
      if (ruleType) {
        const allowedTypes = ruleType.split(/[,;|]/).map((t: string) => t.trim().replace(/^[\*\.]+/, '').toLowerCase());
        if (allowedTypes.length > 0 && !allowedTypes.includes('*') && !allowedTypes.includes('tất cả') && !allowedTypes.includes(ext)) {
          this.notification.error(NOTIFICATION_TITLE.error, `File "${fileName}" không đúng định dạng. Định dạng cho phép: ${ruleType}`);
          return;
        }
      }

      // 2. Kiểm tra tên quy chuẩn (FileName)
      const standardFileName = activeRule.FileName || activeRule.fileName;
      if (standardFileName) {
        const lastDotIdxStd = standardFileName.lastIndexOf('.');
        const standardBase = lastDotIdxStd !== -1 ? standardFileName.substring(0, lastDotIdxStd).trim().toLowerCase() : standardFileName.trim().toLowerCase();
        
        const lastDotIdxFile = fileName.lastIndexOf('.');
        const fileBase = lastDotIdxFile !== -1 ? fileName.substring(0, lastDotIdxFile).trim().toLowerCase() : fileName.trim().toLowerCase();
        
        if (!fileBase.includes(standardBase)) {
          this.notification.error(NOTIFICATION_TITLE.error, `Tên file "${fileName}" không đúng quy chuẩn. Tên file yêu cầu chứa từ khóa: "${standardBase}"`);
          return;
        }
      }
    }

    // 3. Kiểm tra số lượng (FileQuantity)
    const ruleFileQuantity = activeRule.FileQuantity !== undefined ? activeRule.FileQuantity : activeRule.fileQuantity;
    if (ruleFileQuantity > 0) {
      const currentCount = activeRule.Files?.length || 0;
      if (currentCount + filesToUpload.length > ruleFileQuantity) {
        this.notification.error(NOTIFICATION_TITLE.error, `Số lượng file tải lên vượt giới hạn! Tối đa chỉ được ${ruleFileQuantity} file cho yêu cầu này (hiện có ${currentCount} file).`);
        return;
      }
    }

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
              return this.projectGateStepService.saveFile(activeRule.ID, fileDto);
            });

            (forkJoin(saveRequests) as any).subscribe({
              next: (saveResults: any[]) => {
                this.notification.success(NOTIFICATION_TITLE.success, `Đã tải lên và lưu thành công ${uploadedFiles.length} file!`);
                this.loadFilesForRule(activeRule);
              },
              error: (saveErr: any) => {
                console.error('Lỗi lưu file vào DB:', saveErr);
                this.notification.error(NOTIFICATION_TITLE.error, 'Upload thành công nhưng lưu DB thất bại.');
                this.loadFilesForRule(activeRule);
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
  }

  deleteOneFile(file: any): void {
    const ruleId = file.ruleId || this.selectedRule?.ID;
    const cl = this.checklists.find(c => c.ID === ruleId);
    if (!cl) return;

    const currentUser = this.appUserService.currentUser;
    const currentEmpId = currentUser?.EmployeeID;
    const currentUsername = currentUser?.LoginName;

    let isOwner = false;
    if (file.EmployeeID && currentEmpId && file.EmployeeID === currentEmpId) {
      isOwner = true;
    } else if (file.CreatedBy && currentUsername && file.CreatedBy.toLowerCase() === currentUsername.toLowerCase()) {
      isOwner = true;
    }

    if (!isOwner) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bạn không thể xóa file của nhân viên khác');
      return;
    }

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa file: "${file.FileName}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.projectGateStepService.deleteFile(file.ID).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa file thành công!');
              if (cl.Files) {
                cl.Files = cl.Files.filter((f: any) => f.ID !== file.ID);
              }
              this.selectedFileIds.delete(file.ID);
              this.updateCheckedState();
              this.refreshDisplayFiles();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa file không thành công.');
            }
          },
          error: (err: any) => {
            console.error('Lỗi xóa file:', err);
            const msg = err?.error?.message || 'Lỗi hệ thống khi xóa file.';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          }
        });
      }
    });
  }

  onAllChecked(checked: boolean): void {
    const files = this.displayFiles;
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
    const files = this.displayFiles;
    if (files.length === 0) {
      this.allChecked = false;
      this.indeterminate = false;
      return;
    }
    const checkedCount = Array.from(this.selectedFileIds).filter(id => files.some(f => f.ID === id)).length;
    this.allChecked = checkedCount === files.length;
    this.indeterminate = checkedCount > 0 && checkedCount < files.length;
  }

  deleteSelectedFiles(): void {
    const fileIdsToDelete = Array.from(this.selectedFileIds);
    if (fileIdsToDelete.length === 0) return;

    const currentUser = this.appUserService.currentUser;
    const currentEmpId = currentUser?.EmployeeID;
    const currentUsername = currentUser?.LoginName;

    const isOwner = (f: any) => {
      if (f.EmployeeID && currentEmpId && f.EmployeeID === currentEmpId) {
        return true;
      }
      if (f.CreatedBy && currentUsername && f.CreatedBy.toLowerCase() === currentUsername.toLowerCase()) {
        return true;
      }
      return false;
    };

    const selectedFilesObj = this.displayFiles.filter(f => this.selectedFileIds.has(f.ID));
    const hasOtherUserFiles = selectedFilesObj.some(f => !isOwner(f));
    if (hasOtherUserFiles) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bạn không thể xóa file của nhân viên khác');
      return;
    }

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa nhiều file',
      nzContent: `Bạn có chắc chắn muốn xóa ${fileIdsToDelete.length} file đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteRequests = fileIdsToDelete.map(id => this.projectGateStepService.deleteFile(id));
        this.notification.info('Đang xóa', 'Đang thực hiện xóa các file đã chọn...');

        (forkJoin(deleteRequests) as any).subscribe({
          next: (results: any[]) => {
            this.checklists.forEach(cl => {
              if (cl.Files) {
                cl.Files = cl.Files.filter((f: any) => !fileIdsToDelete.includes(f.ID));
              }
            });
            this.selectedFileIds.clear();
            this.allChecked = false;
            this.indeterminate = false;
            this.refreshDisplayFiles();
            this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa thành công ${fileIdsToDelete.length} file!`);
          },
          error: (err: any) => {
            console.error('Lỗi xóa nhiều file:', err);
            const msg = err?.error?.message || 'Có lỗi xảy ra trong quá trình xóa hàng loạt file.';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
            this.reloadChecklists();
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
