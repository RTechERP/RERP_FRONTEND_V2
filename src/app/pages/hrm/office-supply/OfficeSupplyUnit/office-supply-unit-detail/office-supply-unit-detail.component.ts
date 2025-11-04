import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OfficeSupplyUnitService } from '../office-supply-unit-service/office-supply-unit-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';
interface newOfficeSupplyUnit {
  ID?: number;
  Name: string;
}

@Component({
  selector: 'app-office-supply-unit-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './office-supply-unit-detail.component.html',
  styleUrl: './office-supply-unit-detail.component.css'
})
export class OfficeSupplyUnitDetailComponent implements OnInit {
  
  @Input() isCheckmode: any;
  @Input() selectedItem: any = {};
validateForm!: FormGroup<{ unitName: FormControl<string> }>;
  unitName: string = '';

  constructor(
    private fb: NonNullableFormBuilder,
    private officesupplyunitSV: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {
    this.validateForm = this.fb.group({
    unitName: this.fb.control('', Validators.required)
  });
  }


  ngOnInit(): void {
    const name = this.selectedItem?.Name ?? '';
    this.validateForm.patchValue({ unitName: name });
  }

 private trimAllStringControls() {
    Object.keys(this.validateForm.controls).forEach((k) => {
      const c = this.validateForm.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  saveDataOfficeSupplyUnit() {
  this.trimAllStringControls();

  if (this.validateForm.invalid) {
    Object.values(this.validateForm.controls).forEach(c => {
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
    this.notification.warning('Cảnh báo', 'Vui lòng điền đủ thông tin bắt buộc');
    return;
  }

     const name = this.validateForm.value.unitName;  
    const payload = {
      ID: this.isCheckmode ? (this.selectedItem?.ID ?? 0) : 0,
      Name: name,
      IsDeleted: false
    };

    this.officesupplyunitSV.savedata(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thông báo', this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm thành công!');
          this.activeModal.close('success');
        }
      },
      error: (res: any) => this.notification.error('Thông báo', res.error.message || 'Có lỗi xảy ra khi lưu dữ liệu!')
    });
  }



  closeModal() {
    this.activeModal.dismiss(true);
  }
}
