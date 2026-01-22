import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzUploadModule } from 'ng-zorro-antd/upload';
// import { SelectControlComponent } from '../../select-control/select-control.component';
import {
  TabulatorFull as Tabulator,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { forkJoin } from 'rxjs';
import { HandoverService } from '../handover-service/handover.service';
import { SelectControlComponent } from '../../../old/select-control/select-control.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';

interface Handover {
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
  Code: string;
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
  Status: number;
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
  SubordinateID: number;
  AssigneeID: number;
  ReceiverID: number;
  FullName: string;
  PositionName: string;
  SubordinateFullName: string;
  AssigneeFullName: string;
  ReceiverFullName: string;
}

interface HandoverApprove {
  STT: number;
  RoleName: string;
  EmployeeName: string;
  ApproveStatus: number;
}

@Component({
  selector: 'app-handover-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzSplitterModule,
    NzButtonModule,
    NzModalModule,
    FormsModule,
    NzCheckboxModule,
    NzUploadModule,
  ],
  templateUrl: './handover-form.component.html',
  styleUrl: './handover-form.component.css',
})
export class HandoverFormComponent implements OnInit, AfterViewInit {
  @Input() HandoverID: number | null = null;
  @Input() EmployeeID: number | null = null;
  @Input() LeaderID: number = 0;
  newHandover: Handover = {
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
    Code: '',
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
    Status: 0,
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
    SubordinateID: 0,
    AssigneeID: 0,
    ReceiverID: 0,
    FullName: '',
    PositionName: '',
    SubordinateFullName: '',
    AssigneeFullName: '',
    ReceiverFullName: '',
  };

  newHandoverApprove: HandoverApprove = {
    STT: 0,
    RoleName: '',
    EmployeeName: '',
    ApproveStatus: 0,
  };

  status: any = [];
  dateFormat = 'dd/MM/yyyy';
  activeTab = 0;
  cbbEmployee: any[] = [];
  dataDepartment: any[] = [];
  dataPosition: any[] = [];

  isCheckmode = false;

  // deletedHandoverReceiver: number[] = [];
  employeeOptions: any;

  handoverReceiverData: any[] = [];
  handoverReceiverTable: Tabulator | null = null;

  HandoverWorkData: any[] = [];
  handoverWorkTable: Tabulator | null = null;

  HandoverWarehouseAssetData: any[] = [];
  handoverWarehouseAssetTable: Tabulator | null = null;

  HandoverAssetManagementData: any[] = [];
  handoverAssetManagementTable: Tabulator | null = null;

  HandoverFinancesData: any[] = [];
  handoverFinancesTable: Tabulator | null = null;

  HandoverSubordinatesData: any[] = [];
  handoverSubordinatesTable: Tabulator | null = null;

  HandoverApproveData: any[] = [];
  handoverApproveTable: Tabulator | null = null;

  DeletedHandoverReceiver: any[] = [];
  DeletedAsset: any[] = [];
  DeletedWork: any[] = [];
  DeletedFinance: any[] = [];
  DeletedWarehouseAsset: any[] = [];
  cbbEmployeeGroup: any[] = [];

  height:string = '100%'

  employeeCode:string = '';

  constructor(
    private notification: NzNotificationService,
    private handoverService: HandoverService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) {
    this.status = [
      { value: 0, label: 'Chưa phê duyệt' },
      { value: 1, label: 'Đã phê duyệt' },
    ];
  }

  ngOnInit(): void {
    this.getdataPosition();
    this.getdataDepartment();
    this.getdataEmployee();
    this.loadOptionEmployee();
    if (!this.isCheckmode) {
      // Trường hợp thêm mới (reset dữ liệu)
      this.newHandover = {
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
        Code: '',
      };

      this.newHandoverReceiver = {
        STT: 0,
        EmployeeID: 0,
        Note: '',
      };

      this.newHandoverWork = {
        STT: 0,
        EmployeeID: 0,
        HandoverID: 0,
        ContentWork: '',
        Status: 0,
        Frequency: '',
        FileName: '',
        IsSigned: false,
        Note: '',
      };
      this.newHandoverWarehouseAsset = {
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
      this.newHandoverAssetManagement = {
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
      this.newHandoverFinance = {
        STT: 0,
        EmployeeID: 0,
        DebtType: '',
        DebtAmount: 0,
        FullName: '',
        Accountant: '',
      };
      this.newHandoverSubordinate = {
        STT: 0,
        EmployeeID: 0,
        SubordinateID: 0,
        AssigneeID: 0,
        ReceiverID: 0,
        FullName: '',
        PositionName: '',
        SubordinateFullName: '',
        AssigneeFullName: '',
        ReceiverFullName: '',
      };
      this.newHandoverApprove = {
        STT: 0,
        RoleName: '',
        EmployeeName: '',
        ApproveStatus: 0,
      };
    }
  }

  ngAfterViewInit(): void {
    if (this.isCheckmode) {
      this.loadHandoverData();
    }
    setTimeout(() => {
      this.onTabChange(0);
    }, 200);
  }

  onTabChange(index: number) {
    this.activeTab = index;
    // Initialize tables when tabs become active
    setTimeout(() => {
      if (index === 0 && !this.handoverReceiverTable) {
        this.draw_handoverReceiverTable();
      } else if (index === 1 && !this.handoverWorkTable) {
        this.draw_handoverWorkTable();
      } else if (index === 2 && !this.handoverAssetManagementTable) {
        this.draw_handoverAssetManagementTable();
      } else if (index === 3 && !this.handoverWarehouseAssetTable) {
        this.draw_handoverWarehouseAssetTable();
      } else if (index === 4 && !this.handoverFinancesTable) {
        this.draw_handoverFinanceTable();
      } else if (index === 5 && !this.handoverSubordinatesTable) {
        this.draw_handoverSubTable();
      } else if (index === 6 && !this.handoverApproveTable) {
        this.draw_handoverApproveTable();
      }
      this.cdr.detectChanges();
    }, 100); // Small delay to ensure DOM is ready
  }

  onSelectEmployee(employeeID: number, leaderID: number): void {
    if (!employeeID) return;
const selectedEmployee = this.cbbEmployeeGroup
    .flatMap((x: any) => x.employees)
    .find((emp: any) => emp.ID === employeeID);

  if (selectedEmployee) {
    this.employeeCode = selectedEmployee.Code;

  } else {
    this.employeeCode = ''; // trường hợp clear selection
  }
    // Tìm object nhân viên trong danh sách
    const employee = this.cbbEmployee.find((e: any) => e.ID === employeeID);

    if (!employee) return;

    const userId = employee.UserID || 0;
    const EmployeeID = employee.ID || 0;
    if (EmployeeID && EmployeeID > 0) {
      this.newHandover.EmployeeID = employee.ID;
    } else {
      this.newHandover.EmployeeID = employee.UserID || 0;
    }
    const selected = this.cbbEmployee.find((e: any) => e.ID === employeeID);
    if (selected) {
      this.newHandover.EmployeeID = selected.ID;
      this.newHandover.FullName = selected.FullName;
      this.newHandover.DepartmentID = selected.DepartmentID;
      this.newHandover.PositionID = selected.ChucVuHDID;
      this.newHandover.DepartmentName = selected.DepartmentName;
      this.newHandover.PositionName = selected.ChucVuHD;
      this.newHandover.HandoverDate = new Date();
    } else {
      // Nếu bỏ chọn (clear)
      this.newHandover.DepartmentID = 0;
      this.newHandover.PositionID = 0;
    }

    // Gọi API để lấy tài sản theo UserID
    this.handoverService.getHandoverData(0, userId, EmployeeID).subscribe({
      next: (response: any) => {
        const HandoverWarehouseAsset =
          response.data?.HandoverWarehouseAsset || [];
        const HandoverAssetManagement =
          response.data?.HandoverAssetManagement || [];
        const HandoverSubordinate = response.data?.HandoverSubordinate || [];
        const HandoverApprove = response.data?.HandoverApprove || [];

        this.HandoverWarehouseAssetData = HandoverWarehouseAsset.map(
          (item: any, index: number) => ({
            STT: index + 1,
            EmployeeID: 0,
            HandoverID: 0,
            ProductName: item.ProductName || '',
            ProductGroupName: item.ProductGroupName || '',
            BorrowQty: item.BorrowQty || 0,
            Unit: item.Unit || '',
            ReturnedStatusText: item.ReturnedStatusText || '',
            BorrowID: item.BorrowID || 0,
            IsSigned: false,
            ReceiverName: '',
            Note: '',
          })
        );

        if (this.handoverWarehouseAssetTable) {
          this.handoverWarehouseAssetTable.setData(
            this.HandoverWarehouseAssetData
          );
        }

        this.HandoverAssetManagementData = HandoverAssetManagement.map(
          (item: any, index: number) => ({
            STT: index + 1,
            EmployeeID: 0,
            TSAssetCode: item.TSCodeNCC || '',
            TSAssetName: item.TSAssetName || '',
            Quantity: item.Quantity || '',
            UnitName: item.UnitName || '',
            Status: item.Status || '',
            IsSigned: false,
            ReceiverName: '',
            Note: '',
          })
        );

        if (this.handoverAssetManagementTable) {
          this.handoverAssetManagementTable.setData(
            this.HandoverAssetManagementData
          );
          console.log("hehe: ", this.HandoverAssetManagementData)
        }

        this.HandoverSubordinatesData = HandoverSubordinate.map(
          (item: any, index: number) => ({
            STT: index + 1,
            SubordinateID: item.SubordinateID || 0,
            AssigneeID: item.AssigneeID || 0,
            ReceiverID: item.ReceiverID || 0,
            FullName: item.FullName || '',
            PositionName: item.Name || '',
            SubordinateFullName: item.SubordinateFullName || '',
            AssigneeFullName: item.AssigneeFullName || '',
            ReceiverFullName: item.ReceiverFullName || '',
          })
        );

        if (this.handoverSubordinatesTable) {
          this.handoverSubordinatesTable.setData(this.HandoverSubordinatesData);
        }

        if (this.isCheckmode == false) {
          this.HandoverApproveData = HandoverApprove.map(
            (item: any, index: number) => ({
              ID: item.ID,
              STT: index + 1,
              HandoverID: item.HandoverID,
              EmployeeID: item.EmployeeID,
              RoleName: item.RoleName || '',
              ApproveLevel: item.ApproveLevel,
              ApproveStatus: 0,
            })
          );

          if (this.handoverApproveTable) {
            this.handoverApproveTable.setData(this.HandoverApproveData);
          }
        }
      },
    });
  }

  loadHandoverData() {
    if (!this.HandoverID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thiếu ID handover !');
      return;
    }

    forkJoin({
      master: this.handoverService.getHandoverID(this.HandoverID),
      details: this.handoverService.getHandoverData(
        this.HandoverID,
        this.EmployeeID ?? undefined,
        this.LeaderID ?? undefined
      ),
    }).subscribe({
      next: ({ master, details }) => {
        if (!master?.data) {
          this.notification.warning(
            'Thông báo',
            master?.message || 'Không thể lấy thông tin biên bản!'
          );
          return;
        }

        const handover = master.data;
        const handoverReceiver = details?.data?.HandoverReceiver || [];
        const handoverWork = details?.data?.HandoverWork || [];
        const handoverWarehouseAsset =
          details?.data?.HandoverWarehouseAsset || [];
        const handoverAssetManagement =
          details?.data?.HandoverAssetManagement || [];
        const handoverFinance = details?.data?.HandoverFinance || [];
        const handoverSubordinate = details?.data?.HandoverSubordinate || [];
        const handoverApprove = details?.data?.HandoverApprove || [];

        // --------- Master data ----------
        this.newHandover = {
          // ...this.newMakerTraining,
          STT: handover.STT || 0,
          EmployeeID: handover.EmployeeID || 0,
          FullName: handover.FullName || '',
          DepartmentID: handover.DepartmentID || 0,
          PositionID: handover.PositionID || 0,
          DepartmentName: handover.DepartmentName || '',
          PositionName: handover.TenChucVu || '',
          IsApprove: handover.IsApprove || false,
          HandoverDate: handover.HandoverDate,
          Note: handover.Note || '',
          Code: handover.Code || '',
        };

        // --------- Handover Receiver ----------
        this.handoverReceiverData = handoverReceiver.map((item: any) => ({
          ID: item.ID || 0,
          STT: item.STT || 0,
          EmployeeID: item.EmployeeID || 0,
          FullName: item.FullName || '',
          DepartmentName: item.Name || '',
          Note: item.Note || '',
        }));

        this.handoverReceiverTable?.setData(this.handoverReceiverData);

        // --------- Handover Work ----------
        this.HandoverWorkData = handoverWork.map((item: any) => ({
          ID: item.ID || 0,
          STT: item.STT || 0,
          EmployeeID: item.EmployeeID || 0,
          HandoverID: item.HandoverID || 0,
          ContentWork: item.ContentWork || '',
          Status: item.Status || 0,
          Frequency: item.Frequency || '',
          FileName: item.FileName || '',
          IsSigned: item.IsSigned || false,
          Note: item.Note || '',
        }));

        this.handoverWorkTable?.setData(this.HandoverWorkData);

        // --------- Handover Warehouse Asset ----------
        this.HandoverWarehouseAssetData = handoverWarehouseAsset.map(
          (item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            HandoverID: item.HandoverID || 0,
            FullName: item.FullName || '',
            ProductName: item.ProductName || '',
            ProductGroupName: item.ProductGroupName || '',
            BorrowQty: item.BorrowQty || 0,
            Unit: item.Unit || '',
            ReturnedStatusText: item.ReturnedStatusText || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
            BorrowID: item.BorrowID || 0,
          })
        );

        this.handoverWarehouseAssetTable?.setData(
          this.HandoverWarehouseAssetData
        );

        // --------- Handover Asset ----------
        this.HandoverAssetManagementData = handoverAssetManagement.map(
          (item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            HandoverID: item.HandoverID || 0,
            TSAssetCode: item.TSCodeNCC || '',
            TSAssetName: item.TSAssetName || '',
            Quantity: item.Quantity || 0,
            UnitName: item.UnitName || '',
            Status: item.Status || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
          })
        );

        this.handoverAssetManagementTable?.setData(
          this.HandoverAssetManagementData
        );

        // --------- Handover Finance ----------
        this.HandoverFinancesData = handoverFinance.map((item: any) => ({
          ID: item.ID || 0,
          STT: item.STT || 0,
          EmployeeID: item.EmployeeID || 0,
          DebtType: item.DebtType || '',
          DebtAmount: item.DebtAmount || 0,
          FullName: item.FullName || '',
          AccountantID: item.AccountantID || 0,
        }));

        this.handoverFinancesTable?.setData(this.HandoverFinancesData);

        // --------- Handover Subor ----------
        this.HandoverSubordinatesData = handoverSubordinate.map(
          (item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            SubordinateID: item.SubordinateID || 0,
            AssigneeID: item.AssigneeID || 0,
            ReceiverID: item.ReceiverID || 0,
            FullName: item.FullName || '',
            PositionName: item.Name || '',
            SubordinateFullName: item.SubordinateFullName || '',
            AssigneeFullName: item.AssigneeFullName || '',
            ReceiverFullName: item.ReceiverFullName || '',
          })
        );

        this.handoverSubordinatesTable?.setData(this.HandoverSubordinatesData);

        // --------- Handover Approve ----------
        this.HandoverApproveData = handoverApprove.map((item: any) => ({
          ID: item.ID || 0,
          STT: item.STT || 0,
          Handover: item.HandoverID || 0,
          EmployeeID: item.EmployeeID || 0,
          RoleName: item.RoleName || '',
          ApproveLevel: item.ApproveLevel || 0,
          ApproveStatus: item.ApproveStatus || 0,
        }));
        this.handoverApproveTable?.setData(this.HandoverApproveData);
      },

      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi load dữ liệu biên bản!');
      },
    });
  }

  closeModal() {
    this.activeModal.close(true);
  }

  //search
  filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

  getdataPosition() {
    this.handoverService.getDataPosition().subscribe((response: any) => {
      this.dataPosition = response.data || [];
    });
  }

  getdataEmployee() {
    this.handoverService.getAllEmployee().subscribe((response: any) => {
      const data = response.data || [];
      this.cbbEmployee = data;

      // Gom nhóm theo phòng ban
      const groupMap = new Map<string, any[]>();
      data.forEach((item: any) => {
        if (!groupMap.has(item.DepartmentName)) {
          groupMap.set(item.DepartmentName, []);
        }
        groupMap.get(item.DepartmentName)?.push(item);
      });

      this.cbbEmployeeGroup = Array.from(
        groupMap,
        ([department, employees]) => ({
          department,
          employees,
        })
      );
    });
  }

  getdataDepartment() {
    this.handoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

//   handleChange(info: any): void {
//     if (info.file.status === 'uploading') {
//     }
//     if (info.file.status === 'done') {
//       this.notification.success(NOTIFICATION_TITLE.success, 'Upload file thành công!');

//       const res = info.file.response;

//       const uploadedFile = {
//         FileName: res.FileName,
//         HandoverID: res.HandoverID,
//       };
//       this.handoverWorkTable?.addRow(uploadedFile);
//     }
//     if (info.file.status === 'error') {
//       this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi upload!');
//     }
//   }


uploadFileForRow(rowData: any) {
    const input = document.createElement('input');
    
    input.type = 'file';
    input.accept = '*/*';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const filesToUpload = [file];
      const year = new Date().getFullYear().toString();
      const code = this.employeeCode;
      const sanitize = (s: string) =>
        s.replace(/[<>:"/\\|?*\u001F]/g, '').trim();

      const subPath = [
        // 'Handover',
        sanitize(year),
        sanitize(code),
        sanitize(rowData.ContentWork || 'Work'),
      ].join('/');

      // Gọi API upload
      this.handoverService
        .uploadMultipleFiles(filesToUpload, subPath)
        .subscribe({
          next: (res) => {
            if (
              res.status === 1 &&
              Array.isArray(res.data) &&
              res.data.length > 0
            ) {
              const uploaded = res.data[0];
              console.log('upload:', uploaded);

              // Cập nhật dữ liệu hàng
              rowData.FileName = uploaded.OriginalFileName;
              this.notification.success(
                'Thông báo',
                `Upload thành công file: ${uploaded.OriginalFileName}`
              );
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, 'Upload thất bại');
            }
          },
          error: (err) => {
            console.error('Lỗi upload:', err);
            this.notification.error(
              'Thông báo',
              'Upload thất bại: ' + (err.error?.message || err.message)
            );
          },
        });
    };

    input.click();
  }

  toLocalISOString(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error('Invalid date input');
    }
    const tzOffset = 7 * 60; // GMT+7, tính bằng phút
    const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000);
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

  saveData(): void {
    // Validation
    // if (
    //   !this.newHandover.DepartmentID ||
    //   !this.newHandover.EmployeeID ||
    //   !this.newHandover.HandoverDate ||
    //   !this.newHandover.PositionID
    // ) {
    //   this.notification.warning(
    //     'Thông báo',
    //     'Vui lòng điền đầy đủ thông tin người bàn giao!'
    //   );
    //   return;
    // }

    const missingFields: string[] = [];

    if (!this.newHandover.DepartmentID) {
      missingFields.push('Phòng ban');
    }
    if (!this.newHandover.EmployeeID) {
      missingFields.push('Người bàn giao');
    }
    if (!this.newHandover.HandoverDate) {
      missingFields.push('Ngày bàn giao');
    }
    if (!this.newHandover.PositionID) {
      missingFields.push('Chức vụ');
    }

    if (missingFields.length > 0) {
      this.notification.warning(
        'Thông báo',
        `Vui lòng điền đầy đủ thông tin trường ${missingFields.join(
          ', '
        )} của người bàn giao! `
      );
      return;
    }

    const isEdit =
      this.handoverReceiverData && this.handoverReceiverData.length > 0;

    if (isEdit) {
      // validate theo bảng Tabulator
      if (!this.handoverReceiverData.every((x: any) => x.EmployeeID > 0)) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin người nhận bàn giao!'
        );
        return;
      }
    } else {
      // validate theo form thêm mới
      if (!this.newHandoverReceiver.EmployeeID) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin Người nhận bàn giao!'
        );
        return;
      }
    }

    const hasWorkData =
      this.HandoverWorkData && this.HandoverWorkData.length > 0;

    if (hasWorkData) {
      const invalidIndex = this.HandoverWorkData.findIndex(
        (x: any) => !x.EmployeeID || x.EmployeeID <= 0
      );

      if (invalidIndex !== -1) {
        const work = this.HandoverWorkData[invalidIndex];
        this.notification.warning(
          'Thông báo',
          `Dòng số ${invalidIndex + 1}${
            work?.ContentWork ? ` nội dung công việc ${work.ContentWork}` : ''
          } thiếu người nhận bàn giao.`
        );
        return;
      }
    }

    const hasFinance =
      this.HandoverFinancesData && this.HandoverFinancesData.length > 0;
    if (hasFinance) {
      // validate theo bảng Tabulator
      const invalidIndex = this.HandoverFinancesData.findIndex(
        (x: any) => x.AccountantID <= 0 && x.EmployeeID
      );
      if (invalidIndex !== -1) {
        this.notification.warning(
          'Thông báo',
          `Dòng số ${
            invalidIndex + 1
          } chưa điền thông tin kế toán trong Công nợ!`
        );
        return;
      }
    }

    const hasApprove =
      this.HandoverApproveData && this.HandoverApproveData.length > 0;
    if (hasApprove) {
      // validate theo bảng Tabulator
      const invalidIndex = this.HandoverApproveData.findIndex(
        (x: any) => x.EmployeeID <= 0
      );
      if (invalidIndex !== -1) {
        this.notification.warning(
          'Thông báo',
          `Dòng số ${
            invalidIndex + 1
          } chưa điền thông tin người duyệt biên bản trong Duyệt !`
        );
        return;
      }
    }

    const hasAssetData =
      this.HandoverAssetManagementData &&
      this.HandoverAssetManagementData.length > 0;

    // Trường hợp có bảng tài sản (SỬA)
    if (hasAssetData) {
      if (
        !this.HandoverAssetManagementData.every(
          (x: any) => x.EmployeeID > 0 && x.TSAssetCode
        )
      ) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin người nhận bàn giao tài sản cấp phát!'
        );
        return;
      }
    } else {
      // Trường hợp thêm mới (form đơn)
      if (
        this.newHandoverAssetManagement.STT > 0 &&
        !this.newHandoverAssetManagement.EmployeeID
      ) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin người nhận bàn giao tài sản cấp phát!'
        );
        return;
      }
    }
    const hasWarehouseAssetData =
      this.HandoverWarehouseAssetData &&
      this.HandoverWarehouseAssetData.length > 0;

    // Trường hợp có bảng tài sản (SỬA)
    if (hasWarehouseAssetData) {
      if (
        !this.HandoverWarehouseAssetData.every(
          (x: any) => x.EmployeeID > 0 && x.BorrowID
        )
      ) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin người nhận bàn giao tài sản kho!'
        );
        return;
      }
    } else {
      // Trường hợp thêm mới (form đơn)
      if (
        this.newHandoverWarehouseAsset.STT > 0 &&
        !this.newHandoverWarehouseAsset.EmployeeID
      ) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng điền đầy đủ thông tin người nhận bàn giao tài sản kho!'
        );
        return;
      }
    }
    const hasSubData =
      this.HandoverSubordinatesData && this.HandoverSubordinatesData.length > 0;

    if (hasSubData) {
      // Duyệt từng dòng để check từng trường
      for (let i = 0; i < this.HandoverSubordinatesData.length; i++) {
        const item = this.HandoverSubordinatesData[i];
        if (item.SubordinateID > 0) {
          if (!item.AssigneeID) {
            this.notification.warning(
              'Thông báo',
              `Dòng số ${
                i + 1
              } chưa điền đầy đủ thông tin Người đảm nhận trong Nhân viên trực thuộc!`
            );
            return;
          }
          if (!item.ReceiverID) {
            this.notification.warning(
              'Thông báo',
              `Dòng số ${
                i + 1
              } chưa điền đầy đủ thông tin Người nhận bàn giao trong Nhân viên trực thuộc!`
            );
            return;
          }
        }
      }
    } else {
      // Trường hợp thêm mới (form đơn)
      const newItem = this.newHandoverSubordinate;
      if (newItem.STT > 0 && newItem.SubordinateID > 0) {
        if (!newItem.AssigneeID) {
          this.notification.warning(
            'Thông báo',
            'Vui lòng điền thông tin Người đảm nhận cho nhân viên trực thuộc!'
          );
          return;
        }
        if (!newItem.ReceiverID) {
          this.notification.warning(
            'Thông báo',
            'Vui lòng điền thông tin Người nhận bàn giao cho nhân viên trực thuộc!'
          );
          return;
        }
      }
    }

    if (this.isCheckmode == true) {
      // Update mode
      const payload = {
        Handover: {
          ID: this.HandoverID,
          EmployeeID: this.newHandover.EmployeeID,
          DepartmentID: this.newHandover.DepartmentID,
          PositionID: this.newHandover.PositionID,
          IsApprove: this.newHandover.IsApprove,
          HandoverDate: this.newHandover.HandoverDate
            ? this.toLocalISOString(this.newHandover.HandoverDate)
            : '',
          Note: this.newHandover.Note,
          Code: this.newHandover.Code,
        },
        HandoverReceiver: [
          ...(this.handoverReceiverTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || '',
            DepartmentName: item.Name || '',
            Note: item.Note || '',
          })) || []),
        ],
        HandoverWork: [
          ...(this.handoverWorkTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            HandoverID: item.HandoverID || 0,
            EmployeeID: item.EmployeeID || 0,
            ContentWork: item.ContentWork || '',
            Status: item.Status || 0,
            Frequency: item.Frequency || '',
            FileName: item.FileName || '',
            IsSigned: item.IsSigned || false,
            Note: item.Note || '',
          })) || []),
        ],
        HandoverWarehouseAsset: [
          ...(this.handoverWarehouseAssetTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || '',
            HandoverID: item.HandoverID || 0,
            ProductName: item.ProductName || '',
            ProductGroupName: item.ProductGroupName || '',
            BorrowQty: item.BorrowQty || 0,
            Unit: item.Unit || '',
            ReturnedStatusText: item.ReturnedStatusText || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
            BorrowID: item.BorrowID || 0
          })) || []),
        ],
        HandoverAssetManagement: [
          ...(this.handoverAssetManagementTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            TSAssetCode: item.TSCodeNCC || '',
            TSAssetName: item.TSAssetName || '',
            Quantity: item.Quantity || '',
            UnitName: item.UnitName || '',
            Status: item.Status || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
          })) || []),
        ],
        HandoverFinance: [
          ...(this.handoverFinancesTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            DebtType: item.DebtType || '',
            DebtAmount: item.DebtAmount || 0,
            FullName: item.FullName || 0,
            AccountantID: item.AccountantID || 0,
          })) || []),
        ],
        HandoverSubordinate: [
          ...(this.handoverSubordinatesTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            SubordinateID: item.SubordinateID || 0,
            AssigneeID: item.AssigneeID || 0,
            ReceiverID: item.ReceiverID || 0,
            FullName: item.FullName || '',
            PositionName: item.Name || '',
            SubordinateFullName: item.SubordinateFullName || '',
            AssigneeFullName: item.AssigneeFullName || '',
            ReceiverFullName: item.ReceiverFullName || '',
          })) || []),
        ],
        HandoverApprove: [
          ...(this.handoverApproveTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            RoleName: item.RoleName || '',
            ApproveLevel: item.ApproveLevel || 0,
            ApproveStatus: item.ApproveStatus || 0,
          })) || []),
        ],
        DeletedHandoverReceiver: this.DeletedHandoverReceiver,
        DeletedWork: this.DeletedWork,
        DeletedFinance: this.DeletedFinance,
      };
      this.handoverService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể cập nhật !'
            );
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi cập nhật!');
        },
      });
    } else {
      // Insert mode
      const payload = {
        Handover: {
          ID: 0,
          STT: this.newHandover.STT,
          EmployeeID: this.newHandover.EmployeeID,
          DepartmentID: this.newHandover.DepartmentID,
          PositionID: this.newHandover.PositionID,
          IsApprove: this.newHandover.IsApprove,
          HandoverDate: this.newHandover.HandoverDate
            ? this.toLocalISOString(this.newHandover.HandoverDate)
            : '',
          Note: this.newHandover.Note,
          Code: this.newHandover.Code,
        },
        HandoverReceiver: [
          ...(this.handoverReceiverTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            HandoverID: item.HandoverID || 0,
            FullName: item.FullName || '',
            DepartmentName: item.Name || '',
            Note: item.Note || '',
          })) || []),
        ],
        HandoverWork: [
          ...(this.handoverWorkTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            HandoverID: item.HandoverID || 0,
            EmployeeID: item.EmployeeID || 0,
            ContentWork: item.ContentWork || '',
            Status: item.Status || 0,
            Frequency: item.Frequency || '',
            FileName: item.FileName || '',
            IsSigned: item.IsSigned || false,
          })) || []),
        ],
        HandoverWarehouseAsset: [
          ...(this.handoverWarehouseAssetTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            HandoverID: item.HandoverID || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || 0,
            ProductName: item.ProductName || '',
            ProductGroupName: item.ProductGroupName || '',
            BorrowQty: item.BorrowQty || 0,
            Unit: item.Unit || '',
            ReturnedStatusText: item.ReturnedStatusText || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
            BorrowID: item.BorrowID || 0,
          })) || []),
        ],
        HandoverAssetManagement: [
          ...(this.handoverAssetManagementTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            HandoverID: item.HandoverID || 0,
            TSAssetCode: item.TSCodeNCC || '',
            TSAssetName: item.TSAssetName || '',
            Quantity: item.Quantity || '',
            UnitName: item.UnitName || '',
            Status: item.Status || '',
            IsSigned: item.IsSigned || false,
            ReceiverName: item.ReceiverName || '',
            Note: item.Note || '',
          })) || []),
        ],
        HandoverFinance: [
          ...(this.handoverFinancesTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            HandoverID: item.HandoverID || 0,
            EmployeeID: item.EmployeeID || 0,
            DebtType: item.DebtType || '',
            DebtAmount: item.DebtAmount || 0,
            FullName: item.FullName || 0,
            AccountantID: item.AccountantID || 0,
          })) || []),
        ],
        HandoverSubordinate: [
          ...(this.handoverSubordinatesTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            SubordinateID: item.SubordinateID || 0,
            AssigneeID: item.AssigneeID || 0,
            ReceiverID: item.ReceiverID || 0,
            HandoverID: item.HandoverID || 0,
            FullName: item.FullName || '',
            PositionName: item.Name || '',
            SubordinateFullName: item.SubordinateFullName || '',
            AssigneeFullName: item.AssigneeFullName || '',
            ReceiverFullName: item.ReceiverFullName || '',
          })) || []),
        ],
        HandoverApprove: [
          ...(this.handoverApproveTable?.getData().map((item: any) => ({
            ID: item.ID || 0,
            STT: item.STT || 0,
            EmployeeID: item.EmployeeID || 0,
            ApproveLevel: item.ApproveLevel || 0,
            ApproveStatus: item.ApproveStatus || 0,
          })) || []),
        ],
        DeletedHandoverReceiver: this.DeletedHandoverReceiver,
        DeletedWork: this.DeletedWork,
        DeletedFinance: this.DeletedFinance,
      };

      this.handoverService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể thêm mới biên bản họp!'
            );
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi thêm mới!');
        },
      });
    }
  }

  loadOptionEmployee() {
    this.handoverService.getDataEmployee(0).subscribe({
      next: (res: any) => {
        const employeeData = res.data.asset;
        if (Array.isArray(employeeData)) {
          this.employeeOptions = employeeData
            .filter(
              (employee) =>
                employee.ID !== null &&
                employee.ID !== undefined &&
                employee.ID !== 0
            )
            .map((employee) => ({
              label: employee.FullName, // Label gốc
              value: employee.ID,
              FullName: employee.FullName,
              DepartmentName:
                employee.DepartmentName || 'Không thuộc phòng ban',
              ChucVuHD: employee.ChucVuHD,
            }))
            .sort((a: any, b: any) => {
              // Sắp xếp theo phòng ban, rồi tên
              if (a.DepartmentName !== b.DepartmentName) {
                return a.DepartmentName.localeCompare(b.DepartmentName);
              }
              return a.FullName.localeCompare(b.FullName);
            })
            .map((employee: any) => {
              // Thêm prefix để rõ nhóm
              employee.label = `${employee.DepartmentName} - ${employee.FullName}`;
              return employee;
            });
        } else {
          this.employeeOptions = [];
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy danh sách nhân viên'
        );
        this.employeeOptions = [];
      },
    });
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  draw_handoverReceiverTable() {
    if (this.handoverReceiverTable) {
      this.handoverReceiverTable.replaceData(this.handoverReceiverData);
    } else {
      this.handoverReceiverTable = new Tabulator('#handoverReceiver', {
        data: this.handoverReceiverData,
        layout: 'fitColumns',
        height: this.height,
        placeholder: 'Không có dữ liệu',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRow();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const rowIndex = this.handoverReceiverData.indexOf(rowData);
                    if (rowData['ID']) {
                      this.DeletedHandoverReceiver.push(rowData['ID']);
                    }
                    row.delete();
                    this.handoverReceiverData =
                      this.handoverReceiverData.filter((x) => x !== rowData);
                    // this.saveData();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Tên nhân viên',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProject) {
                row.update({
                  DepartmentName: selectedProject.DepartmentName,
                });
                this.newHandoverReceiver.EmployeeID = selectedProject.value;
              }
            },
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            headerHozAlign: 'center',
            editor: 'input',
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
  addRow() {
    if (this.handoverReceiverTable) {
      this.handoverReceiverTable.addRow({
        STT: 0,
        EmployeeID: 0,
        FullName: '',
        DepartmentName: '',
        Note: '',
      });
    }
  }

  draw_handoverWorkTable() {
    if (this.handoverWorkTable) {
      this.handoverWorkTable.replaceData(this.HandoverWorkData);
    } else {
      this.handoverWorkTable = new Tabulator('#handoverWork', {
        data: this.HandoverWorkData,
        layout: 'fitColumns',
        height: '100%',
        placeholder: 'Không có dữ liệu',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRowWork();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const rowIndex = this.HandoverWorkData.indexOf(rowData);
                    if (rowData['ID']) {
                      this.DeletedWork.push(rowData['ID']);
                    }
                    row.delete();
                    this.HandoverWorkData = this.HandoverWorkData.filter(
                      (x) => x !== rowData
                    );
                    // this.saveData();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Nội dung công việc',
            field: 'ContentWork',
            headerHozAlign: 'center',
            editor: 'textarea',
            minWidth: 400,
            widthGrow: 2,
          },
          {
            title: 'Trạng thái',
            field: 'Status',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              switch (value) {
                case 0:
                  return 'Chưa hoàn thành';
                case 1:
                  return 'Hoàn thành';
                case 2:
                  return 'Đang tiến hành';
                default:
                  return '';
              }
            },
            editor: 'list',
            editorParams: {
              values: [
                { label: 'Chưa hoàn thành', value: 0 },
                { label: 'Hoàn thành', value: 1 },
                { label: 'Đang tiến hành', value: 2 },
              ],
            },
          },

          {
            title: 'Tần suất',
            field: 'Frequency',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'File đính kèm',
            field: 'FileName',
            formatter: (cell) => {
              const fileName = cell.getValue(); // lấy FileName từ rowData
              if (fileName) {
                return `<span>${fileName}</span>`;
              }
              return `<button class="btn btn-sm btn-primary">Upload</button>`;
            },
            cellClick: (e, cell) => {
              const rowData = cell.getRow().getData();
              this.uploadFileForRow(rowData);
            },
            width: 150,
            hozAlign: 'center',
          },
          {
            title: 'Nhân viên nhận bàn giao',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
            },
          },
          {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            editor: 'tickCross',
            formatter: 'tickCross',
            editorParams: { tristate: false },
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
  addRowWork() {
    if (this.handoverWorkTable) {
      this.handoverWorkTable.addRow({
        STT: 0,
        EmployeeID: 0,
        ContentWork: '',
        Status: 0,
        Frequency: '',
        FileName: '',
        IsSigned: '',
        Note: '',
      });
    }
  }

  draw_handoverWarehouseAssetTable() {
    if (this.handoverWarehouseAssetTable) {
      this.handoverWarehouseAssetTable.replaceData(
        this.HandoverWarehouseAssetData
      );
    } else {
      this.handoverWarehouseAssetTable = new Tabulator('#handoverWarehouse', {
        data: this.HandoverWarehouseAssetData,
        layout: 'fitColumns',
        height: this.height,
        movableColumns: true,
        placeholder: 'Không có dữ liệu',
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Tên tài sản',
            field: 'ProductName',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Kho',
            field: 'ProductGroupName',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Số lượng',
            field: 'BorrowQty',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Đơn vị tính',
            field: 'Unit',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Tình trạng',
            field: 'ReturnedStatusText',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Nhân viên nhận bàn giao',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              this.newHandoverWarehouseAsset.EmployeeID = selectedProject.value;
            },
          },
            {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            editor: 'tickCross',
            formatter: 'tickCross',
            editorParams: { tristate: false },
          },

          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'BorrowID',
            field: 'BorrowID',
            headerHozAlign: 'center',
            visible: false,
          },
        ],
      });
    }
  }

  draw_handoverAssetManagementTable() {
    if (this.handoverAssetManagementTable) {
      this.handoverAssetManagementTable.replaceData(
        this.HandoverAssetManagementData
      );
    } else {
      this.handoverAssetManagementTable = new Tabulator('#handoverAsset', {
        data: this.HandoverAssetManagementData,
        layout: 'fitColumns',
        height: this.height,
        movableColumns: true,
        placeholder: 'Không có dữ liệu',
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Mã tài sản',
            field: 'TSAssetCode',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Tên tài sản',
            field: 'TSAssetName',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Số lượng',
            field: 'Quantity',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Đơn vị tính',
            field: 'UnitName',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Tình trạng',
            field: 'Status',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Nhân viên nhận bàn giao',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProject) {
                this.newHandoverAssetManagement.EmployeeID =
                  selectedProject.value;
                // this.newHandoverAssetManagement.STT = selectedProject.value;
              }
            },
          },
           {
            title: 'Ký nhận',
            field: 'IsSigned',
            headerHozAlign: 'center',
            hozAlign: 'center',
            editor: 'tickCross',
            formatter: 'tickCross',
            editorParams: { tristate: false },
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

  draw_handoverFinanceTable() {
    if (this.handoverFinancesTable) {
      this.handoverFinancesTable.replaceData(this.HandoverFinancesData);
    } else {
      this.handoverFinancesTable = new Tabulator('#handoverFinance', {
        data: this.HandoverFinancesData,
        layout: 'fitColumns',
        height: this.height,
        movableColumns: true,
        placeholder: 'Không có dữ liệu',
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRowFinance();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const rowIndex = this.HandoverFinancesData.indexOf(rowData);
                    if (rowData['ID']) {
                      this.DeletedFinance.push(rowData['ID']);
                    }
                    row.delete();
                    this.HandoverFinancesData =
                      this.HandoverFinancesData.filter((x) => x !== rowData);
                    // this.saveData();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Vấn đề tồn tại',
            field: 'DebtType',
            headerHozAlign: 'center',
            editor: 'textarea',
          },
          {
            title: 'Số tiền',
            field: 'DebtAmount',
            headerHozAlign: 'center',
            editor: 'input',
            formatter: 'money',
            hozAlign: 'right',
            formatterParams: {
              decimal: ',',
              thousand: '.',
              symbol: ' VNĐ',
              symbolAfter: true,
              precision: 0,
            },
            mutator: (value) => {
              // Loại bỏ ký tự không phải số khi lưu lại
              if (!value) return 0;
              return parseInt(value.toString().replace(/[^\d]/g, '')) || 0;
            },
          },
          {
            title: 'Kế toán theo dõi',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
            },
          },
          {
            title: 'Kế toán trưởng',
            field: 'AccountantID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              // if (selectedProject) {
              //   row.update({
              //     DepartmentName: selectedProject.DepartmentName,
              //   });
              // }
            },
          },
        ],
      });
    }
  }
  addRowFinance() {
    if (this.handoverFinancesTable) {
      this.handoverFinancesTable.addRow({
        STT: 0,
        EmployeeID: 0,
        DebtType: '',
        DebtAmount: 0,
        FullName: '',
      });
    }
  }

  draw_handoverSubTable() {
    if (this.handoverSubordinatesTable) {
      this.handoverSubordinatesTable.replaceData(this.HandoverSubordinatesData);
    } else {
      this.handoverSubordinatesTable = new Tabulator('#handoverSubordinate', {
        data: this.HandoverSubordinatesData,
        layout: 'fitColumns',
        height: this.height,
        movableColumns: true,
        placeholder: 'Không có dữ liệu',
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          { title: 'Vị trí', field: 'PositionName', headerHozAlign: 'center' },
          {
            title: 'Tên nhân viên',
            field: 'SubordinateFullName',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
            },
          },
          {
            title: 'Người đảm nhận',
            field: 'AssigneeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
            },
          },
          {
            title: 'Người nhận bàn giao',
            field: 'ReceiverID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              // if (selectedProject) {
              //   row.update({
              //     DepartmentName: selectedProject.DepartmentName,
              //   });
              // }
            },
          },
        ],
      });
    }
  }

  draw_handoverApproveTable() {
    if (this.handoverApproveTable) {
      this.handoverApproveTable.replaceData(this.HandoverApproveData);
    } else {
      this.handoverApproveTable = new Tabulator('#handoverApprove', {
        data: this.HandoverApproveData,
        layout: 'fitColumns',
        height: this.height,
        movableColumns: true,
        placeholder: 'Không có dữ liệu',
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            formatter: 'rownum',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Chức vụ',
            field: 'RoleName',
            headerHozAlign: 'center',
            widthGrow: 2,
          },
          {
            title: 'Họ và tên',
            field: 'EmployeeID',
            headerHozAlign: 'center',
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.FullName : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              // if (selectedProject) {
              //   row.update({
              //     ChucVuHD: selectedProject.ChucVuHD,
              //   });
              // }
            },
          },
          {
            title: 'Trạng thái',
            field: 'ApproveStatus',
            headerHozAlign: 'center',
            hozAlign: 'center',
            // widthGrow: 1,
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
        ],
      });
    }
  }
  // addRowApprove() {
  //   if (this.handoverApproveTable) {
  //     this.handoverApproveTable.addRow({
  //       STT: 0,
  //       EmployeeID: 0,
  //       RoleName: '',
  //       ApproveStatus: 0,
  //     });
  //   }
  // }
}
