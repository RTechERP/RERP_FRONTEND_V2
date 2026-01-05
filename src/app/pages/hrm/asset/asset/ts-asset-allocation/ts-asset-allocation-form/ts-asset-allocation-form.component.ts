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
import { AuthService } from '../../../../../../auth/auth.service';
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
  deletedDetailIds: number[] = [];
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
  currentUser: any[] = [];

  constructor(private notification: NzNotificationService,
    private authService: AuthService
  ) { }
  ngAfterViewInit(): void {
    this.drawTbSelectAsset();
  }
  ngOnInit() {
    this.dataInput.DateRecovery = this.formatDateForInput(this.dataInput.DateRecovery);//fomat lại ngày
    this.getAllocation();
    this.getCurrentUser();
    this.getListEmployee();
    this.generateAllocationCode();
    this.getAllocationDetail();

  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
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
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      if (this.dataInput?.EmployeeID) {
        // không clear detail khi set giá trị lúc mở form
        this.onEmployeeChange(this.dataInput.EmployeeID, false);
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
  private resetDetails(): void {
    this.allocationDetailData = [];
    if (this.assetTable) this.assetTable.setData([]);
  }
  // Bắt sự kiện thay đổi nhân viên khi chọn
  // Bắt sự kiện thay đổi nhân viên khi chọn
  onEmployeeChange(employeeID: number, clearDetails: boolean = true): void {
    if (clearDetails) this.resetDetails();

    const selectedEmp = this.emPloyeeLists.find(emp => emp.ID === employeeID);
    if (selectedEmp) {
      this.dataInput.EmployeeID = selectedEmp.ID;
      this.dataInput.Name = selectedEmp.DepartmentName;
      this.dataInput.ChucVuHD = selectedEmp.ChucVuHD;
    } else {
      this.dataInput.EmployeeID = null;
      this.dataInput.Name = '';
      this.dataInput.ChucVuHD = '';
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
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <i class="fa-solid fa-plus text-success cursor-pointer" title="Thêm dòng"></i>
    </div>`,
          formatter: () => `
    <i class="fa-solid fa-xmark text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const data = row.getData();

            // Nếu là dòng cũ đã có trong DB (có ID) thì lưu lại ID để gửi lên API
            if (data['ID']) {
              this.deletedDetailIds.push(data['ID']);
            }

            // Xóa khỏi bảng UI
            row.delete();
          },
        },

        { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
        { title: 'ID', field: 'ID', hozAlign: 'center', visible: false, headerHozAlign: 'center' },
        { title: 'STT', field: 'STT', formatter: 'rownum', hozAlign: 'center', headerHozAlign: 'center', width: 60, headerSort: false },
        { title: "Mã tài sản", field: "TSCodeNCC", editor: "input", headerHozAlign: 'center' },
        { title: "Tên tài sản", field: "TSAssetName", editor: "input", headerHozAlign: 'center', width: 300, formatter: 'textarea' },
        { title: "Số Lượng", field: "Quantity", editor: "input", headerHozAlign: 'center', hozAlign: "right" },
        { title: "Ghi chú", field: "Note", editor: "input", headerHozAlign: 'center', formatter: 'textarea' }
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

    // ID đã có trong bảng cha
    const existingIds = (this.assetTable?.getData() || []).map((r: any) => r.AssetManagementID);

    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.componentInstance.existingIds = existingIds; // <-- thêm dòng này

    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (!selectedAssets?.length) return;

      // Lọc lần nữa ở cha để tuyệt đối không trùng
      const currentIds = new Set((this.assetTable?.getData() || []).map((r: any) => r.AssetManagementID));
      const dedup = selectedAssets.filter(x => !currentIds.has(x.AssetManagementID));

      const skipped = selectedAssets.length - dedup.length;
      if (skipped > 0) {
        this.notification.warning('Thông báo', `Bỏ qua ${skipped} tài sản trùng.`);
      }

      if (dedup.length && this.assetTable) this.assetTable.addData(dedup);
      this.allocationDetailData.push(...dedup);
    });

    modalRef.result.catch(() => { });
  }
  private validateAllocation(): string | null {
    // Nhân viên nhận tài sản
    if (!this.dataInput?.EmployeeID) return 'Vui lòng chọn nhân viên nhận tài sản.';

    // Ngày cấp phát
    if (!this.dataInput?.DateAllocation) return 'Vui lòng chọn ngày cấp phát.';

    // Bảng chi tiết
    if (!this.assetTable) return 'Bảng chi tiết chưa khởi tạo.';

    const rows = this.assetTable.getData();
    if (!rows || rows.length === 0) return 'Chưa có tài sản trong danh sách.';

    // Validate từng dòng
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.AssetManagementID) return `Dòng ${i + 1}: thiếu AssetManagementID.`;
      const qty = Number(r.Quantity ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) return `Dòng ${i + 1}: Số lượng phải > 0.`;
    }

    // Không cho trùng tài sản cùng biên bản (nếu cần)
    const ids = rows.map((r: any) => r.AssetManagementID);
    const hasDup = ids.some((id, idx) => ids.indexOf(id) !== idx);
    if (hasDup) return 'Danh sách tài sản có mục trùng.';

    return null;
  }

  //Lưu cấp phát
  saveAllocation() {
    const msg = this.validateAllocation();
    if (msg) {
      this.notification.warning('Thông báo', msg);
      return;
    }

    if (!this.assetTable) return;
    const rows = this.assetTable.getData();

    const detailPayload = rows.map((item: any, index: number) => ({
      ID: item.ID || 0,
      TSAssetAllocationID: this.dataInput.ID || 0,
      AssetManagementID: item.AssetManagementID,
      STT: index + 1,
      Quantity: item.Quantity || 1,
      Note: item.Note || '',
      EmployeeID: this.dataInput.EmployeeID,
      IsDeleted: false
    }));

    // Thêm các dòng cần xóa (chỉ cần ID + IsDelete = true, các field khác backend có thể bỏ qua)
    const deletedDetailsPayload = this.deletedDetailIds.map(id => ({
      ID: id,
      TSAssetAllocationID: this.dataInput.ID || 0,
      AssetManagementID: 0,
      STT: 0,
      Quantity: 0,
      Note: '',
      EmployeeID: this.dataInput.EmployeeID,
      IsDeleted: true
    }));

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
      tSAssetAllocationDetails: [
        ...detailPayload,
        ...deletedDetailsPayload
      ]
    };
    console.log("payloadAllocation", payloadAllocation);
    this.assetAllocationService.saveData(payloadAllocation).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.deletedDetailIds = [];
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
