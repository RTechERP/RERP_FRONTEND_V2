import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnDef } from '../../../../../shared/custom-table/column-def.model';
import { CustomTable } from '../../../../../shared/custom-table';
import { CommercialPriceRequestImportExcelComponent } from './commercial-price-request-import-excel/commercial-price-request-import-excel.component';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { CommercialPriceRequestServiceService } from './commercial-price-request-service/commercial-price-request-service.service';
import { NzDatePickerComponent } from "ng-zorro-antd/date-picker";
import { NzColDirective } from "ng-zorro-antd/grid";
import { ɵNzTransitionPatchDirective } from "ng-zorro-antd/core/transition-patch";
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormItemComponent } from "ng-zorro-antd/form";
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
@Component({
  standalone: true,
  selector: 'app-commercial-price-request',
  templateUrl: './commercial-price-request.component.html',
  styleUrl: './commercial-price-request.component.css',
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    SharedModule,
    CustomTable,
    SelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    NzDatePickerComponent,
    NzColDirective,
    ɵNzTransitionPatchDirective,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzFormItemComponent,
    NzInputNumberModule,
    NzSelectModule
  ],
})
export class CommercialPriceRequestComponent implements OnInit {

  menuBars: MenuItem[] = [];
  columns: ColumnDef[] = [];
  headerGroups: any[][] = [];
  dataset: any[] = [];
  selectedRequests: any[] = [];
  isLoading = false;

  totalRecords = 0;

  private _today = new Date();
  private _firstDayPrevMonth = new Date(this._today.getFullYear(), this._today.getMonth() - 1, 1);
  private _lastDayCurrMonth = new Date(this._today.getFullYear(), this._today.getMonth() + 1, 0);
  private _fmt = (d: Date) => d.toISOString().slice(0, 10);

  filter = {
    Keyword: '',
    YearNo: new Date().getFullYear() as number | null,
    DateFrom: this._fmt(this._firstDayPrevMonth) as string | null,
    DateTo: this._fmt(this._lastDayCurrMonth) as string | null,
    EmployeeID: null as number | null,
    PageNumber: 1,
    PageSize: 99999999
  };

  @Input() dateStart: string | null = null;
  @Input() dateEnd: string | null = null;
  @Input() employeeId: number | null = null;

  employees: any[] = [];

  isTBP: boolean = false;

  constructor(
    private ngbModal: NgbModal,
    private commercialPriceRequestService: CommercialPriceRequestServiceService,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isTBP = this.permissionService.hasPermission('N33,N1');
    if (!this.isTBP) {
      this.filter.EmployeeID = Number(this.appUserService.employeeID);
      //this.departmentId = this.appUserService.departmentID;
    }
    // Override filter nếu có param truyền vào từ ngoài
    if (this.dateStart) this.filter.DateFrom = this.dateStart;
    if (this.dateEnd) this.filter.DateTo = this.dateEnd;
    if (this.employeeId) this.filter.EmployeeID = this.employeeId;

    this.getEmployees();
    this.initMenuBar();
    this.initColumns();
    this.getData();
  }

  getEmployees(): void {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  initMenuBar(): void {
    this.menuBars = [
      // {
      //   label: 'Reload',
      //   icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
      //   command: () => this.getData(),
      // },
      {
        label: 'Nhập Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onImportExcel(),
        visible: this.permissionService.hasPermission('N35,N1')
      },
    ];
  }

  onImportExcel(): void {
    const ref = this.ngbModal.open(CommercialPriceRequestImportExcelComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    ref.componentInstance.rfqNo = '';
    ref.result.then(
      (result: any) => {
        if (result?.success) {
          this.getData();
        }
      },
      () => { }
    );
  }

  getData(): void {
    this.isLoading = true;

    const toLocalISO = (dateStr: string | null, endOfDay = false): string | null => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const pad = (n: number) => String(n).padStart(2, '0');
      const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const time = endOfDay ? '23:59:59' : '00:00:00';
      return `${date}T${time}`;
    };

    const payload = {
      ...this.filter,
      isoDateStart: toLocalISO(this.filter.DateFrom, false),
      isoDateEnd: toLocalISO(this.filter.DateTo, true),
      employeeId: this.filter.EmployeeID ?? null,
    };

    this.commercialPriceRequestService.getCommercialPriceRequests(payload).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];

        // Frontend sẽ tự phân trang
        this.dataset = list.map((item: any, index: number) => ({ ...item, stt: index + 1 }));

        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.dataset = [];
        this.totalRecords = 0;
      }
    });
  }

  onSearch(): void {
    this.filter.PageNumber = 1;
    this.getData();
  }

  onLazyLoad(event: any): void {
    this.filter.PageNumber = Math.floor(event.first / event.rows) + 1;
    this.filter.PageSize = event.rows;

    // Lấy ký tự tìm kiếm từ các ô filter trên từng cột gom chung vào Keyword
    // (Vì Backend chỉ hỗ trợ 1 tham số @Keyword chung cho các cột)
    let columnKeyword = '';
    if (event.filters) {
      for (const field in event.filters) {
        if (event.filters[field] && event.filters[field].length > 0) {
          const val = event.filters[field][0].value;
          if (val) {
            columnKeyword = val; // Lấy bất kỳ ký tự nào được gõ vào
            break;
          }
        }
      }
    }

    // Nếu có gõ vào ô tìm kiếm của cột thì ưu tiên lấy, nếu ko lấy Keyword từ ô tìm kiếm góc phải
    if (columnKeyword) {
      this.filter.Keyword = columnKeyword;
    }
    // Nếu event.globalFilter có dữ liệu (khi bật showGlobalFilter="true" trong custom-table)
    if (event.globalFilter) {
      this.filter.Keyword = event.globalFilter;
    }

    this.getData();
  }

  formatDateTime(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  getRowClass = (rowData: any) => {
    // Theo yêu cầu: IsSaleQuoted = 1 -> màu xanh, = 0 -> màu vàng
    const val = rowData?.IsSaleQuoted;
    if (val === 1 || val === true || String(val).toLowerCase() === 'true') {
      return 'row-sale-quoted-done';
    }
    if (val === 0 || val === false || String(val).toLowerCase() === 'false') {
      return 'row-sale-quoted-pending';
    }
    return '';
  }

  formatDate(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  initColumns(): void {
    this.columns = [
      // ── Cột không nhóm (đầu) ─────────────────────────────────────────
      { field: 'stt', header: 'STT', width: '60px' }, //thêm tự đánh số
      {
        field: 'SalesPushedAt', header: 'Ngày sales đẩy rq', width: '170px', sortable: true, filterMode: 'datetime', cssClass: 'text-center',
        format: (v: any) => this.formatDateTime(v)
      }, //ép kiểu về năm tháng ngày giờ
      { field: 'RfqNo', header: 'Số Request', width: '160px', sortable: true }, //done
      { field: 'PicPurName', header: 'PIC (pur)', width: '150px', sortable: true, textWrap: true, filterMode: 'multiselect' }, //done
      {
        field: 'AdminSentAt', header: 'Ngày request', width: '170px', sortable: true, filterMode: 'datetime', cssClass: 'text-center',
        format: (v: any) => this.formatDateTime(v)
      }, // hỏi lại là trường gì? ép kiểu về năm tháng ngày giờ
      {
        field: 'QuoteDeadline', header: 'Hạn báo giá', width: '170px', sortable: true, filterMode: 'datetime', cssClass: 'text-center',
        format: (v: any) => this.formatDate(v)
      }, // ep kiểu về năm tháng ngày

      // ── Nhóm: Thông tin request (7 cột) ──────────────────────────────
      { field: 'ProductCode', header: 'ID', width: '160px', sortable: true, filterType: 'numeric', cssClass: 'text-center' }, //done
      { field: 'ProductName', header: 'Tên hàng', width: '240px', sortable: true, textWrap: true }, //done
      { field: 'Specification', header: 'Spec', width: '240px', sortable: true, textWrap: true }, //thêm trường Specification vào database và backend, sau đó hiển thị ở đây
      { field: 'Supplier', header: 'Maker', width: '130px', sortable: true, textWrap: true, filterMode: 'multiselect' }, //done
      { field: 'Unit', header: 'ĐVT', width: '80px', sortable: true, cssClass: 'text-center', filterMode: 'multiselect' }, //done
      {
        field: 'Qty', header: 'Số lượng', width: '120px', sortable: true, filterType: 'numeric', cssClass: 'text-right',  // done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 3 }) : ''
      },
      { field: 'RequestNote', header: 'Note', width: '200px' },  //done hoặc hỏi lại xem nó là thằng note nào
      // ── Nhóm: Thông tin giá nhập (7 cột) ─────────────────────────────
      {
        field: 'UnitPrice', header: 'Đơn giá', width: '130px', sortable: true, filterType: 'numeric', cssClass: 'text-right',
        format: (v: any) => {
          if (v == null || v === '') return '';
          const num = Number(v);
          // Nếu convert được sang số hợp lệ → format số
          if (!isNaN(num)) {
            return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
          }
          // Nếu là text (ví dụ: "Liên hệ", "N/A", ...) → trả về nguyên văn
          return String(v);
        }
      },
      {
        field: 'totalPrice', header: 'Tổng giá', width: '130px', cssClass: 'text-right', // done
        format: (_v: any, row: any) => {
          const u = parseFloat(row?.['UnitPrice']);
          const q = parseFloat(row?.['Qty']);
          if (isNaN(u) || isNaN(q)) return '';
          return (u * q).toLocaleString('en-US', { maximumFractionDigits: 2 });
        }
      },
      {
        field: 'Vat', header: 'VAT', width: '100px', sortable: true, filterType: 'numeric', cssClass: 'text-right', // done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''
      },
      {
        field: 'ShippingCost', header: 'Phí vch', width: '130px', sortable: true, filterType: 'numeric', cssClass: 'text-right', //done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''
      },
      {
        field: 'OtherCost', header: 'Chi phí khác', width: '140px', sortable: true, filterType: 'numeric', cssClass: 'text-right',  //done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''
      },
      { field: 'Leadtime', header: 'Leadtime', width: '200px', sortable: true, filterType: 'numeric', cssClass: 'text-center', textWrap: true },  //done
      { field: 'ImportPriceNote', header: 'Note', width: '200px', textWrap: true },   //done hoặc hỏi lại xem nó là thằng note nào

      // ── Nhóm: Thông tin giá báo khách (8 cột) ────────────────────────
      {
        field: 'SaleDeadline', header: 'Thời hạn báo giá', width: '170px', sortable: true, filterMode: 'datetime', cssClass: 'text-center', textWrap: true,
        format: (v: any) => this.formatDateTime(v)
      },  //ép kiểu về năm tháng ngày giờ
      {
        field: 'SalesPushedAt', header: 'Ngày báo giá', width: '160px', sortable: true, filterMode: 'datetime', cssClass: 'text-center',
        format: (v: any) => this.formatDateTime(v)
      }, //check lại trường
      {
        field: 'SaleUnitPrice', header: 'Đơn giá báo', width: '130px', sortable: true, filterType: 'numeric', cssClass: 'text-right',  //done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 }) : ''
      },
      {
        field: 'SaleTotalPrice', header: 'Tổng giá báo', width: '140px', sortable: true, filterType: 'numeric', cssClass: 'text-right', // done
        format: (v: any) => v != null ? Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 }) : ''
      },
      { field: 'SaleLeadtime', header: 'Leadtime', width: '200px', sortable: true, filterType: 'numeric', cssClass: 'text-center', textWrap: true }, // thêm trường vào database
      {
        field: 'SaleQuoteDate', header: 'Ngày báo giá', width: '160px', sortable: true, filterMode: 'datetime', cssClass: 'text-center',
        format: (v: any) => this.formatDate(v)
      }, // ép kiểu về ngày tháng năm giờ
      {
        field: 'QuoteRound', header: 'Số lần báo giá', width: '130px', sortable: true, filterType: 'numeric', cssClass: 'text-center', filterMode: 'multiselect',
        format: (v: any) => v != null ? Number(v).toString() : ''
      },  //convert kiểu dữ liệu
      { field: 'SaleNote', header: 'Note', width: '200px', textWrap: true }, //done

      // ── Cột không nhóm (cuối) ─────────────────────────────────────────
      {
        field: 'IsPO', header: 'Trúng PO (x)', width: '130px', sortable: true, filterType: 'numeric', cssClass: 'text-center', filterMode: 'multiselect', // convert tick hoặc dấu x
        format: (v: any) => (v === true || v === 1 || String(v).toLowerCase() === 'true') ? '✓' : ''
      },
    ];

    // ── headerGroups ─────────────────────────────────────────────────────
    // 6 cột đầu (STT + 5 cột thông tin chung) không thuộc nhóm nào → rowspan=2
    // 3 nhóm chính → rowspan=1, dòng 2 render tên cột thực
    // 1 cột cuối → rowspan=2
    this.headerGroups = [
      [
        {
          header: '', colspan: 1, rowspan: 1,
          cssClass: 'group-header-request'
        },
        { header: '', colspan: 1, rowspan: 1, cssClass: 'group-header-request' },
        { header: 'Thông tin request', colspan: 11, rowspan: 1, cssClass: 'group-header-request' },
        { header: 'Thông tin giá nhập', colspan: 9, rowspan: 1, cssClass: 'group-header-import' },
        { header: 'Thông tin giá báo khách', colspan: 6, rowspan: 1, cssClass: 'group-header-sale' },
        {
          header: '', colspan: 1, rowspan: 1,
          cssClass: 'group-header-request'
        },
      ],
    ];
  }
}
