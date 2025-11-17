import { Component, OnInit, Input, Output, EventEmitter, inject, Inject, EnvironmentInjector, ApplicationRef, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';
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
import { TbProductRtcService } from '../../../../old/tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
export function phoneVNValidator(): ValidatorFn {
  const regex = /^(0|\+84)(\d{9})$/; // bắt đầu bằng 0 hoặc +84 và theo sau 9 số
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value?.toString().trim();
    if (!v) return { phoneVN: true };
    return regex.test(v) ? null : { phoneVN: true };
  };
}

import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { ProposeVehicleRepairService } from '../../propose-vehicle-repair/propose-vehicle-repair-service/propose-vehicle-repair.service';
import { VehicleRepairHistoryService } from '../vehicle-repair-history-service/vehicle-repair-history-service.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
@Component({
  selector: 'app-vehicle-repair-history-form',
  standalone: true,
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
  templateUrl: './vehicle-repair-history-form.component.html',
  styleUrl: './vehicle-repair-history-form.component.css'
})
export class VehicleRepairHistoryFormComponent implements OnInit ,AfterViewInit{
@ViewChild('fileTable', { static: false }) tbFileElement!: ElementRef;
  @ViewChild('tblNcc', { static: false }) tblNccRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tbHistoryFile', { static: false }) tbHistoryFileRef!: ElementRef<HTMLDivElement>;
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

  private _existingFilesBuf: any[] = [];
private _fileHydrated = false;

@Input() set existingFiles(v: any[]) {
  this._existingFilesBuf = Array.isArray(v) ? v : [];
  this.tryHydrateFiles(); // thử hydrate ngay khi input đến
}
get existingFiles() { return this._existingFilesBuf; }
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private vehicleRepairService: VehicleRepairService,
    private vehicleManagementService: VehicleManagementService,
    private tbProductRtcService: TbProductRtcService,
    private proposeVehicleRepairService: ProposeVehicleRepairService,
    private vehicleRepairHistoryService: VehicleRepairHistoryService
  ) {
    this.formGroup = this.fb.group({
      VehicleManagementID: ['', [Validators.required]],
      VehicleRepairTypeID: [null, [Validators.required]],
      TimeStartRepair: ['', [Validators.required]],
      TimeEndRepair: [''],
      Reason: ['', [Validators.required, Validators.maxLength(500)]],
      ProposeContent: ['', [Validators.required, Validators.maxLength(500)]],
      EmployeeID: ['', [Validators.required]],
      EmployeeProposeID: [''],
      DateReport: ['', Validators.required],
      Note: [''],
      VehicleName: [''],
      LicensePlate: [{ value: '', disabled: true }],
      EmployeeCode: [{ value: '', disabled: true }],
      SDT: [{ value: '', disabled: true }],
      EmployeeRepairName: [''],
      RepairTypeName: [''],
      CostRepairEstimate: [''],
      CostRepairActual: [''],
      FileName: [''],
      FilePath: [''],
      IsDeleted: [false],
      RepairGarageName: [''],
      ContactPhone: [''],
    });
  }
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

ngAfterViewInit(): void {
  this.getRepairType();
  this.loadFileTable();
 this.tryHydrateFiles();
}
private tryHydrateFiles() {
  // Cần có bảng + có input file + chưa hydrate
  if (!this.fileTable || !Array.isArray(this._existingFilesBuf) || this._existingFilesBuf.length === 0) return;
  if (this._fileHydrated) return;

  const mapped = this._existingFilesBuf.map((f: any, idx: number) => {
    const id         = f.ID ?? f.Id ?? 0;
    const fileName   = f.FileName ?? f.fileName ?? f.SavedFileName ?? f.savedFileName ?? '';
    const serverPath = f.ServerPath ?? f.serverPath ?? f.FilePath ?? f.filePath ?? '';
    const originName = f.OriginName ?? f.originName ?? f.OriginalFileName ?? f.originalFileName ?? fileName;

    return {
      uid: `srv_${id || idx}`,
      ID: id,
      name: fileName,
      FileName: fileName,
      ServerPath: serverPath,
      OriginName: originName,
      status: 'done',
      isDeleted: false,
      IsDeleted: false,
      originFile: null,
      file: null,
      type: 'server',
    };
  });
  console.log('[hydrate] mapped length =', mapped.length, 'first =', mapped[0]);

  // Tránh trùng với file mới đã add
  const existUids = new Set((this.fileList || []).map((x: any) => x.uid));
  const merged = mapped.filter(x => !existUids.has(x.uid));

  if (merged.length) {
    this.fileList = [...merged, ...(this.fileList || [])];
    this.updateFileTable();
  }
  this._fileHydrated = true;
}

private hydrateExistingFiles() {
  if (!this.fileTable || !Array.isArray(this.existingFiles)) return;

  // chuẩn hoá key do backend có thể khác nhau
  const mapOne = (f: any, idx: number) => {
    const id         = f.ID ?? f.Id ?? 0;
    const fileName   = f.FileName ?? f.fileName ?? f.SavedFileName ?? f.savedFileName ?? '';
    const serverPath = f.ServerPath ?? f.serverPath ?? f.FilePath ?? f.filePath ?? '';
    const originName = f.OriginName ?? f.originName ?? f.OriginalFileName ?? f.originalFileName ?? fileName;

    return {
      uid: `srv_${id || idx}`,
      ID: id,
      name: fileName,
      FileName: fileName,
      ServerPath: serverPath,
      OriginName: originName,
      status: 'done',
      isDeleted: false,
      IsDeleted: false,
      originFile: null,
      file: null,
      type: 'server'
    };
  };

  const mapped = this.existingFiles.map(mapOne);
  this.fileList = [...mapped, ...this.fileList];
  this.updateFileTable();
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
onTabChange(i: number) {
  if (i === 1) {
    queueMicrotask(() => {
      if (!this.fileTable && this.tbFileElement?.nativeElement) {
        this.loadFileTable();
      }
      this.tryHydrateFiles();
      this.updateFileTable();
      try { this.fileTable?.redraw(true); } catch {}
    });
  }
}
  ngOnInit(): void {

    this.getVehicle();
    this.getEmployee();
    if (this.dataInput) {
      const { DateReport, TimeStartRepair, TimeEndRepair, VehicleRepairTypeID,...rest } =
        this.dataInput;
      this.formGroup.patchValue(
        {
          ...rest,
          VehicleRepairTypeID: VehicleRepairTypeID || null,
          DateReport: DateReport?.slice(0, 10) || '',
          TimeStartRepair: TimeStartRepair?.slice(0, 10) || '',
          TimeEndRepair: TimeEndRepair?.slice(0, 10) || '',
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
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {
      this.vehicleList = res.data || [];
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
      const raw = this.dataInput?.VehicleRepairTypeID;
      const id = raw === null || raw === undefined || raw === '' ? null : Number(raw);
      if (id != null) {
        // delay 1 microtask để đảm bảo template render options xong
        queueMicrotask(() => this.formGroup.patchValue({ VehicleRepairTypeID: id }, { emitEvent: false }));
      }
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
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
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
  // save() {
  //   this.trimAllStringControls();
  //   if (this.formGroup.invalid) {
  //     Object.values(this.formGroup.controls).forEach(c => { c.markAsTouched(); c.updateValueAndValidity({ onlySelf: true }); });
  //     this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
  //     return;
  //   }



  //   const formValue = this.formGroup.value;
  //   const payload = {
  //     proposeVehicleRepair: {
  //       ID: this.dataInput?.ID ?? 0,
  //       VehicleManagementID: formValue.VehicleManagementID,
  //       DatePropose: formValue.DatePropose,
  //       VehicleRepairTypeID: formValue.VehicleRepairTypeID,
  //       TimeStartRepair: formValue.TimeStartRepair,
  //       TimeEndRepair: formValue.TimeEndRepair || null,
  //       Reason: formValue.Reason,
  //       CostRepairEstimate: Number(formValue.CostRepairEstimate.toString().replace(/\D/g, '')),
  //       CostRepairActual: Number(formValue.CostRepairActual.toString().replace(/\D/g, '')),
  //       EmployeeID: formValue.EmployeeID,
  //       Note: formValue.Note,
  //       IsDeleted: formValue.IsDeleted || false,
  //       RepairGarageName: formValue.RepairGarageName,
  //       ContactPhone: formValue.ContactPhone,
  //       EmployeeProposeID: 92,
  //       ProposeContent: formValue.ProposeContent
  //     },

  //   };
  //   console.log("Payload:", payload);
  //   this.proposeVehicleRepairService.saveData(payload).subscribe({
  //     next: (res: any) => {
  //       if (res?.status == 1) {
  //         this.notification.success('Thành công', 'Lưu thông tin đề xuất thành công');
  //         this.formSubmitted.emit();
  //         this.activeModal.close('save');
  //       } else this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
  //     },
  //     error: (res) => this.notification.error(NOTIFICATION_TITLE.error, res?.error?.message)
  //   });
  // }
    fileList: any[] = [];
      fileTable: any;
        deletedFileIds: any[] = [];
      beforeUpload = (file: any): boolean => {
    const newFile = {
      uid: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'new',
      originFile: file,
      FileName: '',
      ServerPath: '',
      OriginName: file.name,
    };
    this.fileList = [...this.fileList, newFile];
    this.updateFileTable();
    return false;
  };

updateFileTable() {
  if (!this.fileTable) return;
  const active = (this.fileList || []).filter((f: any) => !f.isDeleted && !f.IsDeleted);
  const rows = active.map((f: any, i: number) => ({
    ID: f.ID || i + 1,
    FileName: f.FileName || f.name,
    ServerPath: f.ServerPath || SERVER_PATH,
    OriginName: f.OriginName || f.name,
    uid: f.uid,
    file: f,
  }));
  this.fileTable.setData(rows);
}
   loadFileTable() {
    this.fileTable = new Tabulator(this.tbFileElement.nativeElement, {
     layout: 'fitDataStretch',

  pagination: true,
  paginationSize: 50,
  paginationSizeSelector: [10, 30, 50, 100, 300, 500],
  paginationMode: 'remote',
  movableColumns: true,
  resizableRows: true,
  reactiveData: true,
  //   selectableRows: 1,
  langs: {
    vi: {
      pagination: {
        first: '<<',
        last: '>>',
        prev: '<',
        next: '>',
      },
    },
  },
  locale: 'vi',
  columnDefaults: {
    headerWordWrap: true,
    headerVertical: false,
    headerHozAlign: 'center',
    minWidth: 60,
    hozAlign: 'left',
    vertAlign: 'middle',
    resizable: true,
  },
    height:'100%',
    minHeight:'42vh',

      columns: [
        {
          title: '',
          field: 'actions',
          width: 50,
          hozAlign: 'center',
          formatter: () => {
            return '<i class="fas fa-trash-alt" style="color: #ff4d4f; cursor: pointer; font-size: 16px;"></i>';
          },
          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            this.removeFile(rowData);
          },
          headerHozAlign: 'center',
        },
        {
          title: 'ID',
          field: 'ID',
          width: 70,
          hozAlign: 'center',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Đường dẫn Server',
          field: 'ServerPath',
          width: 300,
          hozAlign: 'left',
          headerHozAlign: 'center',
          visible: false,
          formatter: function (cell: any) {
            const url = cell.getValue();
            if (url) {
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            }
            return '';
          },
        },
        {
          title: 'Tên file gốc',
          field: 'OriginName',
          width: 200,
          visible: false,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
      ],
    });
    this.tryHydrateFiles();
  }

removeFile(rowData: any) {
  const uid = rowData?.uid ?? rowData?.file?.uid;
  const idx = this.fileList.findIndex((x: any) => x.uid === uid || x === rowData.file);
  if (idx < 0) return;

  const f = this.fileList[idx];
  if (f.ID) this.deletedFileIds.push({ ID: f.ID, IsDeleted: true });

  this.fileList[idx].IsDeleted = true;
  this.fileList[idx].isDeleted = true;
  this.updateFileTable();
}
private sanitizePath(s: string): string {
  return (s || '')
    .toString()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// yyyy/MM/LicensePlate_or_ID
private buildSubPath(): string {
  const timeStart = this.formGroup.get('TimeStartRepair')?.value;
  const vName = (this.formGroup.get('VehicleName')?.value || '').toString();
  const plate = (this.formGroup.get('LicensePlate')?.value || '').toString();

  // Năm lấy theo ngày sửa, fallback về năm hiện tại nếu rỗng
  let year = new Date().getFullYear().toString();
  let datePart = 'UnknownDate';

  if (timeStart) {
    const d = new Date(timeStart);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    year = yyyy.toString();
    datePart = `${yyyy}-${mm}-${dd}`; // dạng yyyy-MM-dd
  }

  // Tên folder xe: "Tên xe - Biển số"
  const vehicleRaw = `${vName} ${plate}`.trim() || 'UnknownVehicle';
  const vehiclePart = this.sanitizePath(vehicleRaw); // clean ký tự bậy

  return [year, vehiclePart, datePart].join('/');
}
save() {
  this.trimAllStringControls();

  if (this.formGroup.invalid) {
    Object.values(this.formGroup.controls).forEach(c => {
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
    this.notification.warning('Cảnh báo', 'Vui lòng điền đủ thông tin bắt buộc');
    return;
  }

  const toNumber = (v: any) => v == null || v === '' ? 0 : Number(v.toString().replace(/\D/g, '')) || 0;
  const fv = this.formGroup.getRawValue();

  const payloadMaster = {
    vehicleRepairHistory: {
      ID: this.dataInput?.ID ?? 0,
      VehicleManagementID: fv.VehicleManagementID,
      VehicleRepairTypeID: fv.VehicleRepairTypeID,
      DateReport: fv.DateReport || null,
      TimeStartRepair: fv.TimeStartRepair || null,
      TimeEndRepair: fv.TimeEndRepair || null,
      Reason: fv.Reason || '',
      ProposeContent: fv.ProposeContent || '',
      EmployeeID: fv.EmployeeID,
      EmployeeProposeID: fv.EmployeeProposeID || 0,
      Note: fv.Note || '',
      CostRepairEstimate: toNumber(fv.CostRepairEstimate),
      CostRepairActual: toNumber(fv.CostRepairActual),
      IsDeleted: !!fv.IsDeleted,
      RepairGarageName: fv.RepairGarageName || '',
      ContactPhone: fv.ContactPhone || ''
    },
    vehicleRepairHistoryFiles: [] // để trống ở lượt 1
  };

  // 1) Lưu master
  this.vehicleRepairHistoryService.saveData(payloadMaster).subscribe({
    next: (res) => {
      if (res?.status !== 1) {
        this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        return;
      }

      const historyID = res?.data?.ID ?? res?.data?.HistoryID ?? this.dataInput?.ID ?? 0;
      const historyCodeOrId = res?.data?.Code ?? historyID;

      // 2) Lọc file mới
      const newFiles = (this.fileList || []).filter(
        (f: any) => f?.status === 'new' && !f?.isDeleted && !f?.IsDeleted
      );

      // Không có file mới => chỉ cần xử lý xóa nếu có
      if (newFiles.length === 0) {
        const deleted = (this.deletedFileIds || []).map((d: any) => ({ ...d, VehicleRepairHistoryID: historyID }));
        if (deleted.length === 0) {
          this.notification.success('Thành công', 'Đã lưu thông tin lịch sử sửa chữa');
          this.formSubmitted.emit();
          this.activeModal.close('save');
          return;
        }

        // Gọi save-data lần 2 chỉ với danh sách xoá
        this.vehicleRepairHistoryService.saveData({
          vehicleRepairHistory: null,
          vehicleRepairHistoryFiles: deleted
        }).subscribe({
          next: (r2) => {
            if (r2?.status === 1) {
              this.notification.success('Thành công', 'Đã cập nhật file');
              this.formSubmitted.emit();
              this.activeModal.close('save');
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, r2?.message || 'Cập nhật file thất bại');
            }
          },
          error: (e) => this.notification.error(NOTIFICATION_TITLE.error, e?.error?.message || 'Cập nhật file thất bại')
        });
        return;
      }

      const filesToUpload: File[] = newFiles.map((f: any) => f.originFile as File);
      const subPath = this.buildSubPath();

      // 3) Upload file vật lý
      this.vehicleRepairHistoryService.uploadMultipleFiles(filesToUpload, subPath).subscribe({
        next: (uploadRes) => {
          if (uploadRes?.status !== 1 || !uploadRes?.data?.length) {
            this.notification.error(NOTIFICATION_TITLE.error, uploadRes?.message || 'Upload file thất bại');
            return;
          }

          // Đồng bộ fileList + chuẩn bị DTO file
        const filesMeta = (uploadRes?.data ?? []).map((u: any) => {
  const originName = u.OriginalFileName;
  const savedName  = u.SavedFileName;   // dùng làm FileName gửi API
  const filePath   = u.FilePath;

  if (!savedName || !filePath) {
    console.warn('Upload item thiếu trường bắt buộc:', u);
  }

  // đồng bộ lại fileList cho UI
  const idxInList = this.fileList.findIndex((x: any) => {
    const nf = x.originFile as File;
    return nf && nf.name === originName;
  });

  if (idxInList !== -1) {
    this.fileList[idxInList] = {
      ...this.fileList[idxInList],
      status: 'done',
      FileName: savedName,
      ServerPath: filePath,
      OriginName: originName,
      ID: 0
    };
  }

  // DTO đúng với API: FileName là bắt buộc
  return {
    ID: 0,
    VehicleRepairHistoryID: historyID,
    FileName: savedName,     // bắt buộc
    ServerPath: filePath,
    OriginName: originName,
    IsDeleted: false
  };
});

          this.updateFileTable();
console.log('uploadRes.raw =', uploadRes);
console.log('uploadRes.keys =', uploadRes?.data?.map((x:any)=>Object.keys(x)));
          // Thêm danh sách xoá nếu có
          const deleted = (this.deletedFileIds || []).map((d: any) => ({
            ID: d.ID,
            VehicleRepairHistoryID: historyID,
            IsDeleted: true
          }));
console.log('Files meta payload:', [...filesMeta, ...deleted]);
          // 4) Lưu metadata file qua đúng DTO
          this.vehicleRepairHistoryService.saveData({
            vehicleRepairHistory: null,
            vehicleRepairHistoryFiles: [...filesMeta, ...deleted]
          }).subscribe({
            next: (filesRes) => {
              if (filesRes?.status === 1) {
                this.notification.success('Thành công', `Đã lưu và upload ${filesMeta.length} file`);
                this.formSubmitted.emit();
                this.activeModal.close('save');
              } else {
                this.notification.error(NOTIFICATION_TITLE.error, filesRes?.message || 'Lưu metadata file thất bại');
              }
            },
            error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lưu metadata file thất bại')
          });
        },
        error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Upload file thất bại')
      });
    },
    error: (err) => this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lưu thất bại')
  });
}

}
