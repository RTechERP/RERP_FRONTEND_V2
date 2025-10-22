import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import { AuthService } from '../../../auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { TsAssetAllocationPersonalService } from '../ts-asset-allocation-personal/ts-asset-allocation-personal-service/ts-asset-allocation-personal.service';
import { CommonModule } from '@angular/common';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { TsAssetRecoveryPersonalService } from './ts-asset-recovery-personal-service/ts-asset-recovery-personal.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
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

  ],
  selector: 'app-ts-asset-recovery-personal',
  templateUrl: './ts-asset-recovery-personal.component.html',
  styleUrls: ['./ts-asset-recovery-personal.component.css']
})
export class TsAssetRecoveryPersonalComponent implements OnInit, AfterViewInit {
  @ViewChild('addRecoveryModal') modalElement!: ElementRef;
  constructor(
    private tsAssetAllocationPersonalService: TsAssetAllocationPersonalService,
    private tsAssetRecoveryPersonalService: TsAssetRecoveryPersonalService,
    private notification: NzNotificationService,
    private assetManagementPersonalService: TsAssetManagementPersonalService,
    private authService: AuthService
  ) { }
  isSearchVisible: boolean = false;
  dateStart: string = '';
  dateEnd: string = '';
  employeeRecoveryID: number | null = null;
  employeeReturnID: number | null = null;
  status: number = -1;
  TSTHcode: string = "";
  assetPersonals: any[] = [];
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  recoveryDate: string = "";
  maxSTT: number = 0;
  assetRecoveryPersonalData: any[] = [];
  assetRecoveryModal: any[] = [];
  assetRocoveryDetail: any[] = [];
  tbAssetRecoveryPersonal: Tabulator | null = null;
  tbAssetRecoveryDetail: Tabulator | null = null;
  tbAssetPersonModal: Tabulator | null = null;
  emPloyeeLists: any[] = [];
  employeeID: number | null = null;
  selectedEmployee: any = null;
  selectedEmployeeReturnID: any | null = null;
  selectedEmployeeRecoveryID: any | null = null;
  selectedDepartmentReturnName: string = '';
  selectedPositionReturnName: String = '';
  selectedDepartmentRecoveryName: string = '';
  selectedPositionRecoveryName: String = '';
  editingID: number = 0;
  Size: number = 100000;
  Page: number = 1;
  DateStart: Date = new Date(2024, 0, 1);   // 2000-01-01
  DateEnd: Date = new Date(2026, 0, 1);   // 2099-01-01
  EmployeeRecoveryID: number = 0;
  EmployeeReturnID: number = 0;
  TypeID: number = 0;
  FilterText: string = '';
  VehicleID: number = 0;
  editMode: boolean = false;
  currentUser: any | null = null;
  ngOnInit() {
    this.generateTSAssetCode();
    this.getCurrentUsser();

  }
  ngAfterViewInit(): void {
    //  this.getAssetRecoveryPersonals();

    this.drawTbRecoveryPersonal();
    this.drawRecoveryDetail();
    this.getListEmployee();
    this.generateTSAssetCode();
    this.getAssetManagementPersonal();
    this.drawTbAssetManagementModal();
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      this.employeeID = null;
      this.selectedEmployee = null;
    });
  }
  getCurrentUsser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const u = res?.data;
      this.currentUser = u || null;
      this.employeeRecoveryID = u?.EmployeeID ?? null;


      if (u?.ID) this.onEmployeeRecoverySelect(u.ID);
    });
  }
  getAssetManagementPersonal() {
    this.tsAssetAllocationPersonalService.getAssetManagementPersonal().subscribe((respon: any) => {
      this.assetPersonals = respon.data;
      if (this.tbAssetPersonModal) {
        this.tbAssetPersonModal.setData(this.assetPersonals);
      }
    })
  }
  getAssetRecoveryPersonals() {
    const request = {
      dateStart: this.dateStart || '2020-01-01',
      dateEnd: this.dateEnd || '2028-12-31',
      employeeRecoveryID: this.employeeRecoveryID || 0,
      employeeReturnID: this.employeeReturnID || 0,
      status: this.status || -1,
      filterText: this.filterText || '',
      pageSize: 2000,
      pageNumber: 1
    }
    this.tsAssetRecoveryPersonalService.getAssetRecoveryPersonal(request).subscribe((respon: any) => {
      this.assetRecoveryPersonalData = respon.assetsrecoveryPersonal;
      this.maxSTT = respon.maxSTT;
      this.tbAssetRecoveryPersonal?.setData(respon.assetsrecoveryPersonal);
    })
  }
  private toIsoStart(d: Date) { const t = new Date(d); t.setHours(0, 0, 0, 0); return t.toISOString(); }
  private toIsoEnd(d: Date) { const t = new Date(d); t.setHours(23, 59, 59, 999); return t.toISOString(); }

  drawTbRecoveryPersonal() {
    this.tbAssetRecoveryPersonal = new Tabulator('#dataTbRecovery',
      {
        ...DEFAULT_TABLE_CONFIG,
        layout: "fitDataStretch",
        ajaxURL: this.tsAssetRecoveryPersonalService.getAssetRecoveryAjax(),
        ajaxConfig: 'POST',
        ajaxRequestFunc: (url, config, params) => {
          const request = {
            DateStart: this.toIsoStart(this.DateStart),
            DateEnd: this.toIsoEnd(this.DateEnd),
            EmployeeReturnID: this.EmployeeReturnID ?? 0,
            EmployeeRecoveryID: this.EmployeeRecoveryID ?? 0,
            Status: 0,
            FilterText: this.FilterText ?? '',
            PageSize: params?.size || 50,
            PageNumber: params?.page || 1,
          };
          console.log("Request..,", request);
          return this.tsAssetRecoveryPersonalService.getAssetRecoveryPersonal(request).toPromise();
        },
        ajaxResponse: (url, params, response) => {
          console.log('response', response);
          return {
            data: response.data.dataList || [],
            last_page: response.data.TotalPage?.[0]?.TotalPage || 1,
          };
        },
        columns: [
          { title: 'ID', field: 'ID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
          { title: 'EmployeeReturnID', field: 'EmployeeReturnID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
          { title: 'EmployeeRecoveryID', field: 'EmployeeRecoveryID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
          { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'Mã biên bản', field: 'Code', hozAlign: 'center', headerHozAlign: 'center', width: 200, bottomCalc: 'count' },
          {
            title: 'Cá Nhân Duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} onclick="return false;" />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center'
          },
          {
            title: 'HR Duyệt',
            field: 'IsApproveHR',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} onclick="return false;" />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center'
          },
          {
            title: 'Ngày duyệt cá nhân',
            field: 'DateApprovedPersonalProperty',

            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: cell => {
              const v = cell.getValue();
              if (!v) return '';
              const d = new Date(v);
              return d.toLocaleDateString('vi-VN');
            }
          },
          {
            title: 'Ngày duyệt HR',
            field: 'DateApprovedHR',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: cell => {
              const v = cell.getValue();
              if (!v) return '';
              const d = new Date(v);
              return d.toLocaleDateString('vi-VN');
            }
          },
          {
            title: 'Ngày thu hồi',
            field: 'DateRecovery',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: cell => {
              const v = cell.getValue();
              if (!v) return '';
              const d = new Date(v);
              return d.toLocaleDateString('vi-VN');
            }
          },
          { title: 'Thu hồi từ', field: 'FullNameReturn', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Người thu hồi', field: 'FullNameRecovery', hozAlign: 'left', headerHozAlign: 'center' },

          { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' },
        ]
      });
    this.tbAssetRecoveryPersonal.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const id = rowData['ID'];
      this.tsAssetRecoveryPersonalService.getAssetRecoveryDetail(id).subscribe(res => {
        const details = res.data;
        this.assetRocoveryDetail = details;
        this.drawRecoveryDetail(); if (this.tbAssetRecoveryDetail) {
          this.tbAssetRecoveryDetail.setData(this.assetRocoveryDetail);
        }
      });
    });
    this.tbAssetRecoveryPersonal.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.tbAssetRecoveryPersonal?.deselectRow();
      row.select();
      this.openEditModal();
    });
    this.tbAssetRecoveryPersonal.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    })
  }
  validateRecoveryForm(): boolean {
    let isValid = true;
    if (!this.recoveryDate) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày thu hồi!');
      isValid = false;
    }
    if (!this.employeeReturnID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên thu hồi từ!');
      isValid = false;
    }
    if (!this.employeeRecoveryID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn người thu hồi!');
      isValid = false;
    }
    return isValid;
  }
  saveRecoveryPersonal() {
    if (!this.validateRecoveryForm()) return;

    const isEdit = !!this.editMode && (this.editingID ?? 0) > 0;
    const today = new Date();
    const selectAssetModal = this.tbAssetPersonModal?.getData() || [];
    if (selectAssetModal.length === 0) {
      this.notification.warning("Thông báo", "Không có tài sản nào trong danh sách để lưu");
      return;
    }

    const recoveryID = this.editingID || 0;
    const recoveryDetails = selectAssetModal.map((row: any, index: number) => {

      const detailId = isEdit ? (row.ID ?? 0) : 0;

      const tsAssetId = row.TSAssetManagementPersonalID ?? row.ID;

      return {
        ID: detailId,
        STT: index + 1,
        TSAssetManagementPersonal: row.TSAssetManagementPersonalID,
        TSRecoveryAssetPersonalID: recoveryID,
        Note: row.Note || '',
        CreatedDate: today.toISOString().split('T')[0],
        CreatedBy: 'AdminSW',
        UpdateDate: today.toISOString().split('T')[0],
        UpdateBy: 'AdminSW',
        IsDeleted: false,
        IsAllocation: (row.IsAllocation === true || row.IsAllocation === 'true' || row.IsAllocation === 1)
      };
    });

    const payload = {
      tSRecoveryAssetPersonal: {
        ID: recoveryID,
        STT: this.maxSTT + 1,
        Code: this.TSTHcode,
        DateRecovery: this.recoveryDate,
        EmployeeReturnID: this.employeeReturnID,
        EmployeeRecoveryID: this.employeeRecoveryID,
        IsApproveHR: false,
        IsApprovedPersonalProperty: false,
        CreatedDate: today.toISOString().split('T')[0],
        CreatedBy: 'AdminSW',
        UpdateDate: today.toISOString().split('T')[0],
        UpdateBy: 'AdminSW',
        IsDeleted: false
      },
      tSRecoveryAssetPersonalDetails: recoveryDetails
    };
    console.log(payload);
    this.tsAssetAllocationPersonalService.saveAssetAllocationPerson(payload).subscribe({
      next: (res) => {
        if (res.status === 1) { this.notification.success("Thông báo", "Lưu thành công"); this.closeModal(); this.getAssetRecoveryPersonals(); }
        else this.notification.warning("Thông báo", "Lưu thất bại");
      },
      error: () => this.notification.warning("Thông báo", "Lỗi kết nối máy chủ")
    });
  }

  searchData(): void {
    this.tbAssetRecoveryPersonal?.setData();
  }
  resetFilters(): void {
    const now = DateTime.now();
    this.EmployeeRecoveryID = 0;
    this.EmployeeReturnID = 0;

    this.FilterText = '';
    this.DateStart = now.startOf('month').toJSDate();
    this.DateEnd = now.endOf('month').toJSDate();
    this.searchData();
  }
  closeModal() {
    const modalEl = document.getElementById('addRecoveryModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
    // Reset form
    this.TSTHcode = '';
    this.recoveryDate = "";
    this.employeeID = null;
    this.employeeReturnID = null;
    this.employeeRecoveryID = null;
    this.selectedEmployee = null;

    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.deselectRow?.();
      this.tbAssetPersonModal.setData([]);
    }
  }
  generateTSAssetCode(date?: string): void {
    const d = date || this.recoveryDate || new Date().toISOString().split('T')[0];
    this.recoveryDate = d;

    this.tsAssetRecoveryPersonalService.getTSTHCode(d).subscribe({
      next: (res) => {
        this.TSTHcode = res.data,
          console.log("TSTHcode", this.TSTHcode);

      },
      error: (e) => console.error('getTSCNCode error:', e)
    });
  }
  onEmployeeRecoverySelect(employeeID: number) {
    const employee = this.emPloyeeLists.find(e => e.ID === employeeID);
    if (!employee) {
      return;
    }
    this.selectedEmployeeRecoveryID = employeeID;
    this.selectedDepartmentRecoveryName = employee.DepartmentName;
    this.selectedPositionRecoveryName = employee.ChucVuHD;
  }
  onEmployeeReturnSelect(employeeID: number) {
    const employee = this.emPloyeeLists.find(e => e.ID === employeeID);
    if (!employee) {
      return;
    }
    this.selectedEmployeeReturnID = employeeID;
    this.selectedDepartmentReturnName = employee.DepartmentName;
    this.selectedPositionReturnName = employee.ChucVuHD;
    this.employeeReturnID = employeeID;

  }
  openEditModal() {
    this.editMode = true;
    const selectedRecovery = this.tbAssetRecoveryPersonal?.getSelectedData()?.[0];
    const detailRecovery = this.tbAssetRecoveryDetail?.getData() || [];
    if (!selectedRecovery) {
      this.notification.warning("Thông báo", "Vui lòng chọn một bản ghi để sửa");
      return;
    }

    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.setData(this.assetRocoveryDetail);
    }
    this.editingID = selectedRecovery.ID;
    this.TSTHcode = selectedRecovery.Code;
    this.recoveryDate = DateTime.fromISO(selectedRecovery.DateRecovery).toFormat('yyyy-MM-dd');
    this.employeeReturnID = selectedRecovery.EmployeeReturnID;
    this.employeeRecoveryID = selectedRecovery.EmployeeRecoveryID;
    const employeereturn = this.emPloyeeLists.find(e => e.ID === this.employeeReturnID);
    const employeerecovery = this.emPloyeeLists.find(e => e.ID === this.employeeRecoveryID);
    this.selectedDepartmentReturnName = employeereturn.DepartmentName;
    this.selectedPositionReturnName = employeereturn.ChucVuHD;
    this.selectedDepartmentRecoveryName = employeerecovery.DepartmentName;
    this.selectedPositionRecoveryName = employeerecovery.ChucVuHD;
    this.onEmployeeRecoverySelect(this.employeeRecoveryID!);
    console.log(this.employeeReturnID);
    console.log(this.employeeRecoveryID);


    const modalElement = document.getElementById('addRecoveryModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }
  drawRecoveryDetail() {
    {
      if (this.tbAssetRecoveryDetail) {
        this.tbAssetRecoveryDetail.setData(this.assetRocoveryDetail);
      } else {
        this.tbAssetRecoveryDetail = new Tabulator('#dataTbRecoveryDetail', {
          data: this.assetRocoveryDetail,
          layout: "fitDataStretch",
          height: '83vh',
          paginationSize: 5,
          movableColumns: true,
          reactiveData: true,
          columns: [
            { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible:false },

            { title: 'TSAssetManagementPersonalID', field: 'TSAssetManagementPersonalID', hozAlign: 'center', width: 60, visible:false  },
            { title: 'TSRecoveryAssetPersonalID', field: 'TSRecoveryAssetPersonalID', hozAlign: 'center', width: 60, visible: false },

            {
              title: 'STT',
              hozAlign: 'center',
              width: 60,
              headerHozAlign: 'center',
              formatter: 'rownum',
              headerSort: false
            }
            ,
            { title: 'Mã tài sản', field: 'Code', hozAlign: 'center', width: 120, headerHozAlign: 'center' },
            {
              title: 'Thu Hồi',
              field: 'IsAllocation',
              hozAlign: 'center',

              formatter: function (cell: any) {
                const value = cell.getValue();
                const checked = value === true || value === 'true' || value === 1 || value === '1';
                return `<input type="checkbox" ${checked ? 'checked' : ''} onclick="return false;" />`;
              }, headerHozAlign: 'center'
            },

            {
              title: 'Tên tài sản',
              field: 'Name',
              hozAlign: 'left',
              formatter: cell => cell.getValue()?.toString() || '',
              headerHozAlign: 'center'
            },
            {
              title: 'Ghi Chú',
              field: 'Note',
              hozAlign: 'center',
              headerHozAlign: 'center',
            }
          ]
        });
      }
    }
  }
  getRecoveryByemployee() {
    this.tsAssetRecoveryPersonalService.getAssetRecoveryDetail(0)
      .subscribe((res: any) => {
        this.assetPersonals = res.data.assetsRecoveryDetail;
        console.log('du lieu thu hoi', this.assetPersonals);
        this.drawTbAssetManagementModal();
      });
  }
  drawTbAssetManagementModal() {
    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.setData(this.assetPersonals);
    } else {
      this.tbAssetPersonModal = new Tabulator('#dataTbAssetRecoveryManagement', {
        data: this.assetPersonals,
        layout: "fitDataStretch",
        paginationSize: 5,
        selectableRows: true,
        movableColumns: true,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        columns: [
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible: false },
          {

            title: 'STT',
            hozAlign: 'center',
            width: 60,
            headerHozAlign: 'center',
            formatter: 'rownum',
            headerSort: false
          }
          ,
          {
            title: 'Cấp phát',
            field: 'IsAllocation',
            hozAlign: 'center',
            width: 120,
            headerHozAlign: 'center',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
            },
            cellClick: function (e, cell) {
              const currentValue = cell.getValue();
              const newValue = !(
                currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1'
              );
              cell.setValue(newValue);
              console.log("Cập nhật giá trị:", newValue);
            }
          },
          { title: 'Tên tài sản', field: 'Name', hozAlign: 'left', formatter: cell => cell.getValue()?.toString() || '', headerHozAlign: 'center' },
          { title: 'Số lượng ', field: 'StandardAmount', hozAlign: 'right', formatter: cell => cell.getValue()?.toString() || '', headerHozAlign: 'center' },
          {
            title: 'Ghi chú',
            field: 'Note'
            , headerHozAlign: 'center'
            , editor: 'input'
          }
        ]

      });
    }
  }
  onEmployeeChange(employeeID: number): void {
    this.selectedEmployee = this.emPloyeeLists.find(emp => emp.ID === employeeID) || null;
    this.selectedEmployeeReturnID = this.emPloyeeLists.find(emp => emp.ID === employeeID) || null;
    this.selectedEmployeeRecoveryID = this.emPloyeeLists.find(emp => emp.ID === employeeID) || null;
  }
  getSelectedIds(): number[] {
    if (this.tbAssetRecoveryPersonal) {
      const selectedRows = this.tbAssetRecoveryPersonal.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  validateApproveAllocation(
    action: 'HR_APPROVE' | 'HR_CANCEL' | 'Delete' | 'PERSONAL_APPROVE' | 'PERSONAL_CANCEL'
  ): boolean {
    if (!this.tbAssetRecoveryPersonal) {
      this.notification.warning("Thông báo", "Chọn một hàng để duyệt");
      return false;
    }
    const selectedRow = this.tbAssetRecoveryPersonal.getSelectedData();
    for (const row of selectedRow) {
      switch (action) {
        case 'PERSONAL_CANCEL':
          console.log('row: ', row);
          if (row.IsApproveHR === true) {
            this.notification.warning("Thông báo", "Tài sản đã được HR duyệt, cá nhân không thể hủy duyệt.");
            return false;
          }
          break;
      }
    }
    return true;
  }
  onDateChange(newDate: Date): void {
    this.recoveryDate = newDate.toISOString().slice(0, 10);
    this.generateTSAssetCode();
  }
  updateApprove(action: 'HR_APPROVE' | 'HR_CANCEL' | 'Delete' | 'PERSONAL_APPROVE' | 'PERSONAL_CANCEL') {
    if (!this.validateApproveAllocation(action)) return;
    const today = new Date();
    const ids = this.getSelectedIds();
    if (ids.length !== 1) {
      this.notification.warning("Thông báo", "Chỉ được chọn một bản ghi để cập nhật.");
      return;
    }
    const id = ids[0];
    let updatePayload: { tSRecoveryAssetPersonal: { id: number, isDeleted?: boolean, isApproveHR?: boolean, isApprovedPersonalProperty?: boolean, DateApprovedPersonalProperty?: string, DateApprovedHR?: string } };
    switch (action) {
      case 'HR_APPROVE':
        updatePayload = { tSRecoveryAssetPersonal: { id, isApproveHR: true, DateApprovedHR: today.toISOString().split('T')[0] } };
        break;
      case 'HR_CANCEL':
        updatePayload = { tSRecoveryAssetPersonal: { id, isApproveHR: false, DateApprovedHR: today.toISOString().split('T')[0] } };
        break;
      case 'PERSONAL_APPROVE':
        updatePayload = { tSRecoveryAssetPersonal: { id, isApprovedPersonalProperty: true, DateApprovedPersonalProperty: today.toISOString().split('T')[0], } };
        break;
      case 'PERSONAL_CANCEL':
        updatePayload = { tSRecoveryAssetPersonal: { id, isApprovedPersonalProperty: false, DateApprovedPersonalProperty: today.toISOString().split('T')[0], } };
        break;
      case 'Delete':
        updatePayload = { tSRecoveryAssetPersonal: { id, isDeleted: true } };
        break;
    }
    this.tsAssetAllocationPersonalService.saveAssetAllocationPerson(updatePayload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success("Thông báo", "Thành công");
          this.tbAssetRecoveryPersonal?.setData();
        } else {
          this.notification.warning("Thông báo", "Thất bại");
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning("Thông báo", "Lỗi kết nối");
      }
    });
  }
  onSearchChange(): void {
    if (!this.tbAssetRecoveryPersonal) return;
    const value = this.filterText.trim();
    if (value) {
      this.tbAssetRecoveryPersonal.setFilter([
        { field: 'Code', type: 'like', value }
      ], 'or', { caseSensitive: false });
    } else {
      this.clearAllFilters();
    }
  }
  clearAllFilters(): void {
    if (this.tbAssetRecoveryPersonal) {
      this.filterText = '';
      this.dateStart = '';
      this.dateEnd = '';
      this.employeeID = null;
      this.status = -1;
      this.onFilterChange();
    }
  }
  onFilterChange(): void {
    this.getAssetRecoveryPersonals();
  }
  openModalRecovery() {
    this.editingID = 0;
    this.editMode = false;
    this.TSTHcode = '';
    if (this.currentUser?.ID) {
      this.employeeRecoveryID = this.currentUser.EmployeeID;
      this.onEmployeeRecoverySelect(this.currentUser.EmployeeID);
    }                 // reset code cũ
    const today = new Date().toISOString().split('T')[0];
    this.generateTSAssetCode(today);           // ép gọi API với ngày hôm nay

    const el = document.getElementById('addRecoveryModal');
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();
  }
}
