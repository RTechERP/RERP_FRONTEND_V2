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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
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
    NzInputNumberModule,
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

  isLoadingExcel: boolean = false;

  preparedMarginTop: number = 0;
  directorMarginTop: number = 0;
  preparedWidth: number = 150;
  directorWidth: number = 170;
  preparedMarginLeft: number = 0;
  directorMarginLeft: number = 20;
  titleMarginTop: number = 0;
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
  ) { }

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
          model: Filters['compoundInputText'],
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
      enableRowSelection: false,
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
          const customTitle = `Danh sách PO NCC ${this.activeTabIndex === 0 ? 'Thương mại' : 'Mượn'
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
            uniqueId = `tab_${this.activeTabIndex
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
      'CurrencyText',
      'FullName',
      'CompanyText',
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

    // if (angularGrid.slickGrid) {
    //   angularGrid.slickGrid.onActiveCellChanged.subscribe((e, args) => {
    //     setTimeout(() => {
    //       console.log(args.row);
    //       this.onActiveRowChanged(args.row);
    //     }, 50);
    //   });
    // }
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

    // if (angularGrid.slickGrid) {
    //   angularGrid.slickGrid.onActiveCellChanged.subscribe((e, args) => {
    //     setTimeout(() => {
    //       this.onActiveRowChanged(args.row);
    //     }, 50);
    //   });
    // }


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
            console.log('copyPO:', copiedPO);

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
      const sheetName = `PO NCC ${this.activeTabIndex === 0 ? 'Thương mại' : 'Mượn'
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
      link.download = `poncc-${this.activeTabIndex === 0 ? 'thuong-mai' : 'muon'
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
    clearTimeout(this.clickTimer);
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

        { text: (poDetails[i].UnitName || poDetails[i].Unit), alignment: '' },
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
          width: this.preparedWidth,
          margin: [this.preparedMarginLeft, this.preparedMarginTop, 40, 0],
        };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;
    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicDirector,
          width: this.directorWidth,
          margin: [this.directorMarginLeft, this.directorMarginTop, 0, 0],
        };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    // console.log('isShowSeal:', this.isShowSeal);
    // console.log('cellPicPrepared:', cellPicDirector);

    let docDefinition = {
      pageMargins: [40, 20, 40, 10],
      info: {
        title: po.BillCode,
      },
      content: [
        `${taxCompany.BuyerVietnamese || ''}
                ${taxCompany.AddressBuyerVienamese || ''}
                ${taxCompany.TaxVietnamese || ''}`,
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
          margin: [0, this.titleMarginTop, 0, 0],
          columns: [
            { text: 'Người bán', alignment: 'center', bold: true },
            { text: 'Người lập', alignment: 'center', bold: true },
            { text: 'Người mua', alignment: 'center', bold: true },
          ],
        },
        {
          alignment: 'justify',
          //margin: [0, this.titleMarginTop, 0, 0],
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
          width: this.preparedWidth,
          margin: [this.preparedMarginLeft, this.preparedMarginTop, 40, 0],
        };
    if (!isShowSign) cellPicPrepared = cellDisplaySign;

    let cellPicDirector: any =
      po.PicDirector == ''
        ? cellDisplaySign
        : {
          image: 'data:image/png;base64,' + po.PicDirector,
          width: this.directorWidth,
          margin: [this.directorMarginLeft, this.directorMarginTop, 0, 0],
        };
    if (!isShowSeal) cellPicDirector = cellDisplaySign;
    const EMPTY_IMAGE_BASE64 =
      'iVBORw0KGgoAAAANSUhEUgAAANgAAABSCAYAAAA2CxpTAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjw' +
      'v8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD+SURBVHhe7dOhAQAgDMAw4P+fh0dTl8j67pmZBSTOG4B/' +
      'DAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhi' +
      'EDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiE' +
      'DAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg0HIYBAyGIQMBiGDQchgEDIYhAwGIYNByGAQMhiEDAYhg' +
      '0HIYBAyGIQMBiGDQchgEDIYhC4EjgSgJ7qviAAAAABJRU5ErkJggg==';
    let docDefinition = {
      pageMargins: [40, 20, 40, 10],
      info: {
        title: po.BillCode,
      },
      content: [
        {
          alignment: 'justify',
          columns: [
            {
              image:
                'data:image/png;base64,' + (po.Logo || EMPTY_IMAGE_BASE64),
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
                { text: po.NameNCC, bold: true },
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
                  text: '',
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
          margin: [0, this.titleMarginTop, 0, 0],
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
        preparedMarginTopTab: 0,
        directorMarginTopTab: 0,
        preparedWidthTab: 150,
        directorWidthTab: 170,
        preparedMarginLeftTab: 0,
        directorMarginLeftTab: 0.53,
        titleMarginTopTab: 0,
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
    this.setTab(tab);
    this.srv.printPO(tab.id, tab.isMerge).subscribe({
      next: (response) => {
        this.dataPrint = response.data;

        let index = this.tabs.indexOf(tab);
        this.renderPDF(this.language, index);
      },
    });
  }

  toggleSign(tab: any) {
    this.setTab(tab);
    this.srv.printPO(tab.id, tab.isMerge).subscribe({
      next: (response) => {
        this.dataPrint = response.data;

        let index = this.tabs.indexOf(tab);
        this.renderPDF(this.language, index);
      },
    });
  }

  toggleSeal(tab: any) {
    this.setTab(tab);
    this.srv.printPO(tab.id, tab.isMerge).subscribe({
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

  //#region In excel poncc
  onPrintPOExcel(tab: any) {
    this.isLoadingExcel = true;
    this.srv
      .printPONCCExcel(tab.id, tab.isMerge, this.language, tab.isShowSign, tab.isShowSeal)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${tab.title}.xlsx`;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.isLoadingExcel = false;
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Lỗi khi in PO'
          );
          this.isLoadingExcel = false;
        }
      });
  }

  cmToPx(cm: number, dpi: number = 96): number {
    return cm * dpi / 2.54;
  }

  resetNumber(tab: any) {
    tab.preparedMarginTopTab = 0;
    tab.directorMarginTopTab = 0;
    tab.preparedWidthTab = 150;
    tab.directorWidthTab = 170;
    tab.preparedMarginLeftTab = 0;
    tab.directorMarginLeftTab = 0.53;
    tab.titleMarginTopTab = 0;
    this.toggleSeal(tab);
  }

  setTab(tab: any) {
    this.preparedMarginTop = this.cmToPx(tab.preparedMarginTopTab);
    this.directorMarginTop = this.cmToPx(tab.directorMarginTopTab);
    this.preparedWidth = tab.preparedWidthTab;
    this.directorWidth = tab.directorWidthTab;
    this.preparedMarginLeft = this.cmToPx(tab.preparedMarginLeftTab);
    this.directorMarginLeft = this.cmToPx(tab.directorMarginLeftTab);
    this.titleMarginTop = this.cmToPx(tab.titleMarginTopTab);
  }

  onClosePreview() {
    this.showPreview = false;
    this.preparedMarginTop = 0;
    this.directorMarginTop = 0;
    this.preparedWidth = 150;
    this.directorWidth = 170;
    this.preparedMarginLeft = 0;
    this.directorMarginLeft = 20;
    this.titleMarginTop = 0;
  }
  private clickTimer: any;
  onActiveRowChanged(row: number | undefined) {
    clearTimeout(this.clickTimer);
    if (row == null) return;
    this.clickTimer = setTimeout(() => {
      let rowData;
      if (this.activeTabIndex === 0) {
        rowData = this.angularGridPoThuongMai?.dataView.getItem(row);
      } else if (this.activeTabIndex === 1) {
        rowData = this.angularGridPoMuon?.dataView.getItem(row);
      }

      this.handleMasterSelectionChange([rowData]);
    }, 300);
  }
  //#endregion

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
  preparedMarginTopTab: number;
  directorMarginTopTab: number;
  preparedWidthTab: number;
  directorWidthTab: number;
  preparedMarginLeftTab: number;
  directorMarginLeftTab: number;
  titleMarginTopTab: number;
}


