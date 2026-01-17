import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabSetComponent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { PONCCService } from '../poncc/poncc.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { SupplierSaleService } from '../supplier-sale/supplier-sale.service';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { PonccDetailComponent } from '../poncc/poncc-detail/poncc-detail.component';
import { PonccSummaryComponent } from '../poncc/poncc-summary/poncc-summary.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { BillImportDetailComponent } from '../../old/Sale/BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import ExcelJS from 'exceljs';
import { BillImportTechnicalComponent } from '../../old/bill-import-technical/bill-import-technical.component';
import { BillImportTechnicalFormComponent } from '../../old/bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../shared/pdf/vfs_fonts_custom.js';
import { DateTime } from 'luxon';
import { environment } from '../../../../environments/environment';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { SafeUrlPipe } from '../../../../safeUrl.pipe';
import { PaymentOrderDetailComponent } from '../../general-category/payment-order/payment-order-detail/payment-order-detail.component';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

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
  selector: 'app-poncc-new',
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
    NzSplitterModule,
    NzTabSetComponent,
    NzTabComponent,
    NzSpinComponent,
    NzModalModule,
    HasPermissionDirective,
    NzDropDownModule,
    NzSwitchModule,
    SafeUrlPipe,
    AngularSlickgridModule,
    MenubarModule,
  ],
  templateUrl: './poncc-new.component.html',
  styleUrls: ['./poncc-new.component.css'],
})
export class PonccNewComponent implements OnInit, AfterViewInit {
  activeTabIndex: number = 0;
  lastMasterId: number | null = null;
  isTabReady: boolean = false; // Flag để track khi tab đã render
  showSearchBar: boolean = true;
  shouldShowSearchBar: boolean = true;
  // Filters
  dateStart: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  dateEnd: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );
  supplierId: number = 0;
  employeeId: number = 0;
  status: number = -1;
  keyword: string = '';
  pageNumber = 1;
  pageSize = 10000000;
  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  suppliers: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;
  listAllID: string[] = [];
  checkList: boolean[] = [];
  listDetail: any[] = [];
  poCode: string = '';
  showPreview = false;
  isShowSign = true;
  isShowSeal = true;
  isMerge = false;
  language: string = 'vi';
  dataPrint: any;
  tabs: PoTab[] = [];

  // PrimeNG MenuBar
  menuItems: MenuItem[] = [];

  // AngularSlickGrid instances
  angularGridPoThuongMai!: AngularGridInstance;
  angularGridPoMuon!: AngularGridInstance;
  angularGridDetail!: AngularGridInstance;

  // Maps for filtering
  datasetsAllMapMaster: Map<string, any[]> = new Map(); // key: 'master-0' or 'master-1'
  datasetsAllMapDetail: any[] = []; // Original detail data

  // Column definitions
  columnDefinitionsMaster: Column[] = [];
  columnDefinitionsDetail: Column[] = [];

  // Grid options
  gridOptionsMaster: GridOption = {};
  gridOptionsDetail: GridOption = {};

  // Datasets
  datasetPoThuongMai: any[] = [];
  datasetPoMuon: any[] = [];
  datasetDetail: any[] = [];

  // Lưu trạng thái bảng để khôi phục sau khi reload
  private savedScrollPosition: number = 0;
  private savedSelectedRowIds: number[] = [];
  private savedTabIndex: number = -1;

  // Map to store details for each master PONCC ID
  private masterDetailsMap: Map<number, any[]> = new Map();

  constructor(
    private srv: PONCCService,
    private modal: NzModalService,
    private notify: NzNotificationService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private supplierSaleService: SupplierSaleService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.initGridColumns();
    this.initGridOptions();
    this.initMenuItems();
  }

  ngAfterViewInit(): void {
    // Đợi tab render xong rồi mới load data
    setTimeout(() => {
      this.isTabReady = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }, 200);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
    this.shouldShowSearchBar = this.showSearchBar;
  }

  private initGridColumns(): void {
    // Master columns - Note: filter icons will be updated when grid is ready
    this.columnDefinitionsMaster = [
      {
        id: 'IsApproved',
        name: 'Duyệt',
        field: 'IsApproved',
        width: 70,
        sortable: false,
        filterable: false,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.StatusText}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'RequestDate',
        name: 'Ngày PO',
        field: 'RequestDate',
        width: 100,
        sortable: false,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'DeliveryDate',
        name: 'Ngày giao hàng',
        field: 'DeliveryDate',
        width: 100,
        sortable: false,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'POCode',
        name: 'Số PO',
        field: 'POCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.BillCode}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'BillCode',
        name: 'Số đơn hàng',
        field: 'BillCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.TotalMoneyPO}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'TotalMoneyPO',
        name: 'Tổng tiền',
        field: 'TotalMoneyPO',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'CurrencyText',
        name: 'Loại tiền',
        field: 'CurrencyText',
        width: 80,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.CurrencyText}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // {
      //     id: 'CurrencyRate',
      //     name: 'Tỷ giá',
      //     field: 'CurrencyRate',
      //     width: 100,
      //     sortable: false,
      //     filterable: true,
      //     formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value),
      //     filter: { model: Filters['compoundInputNumber'] },
      // },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp',
        field: 'NameNCC',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.CurrencyRate}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FullName',
        name: 'Nhân viên mua',
        field: 'FullName',
        width: 150,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.FullName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'DeptSupplier',
        name: 'Công nợ',
        field: 'DeptSupplier',
        width: 120,
        sortable: false,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'BankCharge',
        name: 'Bank charge',
        field: 'BankCharge',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'RulePayName',
        name: 'Điều khoản TT',
        field: 'RulePayName',
        width: 150,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.RulePayName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'CompanyText',
        name: 'Công ty',
        field: 'CompanyText',
        width: 150,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.FedexAccount}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'FedexAccount',
        name: 'Fedex account',
        field: 'FedexAccount',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'RuleIncoterm',
        name: 'Điều khoản Incoterm',
        field: 'RuleIncoterm',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.RuleIncoterm}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'SupplierVoucher',
        name: 'Chứng từ NCC',
        field: 'SupplierVoucher',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.SupplierVoucher}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'OriginItem',
        name: 'Xuất xứ',
        field: 'OriginItem',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.OriginItem}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'Note',
        name: 'Diễn giải',
        field: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.Note}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'POTypeText',
        name: 'Loại PO',
        field: 'POTypeText',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.POTypeText}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
    ];

    // Detail columns
    this.columnDefinitionsDetail = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 50,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProductName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProductName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProductNewCode}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductGroupName',
        name: 'Tên nhóm',
        field: 'ProductGroupName',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProductGroupName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProductCodeOfSupplier',
        name: 'Mã SP NCC',
        field: 'ProductCodeOfSupplier',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProductCodeOfSupplier}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ParentProductCode',
        name: 'Mã cha',
        field: 'ParentProductCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ParentProductCode}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProjectCode}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.ProjectName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'UnitName',
        name: 'ĐVT',
        field: 'UnitName',
        width: 80,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.UnitName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      {
        id: 'QtyRequest',
        name: 'SL yêu cầu',
        field: 'QtyRequest',
        width: 100,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'QuantityRequested',
        name: 'SL đã yêu cầu',
        field: 'QuantityRequested',
        width: 100,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'QuantityReturn',
        name: 'SL đã về',
        field: 'QuantityReturn',
        width: 100,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'QuantityRemain',
        name: 'SL còn lại',
        field: 'QuantityRemain',
        width: 100,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá',
        field: 'UnitPrice',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'ThanhTien',
        name: 'Thành tiền',
        field: 'ThanhTien',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'VAT',
        name: 'VAT (%)',
        field: 'VAT',
        width: 80,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'VATMoney',
        name: 'Tổng tiền VAT',
        field: 'VATMoney',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'IsBill',
        name: 'Hóa đơn',
        field: 'IsBill',
        width: 80,
        sortable: false,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'DiscountPercent',
        name: 'Chiết khấu (%)',
        field: 'DiscountPercent',
        width: 100,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'Discount',
        name: 'Tiền chiết khấu',
        field: 'Discount',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'FeeShip',
        name: 'Phí vận chuyển',
        field: 'FeeShip',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TotalPrice',
        name: 'Tổng tiền',
        field: 'TotalPrice',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'DeadlineDelivery',
        name: 'Deadline giao hàng',
        field: 'DeadlineDelivery',
        width: 100,
        sortable: false,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'ExpectedDate',
        name: 'Ngày dự kiến',
        field: 'ExpectedDate',
        width: 100,
        sortable: false,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'ActualDate',
        name: 'Ngày thực tế',
        field: 'ActualDate',
        width: 100,
        sortable: false,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'PriceSale',
        name: 'Giá bán',
        field: 'PriceSale',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'PriceHistory',
        name: 'Giá lịch sử',
        field: 'PriceHistory',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'BiddingPrice',
        name: 'Giá thầu',
        field: 'BiddingPrice',
        width: 120,
        sortable: false,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'Note',
        name: 'Diễn giải',
        field: 'Note',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
        },

        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
              <span
                title="${dataContext.Note}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
    ];
  }

  private initGridOptions(): void {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-master',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableSorting: true,
      frozenColumn: 5,
      enableHeaderMenu: true,
      enableExcelExport: true,
      // Footer row configuration
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      excelExportOptions: {
        filename: 'poncc',
        sanitizeDataExport: true,
        sheetName: 'PO NCC',
        columnHeaderStyle: {
          font: { color: 'FFFFFFFF' },
          fill: { type: 'pattern', fgColor: 'FF4a6c91' },
        },
        customExcelHeader: (workbook: any, sheet: any) => {
          const excelFormat = workbook.getStyleSheet().createFormat({
            font: {
              size: 18,
              fontName: 'Calibri',
              bold: true,
              color: 'FFFFFFFF',
            },
            alignment: { wrapText: true, horizontal: 'center' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: 'FF203764' },
          });
          sheet.setRowInstructions(0, { height: 40 });
          const customTitle = `Danh sách PO NCC ${
            this.activeTabIndex === 0 ? 'Thương mại' : 'Mượn'
          }`;
          const lastCellMerge = 'H1'; // Có thể tính động dựa trên số cột
          sheet.mergeCells('A1', lastCellMerge);
          sheet.data.push([
            { value: customTitle, metadata: { style: excelFormat.id } },
          ]);
        },
      },
    };

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 3,
      enableHeaderMenu: false,
      // Footer row configuration
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };

  }

  loadLookups() {
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => {
        this.suppliers = res.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + (error.message || error)
        );
      },
    });

    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + (error.message || error)
        );
      },
    });
  }

  onSearch(): void {
    this.isLoading = true;
    const filter = {
      DateStart: new Date(this.dateStart.setHours(0, 0, 0, 0)).toISOString(),
      DateEnd: new Date(this.dateEnd.setHours(23, 59, 59, 999)).toISOString(),
      Status: this.status,
      SupplierID: this.supplierId || 0,
      EmployeeID: this.employeeId || 0,
      Keyword: this.keyword?.trim() || '',
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      POType: this.activeTabIndex, // 0: PO thương mại, 1: PO mượn
    };

    // Lưu lại lastMasterId trước khi load lại data
    const previousSelectedMasterId = this.lastMasterId;

    this.srv.getAll(filter).subscribe({
      next: (rows) => {
        const data = rows.data || [];

        // Map data với id unique cho SlickGrid
        const usedIds = new Set<string>();
        const timestamp = Date.now();

        const mappedData = data.map((item: any, index: number) => {
          let uniqueId: string;
          if (item.ID && Number(item.ID) > 0) {
            uniqueId = `tab_${this.activeTabIndex}_id_${item.ID}`;
          } else {
            uniqueId = `tab_${
              this.activeTabIndex
            }_idx_${index}_${timestamp}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }

          let finalId = uniqueId;
          let counter = 0;
          while (usedIds.has(finalId)) {
            counter++;
            finalId = `${uniqueId}_${counter}`;
          }
          usedIds.add(finalId);

          return {
            ...item,
            id: finalId,
          };
        });

        // Set data vào grid tương ứng
        if (this.activeTabIndex === 0) {
          this.datasetPoThuongMai = mappedData;
          // Sync to all data map for filters
          this.datasetsAllMapMaster.set('master-0', [...mappedData]);
        } else {
          this.datasetPoMuon = mappedData;
          // Sync to all data map for filters
          this.datasetsAllMapMaster.set('master-1', [...mappedData]);
        }

        this.isLoading = false;
        this.cdr.detectChanges();

        // Resize grid sau khi data được load
        setTimeout(() => {
          const currentGrid =
            this.activeTabIndex === 0
              ? this.angularGridPoThuongMai
              : this.angularGridPoMuon;
          if (currentGrid) {
            currentGrid.resizerService.resizeGrid();
          }
          // Apply distinct filters after data is loaded
          this.applyDistinctFilters();

          // Load lại detail nếu có master đang được chọn
          if (previousSelectedMasterId) {
            // Kiểm tra xem master đó còn tồn tại trong data mới không
            const stillExists = mappedData.some(
              (item: any) => item.ID === previousSelectedMasterId
            );
            if (stillExists) {
              // Load lại detail cho master đang chọn
              this.srv.getDetails(previousSelectedMasterId).subscribe({
                next: (res: any) => {
                  const details = res.data.data || [];
                  // Map details với id unique
                  const usedIds = new Set<string>();
                  const timestamp = Date.now();
                  const mappedDetails = details.map(
                    (item: any, index: number) => {
                      let uniqueId: string;
                      if (item.ID && Number(item.ID) > 0) {
                        uniqueId = `detail_id_${item.ID}`;
                      } else {
                        uniqueId = `detail_idx_${index}_${timestamp}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`;
                      }

                      let finalId = uniqueId;
                      let counter = 0;
                      while (usedIds.has(finalId)) {
                        counter++;
                        finalId = `${uniqueId}_${counter}`;
                      }
                      usedIds.add(finalId);

                      return {
                        ...item,
                        id: finalId,
                      };
                    }
                  );

                  // Cập nhật lại detail map và hiển thị
                  this.masterDetailsMap.set(
                    previousSelectedMasterId,
                    mappedDetails
                  );
                  this.displayDetailsForMaster(previousSelectedMasterId);
                },
                error: (error) => {
                  this.notify.error(
                    'Lỗi',
                  error.error?.message || error?.message
                  );
                },
              });
            } else {
              // Master không còn tồn tại, clear detail
              this.lastMasterId = null;
              this.datasetDetail = [];
              this.sizeTbDetail = '0';
              this.masterDetailsMap.clear();
              this.cdr.detectChanges();
            }
          }
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error('Lỗi', error.error?.message || error?.message);
      },
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    // Đợi tab render xong rồi mới search và resize grid
    setTimeout(() => {
      // Resize grid khi tab thay đổi
      const currentGrid =
        index === 0 ? this.angularGridPoThuongMai : this.angularGridPoMuon;
      if (currentGrid) {
        currentGrid.resizerService.resizeGrid();
      }
      this.onSearch();
      // Apply distinct filters when switching tabs (updateMasterFooterRow is called inside)
      setTimeout(() => {
        this.applyDistinctFilters();
      }, 100);
    }, 150);
  }



  /**
   * Handle master table selection changes
   * - Detail table: Shows only the latest selected master's details
   * - Map: Stores all details from all selected masters (for other operations)
   */
  private handleMasterSelectionChange(selectedMasters: any[]): void {
    const selectedIds = selectedMasters.map((m) => m.ID);
    // Nếu không còn master nào → clear hết
    if (selectedIds.length === 0) {
      this.masterDetailsMap.clear();
      this.lastMasterId = null;
      this.datasetDetail = [];
      this.sizeTbDetail = '0';
      this.cdr.detectChanges();
      return;
    }

    this.sizeTbDetail = '38%';

    const latestMaster = selectedMasters[selectedMasters.length - 1];
    if (latestMaster) {
      this.poCode = latestMaster.POCode;
    }

    const newMasterIds = selectedIds.filter(
      (id) => !this.masterDetailsMap.has(id)
    );
    const deselectedIds = Array.from(this.masterDetailsMap.keys()).filter(
      (id) => !selectedIds.includes(id)
    );
    deselectedIds.forEach((id) => this.masterDetailsMap.delete(id));

    if (newMasterIds.length > 0) {
      const latestMasterId = newMasterIds[newMasterIds.length - 1];

      if (this.lastMasterId && this.masterDetailsMap.has(this.lastMasterId)) {
        const currentSelectedDetails = this.getSelectedDetailRows();
        const selectedDetailIds = new Set(
          currentSelectedDetails.map((d: any) => d.ID)
        );

        const oldDetails = this.masterDetailsMap.get(this.lastMasterId) || [];
        const filtered = oldDetails.filter((d) => selectedDetailIds.has(d.ID));

        if (filtered.length > 0) {
          this.masterDetailsMap.set(this.lastMasterId, filtered);
        } else {
          this.masterDetailsMap.delete(this.lastMasterId);
        }
      }
      this.lastMasterId = latestMasterId;

      this.isLoading = true;
      let loadedCount = 0;

      // Load detail cho master mới
      newMasterIds.forEach((masterId) => {
        this.srv.getDetails(masterId).subscribe({
          next: (res: any) => {
            const details = res.data.data || [];
            // Map details với id unique
            const usedIds = new Set<string>();
            const timestamp = Date.now();
            const mappedDetails = details.map((item: any, index: number) => {
              let uniqueId: string;
              if (item.ID && Number(item.ID) > 0) {
                uniqueId = `detail_id_${item.ID}`;
              } else {
                uniqueId = `detail_idx_${index}_${timestamp}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;
              }

              let finalId = uniqueId;
              let counter = 0;
              while (usedIds.has(finalId)) {
                counter++;
                finalId = `${uniqueId}_${counter}`;
              }
              usedIds.add(finalId);

              return {
                ...item,
                id: finalId,
              };
            });

            this.masterDetailsMap.set(masterId, mappedDetails);
            loadedCount++;

            if (loadedCount === newMasterIds.length) {
              this.displayDetailsForMaster(latestMasterId);
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          },
          error: () => {
            loadedCount++;

            if (loadedCount === newMasterIds.length) {
              this.displayDetailsForMaster(latestMasterId);
              this.isLoading = false;
              this.cdr.detectChanges();
            }

            this.notify.error(
              'Lỗi',
              `Không tải được chi tiết cho PO ID: ${masterId}`
            );
          },
        });
      });
    } else {
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      this.lastMasterId = lastSelectedId;
      this.displayDetailsForMaster(lastSelectedId);
    }
  }

  private displayDetailsForMaster(masterId: number): void {
    const details = this.masterDetailsMap.get(masterId) || [];
    this.datasetDetail = details;
    // Sync to all data map for filters
    this.datasetsAllMapDetail = [...details];
    this.cdr.detectChanges();
    // Resize detail grid sau khi data được set
    if (this.angularGridDetail) {
      setTimeout(() => {
        this.angularGridDetail.resizerService.resizeGrid();
        // Apply distinct filters after detail data is loaded
        this.applyDistinctFilters();
        // Update footer row for detail grid
        this.updateDetailFooterRow();

        // Tự động select all các dòng detail
        if (details.length > 0) {
          const allRowIndexes = Array.from(
            { length: details.length },
            (_, i) => i
          );
          this.angularGridDetail.slickGrid.setSelectedRows(allRowIndexes);
        }
      }, 100);
    }
  }


  private getSelectedDetailRows(): any[] {
    if (!this.angularGridDetail) return [];
    const selectedIndexes = this.angularGridDetail.slickGrid.getSelectedRows();
    if (!selectedIndexes || selectedIndexes.length === 0) return [];
    return selectedIndexes
      .map((index: number) => this.angularGridDetail.dataView.getItem(index))
      .filter((item: any) => item);
  }

  private getSelectedMasterRows(): any[] {
    const currentGrid =
      this.activeTabIndex === 0
        ? this.angularGridPoThuongMai
        : this.angularGridPoMuon;
    if (!currentGrid) return [];
    const selectedIndexes = currentGrid.slickGrid.getSelectedRows();
    if (!selectedIndexes || selectedIndexes.length === 0) return [];
    return selectedIndexes
      .map((index: number) => currentGrid.dataView.getItem(index))
      .filter((item: any) => item);
  }

  handleSelectionChange(selectedRows: any[]) {
    const selectedIds = selectedRows.map((r) => r.ID);
    this.listDetail = selectedIds;
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    // Helper function to get unique values for a field
    const getUniqueValues = (
      data: any[],
      field: string
    ): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      data.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // List of all text fields that should have multipleSelect filter for Master grid
    const masterTextFields = [
      'StatusText',
      'POCode',
      'BillCode',
      'CurrencyText',
      'NameNCC',
      'FullName',
      'RulePayName',
      'CompanyText',
      'FedexAccount',
      'RuleIncoterm',
      'SupplierVoucher',
      'OriginItem',
      'POTypeText',
    ];

    // Update filters for PO Thương mại grid (tab 0)
    if (this.angularGridPoThuongMai && this.angularGridPoThuongMai.slickGrid) {
      const dataView = this.angularGridPoThuongMai.dataView;
      if (dataView) {
        // Lấy dữ liệu đã được filter từ view (không phải tất cả data gốc)
        const data: any[] = [];
        for (let i = 0; i < dataView.getLength(); i++) {
          const item = dataView.getItem(i);
          if (item) {
            data.push(item);
          }
        }

        if (data.length > 0) {
          const columns = this.angularGridPoThuongMai.slickGrid.getColumns();
          columns.forEach((column: any) => {
            if (
              column.filter &&
              column.filter.model === Filters['multipleSelect']
            ) {
              const field = column.field;
              if (field && masterTextFields.includes(field)) {
                const collection = getUniqueValues(data, field);
                if (column.filter) {
                  column.filter.collection = collection;
                }
              }
            }
          });

          // Force refresh columns
          const updatedColumns =
            this.angularGridPoThuongMai.slickGrid.getColumns();
          this.angularGridPoThuongMai.slickGrid.setColumns(updatedColumns);
          this.angularGridPoThuongMai.slickGrid.invalidate();
          this.angularGridPoThuongMai.slickGrid.render();
        }
      }
    }

    // Update filters for PO Mượn grid (tab 1)
    if (this.angularGridPoMuon && this.angularGridPoMuon.slickGrid) {
      const dataView = this.angularGridPoMuon.dataView;
      if (dataView) {
        // Lấy dữ liệu đã được filter từ view (không phải tất cả data gốc)
        const data: any[] = [];
        for (let i = 0; i < dataView.getLength(); i++) {
          const item = dataView.getItem(i);
          if (item) {
            data.push(item);
          }
        }

        if (data.length > 0) {
          const columns = this.angularGridPoMuon.slickGrid.getColumns();
          columns.forEach((column: any) => {
            if (
              column.filter &&
              column.filter.model === Filters['multipleSelect']
            ) {
              const field = column.field;
              if (field && masterTextFields.includes(field)) {
                const collection = getUniqueValues(data, field);
                if (column.filter) {
                  column.filter.collection = collection;
                }
              }
            }
          });

          // Force refresh columns
          const updatedColumns = this.angularGridPoMuon.slickGrid.getColumns();
          this.angularGridPoMuon.slickGrid.setColumns(updatedColumns);
          this.angularGridPoMuon.slickGrid.invalidate();
          this.angularGridPoMuon.slickGrid.render();
        }
      }
    }

    // List of all text fields that should have multipleSelect filter for Detail grid
    const detailTextFields = [
      'ProductCode',
      'ProductName',
      'ProductNewCode',
      'ProductGroupName',
      'ProductCodeOfSupplier',
      'ParentProductCode',
      'ProjectCode',
      'ProjectName',
      'UnitName',
      'Note',
    ];

    // Update filters for Detail grid
    if (this.angularGridDetail && this.angularGridDetail.slickGrid) {
      const dataView = this.angularGridDetail.dataView;
      if (dataView) {
        // Lấy dữ liệu đã được filter từ view (không phải tất cả data gốc)
        const data: any[] = [];
        for (let i = 0; i < dataView.getLength(); i++) {
          const item = dataView.getItem(i);
          if (item) {
            data.push(item);
          }
        }

        if (data.length > 0) {
          const columns = this.angularGridDetail.slickGrid.getColumns();
          columns.forEach((column: any) => {
            if (
              column.filter &&
              column.filter.model === Filters['multipleSelect']
            ) {
              const field = column.field;
              if (field && detailTextFields.includes(field)) {
                const collection = getUniqueValues(data, field);
                if (column.filter) {
                  column.filter.collection = collection;
                }
              }
            }
          });

          // Force refresh columns
          const updatedColumns = this.angularGridDetail.slickGrid.getColumns();
          this.angularGridDetail.slickGrid.setColumns(updatedColumns);
          this.angularGridDetail.slickGrid.invalidate();
          this.angularGridDetail.slickGrid.render();
        }
      }
    }

    // Update footer row sau khi grid đã được refresh
    setTimeout(() => {
      this.updateMasterFooterRow();
    }, 200);
  }



  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  private formatDateDDMMYYYY(val: any): string {
    if (!val) return '';
    const p2 = (n: number) => String(n).padStart(2, '0');
    const d = new Date(val);
    return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /**
   * Update footer row với count cho Số PO, Số đơn hàng và sum cho Tổng tiền
   */
  updateMasterFooterRow(): void {
    // Lấy grid hiện tại dựa trên tab đang active
    const currentGrid =
      this.activeTabIndex === 0
        ? this.angularGridPoThuongMai
        : this.angularGridPoMuon;

    if (currentGrid && currentGrid.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (currentGrid.dataView?.getFilteredItems?.() as any[]) ||
        (this.activeTabIndex === 0
          ? this.datasetPoThuongMai
          : this.datasetPoMuon);

      // Đếm số lượng POCode
      const poCodeCount = (items || []).filter((item) => item.POCode).length;

      // Đếm số lượng BillCode
      const billCodeCount = (items || []).filter(
        (item) => item.BillCode
      ).length;

      // Tính tổng cho cột TotalMoneyPO
      const totalMoneySum = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalMoneyPO) || 0),
        0
      );

      currentGrid.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = currentGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = currentGrid.slickGrid.getFooterRowColumn(col.id);
        if (!footerCell) return;

        // Đếm cho cột POCode (Số PO)
        if (col.id === 'POCode') {
          footerCell.innerHTML = `<b style="display:block;text-align:right;">${poCodeCount}</b>`;
        }
        // Đếm cho cột BillCode (Số đơn hàng)
        else if (col.id === 'BillCode') {
          footerCell.innerHTML = `<b style="display:block;text-align:right;">${billCodeCount}</b>`;
        }
        // Tổng tiền cho cột TotalMoneyPO
        else if (col.id === 'TotalMoneyPO') {
          const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalMoneySum);
          footerCell.innerHTML = `<b style="display:block;text-align:right;">${formattedValue}</b>`;
        } else {
          footerCell.innerHTML = '';
        }
      });
    }
  }

  /**
   * Update footer row cho bảng detail với sum cho các cột số
   */
  updateDetailFooterRow(): void {
    if (this.angularGridDetail && this.angularGridDetail.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGridDetail.dataView?.getFilteredItems?.() as any[]) ||
        this.datasetDetail;

      // Danh sách các cột cần tính sum
      const sumColumns = [
        'QtyRequest',         // SL yêu cầu
        'QuantityRequested',  // SL đã yêu cầu
        'QuantityReturn',     // SL đã về
        'QuantityRemain',     // SL còn lại
        'UnitPrice',          // Đơn giá
        'ThanhTien',          // Thành tiền
        'VAT',                // %VAT
        'VATMoney',           // Tổng tiền VAT
        'DiscountPercent',    // %Chiết khấu
        'Discount',           // Chiết khấu
        'FeeShip',            // Phí vận chuyển
        'TotalPrice',         // Tổng tiền
        'PriceSale',          // Giá bán
        'PriceHistory',       // Giá lịch sử
        'BiddingPrice',       // Giá chào thầu
      ];

      // Tính tổng cho từng cột
      const totals: { [key: string]: number } = {};
      sumColumns.forEach((field) => {
        totals[field] = (items || []).reduce(
          (sum, item) => sum + (Number(item[field]) || 0),
          0
        );
      });

      this.angularGridDetail.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = this.angularGridDetail.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGridDetail.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Nếu là cột cần sum
        if (sumColumns.includes(col.id)) {
          const value = totals[col.id];
          // Format số với 2 chữ số thập phân cho các cột tiền, 0 chữ số cho SL
          const isQuantityColumn = ['QtyRequest', 'QuantityRequested', 'QuantityReturn', 'QuantityRemain'].includes(col.id);
          const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: isQuantityColumn ? 0 : 2,
            maximumFractionDigits: isQuantityColumn ? 0 : 2,
          }).format(value);
          footerCell.innerHTML = `<b style="display:block;text-align:right;">${formattedValue}</b>`;
        } else {
          footerCell.innerHTML = '';
        }
      });
    }
  }

  resetSearch(): void {
    this.dateStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    this.dateEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );
    this.supplierId = 0;
    this.employeeId = 0;
    this.status = -1;
    this.keyword = '';
  }

  // Grid ready handlers
  angularGridPoThuongMaiReady(angularGrid: AngularGridInstance) {
    this.angularGridPoThuongMai = angularGrid;

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      // Apply distinct filters for this grid after it's ready (updateMasterFooterRow is called inside)
      this.applyDistinctFilters();
    }, 100);

    // Subscribe to dataView.onRowCountChanged để update filter collections khi data thay đổi (bao gồm filter)
    if (angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
      });
    }

    // Đăng ký sự kiện onRendered để đảm bảo footer luôn được render lại sau mỗi lần grid render
    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onRendered.subscribe(() => {
        setTimeout(() => {
          this.updateMasterFooterRow();
        }, 50);
      });
    }
  }


  angularGridPoMuonReady(angularGrid: AngularGridInstance) {
    this.angularGridPoMuon = angularGrid;

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      // Apply distinct filters for this grid after it's ready (updateMasterFooterRow is called inside)
      this.applyDistinctFilters();
    }, 100);

    // Subscribe to dataView.onRowCountChanged để update filter collections khi data thay đổi (bao gồm filter)
    if (angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        setTimeout(() => {
          this.applyDistinctFilters();
        }, 100);
      });
    }

    // Đăng ký sự kiện onRendered để đảm bảo footer luôn được render lại sau mỗi lần grid render
    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onRendered.subscribe(() => {
        setTimeout(() => {
          this.updateMasterFooterRow();
        }, 50);
      });
    }
  }


  angularGridDetailReady(angularGrid: AngularGridInstance) {
    this.angularGridDetail = angularGrid;

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      // Apply distinct filters for this grid after it's ready
      this.applyDistinctFilters();
      // Update footer row
      this.updateDetailFooterRow();
    }, 100);

    // Subscribe to dataView.onRowCountChanged để update filter collections khi data thay đổi (bao gồm filter)
    if (angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        setTimeout(() => {
          this.applyDistinctFilters();
          this.updateDetailFooterRow();
        }, 100);
      });
    }

    // Đăng ký sự kiện onRendered để đảm bảo footer luôn được render lại sau mỗi lần grid render
    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onRendered.subscribe(() => {
        setTimeout(() => {
          this.updateDetailFooterRow();
        }, 50);
      });
    }
  }


  // Handle row selection changes from master grids
  onMasterRowSelectionChanged(
    eventData: any,
    args: OnSelectedRowsChangedEventArgs
  ) {
    if (!args || !args.rows) return;

    const currentGrid =
      this.activeTabIndex === 0
        ? this.angularGridPoThuongMai
        : this.angularGridPoMuon;
    if (!currentGrid) return;

    const selectedRows = args.rows
      .map((rowIndex: number) => currentGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    this.handleMasterSelectionChange(selectedRows);
  }

  // Handle row selection changes from detail grid
  onDetailRowSelectionChanged(
    eventData: any,
    args: OnSelectedRowsChangedEventArgs
  ) {
    if (!args || !args.rows || !this.angularGridDetail) return;

    const selectedRows = args.rows
      .map((rowIndex: number) =>
        this.angularGridDetail.dataView.getItem(rowIndex)
      )
      .filter((item: any) => item);

    this.handleSelectionChange(selectedRows);
  }

  onAddPoncc() {
    const modalRef = this.modalService.open(PonccDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  onEditPoncc() {
    const selectedRows = this.getSelectedMasterRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một PO để sửa'
      );
      return;
    }

    const selectedPO = selectedRows[0];
    this.isLoading = true;

    this.srv.getDetails(selectedPO.ID).subscribe({
      next: (detailResponse: any) => {
        this.isLoading = false;

        const modalRef = this.modalService.open(PonccDetailComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          windowClass: 'full-screen-modal',
        });

        modalRef.componentInstance.poncc = selectedPO;
        modalRef.componentInstance.dtRef = detailResponse.data.dtRef || [];
        modalRef.componentInstance.ponccDetail = detailResponse.data.data || [];
        modalRef.componentInstance.isEditMode = true;

        modalRef.result.finally(() => {
          this.onSearch();
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', err.error?.message || err?.message);
      },
    });
  }

  onDeletePoncc() {
    const selectedRows = this.getSelectedMasterRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn PO muốn xóa!'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa danh sách PO đã chọn không?<br>
                  <strong>Lưu ý:</strong> Những PO đã được duyệt hoặc đã có phiếu nhập sẽ bỏ qua!`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const posToDelete: any[] = [];
        const skippedPOs: string[] = [];

        selectedRows.forEach((po: any) => {
          if (!po.ID || po.ID <= 0) {
            return;
          }

          if (
            po.IsApproved === true ||
            po.IsApproved === 1 ||
            po.IsApproved === '1'
          ) {
            skippedPOs.push(`${po.POCode} (đã duyệt)`);
            return;
          }

          if (po.TotalImport && po.TotalImport > 0) {
            skippedPOs.push(`${po.POCode} (đã có phiếu nhập)`);
            return;
          }
          const { id, ...rest } = po;
          posToDelete.push({
            ...rest,
            IsDeleted: true,
          });
        });

        if (posToDelete.length === 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có PO nào có thể xóa. Tất cả đều đã được duyệt hoặc đã có phiếu nhập!'
          );
          return;
        }

        this.isLoading = true;

        this.srv.updatePONCC(posToDelete).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            let message = `Đã xóa thành công ${posToDelete.length} PO`;
            if (skippedPOs.length > 0) {
              message +=
                `<br><br><strong>Bỏ qua ${skippedPOs.length} PO:</strong><br>` +
                skippedPOs.join('<br>');
            }
            this.notification.success(NOTIFICATION_TITLE.success, message);
            this.onSearch();
          },
          error: (err) => {
            this.isLoading = false;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Không thể xóa PO. Vui lòng thử lại!'
            );
          },
        });
      },
    });
  }

  onApprovePoncc(isApprove: boolean): void {
    const isApproveText = isApprove ? 'duyệt' : 'hủy duyệt';
    const selectedRows = this.getSelectedMasterRows();

    if (!selectedRows || selectedRows.length <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn PO muốn ${isApproveText}!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Xác nhận ${isApproveText}`,
      nzContent: `Bạn có chắc muốn ${isApproveText} danh sách PO đã chọn không?`,
      nzOkText: isApprove ? 'Duyệt' : 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const listPONCC: any[] = [];
        selectedRows.forEach((po: any) => {
          if (po.ID && po.ID > 0) {
            listPONCC.push(po);
          }
        });

        if (listPONCC.length <= 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có PO hợp lệ để cập nhật!'
          );
          return;
        }

        const updateData = listPONCC.map((po) => ({
          ID: po.ID,
          IsApproved: isApprove,
        }));

        this.isLoading = true;

        this.srv.updatePONCC(updateData).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `Đã ${isApproveText} thành công ${listPONCC.length} PO`
            );
            this.onSearch();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              `Không thể ${isApproveText} PO. Vui lòng thử lại!`
            );
          },
        });
      },
    });
  }

  onCopyPO() {
    const selectedRows = this.getSelectedMasterRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một PO để sao chép'
      );
      return;
    }

    const selectedPO = selectedRows[0];
    this.isLoading = true;

    this.srv.getDetails(selectedPO.ID).subscribe({
      next: (detailResponse: any) => {
        // Tìm supplier để lấy CodeNCC
        const supplier = this.suppliers.find((s: any) => s.ID === selectedPO.SupplierSaleID);
        const codeNCC = supplier?.CodeNCC || '';
        const poType = selectedPO.POType ?? 0;

        // Load POCode và BillCode mới song song
        forkJoin({
          poCode: codeNCC ? this.srv.getPOCode(codeNCC) : of({ data: '' }),
          billCode: this.srv.getBillCode(poType)
        }).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            const modalRef = this.modalService.open(PonccDetailComponent, {
              backdrop: 'static',
              keyboard: false,
              centered: true,
              windowClass: 'full-screen-modal',
            });

            const details = (detailResponse.data.data || []).map((row: any) => ({
              ...row,
              ID: 0,
              PONCCID: 0,
              ProjectPartlistPurchaseRequestID: 0,
            }));

            // Copy PO với mã mới
            const copiedPO = {
              ...selectedPO,
              ID: 0,
              POCode: res.poCode.data || '',
              BillCode: res.billCode.data || '',
              Status: 0 // Reset về trạng thái "Đang tiến hành"
            };
              console.log('copyPO:',copiedPO);

            modalRef.componentInstance.poncc = copiedPO;
            modalRef.componentInstance.isCopy = true;
            modalRef.componentInstance.dtRef = [];
            modalRef.componentInstance.ponccDetail = details;

            modalRef.result.finally(() => {
              this.onSearch();
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.notify.error('Lỗi', err.error?.message || err?.message);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', err.error?.message || err?.message);
      },
    });
  }

  async onExportToExcel(): Promise<void> {
    const currentGrid =
      this.activeTabIndex === 0
        ? this.angularGridPoThuongMai
        : this.angularGridPoMuon;

    if (!currentGrid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    // Lấy số dòng để thông báo
    const itemCount = currentGrid.dataView?.getItemCount() || 0;
    if (itemCount === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    try {
      // Lấy dữ liệu từ grid
      const allData: any[] = [];
      for (let i = 0; i < currentGrid.dataView.getLength(); i++) {
        const item = currentGrid.dataView.getItem(i);
        if (item) {
          allData.push(item);
        }
      }

      // Lấy columns từ grid
      const columns = currentGrid.slickGrid.getColumns();
      const visibleColumns = columns.filter(
        (col: Column) => !col.hidden && col.id !== 'id'
      );

      // Tạo workbook và worksheet
      const workbook = new ExcelJS.Workbook();
      const sheetName = `PO NCC ${
        this.activeTabIndex === 0 ? 'Thương mại' : 'Mượn'
      }`;
      const worksheet = workbook.addWorksheet(sheetName);

      // Thêm header row
      const headerRow = worksheet.addRow(
        visibleColumns.map((col: Column) => col.name || col.field || '')
      );
      headerRow.font = { bold: true, name: 'Tahoma' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };

      // Thêm data rows
      allData.forEach((row: any) => {
        const rowData = visibleColumns.map((col: Column) => {
          const field = col.field || '';
          let value = row[field];

          // Xử lý null/undefined
          if (value === null || value === undefined) {
            return '';
          }

          // Xử lý boolean
          if (typeof value === 'boolean') {
            return value ? 'X' : '';
          }

          // Xử lý date
          if (value instanceof Date) {
            return DateTime.fromJSDate(value).toFormat('dd/MM/yyyy');
          }
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
          }

          // Format số tiền nếu là number
          if (typeof value === 'number') {
            // Format các trường số tiền với 2 chữ số thập phân
            if (
              [
                'TotalMoneyPO',
                'CurrencyRate',
                'BankCharge',
                'UnitPrice',
                'ThanhTien',
                'VATMoney',
                'Discount',
                'FeeShip',
                'TotalPrice',
                'PriceSale',
                'PriceHistory',
                'BiddingPrice',
              ].includes(field)
            ) {
              return this.formatNumberEnUS(value, 2);
            }
            // Format các trường số lượng với 0 chữ số thập phân
            if (
              [
                'QtyRequest',
                'QuantityRequested',
                'QuantityReturn',
                'QuantityRemain',
                'VAT',
                'DiscountPercent',
              ].includes(field)
            ) {
              return this.formatNumberEnUS(value, 0);
            }
            // Các số khác format với 2 chữ số thập phân
            return this.formatNumberEnUS(value, 2);
          }

          return value;
        });
        worksheet.addRow(rowData);
      });

      // Set column width
      worksheet.columns = visibleColumns.map((col: Column) => {
        let width = 15; // default width
        if (col.width && typeof col.width === 'number') {
          width = Math.max(col.width / 7, 8); // Convert pixels to Excel width
          width = Math.min(width, 50); // Max width 50
        }
        return { width };
      });

      // Thêm border cho tất cả cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (!cell.font) {
            cell.font = { name: 'Tahoma' };
          } else {
            cell.font = { ...cell.font, name: 'Tahoma' };
          }
          if (rowNumber === 1) {
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
              wrapText: true,
            };
          } else {
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
          }
        });
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `poncc-${
        this.activeTabIndex === 0 ? 'thuong-mai' : 'muon'
      }-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success(
        NOTIFICATION_TITLE.success,
        `Đã xuất Excel thành công ${itemCount} dòng!`
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Có lỗi xảy ra khi xuất Excel!'
      );
    }
  }

  onImportWareHouse(warehouseID: number) {
    const selectedRows = this.getSelectedMasterRows();

    // Validate selection
    if (!selectedRows || selectedRows.length <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn PO!'
      );
      return;
    }

    // Validate status - chỉ cho phép status 0 hoặc 5
    for (const po of selectedRows) {
      const id = po.ID || 0;
      if (id <= 0) continue;

      const status = po.Status || 0;
      const statusText = po.StatusText || '';
      const code = po.POCode || '';

      if (status !== 0 && status !== 5) {
        this.modal.warning({
          nzTitle: 'Thông báo',
          nzContent: `PO [${code}] đã ${statusText}.\nBạn không thể yêu cầu nhập kho!`,
          nzOkText: 'Đóng',
        });
        return;
      }
    }

    this.modal.confirm({
      nzTitle: `Xác nhận yêu cầu nhập kho`,
      nzContent: `Bạn có chắc muốn yêu cầu nhập kho danh sách PO đã chọn không?`,
      nzOkText: 'OK',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Cập nhật masterDetailsMap với các detail đã chọn hiện tại
        // Nếu có detail được chọn thì chỉ lấy detail đã chọn
        // Nếu không có detail nào được chọn thì giữ nguyên tất cả detail của master
        if (this.lastMasterId) {
          const currentSelectedDetails = this.getSelectedDetailRows();
          if (currentSelectedDetails.length > 0) {
            this.masterDetailsMap.set(
              this.lastMasterId,
              currentSelectedDetails
            );
          }
        }

        const ids = selectedRows.map((x) => x.ID).join(',');
        const idString = Array.from(this.masterDetailsMap.values())
          .flat()
          .map((x) => x.ID)
          .filter((id) => id != null)
          .join(',');

        this.srv.getPonccDetail(ids, warehouseID, idString).subscribe((res) => {
          let dataSale = res.data.dataSale || [];
          let dataDemo = res.data.dataDemo || [];
          let listSaleDetail = res.data.listSaleDetail || [];
          let listDemoDetail = res.data.listDemoDetail || [];
          let listDemoPonccId = res.data.listDemoPonccId || [];
          let listSalePonccId = res.data.listSalePonccId || [];

          //   console.log('dataSale', dataSale);
          //   console.log('listSaleDetail', listSaleDetail);
          //   console.log('listSalePonccId', listSalePonccId);
          //   console.log('dataDemo', dataDemo);
          //   console.log('listDemoDetail', listDemoDetail);
          //   console.log('listDemoPonccId', listDemoPonccId);

          if (dataSale.length > 0) {
            this.openBillImportModalSequentially(
              dataSale,
              listSaleDetail,
              listSalePonccId,
              warehouseID,
              0,
              0
            );
          }

          if (dataDemo.length > 0) {
            this.openBillImportModalSequentially(
              dataDemo,
              listDemoDetail,
              listDemoPonccId,
              warehouseID,
              0,
              1
            );
          }
        });
      },
    });
  }

  private openBillImportModalSequentially(
    listData: any[],
    listDetail: any[],
    listPonccId: any[],
    warehouseID: number,
    index: number,
    type: number
  ) {
    let warehouseCode = '';
    switch (warehouseID) {
      case 1:
        warehouseCode = 'HN';
        break;
      case 2:
        warehouseCode = 'HCM';
        break;
      case 3:
        warehouseCode = 'BN';
        break;
      case 4:
        warehouseCode = 'HP';
        break;
      case 6:
        warehouseCode = 'DP';
        break;
      default:
        warehouseCode = '';
        break;
    }

    if (index >= listData.length) {
      //   console.log('Đã hoàn thành việc mở danh sách modal.');
      return;
    }

    let dataMaster = listData[index];
    let dataDetail = listDetail[index];
    let ponccId = listPonccId[index];

    // console.log('Mở modal thứ', index + 1);
    // console.log('Data master:', dataMaster);
    // console.log('Data detail:', dataDetail);
    // console.log('PO NCC ID:', ponccId);

    if (type === 0) {
      const modalRef = this.modalService.open(BillImportDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'full-screen-modal',
      });

      modalRef.componentInstance.newBillImport = dataMaster;
      modalRef.componentInstance.WarehouseCode = warehouseCode;
      modalRef.componentInstance.selectedList = dataDetail;
      modalRef.componentInstance.id = dataMaster.ID ?? 0;
      modalRef.componentInstance.poNCCId = ponccId ?? 0;

      modalRef.result
        .then((result) => {
          //   console.log(`Modal thứ ${index + 1} đã đóng. Kết quả:`, result);

          this.openBillImportModalSequentially(
            listData,
            listDetail,
            listPonccId,
            warehouseID,
            index + 1,
            type
          );
        })
        .catch((reason) => {
          //   console.log(`Modal thứ ${index + 1} bị tắt (dismiss):`, reason);

          this.openBillImportModalSequentially(
            listData,
            listDetail,
            listPonccId,
            warehouseID,
            index + 1,
            type
          );
        });
    }

    if (type === 1) {
      const modalRef = this.modalService.open(
        BillImportTechnicalFormComponent,
        {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          windowClass: 'full-screen-modal',
        }
      );

      modalRef.componentInstance.newBillImport = dataMaster;
      modalRef.componentInstance.warehouseID = warehouseID;
      modalRef.componentInstance.flag = 1;
      modalRef.componentInstance.dtDetails = dataDetail;
      modalRef.componentInstance.PonccID = ponccId ?? 0;

      modalRef.result
        .then((result) => {
          console.log(`Modal thứ ${index + 1} đã đóng. Kết quả:`, result);

          this.openBillImportModalSequentially(
            listData,
            listDetail,
            listPonccId,
            warehouseID,
            index + 1,
            type
          );
        })
        .catch((reason) => {
          //   console.log(`Modal thứ ${index + 1} bị tắt (dismiss):`, reason);

          this.openBillImportModalSequentially(
            listData,
            listDetail,
            listPonccId,
            warehouseID,
            index + 1,
            type
          );
        });
    }
  }
  onMasterDblClick(event: any): void {
    const args = event?.args;
    const row = args?.row;

    if (row == null) return;
    if (this.activeTabIndex === 0) {
      const grid = this.angularGridPoThuongMai?.slickGrid;
      grid?.setSelectedRows([row]);
    } else if (this.activeTabIndex === 1) {
      const grid = this.angularGridPoMuon?.slickGrid;
      grid?.setSelectedRows([row]);
    }
    // gọi hàm edit
    this.onEditPoncc();
  }

  onOpenSummary() {
    const modalRef = this.modalService.open(PonccSummaryComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
  }

  onOpenPaymentOrder() {
    const selectedRows = this.getSelectedMasterRows();
    if (selectedRows.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một PO để tạo đề nghị thanh toán'
      );
      return;
    }

    const selectedPO = selectedRows[0];
    const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.ponccID = selectedPO.ID;

    modalRef.result.then(
      (result) => {
        // Handle modal close with result
        if (result) {
          this.notify.success(
            NOTIFICATION_TITLE.success,
            'Tạo phiếu đề nghị thanh toán thành công'
          );
        }
      },
      (reason) => {
        // Handle modal dismiss
        console.log('Modal dismissed:', reason);
      }
    );
  }
  onCreatePDFLanguageVi(data: any, isShowSign: boolean, isShowSeal: boolean) {
    // console.log(data);
    let po = data.po;
    let poDetails = data.poDetails;
    let employeePurchase = data.employeePurchase;
    let taxCompany = data.taxCompany;

    const totalAmount = poDetails.reduce(
      (sum: number, x: any) => sum + x.ThanhTien,
      0
    );
    const vatMoney = poDetails.reduce(
      (sum: number, x: any) => sum + x.VATMoney,
      0
    );
    const discount = poDetails.reduce(
      (sum: number, x: any) => sum + x.Discount,
      0
    );
    const totalPrice = poDetails.reduce(
      (sum: number, x: any) => sum + x.TotalPrice,
      0
    );

    let items: any = [];

    for (let i = 0; i < poDetails.length; i++) {
      let item = [
        { text: poDetails[i].STT, alignment: 'center' },
        { text: poDetails[i].ProductCodeOfSupplier, alignment: '' },

        { text: poDetails[i].UnitName, alignment: '' },
        {
          text: this.formatNumber(poDetails[i].QtyRequest),
          alignment: 'right',
        },
        { text: this.formatNumber(poDetails[i].UnitPrice), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].ThanhTien), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].VAT), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].VATMoney), alignment: 'right' },
      ];
      items.push(item);
    }

    let cellDisplaySign = { text: '', style: '', margin: [0, 60, 0, 60] };

    let cellPicPrepared: any =
      po.PicPrepared == ''
        ? cellDisplaySign
        : {
            image: 'data:image/png;base64,' + po.PicPrepared,
            width: 150,
            margin: [0, 0, 40, 0],
          };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;
    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
            image: 'data:image/png;base64,' + po.PicDirector,
            width: 170,
            margin: [20, 0, 0, 0],
          };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    // console.log('isShowSeal:', this.isShowSeal);
    // console.log('cellPicPrepared:', cellPicDirector);

    let docDefinition = {
      info: {
        title: po.BillCode,
      },
      content: [
        `${taxCompany.BuyerVietnamese}
                ${taxCompany.AddressBuyerVienamese}
                ${taxCompany.TaxVietnamese}`,
        {
          text: 'ĐƠN MUA HÀNG',
          alignment: 'center',
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 10],
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 35, 30, 25],
            body: [
              [
                'Tên nhà cung cấp:',
                { colSpan: 3, text: po.NameNCC },
                '',
                '',
                'Ngày:',
                {
                  colSpan: 2,
                  text: DateTime.fromISO(po.RequestDate).toFormat('dd/MM/yyyy'),
                },
              ],
              [
                'Địa chỉ:',
                { colSpan: 3, text: po.AddressNCC },
                '',
                '',
                'Số:',
                { colSpan: 2, text: po.BillCode },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 30, 25, 35],
            body: [
              [
                'Mã số thuế:',
                { colSpan: 3, text: po.MaSoThue },
                '',
                '',
                { colSpan: 2, text: 'Loại tiền:' },
                '',
                po.CurrencyText,
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [80, '*', 30, 70, 35, 30, 25],
            body: [
              [
                'Điện thoại:',
                po.SupplierContactPhone,
                'Fax:',
                { colSpan: 4, text: po.Fax },
              ],
              ['Diễn giải:', { colSpan: 6, text: po.Note }],
            ],
          },
          layout: 'noBorders',
        },

        //Bảng chi tiết sản phẩm
        {
          table: {
            widths: [20, 120, 30, 45, '*', '*', 35, '*'],
            body: [
              //Header table
              [
                { text: 'STT', alignment: 'center', bold: true },
                { text: 'Diễn giải', alignment: 'center', bold: true },
                { text: 'Đơn vị', alignment: 'center', bold: true },
                { text: 'Số lượng', alignment: 'center', bold: true },
                { text: 'Đơn giá', alignment: 'center', bold: true },
                { text: 'Thành tiền', alignment: 'center', bold: true },
                { text: '% VAT', alignment: 'center', bold: true },
                { text: 'Tổng tiền VAT', alignment: 'center', bold: true },
              ],

              //list item
              ...items,
              //sum footer table
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 4,
                  text: 'Cộng tiền hàng:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(totalAmount),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Tiền thuế GTGT:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(vatMoney),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Chiết khấu:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(discount),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '2',
                {
                  colSpan: 4,
                  text: 'Tổng tiền thanh toán:',
                  border: [false, false, false, true],
                },
                '4',
                '5',
                '6',
                {
                  colSpan: 2,
                  text: this.formatNumber(totalPrice),
                  alignment: 'right',
                  bold: true,
                  border: [false, false, true, true],
                },
                '8',
              ],
              [
                {
                  colSpan: 2,
                  text: 'Số tiền viết bằng chữ:',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 6,
                  text: po.TotalMoneyText,
                  bold: true,
                  italics: true,
                  border: [false, false, true, true],
                },
                '4',
                '5',
                '6',
                '7',
                '8',
              ],
            ],
          },
        },
        //Thông tin khác
        {
          style: 'tableExample',
          table: {
            body: [
              [
                'Ngày giao hàng:',
                DateTime.fromISO(po.DeliveryDate).toFormat('dd/MM/yyyy'),
              ],
              ['Địa điểm giao hàng:', po.AddressDelivery],
              ['Điều khoàn thanh toán:', po.RulePayName],
              ['Số tài khoản:', po.AccountNumberSupplier],
            ],
          },
          layout: 'noBorders',
        },
        //Chữ ký
        {
          alignment: 'justify',
          columns: [
            { text: 'Người bán', alignment: 'center', bold: true },
            { text: 'Người lập', alignment: 'center', bold: true },
            { text: 'Người mua', alignment: 'center', bold: true },
          ],
        },
        {
          alignment: 'justify',
          columns: [
            {
              text: '(Ký, họ tên)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Ký, họ tên)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Ký, họ tên)',
              italics: true,
              alignment: 'center',
            },
          ],
        },
        {
          alignment: 'justify',
          columns: [{ text: '', style: '' }, cellPicPrepared, cellPicDirector],
        },
        {
          alignment: 'justify',
          columns: [
            {
              text: '',
            },
            {
              table: {
                body: [
                  ['Phone:', employeePurchase.Telephone],
                  ['Email:', employeePurchase.Email],
                ],
              },
              layout: 'noBorders',
            },
            {
              text: '',
            },
          ],
        },
      ],
      defaultStyle: {
        fontSize: 10,
        alignment: 'justify',
        font: 'Times',
      },
    };

    return docDefinition;
  }
  onCreatePDFLanguageEn(data: any, isShowSign: boolean, isShowSeal: boolean) {
    let po = data.po;
    let poDetails = data.poDetails;
    let taxCompany = data.taxCompany;

    const totalAmount = poDetails.reduce(
      (sum: number, x: any) => sum + x.ThanhTien,
      0
    );
    const vatMoney = poDetails.reduce(
      (sum: number, x: any) => sum + x.VATMoney,
      0
    );
    const discount = poDetails.reduce(
      (sum: number, x: any) => sum + x.Discount,
      0
    );
    const totalPrice = poDetails.reduce(
      (sum: number, x: any) => sum + x.TotalPrice,
      0
    );

    let items: any = [];

    for (let i = 0; i < poDetails.length; i++) {
      let item = [
        { text: poDetails[i].STT, alignment: 'center' },
        { text: poDetails[i].ProductCodeOfSupplier, alignment: '' },

        { text: poDetails[i].UnitName, alignment: '' },
        {
          text: this.formatNumber(poDetails[i].QtyRequest),
          alignment: 'right',
        },
        { text: this.formatNumber(poDetails[i].UnitPrice), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].ThanhTien), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].VAT), alignment: 'right' },
        { text: this.formatNumber(poDetails[i].VATMoney), alignment: 'right' },
      ];
      items.push(item);
    }

    let cellDisplaySign = { text: '', style: '', margin: [0, 60, 0, 60] };
    let cellPicPrepared: any =
      po.PicPrepared == ''
        ? cellDisplaySign
        : {
            image: 'data:image/png;base64,' + po.PicPrepared,
            width: 150,
            margin: [0, 0, 40, 0],
          };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;

    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
            image: 'data:image/png;base64,' + po.PicDirector,
            width: 170,
            margin: [20, 0, 0, 0],
          };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    //
    let docDefinition = {
      info: {
        title: po.BillCode,
      },
      content: [
        {
          alignment: 'justify',
          columns: [
            {
              image:
                'data:image/png;base64,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',
              fit: [100, 100],
            },
            {
              text: 'PURCHASE ORDER',
              fontSize: 12,
              alignment: 'center',
              bold: true,
              margin: [0, 20, 0, 0],
            },
            {
              text: po.POCode,
              fontSize: 12,
              alignment: 'center',
              bold: true,
              margin: [0, 20, 0, 0],
            },
          ],
        },

        {
          style: 'tableExample',
          table: {
            widths: [90, '*', 30, 60],
            body: [
              [
                'Supplier name:',
                { text:po.NameNCC, bold: true },
                'Date:',
                DateTime.fromISO(po.RequestDate).toFormat('dd/MM/yyyy'),
              ],
              [
                'Address:',
                { text: po.AddressNCC, bold: true },
                'No:',
                po.BillCode,
              ],
            ],
          },
          layout: 'noBorders',
        },

        {
          style: 'tableExample',
          table: {
            widths: [90, '*', 30, 70, 60, 30],
            body: [
              [
                'Telephone number:',
                { text: po.SupplierContactPhone },
                'Fax:',
                po.Fax == '' ? '............................' : po.Fax,
                'Currency type:',
                po.CurrencyText,
              ],
              [
                'Contact Name:',
                { text: po.SupplierContactName },
                'Email:',
                { colSpan: 3, text: po.SupplierContactEmail },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          style: 'tableExample',
          table: {
            widths: [90, '*'],
            body: [
              ['Buyer:', { text: taxCompany.BuyerEnglish, bold: true }],
              ['Address:', taxCompany.AddressBuyerEnglish],
              ['Legal Representative:', taxCompany.LegalRepresentativeEnglish],
              ['Purchaser:', po.Purchaser],
            ],
          },
          layout: 'noBorders',
        },

        'We hereby accept and confirm to order with the following details:',
        {
          style: 'tableExample',
          table: {
            widths: [20, 130, 30, 46, '*', '*', 30, '*'],
            body: [
              //Header table
              [
                { text: 'No', alignment: 'center', bold: true },
                { text: 'Description', alignment: 'center', bold: true },
                { text: 'Unit', alignment: 'center', bold: true },
                { text: 'Quantity', alignment: 'center', bold: true },
                { text: 'Unit price', alignment: 'center', bold: true },
                { text: 'Amount', alignment: 'center', bold: true },
                { text: 'VAT', alignment: 'center', bold: true },
                { text: 'VATMoney', alignment: 'center', bold: true },
              ],

              //list item
              ...items,
              //sum footer table
              [
                {
                  colSpan: 8,
                  text: 'O',
                  style: 'header',
                  border: [true, false, true, true],
                },
              ],
              [
                {
                  colSpan: 2,
                  text: 'Total amount:',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 3,
                  text: po.RuleIncoterm,
                  style: 'header',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(totalAmount),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'VAT amount',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(vatMoney),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'Discount',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(discount),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                { colSpan: 2, text: '', border: [true, false, false, true] },
                '',
                {
                  colSpan: 3,
                  text: 'Total payment',
                  border: [false, false, false, true],
                },
                '',
                '',
                {
                  colSpan: 3,
                  text: this.formatNumber(totalPrice),
                  alignment: 'right',
                  border: [false, false, true, true],
                },
              ],
              [
                {
                  colSpan: 2,
                  text: 'Total amount (In words):',
                  border: [true, false, false, true],
                },
                '',
                {
                  colSpan: 6,
                  text: po.TotalAmountText,
                  bold: true,
                  italics: true,
                  border: [false, false, true, true],
                },
              ],
            ],
          },
          layout: {
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          height: 60,
        },
        {
          style: 'tableExample',
          table: {
            body: [
              [
                'Delivery date:',
                DateTime.fromISO(po.DeliveryDate).toFormat('dd/MM/yyyy'),
              ],
              ['Delivery point:', po.AddressDelivery],
              ['Term:', po.RulePayName],
              ['Bank Charge:', po.BankCharge],
              ['Fedex Account:', po.FedexAccount],
              ['Bank Account:', po.AccountNumberSupplier],
            ],
          },
          layout: 'noBorders',
        },

        {
          alignment: 'justify',
          columns: [
            { text: 'Supplier', alignment: 'center', bold: true },
            { text: 'Prepared by', alignment: 'center', bold: true },
            { text: 'Director', alignment: 'center', bold: true },
          ],
        },
        {
          alignment: 'justify',
          columns: [
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
            {
              text: '(Signature, full name)',
              italics: true,
              alignment: 'center',
            },
          ],
        },
        {
          alignment: 'justify',
          columns: [{ text: '', style: '' }, cellPicPrepared, cellPicDirector],
        },
      ],

      defaultStyle: {
        fontSize: 10,
        alignment: 'justify',
        font: 'Times',
      },
    };

    return docDefinition;
  }
  formatNumber(num: number, digits: number = 2) {
    num = num || 0;
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  onPrintPO(language: string) {
    this.tabs = [];
    this.language = language;

    // Lấy selected rows từ grid đang active
    const selectedRows = this.getSelectedMasterRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một PO để in!'
      );
      return;
    }

    // Tạo tabs cho từng PO được chọn
    for (let i = 0; i < selectedRows.length; i++) {
      const dataRow = selectedRows[i];
      const id = dataRow['ID'];
      const billCode = dataRow['BillCode'];

      this.tabs.push({
        title: billCode,
        url: '',
        docDefinition: null,
        isMerge: false,
        isShowSign: true,
        isShowSeal: true,
        id: id,
      });

      // Gọi API printPO để lấy data và render PDF
      this.srv.printPO(id, this.tabs[i].isMerge).subscribe({
        next: (response) => {
          this.dataPrint = response.data;

          // Mở modal preview
          this.showPreview = true;

          // Render PDF
          this.renderPDF(language, i);
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Lỗi khi in PO');
        },
      });
    }
  }

  toggleMerge(tab: any) {
    this.srv.printPO(tab.id, tab.isMerge).subscribe({
      next: (response) => {
        this.dataPrint = response.data;

        let index = this.tabs.indexOf(tab);
        this.renderPDF(this.language, index);
      },
    });
  }

  toggleSign(tab: any) {
    this.srv.printPO(tab.id, tab.isShowSign).subscribe({
      next: (response) => {
        this.dataPrint = response.data;

        let index = this.tabs.indexOf(tab);
        this.renderPDF(this.language, index);
      },
    });
  }

  toggleSeal(tab: any) {
    this.srv.printPO(tab.id, tab.isShowSign).subscribe({
      next: (response) => {
        this.dataPrint = response.data;

        let index = this.tabs.indexOf(tab);
        this.renderPDF(this.language, index);
      },
    });
  }

  renderPDF(language: string, index: number) {
    if (!this.dataPrint) return;

    const tab = this.tabs[index];
    if (!tab) return;

    let docDefinition: any =
      language === 'vi'
        ? this.onCreatePDFLanguageVi(this.dataPrint, tab.isShowSign, tab.isShowSeal)
        : this.onCreatePDFLanguageEn(this.dataPrint, tab.isShowSign, tab.isShowSeal);

    tab.docDefinition = docDefinition;

    pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
      tab.url = URL.createObjectURL(blob);
    });
  }

  downloadPDF(index: number) {
    const tab = this.tabs[index];
    if (!tab) return;
    if (!tab.docDefinition) {
      console.error('Chưa có PDF cho tab này');
      return;
    }
    let defaultTitle =
      this.language === 'vi' ? 'PONCCReportVietnamese' : 'PONCCReportEnglish';
    let title = tab.docDefinition?.info?.title || defaultTitle;

    pdfMake.createPdf(tab.docDefinition).download(title + '.pdf');
  }

  // Initialize PrimeNG MenuBar items
  initMenuItems(): void {
    this.menuItems = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddPoncc(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditPoncc(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeletePoncc(),
      },
      {
        label: 'Duyệt',
        icon: 'fa-solid fa-circle-check fa-lg text-success',
        command: () => this.onApprovePoncc(true),
      },
      {
        label: 'Hủy duyệt',
        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
        command: () => this.onApprovePoncc(false),
      },
      {
        label: 'In PO',
        icon: 'fa-solid fa-print fa-lg text-primary',
        items: [
          {
            label: 'Tiếng Việt',
            icon: 'fa-solid fa-flag fa-lg',
            command: () => this.onPrintPO('vi'),
          },
          {
            label: 'Tiếng Anh',
            icon: 'fa-solid fa-globe fa-lg',
            command: () => this.onPrintPO('en'),
          },
        ],
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-clone fa-lg text-primary',
        command: () => this.onCopyPO(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExportToExcel(),
      },
      {
        label: 'YC nhập kho',
        icon: 'fa-solid fa-warehouse fa-lg text-primary',
        items: [
          {
            label: 'Kho HN',
            command: () => this.onImportWareHouse(1),
          },
          {
            label: 'Kho HCM',
            command: () => this.onImportWareHouse(2),
          },
          {
            label: 'Kho BN',
            command: () => this.onImportWareHouse(3),
          },
          {
            label: 'Kho HP',
            command: () => this.onImportWareHouse(4),
          },
          {
            label: 'Kho ĐP',
            command: () => this.onImportWareHouse(6),
          },
        ],
      },
      {
        label: 'Tổng hợp',
        icon: 'fa-solid fa-chart-pie fa-lg text-info',
        command: () => this.onOpenSummary(),
      },
      {
        label: 'Đề nghị TT',
        icon: 'fa-solid fa-money-bill fa-lg text-success',
        command: () => this.onOpenPaymentOrder(),
      },
    ];
  }
}

interface PoTab {
  title: string;
  url: string;
  docDefinition: any;
  isMerge: false;
  isShowSign: true;
  isShowSeal: true;
  id: 0;
}
