import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { DateTime } from 'luxon';
import { MeetingMinuteService } from '../project/meeting-minute/meeting-minute-service/meeting-minute.service';
import { MeetingMinuteFormComponent } from '../project/meeting-minute/meeting-minute-form/meeting-minute-form.component';
import { NOTIFICATION_TITLE } from '../../app.config';

interface MeetingMinutes {
  STT: number;
  ProjectCode: string;
  ProjectName: string;
  ProjectID: string;
  Title: string;
  TypeName: string;
  DateStart: Date | null;
  DateEnd: Date | null;
  Place: string;
}

interface Employee {
  EmployeeID: number;
  FullName: string;
  UserTeamID: string;
  Section: string;
}

@Component({
  selector: 'app-meeting-minute-slick-grid',
  templateUrl: './meeting-minute-slick-grid.component.html',
  styleUrl: './meeting-minute-slick-grid.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTabsModule,
    NzSpinModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    AngularSlickgridModule,
    MeetingMinuteFormComponent,
  ],
  providers: [
    ExcelExportService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class MeetingMinuteSlickGridComponent implements OnInit, AfterViewInit {
  // Loading state
  isLoading: boolean = false;
  showSearchBar: boolean = true;

  // Search params
  searchParams = {
    DateStart: new Date(),
    DateEnd: new Date(),
    Keywords: '',
    MeetingTypeID: 0,
  };
  dateFormat = 'dd/MM/yyyy';

  // Data
  meetingTypeGroupsData: any[] = [];
  MeetingMinutesID: number = 0;
  EmployeeID: number = 0;

  // Tab indices
  mainTabIndex = 0;

  activeTab = 0;

  activeCustomerTab = 0;
  gridsReady = false;

  // New records templates
  newMeetingMinutes: MeetingMinutes = {
    STT: 0,
    ProjectCode: '',
    ProjectName: '',
    ProjectID: '',
    Title: '',
    TypeName: '',
    DateStart: null,
    DateEnd: null,
    Place: '',
  };

  newEmployee: Employee = {
    EmployeeID: 0,
    FullName: '',
    UserTeamID: '',
    Section: '',
  };

  isCheckmode: boolean = false;

  // SlickGrid instances
  angularGridMeetingMinutes!: AngularGridInstance;
  angularGridEmployee!: AngularGridInstance;
  angularGridEmployeeContent!: AngularGridInstance;
  angularGridCustomer!: AngularGridInstance;
  angularGridCustomerContent!: AngularGridInstance;
  angularGridFile!: AngularGridInstance;

  // Column definitions
  columnsMeetingMinutes: Column[] = [];
  columnsEmployee: Column[] = [];
  columnsEmployeeContent: Column[] = [];
  columnsCustomer: Column[] = [];
  columnsCustomerContent: Column[] = [];
  columnsFile: Column[] = [];

  // Grid options
  gridOptionsMeetingMinutes: GridOption = {};
  gridOptionsEmployee: GridOption = {};
  gridOptionsEmployeeContent: GridOption = {};
  gridOptionsCustomer: GridOption = {};
  gridOptionsCustomerContent: GridOption = {};
  gridOptionsFile: GridOption = {};

  // Datasets
  datasetMeetingMinutes: any[] = [];
  datasetEmployee: any[] = [];
  datasetEmployeeContent: any[] = [];
  datasetCustomer: any[] = [];
  datasetCustomerContent: any[] = [];
  datasetFile: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private meetingMinuteService: MeetingMinuteService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private excelExportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    // Set date range (start = 1 month ago)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    this.searchParams.DateStart = startDate;

    // Initialize all grids
    this.initGridMeetingMinutes();
    this.initGridEmployee();
    this.initGridEmployeeContent();
    this.initGridCustomer();
    this.initGridCustomerContent();
    this.initGridFile();

    // Get meeting type groups
    this.getMeetingTypeGroup();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.gridsReady = true;
      this.getMeetingMinutes();
      this.resizeAllGrids();
    }, 100);
  }

  //#region Grid Initialization
  private initGridMeetingMinutes(): void {
    this.columnsMeetingMinutes = [
      { id: 'STT', name: 'STT', field: 'STT', sortable: true, width: 60, filterable: true, filter: { model: Filters['compoundInputNumber'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', sortable: true, minWidth: 80, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], filterOptions: { filter: true, maxHeight: 300 } as MultipleSelectOption } },
      { id: 'ProjectName', name: 'Tên dự án', field: 'ProjectName', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'Title', name: 'Tiêu đề', field: 'Title', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'TypeName', name: 'Loại cuộc họp', field: 'TypeName', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], filterOptions: { filter: true, maxHeight: 300 } as MultipleSelectOption } },
      { id: 'CreatorName', name: 'Người tạo', field: 'CreatorName', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], filterOptions: { filter: true, maxHeight: 300 } as MultipleSelectOption } },
      { id: 'DateStart', name: 'Ngày bắt đầu', field: 'DateStart', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundDate'] }, formatter: Formatters.dateIso, type: 'date', cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'DateEnd', name: 'Ngày kết thúc', field: 'DateEnd', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundDate'] }, formatter: Formatters.dateIso, type: 'date', cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'Place', name: 'Địa điểm', field: 'Place', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsMeetingMinutes = this.getDefaultGridOptions('#grid-meeting-minutes');
  }

  private initGridEmployee(): void {
    this.columnsEmployee = [
      { id: 'EmployeeCode', name: 'Mã nhân viên', field: 'EmployeeCode', sortable: true, minWidth: 80, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'FullName', name: 'Tên nhân viên', field: 'FullName', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'UserTeamName', name: 'Team', field: 'UserTeamName', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['multipleSelect'], collection: [], filterOptions: { filter: true, maxHeight: 300 } as MultipleSelectOption } },
      { id: 'Section', name: 'Chức vụ', field: 'Section', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];
    this.gridOptionsEmployee = this.getDefaultGridOptions('#grid-employee');
  }

  private initGridEmployeeContent(): void {
    this.columnsEmployeeContent = [
      { id: 'DetailContent', name: 'Nội dung', field: 'DetailContent', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'DetailResult', name: 'Kết quả', field: 'DetailResult', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'EmployeeCode', name: 'Mã nhân viên', field: 'EmployeeCode', sortable: true, minWidth: 80, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'CustomerName', name: 'Người phụ trách', field: 'CustomerName', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'PhoneNumber', name: 'Số điện thoại', field: 'PhoneNumber', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'PlanDate', name: 'Kế hoạch', field: 'PlanDate', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundDate'] }, formatter: Formatters.dateIso, type: 'date', cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'Note', name: 'Ghi chú', field: 'Note', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
    ];
    this.gridOptionsEmployeeContent = this.getDefaultGridOptions('#grid-employee-content');
  }

  private initGridCustomer(): void {
    this.columnsCustomer = [
      { id: 'FullName', name: 'Tên khách hàng', field: 'FullName', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'PhoneNumber', name: 'Số điện thoại', field: 'PhoneNumber', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'EmailCustomer', name: 'Email', field: 'EmailCustomer', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'AddressCustomer', name: 'Địa chỉ', field: 'AddressCustomer', sortable: true, minWidth: 200, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
    ];
    this.gridOptionsCustomer = this.getDefaultGridOptions('#grid-customer');
  }

  private initGridCustomerContent(): void {
    this.columnsCustomerContent = [
      { id: 'DetailContent', name: 'Nội dung', field: 'DetailContent', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'DetailResult', name: 'Kết quả', field: 'DetailResult', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
      { id: 'CustomerName', name: 'Họ tên', field: 'CustomerName', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'PhoneNumber', name: 'Số điện thoại', field: 'PhoneNumber', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'PlanDate', name: 'Kế hoạch', field: 'PlanDate', sortable: true, minWidth: 100, filterable: true, filter: { model: Filters['compoundDate'] }, formatter: Formatters.dateIso, type: 'date', cssClass: 'text-center', headerCssClass: 'text-center' },
      { id: 'Note', name: 'Ghi chú', field: 'Note', sortable: true, minWidth: 150, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
    ];
    this.gridOptionsCustomerContent = this.getDefaultGridOptions('#grid-customer-content');
  }

  private initGridFile(): void {
    this.columnsFile = [
      { id: 'FileName', name: 'Tên File', field: 'FileName', sortable: true, minWidth: 200, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'cell-wrap' },
    ];
    this.gridOptionsFile = this.getDefaultGridOptions('#grid-file');
  }

  private getDefaultGridOptions(containerId: string): GridOption {
    return {
      autoResize: { container: containerId, calculateAvailableSizeBy: 'container' },
      enableAutoResize: true,
      gridWidth: '100%',
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      showHeaderRow: true,
      headerRowHeight: 35,
      rowHeight: 35,
      explicitInitialization: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      dataView: { syncGridSelection: true },
    };
  }
  //#endregion

  //#region Grid Ready Events
  onMeetingMinutesGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridMeetingMinutes = angularGrid;
    setTimeout(() => this.angularGridMeetingMinutes?.resizerService?.resizeGrid(), 100);
  }

  onEmployeeGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridEmployee = angularGrid;
    setTimeout(() => this.angularGridEmployee?.resizerService?.resizeGrid(), 100);
  }

  onEmployeeContentGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridEmployeeContent = angularGrid;
    setTimeout(() => this.angularGridEmployeeContent?.resizerService?.resizeGrid(), 100);
  }

  onCustomerGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridCustomer = angularGrid;
    setTimeout(() => this.angularGridCustomer?.resizerService?.resizeGrid(), 100);
  }

  onCustomerContentGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridCustomerContent = angularGrid;
    setTimeout(() => this.angularGridCustomerContent?.resizerService?.resizeGrid(), 100);
  }

  onFileGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridFile = angularGrid;
    setTimeout(() => this.angularGridFile?.resizerService?.resizeGrid(), 100);
  }
  //#endregion

  //#region Row Selection Events
  onMeetingMinutesRowSelected(event: any): void {
    if (event.detail?.args?.rows?.length > 0) {
      const rowIndex = event.detail.args.rows[0];
      const selectedRow = this.angularGridMeetingMinutes?.dataView?.getItem(rowIndex);
      if (selectedRow) {
        this.MeetingMinutesID = selectedRow.ID;
        this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
      }
    }
  }

  onFileRowClick(event: any): void {
    if (event.detail?.args) {
      const row = event.detail.args.row;
      const rowData = this.angularGridFile?.dataView?.getItem(row);
      if (rowData?.ServerPath) {
        this.downloadFile(rowData.ServerPath);
      }
    }
  }
  //#endregion

  //#region Data Methods
  toLocalISOString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error('Invalid date input');
    }
    const tzOffset = 7 * 60;
    const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000);
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return adjustedDate.getUTCFullYear() + '-' + pad(adjustedDate.getUTCMonth() + 1) + '-' + pad(adjustedDate.getUTCDate()) + 'T' + pad(adjustedDate.getUTCHours()) + ':' + pad(adjustedDate.getUTCMinutes()) + ':' + pad(adjustedDate.getUTCSeconds());
  }

  getMeetingTypeGroup(): void {
    this.meetingMinuteService.getDataGroupID().subscribe((response: any) => {
      this.meetingTypeGroupsData = response.data || [];
    });
  }

  getGroupName(groupId: number): string {
    switch (groupId) {
      case 1:
        return 'Khách hàng';
      case 2:
        return 'Nhân viên';
      case 3:
        return 'Nội bộ';
      default:
        return 'Khác';
    }
  }

  getMeetingMinutes(): void {
    this.isLoading = true;
    this.meetingMinuteService.getMeetingMinutes(
      this.searchParams.Keywords.trim() || '',
      this.toLocalISOString(this.searchParams.DateStart),
      this.toLocalISOString(this.searchParams.DateEnd),
      this.searchParams.MeetingTypeID
    ).subscribe({
      next: (response: any) => {
        const data = response.data?.asset || [];
        this.datasetMeetingMinutes = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID || `meeting_${index + 1}`,
        }));
        this.updateFilterCollections();
        if (this.datasetMeetingMinutes.length > 0) {
          this.MeetingMinutesID = this.datasetMeetingMinutes[0].ID;
          this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading meeting minutes:', error);
        this.isLoading = false;
        this.datasetMeetingMinutes = [];
      },
    });
  }

  getMeetingMinutesDetailsByID(ID: number): void {
    this.meetingMinuteService.getMeetingMinutesDetailsByID(ID).subscribe({
      next: (response: any) => {
        // Employee data
        const empDetail = response.data?.empDetail || [];
        this.datasetEmployee = empDetail.map((item: any, index: number) => ({ ...item, id: item.ID || `emp_${index + 1}` }));

        // Employee content data
        const empContent = response.data?.empContent || [];
        this.datasetEmployeeContent = empContent.map((item: any, index: number) => ({ ...item, id: item.ID || `emp_content_${index + 1}` }));

        // Customer data
        const cusDetail = response.data?.cusDetail || [];
        this.datasetCustomer = cusDetail.map((item: any, index: number) => ({ ...item, id: item.ID || `cus_${index + 1}` }));

        // Customer content data
        const cusContent = response.data?.cusContent || [];
        this.datasetCustomerContent = cusContent.map((item: any, index: number) => ({ ...item, id: item.ID || `cus_content_${index + 1}` }));

        // File data
        const fileData = response.data?.file || [];
        this.datasetFile = fileData.map((item: any, index: number) => ({ ...item, id: item.ID || `file_${index + 1}` }));
      },
      error: (error) => console.error('Error loading meeting details:', error),
    });
  }

  private updateFilterCollections(): void {
    if (!this.angularGridMeetingMinutes) return;
    const projectCodes = [...new Set(this.datasetMeetingMinutes.map((item) => item.ProjectCode).filter(Boolean))];
    this.updateColumnFilter('ProjectCode', projectCodes.map((code) => ({ value: code, label: code })));
    const typeNames = [...new Set(this.datasetMeetingMinutes.map((item) => item.TypeName).filter(Boolean))];
    this.updateColumnFilter('TypeName', typeNames.map((name) => ({ value: name, label: name })));
    const creatorNames = [...new Set(this.datasetMeetingMinutes.map((item) => item.CreatorName).filter(Boolean))];
    this.updateColumnFilter('CreatorName', creatorNames.map((name) => ({ value: name, label: name })));
  }

  private updateColumnFilter(columnId: string, collection: any[]): void {
    const columnIndex = this.columnsMeetingMinutes.findIndex((col) => col.id === columnId);
    if (columnIndex !== -1 && this.columnsMeetingMinutes[columnIndex].filter) {
      this.columnsMeetingMinutes[columnIndex].filter!.collection = collection;
    }
  }

  downloadFile(serverPath: string): void {
    this.meetingMinuteService.downloadFile(serverPath).subscribe((res: any) => {
      const url = window.URL.createObjectURL(new Blob([res]));
      const a = document.createElement('a');
      a.href = url;
      a.download = serverPath;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
  //#endregion

  //#region Actions
  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
    setTimeout(() => this.resizeAllGrids(), 100);
  }

  searchData(): void {
    this.getMeetingMinutes();
  }

  resetForm(): void {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    this.searchParams = { DateStart: startDate, DateEnd: new Date(), Keywords: '', MeetingTypeID: 0 };
  }

  onAddMeetingMinutes(isEditmode: boolean): void {
    this.isCheckmode = isEditmode;
    if (this.isCheckmode && this.MeetingMinutesID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 bản ghi để sửa!');
      return;
    }
    const modalRef = this.modalService.open(MeetingMinuteFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newMeetingMinutes = this.newMeetingMinutes;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.MeetingMinutesID = this.MeetingMinutesID;
    modalRef.componentInstance.newEmployee = this.newEmployee;

    modalRef.result
      .then(() => {
        this.getMeetingMinutes();
        if (this.MeetingMinutesID) {
          this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
        }
      })
      .catch(() => {
        this.getMeetingMinutes();
        if (this.MeetingMinutesID) {
          this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
        }
      });
  }

  onDeleteMeetingMinutes(): void {
    if (this.MeetingMinutesID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một bản ghi để xóa!');
      return;
    }
    const selectedRow = this.datasetMeetingMinutes.find((item) => item.ID === this.MeetingMinutesID);
    if (!selectedRow) return;

    const payloads = {
      MeetingMinute: { ...selectedRow, IsDeleted: true, UpdatedBy: 'admin', UpdatedDate: new Date() },
      MeetingMinutesDetail: [],
      MeetingMinutesAttendance: [],
      DeletedMeetingMinutesAttendance: [],
      DeletedMeetingMinutesDetails: [],
    };

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedRow.Title} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.meetingMinuteService.saveData(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa thành công!');
              this.getMeetingMinutes();
            } else {
              this.notification.warning('Thông báo', res.message || 'Không thể xóa bản ghi này!');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa!');
            console.error(err);
          },
        });
      },
    });
  }

  exportExcel(): void {
    if (!this.angularGridMeetingMinutes) {
      this.notification.error('Lỗi', 'Grid chưa sẵn sàng để export');
      return;
    }
    const data = this.angularGridMeetingMinutes.dataView?.getItems();
    if (!data || data.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
      return;
    }
    try {
      const exportOptions = { filename: `DanhSachBienBanCuocHop_${new Date().toISOString().split('T')[0]}`, sheetName: 'Biên bản cuộc họp', sanitizeDataExport: true };
      this.excelExportService.exportToExcel(exportOptions);
      this.notification.success('Thành công', 'Xuất excel thành công!');
    } catch (error) {
      console.error('Excel export error:', error);
      this.notification.error('Lỗi', 'Không thể export file Excel');
    }
  }
  //#endregion

  //#region Tab Events
  onMainTabChange(index: number): void {
    this.mainTabIndex = index;
    setTimeout(() => this.resizeAllGrids(), 100);
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    setTimeout(() => {
      if (index === 0 && this.angularGridEmployee) {
        this.angularGridEmployee.resizerService?.resizeGrid();
      } else if (index === 1 && this.angularGridEmployeeContent) {
        this.angularGridEmployeeContent.resizerService?.resizeGrid();
      }
    }, 100);
  }

  onCustomerTabChange(index: number): void {
    this.activeCustomerTab = index;
    setTimeout(() => {
      if (index === 0 && this.angularGridCustomer) {
        this.angularGridCustomer.resizerService?.resizeGrid();
      } else if (index === 1 && this.angularGridCustomerContent) {
        this.angularGridCustomerContent.resizerService?.resizeGrid();
      }
    }, 100);
  }

  private resizeAllGrids(): void {
    this.angularGridMeetingMinutes?.resizerService?.resizeGrid();
    this.angularGridEmployee?.resizerService?.resizeGrid();
    this.angularGridEmployeeContent?.resizerService?.resizeGrid();
    this.angularGridCustomer?.resizerService?.resizeGrid();
    this.angularGridCustomerContent?.resizerService?.resizeGrid();
    this.angularGridFile?.resizerService?.resizeGrid();
  }
  //#endregion
}
