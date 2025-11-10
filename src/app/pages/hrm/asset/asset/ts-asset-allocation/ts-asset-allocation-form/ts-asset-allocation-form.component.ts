import { NzNotificationService } from 'ng-zorro-antd/notification'
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit
} from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { AssetAllocationService } from '../ts-asset-allocation-service/ts-asset-allocation.service';
import { Tabulator } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TsAssetChooseAssetsComponent } from '../ts-asset-choose-assets/ts-asset-choose-assets.component';
import { HasPermissionDirective } from "../../../../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
@Component({
  standalone: true,
  selector: 'app-ts-asset-allocation-form',
  templateUrl: './ts-asset-allocation-form.component.html',
  styleUrls: ['./ts-asset-allocation-form.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    HasPermissionDirective
  ]
})
export class TsAssetAllocationFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  public activeModal = inject(NgbActiveModal);
  private ngbModal = inject(NgbModal);
  private assetAllocationService = inject(AssetAllocationService);
  emPloyeeLists: any[] = [];
  assetAllocationData: any[] = [];
  assetRows: any[] = [];
  allocationDetailData: any[] = [];
  modalData: any = [];
  assetTable: Tabulator | null = null;
  constructor(private notification: NzNotificationService) { }
  ngAfterViewInit(): void {
    this.drawTbSelectAsset();
  }
  ngOnInit() {
    this.dataInput.DateRecovery = this.formatDateForInput(this.dataInput.DateRecovery);//fomat lại ngày
    this.getAllocation();
    this.getListEmployee();
    this.generateAllocationCode();
    this.getAllocationDetail();

  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
  }
  //lấy Master cấp phát
  getAllocation(): void {
    const request = {
      dateStart: '2020-01-01',
      dateEnd: '2025-12-31',
      employeeID: 0,
      status: -1,
      filterText: '',
      pageSize: 20000,
      pageNumber: 1
    };
    this.assetAllocationService.getAssetAllocation(request).subscribe((data: any) => {
      this.assetAllocationData = data.assetAllocation || [];
    });
  }
  // lấy danh sách nhân viên
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      if (this.dataInput?.EmployeeID) {
        this.onEmployeeChange(this.dataInput.EmployeeID);
      }
    });
  }
  // Lấy cấp phát detail
  getAllocationDetail() {
    this.assetAllocationService.getAssetAllocationDetail(this.dataInput.ID).subscribe(res => {
      const details = Array.isArray(res.data.assetsAllocationDetail)
        ? res.data.assetsAllocationDetail
        : [];
      this.allocationDetailData = details;
      this.drawTbSelectAsset();
    });
  }
  // Bắt sự kiện thay đổi nhân viên khi chọn
  onEmployeeChange(employeeID: number): void {
    const selectedEmp = this.emPloyeeLists.find(emp => emp.ID === employeeID);
    if (selectedEmp) {
      this.dataInput.employeeID = selectedEmp.ID;
      this.dataInput.Name = selectedEmp.DepartmentName;
      this.dataInput.ChucVuHD = selectedEmp.ChucVuHD;
    } else {
      this.dataInput.employeeID = null;
      this.dataInput.Name = '';
      this.dataInput.ChucVuHD == "";
    }
  }
  //Lấy code cấp phát
  generateAllocationCode() {
    if (!this.dataInput.DateAllocation) {
      const today = new Date();
      this.dataInput.DateAllocation = today.toISOString().split('T')[0];
    }
    this.assetAllocationService.getAllocationCode(this.dataInput.DateAllocation).subscribe({
      next: (response) => {
        this.dataInput.Code = response.data;
      },
      error: (error) => {
      }
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  addRow() {
    if (this.assetTable) {
      this.assetTable.addRow({
        assetCode: '',
        assetName: '',
        note: ''
      });
    }
  }
  drawTbSelectAsset() {
    this.assetTable = new Tabulator('#tableAsset11111', {
      height: "40vh",
      data: this.allocationDetailData,
      layout: "fitDataStretch",
      columns: [
        {
          title: "",
          field: "addRow",
          hozAlign: "center",
          width: 40,
          headerSort: false,
          titleFormatter: () => `
  <div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
          headerClick: () => { this.addRow(); },
          formatter: () => `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => { cell.getRow().delete(); },
        },
        {
          title: "",
          formatter: "rowSelection",
          titleFormatter: "rowSelection",
          hozAlign: "center",
          headerHozAlign: "center",
          headerSort: false,
          width: 40
        },
        { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
        { title: 'ID', field: 'ID', hozAlign: 'center', visible: false, headerHozAlign: 'center' },
        { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 60 },
        { title: "Mã NCC", field: "TSCodeNCC", editor: "input", headerHozAlign: 'center' },
        { title: "Tên tài sản", field: "TSAssetName", editor: "input", headerHozAlign: 'center' },
        { title: "Số Lượng", field: "Quantity", editor: "input", headerHozAlign: 'center', hozAlign: "right" },
        { title: "Ghi chú", field: "Note", editor: "input", headerHozAlign: 'center' }
      ]
    });
  }
  //Mở modal chọn tài sản, nhận tài sản đã chọn
  openModalAsset() {
    const modalRef = this.ngbModal.open(TsAssetChooseAssetsComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (selectedAssets && selectedAssets.length > 0) {
        console.log("Nhận từ modal con:", selectedAssets);
        if (this.assetTable) {
          this.assetTable.addData(selectedAssets);
        }
        this.allocationDetailData.push(...selectedAssets);
      }
    });
    modalRef.result.catch(() => {
      console.log('Modal dismissed');
    });
  }
  //Lưu cấp phát
  saveAllocation() {
    if (!this.assetTable) {
      console.warn('assetTable chưa được khởi tạo!');
      return;
    }
    const selectedAssets = this.assetTable.getData();
    const payloadAllocation = {
      tSAssetAllocation: {
        ID: this.dataInput.ID || 0,
        Code: this.dataInput.Code,
        DateAllocation: this.dataInput.DateAllocation,
        EmployeeID: this.dataInput.EmployeeID,
        Note: this.dataInput.Note,
        IsApproveAccountant: false,
        Status: 0,
        IsApprovedPersonalProperty: false
      },
      tSAssetAllocationDetails: selectedAssets.map((item, index) => ({
        ID: item.ID || 0,
        TSAssetAllocationID: 0,
        AssetManagementID: item.AssetManagementID,
        STT: index + 1,
        Quantity: item.Quantity || 1,
        Note: item.Note || '',
        EmployeeID: this.dataInput.EmployeeID
      }))

    };
    console.log("payloadAllocation", payloadAllocation);
    this.assetAllocationService.saveData(payloadAllocation).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.getAllocation();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
}
