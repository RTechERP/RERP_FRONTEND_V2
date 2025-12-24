import { inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  OnClickEventArgs,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TsAssetLiquidationComponent } from './ts-asset-liquidation/ts-asset-liquidation.component';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AssetStatusService } from '../ts-asset-status/ts-asset-status-service/ts-asset-status.service';
import { AssetsManagementService } from './ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementFormComponent } from './ts-asset-management-form/ts-asset-management-form.component';
import { TsAssetManagementReportBorkenFormComponent } from './ts-asset-management-report-borken-form/ts-asset-management-report-borken-form.component';
import { TsAssetManagementReportLossFormComponent } from './ts-asset-management-report-loss-form/ts-asset-management-report-loss-form.component';
import { TsAssetManagementImportExcelComponent } from './ts-asset-management-import-excel/ts-asset-management-import-excel.component';
import { TsAssetProposeLiquidationFormComponent } from './ts-asset-propose-liquidation-form/ts-asset-propose-liquidation-form.component';
import { TsAssetRepairFormComponent } from './ts-asset-repair-form/ts-asset-repair-form.component';
import { TsAssetReuseFormComponent } from './ts-asset-reuse-form/ts-asset-reuse-form.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { TsAssetSourceFormComponent } from '../ts-asset-source/ts-asset-source-form/ts-asset-source-form.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
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
    HasPermissionDirective,
    NzModalModule,
    NzDropDownModule,
    AngularSlickgridModule
  ],
  selector: 'app-ts-asset-management',
  templateUrl: './ts-asset-management.component.html',
  styleUrls: ['./ts-asset-management.component.css'],
})
export class TsAssetManagementComponent implements OnInit, AfterViewInit {
  // SlickGrid instances
  angularGrid!: AngularGridInstance;
  angularGridDetail!: AngularGridInstance;
  gridData: any;
  gridDetailData: any;

  // Column definitions
  columnDefinitions: Column[] = [];
  columnDefinitionsDetail: Column[] = [];

  // Grid options
  gridOptions: GridOption = {};
  gridOptionsDetail: GridOption = {};

  // Datasets
  dataset: any[] = [];
  datasetDetail: any[] = [];

  public detailTabTitle: string = 'Thông tin cấp phát biên bản:';
  selectedRow: any = '';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  assetManagementDetail: any[] = [];
  assetData: any[] = [];
  isSearchVisible: boolean = false;
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
 isMobile = false;

  department: number[] = [];
  sizeSearch: string = '0';
  filterText: string = '';
  selectedEmployee: any = null;
  assetDate: string = '';
  departmentData: any[] = [];
  statusData: any[] = [];
  repairData: any[] = [];
   private resizeHandler = () => this.onResize();

  constructor(
    private ngZone: NgZone,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private assetManagementService: AssetsManagementService,
    private assetManagementPersonalService: TsAssetManagementPersonalService,
    private assetStatusService: AssetStatusService
  ) { }
  ngOnInit() {
    this.initGrid();
    this.initGridDetail();
  }

  ngAfterViewInit(): void {
    this.updateIsMobile();
 window.addEventListener('resize', this.resizeHandler);

   
    this.getListEmployee();
    this.getStatus();
    this.getDepartment();
  }

    /** Hàm xác định đang là mobile hay desktop */
  private updateIsMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  private onResize() {
    const wasMobile = this.isMobile;
    this.updateIsMobile();

    // SlickGrid tự động resize khi có autoResize enabled
    if (wasMobile !== this.isMobile) {
      if (this.angularGrid && this.angularGrid.resizerService) {
        this.angularGrid.resizerService.resizeGrid();
      }
      if (this.angularGridDetail && this.angularGridDetail.resizerService) {
        this.angularGridDetail.resizerService.resizeGrid();
      }
    }
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
        this.dataset = this.assetData.map((item, index) => ({
          ...item,
          id: item.ID, // SlickGrid requires lowercase 'id' property
          STT: index + 1
        }));
        console.log('this.dataset:',this.dataset);
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
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onFilterChange(): void {
    this.getAssetmanagement();
  }
  initGrid() {
    // Format date helper
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        // Thử parse từ nhiều format
        let dateValue = DateTime.fromISO(value);
        if (!dateValue.isValid) {
          // Thử format yyyy-MM-dd
          dateValue = DateTime.fromFormat(value, 'yyyy-MM-dd');
        }
        if (!dateValue.isValid) {
          // Thử format khác
          dateValue = DateTime.fromFormat(value, 'dd/MM/yyyy');
        }
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    // Status formatter
    const statusFormatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
      const statusId: number = Number(dataContext.StatusID ?? dataContext.StatusId ?? dataContext.statusId ?? dataContext.statusID ?? 0);
      
      const statusLabelMap: Record<number, string> = {
        1: 'Chưa sử dụng',
        2: 'Đã cấp phát',
        3: 'Sữa chữa, Bảo dưỡng',
        4: 'Mất',
        5: 'Hỏng',
        6: 'Thanh lý',
        7: 'Đề nghị thanh lý',
      };

      const label = statusLabelMap[statusId] ?? value ?? '';
      
      const statusColorMap: Record<number, string> = {
        1: 'display: inline-block; width: 100px; text-align: center; background-color: #AAAAAA; color: #fff; border-radius: 5px; padding: 4px 8px;',
        2: 'display: inline-block; width: 100px; text-align: center; background-color: #b4ecb4ff; color: #2cb55aff; border-radius: 5px; padding: 4px 8px;',
        3: 'display: inline-block; width: 100px; text-align: center; background-color: #bcaa93ff; color: #c37031ff; border-radius: 5px; padding: 4px 8px;',
        4: 'display: inline-block; width: 100px; text-align: center; background-color: #fbc4c4ff; color: #d40000ff; border-radius: 5px; padding: 4px 8px;',
        5: 'display: inline-block; width: 100px; text-align: center; background-color: #cadfffff; color: #4147f2ff; border-radius: 5px; padding: 4px 8px;',
        6: 'display: inline-block; width: 100px; text-align: center; background-color: #d4fbffff; color: #08aabfff; border-radius: 5px; padding: 4px 8px;',
        7: 'display: inline-block; width: 100px; text-align: center; background-color: #fde3c1ff; color: #f79346ff; border-radius: 5px; padding: 4px 8px;',
      };

      const style = statusColorMap[statusId] || 'background-color: #e0e0e0; border-radius: 5px; padding: 4px 8px;';
      return `<span style="${style}">${label}</span>`;
    };

    this.columnDefinitions = [
      { id: 'Name', name: 'Name', field: 'Name', type: 'string', width: 70, sortable: true, filterable: true, excludeFromExport: true, hidden: true},
      { id: 'STT', name: 'STT', field: 'STT', type: 'number', width: 50, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] } ,  cssClass: 'text-center',},
      { id: 'UnitID', name: 'UnitID', field: 'UnitID', type: 'number', width: 70, sortable: true, excludeFromExport: true , hidden: true},
      { id: 'TSAssetID', name: 'TSAssetID', field: 'TSAssetID', type: 'number', width: 70, sortable: true, excludeFromExport: true , hidden: true},
      { id: 'SourceID', name: 'SourceID', field: 'SourceID', type: 'number', width: 70, sortable: true, excludeFromExport: true , hidden: true},
      { id: 'DepartmentID', name: 'DepartmentID', field: 'DepartmentID', type: 'number', width: 70, sortable: true, excludeFromExport: true , hidden: true},
      { id: 'ID', name: 'ID', field: 'ID', type: 'number', width: 70, sortable: true, excludeFromExport: true , hidden: true},
      { 
        id: 'TSCodeNCC', 
        name: 'Mã tài sản', 
          field: 'TSCodeNCC',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'OfficeActiveStatusText', 
        name: 'Office Active', 
          field: 'OfficeActiveStatusText',
        type: 'string', 
        width: 120, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        
      },
      { 
        id: 'WindowActiveStatusText', 
        name: 'Windows Active', 
          field: 'WindowActiveStatusText',
        type: 'string', 
        width: 120, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'TSAssetName', 
        name: 'Tên tài sản', 
          field: 'TSAssetName',
        type: 'string', 
          width: 200,
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        ,cssClass: 'cell-wrap',
      },
      { 
        id: 'AssetCode', 
        name: 'Mã loại tài sản', 
          field: 'AssetCode',
        type: 'string', 
          width: 120,
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        ,cssClass: 'cell-wrap',
      },
      { 
        id: 'AssetType', 
        name: 'Tên loại tài sản', 
          field: 'AssetType',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'SourceCode', 
        name: 'Mã nguồn gốc', 
          field: 'SourceCode',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'SourceName', 
        name: 'Tên nguồn gốc', 
          field: 'SourceName',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'SupplierCode', 
        name: 'Mã nhà cung cấp', 
          field: 'SupplierCode',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'SupplierName', 
        name: 'Tên nhà cung cấp', 
          field: 'SupplierName',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'SpecificationsAsset', 
        name: 'Mô tả chi tiết', 
          field: 'SpecificationsAsset',
        type: 'string', 
          width: 200,
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        ,cssClass: 'cell-wrap',
      },
      { 
        id: 'Seri', 
        name: ' Số Seri', 
          field: 'Seri',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'UnitName', 
        name: 'Đơn vị', 
          field: 'UnitName',
        type: 'string', 
        width: 100, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'Quantity', 
        name: 'Số lượng ', 
          field: 'Quantity',
        type: 'number', 
        width: 100, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'Status', 
        name: 'Tình trạng', 
          field: 'Status',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        formatter: statusFormatter,
        cssClass: 'text-center',
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'Model', 
        name: 'Model', 
          field: 'Model',
        type: 'string', 
          width: 200,
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        hidden: true,
      },
      { 
        id: 'Name', 
        name: 'Mã phòng ban', 
          field: 'DepartmentCode',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'Name', 
        name: 'Phòng ban', 
          field: 'Name',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'EmployeeCode', 
        name: 'Mã nhân viên', 
          field: 'EmployeeCode',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'FullName', 
        name: 'Người quản lý', 
          field: 'FullName',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        ,cssClass: 'cell-wrap',
      },
      { 
        id: 'DateBuy', 
        name: 'Thời gian ghi tăng', 
          field: 'DateBuy',
        type: 'date', 
        width: 120, 
        sortable: true, 
        filterable: true,
        formatter: formatDate,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      { 
        id: 'Insurance', 
        name: 'Bảo hành (tháng)', 
          field: 'Insurance',
        type: 'number', 
        width: 130, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      { 
        id: 'DateEffect', 
        name: 'Ngày hiệu lực', 
          field: 'DateEffect',
        type: 'date', 
        width: 120, 
        sortable: true, 
        filterable: true,
        formatter: formatDate,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
     
   
    
      // { 
      //   id: 'Status', 
      //   name: 'Trạng thái', 
      //     field: 'Status',
      //   type: 'string', 
      //   width: 150, 
      //   sortable: true, 
      //   filterable: true,
      //   formatter: statusFormatter,
      //   cssClass: 'text-center',
      //   filter: { model: Filters['compoundInputText'] }
      // },
    
    
      // { 
      //   id: 'IsAllocation', 
      //   name: 'Cấp Phát', 
      //     field: 'IsAllocation',
      //   type: 'boolean', 
      //   width: 100, 
      //   sortable: true, 
      //   filterable: true,
      //   formatter: Formatters.checkmarkMaterial
      // },
      // { 
      //   id: 'OfficeActiveStatus', 
      //   name: 'OfficeActiveStatus', 
      //     field: 'OfficeActiveStatus',
      //   type: 'number', 
      //   width: 100, 
      //   sortable: true,
      //   excludeFromExport: true,
      //   hidden: true,
        
      // },
      // { 
      //   id: 'WindowActiveStatus', 
      //   name: 'WindowActiveStatus', 
      //     field: 'WindowActiveStatus',
      //   type: 'number', 
      //   width: 100, 
      //   sortable: true,
      //   excludeFromExport: true,
      //   hidden: true,
      // },
      // { 
      //   id: 'PositionName', 
      //   name: 'Vị trí', 
      //     field: 'PositionName',
      //   type: 'string', 
      //   width: 150, 
      //   sortable: true, 
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      //   excludeFromExport: true
      // },
      { 
        id: 'Note', 
        name: 'Ghi chú', 
          field: 'Note',
        type: 'string', 
        width: 200, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
        ,cssClass: 'cell-wrap',
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createPreHeaderPanel: false,
      showPreHeaderPanel: false,
      frozenColumn: 11
    };

    this.getAssetmanagement();
  }
  initGridDetail() {
    // Format date helper for detail
    const formatDateDetail = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        // Thử parse từ nhiều format
        let dateValue = DateTime.fromISO(value);
        if (!dateValue.isValid) {
          // Thử format yyyy-MM-dd
          dateValue = DateTime.fromFormat(value, 'yyyy-MM-dd');
        }
        if (!dateValue.isValid) {
          // Thử format khác
          dateValue = DateTime.fromFormat(value, 'dd/MM/yyyy');
        }
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    // Detail status formatter
    const detailStatusFormatter = (row: number, cell: number, value: any) => {
      const statusColorMap: Record<string, string> = {
        'Chưa sử dụng': 'display: inline-block; width: 140px; text-align: center; background-color: #AAAAAA; color: #fff; border-radius: 5px; padding: 4px 8px;',
        'Đang sử dụng': 'display: inline-block; width: 140px; text-align: center; background-color: #b4ecb4ff; color: #2cb55aff; border-radius: 5px; padding: 4px 8px;',
        'Đã thu hồi': 'display: inline-block; width: 140px; text-align: center; background-color: #FFCCCC; color: #000000; border-radius: 5px; padding: 4px 8px;',
        'Mất': 'display: inline-block; width: 140px; text-align: center; background-color: #fbc4c4ff; color: #d40000ff; border-radius: 5px; padding: 4px 8px;',
        'Hỏng': 'display: inline-block; width: 140px; text-align: center; background-color: #cadfffff; color: #4147f2ff; border-radius: 5px; padding: 4px 8px;',
        'Đã thanh lý': 'display: inline-block; width: 140px; text-align: center; background-color: #d4fbffff; color: #08aabfff; border-radius: 5px; padding: 4px 8px;',
        'Đề nghị thanh lí': 'display: inline-block; width: 140px; text-align: center; background-color: #fde3c1ff; color: #f79346ff; border-radius: 5px; padding: 4px 8px;',
        'Sữa chữa, Bảo dưỡng': 'display: inline-block; width: 140px; text-align: center; background-color: #bcaa93ff; color: #c37031ff; border-radius: 5px; padding: 4px 8px;',
      };

      const style = statusColorMap[value] || 'display: inline-block; width: 140px; text-align: center; background-color: #e0e0e0; border-radius: 5px; padding: 4px 8px;';
      return `<span style="${style}">${value || ''}</span>`;
    };

    this.columnDefinitionsDetail = [
      { 
        id: 'Status', 
        name: 'Trạng thái', 
          field: 'Status',
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        formatter: detailStatusFormatter,
        cssClass: 'text-center',
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'Code', 
        name: 'Mã NV', 
        field: 'Code', 
        type: 'string', 
        width: 100, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'FullName', 
        name: 'Họ và tên', 
        field: 'FullName', 
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'dpmName', 
        name: 'Phòng ban', 
        field: 'dpmName', 
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'CVName', 
        name: 'Chức vụ', 
        field: 'CVName', 
        type: 'string', 
        width: 150, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      { 
        id: 'UpdatedDate', 
        name: 'Ngày cập nhật', 
          field: 'UpdatedDate',
        type: 'date', 
        width: 120, 
        sortable: true, 
        filterable: true,
        formatter: formatDateDetail,
        filter: { model: Filters['compoundDate'] },
        hidden: true,
      },
      { 
        id: 'CreatedDate', 
        name: 'Ngày', 
          field: 'CreatedDate',
        type: 'date', 
        width: 120, 
        sortable: true, 
        filterable: true,
        formatter: formatDateDetail,
        filter: { model: Filters['compoundDate'] }
      },
      { 
        id: 'Note', 
        name: 'Ghi chú', 
          field: 'Note',
        type: 'string', 
        width: 300, 
        sortable: true, 
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
    ];

    this.gridOptionsDetail = {
      autoResize: {
        container: '#grid-container-detail',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      forceFitColumns: true,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false
    };

    
  }

  // SlickGrid event handlers
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridData = angularGrid?.slickGrid || {};
  }

  angularGridDetailReady(angularGrid: AngularGridInstance) {
    this.angularGridDetail = angularGrid;
    this.gridDetailData = angularGrid?.slickGrid || {};
  }

  handleRowSelection(e: any, args: OnSelectedRowsChangedEventArgs) {
    if (args && args.rows && args.rows.length > 0) {
      const selectedRow = this.gridData.getDataItem(args.rows[0]);
      this.selectedRow = selectedRow;
    }
  }

  onCellClicked(e: any, args: OnClickEventArgs) {
    const item = args.grid.getDataItem(args.row);
    if (item) {
      this.detailTabTitle = `Thông tin sử dụng tài sản: ${item['TSCodeNCC']}`;
      const ID = item['ID'];
      this.assetManagementService
        .getAssetAllocationDetail(ID)
        .subscribe((respon) => {
          this.assetManagementDetail = respon.data.assetsAllocation;
          this.datasetDetail = this.assetManagementDetail.map((item, index) => ({
            ...item,
            id: item.ID || index // SlickGrid requires lowercase 'id' property
          }));
        });
    }
  }

  private getSingleSelectedAsset(actionText: string): any | null {
    const selected = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedData = selected.map((index: number) => this.gridData.getDataItem(index));

    if (selectedData.length === 0) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Vui lòng chọn một tài sản để ${actionText}!`
    );
    return null;
  }

    if (selectedData.length > 1) {
      const codes = selectedData.map((x: any) => x.TSAssetCode).join(', ');
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Chỉ được chọn 1 tài sản để ${actionText}. Đang chọn: ${codes}`
    );
    return null;
  }

    return { ...selectedData[0] }; // clone cho chắc
  }

  getSelectedIds(): number[] {
    if (this.angularGrid && this.angularGrid.gridService) {
      const selectedRows = this.angularGrid.gridService.getSelectedRows();
      return selectedRows.map((index: number) => {
        const item = this.gridData.getDataItem(index);
        return item.ID;
      });
    }
    return [];
  }

  onDeleteAsset() {
    const selectedRows = this.angularGrid?.gridService?.getSelectedRows() || [];
    const selectedRowData = selectedRows.map((index: number) => this.gridData.getDataItem(index));

    if (selectedRowData.length === 0) {
      this.notification.warning('Cảnh báo', 'Chưa chọn tài sản để xóa');
      return;
    }

    // Kiểm tra tài sản đang sử dụng
    const assetsInUse = selectedRowData.filter((x: any) => 
      x.Status === 'Đang sử dụng' || x.StatusID === 2
    );

    if (assetsInUse.length > 0) {
      const inUseCodes = assetsInUse.map((x: any) => x.TSCodeNCC).join(', ');
      this.notification.warning(
        'Cảnh báo',
        `Không thể xóa tài sản đang sử dụng. Các tài sản sau đang được sử dụng: ${inUseCodes}`
      );
      return;
    }

    const selectedIds = selectedRowData.map((x: any) => x.ID);
    const selectedCodes = selectedRowData.map((x: any) => x.TSCodeNCC); 
    const codesText = selectedCodes.join(', ');

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa các tài sản sau: <b>${codesText}</b>?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const assetManagements = selectedIds.map((id: number) => ({
          ID: id,
          IsDeleted: true,
        }));

        const asset = {
          tSAssetManagements: assetManagements,
        };

        console.log('payload', asset);

        this.assetManagementService.saveDataAsset(asset).subscribe({
          next: () => {
            this.notification.success('Thành công', 'Xóa tài sản thành công');
            this.getAssetmanagement();
          },
          error: (err) => {
            console.error('Lỗi khi xóa:', err);
            this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ');
          },
        });
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
    const selectedAssets = this.getSingleSelectedAsset('sửa');
    if (!selectedAssets) return;

    const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
      size: 'xl ',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onReportLoss() {
    const selectedAssets = this.getSingleSelectedAsset('báo mất');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo mất!`
    );
    return;
  }
  if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo mất!`
    );
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
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onRepaireAsset() {
    const selectedAssets = this.getSingleSelectedAsset('sửa chữa/bảo dưỡng');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID == 4 || selectedAssets.Status === 'Mất') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể sửa chữa bảo dưỡng!`
    );
    return;
  }
  if (selectedAssets.StatusID == 7 || selectedAssets.Status === 'Thanh lý') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể sửa chữa bảo dưỡng!`
    );
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
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onReuseAsset() {
    const selectedAssets = this.getSingleSelectedAsset('đưa vào sử dụng lại');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID != 5) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đang ở trạng thái ${selectedAssets.Status}, không thể đưa vào sử dụng lại!`
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
          () => this.getAssetmanagement(),
          () => { }
        );
      });
  }
  onReportBroken() {
    const selectedAssets = this.getSingleSelectedAsset('báo hỏng');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID == 4) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã mất, không thể báo hỏng!`
    );
    return;
  }
  if (selectedAssets.StatusID == 3 || selectedAssets.Status == 'Hỏng') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã báo hỏng, không thể báo hỏng!`
    );
    return;
  }
  if (selectedAssets.StatusID == 7 || selectedAssets.Status == 'Thanh lý') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí, không thể báo hỏng!`
    );
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
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onLiquidation() {
    const selectedAssets = this.getSingleSelectedAsset('thanh lý');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID == 6 || selectedAssets.Status == 'Thanh lý') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lí!`
    );
    return;
  }
  if (
    selectedAssets.StatusID != 7 ||
    selectedAssets.Status != 'Đề nghị thanh lý'
  ) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
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
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onReportLiquidation() {
    const selectedAssets = this.getSingleSelectedAsset('đề nghị thanh lý');
    if (!selectedAssets) return;

  if (selectedAssets.StatusID === 6) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã thanh lý, không thể đề nghị thanh lý!`
    );
    return;
  }
  if (selectedAssets.StatusID === 7) {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
      `Tài sản có mã "${selectedAssets.TSAssetCode}" đã đề nghị thanh lý, không thể đề nghị thanh lý!`
    );
    return;
  }
  if (selectedAssets.StatusID === 4 || selectedAssets.Status === 'Mất') {
    this.notification.warning(
      NOTIFICATION_TITLE.warning,
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
      () => this.getAssetmanagement(),
      () => { }
    );
  }
  onExportExcel() {
    this.exportToExcelAdvanced();
  }
  onDisposeAsset() { }
  async exportToExcelAdvanced() {
    if (!this.angularGrid) return;

    const selectedData = [...this.assetData];

    console.log('selectedData:', selectedData);

    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách tài sản');

    let columns = this.columnDefinitions.filter(
      (col: Column) =>
        col.excludeFromExport !== true && col.field && col.field.trim() !== ''
      );

    // Đảm bảo cột Model luôn được xuất ra
    const hasModelColumn = columns.some((col: Column) => col.field === 'Model');
    if (!hasModelColumn) {
      const modelColumn = this.columnDefinitions.find((col: Column) => col.field === 'Model');
      if (modelColumn) {
        columns.push(modelColumn);
      }
    }

    console.log(
      'columns:',
      columns.map((c) => c.field)
    );

    const headerRow = worksheet.addRow(
      columns.map((col: Column) => col.name || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: Column) => {
        const value = row[col.field!];
        switch (col.field) {
          case 'IsAllocation':
            return value ? 'Có' : 'Không';
          case 'CreatedDate':
          case 'UpdatedDate':
          case 'DateBuy':
          case 'DateEffect':
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
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