import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgModule } from '@angular/core';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
  Optional,
  Inject,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { JobRequirementService } from './job-requirement-service/job-requirement.service';
// import { HandoverFormComponent } from './handover-form/handover-form.component';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HrPurchaseProposalComponent } from '../hr-purchase-proposal/hr-purchase-proposal.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { RecommendSupplierFormComponent } from './recommend-supplier-form/recommend-supplier-form.component';
import { JobRequirementFormComponent } from './job-requirement-form/job-requirement-form.component';
import { CancelApproveReasonFormComponent } from './cancel-approve-reason-form/cancel-approve-reason-form.component';
import { AuthService } from '../../../auth/auth.service';
import { NoteFormComponent } from './note-form/note-form.component';
import { ProjectPartlistPriceRequestFormComponent } from '../../old/project-partlist-price-request/project-partlist-price-request-form/project-partlist-price-request-form.component';
import { JobRequirementPurchaseRequestViewComponent } from './job-requirement-purchase-request-view/job-requirement-purchase-request-view.component';
import { JobRequirementSummaryComponent } from './job-requirement-summary/job-requirement-summary.component';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../shared/pdf/vfs_fonts_custom.js';
import { environment } from '../../../../environments/environment';

(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = {
  Times: {
    normal: 'TIMES.ttf',
    bold: 'TIMESBD.ttf',
    bolditalics: 'TIMESBI.ttf',
    italics: 'TIMESI.ttf',
  },
};

@Component({
  selector: 'app-job-requirement',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    NzDropDownModule,
    NzMenuModule,
    HasPermissionDirective,
  ],
  templateUrl: './job-requirement.component.html',
  styleUrl: './job-requirement.component.css'
})
export class JobRequirementComponent implements OnInit, AfterViewInit {

  @ViewChild('JobrequirementTable') tableRef1!: ElementRef;
  @ViewChild('JobrequirementDetailTable') tableRef2!: ElementRef;
  @ViewChild('JobrequirementFileTable') tableRef3!: ElementRef;
  @ViewChild('JobrequirementApprovedTable') tableRef4!: ElementRef;

  @Input() approvalMode: 1 | 2 | 3 | null = null;

  searchParams = {
    DateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    DateEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    Request: '',
    EmployeeID: 0,
    DepartmentID: 0,

    ApprovedTBPID: 0,
    Step: 0,


  };

  JobrequirementData: any[] = [];
  JobrequirementTable: Tabulator | null = null;

  JobrequirementID: number = 0;
  DepartmentRequiredID: number = 0;
  data: any[] = [];
  dataDepartment: any[] = [];
  cbbEmployee: any[] = [];

  JobrequirementDetailData: any[] = [];
  JobrequirementDetailTable: Tabulator | null = null;

  JobrequirementFileData: any[] = [];
  JobrequirementFileTable: Tabulator | null = null;

  JobrequirementApprovedData: any[] = [];
  JobrequirementApprovedTable: Tabulator | null = null;

  HCNSApprovalData: any[] = [];
  isHCNSApproved: boolean = false; // Trạng thái đã duyệt HCNS hay chưa

  sizeSearch: string = '0';
  isCheckmode: boolean = false;
  dateFormat = 'dd/MM/yyyy';

  dataInput: any = {};

  ngOnInit(): void {
    this.getJobrequirement();
    this.getdataEmployee();
    this.getdataDepartment();
  }
  ngAfterViewInit(): void {
    this.draw_JobrequirementTable();
    this.draw_JobrequirementDetailTable();
    this.draw_JobrequirementFileTable();
    this.draw_JobrequirementApprovedTable();
  }

  currentUser: any = null;

  constructor(
    private notification: NzNotificationService,
    private JobRequirementService: JobRequirementService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService,
    private menuEventService: MenuEventService,
    private authService: AuthService,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;

        // Xử lý tabData sau khi currentUser đã được load
        if (this.tabData?.typeApprove) {
          const typeApprove = this.tabData.typeApprove;
          if (typeApprove === 2) {
            this.approvalMode = 1;
            if (this.currentUser?.EmployeeID) {
              this.searchParams.ApprovedTBPID = this.currentUser.EmployeeID;
            }
          } else if (typeApprove === 1) {
            this.approvalMode = 2;
          } else if (typeApprove === 3) {
            this.approvalMode = 3;
          }
        }
    
        if (this.approvalMode === 1 && this.currentUser?.EmployeeID) {
          this.searchParams.ApprovedTBPID = this.currentUser.EmployeeID;
          this.getJobrequirement();
        }
      },
      error: (err: any) => {
      this.notification.error("Lỗi", err.error.message);
      }
    });
  }

  //search
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus =
      status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center; font-size: 10px !important; padding: 2px 6px !important;">Không xác định</span>';
    }
  }

  getJobrequirement(): void {
    this.JobRequirementService.getJobrequirement(
      this.searchParams.DepartmentID,
      this.searchParams.EmployeeID,
      this.searchParams.ApprovedTBPID,
      this.searchParams.Step,
      this.searchParams.Request,
      this.searchParams.DateStart,
      this.searchParams.DateEnd
    ).subscribe((response: any) => {
      this.JobrequirementData = response.data || [];
      if (this.JobrequirementTable) {
        this.JobrequirementTable.setData(this.JobrequirementData || []);
        this.JobrequirementID =
          this.JobrequirementData.length > 0
            ? this.JobrequirementData[0].ID
            : 0;
      //   if (this.JobrequirementID) {
      //  //    this.getJobrequirementDetails(this.JobrequirementID);
      //   }
      } else {
        this.draw_JobrequirementTable();
      }
    });
  }

  /**
   * Gọi API một lần để lấy tất cả dữ liệu: details, files, approves
   */
  getJobrequirementDetails(id: number) {
    this.JobRequirementService.getJobrequirementbyID(id).subscribe(
      (response: any) => {
        const data = response.data || {};

        // Cập nhật details
        this.JobrequirementDetailData = data.details || [];
        if (this.JobrequirementDetailTable) {
          this.JobrequirementDetailTable.setData(this.JobrequirementDetailData);
        } else {
          this.draw_JobrequirementDetailTable();
        }

        // Cập nhật files
        this.JobrequirementFileData = data.files || [];
        if (this.JobrequirementFileTable) {
          this.JobrequirementFileTable.setData(this.JobrequirementFileData);
        } else {
          this.draw_JobrequirementFileTable();
        }

        // Cập nhật approves
        this.JobrequirementApprovedData = data.approves || [];
        if (this.JobrequirementApprovedTable) {
          this.JobrequirementApprovedTable.setData(
            this.JobrequirementApprovedData
          );
        } else {
          this.draw_JobrequirementApprovedTable();
        }
      }
    );
  }

  getdataDepartment() {
    this.JobRequirementService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }
  getdataEmployee() {
    this.JobRequirementService.getAllEmployee().subscribe((response: any) => {
      this.cbbEmployee = response.data || [];
    });
  }

  getHCNSData(JobrequirementID: number): void {
    if (!JobrequirementID || JobrequirementID === 0) {
      this.HCNSApprovalData = [];
      this.isHCNSApproved = false;
      return;
    }

    this.JobRequirementService
      .getHCNSProposals(
        JobrequirementID,
        this.DepartmentRequiredID,
        this.searchParams.DateStart,
        this.searchParams.DateEnd
      )
      .subscribe({
        next: (response: any) => {
          this.HCNSApprovalData = response.data?.HCNSProPosalData || [];

          // Chỉ chặn khi có bản ghi đã được duyệt (IsApproved = 1)
          // 0: Chưa duyệt, 1: Đã duyệt, 2: Hủy duyệt
          this.isHCNSApproved = this.HCNSApprovalData.some((item: any) => {
            const isApproved = item.IsApproved;
            // Chỉ chặn khi IsApproved = 1 (Đã duyệt)
            return isApproved === 1 || isApproved === '1';
          });
        },
        error: (err) => {
          this.HCNSApprovalData = [];
          this.isHCNSApproved = false;
        },
      });
  }

  /**
   * Kiểm tra xem có thể thêm mới hoặc sửa không
   */
  canAddOrEdit(): boolean {
    return !this.isHCNSApproved;
  }

  onAddSupplier(isEditmode: boolean) {
    this.isCheckmode = isEditmode;
    if (this.isCheckmode == true && this.JobrequirementID === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 bản ghi để sửa!'
      );
      return;
    }

    // Kiểm tra nếu đã duyệt thì không cho phép thêm mới hoặc sửa
    if (this.isHCNSApproved) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không thể thêm mới hoặc chỉnh sửa bản ghi đã được duyệt!'
      );
      return;
    }

    const selected = this.JobrequirementTable?.getSelectedData() || [];
    const rowData = { ...selected[0] };
    const modalRef = this.modalService.open(RecommendSupplierFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.JobrequirementID = this.JobrequirementID;
    modalRef.componentInstance.dataInput = rowData;

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.getJobrequirement();
          this.draw_JobrequirementTable();
          // Reload HCNS data để cập nhật trạng thái
          if (this.JobrequirementID) {
            this.getHCNSData(this.JobrequirementID);
          }
        }
      })
      .catch(() => { });
  }

  onAddJobRequirement(isEditmode: boolean) {
    this.isCheckmode = isEditmode;

    // Nếu là chế độ sửa, cần kiểm tra có row được chọn không
    if (this.isCheckmode == true) {
      const selected = this.JobrequirementTable?.getSelectedData() || [];
      if (selected.length === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn 1 bản ghi để sửa!'
        );
        return;
      }

      const rowData = { ...selected[0] };
      const jobRequirementID = rowData?.ID || 0;

      if (!jobRequirementID || jobRequirementID <= 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không tìm thấy ID của bản ghi!'
        );
        return;
      }

      // Kiểm tra nếu đã duyệt thì không cho phép sửa
      if (this.isHCNSApproved) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không thể chỉnh sửa bản ghi đã được duyệt!'
        );
        return;
      }

      const modalRef = this.modalService.open(JobRequirementFormComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });
      modalRef.componentInstance.isCheckmode = this.isCheckmode;
      modalRef.componentInstance.JobRequirementID = jobRequirementID;
      modalRef.componentInstance.dataInput = rowData;

      modalRef.result
        .then((result) => {
          if (result == true) {
            this.getJobrequirement();
            this.draw_JobrequirementTable();
          }
        })
        .catch(() => { });
    } else {
      // Thêm mới: không cần chọn row, không cần ID
      // Kiểm tra nếu đã duyệt thì không cho phép thêm mới (nếu cần)
      // if (this.isHCNSApproved) {
      //   this.notification.warning(
      //     NOTIFICATION_TITLE.warning,
      //     'Không thể thêm mới bản ghi đã được duyệt!'
      //   );
      //   return;
      // }

      const modalRef = this.modalService.open(JobRequirementFormComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });
      modalRef.componentInstance.isCheckmode = this.isCheckmode;
      modalRef.componentInstance.JobRequirementID = 0; // Thêm mới nên ID = 0
      modalRef.componentInstance.dataInput = {}; // Không có data input khi thêm mới

      modalRef.result
        .then((result) => {
          if (result == true) {
            this.getJobrequirement();
            this.draw_JobrequirementTable();
          }
        })
        .catch(() => { });
    }
  }
  onDeleteJobRequirement() {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }

    // Lấy danh sách ID từ các row được chọn
    const ids = selected.map((row: any) => row.ID).filter((id: number) => id && id > 0);

    if (ids.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi cần xóa!'
      );
      return;
    }

    // Hiển thị confirm dialog
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} bản ghi đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.JobRequirementService.deleteJobRequirement(ids).subscribe({
          next: (response: any) => {
            if (response.status == 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                response.message || 'Xóa thành công!'
              );
              // Refresh lại table
              this.getJobrequirement();
              // Reset selection
              this.JobrequirementID = 0;
              this.JobrequirementDetailData = [];
              this.JobrequirementFileData = [];
              this.JobrequirementApprovedData = [];
              if (this.JobrequirementDetailTable) {
                this.JobrequirementDetailTable.setData([]);
              }
              if (this.JobrequirementFileTable) {
                this.JobrequirementFileTable.setData([]);
              }
              if (this.JobrequirementApprovedTable) {
                this.JobrequirementApprovedTable.setData([]);
              }
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Xóa thất bại!'
              );
            }
          },
          error: (error: any) => {
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Xóa thất bại!';
            this.notification.error(
              NOTIFICATION_TITLE.error,
              errorMessage
            );
          }
        });
      }
    });
  }

  onOpenDepartmentRequired() {
    const selected = this.JobrequirementTable?.getSelectedData() || [];
    const rowData = { ...selected[0] };

    // Lấy JobrequirementID từ row đã chọn hoặc từ biến
    const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;

    const title = 'Đề xuất mua hàng';
    const data = {
      JobrequirementID: jobRequirementID,
      isCheckmode: this.isCheckmode,
      dataInput: rowData
    };

    this.menuEventService.openNewTab(
      HrPurchaseProposalComponent,
      title,
      data
    );
  }

  /**
   * Xem yêu cầu báo giá
   */
  onViewPriceQuote(): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một bản ghi để xem yêu cầu báo giá!'
      );
      return;
    }

    const rowData = selected[0];
    const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;

    if (jobRequirementID <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }
  }

  /**
   * Xem yêu cầu mua hàng
   */
  onViewPurchaseRequest(): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một bản ghi để xem yêu cầu mua hàng!'
      );
      return;
    }

    const rowData = selected[0];
    const jobRequirementID = rowData?.ID || this.JobrequirementID || 0;
    const numberRequest = rowData?.NumberRequest || rowData?.Code || '';

    if (jobRequirementID <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }

    // Mở modal fullscreen
    const modalRef = this.modalService.open(JobRequirementPurchaseRequestViewComponent, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'job-requirement-purchase-request-modal',
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.jobRequirementID = jobRequirementID;
    modalRef.componentInstance.numberRequest = numberRequest;

    modalRef.result.then(
      (result) => {
        // Handle result if needed
      },
      () => {
        // Modal dismissed
      }
    );
  }

  /**
   * Tổng hợp yêu cầu công việc - mở modal JobRequirementSummaryComponent
   */
  onOpenSummary(): void {
    const modalRef = this.modalService.open(JobRequirementSummaryComponent, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'job-requirement-summary-modal',
    });

    modalRef.result.then(
      (result) => {
        // Handle result if needed
      },
      () => {
        // Modal dismissed
      }
    );
  }

  /**
   * In phiếu yêu cầu công việc
   */
  onPrintJobRequirement(): void {
    if (!this.JobrequirementID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn yêu cầu công việc cần in!'
      );
      return;
    }

    // Lấy dữ liệu chi tiết của yêu cầu công việc
    this.JobRequirementService.getJobrequirementbyID(this.JobrequirementID).subscribe({
      next: (response: any) => {
        const data = response.data || {};

        // Lấy thông tin chính từ bảng JobrequirementData
        const selectedRow = this.JobrequirementTable?.getSelectedData()[0];
        const jobRequirement = selectedRow || {};

        // Lấy chi tiết từ response
        const details = data.details || [];
        const approvals = data.approves || [];
        const files = data.files || [];

        // Load logo và tạo PDF
        this.loadImageAsBase64('assets/images/logo-RTC-2023-1200-banchuan.png').then((logoBase64) => {
          const docDefinition = this.createJobRequirementPDF(jobRequirement, details, approvals, files, logoBase64);
          pdfMake.createPdf(docDefinition).open();
        }).catch((err) => {
          // Nếu không load được logo, tạo PDF không có logo
          const docDefinition = this.createJobRequirementPDF(jobRequirement, details, approvals, files, null);
          pdfMake.createPdf(docDefinition).open();
        });
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi lấy dữ liệu: ' + (err?.error?.message || err?.message)
        );
      }
    });
  }

  /**
   * Load ảnh và chuyển sang base64
   */
  private loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject('Cannot get canvas context');
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Tạo PDF definition cho yêu cầu công việc
   */
  private createJobRequirementPDF(jobRequirement: any, details: any[], approvals: any[], files: any[], logoBase64: string | null): any {
    // Format date helper
    const formatDate = (date: any) => {
      if (!date) return '';
      return DateTime.fromISO(date).toFormat('dd/MM/yyyy');
    };

    // Format date time helper
    const formatDateTime = (date: any) => {
      if (!date) return '';
      return DateTime.fromISO(date).toFormat('dd/MM/yyyy HH:mm');
    };

    // Extract approval information
    const extractApprovalInfo = (step: number) => {
      const approval = approvals.find((a: any) => a.Step === step && (a.IsApproved === 1 || a.IsApproved === '1'));
      if (approval) {
        return {
          date: formatDateTime(approval.DateApproved),
          approver: approval.EmployeeActualName || approval.EmployeeName || ''
        };
      }
      return { date: '', approver: '' };
    };

    // Get approval info for each step
    const tbpApproval = extractApprovalInfo(2); // TBP duyệt
    const hrApproval = extractApprovalInfo(4);  // TBP HCNS duyệt  
    const bgdApproval = extractApprovalInfo(5); // BGĐ duyệt

    // Tạo danh sách chi tiết cho bảng "Nội dung yêu cầu"
    const detailRows = details.map((item: any, index: number) => [
      { text: (index + 1).toString(), alignment: 'center', fontSize: 10 },
      { text: item.Category || '', fontSize: 10 },
      { text: item.Description || '', fontSize: 10 },
      { text: item.Target || '', fontSize: 10 },
      { text: item.Note || '', fontSize: 10 },
    ]);

    // Logo column
    const logoColumn = logoBase64
      ? {
        width: 100,
        image: logoBase64,
        fit: [150, 150],
        margin: [0, 0, 10, 0],
      }
      : {
        width: 80,
        text: '',
        margin: [0, 0, 10, 0],
      };

    const docDefinition = {
      info: {
        title: 'Phiếu yêu cầu công việc - ' + (jobRequirement.NumberRequest || ''),
      },
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header với logo và tiêu đề
        {
          columns: [
            logoColumn,
            {
              width: '*',
              stack: [
                {
                  text: 'PHIẾU YÊU CẦU CÔNG VIỆC',
                  alignment: 'center',
                  bold: true,
                  fontSize: 16,
                },
                {
                  text: 'Số: ' + (jobRequirement.NumberRequest || ''),
                  alignment: 'center',
                  fontSize: 10,
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },
        // Thông tin bộ phận
        {
          table: {
            widths: [140, '*'],
            body: [
              [
                { text: 'Bộ phận yêu cầu', bold: true },
                { text: ': ' + (jobRequirement.EmployeeDepartment || '') },
              ],
              [
                { text: 'Bộ phận được yêu cầu', bold: true },
                { text: ': ' + (jobRequirement.RequiredDepartment || '') },
              ],
              [
                { text: 'Bộ phận phối hợp', bold: true },
                { text: ': ' + (jobRequirement.CoordinationDepartment || '') },
              ],
              [
                { text: 'Người phê duyệt', bold: true },
                { text: ': ' + (jobRequirement.FullNameApprovedTBP || '') },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10],
        },
        // Nội dung yêu cầu
        {
          text: 'Nội dung yêu cầu:',
          bold: true,
          fontSize: 11,
          margin: [0, 5, 0, 5],
        },
        {
          table: {
            headerRows: 1,
            widths: [30, 80, '*', 100, 80],
            body: [
              [
                { text: 'TT', alignment: 'center', bold: true, fontSize: 11 },
                { text: 'Hạng mục', alignment: 'center', bold: true, fontSize: 11 },
                { text: 'Diễn giải', alignment: 'center', bold: true, fontSize: 11 },
                { text: 'Mục tiêu cần đạt', alignment: 'center', bold: true, fontSize: 11 },
                { text: 'Ghi chú', alignment: 'center', bold: true, fontSize: 11 },
              ],
              ...detailRows,
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
          },
          margin: [0, 0, 0, 10],
        },
        // Tài liệu kèm theo
        ...(files.length > 0 ? [
          {
            text: 'Tài liệu kèm theo Phiếu yêu cầu công việc: ',
            fontSize: 10,
            margin: [0, 10, 0, 5],
          },
          {
            ul: files.map((file: any) => file.FileName || file.FileName || ''),
            fontSize: 9,
            margin: [0, 0, 0, 30],
          }
        ] : [
          {
            text: 'Tài liệu kèm theo Phiếu yêu cầu công việc: Không có',
            fontSize: 10,
            margin: [0, 10, 0, 30],
          }
        ]),
        // Đánh giá mức độ hoàn thành
        {
          text: 'Đánh giá mức độ hoàn thành: ',
          bold: true,
          fontSize: 10,
          margin: [0, 10, 0, 20],
        },
        // Chữ ký
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatDate(jobRequirement.DateRequest), alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                { text: 'Trưởng bộ phận yêu cầu', alignment: 'center', bold: true, fontSize: 10 },
                { text: jobRequirement.EmployeeName || '', alignment: 'center', fontSize: 10, margin: [0, 50, 0, 0] },
              ],
            },
            {
              width: '*',
              stack: [
                { text: hrApproval.date, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                { text: 'TBP HCNS duyệt', alignment: 'center', bold: true, fontSize: 10 },
                { text: hrApproval.approver, alignment: 'center', fontSize: 10, margin: [0, 50, 0, 0] },
              ],
            },
            {
              width: '*',
              stack: [
                { text: bgdApproval.date, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] },
                { text: 'BGĐ duyệt', alignment: 'center', bold: true, fontSize: 10 },
                { text: bgdApproval.approver, alignment: 'center', fontSize: 10, margin: [0, 50, 0, 0] },
              ],
            },
          ],
          margin: [0, 0, 0, 0],
        },
      ],
      defaultStyle: {
        fontSize: 10,
        font: 'Times',
      },
    };

    return docDefinition;
  }

  /**
   * Yêu cầu báo giá - mở form ProjectPartlistPriceRequestFormComponent
   */
  onRequestPriceQuote(): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một bản ghi!'
      );
      return;
    }

    const rowData = selected[0];
    const id = rowData?.ID || 0;
    const noteJobRequirement = rowData?.Note || '';
    const numberRequest = rowData?.NumberRequest || rowData?.Code || '';

    if (id <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }

    // Kiểm tra BGĐ đã duyệt chưa (Step 5, IsApproved = 1)
    const bgdApproved = this.JobrequirementApprovedData.find((item: any) =>
      item.JobRequirementID === id &&
      item.Step === 5 &&
      (item.IsApproved === 1 || item.IsApproved === '1')
    );

    if (!bgdApproved) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Yêu cầu công việc [${numberRequest}] cần được BGĐ duyệt trước khi yêu cầu báo giá!`
      );
      return;
    }

    // Tìm detail có STT = 4
    const detail = this.JobrequirementDetailData.find((item: any) => item.STT === 4);
    const qty = detail?.Description ? parseInt(detail.Description) || 0 : 0;

    // Mở modal form
    const modalRef = this.modalService.open(ProjectPartlistPriceRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // Truyền dữ liệu vào form
    modalRef.componentInstance.jobRequirementID = id;
    modalRef.componentInstance.projectTypeID = 3; // Hàng HR
    modalRef.componentInstance.noteJobRequirement = noteJobRequirement;
    modalRef.componentInstance.qty = qty;
    modalRef.componentInstance.dataInput = [];

    // Xử lý kết quả khi form đóng
    modalRef.result
      .then((result: any) => {
        if (result === 'saved' || result === true) {
          // Cập nhật trạng thái: IsRequestPriceQuote = true, Status = 2
          const model = {
            ID: id,
            IsRequestPriceQuote: true,
            Status: 2, // Chưa hoàn thành
            UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
            UpdatedDate: new Date().toISOString()
          };

          // Gọi API cập nhật
          this.JobRequirementService.saveRequestBGDApprove(model).subscribe({
            next: (response: any) => {
              if (response && response.status === 1) {
                this.notification.success(
                  NOTIFICATION_TITLE.success,
                  'Yêu cầu báo giá đã được tạo thành công!'
                );
                // Refresh lại table
                this.getJobrequirement();
                // Refresh lại details nếu có JobRequirementID
                if (this.JobrequirementID) {
                  this.getJobrequirementDetails(this.JobrequirementID);
                }
              } else {
                const errorMessage = response?.message || 'Không thể cập nhật trạng thái!';
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  errorMessage
                );
              }
            },
            error: (error: any) => {
              const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi cập nhật trạng thái!';
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errorMessage
              );
            }
          });
        }
      })
      .catch(() => {
        // User cancelled, do nothing
      });
  }

  /**
   * Xác nhận hoàn thành yêu cầu công việc (BPPH)
   */
  onConfirmComplete(): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một bản ghi!'
      );
      return;
    }

    const rowData = selected[0];
    const id = rowData?.ID || 0;
    const numberRequest = rowData?.NumberRequest || rowData?.Code || '';
    const status = rowData?.Status || 0;

    if (id <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }

    // Kiểm tra BGĐ đã duyệt chưa (Step 5, IsApproved = 1)
    const bgdApproved = this.JobrequirementApprovedData.find((item: any) =>
      item.JobRequirementID === id &&
      item.Step === 5 &&
      (item.IsApproved === 1 || item.IsApproved === '1')
    );

    if (!bgdApproved) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Yêu cầu công việc [${numberRequest}] cần được BGĐ duyệt!`
      );
      return;
    }

    // Kiểm tra đã hoàn thành chưa
    if (status === 1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Yêu cầu công việc [${numberRequest}] đã hoàn thành!`
      );
      return;
    }

    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn xác nhận hoàn thành yêu cầu công việc [${numberRequest}] không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Tạo model để gửi API
        const model = {
          ID: id,
          Status: 1, // Hoàn thành công việc
          UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
          UpdatedDate: new Date().toISOString()
        };

        // Gọi API
        this.JobRequirementService.saveRequestBGDApprove(model).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xác nhận hoàn thành thành công!'
              );
              // Refresh lại table
              this.getJobrequirement();
              // Refresh lại details nếu có JobRequirementID
              if (this.JobrequirementID) {
                this.getJobrequirementDetails(this.JobrequirementID);
              }
            } else {
              const errorMessage = response?.message || 'Không thể xác nhận hoàn thành!';
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errorMessage
              );
            }
          },
          error: (error: any) => {
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi xác nhận hoàn thành!';
            this.notification.error(
              NOTIFICATION_TITLE.error,
              errorMessage
            );
          }
        });
      }
    });
  }

  /**
   * Mở modal để nhập ghi chú
   */
  onOpenNoteModal(): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một bản ghi để thêm ghi chú!'
      );
      return;
    }

    const rowData = selected[0];
    const id = rowData?.ID || 0;

    if (id <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }

    const currentNote = rowData?.Note || '';
    const numberRequest = rowData?.NumberRequest || rowData?.Code || '';

    // Mở modal component
    const modalRef = this.modalService.open(NoteFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // Set initial note value trước khi component khởi tạo
    modalRef.componentInstance.initialNote = currentNote;

    // Handle modal result
    modalRef.result
      .then((result: any) => {
        if (result && result.confirmed) {
          const note = result.note || '';

          // Tạo model để gửi API
          const model = {
            ID: id,
            Note: note,
            UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
            UpdatedDate: new Date().toISOString()
          };

          // Gọi API save-comment
          this.JobRequirementService.saveComment(model).subscribe({
            next: (response: any) => {
              if (response && response.status === 1) {
                this.notification.success(
                  NOTIFICATION_TITLE.success,
                  'Lưu ghi chú thành công!'
                );
                // Refresh lại table
                this.getJobrequirement();
                // Refresh lại details nếu có JobRequirementID
                if (this.JobrequirementID) {
                  this.getJobrequirementDetails(this.JobrequirementID);
                }
              } else {
                const errorMessage = response?.message || 'Không thể lưu ghi chú!';
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  errorMessage
                );
              }
            },
            error: (error: any) => {
              const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi lưu ghi chú!';
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errorMessage
              );
            }
          });
        }
      })
      .catch(() => {
        // User cancelled, do nothing
      });
  }

  onDeleteJobrequirement() { }

  /**
   * Xem file (ảnh) trong modal hoặc tab mới
   * Chuyển đổi UNC path sang HTTP URL sử dụng environment.host và api/share
   */
  viewFile(fileData: any): void {
    const filePath = fileData?.FilePath || '';
    const fileName = fileData?.FileName || 'file';

    if (!filePath) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy đường dẫn file!'
      );
      return;
    }

    try {
      // Tìm vị trí "Common" trong đường dẫn (không phân biệt hoa thường)
      const commonIndex = filePath.toLowerCase().indexOf('common');
      
      if (commonIndex === -1) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Đường dẫn file không chứa thư mục Common!'
        );
        return;
      }

      // Lấy phần đường dẫn từ "Common" trở đi
      let pathAfterCommon = filePath.substring(commonIndex);
      
      // Chuyển đổi backslash thành forward slash
      pathAfterCommon = pathAfterCommon.replace(/\\/g, '/');
      
      // Đảm bảo bắt đầu bằng "Common/" (không phải "common/")
      if (!pathAfterCommon.startsWith('Common/')) {
        pathAfterCommon = 'Common/' + pathAfterCommon.substring(pathAfterCommon.indexOf('/') + 1);
      }
      
      // Ghép với environment.host và api/share
      const url = `${environment.host}api/share/${pathAfterCommon}`;

      // Kiểm tra extension file để quyết định cách hiển thị
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      const isImage = imageExtensions.includes(fileExtension);

      if (isImage) {
        // Nếu là ảnh, mở trong modal để xem
        this.modal.create({
          nzTitle: fileName,
          nzContent: `
            <div style="text-align: center; padding: 10px;">
              <img 
                src="${url}" 
                style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" 
                alt="${fileName}"
                onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' font-family=\\'Arial\\' font-size=\\'16\\' fill=\\'%23999\\'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';"
              />
            </div>
          `,
          nzWidth: '90%',
          nzStyle: { top: '20px' },
          nzBodyStyle: { padding: '20px', textAlign: 'center', overflow: 'auto', maxHeight: '90vh' },
          nzFooter: null,
          nzMaskClosable: true,
          nzClosable: true
        });
      } else {
        // Nếu không phải ảnh, mở trong tab mới
        window.open(url, '_blank');
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Đang mở file: ${fileName}`
        );
      }
    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xem file: ' + (error?.message || '')
      );
    }
  }

  /**
   * Tải file từ FilePath
   * Chuyển đổi UNC path sang HTTP URL sử dụng environment.host và api/share
   */
  downloadFile(fileData: any): void {
    const filePath = fileData?.FilePath || '';
    const fileName = fileData?.FileName || 'file';

    if (!filePath) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy đường dẫn file!'
      );
      return;
    }

    try {
      // Tìm vị trí "Common" trong đường dẫn (không phân biệt hoa thường)
      const commonIndex = filePath.toLowerCase().indexOf('common');
      
      if (commonIndex === -1) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Đường dẫn file không chứa thư mục Common!'
        );
        return;
      }

      // Lấy phần đường dẫn từ "Common" trở đi
      let pathAfterCommon = filePath.substring(commonIndex);
      
      // Chuyển đổi backslash thành forward slash
      pathAfterCommon = pathAfterCommon.replace(/\\/g, '/');
      
      // Đảm bảo bắt đầu bằng "Common/" (không phải "common/")
      if (!pathAfterCommon.startsWith('Common/')) {
        pathAfterCommon = 'Common/' + pathAfterCommon.substring(pathAfterCommon.indexOf('/') + 1);
      }
      
      // Ghép với environment.host và api/share
      const url = `${environment.host}api/share/${pathAfterCommon}`;

      // Mở URL trong tab mới để tải file
      window.open(url, '_blank');
      
      this.notification.success(
        NOTIFICATION_TITLE.success,
        `Đang tải file: ${fileName}`
      );
    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi tải file: ' + (error?.message || '')
      );
    }
  }

  /**
   * Map button name sang step và status
   * @param buttonName Tên button (ví dụ: btnApproveTBP_New, btnUnApproveTBP_New, etc.)
   * @returns Object { step: number, status: number } hoặc null nếu không tìm thấy
   */
  private getStepAndStatusFromButton(buttonName: string): { step: number; status: number } | null {
    // Status: 1 = duyệt, 2 = hủy
    const buttonMap: { [key: string]: { step: number; status: number } } = {
      // Step 2: TBP xác nhận
      'btnApproveTBP_New': { step: 2, status: 1 },
      'btnUnApproveTBP_New': { step: 2, status: 2 },
      'btnTBP': { step: 2, status: 1 }, // Default approve cho TBP

      // Step 3: HR check yêu cầu
      'btnApproveDocumentHR': { step: 3, status: 1 },
      'btnUnApproveDocumentHR': { step: 3, status: 2 },

      // Step 4: TBP HR xác nhận
      'btnApproveHR': { step: 4, status: 1 },
      'btnUnApproveHR': { step: 4, status: 2 },

      // Step 5: BGĐ xác nhận
      'btnSuccessApproved': { step: 5, status: 1 },
      'btnBGĐ': { step: 5, status: 1 },
      'btnUnApproveBGĐ': { step: 5, status: 2 },
    };

    return buttonMap[buttonName] || null;
  }

  /**
   * Xử lý duyệt/hủy duyệt job requirement
   * @param buttonName Tên button được click
   */
  onApproveJobRequirement(buttonName: string): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một bản ghi để duyệt!'
      );
      return;
    }

    // Lấy step và status từ button name
    const stepStatus = this.getStepAndStatusFromButton(buttonName);
    if (!stepStatus) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bước duyệt tương ứng với nút này!'
      );
      return;
    }

    const { step, status } = stepStatus;

    // Nếu là hủy duyệt (status = 2), cần nhập lý do
    if (status === 2) {
      this.showCancelReasonModal(selected, step);
    } else {
      // Duyệt (status = 1), gọi API trực tiếp
      this.processApprove(selected, step, status, '');
    }
  }

  /**
   * Hiển thị modal nhập lý do hủy
   */
  private showCancelReasonModal(selected: any[], step: number): void {
    const modalRef = this.modalService.open(CancelApproveReasonFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result
      .then((reasonCancel: string) => {
        if (reasonCancel && reasonCancel.trim()) {
          this.processApprove(selected, step, 2, reasonCancel.trim());
        }
      })
      .catch(() => {
        // User cancelled, do nothing
      });
  }

  /**
   * Xử lý duyệt/hủy duyệt
   */
  private processApprove(selected: any[], step: number, status: number, reasonCancel: string): void {
    // Tạo danh sách approve request
    const approveList = selected.map((row: any) => ({
      JobRequirementID: row.ID || 0,
      Step: step,
      Status: status,
      ReasonCancel: reasonCancel || ''
    })).filter((item: any) => item.JobRequirementID > 0);

    if (approveList.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi cần duyệt!'
      );
      return;
    }

    // Gọi API approve
    this.JobRequirementService.approveJobRequirement(approveList).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const results = response.data || [];
          let successCount = 0;
          let failCount = 0;
          const errorMessages: string[] = [];

          results.forEach((result: any) => {
            if (result.Success) {
              successCount++;
            } else {
              failCount++;
              if (result.Message) {
                errorMessages.push(result.Message);
              }
            }
          });

          // Hiển thị thông báo kết quả
          if (successCount > 0 && failCount === 0) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `Duyệt thành công ${successCount} bản ghi!`
            );
            // Refresh lại table
            this.getJobrequirement();
            if (this.JobrequirementID) {
              this.getJobrequirementDetails(this.JobrequirementID);
            }
          } else if (successCount > 0 && failCount > 0) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Duyệt thành công ${successCount} bản ghi, thất bại ${failCount} bản ghi. ${errorMessages.join('; ')}`
            );
            // Refresh lại table
            this.getJobrequirement();
            if (this.JobrequirementID) {
              this.getJobrequirementDetails(this.JobrequirementID);
            }
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              errorMessages.length > 0 ? errorMessages.join('; ') : 'Duyệt thất bại!'
            );
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response?.message || 'Duyệt thất bại!'
          );
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Duyệt thất bại!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  /**
   * Xử lý yêu cầu/hủy yêu cầu BGD duyệt
   */
  onRequestBGDApprove(isRequest: boolean): void {
    const selected = this.JobrequirementTable?.getSelectedData() || [];

    if (selected.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một bản ghi!'
      );
      return;
    }

    // Chỉ xử lý bản ghi đầu tiên (theo luồng C#)
    const rowData = selected[0];
    const id = rowData?.ID || 0;

    if (id <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy ID của bản ghi!'
      );
      return;
    }

    const numberRequest = rowData?.NumberRequest || rowData?.Code || '';
    const isRequestText = isRequest ? 'yêu cầu' : 'huỷ yêu cầu';
    const confirmMessage = `Bạn có chắc muốn ${isRequestText} BGĐ duyệt yêu cầu công việc [${numberRequest}] không?`;

    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Tạo model để gửi API
        const model = {
          ID: id,
          IsRequestBGDApproved: isRequest,
          UpdatedBy: this.currentUser?.LoginName || this.currentUser?.Code || '',
          UpdatedDate: new Date().toISOString()
        };

        // Gọi API
        this.JobRequirementService.saveRequestBGDApprove(model).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã ${isRequestText} BGĐ duyệt thành công!`
              );
              // Refresh lại table
              this.getJobrequirement();
              // Refresh lại details nếu có JobRequirementID
              if (this.JobrequirementID) {
                this.getJobrequirementDetails(this.JobrequirementID);
              }
            } else {
              const errorMessage = response?.message || `Không thể ${isRequestText} BGĐ duyệt!`;
              this.notification.error(
                NOTIFICATION_TITLE.error,
                errorMessage
              );
            }
          },
          error: (error: any) => {
            const errorMessage = error?.error?.message || error?.error?.Message || error?.message || `Lỗi khi ${isRequestText} BGĐ duyệt!`;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              errorMessage
            );
          }
        });
      }
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  searchData() {

    this.getJobrequirement();
  }

  onKeywordChange(value: string) {

    this.searchParams.Request = value;
  }

  private draw_JobrequirementTable(): void {
    if (this.JobrequirementTable) {
      this.JobrequirementTable.setData(this.JobrequirementData || []);
    } else {
      // Tạo context menu
      const contextMenuItems: any[] = [
        {
          label: 'Ghi chú',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            // Select row trước khi mở modal
            row.select();
            this.onOpenNoteModal();
          }
        },
        {
          label: 'Xem yêu cầu báo giá',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            // Select row trước khi mở
            row.select();
            this.onViewPriceQuote();
          }
        }
      ];

      this.JobrequirementTable = new Tabulator(this.tableRef1.nativeElement, {
        data: this.JobrequirementData || [],
        ...DEFAULT_TABLE_CONFIG,
        selectableRows: true,
        paginationMode: 'local',
        height: '100%',
        rowContextMenu: contextMenuItems,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'RowIndex',
          },
          {
            title: 'Yêu cầu BGĐ duyệt',
            field: 'IsRequestBGDApproved',
            width: 80,
            hozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<div style="text-align: center;"><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
            },
            frozen: true,
          },
          {
            title: 'Yêu cầu mua',
            field: 'IsRequestBuy',
            headerHozAlign: 'center',
            hozAlign: 'center',
            width: 80,
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<div style="text-align: center;"><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
            },
            frozen: true,
          },
          {
            title: 'Yêu cầu báo giá',
            field: 'IsRequestPriceQuote',
            headerHozAlign: 'center',
            hozAlign: 'center',
            width: 80,
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<div style="text-align: center;"><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
            },
            frozen: true,
          },
          {
            title: 'Trạng thái',
            field: 'StatusText',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã yêu cầu',
            field: 'NumberRequest',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày yêu cầu',
            field: 'DateRequest',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Tên nhân viên',
            field: 'EmployeeName',
            headerHozAlign: 'center',
          },
          {
            title: 'Bộ phận yêu cầu',
            field: 'EmployeeDepartment',
            headerHozAlign: 'center',
          },
          {
            title: 'TBP duyệt',
            field: 'FullNameApprovedTBP',
            headerHozAlign: 'center',
          },
          {
            title: 'Bộ phận được yêu cầu',
            field: 'RequiredDepartment',
            headerHozAlign: 'center',
          },
          {
            title: 'Bộ phận phối hợp',
            field: 'CoordinationDepartment',
            headerHozAlign: 'center',
          },
          {
            title: 'Trạng thái duyệt',
            field: 'IsApprovedText',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          },
        ],
      });
      this.JobrequirementTable.on(
        'rowClick',
        (e: UIEvent, row: RowComponent) => {
          const rowData = row.getData();
          const mouseEvent = e as MouseEvent;
          const jobRequirementID = rowData['ID'];
          this.getJobrequirementDetails(jobRequirementID);

          // Kiểm tra trạng thái duyệt HCNS khi click row
          if (jobRequirementID) {
            this.getHCNSData(jobRequirementID);
          }
        }
      );

      // Double click để mở modal sửa
      this.JobrequirementTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        const jobRequirementID = rowData['ID'] || 0;

        if (jobRequirementID > 0) {
          // Select row trước
          row.select();
          // Mở modal sửa
          this.onAddJobRequirement(true);
        }
      });

      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.JobrequirementTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.JobrequirementID = this.data[0].ID;

        // Kiểm tra trạng thái duyệt HCNS khi chọn row
        if (this.JobrequirementID) {
          this.getHCNSData(this.JobrequirementID);
        }
      });
      this.JobrequirementTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.JobrequirementTable!.getSelectedRows();
        this.JobrequirementID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data
        }
      });

      // Set font-size 12px cho bảng và 10px cho badge
      setTimeout(() => {
        const tableElement = this.tableRef1.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
          const allElements = tableElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              if (el.classList && el.classList.contains('badge')) {
                el.style.fontSize = '10px';
                el.style.padding = '2px 6px';
              } else {
                el.style.fontSize = '12px';
              }
            }
          });
        }
      }, 200);
    }
  }

  private draw_JobrequirementDetailTable(): void {
    if (this.JobrequirementDetailTable) {
      this.JobrequirementDetailTable.setData(
        this.JobrequirementDetailData || []
      );
    } else {
      this.JobrequirementDetailTable = new Tabulator(
        this.tableRef2.nativeElement,
        {
          data: this.JobrequirementDetailData || [],
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          layout: 'fitDataStretch',
          height: '100%',
          rowHeader: false,
          paginationMode: 'local',
          columns: [
            {
              title: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'Đề mục',
              field: 'Category',
              headerHozAlign: 'center',
            },
            {
              title: 'Diễn giản',
              field: 'Description',
              headerHozAlign: 'center',
            },
            {
              title: 'Mục tiêu cần đạt',
              field: 'Target',
              headerHozAlign: 'center',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
            },
          ],
        }
      );

      // Set font-size 12px cho bảng
      setTimeout(() => {
        const tableElement = this.tableRef2.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
          const allElements = tableElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.fontSize = '12px';
            }
          });
        }
      }, 200);
    }
  }

  private draw_JobrequirementFileTable(): void {
    if (this.JobrequirementFileTable) {
      this.JobrequirementFileTable.setData(this.JobrequirementFileData || []);
    } else {
      // Tạo context menu cho bảng file
      const fileContextMenuItems: any[] = [
        {
          label: 'Xem file',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.viewFile(rowData);
          }
        },
        {
          label: 'Tải file',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.downloadFile(rowData);
          }
        }
      ];

      this.JobrequirementFileTable = new Tabulator(
        this.tableRef3.nativeElement,
        {
          data: this.JobrequirementFileData || [],
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          height: '100%',
          layout: 'fitDataStretch',
          paginationMode: 'local',
          rowContextMenu: fileContextMenuItems,
          columns: [

            {
              title: 'File đính kèm',
              field: 'FileName',
              headerHozAlign: 'center',
            },
          ],
        }
      );

      // Set font-size 12px cho bảng
      setTimeout(() => {
        const tableElement = this.tableRef3.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
          const allElements = tableElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.fontSize = '12px';
            }
          });
        }
      }, 200);
    }
  }

  private draw_JobrequirementApprovedTable(): void {
    if (this.JobrequirementApprovedTable) {
      this.JobrequirementApprovedTable.setData(
        this.JobrequirementApprovedData || []
      );
    } else {
      this.JobrequirementApprovedTable = new Tabulator(
        this.tableRef4.nativeElement,
        {
          data: this.JobrequirementApprovedData || [],
          ...DEFAULT_TABLE_CONFIG,
          selectableRows: 1,
          height: '100%',
          layout: 'fitDataStretch',
          paginationMode: 'local',
          rowHeader: false,
          rowFormatter: (row: RowComponent) => {
            const data = row.getData();
            const isApproved = data['IsApproved'];

            // Bôi màu dựa trên trạng thái duyệt
            if (isApproved === 1 || isApproved === '1') {
              // Đã duyệt - màu xanh lá
              row.getElement().style.backgroundColor = '#009900';
            } else if (isApproved === 2 || isApproved === '2') {
              // Đã hủy - màu đỏ
              row.getElement().style.backgroundColor = '#CC3300';
            }
            // Chưa duyệt (0 hoặc null) - không bôi màu
          },
          columns: [

            {
              title: 'Bước',
              field: 'Step',
              hozAlign: 'center',
              headerHozAlign: 'center',
            },
            {
              title: 'Tên bước',
              field: 'StepName',
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày duyệt',
              field: 'DateApproved',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value
                  ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm')
                  : '';
              },
            },
            {
              title: 'Trạng thái',
              field: 'IsApprovedText',
              headerHozAlign: 'center',
            },
            {
              title: 'Người thức hiện',
              field: 'EmployeeName',
              headerHozAlign: 'center',
            },
            {
              title: 'Người duyệt',
              field: 'EmployeeActualName',
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do hủy duyệt',
              field: 'ReasonCancel',
              headerHozAlign: 'center',
            },
          ],
        }
      );

      // Set font-size 12px cho bảng
      setTimeout(() => {
        const tableElement = this.tableRef4.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
          const allElements = tableElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.fontSize = '12px';
            }
          });
        }
      }, 200);
    }
  }
}
