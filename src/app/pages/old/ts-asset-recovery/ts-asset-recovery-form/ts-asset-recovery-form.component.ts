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
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
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
    this.assetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      console.log(this.emPloyeeLists);
      if (this.dataInput?.EmployeeReturnID) {
        this.onEmployeeReturnChange(this.dataInput.EmployeeReturnID);
      }
      if (this.dataInput?.EmployeeRecoveryID) {
        this.onEmployeeRecoveryChange(this.dataInput.EmployeeRecoveryID);
      }
    });
  }
  onEmployeeReturnChange(id: number): void {
    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.EmployeeReturnID = emp.ID;
      this.dataInput.DepartmentReturn = emp.DepartmentName;;
      this.dataInput.PossitionReturn = emp.ChucVuHD;
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
        { title: 'Tên tài sản', field: 'TSAssetName' },
        { title: 'Số lượng', field: 'Quantity', headerHozAlign: 'center' },
        { title: 'Tình trạng', field: 'Status', headerHozAlign: 'center', visible: false },
        { title: 'Ghi chú', field: 'Note' }
      ]
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  onSelectAssetRecovery() {
    const modalRef = this.ngbModal.open(TsAssetRecoveryByEmployeeComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput1 = {
      EmployeeReturnID: this.dataInput.EmployeeReturnID,
      RecoverID: this.dataInput.ID
    };
    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (selectedAssets && selectedAssets.length > 0) {
        this.recoveryTable?.addData(selectedAssets);
        this.getRecovery();
      }
    });
    modalRef.result.catch(() => {
      console.log('Modal dismissed');
    });
  }
  saveRecovery() {
    if (!this.recoveryTable) {
      return;
    }
    const selectedAssets = this.recoveryTable.getData();
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
      TSAssetRecoveryDetails: selectedAssets.map((item, index) =>
      ({
        ID: item.ID || 0,
        STT: index + 1,
        TSAssetRecoveryID: item.TSAssetRecoveryID || 0,
        AssetManagementID: item.AssetManagementID || 0,
        Quantity: item.Quantity || 1,
        Note: ""
      }))
    };

    console.log(payloadRecovery);
    this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
      next: () => {
        this.notification.success("Thông báo", "Thành công");
        this.getRecovery();
        this.resetModal();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.success("Thông báo", "Lỗi");
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
