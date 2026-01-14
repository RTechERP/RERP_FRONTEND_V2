import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
  Injector,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  ViewEncapsulation,
  createComponent,
  TemplateRef,
  ViewChild,
  Optional,
  Inject,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
} from 'angular-slickgrid';
import { SortDirectionNumber } from '@slickgrid-universal/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../../services/app-user.service';
import { bottom } from '@popperjs/core';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { HorizontalScrollDirective } from '../../../../directives/horizontalScroll.directive';
import { Subscription } from 'rxjs';
import { TabulatorPopupService } from '../../../../shared/components/tabulator-popup';
import { ProjectService } from '../../../project/project-service/project.service';
import { BillImportQcService } from './bill-import-qc-service/bill-import-qc-service.service';
import { BillImportQcDetailComponent } from './bill-import-qc-detail/bill-import-qc-detail.component';

@Component({
  selector: 'app-bill-import-qc',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
    NgbModalModule,
    HasPermissionDirective,
    HorizontalScrollDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-import-qc.component.html',
  styleUrl: './bill-import-qc.component.css',
})
export class BillImportQcComponent implements OnInit, AfterViewInit {
  //#region Khai báo
  showSearchBar: boolean = true;
  shouldShowSearchBar: boolean = true;
  isLoading: boolean = false;
  sizeTbDetail: any = '50%';

  QCCode: any = '';

  // Unique gridId để tránh conflict khi mở nhiều instance
  uniqueId: string = Date.now().toString();
  gridIdMaster: string = '';
  gridIdDetail: string = '';

  // Khai báo biến tìm kiếm
  dateStart: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  );
  dateEnd: Date = new Date();

  employeeRequests: any = [];
  employeeRequestId: any = 0;

  keyword: any = '';

  // Khai báo biến cho bảng
  angularGridQCMaster!: AngularGridInstance;
  angularGridQCDetail!: AngularGridInstance;

  columnDefinitionsMaster: Column[] = [];
  columnDefinitionsDetail: Column[] = [];

  gridOptionsMaster: GridOption = {};
  gridOptionsDetail: GridOption = {};

  dataMaster: any[] = [];
  dataDetail: any[] = [];

  columnWidthMaster: number = 316;
  //#endregion

  //#region Khai báo constructor
  constructor(
    private modal: NzModalService,
    private notify: NzNotificationService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private billImportQcService: BillImportQcService
  ) {}
  //#endregion

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    // Tạo unique gridId
    this.gridIdMaster = 'gridQC-' + this.uniqueId;
    this.gridIdDetail = 'gridQCDetail-' + this.uniqueId;

    this.loadLookups();
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void {
    // Đợi tab render xong rồi mới load data
    setTimeout(() => {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }, 200);
  }
  //#endregion

  //#region Sự kiện button
  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
    this.shouldShowSearchBar = this.showSearchBar;
  }

  onSearch() {
    this.isLoading = true;
    const filter = {
      dateStart: new Date(this.dateStart.setHours(0, 0, 0, 0)).toISOString(),
      dateEnd: new Date(this.dateEnd.setHours(23, 59, 59, 999)).toISOString(),
      employeeRequestId: this.employeeRequestId ?? 0,
      keyword: this.keyword?.trim() || '',
    };

    this.billImportQcService.getDataMaster(filter).subscribe({
      next: (rs) => {
        const data = rs.data || [];
        this.dataMaster = data;
        this.dataMaster = this.dataMaster.map((x, i) => ({
          ...x,
          id: x.ID,
        }));
        this.isLoading = false;

        // Update footer row with count
        setTimeout(() => {
          this.updateMasterFooterRow();
          this.applyCellHighlighting();
        }, 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || err?.message
        );
      },
    });
  }

  onCellClicked(e: Event, args: OnClickEventArgs) {
    if (args.cell !== 0) {
      const item = args.grid.getDataItem(args.row);
      this.QCCode = item.RequestImportCode;
      this.loadDetail(item.ID);
    }
  }

  loadDetail(billImportRequestId: number) {
    this.isLoading = true;
    this.billImportQcService.getDataDetail(billImportRequestId).subscribe({
      next: (rs) => {
        const data = rs.data || [];
        this.dataDetail = data;
        this.dataDetail = this.dataDetail.map((x, i) => ({
          ...x,
          id: x.ID,
        }));
        this.isLoading = false;

        // Update footer row with count
        setTimeout(() => {
          this.updateDetailFooterRow();
        }, 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || err?.message
        );
      },
    });
  }

  angularGridQCMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridQCMaster = angularGrid;
    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  angularGridDetailReady(angularGrid: AngularGridInstance) {
    this.angularGridQCDetail = angularGrid;
    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  updateMasterFooterRow() {
    if (this.angularGridQCMaster && this.angularGridQCMaster.slickGrid) {
      const totalCount = this.dataMaster.length;
      const footerData = {
        RequestImportCode: `${totalCount} yêu cầu`,
      };
      this.angularGridQCMaster.slickGrid.setFooterRowVisibility(true);

      // Set footer values for each column
      const columns = this.angularGridQCMaster.slickGrid.getColumns();
      columns.forEach((col: any) => {
        if (col.id === 'RequestImportCode') {
          this.angularGridQCMaster.slickGrid.getFooterRowColumn(
            col.id
          ).innerHTML = footerData.RequestImportCode;
        }
      });
    }
  }

  updateDetailFooterRow() {
    if (this.angularGridQCDetail && this.angularGridQCDetail.slickGrid) {
      const totalCount = this.dataDetail.length;

      // Calculate total quantity
      const totalQuantity = this.dataDetail.reduce((sum, item) => {
        return sum + (Number(item.Quantity) || 0);
      }, 0);

      const footerData = {
        ProductCode: `${totalCount} sản phẩm`,
        Quantity: `${totalQuantity.toLocaleString('vi-VN')}`,
      };
      this.angularGridQCDetail.slickGrid.setFooterRowVisibility(true);

      const columns = this.angularGridQCDetail.slickGrid.getColumns();
      columns.forEach((col: any) => {
        if (col.id === 'ProductCode') {
          this.angularGridQCDetail.slickGrid.getFooterRowColumn(
            col.id
          ).innerHTML = footerData.ProductCode;
        } else if (col.id === 'Quantity') {
          this.angularGridQCDetail.slickGrid.getFooterRowColumn(
            col.id
          ).innerHTML = footerData.Quantity;
        }
      });
    }
  }

  applyCellHighlighting() {
    if (this.angularGridQCMaster && this.angularGridQCMaster.slickGrid) {
      const hash: any = {};
      const now = new Date();

      this.dataMaster.forEach((item, index) => {
        const deadline = item.Dealine ? new Date(item.Dealine) : null;
        const status = item.Status ?? 0;

        let cssClass = '';
        if (deadline && deadline < now && status === 0) {
          // Overdue and not completed
          cssClass = 'cell-overdue';
        } else if (status === 1) {
          // Completed
          cssClass = 'cell-completed';
        }

        if (cssClass) {
          const row = this.angularGridQCMaster.dataView.getRowByItem(
            item
          ) as number;
          if (row >= 0) {
            hash[row] = { RequestImportCode: cssClass };
          }
        }
      });

      this.angularGridQCMaster.slickGrid.setCellCssStyles(
        'highlight_status',
        hash
      );
    }
  }

  loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeRequests = this.projectService.createdDataGroup(
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

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'RequestImportCode',
        name: 'Mã yêu cầu',
        field: 'RequestImportCode',
        width: this.columnWidthMaster,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'FullName',
        name: 'Người yêu cầu',
        field: 'FullName',
        width: this.columnWidthMaster,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'RequestDateQC',
        name: 'Ngày yêu cầu',
        field: 'RequestDateQC',
        width: this.columnWidthMaster,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Dealine',
        name: 'Dealine',
        field: 'Dealine',
        width: this.columnWidthMaster,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: this.columnWidthMaster,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['singleSelect'],
          collection: [
            { value: '', label: 'Tất cả' },
            { value: 'Chưa xử lý', label: 'Chưa xử lý' },
            { value: 'Đã hoàn thành', label: 'Đã hoàn thành' },
            { value: 'Không đạt', label: 'Không đạt' },
          ],
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
        },
      },
    ];

    this.columnDefinitionsDetail = [
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 70,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'LeaderFullName',
        name: 'Leader kỹ thuật',
        field: 'LeaderFullName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'EmTechFullName',
        name: 'Nhân viên kỹ thuật',
        field: 'EmTechFullName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'POKHCode',
        name: 'Số POKH',
        field: 'POKHCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'BillCode',
        name: 'Đơn mua hàng',
        field: 'BillCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },

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
        },
      },
    ];
  }

  initGridOptions() {
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
      enableAutoSizeColumns: true,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
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
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
    };
  }

  onDeleted() {
    const selectedIndexes =
      this.angularGridQCMaster.slickGrid.getSelectedRows();

    if (selectedIndexes.length <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn phiếu cần xóa!'
      );
      return;
    }

    const data = selectedIndexes
      .map((index: number) => this.angularGridQCMaster.dataView.getItem(index))
      .filter((item: any) => item);

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedIndexes.length} phiếu đã chọn không?`,
      nzOnOk: () => {
        this.billImportQcService.deletedBillImportQC(data).subscribe({
          next: (response: any) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Xóa phiếu thành công!'
            );
            this.onSearch();
          },
          error: (error: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi xóa phiếu: ' + (error?.message || error?.error?.message)
            );
          },
        });
      },
    });
  }

  onAdd() {
    const modalRef = this.modalService.open(BillImportQcDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });

    modalRef.result.then(
      (result) => {
        this.onSearch();
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onEdit() {
    const selectedIndexes =
      this.angularGridQCMaster.slickGrid.getSelectedRows();

    if (selectedIndexes.length != 1) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn 1 phiếu để chỉnh sửa!'
      );
      return;
    }

    const data = this.angularGridQCMaster.dataView.getItem(selectedIndexes[0]);
    const modalRef = this.modalService.open(BillImportQcDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });
    modalRef.componentInstance.billImportQCMaster = data;

    modalRef.result.then(
      (result) => {
        this.onSearch();
      },
      () => {
        // Modal dismissed
      }
    );
  }

  //#endregion
}
