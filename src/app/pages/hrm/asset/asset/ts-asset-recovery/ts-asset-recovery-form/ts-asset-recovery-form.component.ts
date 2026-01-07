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
import { AssetsManagementService } from '../../ts-asset-management/ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { AssetAllocationService } from '../../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { log } from 'ng-zorro-antd/core/logger';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TsAssetChooseAssetsComponent } from '../../ts-asset-allocation/ts-asset-choose-assets/ts-asset-choose-assets.component';
import { right } from '@popperjs/core';
import { AssetsRecoveryService } from '../ts-asset-recovery-service/ts-asset-recovery.service';
import { TsAssetRecoveryByEmployeeComponent } from '../ts-asset-recovery-by-employee/ts-asset-recovery-by-employee.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}

@Component({
  standalone: true,

  selector: 'app-ts-asset-recovery-form',
  templateUrl: './ts-asset-recovery-form.component.html',
  styleUrls: ['./ts-asset-recovery-form.component.css'],
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
  ]
})
export class TsAssetRecoveryFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  private assetsRecoveryService = inject(AssetsRecoveryService);
  private ngbModal = inject(NgbModal);
  constructor(private notification: NzNotificationService) { }
  emPloyeeLists: any[] = [];
  assetRecoveryData: any[] = [];
  assetRecoveryDetailData: any[] = [];
  recoveryTable: Tabulator | null = null;
  recoveryCode: string = "";
  deletedDetailIds: number[] = [];
  ngAfterViewInit(): void {
    this.drawDetail();
  }
  ngOnInit() {
    this.dataInput.EmployeeReturnID = Number(this.dataInput.EmployeeReturnID);
    this.dataInput.EmployeeRecoveryID = Number(this.dataInput.EmployeeRecoveryID);
    this.dataInput.DateRecovery = this.dataInput.DateRecovery
      ? this.formatDateForInput(this.dataInput.DateRecovery)
      : DateTime.now().toISODate();
    this.getRecovery();
    this.getListEmployee();
    this.getRecoveryDetail();
    this.getRecoveryCode();
  }
  getRecovery(): void {
    const request = {
      dateStart: '2020-01-01',
      dateEnd: '2025-12-31',
      employeeReturnID: 0,
      employeeRecoveryID: 0,
      status: -1,
      filterText: '',
      pageSize: 20000,
      pageNumber: 1
    };
    this.assetsRecoveryService.getAssetsRecovery(request).subscribe((response: any) => {
      this.assetRecoveryData = response.assetsrecovery;
    });
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      console.log(this.emPloyeeLists);
      if (this.dataInput?.EmployeeReturnID) {
        this.onEmployeeReturnChange(this.dataInput.EmployeeReturnID, false);
      }
      if (this.dataInput?.EmployeeRecoveryID) {
        this.onEmployeeRecoveryChange(this.dataInput.EmployeeRecoveryID);
      }
    });
  }
  onEmployeeReturnChange(id: number, clearDetails: boolean = true): void {
    if (clearDetails) this.resetDetails();

    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.EmployeeReturnID = emp.ID;
      this.dataInput.DepartmentReturn = emp.DepartmentName;
      this.dataInput.PossitionReturn = emp.ChucVuHD;
    } else {
      // trường hợp user bấm clear trong nz-select
      this.dataInput.EmployeeReturnID = null;
      this.dataInput.DepartmentReturn = '';
      this.dataInput.PossitionReturn = '';
    }
  }
  onEmployeeRecoveryChange(id: number): void {
    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.EmployeeRecoveryID = emp.ID;
      this.dataInput.DepartmentRecovery = emp.DepartmentName;
      this.dataInput.PossitionRecovery = emp.ChucVuHD;
    }
  }
  getRecoveryDetail() {
    if (!this.dataInput?.ID) {

      return;
    }
    this.assetsRecoveryService.getAssetsRecoveryDetail(this.dataInput.ID).subscribe(res => {
      const details = Array.isArray(res?.data?.assetsRecoveryDetail)
        ? res.data.assetsRecoveryDetail
        : 0;
      this.assetRecoveryDetailData = details;
      this.drawDetail();
    });
  }
  getRecoveryCode() {
    this.assetsRecoveryService.getRecoveryCode(this.dataInput.DateRecovery).subscribe(response => {
      this.dataInput.Code = response.data;
    });
  }
  drawDetail() {
    this.recoveryTable = new Tabulator('#datablerecoverydetail1', {
      data: this.assetRecoveryDetailData,
      layout: "fitDataStretch",
      paginationSize: 5,
      height: '18vh',
      movableColumns: true,
      reactiveData: true,
      columns: [
        {
          title: "",
          field: "addRow",
          hozAlign: "center",
          width: 40,
          headerSort: false,
          formatter: () => `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const data = row.getData();

            // nếu là dòng cũ trong DB -> ghi nhớ ID để gửi về API
            if (data['ID']) {
              this.deletedDetailIds.push(data['ID']);
            }

            // xóa trên UI
            row.delete();
          },
        },
        {
          title: 'ID',
          field: 'ID',
          hozAlign: 'center',
          width: 60
          , visible: false
        },
        { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
        { title: 'TSAssetRecoveryID', field: 'TSAssetRecoveryID', visible: false },
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 60, headerHozAlign: 'center' },
        { title: 'Mã tài sản', field: 'TSCodeNCC', headerHozAlign: 'center' },
        { title: 'Tên tài sản', field: 'TSAssetName', width: 300, formatter: 'textarea' },
        { title: 'Số lượng', field: 'Quantity', headerHozAlign: 'center' },
        { title: 'Tình trạng', field: 'Status', headerHozAlign: 'center', visible: false },
        { title: 'Ghi chú', field: 'Note', editor: 'input', formatter: 'textarea' }
      ]
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  private resetDetails(): void {
    this.assetRecoveryDetailData = [];
    if (this.recoveryTable) this.recoveryTable.setData([]);
  }
  onSelectAssetRecovery() {
    if (!this.dataInput?.EmployeeReturnID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên trả tài sản trước khi chọn tài sản.');
      return;
    }

    const modalRef = this.ngbModal.open(TsAssetRecoveryByEmployeeComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    // Lấy các AssetManagementID đã có trong bảng chi tiết hiện tại
    const existingIds: number[] = (this.recoveryTable?.getData() || [])
      .map((r: any) => Number(r.AssetManagementID))
      .filter((x: any) => Number.isFinite(x));

    modalRef.componentInstance.dataInput1 = {
      EmployeeReturnID: this.dataInput.EmployeeReturnID,
      RecoverID: this.dataInput.ID || 0,
      existingIds, // <-- truyền xuống modal
    };

    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (!selectedAssets?.length) return;

      // Lọc lần 2 ở cha để chắc chắn không trùng
      const current = new Set(
        (this.recoveryTable?.getData() || []).map((r: any) => Number(r.AssetManagementID))
      );
      const dedup = selectedAssets.filter(x => !current.has(Number(x.AssetManagementID)));

      const skipped = selectedAssets.length - dedup.length;
      if (skipped > 0) {
        this.notification.warning('Thông báo', `Bỏ qua ${skipped} tài sản trùng.`);
      }

      if (dedup.length) this.recoveryTable?.addData(dedup);
      this.getRecovery();
    });

    modalRef.result.catch(() => { });
  }

  saveRecovery() {
    if (!this.dataInput?.EmployeeRecoveryID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn người thu hồi.');
      return;
    }

    if (!this.dataInput?.EmployeeReturnID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên trả tài sản.');
      return;
    }

    if (this.dataInput.EmployeeRecoveryID === this.dataInput.EmployeeReturnID) {
      this.notification.warning('Thông báo', 'Người thu hồi và người bị thu hồi không được trùng nhau.');
      return;
    }

    if (!this.dataInput?.DateRecovery) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày thu hồi.');
      return;
    }

    if (!this.dataInput?.Note || this.dataInput.Note.trim() === '') {
      this.notification.warning('Thông báo', 'Vui lòng nhập ghi chú.');
      return;
    }

    if (!this.recoveryTable) {
      this.notification.warning('Thông báo', 'Bảng chi tiết chưa khởi tạo.');
      return;
    }

    const selectedAssets = this.recoveryTable.getData();
    if (!selectedAssets || selectedAssets.length === 0) {
      this.notification.warning('Thông báo', 'Chưa có tài sản trong danh sách.');
      return;
    }
    const rows = this.recoveryTable.getData();

    const detailPayload = rows.map((item: any, index: number) => ({
      ID: item.ID || 0,
      STT: index + 1,
      TSAssetRecoveryID: item.TSAssetRecoveryID || (this.dataInput.ID || 0),
      AssetManagementID: item.AssetManagementID || 0,
      Quantity: item.Quantity || 1,
      Note: item.Note || "",
      IsDeleted: false
    }));
    const deletedDetailPayload = this.deletedDetailIds.map(id => ({
      ID: id,
      STT: 0,
      TSAssetRecoveryID: this.dataInput.ID || 0,
      AssetManagementID: 0,
      Quantity: 0,
      Note: "",
      IsDeleted: true
    }));
    const assetManagements = rows.map(item => ({
      ID: item.AssetManagementID,
      IsAllocation: true,
      StatusID: 1,
      Status: "Chưa sử dụng",
      EmployeeID: this.dataInput.EmployeeRecoveryID,

    }));
    const payloadRecovery = {
      tSAssetRecovery: {
        ID: this.dataInput.ID || 0,
        Code: this.dataInput.Code,
        DateRecovery: this.dataInput.DateRecovery,
        EmployeeReturnID: this.dataInput.EmployeeReturnID,
        EmployeeRecoveryID: this.dataInput.EmployeeRecoveryID,
        Status: 0,
        Note: this.dataInput.Note,
        IsApproveAccountant: false,
        IsApprovedPersonalProperty: false
      },
      tSAssetManagements: assetManagements,
      TSAssetRecoveryDetails: [
        ...detailPayload,
        ...deletedDetailPayload
      ]
    };

    console.log(payloadRecovery);
    this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.getRecovery();
        this.resetModal();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
  resetModal(): void {

    if (this.recoveryTable) {
      this.recoveryTable.clearData();
    }
    this.dataInput = {
      ID: 0,
      Code: '',
      DateRecovery: new Date().toISOString(),
      EmployeeReturnID: null,
      EmployeeRecoveryID: null,
      Status: 0,
      Note: '',
      IsApproveAccountant: false,
      IsApprovedPersonalProperty: false
    };
  }

}
