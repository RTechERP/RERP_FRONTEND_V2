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
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

declare var bootstrap: any;
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HandoverService } from './handover-service/handover.service';
import { HandoverFormComponent } from './handover-form/handover-form.component';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
// @ts-ignore
import { saveAs } from 'file-saver';
import { HandoverRejectreasonFormComponent } from './handover-rejectreason-form/handover-rejectreason-form.component';

interface Handover {
  ID: number;
  STT: number;
  EmployeeID: number;
  FullName: string;
  DepartmentID: number;
  PositionID: number;
  DepartmentName: string;
  PositionName: string;
  IsApprove: boolean;
  HandoverDate: Date | null;
  Note: string;

  DateStart: Date;
 DateEnd: Date;
}

interface HandoverReceiver {
  STT: number;
  EmployeeID: number;
  Note: string;
}

interface HandoverWork {
  STT: number;
  HandoverID: number;
  EmployeeID: number;
  ContentWork: string;
  Status: boolean;
  Frequency: string;
  FileName: string;
  IsSigned: boolean;
  Note: string;
}

interface HandoverWarehouseAsset {
  STT: number;
  EmployeeID: number;
  HandoverID: number;
  ProductName: string;
  ProductGroupName: string;
  BorrowQty: number;
  Unit: string;
  ReturnedStatusText: string;
  IsSigned: boolean;
  ReceiverName: string;
  Note: string;
}

interface HandoverAssetManagement {
  STT: number;
  EmployeeID: number;
  TSAssetCode: string;
  TSAssetName: string;
  Quantity: number;
  UnitName: string;
  Status: string;
  IsSigned: boolean;
  ReceiverName: string;
  Note: string;
}

interface HandoverFinance {
  STT: number;
  EmployeeID: number;
  DebtType: string;
  DebtAmount: number;
  FullName: string;
  Accountant: string;
}

interface HandoverSubordinate {
  STT: number;
  EmployeeID: number;
  FullName: string;
  PositionName: string;
  SubordinateFullName: string;
  Undertaker: string;
  ReceiverFullName: string;
}

interface HandoverApprove {
  STT: number;
  RoleName: string;
  EmployeeName: string;
  ApproveStatus: number;
}

@Component({
  selector: 'app-handover',
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
  ],
  templateUrl: './handover.component.html',
  styleUrl: './handover.component.css',
})
export class HandoverComponent implements OnInit, AfterViewInit {
  newHandover: Handover = {
    ID: 0,
    STT: 0,
    EmployeeID: 0,
    FullName: '',
    DepartmentID: 0,
    PositionID: 0,
    DepartmentName: '',
    PositionName: '',
    IsApprove: false,
    HandoverDate: null,
    Note: '',
    DateStart: new Date(),
    DateEnd: new Date(),
  };

  newHandoverReceiver: HandoverReceiver = {
    STT: 0,
    EmployeeID: 0,
    Note: '',
  };

  newHandoverWork: HandoverWork = {
    STT: 0,
    EmployeeID: 0,
    HandoverID: 0,
    ContentWork: '',
    Status: false,
    Frequency: '',
    FileName: '',
    IsSigned: false,
    Note: '',
  };

  newHandoverWarehouseAsset: HandoverWarehouseAsset = {
    STT: 0,
    EmployeeID: 0,
    HandoverID: 0,
    ProductName: '',
    ProductGroupName: '',
    BorrowQty: 0,
    Unit: '',
    ReturnedStatusText: '',
    IsSigned: false,
    ReceiverName: '',
    Note: '',
  };

  newHandoverAssetManagement: HandoverAssetManagement = {
    STT: 0,
    EmployeeID: 0,
    TSAssetCode: '',
    TSAssetName: '',
    Quantity: 0,
    UnitName: '',
    Status: '',
    IsSigned: false,
    ReceiverName: '',
    Note: '',
  };

  newHandoverFinance: HandoverFinance = {
    STT: 0,
    EmployeeID: 0,
    DebtType: '',
    DebtAmount: 0,
    FullName: '',
    Accountant: '',
  };

  newHandoverSubordinate: HandoverSubordinate = {
    STT: 0,
    EmployeeID: 0,
    FullName: '',
    PositionName: '',
    SubordinateFullName: '',
    Undertaker: '',
    ReceiverFullName: '',
  };

  newHandoverApprove: HandoverApprove = {
    STT: 0,
    RoleName: '',
    EmployeeName: '',
    ApproveStatus: 0,
  };
  sizeSearch: string = '0';
  isCheckmode: boolean = false;
  activeTab = 0;

  dateFormat = 'dd/MM/yyyy';
  searchParams = {
    DepartmentID: 0,
    EmployeeID: 0,
    LeaderID: 0,
    Keyword: '',
    DateStart: new Date(),
    DateEnd: new Date(),

  };

  handoverList: any[] = [];
  HandoverData: any[] = [];
  handoverTable: Tabulator | null = null;
  HandoverID: number = 0;
  data: any[] = [];

  HandoverReceiverData: any[] = []; 
  handoverReceiverTable: Tabulator | null = null;

  HandoverWorkData: any[] = [];
  handoverWorkTable: Tabulator | null = null;

  HandoverWarehouseAssetData: any[] = [];
  handoverWarehouseAssetTable: Tabulator | null = null;

  HandoverAssetManagement: any[] = [];
  handoverAssetManagementTable: Tabulator | null = null;

  HandoverFinancesData: any[] = [];
  handoverFinancesTable: Tabulator | null = null;

  HandoverSubordinatesData: any[] = [];
  handoverSubordinatesTable: Tabulator | null = null;

  HandoverApproveData: any[] = [];
  handoverApproveTable: Tabulator | null = null;

  dataDepartment: any[] = [];
  // cbbEmployee: any[] = [];
  cbbEmployee: Array<{ department: string; items: any[] }> = [];

  handoverStatusGiver: number = 0; // trạng thái người bàn giao
  handoverStatusLeader: number = 0; // trạng thái trưởng bộ phận
  handoverStatusManager: number = 0; // trạng thái trưởng phòng HCNS
  tableData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private HandoverService: HandoverService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.getHandover();
    this.getdataDepartment();
    this.getdataEmployee();

//      const startDate = this.searchParams.DateStart;
//     startDate.setFullYear(startDate.getFullYear() - 1);
// this.searchParams.DateEnd = new Date(new Date(this.searchParams.DateEnd).setDate(new Date(this.searchParams.DateEnd).getDate() + 1));
  }

  ngAfterViewInit(): void {
    this.draw_handoverTable();
    this.draw_handoverReceiverTable();
    // Initialize the first tab by default
    setTimeout(() => {
      this.onTabChange(0);
    }, 200);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  searchData() {
    this.getHandover();
  }

  //search
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

     toLocalISOString(date: Date | string): string {
  // Chuyển đổi chuỗi thành Date nếu cần
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Kiểm tra xem dateObj có hợp lệ không
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new Error('Invalid date input');
  }

  const tzOffset = 7 * 60; // GMT+7, tính bằng phút
  const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000); // Điều chỉnh sang GMT+7
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

  return (
    adjustedDate.getUTCFullYear() +
    '-' +
    pad(adjustedDate.getUTCMonth() + 1) +
    '-' +
    pad(adjustedDate.getUTCDate()) +
    'T' +
    pad(adjustedDate.getUTCHours()) +
    ':' +
    pad(adjustedDate.getUTCMinutes()) +
    ':' +
    pad(adjustedDate.getUTCSeconds())
  ); // Trả về định dạng YYYY-MM-DDTHH:mm:ss
}


  onTabChange(index: number) {
    this.activeTab = index;
    // Initialize tables when tabs become active
    setTimeout(() => {
      if (index === 0 && !this.handoverWorkTable) {
        this.draw_handoverWorkTable();
      } else if (
        index === 1 &&
        !this.handoverWarehouseAssetTable &&
        !this.handoverAssetManagementTable
      ) {
        this.draw_handoverAssetTable();
        this.draw_handoverAssetManagementTable();
      } else if (index === 2 && !this.handoverFinancesTable) {
        this.draw_handoverFinancesTable();
      } else if (index === 3 && !this.handoverSubordinatesTable) {
        this.draw_handoverSubordinatesTable();
      } else if (index === 4 && !this.handoverApproveTable) {
        this.draw_handoverApproveTable();
      }
      this.cdr.detectChanges();
    }, 100);
  }

  getHandover(): void {

    console.log(this.searchParams);
    this.HandoverService.getHandover(
      this.searchParams.DepartmentID,
      this.searchParams.EmployeeID,
      this.searchParams.LeaderID,
      this.searchParams.Keyword,
    //   this.searchParams.DateStart,
    this.searchParams.DateStart,
      this.searchParams.DateEnd
    //   this.toLocalISOString(this.searchParams.DateStart),
    //   this.toLocalISOString(this.searchParams.DateEnd)
    ).subscribe((response: any) => {
      this.HandoverData = response.data?.asset || [];
      if (this.handoverTable) {
        this.handoverTable.setData(this.HandoverData || []);
      } else {
        this.draw_handoverTable();
      }
    });
  }

  getHandoverDataByID(
    HandoverID?: number,
    EmployeeID?: number,
    LeaderID?: number
  ): void {
    this.HandoverService.getHandoverData(
      HandoverID,
      EmployeeID,
      LeaderID
    ).subscribe((response: any) => {
      // Dữ liệu người nhận bàn giao
      this.HandoverReceiverData = response.data?.HandoverReceiver || [];
      if (this.handoverReceiverTable) {
        this.handoverReceiverTable.setData(this.HandoverReceiverData || []);
      } else {
        this.draw_handoverReceiverTable();
      }

      // Dữ liệu công việc bàn giao
      this.HandoverWorkData = response.data?.HandoverWork || [];
      if (this.handoverWorkTable) {
        this.handoverWorkTable.setData(this.HandoverWorkData || []);
      } else {
        // Only initialize if tab is active or will be initialized on tab change
        if (this.activeTab === 0) {
          this.draw_handoverWorkTable();
        }
      }

      // Dữ liệu tài sản quản lý bàn giao
      this.HandoverAssetManagement =
        response.data?.HandoverAssetManagement || [];
      if (this.handoverAssetManagementTable) {
        this.handoverAssetManagementTable.setData(
          this.HandoverAssetManagement || []
        );
      } else {
        if (this.activeTab === 1) {
          this.draw_handoverAssetManagementTable();
        }
      }

      // Dữ liệu tài sản kho quản lý bàn giao
      this.HandoverWarehouseAssetData =
        response.data?.HandoverWarehouseAsset || [];
      if (this.handoverWarehouseAssetTable) {
        this.handoverWarehouseAssetTable.setData(
          this.HandoverWarehouseAssetData || []
        );
      } else {
        if (this.activeTab === 1) {
          this.draw_handoverAssetManagementTable();
        }
      }

      // Dữ liệu công nợ quản lý bàn giao
      this.HandoverFinancesData = response.data?.HandoverFinance || [];
      if (this.handoverFinancesTable) {
        this.handoverFinancesTable.setData(this.HandoverFinancesData || []);
      } else {
        if (this.activeTab === 2) {
          this.draw_handoverFinancesTable();
        }
      }

      // Dữ liệu nhân viên trực thuộc quản lý bàn giao
      this.HandoverSubordinatesData = response.data?.HandoverSubordinate || [];
      if (this.handoverSubordinatesTable) {
        this.handoverSubordinatesTable.setData(
          this.HandoverSubordinatesData || []
        );
      } else {
        if (this.activeTab === 3) {
          this.draw_handoverSubordinatesTable();
        }
      }

      // Dữ liệu duyệt quản lý bàn giao
      this.HandoverApproveData = response.data?.HandoverApprove || [];

      const giverApprove = this.HandoverApproveData.find(x => x.STT === 1);
      this.handoverStatusGiver = giverApprove?.ApproveStatus ?? 0;

      if (this.handoverApproveTable) {
        this.handoverApproveTable.setData(this.HandoverApproveData || []);
      } else {
        if (this.activeTab === 4) {
          this.draw_handoverApproveTable();
        }
      }
    });
  }

  getdataDepartment() {
    this.HandoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }
  getdataEmployee() {
    this.HandoverService.getAllEmployee().subscribe((response: any) => {
      const data = response.data || [];

      // Gom nhóm theo DepartmentName
      const grouped = data.reduce((acc: any[], curr: any) => {
        const dept = curr.DepartmentName || 'Khác';
        let group = acc.find((x) => x.department === dept);
        if (!group) {
          group = { department: dept, items: [] };
          acc.push(group);
        }
        group.items.push(curr);
        return acc;
      }, []);

      this.cbbEmployee = grouped;
    });
  }

  approveHandover(handoverId: number, stt: number, status: number) {
  if (status === 2) {
    const modalRef = this.modal.create({
      nzTitle: 'Nhập lý do hủy duyệt',
      nzContent: HandoverRejectreasonFormComponent,
      nzFooter: null 
    });

    modalRef.afterClose.subscribe((reason: string) => {
      if (!reason) {
        this.notification.warning('Thông báo', 'Bạn phải nhập lý do để hủy duyệt!');
        return;
      }
      this.approveAction(handoverId, stt, status, null, reason.trim());
      this.getHandoverDataByID(this.HandoverID);
      this.updateHandoverStatus(stt, status);
    });
  } else {
    this.approveAction(handoverId, stt, status, null, null);
    this.getHandoverDataByID(this.HandoverID);
    this.updateHandoverStatus(stt, status);
  }
}

// Hàm tiện ích cập nhật trạng thái hiển thị
private updateHandoverStatus(stt: number, status: number) {
  if (stt === 1) this.handoverStatusGiver = status;
  if (stt === 2) this.handoverStatusLeader = status;
  if (stt === 3) this.handoverStatusManager = status;
}
approveAction(
  handoverId: number,
  stt: number,
  status: number,
  cell: any,
  rejectReason: string | null
) {
  const body = [
    {
      HandoverID: handoverId,
      STT: stt,
      ApproveStatus: status,
      RejectReason: rejectReason || '' 
    },
  ];

  this.HandoverService.approve(body).subscribe({
    next: (res) => {
      if (res?.status === 1) {
        if (cell) {
          const row = cell.getRow();
          const rowData = row.getData();
          rowData.ApproveStatus = status;
          rowData.RejectReason = rejectReason || '';
          row.update({ ApproveStatus: status, RejectReason: rejectReason || '' });
        }

        if (status === 1) {
          this.notification.success('Thông báo', 'Đã duyệt thành công!');
        } else if (status === 2) {
          this.notification.warning('Thông báo', 'Đã hủy duyệt thành công!');
        }
      } else if (res?.status === 0 && res?.message) {
        this.notification.error('Thông báo', res.message);
      } else {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi duyệt!');
      }
    },
    error: (err) => {
      const msg = err?.error?.message || 'Có lỗi xảy ra!';
      this.notification.error('Thông báo', msg);
    },
  });
}

  onAddHandover(isEditmode: boolean): void {
    this.isCheckmode = isEditmode;
    if (this.isCheckmode == true && this.HandoverID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 bản ghi để sửa!');
      return;
    }

    var selectableRows = this.handoverTable?.getSelectedRows();
    var EmployeeID =
      selectableRows && selectableRows.length > 0
        ? selectableRows[0].getData()['EmployeeID']
        : null;
    var LeaderID =
      selectableRows && selectableRows.length > 0
        ? selectableRows[0].getData()['LeaderID']
        : null;

    const modalRef = this.modalService.open(HandoverFormComponent, {
      fullscreen:true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.HandoverID = this.HandoverID;
    modalRef.componentInstance.EmployeeID = EmployeeID;
    modalRef.componentInstance.LeaderID = LeaderID;

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.getHandover();
          this.draw_handoverTable();
        }
      })
      .catch(() => {});
  }

  onDeleteHandover() {
    const dataSelect: Handover[] = this.handoverTable!.getSelectedData();
    const id = dataSelect[0].FullName;
    const payloads = {
      Handover: {
        ...dataSelect[0],
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      },
      HandoverWarehouseAsset: [],
      HandoverAssetManagement: [],
      HandoverSubordinate: [],
      HandoverApprove: [],
      HandoverReceiver: this.HandoverReceiverData.map((e) => ({
        ...e,
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      })),
      HandoverWork: this.HandoverWorkData.map((d) => ({
        ...d,
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      })),
      HandoverFinance: this.HandoverFinancesData.map((d) => ({
        ...d,
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      })),
      DeletedHandoverReceiver: [],
      DeletedAsset: [],
      DeletedWork: [],
      DeletedFinance: [],
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].FullName} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.HandoverService.saveData(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.getHandover();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

  exportExcel(id: number, customFileName?: string): void {
    const fileName = customFileName || `Bien_ban_nghi_viec_${id}.xlsx`;

    // Hiện thông báo đang tải
    const loadingMsg = this.message.loading('Đang xuất Excel...', {
      nzDuration: 0,
    }).messageId;

    this.HandoverService.exportExcel(id).subscribe({
      next: (blob: Blob) => {
        // Ẩn thông báo đang tải
        this.message.remove(loadingMsg);

        if (!blob || blob.size === 0) {
          this.notification.error(
            'Thông báo',
            'Không có dữ liệu để xuất Excel!'
          );
          return;
        }

        saveAs(blob, fileName);
        this.notification.success('Thông báo', 'Xuất Excel thành công!');
      },
      error: (err) => {
        this.message.remove(loadingMsg);
        this.notification.error(
          'Thông báo',
          'Xuất Excel thất bại! Vui lòng thử lại.'
        );
      },
    });
  }

  private draw_handoverTable(): void {
    if (this.handoverTable) {
      this.handoverTable.setData(this.HandoverData || []);
    } else {
      this.handoverTable = new Tabulator('#Handover', {
        data: this.HandoverData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        groupBy: [
          (data) => {
            return data.DepartmentName
              ? `Phòng ban: ${
                  data.DepartmentName ? `  ${data.DepartmentName}` : ''
                }`
              : 'Phòng ban: ';
          },
        ],
        groupStartOpen: true,
        groupToggleElement: 'header',
        groupHeader: (value, count, data, group) => {
          return value;
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
          },
          { title: 'Họ và tên', field: 'FullName', headerHozAlign: 'center' },
          {
            title: 'Chức vụ',
            field: 'TenChucVu',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            headerHozAlign: 'center',
          },
          {
            title: 'Thời gian bắt đầu làm việc',
            field: 'StartWorking',
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
            title: 'Thời gian bàn giao',
            field: 'HandoverDate',
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
            title: 'Duyệt',
            field: 'IsApprove',
            hozAlign: 'center',
            formatter: (cell) => {
              return cell.getValue()
                ? "<i class='fas fa-check text-success'></i>"
                : "<i class='fas fa-times text-danger'></i>";
            },
          },
          {
            title: 'Địa điểm làm việc',
            field: 'DiaDiemLamViec',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          },
        ],
      });
      this.handoverTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        const mouseEvent = e as MouseEvent;
        this.getHandoverDataByID(
          rowData['ID'],
          rowData['EmployeeID'],
          rowData['LeaderID']
        );
      });
      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.handoverTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.HandoverID = this.data[0].ID;
      });
      this.handoverTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.handoverTable!.getSelectedRows();
        this.HandoverID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data
        }
      });
    }
  }

  private draw_handoverReceiverTable(): void {
    if (this.handoverReceiverTable) {
      this.handoverReceiverTable.setData(this.HandoverReceiverData || []);
    } else {
      this.handoverReceiverTable = new Tabulator('#HandoverReceiver', {
        data: this.HandoverReceiverData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Tên người nhận bàn giao',
            field: 'FullName',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'Name',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }

  private draw_handoverWorkTable(): void {
    if (this.handoverWorkTable) {
      this.handoverWorkTable.setData(this.HandoverWorkData || []);
    } else {
      this.handoverWorkTable = new Tabulator('#HandoverWork', {
        data: this.HandoverWorkData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          width: 20,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            minWidth: 100,
            widthGrow: 1,
          },
          {
            title: 'Nội dung công việc',
            field: 'ContentWork',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue() || '';
              return `<div style="white-space: normal; word-break: break-word;">${value.replace(
                /\n/g,
                '<br>'
              )}</div>`;
            },

            minWidth: 400,
            widthGrow: 2,
          },
          {
            title: 'Tình trạng',
            field: 'StatusText',
            headerHozAlign: 'center',
            minWidth: 150,
            widthGrow: 1,
          },
          {
            title: 'Tần suất hoàn thành',
            field: 'Frequency',
            headerHozAlign: 'center',
            minWidth: 50,
            widthGrow: 1,
          },
          {
            title: 'File đính kèm',
            field: 'FileName',
            minWidth: 200,
            widthGrow: 2,
            headerHozAlign: 'center',
            formatter: function (cell) {
              const url = cell.getValue();
              if (!url) return '';

              const fileName = url.split('/').pop(); // lấy tên file từ URL
              return `
                <a 
                  href="${url}" 
                  download="${fileName}" 
                  style="color:#007bff; text-decoration:underline; cursor:pointer;"
                >
                  ${fileName}
                </a>
              `;
            },
          },

          {
            title: 'Người nhận',
            field: 'FullName',
            headerHozAlign: 'center',
            minWidth: 300,
            widthGrow: 2,
          },
          {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: 'tickCross', 
            formatterParams: {
              allowEmpty: true, 
            },
          },
        ],
      });
    }
  }

  private draw_handoverAssetManagementTable(): void {
    if (this.handoverAssetManagementTable) {
      this.handoverAssetManagementTable.setData(
        this.HandoverAssetManagement || []
      );
    } else {
      this.handoverAssetManagementTable = new Tabulator(
        '#HandoverAssetManagement',
        {
          data: this.HandoverAssetManagement || [],
          layout: 'fitDataStretch',
          selectableRows: 1,
          height: '100%',
          movableColumns: true,
          reactiveData: true,
          placeholder: 'Không có dữ liệu',
          addRowPos: 'bottom',
          history: true,
          rowHeader: {
            headerSort: false,
            resizable: false,
            frozen: true,
            formatter: 'rowSelection',
            headerHozAlign: 'center',
            hozAlign: 'center',
            titleFormatter: 'rowSelection',
            cellClick: (e: any, cell: any) => {
              e.stopPropagation();
            },
          },
          columns: [
            {
              title: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'STT',
            },
            {
              title: 'Mã tài sản',
              field: 'TSAssetCode',
              headerHozAlign: 'center',
              minWidth: 200,
              widthGrow: 1,
            },
            {
              title: 'Tên tài sản',
              field: 'TSAssetName',
              headerHozAlign: 'center',
              minWidth: 400,
              widthGrow: 2,
            },
            {
              title: 'Số lượng',
              field: 'Quantity',
              headerHozAlign: 'center',
              minWidth: 100,
              widthGrow: 1,
            },
            {
              title: 'Đơn vị tính',
              field: 'UnitName',
              headerHozAlign: 'center',
              minWidth: 100,
              widthGrow: 1,
            },
            {
              title: 'Tình trạng',
              field: 'Status',
              headerHozAlign: 'center',
              minWidth: 100,
              widthGrow: 1,
            },
            {
              title: 'Người nhận',
              field: 'ReceiverName',
              headerHozAlign: 'center',
              minWidth: 300,
              widthGrow: 2,
            },
              {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: 'tickCross', 
            formatterParams: {
              allowEmpty: true, 
            },
          },
          ],
        }
      );
    }
  }

  private draw_handoverAssetTable(): void {
    if (this.handoverWarehouseAssetTable) {
      this.handoverWarehouseAssetTable.setData(
        this.HandoverWarehouseAssetData || []
      );
    } else {
      this.handoverWarehouseAssetTable = new Tabulator('#HandoverAsset', {
        data: this.HandoverWarehouseAssetData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Tên tài sản',
            field: 'ProductName',
            headerHozAlign: 'center',
            minWidth: 400,
            widthGrow: 2,
          },
          {
            title: 'Kho',
            field: 'ProductGroupName',
            headerHozAlign: 'center',
            minWidth: 100,
            widthGrow: 2,
          },
          {
            title: 'Số lượng',
            field: 'BorrowQty',
            headerHozAlign: 'center',
            minWidth: 100,
            widthGrow: 1,
          },
          {
            title: 'Đơn vị tính',
            field: 'Unit',
            headerHozAlign: 'center',
            minWidth: 100,
            widthGrow: 1,
          },
          {
            title: 'Tình trạng',
            field: 'ReturnedStatusText',
            headerHozAlign: 'center',
            minWidth: 200,
            widthGrow: 1,
          },
          {
            title: 'Người nhận bàn giao',
            field: 'ReceiverName',
            headerHozAlign: 'center',
            minWidth: 300,
            widthGrow: 2,
          },
             {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: 'tickCross', 
            formatterParams: {
              allowEmpty: true, 
            },
          },

          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            editor: 'input',
          },
        ],
      });
    }
  }

  private draw_handoverFinancesTable(): void {
    if (this.handoverFinancesTable) {
      this.handoverFinancesTable.setData(this.HandoverFinancesData || []);
    } else {
      this.handoverFinancesTable = new Tabulator('#HandoverFinances', {
        data: this.HandoverFinancesData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          width: 20,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            minWidth: 100,
            widthGrow: 1,
          },
          {
            title: 'Vấn đề tồn tại',
            field: 'DebtType',
            headerHozAlign: 'center',
            minWidth: 400,
            widthGrow: 2,
            formatter: (cell) => {
              const value = cell.getValue() || '';
              return `<div style="white-space: normal; word-break: break-word;">${value.replace(
                /\n/g,
                '<br>'
              )}</div>`;
            },
          },
          {
            title: 'Số tiền',
            field: 'DebtAmount',
            headerHozAlign: 'center',
            minWidth: 300,
            hozAlign: 'right',
            widthGrow: 1,
            formatter: 'money',
            formatterParams: {
              decimal: ',',
              thousand: '.',
              symbol: ' VNĐ',
              symbolAfter: true,
              precision: 0,
            },
          },
          {
            title: 'Kế toán theo dõi',
            field: 'FullName',
            headerHozAlign: 'center',
            hozAlign: 'center',
            minWidth: 400,
            widthGrow: 2,
          },
          {
            title: 'Kế toán trưởng',
            field: 'Accountant',
            headerHozAlign: 'center',
            hozAlign: 'center',
            minWidth: 400,
            widthGrow: 2,
          },
        ],
      });
    }
  }

  private draw_handoverSubordinatesTable(): void {
    if (this.handoverSubordinatesTable) {
      this.handoverSubordinatesTable.setData(
        this.HandoverSubordinatesData || []
      );
    } else {
      this.handoverSubordinatesTable = new Tabulator('#HandoverSubordinates', {
        data: this.HandoverSubordinatesData || [],
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          width: 20,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            width: 100,
            widthGrow: 1,
          },
          {
            title: 'Vị trí',
            field: 'Name',
            headerHozAlign: 'center',
            minWidth: 250,
            widthGrow: 1,
          },
          {
            title: 'Tên nhân viên',
            field: 'SubordinateFullName',
            headerHozAlign: 'center',
            minWidth: 350,
            widthGrow: 2,
          },
          {
            title: 'Người đảm nhận',
            field: 'AssigneeFullName',
            headerHozAlign: 'center',
            minWidth: 350,
            widthGrow: 2,
          },
          {
            title: 'Người nhận bàn giao',
            field: 'ReceiverFullName',
            headerHozAlign: 'center',
            minWidth: 350,
            widthGrow: 2,
          },
        ],
      });
    }
  }

  private draw_handoverApproveTable(): void {
    if (this.handoverApproveTable) {
      this.handoverApproveTable.setData(this.HandoverApproveData || []);
    } else {
      this.handoverApproveTable = new Tabulator('#HandoverApprove', {
        data: this.HandoverApproveData || [],
        layout: 'fitColumns',
        selectableRows: 1,
        height: '100%',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          width: 20,
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            minWidth: 100,
            widthGrow: 1,
          },
          {
            title: 'Chức vụ',
            field: 'RoleName',
            headerHozAlign: 'center',
            widthGrow: 2,
            minWidth: 150,
          },
          {
            title: 'Họ và tên',
            field: 'EmployeeName',
            headerHozAlign: 'center',
            widthGrow: 2,
            minWidth: 250,
          },
          {
            title: 'Trạng thái',
            field: 'ApproveStatus',
            headerHozAlign: 'center',
            hozAlign: 'center',
            widthGrow: 1,
            minWidth: 150,
            formatter: function (cell) {
              const value = cell.getValue();
              switch (value) {
                case 1:
                  return "<span style='color: green; font-weight: 600;'>Đã duyệt</span>";
                case 2:
                  return "<span style='color: red; font-weight: 600;'>Hủy duyệt</span>";
                default:
                  return "<span style='color: gray;'>Chưa duyệt</span>";
              }
            },
          },
          {
            title: 'Người duyệt thực tế',
            field: 'ApproverName',
            headerHozAlign: 'center',
            widthGrow: 2,
            minWidth: 250,
          },

          {
            title: 'Ngày duyệt',
            field: 'ApproveDate',
            headerHozAlign: 'center',
            widthGrow: 2,
            minWidth: 250,
          },

          {
            title: 'Lý do hủy',
            field: 'RejectReason',
            headerHozAlign: 'center',
            widthGrow: 3,
            minWidth: 250,
            formatter: 'textarea',
          },
        ],
      });
    }
  }
}
