import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
// Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// XLSX for Excel export
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

// Services and Components
import { HrhiringRequestService } from './hrhiring-request-service/hrhiring-request.service';
import { HrhiringRequestDetailComponent } from './hrhiring-request-detail/hrhiring-request-detail.component';
import { PdfGeneratorService } from './hrhiring-request-service/pdf-generator.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DisablePermissionDirective } from '../../../directives/disable-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-hrhiring-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzModalModule,
    NzTagModule,
    NzDropDownModule,
    HasPermissionDirective,
    DisablePermissionDirective, // Thêm directive mới
    NzTabsModule,

  ],
  templateUrl: './hrhiring-request.component.html',
  styleUrls: ['./hrhiring-request.component.css'],
})
export class HrhiringRequestComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('tb_HRHIRING', { static: false }) tb_HRHIRINGRef!: ElementRef;
  @ViewChild('tb_approvals', { static: false }) tbApprovalsRef!: ElementRef;
  private tbApprovals!: Tabulator;

  private normBool(v: any) {
    return v === true || v === 1 || v === '1' || v === 'true';
  }
  fmtDate(v: any) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d as any) ? '' : d.toLocaleDateString('vi-VN');
  }
  private statusText(a: any) {
    return this.normBool(a.IsApprove)
      ? 'Đã duyệt'
      : a.DateApprove
      ? 'Đã hủy'
      : 'Chờ duyệt';
  }
  private statusBadge(a: any) {
    const t = this.statusText(a);
    const c =
      t === 'Đã duyệt' ? '#16a34a' : t === 'Đã hủy' ? '#dc2626' : '#d97706';
    return `<span class="badge" style="background:${c};color:#fff">${t}</span>`;
  }

  tb_HRHIRING!: Tabulator;
  selectedHRHIRING: any = null;
  isLoadTable: boolean = false;
  isTableReady: boolean = false;

  sizeSearch: string = '0';
  selectedDepartmentFilter: number | null = null;
  // SỬA: Thay selectedStatusFilter thành selectedChucVuFilter
  selectedChucVuFilter: number | null = null;
  searchValue: string = '';
  dateStart: Date = DateTime.local().startOf('month').toJSDate();
  dateEnd: Date = DateTime.local().endOf('month').toJSDate();

  departmentList: any[] = [];
  chucVuList: any[] = []; // SỬA: Thêm danh sách chức vụ

  // Add properties for approval status
  approvalStatus: any = null;
  currentStep: number = 0;
  canApproveHCNS: boolean = false;
  canApproveTBP: boolean = false;
  canApproveBGD: boolean = false;
  canCancelHCNS: boolean = false;
  canCancelTBP: boolean = false;
  canCancelBGD: boolean = false;

  // Master-Detail properties
  showDetail: boolean = false;

  constructor(
    private notification: NzNotificationService,
    private service: HrhiringRequestService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService,
    private pdfGeneratorService: PdfGeneratorService // SỬA: Thêm PDF service
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadChucVuHD(); // SỬA: Thêm load chức vụ
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_HRHIRINGRef) {
        this.drawTable(this.tb_HRHIRINGRef.nativeElement);
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_HRHIRING) {
      this.tb_HRHIRING.destroy();
    }
    this.tbApprovals?.destroy();
  }

  loadHrHiringRequestData(): void {
    if (!this.tb_HRHIRING) return;

    this.isLoadTable = true;
    const params = this.getAjaxParams();

    this.service
      .getHrHiringRequestData(
        params.departmentID,
        params.findText,
        params.dateStart,
        params.dateEnd,
        params.id,
        params.chucVuHDID
      )
      .subscribe({
        next: (rows) => {
          const dataArray = Array.isArray(rows) ? rows : [];

          if (dataArray.length === 0) {
            this.tb_HRHIRING.clearData();
            this.isLoadTable = false;
            return;
          }

          // SỬA: Không thêm STT nữa vì đã có trong data từ API
          this.tb_HRHIRING.replaceData(dataArray);

          setTimeout(() => {
            this.tb_HRHIRING.redraw(true);
          }, 200);

          this.isLoadTable = false;
        },
        error: (error) => {
          this.isLoadTable = false;
          this.notification.error(
            'Lỗi',
            'Không thể tải dữ liệu từ server: ' +
              (error.message || 'Unknown error')
          );
        },
      });
  }

  private toISODate(d: Date | null | undefined): string {
    if (!d) return '';
    return DateTime.fromJSDate(d).toISODate()!;
  }

  private loadDepartments(): void {
    this.service.getDepartments().subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.departmentList = response.data || [];
        } else if (Array.isArray(response)) {
          this.departmentList = response;
        } else {
          this.departmentList = [];
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách phòng ban');
      },
    });
  }

  // SỬA: Thêm method load chức vụ
  private loadChucVuHD(): void {
    this.service.getChucVuHD().subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.chucVuList = response.data || [];
        } else if (Array.isArray(response)) {
          this.chucVuList = response;
        } else {
          this.chucVuList = [];
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách chức vụ');
      },
    });
  }

  private getAjaxParams(): any {
    return {
      departmentID: this.selectedDepartmentFilter || 0,
      findText: this.searchValue?.trim() || '',
      dateStart: this.toISODate(this.dateStart),
      dateEnd: this.toISODate(this.dateEnd),
      id: 0,
      chucVuHDID: this.selectedChucVuFilter || 0, // SỬA: Sử dụng selectedChucVuFilter
    };
  }

  private drawTable(container: HTMLElement): void {
    this.tb_HRHIRING = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      //   height: '100vh',
      //   layout: 'fitColumns',
      rowContextMenu: this.getContextMenu(),
      //   langs: {
      //     vi: {
      //       pagination: { first: '<<', last: '>>', prev: '<', next: '>' },
      //     },
      //   },
      //   locale: 'vi',
      //   selectableRows: 1,
      //   selectableRowsRangeMode: 'click',
      groupBy: ['DepartmentName'],
      groupByStartOpen: true,
      groupHeader: (value: any) => `Phòng ban: ${value}`,
      columns: this.getTableColumns(),
    } as any);

    this.setupTableEvents();
  }

  private getContextMenu(): any[] {
    return [
      {
        label: '<i class="fa fa-edit"></i> Sửa',
        action: (e: any, row: any) => {
          this.edit();
        },
      },
      {
        label: '<i class="fa fa-file-pdf"></i> Xem phiếu PDF', // SỬA: Đổi tên
        action: (e: any, row: any) => {
          this.selectedHRHIRING = row.getData();
          this.viewForm();
        },
      },
      {
        label: '<i class="fa fa-trash"></i> Xóa',
        action: (e: any, row: any) => {
          this.deleteReq();
        },
      },
      {
        separator: true,
      },
    ];
  }

  private getTableColumns(): any[] {
    return [
      // {
      //   title: 'Chọn',
      //   titleFormatter: () => `<input type="checkbox" />`,
      //   field: 'Selected',
      //   formatter: (cell: any) => {
      //     const checked = cell.getValue() ? 'checked' : '';
      //     return `<input type='checkbox' ${checked} />`;
      //   },
      //   headerClick: (e: any, column: any) => {
      //     const isChecked = (e.target as HTMLInputElement).checked;
      //     column
      //       .getTable()
      //       .getRows()
      //       .forEach((row: any) => {
      //         row.update({ Selected: isChecked });
      //       });
      //   },
      //   cellClick: (e: any, cell: any) => {
      //     const newValue = !cell.getValue();
      //     cell.setValue(newValue);
      //   },
      //   hozAlign: 'center',
      //   headerHozAlign: 'center',
      //   headerSort: false,
      //   width: 50,
      //   frozen: true,
      // },
      {
        title: 'STT',
        field: 'STT',
        width: 70,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Vị trí tuyển dụng',
        field: 'EmployeeChucVuHDName',
        width: 180,
        headerHozAlign: 'center',
        hozAlign: 'left',
      },
      {
        title: 'SL tuyển',
        field: 'QuantityHiring',
        width: 90,
        headerHozAlign: 'center',
        hozAlign: 'center',
      },
      {
        title: 'Độ tuổi yêu cầu',
        field: 'AgeMin',
        width: 130,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: (cell: any) => this.formatAgeRange(cell.getRow().getData()),
      },
      {
        title: 'Giới tính',
        field: 'Gender',
        width: 90,
        formatter: 'textarea',
      },
      {
        title: 'Trình độ học vấn',
        field: 'EducationLevel',
        width: 200,
        formatter: 'textarea',
      },
      {
        title: 'Lương cơ bản',
        field: 'SalaryMin',
        width: 160,
        formatter: (cell: any) =>
          this.formatSalaryRange(cell.getRow().getData()),
      },
      {
        title: 'Địa điểm làm việc',
        field: 'WorkAddress',
        width: 200,
        formatter: 'textarea',
      },
      {
        title: 'Kinh nghiệm làm việc',
        field: 'Experience',
        width: 200,
        formatter: 'textarea',
      },
      {
        title: 'YC chuyên môn',
        field: 'ProfessionalRequirement',
        width: 500,
        formatter: 'textarea',
      },
      {
        title: 'Mô tả công việc',
        field: 'JobDescription',
        width: 200,
        formatter: 'textarea',
      },
      {
        title: 'Ghi chú',
        field: 'Note',
        width: 200,
        formatter: 'textarea',
      },
      {
        title: 'Tình trạng',
        field: 'ApprovalStatus',
        width: 200,
        formatter: 'textarea',
      },
    ];
  }

  edit(): void {
    // SỬA: Lấy selected row từ table
    const selectedRows = this.tb_HRHIRING?.getSelectedData?.() || [];
    const selectedRow =
      selectedRows.length > 0 ? selectedRows[0] : this.selectedHRHIRING;

    if (!selectedRow) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để sửa!');
      return;
    }

    // SỬA: Sử dụng endpoint getdata thay vì get-hrhiring-request-detail
    this.loadDetailForEdit(selectedRow.ID);
  }

  private loadDetailForEdit(id: number): void {
    console.log(`Loading detail for edit with ID: ${id}`);

    // SỬA: Sử dụng getHiringRequestDetail thay vì getList
    this.service.getHiringRequestDetail(id).subscribe({
      next: (response: any) => {
        console.log('Edit response:', response);

        if (response?.status === 1 && response.data) {
          this.openEditModal(response.data);
        } else {
          this.notification.error(
            'Lỗi',
            'Không thể tải chi tiết yêu cầu tuyển dụng!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Không thể tải dữ liệu: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  private openEditModal(detailData: any): void {
    const modalRef = this.ngbModal.open(HrhiringRequestDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.data = detailData;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result
      .then((result) => {
        if (result?.action === 'save') {
          this.loadHrHiringRequestData();
          this.notification.success(
            'Thông báo',
            'Sửa yêu cầu tuyển dụng thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );
        }
      })
      .catch(() => {});
  }

  add(): void {
    const modalRef = this.ngbModal.open(HrhiringRequestDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result
      .then((result) => {
        if (result?.action === 'save') {
          this.loadHrHiringRequestData();
          this.notification.success(
            'Thông báo',
            'Thêm yêu cầu tuyển dụng thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );
        }
      })
      .catch(() => {});
  }

  deleteReq(): void {
    // SỬA: Lấy selected row từ table thay vì selectedHRHIRING
    const selectedRows = this.tb_HRHIRING?.getSelectedData?.() || [];
    const selectedRow =
      selectedRows.length > 0 ? selectedRows[0] : this.selectedHRHIRING;

    if (!selectedRow) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dòng để xóa!');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa yêu cầu <strong>"${
        selectedRow?.EmployeeChucVuHDName || 'N/A'
      }"</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDelete(selectedRow),
    });
  }

  private confirmDelete(selectedRow: any): void {
    if (!selectedRow) return;

    // SỬA: Gọi API deleteHiringRequest từ service
    this.service.deleteHiringRequest(selectedRow.ID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.notification.success('Thông báo', 'Xóa yêu cầu thành công!');
          this.selectedHRHIRING = null;
          this.loadHrHiringRequestData();
        } else {
          this.notification.error(
            'Thông báo',
            response?.message || 'Xóa không thành công!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Không thể xóa: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  viewForm(): void {
    // Lấy selected row từ table
    const selectedRows = this.tb_HRHIRING?.getSelectedData?.() || [];
    const selectedRow =
      selectedRows.length > 0 ? selectedRows[0] : this.selectedHRHIRING;

    if (!selectedRow) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để xem phiếu!'
      );
      return;
    }

    this.notification.info('Thông báo', 'Đang tạo file PDF...');

    // Load chi tiết trước khi tạo PDF
    this.service.getHiringRequestDetail(selectedRow.ID).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          console.log('Data for PDF generation:', response.data);

          // SỬA: Gọi PDF generator thay vì modal
          this.pdfGeneratorService
            .generateHiringRequestPDF(response.data)
            .then(() => {
              this.notification.success('Thông báo', 'Tạo PDF thành công!');
            })
            .catch((error) => {
              this.notification.error(
                'Lỗi',
                'Không thể tạo PDF: ' + error.message
              );
            });
        } else {
          this.notification.error(
            'Lỗi',
            'Không thể tải chi tiết yêu cầu tuyển dụng!'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Lỗi',
          'Không thể tải dữ liệu: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  onDateStartChange(): void {
    this.loadHrHiringRequestData();
  }

  onDateEndChange(): void {
    this.loadHrHiringRequestData();
  }

  onDepartmentFilterChange(): void {
    this.loadHrHiringRequestData();
  }

  // SỬA: Thay onStatusFilterChange thành onChucVuFilterChange
  onChucVuFilterChange(): void {
    this.loadHrHiringRequestData();
  }

  onSearch(): void {
    if (this.tb_HRHIRING && this.isTableReady) {
      this.loadHrHiringRequestData();
    }
  }

  resetSearch(): void {
    this.selectedDepartmentFilter = null;
    this.selectedChucVuFilter = null; // SỬA: Reset chức vụ thay vì status
    this.searchValue = '';
    this.dateStart = DateTime.local().startOf('month').toJSDate();
    this.dateEnd = DateTime.local().endOf('month').toJSDate();
    this.loadHrHiringRequestData();
  }

  approvedTBP(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    // if (!this.canApproveTBP) {
    //   this.notification.warning(
    //     'Thông báo',
    //     'Không thể duyệt TBP cho yêu cầu này! Vui lòng kiểm tra HCNS đã duyệt chưa.'
    //   );
    //   return;
    // }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn duyệt TBP cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(),
    });
  }

  private confirmApproveTBP(): void {
    this.service
      .approveTBP(this.selectedHRHIRING.ID, 'TBP đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success('Thông báo', 'TBP duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'TBP duyệt không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  approvedHCNS(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    if (!this.canApproveHCNS) {
      this.notification.warning(
        'Thông báo',
        'Không thể duyệt HCNS cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt HCNS',
      nzContent: `Bạn có chắc chắn muốn duyệt HCNS cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHCNS(),
    });
  }

  private confirmApproveHCNS(): void {
    this.service
      .approveHCNS(this.selectedHRHIRING.ID, 'HCNS đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success('Thông báo', 'HCNS duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'HCNS duyệt không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  approvedBGD(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    if (!this.canApproveBGD) {
      this.notification.warning(
        'Thông báo',
        'Không thể duyệt BGĐ cho yêu cầu này! Vui lòng kiểm tra TBP đã duyệt chưa.'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt BGĐ',
      nzContent: `Bạn có chắc chắn muốn duyệt BGĐ cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveBGD(),
    });
  }

  private confirmApproveBGD(): void {
    this.service
      .approveBGD(this.selectedHRHIRING.ID, 'BGĐ đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success('Thông báo', 'BGĐ duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'BGĐ duyệt không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  cancelApprovedHCNS(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelHCNS) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt HCNS cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt HCNS',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt HCNS cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveHCNS(),
    });
  }

  private confirmCancelApproveHCNS(): void {
    this.service
      .cancelApproveHCNS(this.selectedHRHIRING.ID, 'Hủy duyệt HCNS')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(
              'Thông báo',
              'Hủy duyệt HCNS thành công!'
            );
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt HCNS không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể hủy duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  // SỬA: Cập nhật approvedHR và cancelApprovedHR thành TBP functions
  cancelApprovedTBP(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelTBP) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt TBP cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt TBP cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveTBP(),
    });
  }

  private confirmCancelApproveTBP(): void {
    this.service
      .cancelApproveTBP(this.selectedHRHIRING.ID, 'Hủy duyệt TBP')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success('Thông báo', 'Hủy duyệt TBP thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt TBP không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể hủy duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  cancelApprovedBGD(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelBGD) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt BGĐ cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt BGĐ',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt BGĐ cho yêu cầu "${this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveBGD(),
    });
  }

  private confirmCancelApproveBGD(): void {
    this.service
      .cancelApproveBGD(this.selectedHRHIRING.ID, 'Hủy duyệt BGĐ')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success('Thông báo', 'Hủy duyệt BGĐ thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt BGĐ không thành công!'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Không thể hủy duyệt: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  private formatAgeRange(row: any): string {
    const min = row?.AgeMin;
    const max = row?.AgeMax;
    if (min && max) return `${min}-${max}`;
    if (min && !max) return `${min}+`;
    if (!min && max) return `<=${max}`;
    return '';
  }

  private formatSalaryRange(row: any): string {
    const min = row?.SalaryMin;
    const max = row?.SalaryMax;
    const fmt = (v: any) =>
      v === null || v === undefined
        ? ''
        : Number(v).toLocaleString('vi-VN', { minimumFractionDigits: 0 });
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min && !max) return `${fmt(min)}+`;
    if (!min && max) return `<=${fmt(max)}`;
    return '';
  }

  // Thêm các methods public để sử dụng trong template
  public formatAgeRangeDetail(data: any): string {
    const min = data?.AgeMin;
    const max = data?.AgeMax;
    if (min && max) return `${min}-${max} tuổi`;
    if (min && !max) return `${min}+ tuổi`;
    if (!min && max) return `Dưới ${max} tuổi`;
    return 'Không yêu cầu';
  }

  public formatSalaryRangeDetail(data: any): string {
    const min = data?.SalaryMin;
    const max = data?.SalaryMax;
    const fmt = (v: any) => (v ? Number(v).toLocaleString('vi-VN') : '0');
    if (min && max) return `${fmt(min)} - ${fmt(max)} VNĐ`;
    if (min && !max) return `Từ ${fmt(min)} VNĐ`;
    if (!min && max) return `Đến ${fmt(max)} VNĐ`;
    return 'Thỏa thuận';
  }

  public getApprovalStatusText(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string {
    if (!this.approvalStatus?.approvals) return 'Chờ duyệt';

    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus.approvals.find(
      (x: any) => x.Step === stepMap[type]
    );
    if (!a) return 'Chờ duyệt';
    if (a.DateApprove && a.IsApprove) return 'Đã duyệt';
    if (a.DateApprove && !a.IsApprove) return 'Đã hủy';
    return 'Chờ duyệt';
  }

  public getApprovalStatusColor(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string {
    const status = this.getApprovalStatusText(type);
    if (status === 'Đã duyệt') return 'green';
    if (status === 'Đã hủy') return 'red';
    return 'orange'; // Chờ duyệt
  }

  // 3) Tổng quan: suy từ từng step thay vì selectedHRHIRING
  public getOverallApprovalStatus(): string {
    if (!this.approvalStatus?.approvals) return 'Chưa bắt đầu';

    const s = this.approvalStatus.approvals as Array<any>;
    const byStep = (n: number) => s.find((x) => x.Step === n);

    const tbp = byStep(1); // TBP
    const hr = byStep(2); // HCNS
    const bgd = byStep(3); // BGĐ

    // Nếu có bất kỳ step bị hủy
    if (
      (tbp?.DateApprove && tbp.IsApprove === false) ||
      (hr?.DateApprove && hr.IsApprove === false) ||
      (bgd?.DateApprove && bgd.IsApprove === false)
    ) {
      return 'Bị từ chối';
    }

    if (bgd?.DateApprove && bgd.IsApprove) return 'Hoàn tất';
    if (hr?.DateApprove && hr.IsApprove) return 'Chờ BGĐ duyệt';
    if (tbp?.DateApprove && tbp.IsApprove) return 'Chờ HR duyệt';
    return 'Chờ TBP duyệt';
  }
  public getApproverName(type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'): string {
    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus?.approvals?.find(
      (x: any) => x.Step === stepMap[type]
    );
    return a?.ApproverFullName || '';
  }
  public getApprovalDate(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string | null {
    if (!this.approvalStatus?.approvals) return null;

    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus.approvals.find(
      (x: any) => x.Step === stepMap[type]
    );
    return a?.DateApprove || null;
  }
  public getOverallApprovalStatusColor(): string {
    const status = this.getOverallApprovalStatus();
    if (status === 'Hoàn tất') return 'green';
    if (status.includes('Chờ')) return 'orange';
    return 'default';
  }

  private setupTableEvents(): void {
    this.tb_HRHIRING.on('dataLoading', () => {
      this.isLoadTable = true;
      this.tb_HRHIRING.deselectRow();
    });

    this.tb_HRHIRING.on('dataLoaded', () => {
      this.isLoadTable = false;
    });

    this.tb_HRHIRING.on('dataLoadError', () => {
      this.isLoadTable = false;
    });

    this.tb_HRHIRING.on('rowClick', (e: any, row: any) => {
      this.selectedHRHIRING = row.getData();
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
      // Load additional detail data if needed
      this.loadDetailData(this.selectedHRHIRING.ID);
    });
    this.tb_HRHIRING.on('rowClick', (_e: any, row: any) => {
      this.selectedHRHIRING = row.getData();
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
      this.loadDetailData(this.selectedHRHIRING.ID);
      this.showDetail = true; //
    });
    this.tb_HRHIRING.on('rowSelectionChanged', (data: any) => {
      this.selectedHRHIRING = data.length ? data[0] : null;
      if (this.selectedHRHIRING) {
        this.loadApprovalStatus(this.selectedHRHIRING.ID);
        this.loadDetailData(this.selectedHRHIRING.ID);
      } else {
        this.resetApprovalStatus();
      }
    });

    this.tb_HRHIRING.on('tableBuilt', () => {
      this.isTableReady = true;
      setTimeout(() => {
        this.loadHrHiringRequestData();
      }, 200);
    });

    this.tb_HRHIRING.on('rowDblClick', (e: any, row: any) => {
      this.selectedHRHIRING = row.getData();
      this.edit();
    });

    this.tb_HRHIRING.on('renderStarted', () => {
      setTimeout(() => {
        if (this.isLoadTable) {
          this.isLoadTable = false;
        }
      }, 10000);
    });
  }

  private loadDetailData(id: number): void {
    // Load additional detail data if not already in selected row
    this.service.getHiringRequestDetail(id).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          // Merge detail data with selected record
          this.selectedHRHIRING = {
            ...this.selectedHRHIRING,
            ...response.data,
          };
        }
      },
      error: (error) => {
        console.error('Error loading detail data:', error);
      },
    });
  }

  // Load approval status
  private loadApprovalStatus(hiringRequestId: number): void {
    this.service.getApprovalStatus(hiringRequestId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.approvalStatus = response.data;
          this.currentStep = response.data.currentStep || 0;
          this.canApproveHCNS = response.data.canApproveHCNS || false;
          this.canApproveTBP = response.data.canApproveTBP || false;
          this.canApproveBGD = response.data.canApproveBGD || false;
          this.canCancelHCNS = response.data.canCancelHCNS || false;
          this.canCancelTBP = response.data.canCancelTBP || false;
          this.canCancelBGD = response.data.canCancelBGD || false;
          this.renderApprovals();
          console.log('Approval status loaded:', this.approvalStatus);
        }
      },
      error: (error) => {
        console.error('Error loading approval status:', error);
        this.resetApprovalStatus();
      },
    });
  }

  private resetApprovalStatus(): void {
    this.approvalStatus = null;
    this.currentStep = 0;
    this.canApproveHCNS = false;
    this.canApproveTBP = false;
    this.canApproveBGD = false;
    this.canCancelHCNS = false;
    this.canCancelTBP = false;
    this.canCancelBGD = false;
  }

  // Formatting methods for detail panel
  public formatDate(date: any): string {
    if (!date) return 'Chưa có';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  public formatOtherLanguage(data: any): string {
    if (data?.OtherLanguage && data?.OtherLanguageLevel) {
      return `${data.OtherLanguage} (${data.OtherLanguageLevel})`;
    }
    return data?.OtherLanguage || 'Không có';
  }

  public formatComputerSkills(data: any): string {
    const skills = [];
    if (data?.SkillWord) skills.push('Word');
    if (data?.SkillExcel) skills.push('Excel');
    if (data?.SkillPowerpoint) skills.push('PowerPoint');
    if (data?.SkillOutlook) skills.push('Outlook');
    if (data?.SkillInternet) skills.push('Internet');
    if (data?.SkillOther) skills.push(`Khác: ${data.SkillOther}`);

    return skills.length ? skills.join(', ') : 'Không có yêu cầu đặc biệt';
  }

  public formatHealthRequirements(data: any): string {
    const requirements = [];
    if (data?.NeedPhysical) {
      requirements.push(
        `Thể hình đặc biệt${data.PhysicalNote ? ` (${data.PhysicalNote})` : ''}`
      );
    }
    if (data?.NeedSpecialStrength) {
      requirements.push(
        `Sức lực đặc biệt${data.StrengthNote ? ` (${data.StrengthNote})` : ''}`
      );
    }
    if (data?.EnsureHealth) {
      requirements.push(
        `Sức khỏe đảm bảo${data.HealthNote ? ` (${data.HealthNote})` : ''}`
      );
    }

    return requirements.length
      ? requirements.join('; ')
      : 'Sức khỏe bình thường';
  }

  public formatCommunicationRequirements(data: any): string {
    const requirements = [];
    if (data?.CommNoneExternal)
      requirements.push('Không cần giao tiếp bên ngoài');
    if (data?.CommInternal) requirements.push('Giao tiếp nội bộ');
    if (data?.CommDomesticCustomer) requirements.push('Khách hàng trong nước');
    if (data?.CommForeignCustomer) {
      const country = data?.CommForeignCountry
        ? ` (${data.CommForeignCountry})`
        : '';
      requirements.push(`Khách hàng nước ngoài${country}`);
    }
    if (data?.CommMedia) requirements.push('Báo đài, truyền thông');
    if (data?.CommAuthorities) requirements.push('Cơ quan chính quyền');

    return requirements.length
      ? requirements.join('; ')
      : 'Không có yêu cầu đặc biệt';
  }

  // Master-Detail methods
  toggleDetailPanel(): void {
    this.showDetail = !this.showDetail;
    if (this.showDetail && this.selectedHRHIRING) {
      this.loadDetailData(this.selectedHRHIRING.ID);
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
    }
  }

  closeDetailPanel(): void {
    this.showDetail = false;
  }

  // Format methods cho các selections từ form
  public formatGenderSelections(data: any): string {
    if (!data?.GenderSelections || !Array.isArray(data.GenderSelections))
      return 'Không yêu cầu';

    const genderMap: Record<number, string> = {
      1: 'Nam',
      2: 'Nữ',
      3: 'Không yêu cầu',
    };

    return data.GenderSelections.map(
      (id: number) => genderMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatAppearanceSelections(data: any): string {
    if (
      !data?.AppearanceSelections ||
      !Array.isArray(data.AppearanceSelections)
    )
      return 'Không yêu cầu';

    const appearanceMap: Record<number, string> = {
      1: 'Không yêu cầu',
      2: 'Tương đối',
      3: 'Quan trọng',
    };

    return data.AppearanceSelections.map(
      (id: number) => appearanceMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatEducationSelections(data: any): string {
    if (!data?.EducationSelections || !Array.isArray(data.EducationSelections))
      return 'Chưa có';

    const educationMap: Record<number, string> = {
      1: 'Trung học cơ sở',
      2: 'Trung học phổ thông',
      3: 'Trung cấp',
      4: 'Cao đẳng',
      5: 'Đại học',
      6: 'Trên đại học',
    };

    return data.EducationSelections.map(
      (id: number) => educationMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatExperienceSelections(data: any): string {
    if (
      !data?.ExperienceSelections ||
      !Array.isArray(data.ExperienceSelections)
    )
      return 'Chưa có';

    const experienceMap: Record<number, string> = {
      1: 'Không yêu cầu',
      2: 'Dưới 1 năm',
      3: '1-2 năm',
      4: '2-3 năm',
      5: '3-5 năm',
      6: 'Trên 5 năm',
    };

    return data.ExperienceSelections.map(
      (id: number) => experienceMap[id] || 'Không xác định'
    ).join(', ');
  }

  // ... rest of existing methods remain unchanged ...
  //#region DUYỆT YÊU CẦU
  async approvedTBPNew(isApprove: number, step: number) {
    var dataSelected = this.tb_HRHIRING.getSelectedData().map((row) => row.ID);
    // console.log('dataSelected:', dataSelected);

    if (isApprove == 1) {
      Swal.fire({
        title: 'Xác nhận duyệt?',
        text: `Bạn có chắc muốn duyệt ${dataSelected.length} đã chọn không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745 ',
        cancelButtonColor: '#dc3545 ',
        confirmButtonText: 'Duyệt',
        cancelButtonText: 'Hủy',
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.handleApproved(dataSelected, step, isApprove, '');
        }
      });
    } else {
      const { value: reasonUnApprove }: { value?: string } = await Swal.fire({
        input: 'textarea',
        inputLabel: 'Lý do hủy',
        inputPlaceholder: 'Nhập lý do hủy duyệt...',
        inputAttributes: {
          'aria-label': 'Vui lòng nhập Lý do hủy',
        },
        showCancelButton: true,
        confirmButtonColor: '#28a745 ',
        cancelButtonColor: '#dc3545 ',
        confirmButtonText: 'Hủy duyệt',
        cancelButtonText: 'Hủy',
      });
      if (reasonUnApprove) {
        this.handleApproved(dataSelected, step, isApprove, reasonUnApprove);
      }
    }
  }

  handleApproved(
    dataSelected: any,
    step: number,
    isApprove: number,
    reasonUnApprove: string
  ) {
    let approveds = [];
    for (let i = 0; i < dataSelected.length; i++) {
      let approved = {
        HRHiringRequestID: dataSelected[i],
        Step: step,
        IsApprove: isApprove,
        ReasonUnApprove: reasonUnApprove,
        Note: '',
      };

      approveds.push(approved);
    }
    if (step == 1) {
      this.service.approvedTBP(approveds).subscribe({
        next: (response: any) => {
          console.log(response);
          this.notification.success('Thành công', response.message);
        },
        error: (err) => {
          console.log(err);
          this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        },
      });
    } else if (step == 2) {
      this.service.approvedHR(approveds).subscribe({
        next: (response: any) => {
          console.log(response);
          this.notification.success('Thành công', response.message);
        },
        error: (err) => {
          console.log(err);
          console.log('err.status:', err.status),
            this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        },
      });
    } else {
      this.service.approvedBGD(approveds).subscribe({
        next: (response: any) => {
          console.log(response);
          this.notification.success('Thành công', response.message);
        },
        error: (err) => {
          console.log(err);
          this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        },
      });
    }
  }

  private buildApprovalsTable(): void {
    if (!this.tbApprovalsRef || this.tbApprovals) return;
    this.tbApprovals = new Tabulator(this.tbApprovalsRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      rowHeader: false,
      selectable: false,
      index: 'Step',
      columns: [
        { title: 'Bước', field: 'Step', width: 80, hozAlign: 'center' },
        { title: 'Tên bước', field: 'StepName', width: 180 },
        {
          title: 'Trạng thái',
          field: '_Status',
          width: 120,
          formatter: (c: any) => this.statusBadge(c.getRow().getData()),
          hozAlign: 'center',
        },
        {
          title: 'Ngày duyệt',
          field: 'DateApprove',
          width: 160,
          formatter: (c: any) => this.fmtDate(c.getValue()),
          hozAlign: 'center',
        },
        { title: 'Người duyệt', field: 'ApproverFullName', width: 180 },

        {
          title: 'Lý do hủy',
          field: 'ReasonUnApprove',
          formatter: 'textarea',
          width: 220,
        },
        { title: 'Ghi chú', field: 'Note', formatter: 'textarea', width: 200 },
      ],
    } as any);
  }

  private renderApprovals(): void {
    if (!this.approvalStatus?.approvals) return;
    this.buildApprovalsTable();
    const rows = this.approvalStatus.approvals.map((a: any) => ({
      ...a,
      _Status: this.statusText(a),
    }));
    this.tbApprovals.replaceData(rows);
    setTimeout(() => this.tbApprovals.redraw(true), 30);
  }
  onTabChange(i: number) {
    if (i === 1) {
      // tab “Thông tin duyệt”
      setTimeout(() => this.renderApprovals(), 0);
    }
  }
  //#endregion
}
