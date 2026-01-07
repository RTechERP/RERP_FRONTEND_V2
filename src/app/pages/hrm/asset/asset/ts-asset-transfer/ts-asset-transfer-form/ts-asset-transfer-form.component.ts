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
import { Tabulator } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TsAssetChooseAssetsComponent } from '../../ts-asset-allocation/ts-asset-choose-assets/ts-asset-choose-assets.component';
import { right } from '@popperjs/core';
import { TsAssetTransferService } from '../ts-asset-transfer-service/ts-asset-transfer.service';
import { TsAssetTranferChoseAssetComponent } from '../ts-asset-tranfer-chose-asset/ts-asset-tranfer-chose-asset.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
@Component({
  standalone: true,
  selector: 'app-ts-asset-transfer-form',
  templateUrl: './ts-asset-transfer-form.component.html',
  styleUrls: ['./ts-asset-transfer-form.component.css'],
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
export class TsAssetTransferFormComponent implements OnInit {
  @Input() dataInput: any;
  modalData: any = [];
  deletedDetailIds: number[] = [];

  private ngbModal = inject(NgbModal);
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  constructor(private notification: NzNotificationService) { }
  public activeModal = inject(NgbActiveModal);
  assetTranferData: any[] = [];

  assetTranferDetailData: any[] = [];
  assetTranferDetailTable: Tabulator | null = null;
  emPloyeeLists: any[] = [];
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  private tsAssetTransferService = inject(TsAssetTransferService);
  ngOnInit() {
    this.dataInput.TranferDate = this.dataInput.TranferDate
      ? this.formatDateForInput(this.dataInput.TranferDate)
      : DateTime.now().toISODate();

    this.getTranferAsset();
    this.getAssetTranferDetail();
    this.getTranferCode();
    this.getListEmployee();
  }

  ngAfterViewInit(): void {
    this.drawDetail();
  }
  getTranferAsset() {
    const request = {
      dateStart: '2020-01-01',
      dateEnd: '2025-12-31',
      IsApproved: -1,
      DeliverID: 0,
      ReceiverID: 0,
      TextFilter: '',
      PageSize: 20000,
      PageNumber: 1
    };
    this.tsAssetTransferService.getAssetTranfer(request).subscribe((data: any) => {
      this.assetTranferData = data.assetTranfer || [];
      console.log(" mhfdehqfcqe", this.assetTranferData)
    });
  }
  formatDateForInput(date: string | Date): string {
    if (!date) return '';
    return DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd');
  }
  getAssetTranferDetail() {
    this.tsAssetTransferService.getAssetTranferDetail(this.dataInput.ID).subscribe(res => {
      const details = Array.isArray(res.data.assetTransferDetail)
        ? res.data.assetTransferDetail
        : [];
      this.assetTranferDetailData = details;
      console.log("Detail sd", this.assetTranferDetailData);
      this.drawDetail();
    });
  }
  private drawDetail(): void {
    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.setData(this.assetTranferDetailData);
      return;
    }

    this.assetTranferDetailTable = new Tabulator('#tableAssetTranfer', {
      data: this.assetTranferDetailData,
      layout: 'fitDataStretch',
      height: '23vh',
      movableColumns: true,
      reactiveData: true,
      columns: [
        {
          title: "",
          field: "addRow",
          hozAlign: "center",
          width: 40,
          headerSort: false,
          titleFormatter: () => `<i class="fas fa-plus text-success" style="cursor: pointer;" title="Thêm dòng"></i>`,
          formatter: () => `<i class="fas fa-times text-danger" style="cursor: pointer;" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const data = row.getData();

            // Nếu là dòng cũ trong DB thì lưu lại ID để gửi IsDeleted = true
            if (data['ID']) {
              this.deletedDetailIds.push(data['ID']);
            }

            // Xóa trên UI
            row.delete();
          },
        },
        { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
        { title: 'TSTranferAssetID', field: 'TSTranferAssetID', hozAlign: 'center', width: 60, visible: false },
        { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible: false },
        {
          title: 'STT',

          formatter: "rownum",
        },
        { title: 'Mã tài sản', field: 'TSCodeNCC', headerHozAlign: 'center' },
        { title: 'Số lượng', field: 'Quantity', hozAlign: 'center', headerHozAlign: 'center' },
        { title: 'Tên tài sản', field: 'TSAssetName', width: 300, formatter: 'textarea', headerHozAlign: 'center' },
        { title: 'Ghi chú', field: 'Note', editor: 'input', formatter: 'textarea', headerHozAlign: 'center' }
      ]
    });
  }



  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
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
        this.onEmployeeDeliverChange(this.dataInput.EmployeeReturnID, false);
      }
      if (this.dataInput?.EmployeeRecoveryID) {
        this.onEmployeeReceiverChange(this.dataInput.EmployeeRecoveryID);
      }
    });
  }
  onEmployeeDeliverChange(id: number, clearDetails: boolean = true): void {
    if (clearDetails) this.resetDetails();

    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.DeliverID = emp.ID;
      this.dataInput.DepartmentDeliver = emp.DepartmentName;
      this.dataInput.PossitionDeliver = emp.ChucVuHD;
      this.dataInput.FromChucVuID = emp.ChucVuHDID;
      this.dataInput.FromDepartmentID = emp.DepartmentID;
    } else {
      // khi clear select
      this.dataInput.DeliverID = null;
      this.dataInput.DepartmentDeliver = '';
      this.dataInput.PossitionDeliver = '';
      this.dataInput.FromChucVuID = null;
      this.dataInput.FromDepartmentID = null;
    }
  }

  onEmployeeReceiverChange(id: number): void {
    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.ReceiverID = emp.ID;
      this.dataInput.DepartmentReceiver = emp.DepartmentName;
      this.dataInput.PossitionReceiver = emp.ChucVuHD;
      this.dataInput.ToChucVuID = emp.ChucVuHDID;
      this.dataInput.ToDepartmentID = emp.DepartmentID;
    }
  }
  getTranferCode() {
    this.tsAssetTransferService.getTranferCode(this.dataInput.TranferDate).subscribe(response => {
      this.dataInput.CodeReport = response.data;
      console.log("Code", this.dataInput.CodeReport);
    });
  }
  addRow() {
    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.addRow({
      });
    }
  }
  OpenModalAsset() {
    if (!this.dataInput?.DeliverID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên giao tài sản trước khi chọn tài sản.');
      return;
    }

    const modalRef = this.ngbModal.open(TsAssetTranferChoseAssetComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // các ID đã có trong bảng chi tiết hiện tại
    const existingIds: number[] = (this.assetTranferDetailTable?.getData() || [])
      .map((r: any) => Number(r.AssetManagementID))
      .filter((x: any) => Number.isFinite(x));

    modalRef.componentInstance.dataInput1 = {
      DeliverID: this.dataInput.DeliverID,
      ReceiverID: this.dataInput.ReceiverID,
      TranferID: this.dataInput.ID || 0,
      existingIds, // <-- truyền xuống modal
    };

    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (!selectedAssets?.length) return;

      // lọc lần 2 ở cha để chắc chắn không trùng
      const current = new Set(
        (this.assetTranferDetailTable?.getData() || []).map((r: any) => Number(r.AssetManagementID))
      );
      const dedup = selectedAssets.filter(x => !current.has(Number(x.AssetManagementID)));

      const skipped = selectedAssets.length - dedup.length;
      if (skipped > 0) this.notification.warning('Thông báo', `Bỏ qua ${skipped} tài sản trùng.`);

      if (dedup.length) this.assetTranferDetailTable?.addData(dedup);
      this.getTranferAsset();
    });

    modalRef.result.catch(() => { });
  }

  saveTranfer() {

    if (!this.dataInput?.DeliverID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn người điều chuyển.');
      return;
    }

    if (!this.dataInput?.ReceiverID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn người nhận tài sản.');
      return;
    }

    if (!this.dataInput?.TranferDate) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ngày điều chuyển.');
      return;
    }

    if (!this.dataInput?.Reason || this.dataInput.Reason.trim() === '') {
      this.notification.warning('Thông báo', 'Vui lòng nhập lý do điều chuyển.');
      return;
    }

    if (!this.assetTranferDetailTable) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu tài sản để lưu.');
      return;
    }

    const selectedAssets = this.assetTranferDetailTable.getData();
    const rows = this.assetTranferDetailTable.getData();
    if (rows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa có tài sản trong danh sách.');
      return;
    }
    const detailPayload = rows.map((item: any, index: number) => ({
      ID: item.ID || 0,
      STT: index + 1,
      TSTranferAssetID: item.TSTranferAssetID || (this.dataInput.ID || 0),
      AssetManagementID: item.AssetManagementID || 0,
      Quantity: item.Quantity || 1,
      Note: item.Note || "",
      IsDeleted: false       // <-- CỜ ĐÁNH LÀ ĐANG ACTIVE
    }));
    const assetManagements = rows.map(item => ({
      ID: item.AssetManagementID,
      IsAllocation: true,
      StatusID: 1,
      Status: "Chưa sử dụng",
      DepartmentID: this.dataInput.ToDepartmentID,
      EmployeeID: this.dataInput.ReceiverID,

    }));
    // Những detail đã bấm X: chỉ cần ID + IsDeleted = true
    const deletedDetailsPayload = this.deletedDetailIds.map(id => ({
      ID: id,
      STT: 0,
      TSTranferAssetID: this.dataInput.ID || 0,
      AssetManagementID: 0,
      Quantity: 0,
      Note: "",
      IsDeleted: true        // <-- ĐÁNH CỜ XÓA
    }));

    const payloadTransfer = {
      tSTranferAsset: {
        ID: this.dataInput.ID || 0,
        AssetManagementID: 0,
        CodeReport: this.dataInput.CodeReport,
        TranferDate: this.dataInput.TranferDate,
        DeliverID: this.dataInput.DeliverID,
        ReceiverID: this.dataInput.ReceiverID,
        FromDepartmentID: this.dataInput.FromDepartmentID,
        ToDepartmentID: this.dataInput.ToDepartmentID,
        FromChucVuID: this.dataInput.FromChucVuID,
        ToChucVuID: this.dataInput.ToChucVuID,
        Reason: this.dataInput.Reason,
        IsApproveAccountant: false,
        IsApprovedPersonalProperty: false,
        IsApproved: false
      },
      tSAssetManagements: assetManagements,
      tSTranferAssetDetails: [
        ...detailPayload,
        ...deletedDetailsPayload
      ]
    };

    console.log(payloadTransfer);

    this.tsAssetTransferService.saveData(payloadTransfer).subscribe({
      next: () => {
        this.notification.success("Thông báo", "Thành công");
        this.getTranferAsset();
        this.resetModal();
        this.formSubmitted.emit();
        this.activeModal.close(true);
        this.deletedDetailIds = [];
      },
      error: () => {
        this.notification.success("Thông báo", "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
  resetModal() { }
  private resetDetails(): void {
    this.assetTranferDetailData = [];
    if (this.assetTranferDetailTable) this.assetTranferDetailTable.setData([]);
  }
}
