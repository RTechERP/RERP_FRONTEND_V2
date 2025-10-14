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
import { TsAssetAllocationPersonalService } from './ts-asset-allocation-personal-service/ts-asset-allocation-personal.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import { CommonModule } from '@angular/common';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
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

  selector: 'app-ts-asset-allocation-personal',
  templateUrl: './ts-asset-allocation-personal.component.html',
  styleUrls: ['./ts-asset-allocation-personal.component.css']
})
export class TsAssetAllocationPersonalComponent implements OnInit, AfterViewInit {

  @ViewChild('addAllocationModal') modalElement!: ElementRef;
  isSearchVisible: boolean = false;
  //Request truyền vào store
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number = -1;
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  assetAllocationPersonalData: any[] = [];
  //Tạo bảng Cấp phát tài sản cá nhân
  tbAssetAllocationPersonal: Tabulator | null = null;
  //Bảng detail cấp phát tài sản cá nhân
  tbAssetAllocationDetail: Tabulator | null = null;
  assetAllocationDetailData: any[] = [];
  //Lấy danh sách nhân viên
  emPloyeeLists: any[] = [];
  allocationDate: string = "";
  TSCNcode: string = "";
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  //Max STT
  maxSTT: number = 0;
  //Danh sách tài sản cá nhân
  assetPersonals: any[] = [];
  // Tạo bảng tài sản cá nhân trong modal để cấp phát
  tbAssetPersonModal: Tabulator | null = null;
  //Chọn nhân viên
  selectedEmployee: any = null;
  editingID: number = 0;
  constructor(
    private assetAllocationService: TsAssetAllocationPersonalService,
    private assetManagemnetService: TsAssetManagementPersonalService,
    private notification: NzNotificationService,
  ) { }
  ngOnInit() {
    this.getAssetAllocationPersonals();
    this.getListEmployee();
    this.generateTSAssetCode();
  }
  ngAfterViewInit(): void {
    this.getAssetAllocationPersonals();
    this.drawTbAssetAllocation();
    this.drawAllocationDetail();
    this.generateTSAssetCode();
    this.getAssetManagementPersonal();
    this.drawTbAssetManagementModal();
  }
  getAssetAllocationPersonals() {
    const request = {
      dateStart: this.dateStart || '2020-01-01',
      dateEnd: this.dateEnd || '2025-12-31',
      employeeID: this.employeeID || 0,
      status: this.status || -1,
      filterText: this.filterText || '',
      pageSize: 10000,
      pageNumber: 1
    }
    this.assetAllocationService.getAssetAllocationPersonal(request).subscribe((respon: any) => {
      this.assetAllocationPersonalData = respon.assetAllocationPersonal;
      console.log(this.assetAllocationPersonalData);
      this.maxSTT = respon.MaxSTT;
      console.log(this.maxSTT);
      this.tbAssetAllocationPersonal?.setData(respon.assetAllocationPersonal);
    })
  }
  getListEmployee() {
    this.assetManagemnetService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      this.employeeID = null;
      this.selectedEmployee = null;
    });
  }
  onDateChange(newDate: Date): void {
    this.allocationDate = newDate.toISOString().slice(0, 10);
    this.generateTSAssetCode();
  }
  onEmployeeChange(employeeID: number): void {
    this.selectedEmployee = this.emPloyeeLists.find(emp => emp.ID === employeeID) || null;
  }
  getAssetManagementPersonal() {
    this.assetAllocationService.getAssetManagementPersonal().subscribe((respon: any) => {
      this.assetPersonals = respon.tSAssetManagmentPersonal;
      if (this.tbAssetPersonModal) {
        this.tbAssetPersonModal.setData(this.assetPersonals);
      }
    })
  }
  generateTSAssetCode(): void {
    if (!this.allocationDate) {
      const today = new Date();
      this.allocationDate = today.toISOString().split('T')[0];
      return;
    }
    this.assetAllocationService.getTSCNCode(this.allocationDate).subscribe({
      next: (response) => {
        this.TSCNcode = response.data;
      },
      error: (error) => {
        console.error('Lỗi khi lấy mã cấp phát:', error);
      }
    });
  }
  drawTbAssetAllocation() {
    this.tbAssetAllocationPersonal = new Tabulator('#dataTbAllocation',
      {
        layout: 'fitDataStretch',
        height: '83vh',
        pagination: true,
        paginationSize: 20,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        selectableRows: 1,
        columns: [
          {
            title: '',
            field: '',
            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            hozAlign: 'center',
            headerHozAlign: 'center',

            headerSort: false,
            width: 60,
            cssClass: 'checkbox-center'
          },
          { title: 'ID', field: 'ID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
          { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'Code', field: 'Code', hozAlign: 'center', headerHozAlign: 'center', width: 200 },
          {
            title: 'Cá Nhân Duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center'
          },
          {
            title: 'HR Duyệt', field: 'IsApproveHR',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
            },
            hozAlign: 'center', headerHozAlign: 'center'
          },
          {
            title: 'Ngày cấp phát', field: 'DateAllocation', hozAlign: 'center', headerHozAlign: 'center',
            formatter: cell => DateTime.fromISO(cell.getValue()).toFormat('dd/MM/yyyy')
          },
          { title: 'Cấp phát cho', field: 'EmployeeName', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Phòng ban', field: 'Department', hozAlign: 'left', headerHozAlign: 'center' },
        ]
      });
    this.tbAssetAllocationPersonal.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const id = rowData['ID'];
      console.log('ID', id);
      this.assetAllocationService.getAssetAllocationDetail(id, 0).subscribe(res => {
        const details = Array.isArray(res.data.assetsAllocationPersonalDetail)
          ? res.data.assetsAllocationPersonalDetail
          : [];
        this.assetAllocationDetailData = details;
        console.log("djhqaokjhdfihqfihqa", details);

        this.drawAllocationDetail();
      });

    });
    this.tbAssetAllocationPersonal.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    })
  }
  drawAllocationDetail() {
    {
      if (this.tbAssetAllocationDetail) {
        this.tbAssetAllocationDetail.setData(this.assetAllocationDetailData);
      } else {
        this.tbAssetAllocationDetail = new Tabulator('#dataTbAllocationDetail', {
          data: this.assetAllocationDetailData,
          layout: "fitDataStretch",
          paginationSize: 5,
          height: "83vh",
          movableColumns: true,
          reactiveData: true,
          columns: [
            {
              title: 'TSAssetManagementPersonalID',
              field: 'TSAssetManagementPersonalID',
              hozAlign: 'center',
              width: 60,
              visible: false
            },
            {
              title: 'ID',
              field: 'ID',
              hozAlign: 'center',
              width: 60,
              visible: false
            },
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
              formatter: function (cell: any) {
                const value = cell.getValue();
                const checked = value === true || value === 'true' || value === 1 || value === '1';
                return `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
              }
              , headerHozAlign: 'center'
            },
            {
              title: 'Tên tài sản',
              field: 'Name',
              hozAlign: 'left',
              formatter: cell => cell.getValue()?.toString() || '',
              headerHozAlign: 'center'
            },
            {
              title: 'Số lượng ',
              field: 'StandardAmount',
              hozAlign: 'center',
              formatter: cell => cell.getValue()?.toString() || '',
              headerHozAlign: 'center'
            },
            {
              title: 'Ghi chú',
              field: 'Note'
              , headerHozAlign: 'center'
            }
          ]
        });
      }
    }
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  drawTbAssetManagementModal() {
    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.setData(this.assetAllocationDetailData);
    } else {
      this.tbAssetPersonModal = new Tabulator('#dataTbAssetManagement', {
        data: this.assetAllocationDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        selectableRows: true,
        movableColumns: true,
        reactiveData: true,
        columns: [
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'center',
            width: 60,
            visible: false
          },
          {
            title: 'TSAssetManagementPersonalID',
            field: 'TSAssetManagementPersonalID',
            hozAlign: 'center',
            width: 60
          },
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
          { title: 'Số lượng ', field: 'StandardAmount', hozAlign: 'center', formatter: cell => cell.getValue()?.toString() || '', headerHozAlign: 'center' },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center'
          }
        ]
      });
    }
  }
  // Lấy ID của hàng trong bảng
  getSelectedIds(): number[] {
    if (this.tbAssetAllocationPersonal) {
      const selectedRows = this.tbAssetAllocationPersonal.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  openModalAllocation() {
    const modalEl = document.getElementById('addAllocationModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    }
  }
  openEditModalAllocation() {
    const selectedAllocation = this.tbAssetAllocationPersonal?.getSelectedData()?.[0];
    const detailAllocation = this.tbAssetAllocationDetail?.getData() || [];
    if (!selectedAllocation) {
      this.notification.warning("Thông báo", "Vui lòng chọn một bản ghi để sửa");
      return;
    }
    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.setData(this.assetAllocationDetailData);
    }
    this.editingID = selectedAllocation.ID;
    console.log("Edit ID", this.editingID);
    this.TSCNcode = selectedAllocation.Code;
    this.allocationDate = DateTime.fromISO(selectedAllocation.DateAllocation).toFormat('yyyy-MM-dd');
    this.employeeID = selectedAllocation.EmployeeID;
    this.selectedEmployee = this.emPloyeeLists.find(emp => emp.ID === selectedAllocation.EmployeeID) || null;
    console.log('this.employeeID:', this.employeeID);
    console.log('this.selectedEmployee:', this.selectedEmployee);
    const modalElement = document.getElementById('addAllocationModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }
  closeModal() {
    if (this.modalElement) {
      const modal = bootstrap.Modal.getInstance(this.modalElement.nativeElement);
      modal?.hide();
    }
    this.TSCNcode = '';
    this.allocationDate = "";
    this.employeeID = null;
    this.selectedEmployee = null;
    if (this.tbAssetPersonModal) {
      this.tbAssetPersonModal.deselectRow?.();
      this.tbAssetPersonModal.setData([]);
    }
  }
  validateAllocationForm(): boolean {
    let isValid = true;
    if (!this.allocationDate) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày cấp!');
      isValid = false;
    }
    if (!this.employeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên cấp phát!');
      isValid = false;
    }
    const noteElement = document.getElementsByName('note')[0] as HTMLTextAreaElement;
    const noteValue = noteElement?.value?.trim();
    if (!noteValue) {
      this.notification.warning('Thông báo', 'Vui lòng nhập ghi chú!');
      isValid = false;
    }
    return isValid;
  }
  saveAllocationPersonal() {
    if (!this.validateAllocationForm()) {
      return;
    }
    const today = new Date();
    const allocationCode = this.TSCNcode;
    const selectedAssets = this.tbAssetPersonModal?.getSelectedData() || [];
    const detailAllocation = this.tbAssetAllocationDetail?.getData() || [];
    const allocationDetails = selectedAssets.map((asset, index) => {
      const existingDetail = detailAllocation.find(
        d => d.ID === asset.ID
      );
      return {
        ID: existingDetail ? existingDetail.ID : 0,
        STT: index + 1,
        Note: asset.Note || '',
        TSAssetManagementPersonalID: asset.TSAssetManagementPersonalID,
        CreatedDate: today.toISOString().split('T')[0],
        CreatedBy: 'AdminSW',
        UpdateDate: today.toISOString().split('T')[0],
        UpdateBy: 'AdminSW',
        IsDeleted: false
      };
    });
    const payload = {
      tSAllocationAssetPersonal: {
        ID: this.editingID || 0,
        STT: this.maxSTT + 1,
        Code: allocationCode,
        DateAllocation: this.allocationDate,
        EmployeeID: this.employeeID,
        IsApproveHR: false,
        IsApprovedPersonalProperty: false,
        CreatedDate: today.toISOString().split('T')[0],
        CreatedBy: 'AdminSW',
        UpdateDate: today.toISOString().split('T')[0],
        UpdateBy: 'AdminSW',
        IsDeleted: false
      },
      tSAllocationAssetPersonalDetails: allocationDetails
    };
    this.assetAllocationService.saveAssetAllocationPerson(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success("Thông báo", "Lưu thành công");
          this.closeModal();
          this.getAssetAllocationPersonals();
        } else {
          this.notification.warning("Thông báo", "Lưu thất bại");
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning("Thông báo", "Lỗi kết nối máy chủ");
      }
    });
  }
  validateApproveAllocation(
    action: 'HR_APPROVE' | 'HR_CANCEL' | 'Delete' | 'PERSONAL_APPROVE' | 'PERSONAL_CANCEL'
  ): boolean {
    if (!this.tbAssetAllocationPersonal) {
      this.notification.warning("Thông báo", "Chọn một hàng để duyệt");
      return false;
    }
    const selectedRow = this.tbAssetAllocationPersonal.getSelectedData();
    for (const row of selectedRow) {
      switch (action) {
        case 'PERSONAL_CANCEL':
          console.log('row: ', row);
          if (row.IsApproveHR === true) {
            this.notification.warning("Thông báo", "Tài sản đã được HR duyệt, cá nhân không thể hủy duyệt.");
            return false;
          }
          if (row.isApprovedPersonalProperty !== true && row.isApprovedPersonalProperty !== 1) {
            return false;
          }
          break;
      }
    }
    return true;
  }
  updateApprove(action: 'HR_APPROVE' | 'HR_CANCEL' | 'Delete' | 'PERSONAL_APPROVE' | 'PERSONAL_CANCEL') {
    if (!this.validateApproveAllocation(action)) return;

    const ids = this.getSelectedIds();
    if (ids.length !== 1) {
      this.notification.warning("Thông báo", "Chỉ được chọn một bản ghi để cập nhật.");
      return;
    }
    const id = ids[0];
    let updatePayload: { tSAllocationAssetPersonal: { id: number, isDeleted?: boolean, isApproveHR?: boolean, isApprovedPersonalProperty?: boolean } };
    switch (action) {
      case 'HR_APPROVE':
        updatePayload = { tSAllocationAssetPersonal: { id, isApproveHR: true } };
        break;
      case 'HR_CANCEL':
        updatePayload = { tSAllocationAssetPersonal: { id, isApproveHR: false } };
        break;
      case 'PERSONAL_APPROVE':
        updatePayload = { tSAllocationAssetPersonal: { id, isApprovedPersonalProperty: true } };
        break;
      case 'PERSONAL_CANCEL':
        updatePayload = { tSAllocationAssetPersonal: { id, isApprovedPersonalProperty: false } };
        break;
      case 'Delete':
        updatePayload = { tSAllocationAssetPersonal: { id, isDeleted: true } };
        break;
    }
    this.assetAllocationService.saveAssetAllocationPerson(updatePayload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success("Thông báo", "Thành công");
          setTimeout(() => this.getAssetAllocationPersonals(), 100);
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
    if (!this.tbAssetAllocationPersonal) return;
    const value = this.filterText.trim();
    if (value) {
      this.tbAssetAllocationPersonal.setFilter([
        { field: 'Code', type: 'like', value }
      ], 'or', { caseSensitive: false });
    } else {
      this.clearAllFilters();
    }
  }
  clearAllFilters(): void {
    if (this.tbAssetAllocationPersonal) {
      this.filterText = '';
      this.dateStart = '';
      this.dateEnd = '';
      this.employeeID = null;
      this.status = -1;
      this.onFilterChange();
    }
  }
  onFilterChange(): void {
    this.getAssetAllocationPersonals();
  }
}
