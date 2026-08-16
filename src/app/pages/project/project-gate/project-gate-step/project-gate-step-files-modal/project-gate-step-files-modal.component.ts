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
import { ProjectWorkerService } from '../../../project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

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
    TableModule,
    HasPermissionDirective
  ],
  templateUrl: './project-gate-step-files-modal.component.html',
  styleUrls: ['./project-gate-step-files-modal.component.css']
})
export class ProjectGateStepFilesModalComponent implements OnInit {
  @Input() checklists: any[] = [];
  @Input() gateCode: string = '';
  @Input() gateName: string = '';
  @Input() projectCode: string = '';
  @Input() projectName: string = '';
  @Input() stepCode: string = '';
  @Input() stepLinkId!: number;
  @Input() selectedRuleId: number | null = null;
  @Input() isApproved: any = false;

  get isStepApproved(): boolean {
    return this.isApproved === true || this.isApproved === 1 || this.isApproved === '1' || this.isApproved === 'true';
  }

  selectedRule: any = null;
  allChecked = false;
  indeterminate = false;
  selectedFileIds = new Set<number>();
  invalidRuleIds = new Set<number>();

  // Cached properties — tránh gọi method trong template gây lag
  displayFiles: any[] = [];
  isUserLeader = false;
  workerEmployeeIds: number[] = [];
  canWorkerAction = false;

  @ViewChild('fileInputHidden') fileInputHidden!: ElementRef<HTMLInputElement>;

  constructor(
    public activeModal: NgbActiveModal,
    private projectGateStepService: ProjectGateStepService,
    private projectWorkerService: ProjectWorkerService,
    public appUserService: AppUserService,
    private permissionService: PermissionService,
    private notification: NzNotificationService,
    private modalService: NzModalService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isUserLeader = this.checkIsLeader();
    this.updateCanWorkerAction();
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
    }
    if (this.stepLinkId) {
      this.loadCheckLists();
      this.loadWorkers();
    } else if (this.checklists) {
      this.initCheckLists();
    }
  }

  loadWorkers(): void {
    if (!this.stepLinkId) return;
    this.projectGateStepService.getWorkersByStepLink(this.stepLinkId).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.workerEmployeeIds = res.data || [];
          this.updateCanWorkerAction();
        }
      },
      error: (err: any) => {
        console.error('Lỗi tải danh sách nhân viên thực hiện:', err);
      }
    });
  }

  updateCanWorkerAction(): void {
    const hasPerm = this.permissionService.hasPermission('N109,N110');
    const currentEmpId = this.appUserService.currentUser?.EmployeeID;
    const isWorker = currentEmpId ? this.workerEmployeeIds.includes(currentEmpId) : false;
    this.canWorkerAction = hasPerm || isWorker;
    this.cdr.markForCheck();
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
      const checkedCount = this.checklists?.filter(c => c._selected).length || 0;
      if (checkedCount <= 1) {
        this.checklists?.forEach(c => c._selected = (c.ID === this.selectedRule.ID));
      }
      this.loadFilesForRule(this.selectedRule);
    } else {
      this.refreshDisplayFiles();
    }
  }

  onChecklistCheckboxChange(cl: any, checked: boolean): void {
    cl._selected = checked;
    if (checked && cl.IsFile) {
      this.selectedRule = cl;
      this.selectedFileIds.clear();
      this.allChecked = false;
      this.indeterminate = false;
      this.loadFilesForRule(cl);
    } else if (!checked && this.selectedRule?.ID === cl.ID) {
      const remaining = this.checklists?.filter(c => c._selected && c.IsFile) || [];
      if (remaining.length === 1) {
        this.selectedRule = remaining[0];
        this.loadFilesForRule(this.selectedRule);
      } else if (remaining.length === 0) {
        this.selectedRule = null;
        this.refreshDisplayFiles();
      }
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
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
      return;
    }

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
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
      return;
    }

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
        const missingFileRules = res?.status === 1 && res.data && res.data.length > 0 ? res.data : [];
        const unconfirmedNVRules = selectedRules.filter(cl => !cl.IsPass);

        if (missingFileRules.length > 0 || unconfirmedNVRules.length > 0) {
          const warningMessages: string[] = [];

          if (unconfirmedNVRules.length > 0) {
            warningMessages.push('• Có check list chưa được nhân viên (NV) xác nhận hoàn thành.');
          }
          if (missingFileRules.length > 0) {
            warningMessages.push('• Có check list chưa tải đủ số lượng file yêu cầu.');
          }

          const violationContent = `
            <div class="text-danger fw-bold mb-2">Cảnh báo trước khi phê duyệt:</div>
            <div class="mb-2 text-dark">${warningMessages.join('<br/>')}</div>
            <div>Bạn có chắc chắn muốn tiếp tục thực hiện phê duyệt hay không?</div>
          `;

          this.modalService.confirm({
            nzTitle: 'Cảnh báo phê duyệt check list',
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
              if (missingFileRules.length > 0) {
                missingFileRules.forEach((v: any) => {
                  this.invalidRuleIds.add(v.DetailLinkID);
                });
              }
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
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
      return;
    }

    if (!this.selectedRule) {
      const checkedFileRules = this.checklists?.filter(c => c._selected && c.IsFile) || [];
      if (checkedFileRules.length === 1) {
        this.selectedRule = checkedFileRules[0];
        this.loadFilesForRule(this.selectedRule);
      } else if (checkedFileRules.length > 1) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn đang tích chọn nhiều quy tắc. Vui lòng click chọn 1 dòng quy tắc cụ thể để tải file lên!');
        return;
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng tích chọn checkbox hoặc click chọn một dòng checklist từ bảng phía trên để tải file lên!');
        return;
      }
    }

    if (this.fileInputHidden) {
      // Clear value cũ để cho phép chọn cùng 1 file liên tiếp nếu cần
      this.fileInputHidden.nativeElement.value = '';
      this.fileInputHidden.nativeElement.click();
    }
  }

  /**
   * Chuyển chuỗi tiếng Việt có dấu thành không dấu, viết hoa chữ cái đầu mỗi từ (PascalCase) và loại bỏ ký tự đặc biệt, dấu câu
   * Ví dụ: "Máy đóng gói, tự động - 2026" -> "MayDongGoiTuDong2026"
   */
  sanitizeProjectName(str: string): string {
    if (!str) return '';

    // 1. Chuyển tiếng Việt có dấu thành không dấu
    const nonAccent = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

    // 2. Tách từ theo khoảng trắng và các ký tự đặc biệt/dấu câu
    const words = nonAccent.split(/[^a-zA-Z0-9]+/);

    // 3. Viết hoa chữ cái đầu mỗi từ và ghép lại
    const pascalCase = words
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    return pascalCase || nonAccent.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Lấy phần tên cơ bản của file (loại bỏ đuôi mở rộng như .jpg, .png, .pdf nếu có, nhưng không cắt nhầm dấu chấm trong mã dự án như 1.25.023)
   */
  getFileNameBase(fileName: string): string {
    if (!fileName) return '';
    fileName = fileName.trim();

    const lastDot = fileName.lastIndexOf('.');
    if (lastDot > 0 && lastDot < fileName.length - 1) {
      const potentialExt = fileName.substring(lastDot + 1);
      if (potentialExt.length <= 6 && /^[a-zA-Z0-9]+$/.test(potentialExt) && isNaN(Number(potentialExt))) {
        return fileName.substring(0, lastDot).trim();
      }
    }
    return fileName;
  }

  /**
   * Kiểm tra tên file upload có khớp với mẫu quy chuẩn (hỗ trợ cả chuỗi tĩnh lẫn template regex: {ProjectCode}, {ProjectName}, {Rv}, {StepCode}, *)
   */
  isFileNameMatchStandard(uploadFileName: string, templateFileName: string): boolean {
    if (!templateFileName || !templateFileName.trim()) return true;

    let uploadBase = this.getFileNameBase(uploadFileName);
    const templateBase = this.getFileNameBase(templateFileName);

    const projCode = this.projectCode || this.selectedRule?.ProjectCode || '';
    const rawProjName = this.projectName || this.selectedRule?.ProjectName || '';

    // Bóc tách hậu tố unique do server upload sinh ra (_yyyyMMddHHmmss_guid) nếu có
    uploadBase = uploadBase.replace(/(_\d{14}_[a-fA-F0-9]{8})$/, '');
    if (projCode) {
      uploadBase = uploadBase.replace(new RegExp(`(_${projCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_\\d{14}_[a-fA-F0-9]{8})$`), '');
    }

    if (!/\{.*?\}|\*/.test(templateBase)) {
      return uploadBase.toLowerCase().includes(templateBase.toLowerCase());
    }

    const safeProjectCode = projCode ? projCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[a-zA-Z0-9_\\-\\.]+';
    const sanitizedProjName = this.sanitizeProjectName(rawProjName);
    const rawCleanProjName = rawProjName ? rawProjName.replace(/\s+/g, '') : '';

    let projNamePattern = '[a-zA-Z0-9_\\-\\.]+';
    if (sanitizedProjName && rawCleanProjName && sanitizedProjName.toLowerCase() !== rawCleanProjName.toLowerCase()) {
      projNamePattern = `(?:${sanitizedProjName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${rawCleanProjName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`;
    } else if (sanitizedProjName) {
      projNamePattern = sanitizedProjName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    let pattern = templateBase;
    pattern = pattern.replace(/([-_])(?:rv|revision|ver|version)$/i, '$1{Rv}');

    const parts = pattern.split(/(\{[^}]+\}|\*)/g);
    let patternStr = '^';

    for (const part of parts) {
      if (!part) continue;

      if (part === '*') {
        patternStr += '.*';
      } else if (part.startsWith('{') && part.endsWith('}')) {
        const token = part.substring(1, part.length - 1).trim();
        if (/^(?:projectcode|maduan)$/i.test(token)) {
          patternStr += safeProjectCode;
        } else if (/^(?:projectname|tenduan)$/i.test(token)) {
          patternStr += projNamePattern;
        } else if (/^(?:rv|revision|xx|ver|version)$/i.test(token)) {
          patternStr += '(?:Rv|rv|RV|v|V)?\\d*';
        } else if (/^(?:gatecode|magate)$/i.test(token)) {
          patternStr += '[a-zA-Z0-9_\\-]+';
        } else if (/^(?:stepcode|macongdoan)$/i.test(token)) {
          patternStr += '[a-zA-Z0-9_\\-]+';
        } else if (/^(?:any|text|all)$/i.test(token)) {
          patternStr += '.*';
        } else {
          patternStr += '[a-zA-Z0-9_\\-\\.]+';
        }
      } else {
        // Phần tĩnh: chỉ escape regex, giữ nguyên dấu - và _
        const escapedStatic = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patternStr += escapedStatic;
      }
    }

    patternStr += '$';

    try {
      const regex = new RegExp(patternStr, 'i');
      return regex.test(uploadBase);
    } catch (e) {
      console.error('Lỗi regex quy chuẩn tên file:', e);
      return uploadBase.toLowerCase().includes(templateBase.toLowerCase());
    }
  }

  /**
   * Sinh chuỗi tên file quy chuẩn mẫu với các biến động được thay thế bằng thông tin thực tế của dự án để người dùng dễ quan sát và copy
   */
  getResolvedStandardFileName(templateFileName: string, uploadFileName: string = ''): string {
    if (!templateFileName || !templateFileName.trim()) return '';

    const projCode = this.projectCode || this.selectedRule?.ProjectCode || 'MãDựÁn';
    const rawProjName = this.projectName || this.selectedRule?.ProjectName || 'TênDựÁn';
    const projName = this.sanitizeProjectName(rawProjName) || 'TenDuAn';
    const gateCode = this.gateCode || 'MãGate';
    const stepCode = this.stepCode || 'MãBước';

    let resolved = templateFileName.trim();
    resolved = resolved.replace(/\{(?:projectcode|maduan)\}/gi, projCode);
    resolved = resolved.replace(/\{(?:projectname|tenduan)\}/gi, projName);
    resolved = resolved.replace(/\{(?:gatecode|magate)\}/gi, gateCode);
    resolved = resolved.replace(/\{(?:stepcode|macongdoan)\}/gi, stepCode);
    resolved = resolved.replace(/\{(?:rv|revision|ver|version)\}/gi, 'Rv01');
    resolved = resolved.replace(/\{xx\}/gi, '01');
    resolved = resolved.replace(/\{(?:any|text|all)\}/gi, 'TenFile');
    resolved = resolved.replace(/\*/g, '');
    resolved = resolved.replace(/([-_])(?:rv|revision|ver|version)$/i, '$1RV01');

    // Nếu template chưa có phần đuôi mở rộng file (.jpg, .pdf, ...) thì lấy phần mở rộng của file upload đính kèm vào cho trực quan
    if (uploadFileName && !resolved.includes('.')) {
      const ext = uploadFileName.split('.').pop();
      if (ext && ext !== uploadFileName) {
        resolved = `${resolved}.${ext}`;
      }
    }

    return resolved;
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
        if (!this.isFileNameMatchStandard(fileName, standardFileName)) {
          const resolvedName = this.getResolvedStandardFileName(standardFileName, fileName);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            `Tên file "${fileName}" không đúng quy chuẩn.\nQuy chuẩn yêu cầu: "${resolvedName}" (Mẫu: ${standardFileName})`,
            { nzDuration: 9000 }
          );
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

    const projCode = this.projectCode || activeRule.ProjectCode || activeRule.projectCode || '';
    this.projectGateStepService.uploadMultipleFiles(filesToUpload, subPath, projCode).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          const uploadedFiles: any[] = res.data || [];
          if (uploadedFiles.length > 0) {
            const saveRequests: Observable<any>[] = uploadedFiles.map((fData: any) => {
              const fileDto = {
                FileName: fData.originalFileName || fData.OriginalFileName || fData.fileName || fData.FileName || fData.savedFileName || fData.SavedFileName,
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
                const errMsg = saveErr?.error?.message || 'Upload thành công nhưng lưu DB thất bại.';
                this.notification.error(NOTIFICATION_TITLE.error, errMsg);
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
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
      return;
    }

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
    if (this.isStepApproved) {
      this.notification.warning(NOTIFICATION_TITLE.warning || 'Thông báo', 'Công đoạn này đã được phê duyệt. Bạn chỉ có quyền xem!');
      return;
    }

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

  copyFilePath(file: any): void {
    if (!file || !file.FilePath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy đường dẫn file để sao chép!');
      return;
    }
    const path = file.FilePath;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(path).then(() => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Đã sao chép đường dẫn file vào bộ nhớ tạm!');
      }).catch(() => {
        this.fallbackCopyTextToClipboard(path);
      });
    } else {
      this.fallbackCopyTextToClipboard(path);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.notification.success(NOTIFICATION_TITLE.success, 'Đã sao chép đường dẫn file vào bộ nhớ tạm!');
    } catch (err) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể sao chép đường dẫn file!');
    }
    document.body.removeChild(textArea);
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
        this.notification.error(NOTIFICATION_TITLE.error, 'File không tồn tại trên hệ thống hoặc đã bị xóa trên máy chủ server!');
        if (file && file.ID) {
          file.Status = 0;
          this.cdr.markForCheck();
          this.projectGateStepService.updateFileStatus(file.ID, 0).subscribe({
            next: () => {},
            error: (e: any) => console.error('Lỗi cập nhật trạng thái file không tồn tại:', e)
          });
        }
      }
    });
  }
}

