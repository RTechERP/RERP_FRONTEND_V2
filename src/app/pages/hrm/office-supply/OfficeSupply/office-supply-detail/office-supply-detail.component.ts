import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyService } from '../office-supply-service/office-supply-service.service';
import { OfficeSupplyUnitDetailComponent } from '../../OfficeSupplyUnit/office-supply-unit-detail/office-supply-unit-detail.component';
import { OfficeSupplyUnitService } from '../../OfficeSupplyUnit/office-supply-unit-service/office-supply-unit-service.service';

interface Product {
  ID?: number;
  CodeRTC: string;
  CodeNCC: string;
  NameRTC: string;
  NameNCC: string;
  SupplyUnitID: number;
  Price: number;
  RequestLimit: number;
  Type: number;
}

@Component({
  selector: 'app-office-supply-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule
  ],
  templateUrl: './office-supply-detail.component.html',
  styleUrl: './office-supply-detail.component.css'
})
export class OfficeSupplyDetailComponent implements OnInit, AfterViewInit {
  @Input() newProduct!: Product;          // data truyền vào khi sửa / thêm
  @Input() isCheckmode: boolean = false;  // true = sửa, false = thêm
  @Input() listUnit: any[] = [];
  @Input() typeOptions: any[] = [];

  validateForm!: FormGroup;

  constructor(
    private officesupplyService: OfficeSupplyService,
    private officesupplyunitService: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

 private initForm() {
  if (!this.newProduct) {
    this.newProduct = {
      ID: 0,
      CodeRTC: '',
      CodeNCC: '',
      NameRTC: '',
      NameNCC: '',
      SupplyUnitID: 0,
      Price: 0,
      RequestLimit: 0,
      Type: 0
    };
  }

  this.validateForm = this.fb.group({
    ID: [this.newProduct?.ID ?? 0],
    CodeRTC: [{ value: this.newProduct?.CodeRTC || '', disabled: true }],
    CodeNCC: [this.newProduct?.CodeNCC || '', [Validators.required, Validators.maxLength(100)]],
    NameRTC: [this.newProduct?.NameRTC || '', [Validators.maxLength(200)]],
    NameNCC: [this.newProduct?.NameNCC || '', [Validators.required, Validators.maxLength(200)]],
    SupplyUnitID: [this.newProduct?.SupplyUnitID || null, [Validators.required, Validators.min(1)]],
    Price: [this.newProduct?.Price ?? 0, [Validators.required, Validators.min(0)]],
    RequestLimit: [this.newProduct?.RequestLimit ?? 0, [Validators.min(0)]],
    Type: [
      this.newProduct?.Type != null ? +this.newProduct.Type : null,
      [Validators.required]
    ]
  });
}

clearSupplyUnit() {
  this.validateForm.get('SupplyUnitID')?.setValue(null);
}
  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    if (this.listUnit.length === 0) {
      this.getUnits();
    }
  }

  getUnits(): void {
    this.officesupplyService.getUnit().subscribe({
      next: (res) => {
        this.listUnit = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
      }
    });
  }

  addNewUnit() {
    const modalRef = this.modalService.open(OfficeSupplyUnitDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedItem = {};

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getUnits();
        }
      },
      () => { }
    );
  }

  private trimAllStringControls() {
    Object.keys(this.validateForm.controls).forEach((k) => {
      const c = this.validateForm.get(k);
      const v = c?.value;
      if (typeof v === 'string') {
        c!.setValue(v.trim(), { emitEvent: false });
      }
    });
  }

  private markFormTouched() {
    Object.values(this.validateForm.controls).forEach(c => {
      c.markAsDirty();
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
  }

  private buildPayload(): Product {
    const formValue = this.validateForm.getRawValue() as Product;
    return {
      ...this.newProduct,
      ...formValue,
      ID: formValue.ID ?? this.newProduct.ID ?? 0
    };
  }

  add(): void {
    this.trimAllStringControls();

    if (this.validateForm.invalid) {
      this.markFormTouched();
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const payload = this.buildPayload();

    this.officesupplyService.adddata(payload).subscribe({
      next: () => {
        this.notification.success('Thông báo', 'Thêm thành công!');
        this.activeModal.close('success');
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }

  update(): void {
    this.trimAllStringControls();

    if (this.validateForm.invalid) {
      this.markFormTouched();
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const payload = this.buildPayload();

    this.officesupplyService.updatedata(payload).subscribe({
      next: () => {
        this.notification.success('Thông báo', 'Cập nhật thành công!');
        this.activeModal.close('success');
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật dữ liệu!');
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
