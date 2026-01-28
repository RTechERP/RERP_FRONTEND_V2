import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
export const SERVER_PATH = `D:/RTC_Sw/RTC/ProductRTC/`;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehicleRepairService } from '../../../vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { VehicleManagementService } from '../../../vehicle-management/vehicle-management.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { VehicleRepairTypeFormComponent } from '../../../vehicle-repair/vehicle-repair-type/vehicle-repair-type-form/vehicle-repair-type-form.component';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TbProductRtcService } from '../../../../../old/tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
export function phoneVNValidator(): ValidatorFn {
  const regex = /^(0|\+84)(\d{9})$/; // bắt đầu bằng 0 hoặc +84 và theo sau 9 số
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value?.toString().trim();
    if (!v) return { phoneVN: true };
    return regex.test(v) ? null : { phoneVN: true };
  };
}
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { ProposeVehicleRepairService } from '../../propose-vehicle-repair/propose-vehicle-repair-service/propose-vehicle-repair.service';
type ProposeDetail = {
  VehicleRepairProposeID?: number;
  ID?: number;
  STT?: number;
  IsApprove?: number;
  ApproveID?: number;
  GaraName?: string;
  AddressGara?: string;
  SDTGara?: string;
  Quantity?: number;
  Unit?: string;
  UnitPrice?: number;
  TotalPrice?: number;
  WarrantyPeriod?: number;
  Note?: string;
};
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
@Component({
  standalone: true,
  selector: 'app-propose-vehicle-repair-form',
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    FormsModule,
    NzFlexModule,
    NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzFormModule,
    FormsModule,
    ReactiveFormsModule,
    NzUploadModule,
  ],
  templateUrl: './propose-vehicle-repair-form.component.html',
  styleUrl: './propose-vehicle-repair-form.component.css',
})
export class ProposeVehicleRepairFormComponent
  implements OnInit, AfterViewInit {
  @ViewChild('tblNcc', { static: false })
  tblNccRef!: ElementRef<HTMLDivElement>;
  private nccTable!: Tabulator;
  private detailsBuffer: any[] = [];
  private deletedDetails: { ID: number; IsDeleted: boolean }[] = [];
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private vehicleRepairService: VehicleRepairService,
    private vehicleManagementService: VehicleManagementService,
    private tbProductRtcService: TbProductRtcService,
    private proposeVehicleRepairService: ProposeVehicleRepairService
  ) {
    this.formGroup = this.fb.group({
      VehicleManagementID: ['', [Validators.required]],
      VehicleRepairTypeID: ['', [Validators.required]],
      TimeStartRepair: ['', [Validators.required]],
      TimeEndRepair: [''],
      KmPreviousPeriod: [0],
      KmCurrentPeriod: [0],
      Reason: ['', [Validators.required, Validators.maxLength(500)]],
      ProposeContent: ['', [Validators.required, Validators.maxLength(500)]],
      EmployeeID: ['', [Validators.required]],
      EmployeeProposeID: [''],
      DatePropose: ['', [Validators.required]],
      Note: [''],
      VehicleName: [''],
      LicensePlate: [{ value: '', disabled: true }],
      EmployeeCode: [''],
      SDT: [''],
      EmployeeRepairName: [''],
      RepairTypeName: [''],
      CostRepairEstimate: [''],
      CostRepairActual: [''],
      FileName: [''],
      FilePath: [''],
      IsDeleted: [false],
      RepairGarageName: [''],
      ContactPhone: [''],
      TimePrevious: [''],
    });
  }
  formGroup: FormGroup;
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private ngbModal = inject(NgbModal);
  fileToUpload: File | null = null;
  public activeModal = inject(NgbActiveModal);
  previewImageUrl: string | null = null;
  imageFileName: string | null = null;
  employeeList: any[] = [];
  vehicleList: any[] = [];
  TypeList: any[] = [];
  fathSever: string = 'D:/RTC_Sw/RTC/VehicleRepair/';

  // Getter để tính số KM trong kỳ (hiển thị, không lưu DB)
  get kmDifference(): number {
    const kmCurrent = Number(this.formGroup?.get('KmCurrentPeriod')?.value) || 0;
    const kmPrevious = Number(this.formGroup?.get('KmPreviousPeriod')?.value) || 0;
    return kmCurrent - kmPrevious;
  }

  // Formatter và Parser cho số Km với dấu phân cách nghìn
  kmFormatter = (value: number | string): string => {
    if (value == null || value === '') return '';
    const num = typeof value === 'string' ? Number(value.replace(/\./g, '').replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN');
  };

  kmParser = (value: string): number => {
    if (!value) return 0;
    return Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;
  };
  private syncEmployeeFields(id?: number) {
    if (!id) return;
    const emp = this.employeeList.find((x) => x.ID === id);
    if (!emp) return;
    this.formGroup.patchValue(
      {
        EmployeeCode: emp.Code || '',
        EmployeeRepairName: emp.FullName || '',
        SDT: emp.SDTCaNhan || '',
      },
      { emitEvent: false }
    );
  }

  private syncVehicleFields(id?: number) {
    if (!id) return;
    const v = this.vehicleList.find((x) => x.ID === id);
    if (!v) return;
    this.formGroup.patchValue(
      {
        VehicleName: v.VehicleName || '',
        LicensePlate: v.LicensePlate || '',
      },
      { emitEvent: false }
    );
  }

  private ensureNccTableReady() {
    if (!this.tblNccRef?.nativeElement) return;

    const mapped = this.mapDetail(this.detailsBuffer);

    if (!this.nccTable) {
      // lần đầu: khởi tạo
      this.initNccTable(mapped);
      if (!mapped.length) this.addDetailRow();
    } else {
      // đã có bảng: chỉ set lại data
      this.nccTable.setData(mapped).then(() => {
        this.reSTT();
        this.nccTable!.redraw(true);
      });
    }
  }
  private tableInited = false;
  private initNccTable(data: ProposeDetail[] = []) {
    const el = this.tblNccRef.nativeElement;

    this.nccTable = new Tabulator(el, {
      ...DEFAULT_TABLE_CONFIG,
      height: '40vh',
      data,
      layout: 'fitColumns',
      reactiveData: true,
      rowHeader: false, // Bỏ checkbox tích chọn ở đầu bảng

      columns: [
        {
          title: '',
          width: 48,
          hozAlign: 'center',
          headerSort: false,
          frozen: true, // Frozen cột đầu tiên
          // Header: nút + để thêm dòng
          titleFormatter: () => `
      <div class="d-flex justify-content-center align-items-center h-100">
        <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i>
      </div>
    `,
          headerClick: () => {
            this.addDetailRow();
          },
          // Row: nút x để xóa dòng
          formatter: () => `
      <i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>
    `,
          cellClick: (_e, cell) => {
            const row = cell.getRow();
            const d = row.getData() as ProposeDetail;
            if (d.ID && d.ID > 0) {
              // tránh trùng ID
              if (!this.deletedDetails.some((x) => x.ID === d.ID)) {
                this.deletedDetails.push({ ID: d.ID, IsDeleted: true });
              }
            }
            row.delete();
            this.reSTT();
          },
        },
        {
          title: 'STT',
          field: 'STT',
          width: 64,
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'VehicleRepairProposeID',
          field: 'VehicleRepairProposeID',
          width: 64,
          hozAlign: 'center',
          headerHozAlign: 'center',
          visible: false,
        },
        {
          title: 'ID',
          field: 'ID',
          width: 64,
          hozAlign: 'center',
          headerHozAlign: 'center',
          visible: false,
        },
        { title: 'Tên NCC', field: 'GaraName', width: 200, editor: 'input' },
        {
          title: 'Địa chỉ NCC',
          field: 'AddressGara',
          width: 240,
          editor: 'input',
        },
        { title: 'SĐT NCC', field: 'SDTGara', width: 130, editor: 'input' },
        {
          title: 'Số lượng',
          field: 'Quantity',
          width: 110,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: 'number',
          editorParams: { min: 0, step: 1 },
        },
        { title: 'Đơn vị', field: 'Unit', width: 100, editor: 'input' },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          width: 130,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: 'number',
          editorParams: { min: 0, step: 1000 },
          formatter: 'money',
          formatterParams: {
            decimal: ',',
            thousand: '.',
            symbol: 'đ',
            symbolAfter: true,
            precision: 0,
          },
        },
        {
          title: 'Thành tiền',
          field: 'TotalPrice',
          width: 140,
          hozAlign: 'right',
          headerHozAlign: 'center',
          mutator: (_v, d: ProposeDetail) =>
            Number(d.Quantity || 0) * Number(d.UnitPrice || 0),
          formatter: 'money',
          formatterParams: {
            decimal: ',',
            thousand: '.',
            symbol: 'đ',
            symbolAfter: true,
            precision: 0,
          },
        },
        {
          title: 'Bảo hành (tháng)',
          field: 'WarrantyPeriod',
          width: 130,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: 'number',
          editorParams: { min: 0, step: 1 },
        },
        { title: 'Ghi chú', field: 'Note', width: 220, editor: 'textarea' },
      ],
    });
    this.nccTable.on('dataChanged', (newData: ProposeDetail[]) => {
      this.detailsBuffer = [...newData];
    });

    this.nccTable.on('cellEdited', (cell) => {
      const f = cell.getField();
      if (f === 'Quantity' || f === 'UnitPrice') {
        const row = cell.getRow();
        const d = row.getData() as ProposeDetail;
        row.update({
          TotalPrice: Number(d.Quantity || 0) * Number(d.UnitPrice || 0),
        });
      }
    });
    // auto có 1 dòng trống
    this.addDetailRow();
  }

  private reSTT() {
    const rows = this.nccTable.getRows();
    rows.forEach((r, i) => r.update({ STT: i + 1 }));
  }

  addDetailRow() {
    const next = (this.nccTable?.getDataCount?.() || 0) + 1;
    this.nccTable.addRow(
      {
        ID: 0,
        STT: next,
        IsApprove: 0,
        ApproveName: '',
        GaraName: '',
        AddressGara: '',
        SDTGara: '',
        Quantity: 1,
        Unit: '',
        UnitPrice: 0,
        TotalPrice: 0,
        WarrantyPeriod: 0,
        Note: '',
        IsDeleted: false,
      },
      true
    );
    this.nccTable.setSort('STT', 'asc');
  }

  clearDetails() {
    if (!this.nccTable) return;
    this.nccTable.clearData();
    this.addDetailRow();
  }
  private getNccDetails(): ProposeDetail[] {
    if (this.nccTable)
      return (this.nccTable.getData() as ProposeDetail[]) || [];
    return this.mapDetail(this.detailsBuffer); // fallback khi chưa mở tab
  }

  ngOnInit(): void {
    this.getRepairType();
    this.getVehicle();
    this.getEmployee();
    if (this.dataInput?.ID) this.loadDetails(this.dataInput.ID);
    if (this.dataInput) {
      const { DatePropose, TimeStartRepair, TimeEndRepair, ...rest } =
        this.dataInput;
      this.formGroup.patchValue(
        {
          ...rest,

          DatePropose: DatePropose?.slice(0, 10) || '',
          TimeStartRepair: TimeStartRepair?.slice(0, 10) || '',
          TimeEndRepair: TimeEndRepair?.slice(0, 10) || '',
          TimePrevious: this.dataInput.TimePrevious?.slice(0, 10) || '',
        },
        { emitEvent: false }
      );
    } else {
      const today = DateTime.now().toISODate();
      this.formGroup.patchValue(
        {
          DatePropose: today,
          DateReport: today,
          TimeStartRepair: today,
        },
        { emitEvent: false }
      );
    }
    this.formGroup
      .get('VehicleManagementID')!
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter((id: any) => !!id)
      )
      .subscribe((id: number) => {
        const v = this.vehicleList.find((x) => x.ID === id);
        if (!v) return;

        this.formGroup.patchValue(
          {
            VehicleName: v.VehicleName || '',
            LicensePlate: v.LicensePlate || '',
          },
          { emitEvent: false }
        );

        if (v.EmployeeID) {
          this.formGroup.patchValue(
            { EmployeeID: v.EmployeeID },
            { emitEvent: true }
          );
        }
      });
    this.formGroup
      .get('EmployeeID')!
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter((id: any) => !!id)
      )
      .subscribe((id: number) => {
        const emp = this.employeeList.find((x) => x.ID === id);
        if (!emp) return;

        this.formGroup.patchValue(
          {
            EmployeeCode: emp.Code || '',
            EmployeeRepairName: emp.FullName || '',
            SDT: emp.SDTCaNhan || '',
          },
          { emitEvent: false }
        );
      });
    this.formGroup.get('CostRepairEstimate')!.valueChanges.subscribe((val) => {
      if (val == null || val === '') return;
      const clean = val.toString().replace(/\D/g, '');
      const formatted = Number(clean).toLocaleString('vi-VN');
      this.formGroup.patchValue(
        {
          CostRepairEstimate: formatted + 'đ',
        },
        { emitEvent: false }
      );
    });

    this.formGroup.get('CostRepairActual')!.valueChanges.subscribe((val) => {
      if (val == null || val === '') return;
      const clean = val.toString().replace(/\D/g, '');
      const formatted = Number(clean).toLocaleString('vi-VN');
      this.formGroup.patchValue(
        {
          CostRepairActual: formatted + 'đ',
        },
        { emitEvent: false }
      );
    });
    queueMicrotask(() => {
      const vId = this.formGroup.value?.VehicleManagementID;
      const eId = this.formGroup.value?.EmployeeID;
      if (vId) this.formGroup.get('VehicleManagementID')!.setValue(vId);
      if (eId) this.formGroup.get('EmployeeID')!.setValue(eId);
    });
  }
  private loadDetails(id: number) {
    this.deletedDetails = [];
    this.proposeVehicleRepairService
      .getProposeVehicleRepairDetail(id)
      .subscribe({
        next: (res: any) => {
          const raw = res?.data?.dataList ?? res?.data?.proposeDetail ?? [];
          this.detailsBuffer = Array.isArray(raw) ? raw : [raw].filter(Boolean);

          // Cập nhật bảng NCC nếu đã khởi tạo
          setTimeout(() => {
            this.ensureNccTableReady();
          }, 100);
        },
        error: (err) =>
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Không lấy được chi tiết'
          ),
      });
  }

  private hydrateDetailsBuffer() {
    if (!this.nccTable) return;
    const mapped = this.mapDetail(this.detailsBuffer);
    if (mapped.length) {
      this.nccTable.setData(mapped).then(() => {
        this.reSTT();
        this.nccTable.redraw(true);
      });
    } else {
      // chỉ THÊM MỚI mới tự thêm 1 dòng trống
      if (!this.dataInput?.ID && this.nccTable.getDataCount() === 0)
        this.addDetailRow();
    }
  }
  ngOnDestroy(): void {
    try {
      this.nccTable?.destroy();
    } catch { }
  }
  private mapDetail(raw: any[]): ProposeDetail[] {
    return (raw || []).map((x: any, i: number) => {
      const q = Number(x.Quantity ?? 1);
      const u = Number(x.UnitPrice ?? 0);
      return {
        VehicleRepairProposeID: x.VehicleRepairProposeID ?? 0,
        ID: x.ID ?? 0,
        STT: x.STT ?? i + 1,
        GaraName: x.GaraName ?? '',
        AddressGara: x.AddressGara ?? '',
        SDTGara: x.SDTGara ?? '',
        Quantity: isNaN(q) ? 0 : q,
        Unit: x.Unit ?? '',
        UnitPrice: isNaN(u) ? 0 : u,
        TotalPrice: Number(x.TotalPrice ?? q * u) || 0,
        WarrantyPeriod: Number(x.WarrantyPeriod) || 0,
        Note: x.Note ?? '',
      };
    });
  }
  getEmployee() {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe((res) => {
      this.employeeList = res.data || [];
      const eId = this.formGroup.value?.EmployeeID;
      if (eId) {
        // set lại để bắn event nếu muốn
        this.formGroup.get('EmployeeID')!.setValue(eId, { emitEvent: true });
        // hoặc hydrate thủ công, chắc chắn ăn
        this.syncEmployeeFields(eId);
      }
    });
  }
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {
      var list: any = res.data;
      this.vehicleList = list.filter((x: any) => x.VehicleCategoryID === 1);
      const vId = this.formGroup.value?.VehicleManagementID;
      if (vId) {
        this.formGroup
          .get('VehicleManagementID')!
          .setValue(vId, { emitEvent: true });
        this.syncVehicleFields(vId);
      }
    });
  }
  getRepairType() {
    this.vehicleRepairService.getVehicleRepairType().subscribe((res) => {
      this.TypeList = res.data || [];
      console.log('res', res);
      console.log('repairTypes', this.TypeList);
    });
  }
  ngAfterViewInit(): void {
    // Khởi tạo bảng NCC sau khi view ready
    setTimeout(() => {
      this.ensureNccTableReady();
    }, 100);
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  fileList: NzUploadFile[] = [];
  previewFileUrl: string | null = null;
  previewMime = '';

  selectedFile: File | null = null;
  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = file as any as File;
    if (raw) {
      const url = URL.createObjectURL(raw);
      (file as any).url = url;
      (file as any).objectURL = url;
      this.selectedFile = raw;
    }
    this.fileList = [file];
    this.formGroup.patchValue({ FileName: file.name });
    this.formGroup.get('FileName')?.markAsDirty();
    return false;
  };

  onRemove = (f: NzUploadFile): boolean => {
    const url = (f as any).objectURL;
    if (url) URL.revokeObjectURL(url);
    this.fileList = [];
    this.selectedFile = null; // reset để tránh dùng nhầm
    this.formGroup.patchValue({ FileName: '' });
    return true;
  };

  handlePreview(file: NzUploadFile) {
    const url = (file as any).objectURL || file.url || file.thumbUrl;
    if (url) window.open(url, '_blank');
  }

  openPreview() {
    if (!this.previewFileUrl) return;

    window.open(this.previewFileUrl, '_blank');
  }
  private validateNccDetails(details: ProposeDetail[]): boolean {
    const phoneRegex = /^(0|\+84)(\d{9})$/; // SĐT VN hợp lệ
    for (let i = 0; i < details.length; i++) {
      const d = details[i];

      // kiểm tra SĐT NCC
      if (d.SDTGara && !phoneRegex.test(d.SDTGara.toString().trim())) {
        this.notification.warning(
          'Cảnh báo',
          `Dòng ${d.STT}: Số điện thoại NCC không hợp lệ`
        );
        return false;
      }
      if (!d.GaraName || d.GaraName.trim() === '') {
        this.notification.warning(
          'Cảnh báo',
          `Dòng ${d.STT}: Tên NCC không được để trống`
        );
        return false;
      }
    }
    return true;
  }
  addType() {
    const modalRef = this.ngbModal.open(VehicleRepairTypeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null; // thêm mới

    modalRef.result.then(
      () => {
        // chỉ chạy khi form con close(true)
        this.getRepairType();
      },
      () => {
        // user bấm hủy -> không làm gì
      }
    );

    // Tuyệt đối KHÔNG gọi this.activeModal.dismiss() ở đây.
    // Cha không tự đóng modal con.
  }
  save() {
    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach((c) => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      const invalidDates: string[] = [];
      ['DatePropose', 'TimeStartRepair', 'TimeEndRepair'].forEach((key) => {
        const ctrl = this.formGroup.get(key);
        const val = ctrl?.value;
        if (val) {
          const d = new Date(val);
          if (!(d instanceof Date) || isNaN(d.getTime()))
            invalidDates.push(key);
        }
      });

      if (invalidDates.length > 0) {
        this.notification.warning('Cảnh báo', 'Định dạng ngày không hợp lệ');
        return;
      }

      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    const details = this.getNccDetails();
    if (details.length === 0) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng thêm ít nhất 1 dòng NCC đề xuất'
      );
      return;
    }
    if (!this.validateNccDetails(details)) return;
    if (!this.validateNccDetails(details)) return;
    const kept = this.getNccDetails().map((d) => ({
      ...d,
      IsDeleted: false,
    }));
    const mergedDetails = [...kept, ...this.deletedDetails];
    const formValue = this.formGroup.value;
    const payload = {
      proposeVehicleRepair: {
        ID: this.dataInput?.ID ?? 0,
        VehicleManagementID: formValue.VehicleManagementID,
        DatePropose: formValue.DatePropose,
        VehicleRepairTypeID: formValue.VehicleRepairTypeID,
        TimeStartRepair: formValue.TimeStartRepair,
        TimeEndRepair: formValue.TimeEndRepair || null,
        KmPreviousPeriod: Number(formValue.KmPreviousPeriod) || 0,
        KmCurrentPeriod: Number(formValue.KmCurrentPeriod) || 0,
        Reason: formValue.Reason,
        CostRepairEstimate: Number(
          formValue.CostRepairEstimate.toString().replace(/\D/g, '')
        ),
        CostRepairActual: Number(
          formValue.CostRepairActual.toString().replace(/\D/g, '')
        ),
        EmployeeID: formValue.EmployeeID,
        Note: formValue.Note,
        IsDeleted: formValue.IsDeleted || false,
        RepairGarageName: formValue.RepairGarageName,
        ContactPhone: formValue.ContactPhone,
        EmployeeProposeID: 92,
        ProposeContent: formValue.ProposeContent,
        TimePrevious: formValue.TimePrevious || null,
      },
      proposeVehicleRepairDetails: mergedDetails,
    };
    console.log('Payload:', payload);
    this.proposeVehicleRepairService.saveData(payload).subscribe({
      next: (res: any) => {
        if (res?.status == 1) {
          this.notification.success(
            'Thành công',
            'Lưu thông tin đề xuất thành công'
          );
          this.formSubmitted.emit();
          this.activeModal.close('save');
        } else
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Lưu thất bại'
          );
      },
      error: (res) =>
        this.notification.error(NOTIFICATION_TITLE.error, res?.error?.message),
    });
  }
}
