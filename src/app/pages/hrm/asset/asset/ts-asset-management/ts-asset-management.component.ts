import { inject } from '@angular/core';
import { CommonModule, formatCurrency } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
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
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TsAssetLiquidationComponent } from './ts-asset-liquidation/ts-asset-liquidation.component';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { log } from 'ng-zorro-antd/core/logger';
import { AssetStatusService } from '../ts-asset-status/ts-asset-status-service/ts-asset-status.service';
import { UnitService } from '../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { AssetsManagementService } from './ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementFormComponent } from './ts-asset-management-form/ts-asset-management-form.component';
import { TsAssetManagementReportBorkenFormComponent } from './ts-asset-management-report-borken-form/ts-asset-management-report-borken-form.component';
import { TsAssetManagementReportLossFormComponent } from './ts-asset-management-report-loss-form/ts-asset-management-report-loss-form.component';
import { TsAssetManagementImportExcelComponent } from './ts-asset-management-import-excel/ts-asset-management-import-excel.component';
import { TsAssetProposeLiquidationFormComponent } from './ts-asset-propose-liquidation-form/ts-asset-propose-liquidation-form.component';
import { TsAssetRepairFormComponent } from './ts-asset-repair-form/ts-asset-repair-form.component';
import { TsAssetReuseFormComponent } from './ts-asset-reuse-form/ts-asset-reuse-form.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { count } from 'rxjs';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { TsAssetSourceFormComponent } from '../ts-asset-source/ts-asset-source-form/ts-asset-source-form.component';

function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
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
    NgbModalModule,
    HasPermissionDirective
  ],
  selector: 'app-ts-asset-management',
  templateUrl: './ts-asset-management.component.html',
  styleUrls: ['./ts-asset-management.component.css'],
})
export class TsAssetManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('datatableManagement', { static: false })
  datatableManagementRef!: ElementRef;

  @ViewChild('datatableEmployee', { static: false })
  datatableEmployeeRef!: ElementRef;
  constructor(
    private notification: NzNotificationService,
    private assetManagementService: AssetsManagementService,
    private assetManagementPersonalService: TsAssetManagementPersonalService,
    private assetStatusService: AssetStatusService
  ) { }
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  assetTable: Tabulator | null = null;
  assetDetailtable: Tabulator | null = null;
  assetManagementDetail: any[] = [];
  assetData: any[] = [];
  isSearchVisible: boolean = false;
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];

  department: number[] = [];

  filterText: string = '';
  selectedEmployee: any = null;
  assetDate: string = '';
  departmentData: any[] = [];
  statusData: any[] = [];
  repairData: any[] = [];
  ngOnInit() { }
  ngAfterViewInit(): void {
    this.drawTable();
    this.getAssetmanagement();
    this.drawEmployeeTable();
    this.getListEmployee();
    this.getStatus();
    this.getDepartment();
  }
  closePanel() {
    this.sizeTbDetail = '0';
  }

  getAssetmanagement() {
    const statusString =
      this.status.length > 0 ? this.status.join(',') : '0,1,2,3,4,5,6,7,8';
    const departmentString =
      this.department.length > 0
        ? this.department.join(',')
        : '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24';

    const formatDate = (date: any) => {
      return date ? DateTime.fromJSDate(date).toISODate() : '';
    };
    const request = {
      filterText: this.filterText || '',
      pageNumber: 1,
      pageSize: 10000,
      dateStart: formatDate(this.dateStart) || '2024-05-22',
      dateEnd: formatDate(this.dateEnd) || '2027-05-22',
      status: statusString,
      department: departmentString,
    };
    this.assetManagementService.getAsset(request).subscribe({
      next: (response) => {
        this.assetData = response.data?.assets || [];
        console.log(this.assetData);
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      },
    });
  }
  clearAllFilters(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.dateStart = firstDay.toISOString().split('T')[0] + 'T00:00:00';
    this.dateEnd = lastDay.toISOString().split('T')[0] + 'T23:59:59';
    this.employeeID = null;
    this.filterText = '';
    this.status = [];
    this.department = [];
    this.getAssetmanagement();
  }

  getDepartment() {
    this.assetManagementService.getDepartment().subscribe({
      next: (response: any) => {
        this.departmentData = response.data || [];
        console.log(this.departmentData);
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      },
    });
  }
  getStatus() {
    this.assetStatusService.getStatus().subscribe({
      next: (response: any) => {
        this.statusData = response.data || [];
        console.log(this.statusData);
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      },
    });
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: '',
    };
    this.assetManagementPersonalService
      .getEmployee(request)
      .subscribe((respon: any) => {
        this.emPloyeeLists = respon.employees;
        console.log(this.emPloyeeLists);
        this.employeeID = null;
        this.selectedEmployee = null;
      });
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  onFilterChange(): void {
    this.getAssetmanagement();
  }
  public drawTable(): void {
    if (!this.datatableManagementRef) {
      return;
    }

    if (this.assetTable) {
      this.assetTable.setData(this.assetData);
      return;
    }

    this.assetTable = new Tabulator(this.datatableManagementRef.nativeElement, {
      data: this.assetData,
      ...DEFAULT_TABLE_CONFIG,
      selectableRows: 1,
      paginationMode: 'local',
      // layout: "fitDataFill",
      // pagination: true,
      // selectableRows: 1,
      // height: '83vh',
      // movableColumns: true,
      // paginationSize: 30,
      // paginationSizeSelector: [5, 10, 20, 50, 100],
      // reactiveData: true,
      // placeholder: 'Không có dữ liệu',
      // dataTree: true,
      // addRowPos: "bottom",
      columnDefaults: {
        headerWordWrap: false,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 80,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,

      },
      columns: [

        {
          title: 'Name',
          field: 'Name',
          hozAlign: 'center',
          width: 70,
          headerHozAlign: 'center',
          visible: false,
          fozen: true,
        },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          width: 70,
          headerHozAlign: 'center',
          bottomCalc: 'count',
          fozen: true,
        },
        {
          title: 'UnitID',
          field: 'UnitID',
          hozAlign: 'center',
          width: 70,
          visible: false,
          headerHozAlign: 'center',
          fozen: true,
        },
        {
          title: 'TSAssetID',
          field: 'TSAssetID',
          hozAlign: 'center',
          width: 70,
          visible: false,
          headerHozAlign: 'center',
          fozen: true,
        },
        {
          title: 'SourceID',
          field: 'SourceID',
          hozAlign: 'center',
          width: 70,
          visible: false,
          headerHozAlign: 'center',
          fozen: true,
        },
        {
          title: 'DepartmentID',
          field: 'DepartmentID',
          hozAlign: 'center',
          visible: false,
          width: 70,
          headerHozAlign: 'center',
          fozen: true,
        },
        {
          title: 'ID',
          field: 'ID',
          hozAlign: 'center',
          width: 70,
          visible: false,
          headerHozAlign: 'center',
          fozen: true,
        },
        {
          title: 'Mã tài sản',
          field: 'TSAssetCode',
          headerHozAlign: 'center',
          hozAlign: 'left',
          fozen: true,
        },
        {
          title: 'Tên tài sản',
          field: 'TSAssetName',
          headerHozAlign: 'center',
          width: 200,
          // hozAlign: 'left',
          formatter: 'textarea',
          fozen: true,
        },
        {
          title: 'Seri',
          field: 'Seri',
          hozAlign: 'left',
        },
        {
          title: 'Đơn vị',
          field: 'UnitName',
          formatter: function (
            cell: any,
            formatterParams: any,
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Thông số',
          field: 'SpecificationsAsset',
          headerHozAlign: 'center',
          width: 200,
          // hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Ngày mua',
          field: 'DateBuy',
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: formatDateCell,
        },
        {
          title: 'Ngày hiệu lực',
          field: 'DateEffect',
          formatter: formatDateCell,
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Bảo hành (tháng)',
          field: 'Insurance',
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Loại tài sản',
          field: 'AssetType',
          formatter: function (
            cell: any,
            formatterParams: any,
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Phòng ban',
          field: 'Name',
          hozAlign: 'left',
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          formatter: (cell: CellComponent) => {
            const val = cell.getValue() as string;
            const el = cell.getElement();
            el.style.backgroundColor = '';
            el.style.color = '';
            if (val === 'Chưa sử dụng') {
              el.style.backgroundColor = '#AAAAAA';
              el.style.outline = '1px solid #EEEE';
              el.style.color = '#fff';
              el.style.borderRadius = '5px';

            } else if (val === 'Đang sử dụng') {
              el.style.backgroundColor = '#b4ecb4ff';
              el.style.color = '#2cb55aff';
              el.style.outline = '1px solid #e0e0e0';
              el.style.borderRadius = '5px';
            } else if (val === 'Đã thu hồi') {
              el.style.backgroundColor = '#FFCCCC';
              el.style.color = '#000000';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solid #e0e0e0';
            } else if (val === 'Mất') {
              el.style.backgroundColor = '#fbc4c4ff';
              el.style.color = '#d40000ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solid #e0e0e0';
            } else if (val === 'Hỏng') {
              el.style.backgroundColor = '#cadfffff';
              el.style.color = '#4147f2ff';
              el.style.outline = '1px solid #e0e0e0';
              el.style.borderRadius = '5px';
            } else if (val === 'Thanh lý') {
              el.style.backgroundColor = '#d4fbffff';
              el.style.color = '#08aabfff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(196, 35, 35)';
            } else if (val === 'Đề nghị thanh lý') {
              el.style.backgroundColor = '#fde3c1ff';
              el.style.color = '#f79346ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(20, 177, 177)';
            }
            else if (val === 'Sữa chữa, Bảo dưỡng') {
              el.style.backgroundColor = '#bcaa93ff';
              el.style.color = '#c37031ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(20, 177, 177)';
            }
            else {
              el.style.backgroundColor = '#e0e0e0';
              el.style.borderRadius = '5px';
            }
            return val; // vẫn hiển thị chữ
          },
          headerHozAlign: 'center',
        },
        {
          title: 'Mã NCC',
          field: 'TSCodeNCC',
          hozAlign: 'left',
        },
        {
          title: 'Nguồn gốc',
          field: 'SourceName',
          formatter: function (
            cell: any,
            formatterParams: any,
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            return value;
          },
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Người quản lý',
          field: 'FullName',
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        // {
        //   title: 'Người tạo',
        //   field: 'CreatedBy',
        //   headerHozAlign: 'center',
        //   hozAlign: 'left',
        // },
        // {
        //   title: 'Ngày tạo',
        //   field: 'CreatedDate',
        //   headerHozAlign: 'center',
        //   hozAlign: 'left',
        // },
        // {
        //   title: 'Người cập nhật',
        //   field: 'UpdatedBy',
        //   headerHozAlign: 'center',
        //   hozAlign: 'left',
        // },
        // {
        //   title: 'Ngày cập nhật',
        //   field: 'UpdatedDate',
        //   headerHozAlign: 'center',
        //   hozAlign: 'left',
        //   formatter: formatDateCell,
        // },
        {
          title: 'Cấp Phát',
          field: 'IsAllocation',
          formatter: (cell: CellComponent) =>
            cell.getValue() ? 'Có' : 'Không',
          HeaderhozAlign: 'center',
        },
        {
          title: 'Office Active',
          field: 'OfficeActiveStatusText',
          HeaderhozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Windows Active',
          field: 'WindowActiveStatusText',
          HeaderhozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'OfficeActiveStatus',
          field: 'OfficeActiveStatus',
          HeaderhozAlign: 'center',
          hozAlign: 'right',
          visible: false,

        },
        {
          title: 'WindowActiveStatus',
          field: 'WindowActiveStatus',
          HeaderhozAlign: 'center',
          hozAlign: 'right',
          visible: false,
        },
        {
          title: 'Mô tả chi tiết',
          field: 'SpecificationsAsset',
          HeaderhozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea'
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',

        },
      ] as any[],
    });

    this.assetTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const ID = rowData['ID'];
      this.assetManagementService
        .getAssetAllocationDetail(ID)
        .subscribe((respon) => {
          this.assetManagementDetail = respon.data.assetsAllocation;
          this.drawEmployeeTable();
        });
    });

    this.assetTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    });
  }
  private drawEmployeeTable(): void {
    if (!this.datatableEmployeeRef) {
      return;
    }

    if (this.assetDetailtable) {
      this.assetDetailtable.setData(this.assetManagementDetail);
      return;
    }

    this.assetDetailtable = new Tabulator(this.datatableEmployeeRef.nativeElement, {
      data: this.assetManagementDetail,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitData',
     height:'83vh',
      paginationSize: 10,
      paginationMode:'local',
      movableColumns: true,
      reactiveData: true,
      columns: [
        {
          title: 'Trạng thái',
          field: 'Status',
          formatter: (cell: CellComponent) => {
            const val = cell.getValue() as string;
            const el = cell.getElement();
            el.style.backgroundColor = '';
            el.style.color = '';
            if (val === 'Chưa sử dụng') {
              el.style.backgroundColor = '#AAAAAA';
              el.style.outline = '1px solid #EEEE';
              el.style.color = '#fff';
              el.style.borderRadius = '5px';

            } else if (val === 'Đang sử dụng') {
              el.style.backgroundColor = '#b4ecb4ff';
              el.style.color = '#2cb55aff';
              el.style.outline = '1px solid #e0e0e0';
              el.style.borderRadius = '5px';
            } else if (val === 'Đã thu hồi') {
              el.style.backgroundColor = '#FFCCCC';
              el.style.color = '#000000';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solid #e0e0e0';
            } else if (val === 'Mất') {

              el.style.backgroundColor = '#fbc4c4ff';
              el.style.color = '#d40000ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solid #e0e0e0';
            } else if (val === 'Hỏng') {
              el.style.backgroundColor = '#cadfffff';
              el.style.color = '#4147f2ff';
              el.style.outline = '1px solid #e0e0e0';
              el.style.borderRadius = '5px';
            } else if (val === 'Đã thanh lý') {
              el.style.backgroundColor = '#d4fbffff';
              el.style.color = '#08aabfff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(196, 35, 35)';
            } else if (val === 'Đề nghị thanh lí  ') {
              el.style.backgroundColor = '#fde3c1ff';
              el.style.color = '#f79346ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(20, 177, 177)';
            }
            else if (val === 'Sữa chữa, Bảo dưỡng') {
              el.style.backgroundColor = '#bcaa93ff';
              el.style.color = '#c37031ff';
              el.style.borderRadius = '5px';
              el.style.outline = '1px solidrgb(20, 177, 177)';
            }
            else {
              el.style.backgroundColor = '#e0e0e0';
              el.style.borderRadius = '5px';
            }
            return val; // vẫn hiển thị chữ
          },
          headerHozAlign: 'center',
        },
        { title: 'Mã NV', field: 'Code', headerHozAlign: 'center' },
        { title: 'Họ và tên', field: 'FullName', headerHozAlign: 'center' },
        { title: 'Phòng ban', field: 'dpmName', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'CVName', headerHozAlign: 'center' },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDate',
          headerHozAlign: 'center',
          formatter: formatDateCell,
          hozAlign: 'center',
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          headerHozAlign: 'center',
          formatter: formatDateCell,
          hozAlign: 'center',
        },
        { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center', width: 300, formatter: 'textarea' },
      ],
    });
  }

  getSelectedIds(): number[] {
    if (this.assetTable) {
      const selectedRows = this.assetTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteAsset() {
    const selectedIds = this.getSelectedIds();
    const assetManagements = selectedIds.map((id) => ({
      ID: id,
      IsDeleted: true,
    }));
    const asset = {
      tSAssetManagements: assetManagements,
    };
    console.log('payload', asset);
    this.assetManagementService.saveDataAsset(asset).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getAssetmanagement();
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi xóa:', err);
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      },
    });
  }
  onAddAsset() {
    const initialData = {
      ID: 0,
      TSAssetCode: '',
      TSAssetName: '',
      DepartmentID: null,
      EmployeeID: null,
      SourceID: null,
      UnitID: null,
      StatusID: null,
      DateBuy: '',
      DateEffect: '',
      Note: '',
      Insurance: '',
      Seri: '',
      SpecificationsAsset: '',
      TSCodeNCC: '',
      WindowActiveStatus: null,
      OfficeActiveStatus: null,
      STT: null,
      // cái gì cần default nữa thì add vào
    };

    const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = initialData;

    modalRef.result.then(
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onEitAsset() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một đơn vị để sửa!'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
      size: 'xl ',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onReportLoss() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một tài sản để báo mất!'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };

    if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo mất!`);
      return;

    }
    if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo mất!`);
      return;
    }
    const modalRef = this.ngbModal.open(
      TsAssetManagementReportLossFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onRepaireAsset() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một tài sản để báo hỏng!'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };
    if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể sửa chữa bảo dưỡng!`);
      return;
    }
    if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể sửa chữa bảo dưỡng!`);
      return;
    }
    const modalRef = this.ngbModal.open(TsAssetRepairFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onReuseAsset() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một tài sản để đưa vào sử dụng lại!'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };
    if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể đưa vào sử dụng lại!`);
      return;
    }
    if (selectedAssets.StatusID != 3) {
      this.notification.warning(
        'Thông báo',
        'Tài sản này không sửa chữa bảo dưỡng, không thể sử dụng lại!'
      );
      return;
    }
    this.assetManagementService
      .getAssetRepair(selectedAssets.ID)
      .subscribe((respon) => {
        this.repairData = respon.data;
        const modalRef = this.ngbModal.open(TsAssetReuseFormComponent, {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          centered: true,
        });
        modalRef.componentInstance.dataInput1 = this.repairData;
        modalRef.componentInstance.dataInput = selectedAssets;

        modalRef.result.then(
          (result) => {
            console.log('Modal closed with result:', result);
            this.getAssetmanagement();
          },
          () => {
            console.log('Modal dismissed');
          }
        );
      });
  }
  onReportBroken() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một đơn vị để báo hỏng!'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };
    if (selectedAssets.StatusID == 4) {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo hỏng!`);
      return;
    }
    if (selectedAssets.StatusID == 3 || selectedAssets.Status == "Hỏng") {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã báo hỏng, không thể báo hỏng!`);
      return;
    }
    if (selectedAssets.StatusID == 7 || selectedAssets.Status == "Thanh lý") {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo hỏng!`);
      return;
    }
    const modalRef = this.ngbModal.open(
      TsAssetManagementReportBorkenFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onLiquidation() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một tài sản để đề nghị thanh lí'
      );
      return;
    }

    const selectedAssets = { ...selected[0] };
    if (selectedAssets.StatusID == 6 || selectedAssets.Status == "Thanh lý") {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí!`);
      return;
    }
    if (
      selectedAssets.StatusID != 7 ||
      selectedAssets.Status != 'Đề nghị thanh lý'
    ) {
      this.notification.warning(
        'Thông báo',
        'Tài sản này chưa đề nghị thanh lý, không thể thanh lí!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(TsAssetLiquidationComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedAssets;

    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onReportLiquidation() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một tài sản để đề nghị thanh lí'
      );
      return;
    }
    const selectedAssets = { ...selected[0] };
    if (
      selectedAssets.StatusID === 6 ||
      selectedAssets.Status === 'Đề nghị thanh lí'

    ) {
      this.notification.warning('Thông báo', `Tài sản có mã "${selectedAssets.TSAssetCode}" đã đề nghị thanh lí!`);

      return;
    }
    if (

      selectedAssets.StatusID === 4 ||
      selectedAssets.Status === 'Mất'
    ) {
      this.notification.warning(
        'Thông báo',
        `Tài sản có mã "${selectedAssets.TSAssetCode}"đã mất, không thể đề nghị thanh lí!`
      );
      return;
    }
    const modalRef = this.ngbModal.open(
      TsAssetProposeLiquidationFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = selectedAssets;

    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onExportExcel() {
    this.exportToExcelAdvanced();
  }
  onDisposeAsset() { }
  async exportToExcelAdvanced() {
    if (!this.assetTable) return;

    const selectedData = [...this.assetData];

    console.log('selectedData:', selectedData);

    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách tài sản');

    const columns = this.assetTable
      .getColumnDefinitions()
      .filter(
        (col: any) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );

    console.log(
      'columns:',
      columns.map((c) => c.field)
    );

    const headerRow = worksheet.addRow(
      columns.map((col: any) => col.title || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        switch (col.field) {
          case 'IsAllocation':
            return value ? 'Có' : 'Không';
          case 'CreatedDate':
          case 'UpdatedDate':
          case 'DateBuy':
          case 'DateEffect':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          case 'Status':
            return value || '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-tai-san-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  openModalImportExcel() {
    const modalRef = this.ngbModal.open(TsAssetManagementImportExcelComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-fullscreen',
    });
    modalRef.result.catch((result) => {
      if (result == true) {
      }
    });
  }

}
