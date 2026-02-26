import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  OnClickEventArgs,
  MultipleSelectOption,
  Aggregators,
  SortComparers,
  GroupTotalFormatters,
} from 'angular-slickgrid';
import * as ExcelJS from 'exceljs';
import { SortDirectionNumber } from '@slickgrid-universal/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ProjectPartlistPriceRequestService } from '../../old/project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';
import { AppUserService } from '../../../services/app-user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupplierSaleDetailComponent } from '../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { ProjectPartlistPriceRequestOldDetailComponent } from './project-partlist-price-request-old-detail/project-partlist-price-request-old-detail.component';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-project-partlist-price-request-old',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzModalModule,
    NzDropDownModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './project-partlist-price-request-old.component.html',
  styleUrl: './project-partlist-price-request-old.component.css',
})
export class ProjectPartlistPriceRequestOldComponent
  implements OnInit, AfterViewInit
{
  //#region Khai báo biến
  projectPartlistPriceRequestOldMenu: MenuItem[] = [];

  showSearchBar: boolean = true;
  shouldShowSearchBar: boolean = true;
  isLoading: boolean = false;

  // Biến tìm kiếm
  dateStart: string = '';
  dateEnd: string = '';
  employeeRequestId: any = 0;
  employeeRequests: any = [];
  keyword: any = '';

  // Biến cho bảng
  angularGrid!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};
  dataMaster: any[] = [];
  columnWidth: number = 150;

  currencyData: any[] = [];
  supplierSaleData: any[] = [];

  statusRequestData: any[] = [
    { id: 0, name: '--Tất cả--' },
    { id: 1, name: 'Yêu cầu báo giá' },
    { id: 2, name: 'Đã báo giá' },
    { id: 3, name: 'Đã hoàn thành' },
  ];

  statusDeletedData: any[] = [
    { id: -1, name: 'Tất cả' },
    { id: 0, name: 'Chưa xóa' },
    { id: 1, name: 'Đã xóa' },
  ];

  projects: any[] = [];
  projectId: any = 0;

  statusRequest: any = 1;
  statusDeleted: any = 0;
  //#endregion

  //#region Constructor
  constructor(
    private modal: NzModalService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private projectPartlistPriceRequestService: ProjectPartlistPriceRequestService,
    private appUserService: AppUserService,
    private ngbModal: NgbModal,
    private permissionService: PermissionService
  ) {}
  //#endregion

  //#region Lifecycle
  ngOnInit(): void {
    // Khởi tạo giá trị date mặc định
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateStart = this.formatDateToInput(firstDayOfMonth);
    this.dateEnd = this.formatDateToInput(today);

    this.loadMenu();
    this.initGridColumns();
    this.initGridOptions();
    this.getAllProject();
    this.GetCurrency();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }, 200);
  }
  //#endregion

  //#region Load menu
  loadMenu() {
    //Quyền vào chức năng "N35,N33,N1,N36,N27,N69,N80"
    this.projectPartlistPriceRequestOldMenu = [
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square text-primary',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.onEdit();
        },
      },
      {
        label: 'Check giá',
        icon: 'fa-solid fa-circle-check text-success',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.CheckPrice(true);
        },
      },
      {
        label: 'Hủy check giá',
        icon: 'fa-solid fa-circle-xmark text-danger',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.CheckPrice(false);
        },
      },
      {
        label: 'Báo giá',
        icon: 'fa-solid fa-circle-check text-success',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.QuotePrice();
        },
      },
      {
        label: 'Hủy báo giá',
        icon: 'fa-solid fa-circle-xmark text-danger',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.QuotePrice(1);
        },
      },
      {
        label: 'Hoàn thành',
        icon: 'fa-solid fa-circle-check text-success',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.QuotePrice(3);
        },
      },
      {
        label: 'Chưa hoàn thành',
        icon: 'fa-solid fa-circle-xmark text-danger',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.QuotePrice(0);
        },
      },
      {
        label: 'Tải xuống',
        icon: 'fa-solid fa-download text-warning',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.DownloadFile();
        },
      },
      {
        label: 'Thêm nhà cung cấp',
        icon: 'fa-solid fa-circle-plus text-success',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.OpenAddSupplierModal();
        },
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        items: [
          {
            label: 'Theo dòng đã chọn',
            icon: 'fa-solid fa-file-excel text-success',
            command: () => {
              this.ExportToExcelAdvanced();
            },
          },
          {
            label: 'Tất cả',
            icon: 'fa-solid fa-file-excel text-success',
            command: () => {
              this.ExportToExcelTab();
            },
          },
        ],
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        visible: this.permissionService.hasPermission('N1,N34,N69'),
        command: () => {
          this.OnDeleteClick();
        },
      },
    ];
  }
  //#endregion

  //#region Sự kiện
  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
    this.shouldShowSearchBar = this.showSearchBar;
    this.loadMenu();
  }

  getAllProject() {
    this.projectPartlistPriceRequestService
      .getProject()
      .subscribe((response) => {
        this.projects = response.data;
      });
  }

  GetCurrency() {
    this.projectPartlistPriceRequestService
      .getCurrency()
      .subscribe((response) => {
        this.currencyData = response.data;
      });
  }

  onSearch() {
    this.isLoading = true;
    this.loadData();

    setTimeout(() => {
      this.updateFooterRow();
    }, 100);
  }

  onCellClicked(e: Event, args: OnClickEventArgs) {
    if (args.cell !== 0) {
      const item = args.grid.getDataItem(args.row);
      console.log('Selected item:', item);
    }
  }

  loadData() {
    // Chuyển đổi từ yyyy-MM-dd (input date) sang yyyy/MM/dd (API format)
    const dateStart = this.formatDateForAPI(this.dateStart);
    const dateEnd = this.formatDateForAPI(this.dateEnd);

    this.isLoading = true;

    this.projectPartlistPriceRequestService
      .getTypes(0, 0)
      .subscribe((response) => {
        const projectTypes = response.data?.dtType || [];

        // Biến tạm để tích lũy dữ liệu từ tất cả các type
        let allRawData: any[] = [];
        let completedRequests = 0;
        const totalTypes = projectTypes.filter(
          (type: any) => Number(type.ProjectTypeID) > 0
        ).length;

        // Nếu không có type nào, kết thúc
        if (totalTypes === 0) {
          this.isLoading = false;
          this.dataMaster = [];
          if (this.angularGrid && this.angularGrid.dataView) {
            this.angularGrid.dataView.setItems([]);
            this.angularGrid.dataView.refresh();
          }
          return;
        }

        // Gọi API cho từng type
        projectTypes.forEach((type: any) => {
          const typeId = Number(type.ProjectTypeID);

          if (typeId > 0) {
            this.projectPartlistPriceRequestService
              .getAllPartlistLocal(
                dateStart,
                dateEnd,
                this.statusRequest,
                this.projectId,
                this.keyword,
                0,
                this.statusDeleted,
                typeId,
                0,
                -1
              )
              .subscribe({
                next: (res) => {
                  const rawData = res.data || [];

                  // Tích lũy dữ liệu vào biến tạm
                  allRawData = allRawData.concat(rawData);

                  completedRequests++;

                  // Khi đã hoàn thành tất cả request, xử lý và đổ vào grid
                  if (completedRequests === totalTypes) {
                    this.processAndUpdateGrid(allRawData);
                  }
                },
                error: (error) => {
                  console.error(
                    `Error loading data for type ${typeId}:`,
                    error
                  );
                  completedRequests++;

                  // Vẫn cập nhật grid nếu đã hoàn thành tất cả request
                  if (completedRequests === totalTypes) {
                    this.processAndUpdateGrid(allRawData);
                  }
                },
              });
          }
        });
      });
  }

  // Hàm xử lý và cập nhật grid với dữ liệu đã tích lũy
  private processAndUpdateGrid(rawData: any[]) {
    // Map data với id unique và convert số
    const mappedData = rawData.map((item: any, index: number) => {
      const uniqueId =
        item.ID && Number(item.ID) > 0
          ? `id_${item.ID}`
          : `idx_${index}_${Date.now()}`;

      // Convert các trường số từ string sang number
      const numericFields = [
        'Quantity',
        'UnitPrice',
        'HistoryPrice',
        'TotalPrice',
        'TotalPriceExchange',
        'VAT',
        'TotaMoneyVAT',
        'UnitFactoryExportPrice',
        'UnitImportPrice',
        'TotalImportPrice',
        'TotalDayLeadTime',
        'CurrencyRate',
      ];

      const convertedItem = { ...item, id: uniqueId };
      numericFields.forEach((field) => {
        if (
          convertedItem[field] !== null &&
          convertedItem[field] !== undefined &&
          convertedItem[field] !== ''
        ) {
          convertedItem[field] = Number(convertedItem[field]) || 0;
        }
      });

      const booleanFields = ['IsDeleted', 'IsCheckPrice', 'IsImport'];
      booleanFields.forEach((field) => {
        const rawValue = convertedItem[field];
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          convertedItem[field] = false;
          return;
        }
        convertedItem[field] =
          rawValue === true ||
          rawValue === 1 ||
          rawValue === '1' ||
          rawValue === 'true' ||
          rawValue === 'True';
      });

      return convertedItem;
    });

    this.dataMaster = mappedData;
    this.isLoading = false;

    // Set data vào grid nếu đã ready
    if (this.angularGrid && this.angularGrid.dataView) {
      this.angularGrid.dataView.setItems(mappedData);
      this.angularGrid.dataView.refresh();
      this.angularGrid.slickGrid.invalidate();
      this.angularGrid.slickGrid.render();

      this.applyDistinctFilters();

      setTimeout(() => {
        this.updateFooterRow();
      }, 100);
    }
  }

  gridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // Lưu lại original getItemMetadata
    const originalGetItemMetadata = this.angularGrid.dataView.getItemMetadata;

    this.angularGrid.dataView.getItemMetadata = (row: number) => {
      const item = this.angularGrid.dataView.getItem(row);

      // Nếu là group row, dùng metadata gốc
      if (item?.__group === true) {
        return originalGetItemMetadata
          ? originalGetItemMetadata.call(this.angularGrid.dataView, row)
          : null;
      }

      // Nếu là deleted row, apply CSS class
      if (item?.IsDeleted === true) {
        return {
          cssClasses: 'row-deleted',
        };
      }

      return null;
    };
    // Setup grouping by ProjectName
    if (angularGrid && angularGrid.dataView) {
      // Set data trước
      if (this.dataMaster.length > 0) {
        angularGrid.dataView.setItems(this.dataMaster);
      }

      // Sau đó mới setup grouping
      angularGrid.dataView.setGrouping({
        getter: 'ProjectCode',
        formatter: (g: any) => {
          const projectCode = g.value || 'Chưa có mã dự án';
          // Lấy ProjectName từ item đầu tiên trong group
          const firstItem = angularGrid.dataView.getItemByIdx(g.rows[0]);
          const projectName = firstItem?.ProjectFullName || '';
          const displayText = projectName ? `${projectName}` : projectCode;
          return `Dự án: ${displayText} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
        },
        comparer: (a: any, b: any) => {
          return SortComparers.string(
            a.value,
            b.value,
            SortDirectionNumber.asc
          );
        },
        collapsed: false,
      });

      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();

      this.applyDistinctFilters();

      // Lắng nghe sự kiện filter để cập nhật footer tính toán theo view hiện thị
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateFooterRow();
      });

      // Sự kiện double click
      angularGrid.slickGrid.onDblClick.subscribe((e: any, args: any) => {
        this.onEdit();
      });
    }
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateFooterRow();
    }, 100);
  }

  updateFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
        this.dataMaster;

      // Đếm số lượng mã sản phẩm
      const productCodeCount = (items || []).filter(
        (item) => item.ProductCode
      ).length;

      // Tính tổng số lượng
      const totalQuantity = (items || []).reduce(
        (sum, item) => sum + (Number(item.Quantity) || 0),
        0
      );

      // Tính tổng các cột giá tiền
      const totalUnitPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitPrice) || 0),
        0
      );
      const totalPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPrice) || 0),
        0
      );
      const totalPriceExchange = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalPriceExchange) || 0),
        0
      );
      const totalMoneyVAT = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotaMoneyVAT) || 0),
        0
      );
      const totalImportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalImportPrice) || 0),
        0
      );
      const totalHistoryPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.HistoryPrice) || 0),
        0
      );
      const totalVAT = (items || []).reduce(
        (sum, item) => sum + (Number(item.VAT) || 0),
        0
      );
      const totalDayLeadTime = (items || []).reduce(
        (sum, item) => sum + (Number(item.TotalDayLeadTime) || 0),
        0
      );
      const totalUnitFactoryExportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitFactoryExportPrice) || 0),
        0
      );
      const totalUnitImportPrice = (items || []).reduce(
        (sum, item) => sum + (Number(item.UnitImportPrice) || 0),
        0
      );

      this.angularGrid.slickGrid.setFooterRowVisibility(true);

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        switch (col.id) {
          case 'ProductCode':
            footerCell.innerHTML = `<b>${productCodeCount} sản phẩm</b>`;
            break;
          case 'Quantity':
            footerCell.innerHTML = `<b>${totalQuantity.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitPrice':
            footerCell.innerHTML = `<b>${totalUnitPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'HistoryPrice':
            footerCell.innerHTML = `<b>${totalHistoryPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalPrice':
            footerCell.innerHTML = `<b>${totalPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalPriceExchange':
            footerCell.innerHTML = `<b>${totalPriceExchange.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'VAT':
            footerCell.innerHTML = `<b>${totalVAT.toLocaleString('en-US')}</b>`;
            break;
          case 'TotaMoneyVAT':
            footerCell.innerHTML = `<b>${totalMoneyVAT.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalDayLeadTime':
            footerCell.innerHTML = `<b>${totalDayLeadTime.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitFactoryExportPrice':
            footerCell.innerHTML = `<b>${totalUnitFactoryExportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'UnitImportPrice':
            footerCell.innerHTML = `<b>${totalUnitImportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          case 'TotalImportPrice':
            footerCell.innerHTML = `<b>${totalImportPrice.toLocaleString(
              'en-US'
            )}</b>`;
            break;
          default:
            footerCell.innerHTML = '';
        }
      });
    }
  }
  //#endregion

  //#region Grid Config
  private getSelectedGridData(): any[] {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return [];
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'IsDeleted',
        name: 'Hủy yêu cầu',
        field: 'IsDeleted',
        cssClass: 'text-center',
        width: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        sortable: true,
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
        id: 'IsCheckPrice',
        name: 'Check giá',
        field: 'IsCheckPrice',
        cssClass: 'text-center',
        width: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        sortable: true,
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
        id: 'TT',
        name: 'TT',
        field: 'TT',
        width: 80,
        sortable: true,
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
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: this.columnWidth,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<span style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: this.columnWidth,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<span style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</span>`;
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.2em; max-height: 3.6em;">${value}</div>`;
        },
      },
      {
        id: 'Model',
        name: 'Thông số kỹ thuật',
        field: 'Model',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<div style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.2em; max-height: 3.6em;">${value}</div>`;
        },
      },
      {
        id: 'Manufacturer',
        name: 'Hãng',
        field: 'Manufacturer',
        width: 80,
        sortable: true,
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
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'Unit',
        name: 'Đơn vị',
        field: 'Unit',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'StatusRequestText',
        name: 'Trạng thái',
        field: 'StatusRequestText',
        width: this.columnWidth,
        sortable: true,
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
        id: 'FullName',
        name: 'Người yêu cầu',
        field: 'FullName',
        width: this.columnWidth,
        sortable: true,
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
        id: 'FullNameSale',
        name: 'Sale phụ trách',
        field: 'FullNameSale',
        width: this.columnWidth,
        sortable: true,
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
        id: 'QuoteEmployee',
        name: 'NV báo giá',
        field: 'QuoteEmployee',
        width: this.columnWidth,
        sortable: true,
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
        id: 'DateRequest',
        name: 'Ngày yêu cầu',
        field: 'DateRequest',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Deadline',
        name: 'Deadline',
        field: 'Deadline',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },

      {
        id: 'DatePriceQuote',
        name: 'Ngày báo giá',
        field: 'DatePriceQuote',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        cssClass: 'text-center',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CurrencyRate',
        name: 'Tỷ giá',
        field: 'CurrencyRate',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá',
        field: 'UnitPrice',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'HistoryPrice',
        name: 'Giá lịch sử',
        cssClass: 'text-end',
        field: 'HistoryPrice',
        width: 180,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'DateHistoryPrice',
        name: 'Ngày báo giá lịch sử',
        field: 'DateHistoryPrice',
        cssClass: 'text-center',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'TotalPrice',
        name: 'Thành tiền chưa VAT',
        field: 'TotalPrice',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalPriceExchange',
        name: 'Thành tiền quy đổi (VND)',
        field: 'TotalPriceExchange',
        cssClass: 'text-end',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'VAT',
        name: '%VAT',
        cssClass: 'text-end',
        field: 'VAT',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotaMoneyVAT',
        name: 'Thành tiền có VAT',
        cssClass: 'text-end',
        field: 'TotaMoneyVAT',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp',
        field: 'NameNCC',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'TotalDayLeadTime',
        name: 'Lead Time (Ngày làm việc)',
        field: 'TotalDayLeadTime',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'DateExpected',
        name: 'Ngày dự kiến hàng về',
        field: 'DateExpected',
        width: 100,
        cssClass: 'text-center',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'NotePartlist',
        name: 'Ghi chú KT',
        field: 'NotePartlist',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SpecialCode',
        name: 'Mã đặc biệt',
        field: 'SpecialCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsImport',
        name: 'Hàng nhập khẩu',
        field: 'IsImport',
        width: 80,
        cssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        sortable: true,
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
        id: 'UnitFactoryExportPrice',
        name: 'Đơn giá xuất xưởng',
        field: 'UnitFactoryExportPrice',
        width: 180,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitImportPrice',
        name: 'Đơn giá nhập khẩu',
        field: 'UnitImportPrice',
        width: 180,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalImportPrice',
        name: 'Thành tiền nhập khẩu',
        field: 'TotalImportPrice',
        width: 180,
        cssClass: 'text-end',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'LeadTime',
        name: 'LeadTime',
        field: 'LeadTime',
        width: 80,
        sortable: true,
        cssClass: 'text-end',
        filterable: true,
        type: 'number',
        filter: { model: Filters['compoundInputText'] },
        groupTotalsFormatter: GroupTotalFormatters['sumTotalsFormatter'],
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'ReasonDeleted',
        name: 'Lý do xóa',
        field: 'ReasonDeleted',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.project-partlist-price-request-old',
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
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      frozenColumn: 9,
      enableContextMenu: true,
      contextMenu: {
        hideCloseButton: false,
        hideClearAllGrouping: false,
        hideCollapseAllGroups: false,
        hideExpandAllGroups: false,
        hideCopyCellValueCommand: false,
        hideExportCsvCommand: false,
        hideExportExcelCommand: false,
        hideExportTextDelimitedCommand: true,
        commandItems: [
          {
            title: 'Chọn tất cả dòng trong group',
            iconCssClass: 'fa-solid fa-circle-check text-success',
            disabled: false,
            command: 'select-group',
            positionOrder: 60,
            action: (_e: any, args: any) => {
              const item = args.dataContext;
              if (!item) return;

              // Lấy ProjectCode của dòng được click
              const projectCode = item.ProjectCode;
              if (!projectCode) return;

              // Lấy tất cả items trong cùng group
              const allItems = this.angularGrid.dataView.getItems();
              const groupRows: number[] = [];

              allItems.forEach((dataItem: any) => {
                if (
                  dataItem &&
                  !dataItem.__group &&
                  !dataItem.__groupTotals &&
                  dataItem.ProjectCode === projectCode
                ) {
                  const rowIndex = this.angularGrid.dataView.getRowById(
                    dataItem.id
                  );
                  if (rowIndex !== undefined && rowIndex >= 0) {
                    groupRows.push(rowIndex);
                  }
                }
              });

              // Chọn tất cả dòng trong group
              if (groupRows.length > 0) {
                const selectedRows =
                  this.angularGrid.slickGrid.getSelectedRows();
                const newSelection = [
                  ...new Set([...selectedRows, ...groupRows]),
                ];
                this.angularGrid.slickGrid.setSelectedRows(newSelection);
              }
            },
          },
          {
            title: 'Bỏ chọn tất cả dòng trong group',
            iconCssClass: 'fa-solid fa-circle-xmark text-danger',
            disabled: false,
            command: 'deselect-group',
            positionOrder: 61,
            action: (_e: any, args: any) => {
              const item = args.dataContext;
              if (!item) return;

              // Lấy ProjectCode của dòng được click
              const projectCode = item.ProjectCode;
              if (!projectCode) return;

              // Lấy tất cả items trong cùng group
              const allItems = this.angularGrid.dataView.getItems();
              const groupRows: number[] = [];

              allItems.forEach((dataItem: any) => {
                if (
                  dataItem &&
                  !dataItem.__group &&
                  !dataItem.__groupTotals &&
                  dataItem.ProjectCode === projectCode
                ) {
                  const rowIndex = this.angularGrid.dataView.getRowById(
                    dataItem.id
                  );
                  if (rowIndex !== undefined && rowIndex >= 0) {
                    groupRows.push(rowIndex);
                  }
                }
              });

              // Bỏ chọn tất cả dòng trong group
              if (groupRows.length > 0) {
                const selectedRows =
                  this.angularGrid.slickGrid.getSelectedRows();
                const newSelection = selectedRows.filter(
                  (row) => !groupRows.includes(row)
                );
                this.angularGrid.slickGrid.setSelectedRows(newSelection);
              }
            },
          },
        ],
      },
    };
  }

  private applyDistinctFilters(): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];

    // Nếu data rỗng, xóa hết filter collections
    if (!data || data.length === 0) {
      const columns = angularGrid.slickGrid.getColumns();
      if (columns) {
        columns.forEach((column: any) => {
          if (
            column.filter &&
            column.filter.model === Filters['multipleSelect']
          ) {
            column.filter.collection = [];
          }
        });
      }

      if (this.columnDefinitionsMaster) {
        this.columnDefinitionsMaster.forEach((colDef: any) => {
          if (
            colDef.filter &&
            colDef.filter.model === Filters['multipleSelect']
          ) {
            colDef.filter.collection = [];
          }
        });
      }

      const updatedColumns = angularGrid.slickGrid.getColumns();
      angularGrid.slickGrid.setColumns(updatedColumns);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
      return;
    }

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      let hasBlank = false;

      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') {
          hasBlank = true;
          return;
        }
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });

      const result = Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      // Thêm option "(Trống)" nếu có giá trị blank
      if (hasBlank) {
        result.unshift({ value: '', label: '(Trống)' });
      }

      return result;
    };

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];
    const booleanFields = new Set(['IsDeleted', 'IsCheckPrice', 'IsImport']);

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitionsMaster) {
      this.columnDefinitionsMaster.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
  //#endregion

  //#region Check giá
  CheckPrice(isCheckPrice: boolean): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const isCheckText = isCheckPrice ? 'Check giá' : 'Huỷ check giá';
    const selectedRows = this.getSelectedGridData();

    if (selectedRows.length <= 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${isCheckText}!`
      );
      return;
    }

    // Message xác nhận với thông báo đặc biệt khi check giá
    const message = isCheckPrice
      ? '\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!'
      : '';

    // Xác nhận thao tác
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isCheckText} danh sách sản phẩm đã chọn không?${message}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lọc các dòng hợp lệ ở frontend (validate trước khi gửi lên backend)
        const updateData: any[] = [];

        selectedRows.forEach((rowData) => {
          const id = Number(rowData['ID']);

          if (id <= 0) return; // Bỏ qua ID không hợp lệ

          // Validate ở frontend: Khi check giá, chỉ cho phép check nếu chưa có QuoteEmployeeID hoặc QuoteEmployeeID là của mình
          const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
          const currentEmployeeID = this.appUserService.employeeID || 0;

          // Nếu đã có người khác check rồi thì bỏ qua (giống WinForm và backend logic)
          if (quoteEmployeeID > 0 && quoteEmployeeID !== currentEmployeeID) {
            return;
          }

          if (isCheckPrice) {
          } else {
            const statusRequest = Number(rowData['StatusRequest'] || 0);

            if (statusRequest === 2) {
              return;
            }

            if (statusRequest !== 1) {
              return;
            }
          }

          updateData.push({
            ID: id,
            IsCheckPrice: isCheckPrice,
            QuoteEmployeeID: this.appUserService.employeeID,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toJSDate(),
          });
        });

        if (updateData.length <= 0) {
          this.notification.warning(
            'Thông báo',
            `Bạn không có quyền ${isCheckText} danh sách sản phẩm đã chọn! Chỉ NV báo giá mới được ${isCheckText}`
          );
          return;
        }

        this.projectPartlistPriceRequestService
          .checkPrice(updateData)
          .subscribe({
            next: (response: any) => {
              if (response?.status === 1 || response?.success) {
                this.notification.success(
                  'Thông báo',
                  `${isCheckText} thành công!`
                );
                this.onSearch(); // Reload data
              } else {
                this.notification.warning(
                  'Thông báo',
                  `${isCheckText} thất bại!`
                );
              }
            },
            error: (error) => {
              console.error('Error checking price:', error);
              this.notification.error(
                'Lỗi',
                error?.error?.message || `Có lỗi xảy ra khi ${isCheckText}!`
              );
            },
          });
      },
    });
  }
  //#endregion

  //#region Báo giá
  QuotePrice(status: number = 2): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    // Map trạng thái
    const STATUS_TEXT: { [key: number]: string } = {
      0: 'Hủy hoàn thành',
      1: 'Hủy báo giá',
      2: 'Báo giá',
      3: 'Hoàn thành',
    };

    const statusText = STATUS_TEXT[status] || '';
    const selectedRows = this.getSelectedGridData();

    // Validate chọn dòng
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${statusText}!`
      );
      return;
    }

    // Confirm trước khi update
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Validate dữ liệu trước (chỉ validate khi status = 0 hoặc 2, không validate khi status = 1 hoặc 3)
        const shouldValidate = status !== 1 && status !== 0; // Chỉ validate khi Báo giá (2) hoặc Hủy hoàn thành (0)

        if (shouldValidate) {
          const isAdmin = this.appUserService.isAdmin || false;
          const currentEmployeeID = this.appUserService.employeeID || 0;

          for (const rowData of selectedRows) {
            const id = Number(rowData['ID']);
            if (id <= 0) continue;

            // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
            const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
            if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
              continue; // Bỏ qua sản phẩm không phải của mình khi validate
            }

            const productCode = rowData['ProductCode'] || '';
            const currencyId = Number(rowData['CurrencyID'] || 0);
            const currencyRate = Number(rowData['CurrencyRate'] || 0);
            const unitPrice = Number(rowData['UnitPrice'] || 0);
            const supplierSaleId = Number(rowData['SupplierSaleID'] || 0);

            // Lấy currency code để hiển thị trong thông báo lỗi
            let currencyCode = '';
            if (currencyId > 0 && this.currencyData) {
              const currency = this.currencyData.find(
                (c: any) => c.ID === currencyId
              );
              currencyCode = currency ? currency.Code : '';
            }

            if (currencyId <= 0) {
              this.notification.warning(
                'Thông báo',
                `Vui lòng chọn sửa và chọn Loại tiền mã sản phẩm [${productCode}]!`
              );
              return;
            }

            if (currencyRate <= 0) {
              this.notification.warning(
                'Thông báo',
                `Tỷ giá của [${currencyCode}] phải > 0.\nVui lòng kiểm tra lại Ngày hết hạn!`
              );
              return;
            }

            if (unitPrice <= 0) {
              this.notification.warning(
                'Thông báo',
                `Vui lòng chọn sửa và nhập Đơn giá mã sản phẩm [${productCode}]!`
              );
              return;
            }

            if (supplierSaleId <= 0) {
              this.notification.warning(
                'Thông báo',
                `Vui lòng chọn sửa và chọn Nhà cung cấp mã sản phẩm [${productCode}]!`
              );
              return;
            }
          }
        }

        // Xử lý dữ liệu update (chỉ update những dòng của mình hoặc admin)
        const updateData: any[] = [];
        const isAdmin = this.appUserService.isAdmin || false;
        const currentEmployeeID = this.appUserService.employeeID || 0;

        // Helper function để chuyển đổi date sang ISO string hoặc null
        const formatDate = (value: any): string | null => {
          if (!value) return null;
          if (value instanceof Date) {
            return DateTime.fromJSDate(value).toISO();
          }
          if (typeof value === 'string') {
            const dt = DateTime.fromISO(value);
            if (dt.isValid) return dt.toISO();
            // Thử các format khác
            const formats = [
              'yyyy/MM/dd',
              'dd/MM/yyyy',
              'yyyy-MM-dd',
              'MM/dd/yyyy',
            ];
            for (const format of formats) {
              const dt2 = DateTime.fromFormat(value, format);
              if (dt2.isValid) return dt2.toISO();
            }
          }
          return null;
        };

        // Helper function để chuyển đổi số
        const toNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '')
            return null;
          const num = Number(value);
          return isNaN(num) ? null : num;
        };

        // Helper function để chuyển đổi boolean
        const toBoolean = (value: any): boolean | null => {
          if (value === null || value === undefined || value === '')
            return null;
          if (typeof value === 'boolean') return value;
          if (
            value === 1 ||
            value === '1' ||
            value === 'true' ||
            value === true
          )
            return true;
          if (
            value === 0 ||
            value === '0' ||
            value === 'false' ||
            value === false
          )
            return false;
          return null;
        };

        // Helper function để chuyển đổi string
        const toString = (value: any): string | null => {
          if (value === null || value === undefined) return null;
          const str = String(value).trim();
          return str === '' ? null : str;
        };

        for (const rowData of selectedRows) {
          // selectedRows từ getSelectedGridData đã là dữ liệu items, không phải row objects
          const id = Number(rowData['ID']);

          if (id <= 0) continue;

          // Lọc theo QuoteEmployeeID (chỉ update những sản phẩm của mình hoặc admin)
          const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
          if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
            continue; // Bỏ qua sản phẩm không phải của mình
          }

          // Tạo object với toàn bộ model ProjectPartlistPriceRequest
          const quoteData: any = {
            ID: id,
            ProjectPartListID: toNumber(rowData['ProjectPartListID']),
            EmployeeID: toNumber(rowData['EmployeeID']),
            ProductCode: toString(rowData['ProductCode']),
            ProductName: toString(rowData['ProductName']),
            StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
            DateRequest: formatDate(rowData['DateRequest']),
            Deadline: formatDate(rowData['Deadline']),
            Quantity: toNumber(rowData['Quantity']),
            UnitPrice: toNumber(rowData['UnitPrice']),
            TotalPrice: toNumber(rowData['TotalPrice']),
            Unit: toString(
              rowData['Unit'] || rowData['UnitName'] || rowData['UnitCount']
            ),
            SupplierSaleID: toNumber(rowData['SupplierSaleID']),
            Note: toString(rowData['Note']),
            CreatedBy: toString(rowData['CreatedBy']),
            CreatedDate: formatDate(rowData['CreatedDate']),
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toISO(),
            // Xử lý DatePriceQuote theo logic WinForm
            DatePriceQuote:
              status === 1
                ? null
                : status === 2
                ? DateTime.local().toISO()
                : formatDate(rowData['DatePriceQuote']),
            TotalPriceExchange: toNumber(rowData['TotalPriceExchange']),
            CurrencyRate: toNumber(rowData['CurrencyRate']),
            CurrencyID: toNumber(rowData['CurrencyID']),
            HistoryPrice: toNumber(rowData['HistoryPrice']),
            LeadTime: toString(rowData['LeadTime']),
            UnitFactoryExportPrice: toNumber(rowData['UnitFactoryExportPrice']),
            UnitImportPrice: toNumber(rowData['UnitImportPrice']),
            TotalImportPrice: toNumber(rowData['TotalImportPrice']),
            IsImport: toBoolean(rowData['IsImport']),
            IsDeleted: toBoolean(rowData['IsDeleted']),
            QuoteEmployeeID: !isAdmin
              ? currentEmployeeID
              : toNumber(rowData['QuoteEmployeeID']),
            IsCheckPrice: toBoolean(rowData['IsCheckPrice']),
            VAT: toNumber(rowData['VAT']),
            TotaMoneyVAT: toNumber(rowData['TotaMoneyVAT']),
            TotalDayLeadTime: toNumber(rowData['TotalDayLeadTime']),
            DateExpected: formatDate(rowData['DateExpected']),
            POKHDetailID: toNumber(rowData['POKHDetailID']),
            IsCommercialProduct: toBoolean(rowData['IsCommercialProduct']),
            Maker: toString(rowData['Maker'] || rowData['Manufacturer']),
            IsJobRequirement: toBoolean(rowData['IsJobRequirement']),
            NoteHR: toString(rowData['NoteHR']),
            JobRequirementID: toNumber(rowData['JobRequirementID']),
            IsRequestBuy: toBoolean(rowData['IsRequestBuy']),
            ProjectPartlistPriceRequestTypeID: toNumber(
              rowData['ProjectPartlistPriceRequestTypeID']
            ),
            ReasonUnPrice: toString(rowData['ReasonUnPrice']),
            EmployeeIDUnPrice: toNumber(rowData['EmployeeIDUnPrice']),
          };

          // Chỉ set QuoteEmployeeID khi KHÔNG phải admin (giống WinForm)
          if (!isAdmin) {
            quoteData.QuoteEmployeeID = currentEmployeeID;
          }

          // Xử lý DatePriceQuote theo logic WinForm
          if (status === 1) {
            // Hủy báo giá
            quoteData.DatePriceQuote = null;
          } else if (status === 2) {
            // Báo giá
            quoteData.DatePriceQuote = new Date();
          }
          // Nếu status khác (0, 3) thì không set DatePriceQuote, backend sẽ giữ nguyên

          updateData.push(quoteData);
        }

        // Kiểm tra nếu không có dòng nào hợp lệ
        if (updateData.length === 0) {
          this.notification.warning(
            'Thông báo',
            `Bạn không có quyền ${statusText} danh sách sản phẩm đã chọn! Chỉ NV mua mới được ${statusText}`
          );
          return;
        }
        // Gọi API quote-price
        this.projectPartlistPriceRequestService
          .quotePrice(updateData)
          .subscribe({
            next: (response: any) => {
              if (response?.status === 1) {
                this.notification.success(
                  'Thông báo',
                  `Đã ${statusText.toLowerCase()} các sản phẩm được chọn!`
                );

                // Nếu là báo giá (status = 2), gọi API send-mail với data của các dòng đã chọn
                if (status === 2) {
                  // Lấy data đầy đủ từ các dòng đã chọn và map sang format MailItemPriceRequestDTO
                  // selectedRows từ getSelectedGridData() đã là dữ liệu items trực tiếp
                  const mailData = selectedRows.map((rowData) => {
                    // Map data sang format MailItemPriceRequestDTO
                    return {
                      EmployeeID: Number(rowData['EmployeeID'] || 0),
                      QuoteEmployee: String(
                        rowData['QuoteEmployee'] ||
                          rowData['FullNameQuote'] ||
                          ''
                      ),
                      ProjectCode: String(rowData['ProjectCode'] || ''),
                      ProductCode: String(rowData['ProductCode'] || ''),
                      ProductName: String(rowData['ProductName'] || ''),
                      Manufacturer: String(
                        rowData['Manufacturer'] || rowData['Maker'] || ''
                      ),
                      Quantity: Number(rowData['Quantity'] || 0),
                      Unit: String(
                        rowData['Unit'] ||
                          rowData['UnitName'] ||
                          rowData['UnitCount'] ||
                          ''
                      ),
                      DateRequest: rowData['DateRequest']
                        ? (() => {
                            const date = rowData['DateRequest'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      Deadline: rowData['Deadline']
                        ? (() => {
                            const date = rowData['Deadline'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      DatePriceQuote: rowData['DatePriceQuote']
                        ? (() => {
                            const date = rowData['DatePriceQuote'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      CurrencyID: Number(rowData['CurrencyID'] || 0),
                      UnitPrice: Number(rowData['UnitPrice'] || 0),
                      TotalPrice: Number(rowData['TotalPrice'] || 0),
                      TotalPriceExchange: Number(
                        rowData['TotalPriceExchange'] || 0
                      ),
                    };
                  });

                  // Gọi API send-mail
                  this.projectPartlistPriceRequestService
                    .sendMail(mailData)
                    .subscribe({
                      next: (mailResponse: any) => {
                        // Không cần hiển thị thông báo riêng cho send-mail, chỉ log nếu cần
                        if (mailResponse?.status !== 1) {
                          console.warn('Send mail response:', mailResponse);
                        }
                      },
                      error: (mailError) => {
                        // Log lỗi nhưng không hiển thị thông báo lỗi để không làm gián đoạn flow
                        console.error('Error sending mail:', mailError);
                      },
                    });
                }

                this.onSearch(); // Reload data
              } else {
                this.notification.warning(
                  'Thông báo',
                  response?.message || `${statusText} thất bại!`
                );
              }
            },
            error: (error) => {
              console.error('Error quoting price:', error);
              this.notification.error(
                'Lỗi',
                error?.error?.message || `Có lỗi xảy ra khi ${statusText}!`
              );
            },
          });
      },
    });
  }
  //#endregion

  //#region Tải xuống
  DownloadFile() {
    const selectedRows = this.getSelectedGridData();
    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn 1 sản phẩm muốn tải!'
      );
      return;
    }

    selectedRows.forEach((rowData: any) => {
      const projectId = rowData['ProjectID'];
      const partListId = rowData['ProjectPartListID'];
      const productCode = rowData['ProductCode'];
      if (!productCode) return;

      const requestPayload = {
        projectId,
        partListId,
        productCode,
      };

      this.projectPartlistPriceRequestService
        .downloadFile(requestPayload)
        .subscribe({
          next: (response: any) => {
            if (response?.status === 0) {
              this.notification.warning(
                'Thông báo',
                response.message || 'Không thể tải file!'
              );
              return;
            }

            const fileUrl = response?.data || response;
            if (!fileUrl || typeof fileUrl !== 'string') {
              this.notification.warning(
                'Thông báo',
                'Không tìm thấy đường dẫn file!'
              );
              return;
            }

            // Mở URL trong tab mới
            window.open(fileUrl, '_blank');
          },
          error: (error) => {
            const errMsg =
              error?.error?.message || error?.message || 'Đã xảy ra lỗi!';
            this.notification.warning(NOTIFICATION_TITLE.warning, errMsg);
          },
        });
    });
  }
  //#endregion

  //#region Thêm nhà cung cấp
  OpenAddSupplierModal(): void {
    const modalRef = this.ngbModal.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0; // 0 = thêm mới
    modalRef.result.finally(() => {});
  }
  //#endregion

  //#region Xuất theo dòng được chọn
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }

  private formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }

  private shouldCalculateSum(column: Column): boolean {
    // Các cột có groupTotalsFormatter cần tính tổng
    if (column.groupTotalsFormatter) {
      return true;
    }

    // Các cột số cần tính tổng dựa trên field name
    const sumFields = [
      'Quantity',
      'UnitPrice',
      'HistoryPrice',
      'TotalPrice',
      'TotalPriceExchange',
      'VAT',
      'TotaMoneyVAT',
      'TotalDayLeadTime',
      'UnitFactoryExportPrice',
      'UnitImportPrice',
      'TotalImportPrice',
    ];

    return sumFields.includes(column.field || '');
  }

  async ExportToExcelAdvanced() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;
    this.isLoading = true;
    const workbook = new ExcelJS.Workbook();
    const projectTypeName = 'Danh sách báo giá';
    const sanitizedName = projectTypeName
      .replace(/[\\/?*[\]:]/g, '')
      .substring(0, 31);
    const worksheet = workbook.addWorksheet(sanitizedName);

    // Lấy dữ liệu đã chọn
    const selectedData = this.getSelectedGridData();

    if (selectedData.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn dòng để xuất Excel.');
      this.isLoading = false;
      return;
    }

    // Lấy tất cả dữ liệu từ grid để có thể nhóm theo ProjectFullName
    const items: any[] = [];
    for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
      items.push(angularGrid.dataView.getItem(i));
    }

    let columns = this.columnDefinitionsMaster;
    columns = columns.filter((col: Column) => !col.hidden);

    // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
    const supplierIndex = columns.findIndex(
      (col: any) => col.field === 'SupplierSaleID'
    );
    const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
    if (supplierIndex >= 0 && !codeNCCExists) {
      const codeNCCColumn = {
        title: 'Mã NCC',
        field: 'CodeNCC',
        hozAlign: 'left',
        headerHozAlign: 'center',
        headerSort: false,
        width: 100,
      } as any;
      columns.splice(supplierIndex, 0, codeNCCColumn);
    }

    // Thêm headers
    const headerRow = worksheet.addRow(
      columns.map((col: Column) => col.name || col.field)
    );
    headerRow.font = { bold: true, name: 'Tahoma' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Nhóm dữ liệu đã chọn theo ProjectFullName
    const grouped = selectedData.reduce((acc: any, item: any) => {
      const groupKey = item.ProjectFullName || 'Không rõ dự án';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    // Lặp qua từng group và xuất group header + dữ liệu
    for (const groupName of Object.keys(grouped)) {
      const groupRows = grouped[groupName];

      // Thêm dòng Group Header
      const groupHeaderRow = worksheet.addRow([
        `${groupName} (${groupRows.length})`,
      ]);
      groupHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFd9edf7' },
      };
      groupHeaderRow.font = { bold: true, name: 'Tahoma' };
      groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

      // Merge cells từ cột A đến cột cuối cùng
      const lastColumnLetter = this.getColumnLetter(columns.length);
      worksheet.mergeCells(
        `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
      );

      // Thêm các dòng dữ liệu trong nhóm
      groupRows.forEach((row: any) => {
        const rowData = columns.map((col: any) => {
          const value = row[col.field];

          // Xử lý null/undefined thành khoảng trống
          if (value === null || value === undefined) {
            return '';
          }

          // Xử lý object rỗng
          if (
            typeof value === 'object' &&
            value !== null &&
            Object.keys(value).length === 0
          ) {
            return '';
          }

          // Xử lý checkbox: true -> "X", false -> ""
          const fieldName = col.field || '';
          if (
            fieldName === 'IsCheckPrice' ||
            fieldName === 'IsImport' ||
            fieldName === 'IsDeleted'
          ) {
            return value === true ? 'V' : '';
          }

          // Format tiền cho các cột số tiền
          if (
            [
              'TotalPrice',
              'UnitPrice',
              'HistoryPrice',
              'TotaMoneyVAT',
              'TotalPriceExchange',
              'UnitFactoryExportPrice',
              'UnitImportPrice',
              'TotalImportPrice',
              'Quantity',
              'TotalMoneyVAT',
              'CurrencyRate',
            ].includes(col.field)
          ) {
            const numValue = Number(value) || 0;
            return numValue === 0
              ? 0
              : new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(numValue);
          }

          // Format date columns thành dd/MM/yyyy
          if (
            [
              'DatePriceQuote',
              'DateRequest',
              'Deadline',
              'DateExpected',
              'DateHistoryPrice',
              'LeadTime',
            ].includes(fieldName)
          ) {
            if (!value) return '';
            // Xử lý nhiều kiểu dữ liệu date
            let dateValue: DateTime | null = null;
            if (value instanceof Date) {
              dateValue = DateTime.fromJSDate(value);
            } else if (typeof value === 'string') {
              dateValue = DateTime.fromISO(value);
              if (!dateValue.isValid) {
                // Thử các format khác
                const formats = [
                  'yyyy/MM/dd',
                  'dd/MM/yyyy',
                  'yyyy-MM-dd',
                  'MM/dd/yyyy',
                ];
                for (const format of formats) {
                  dateValue = DateTime.fromFormat(value, format);
                  if (dateValue.isValid) break;
                }
              }
            }
            return dateValue && dateValue.isValid
              ? dateValue.toFormat('dd/MM/yyyy')
              : '';
          }

          // Format VAT và TotalDayLeadTime theo en-US
          if (fieldName === 'VAT' || fieldName === 'TotalDayLeadTime') {
            if (value === null || value === undefined || value === '')
              return '';
            const numValue = Number(value) || 0;
            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
            }).format(numValue);
          }

          // Xử lý trường select với lookup
          if (col.field === 'CurrencyCode') {
            return value;
          }

          if (col.field === 'NameNCC') {
            return value;
          }

          if (col.field === 'CodeNCC') {
            return value;
          }

          // Xử lý chuỗi rỗng
          if (value === '') {
            return '';
          }

          // Return giá trị bình thường
          return value;
        });
        worksheet.addRow(rowData);
      });

      // Thêm dòng trống giữa các group
      worksheet.addRow([]);
    }

    // Footer tổng cho toàn bảng
    const totalFooterRowData = columns.map((col: Column) => {
      // Kiểm tra xem cột có cần tính tổng không
      if (!this.shouldCalculateSum(col)) return '';

      const values = selectedData.map((r: any) => Number(r[col.field]) || 0);
      const result = values.reduce((a: number, b: number) => a + b, 0);

      // Format tiền cho các cột tiền
      if (
        [
          'TotalPrice',
          'UnitPrice',
          'HistoryPrice',
          'TotaMoneyVAT',
          'TotalPriceExchange',
          'UnitFactoryExportPrice',
          'UnitImportPrice',
          'TotalImportPrice',
        ].includes(col.field || '') &&
        typeof result === 'number'
      ) {
        return result === 0
          ? 0
          : new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(result);
      }

      // Format số cho các cột số khác
      if (
        col.field === 'Quantity' ||
        col.field === 'TotalDayLeadTime' ||
        col.field === 'VAT'
      ) {
        return this.formatNumberEnUS(result, col.field === 'Quantity' ? 2 : 0);
      }

      return result;
    });

    // Thêm label "Tổng cộng" vào cột đầu tiên
    if (totalFooterRowData.some((val: any) => val !== '')) {
      totalFooterRowData[0] = 'Tổng cộng';
      const totalFooterRow = worksheet.addRow(totalFooterRowData);
      totalFooterRow.font = { bold: true, name: 'Tahoma' };
      totalFooterRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      totalFooterRow.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      };
    }

    // Auto-fit column width theo nội dung thực tế
    worksheet.columns.forEach((column: any, colIndex: number) => {
      let maxLength = 0;

      // Lấy header length
      const headerCell = worksheet.getRow(1).getCell(colIndex + 1);
      if (headerCell && headerCell.value) {
        maxLength = headerCell.value.toString().length;
      }

      // Duyệt qua tất cả các cell trong cột để tìm độ dài lớn nhất
      column.eachCell?.({ includeEmpty: true }, (cell: any) => {
        if (cell && cell.value) {
          const cellValue = cell.value.toString();
          const cellLength = cellValue.length;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });

      // Set width với min 10, max 50
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Thêm border cho tất cả cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Đặt font Tahoma cho tất cả các cell
        if (!cell.font) {
          cell.font = { name: 'Tahoma' };
        } else {
          cell.font = { ...cell.font, name: 'Tahoma' };
        }

        // Căn giữa cho header và wrapText cho tất cả các cell
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
    link.download = `price-request-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    this.isLoading = false;
  }
  //#endregion

  //#region Xuất theo trang hiện tại
  async ExportToExcelTab() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) {
      this.notification.warning('Thông báo', 'Không tìm thấy bảng dữ liệu.');
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    // Lấy dữ liệu từ Map (local pagination) thay vì gọi API
    const rawData = this.dataMaster || [];

    if (rawData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      this.isLoading = false;
      return;
    }

    try {
      let columns = this.columnDefinitionsMaster || [];
      columns = columns.filter((col: any) => col.hidden !== true);

      // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
      const supplierIndex = columns.findIndex(
        (col: any) => col.field === 'SupplierSaleID'
      );
      const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
      if (supplierIndex >= 0 && !codeNCCExists) {
        const codeNCCColumn = {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
        } as any;
        columns.splice(supplierIndex, 0, codeNCCColumn);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo giá');

      // Thêm header
      const headerRow = worksheet.addRow(
        columns.map((col: Column) => col.name || col.field)
      );
      headerRow.font = { bold: true, name: 'Tahoma' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Nhóm dữ liệu theo ProjectFullName
      const grouped = rawData.reduce((acc: any, item: any) => {
        const groupKey = item.ProjectFullName || 'Không rõ dự án';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {});

      for (const groupName of Object.keys(grouped)) {
        const groupRows = grouped[groupName];

        // Thêm dòng Group Header
        const groupHeaderRow = worksheet.addRow([
          `${groupName} (${groupRows.length})`,
        ]);
        groupHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFd9edf7' },
        };
        groupHeaderRow.font = { bold: true, name: 'Tahoma' };
        groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

        // Merge cells từ cột A đến cột cuối cùng
        const lastColumnLetter = this.getColumnLetter(columns.length);
        worksheet.mergeCells(
          `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
        );

        // Thêm các dòng dữ liệu trong nhóm
        groupRows.forEach((row: any) => {
          const rowData = columns.map((col: any) => {
            const value = row[col.field];

            // Xử lý null/undefined thành khoảng trống
            if (value === null || value === undefined) {
              return '';
            }

            // Xử lý object rỗng
            if (
              typeof value === 'object' &&
              value !== null &&
              Object.keys(value).length === 0
            ) {
              return '';
            }

            // Xử lý checkbox: true -> "X", false -> ""
            const fieldName = col.field || '';
            if (
              fieldName === 'IsCheckPrice' ||
              fieldName === 'IsImport' ||
              fieldName === 'IsDeleted'
            ) {
              return value === true ? 'V' : '';
            }

            // Format tiền cho các cột số tiền
            if (
              [
                'TotalPrice',
                'UnitPrice',
                'HistoryPrice',
                'TotaMoneyVAT',
                'TotalPriceExchange',
                'UnitFactoryExportPrice',
                'UnitImportPrice',
                'TotalImportPrice',
                'Quantity',
                'TotalMoneyVAT',
                'CurrencyRate',
              ].includes(col.field)
            ) {
              const numValue = Number(value) || 0;
              return numValue === 0
                ? 0
                : new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(numValue);
            }

            // Format date columns thành dd/MM/yyyy
            if (
              [
                'DatePriceQuote',
                'DateRequest',
                'Deadline',
                'DateExpected',
                'DateHistoryPrice',
                'LeadTime',
              ].includes(fieldName)
            ) {
              if (!value) return '';
              // Xử lý nhiều kiểu dữ liệu date
              let dateValue: DateTime | null = null;
              if (value instanceof Date) {
                dateValue = DateTime.fromJSDate(value);
              } else if (typeof value === 'string') {
                dateValue = DateTime.fromISO(value);
                if (!dateValue.isValid) {
                  // Thử các format khác
                  const formats = [
                    'yyyy/MM/dd',
                    'dd/MM/yyyy',
                    'yyyy-MM-dd',
                    'MM/dd/yyyy',
                  ];
                  for (const format of formats) {
                    dateValue = DateTime.fromFormat(value, format);
                    if (dateValue.isValid) break;
                  }
                }
              }
              return dateValue && dateValue.isValid
                ? dateValue.toFormat('dd/MM/yyyy')
                : '';
            }

            // Format VAT và TotalDayLeadTime theo en-US
            if (fieldName === 'VAT' || fieldName === 'TotalDayLeadTime') {
              if (value === null || value === undefined || value === '')
                return '';
              const numValue = Number(value) || 0;
              return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
              }).format(numValue);
            }

            // Xử lý trường select với lookup
            if (col.field === 'CurrencyCode') {
              return value;
            }

            if (col.field === 'NameNCC') {
              return value;
            }

            if (col.field === 'CodeNCC') {
              return value;
            }

            // Xử lý chuỗi rỗng
            if (value === '') {
              return '';
            }

            // Return giá trị bình thường
            return value;
          });
          worksheet.addRow(rowData);
        });

        // Thêm dòng trống giữa các group
        worksheet.addRow([]);
      }

      // Footer tổng cho toàn bảng
      const totalFooterRowData = columns.map((col: Column) => {
        // Kiểm tra xem cột có cần tính tổng không
        if (!this.shouldCalculateSum(col)) return '';

        const values = rawData.map((r: any) => Number(r[col.field]) || 0);
        const result = values.reduce((a: number, b: number) => a + b, 0);

        // Format tiền cho các cột tiền
        if (
          [
            'TotalPrice',
            'UnitPrice',
            'HistoryPrice',
            'TotaMoneyVAT',
            'TotalPriceExchange',
            'UnitFactoryExportPrice',
            'UnitImportPrice',
            'TotalImportPrice',
          ].includes(col.field || '') &&
          typeof result === 'number'
        ) {
          return result === 0
            ? 0
            : new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(result);
        }

        // Format số cho các cột số khác
        if (
          col.field === 'Quantity' ||
          col.field === 'TotalDayLeadTime' ||
          col.field === 'VAT'
        ) {
          return this.formatNumberEnUS(
            result,
            col.field === 'Quantity' ? 2 : 0
          );
        }

        return result;
      });

      // Thêm label "Tổng cộng" vào cột đầu tiên
      if (totalFooterRowData.some((val: any) => val !== '')) {
        totalFooterRowData[0] = 'Tổng cộng';
        const totalFooterRow = worksheet.addRow(totalFooterRowData);
        totalFooterRow.font = { bold: true, name: 'Tahoma' };
        totalFooterRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        totalFooterRow.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
      }

      // Auto-fit column width theo nội dung thực tế
      worksheet.columns.forEach((column: any, colIndex: number) => {
        let maxLength = 0;

        // Lấy header length
        const headerCell = worksheet.getRow(1).getCell(colIndex + 1);
        if (headerCell && headerCell.value) {
          maxLength = headerCell.value.toString().length;
        }

        // Duyệt qua tất cả các cell trong cột để tìm độ dài lớn nhất
        column.eachCell?.({ includeEmpty: true }, (cell: any) => {
          if (cell && cell.value) {
            const cellValue = cell.value.toString();
            const cellLength = cellValue.length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });

        // Set width với min 10, max 50
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Viền ô
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Đặt font Tahoma cho tất cả các cell
          if (!cell.font) {
            cell.font = { name: 'Tahoma' };
          } else {
            cell.font = { ...cell.font, name: 'Tahoma' };
          }

          // WrapText cho tất cả các cell
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

      // Tạo & tải file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `price-request-full-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Đã xảy ra lỗi khi xuất Excel. Vui lòng thử lại sau.'
      );
    }
  }
  //#endregion

  //#region Xóa
  OnDeleteClick() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để xóa.'
      );
      return;
    }

    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    let data = [];
    for (const rowData of selectedRows) {
      const id = Number(rowData['ID']);
      if (id <= 0) continue;

      // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình khi validate
      }
      data.push(rowData);
    }

    if (data.length === 0) {
      this.notification.info(
        'Thông báo',
        'Bạn không được xóa những sản phẩm đã chọn! Chỉ NV báo giá mới được xóa.'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: 'Bạn có chắc muốn xóa các dòng đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updateData = selectedRows.map((rowData) => {
          return {
            ID: rowData['ID'],
            IsDeleted: true,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: new Date().toISOString(),
          };
        });

        // Gửi về server qua hàm save chung
        this.SaveDataCommon(updateData, 'Xóa dữ liệu thành công');
      },
    });
  }
  private SaveDataCommon(
    data: any[],
    successMessage: string = 'Dữ liệu đã được lưu.',
    onSuccessCallback?: () => void
  ): void {
    // Đảm bảo data là array
    if (!Array.isArray(data)) {
      console.error('SaveDataCommon: data không phải là array', data);
      this.notification.error('Thông báo', 'Dữ liệu không hợp lệ.');
      return;
    }

    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    console.log('SaveDataCommon: Gửi dữ liệu', {
      projectPartlistPriceRequest: data,
    });

    this.projectPartlistPriceRequestService.saveChangedData(data).subscribe({
      next: (response) => {
        if ((response as any).status === 1) {
          this.onSearch();
          this.notification.success(
            'Thông báo',
            (response as any).message || successMessage
          );
          // Gọi callback nếu có
          if (onSuccessCallback) {
            onSuccessCallback();
          }
        } else {
          this.notification.success(
            'Thông báo',
            (response as any).message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error.message || 'Lỗi khi lưu dữ liệu.'
        );
        // Swal.fire('Thông báo', 'Không thể lưu dữ liệu.', 'error');
      },
    });
  }
  //#endregion

  //#region sửa thông tin
  onEdit() {
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();

    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => this.angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn sản phẩm cần sửa.');
      return;
    }
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    let data = [];
    for (const rowData of selectedRows) {
      const id = Number(rowData['ID']);
      if (id <= 0) continue;

      // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình khi validate
      }
      data.push(rowData);
    }

    if (data.length === 0) {
      this.notification.info(
        'Thông báo',
        'Bạn không được sửa những sản phẩm đã chọn! Chỉ NV báo giá mới được sửa.'
      );
      return;
    }

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestOldDetailComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        size: 'xl',
      }
    );

    modalRef.componentInstance.dataDetail = data;
    // Reload table after modal closes
    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  // Helper function để chuyển đổi Date sang format yyyy-MM-dd cho input date
  formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function để chuyển đổi từ yyyy-MM-dd sang yyyy/MM/dd cho API
  formatDateForAPI(dateString: string): string {
    if (!dateString) return '';
    return dateString.replace(/-/g, '/');
  }
  //#endregion
}
