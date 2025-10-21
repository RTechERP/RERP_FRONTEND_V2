import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule
  ],
  selector: 'app-tb-product-group-rtc-form',
  templateUrl: './tb-product-group-rtc-form.component.html',
  styleUrls: ['./tb-product-group-rtc-form.component.css']
})
export class TbProductGroupRtcFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  formGroup: FormGroup;
  public activeModal = inject(NgbActiveModal);

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService
  ) {
    this.formGroup = this.fb.group({
      NumberOrder: [null, [Validators.required]],
      ProductGroupNo: ['', [Validators.required, Validators.maxLength(20)]],
      ProductGroupName: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit() {
    if (this.dataInput) {
      this.formGroup.patchValue(this.dataInput);
    }
  }

  ngAfterViewInit(): void {}

  saveProduct() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;
    const payload = {
      productGroupRTC: {
        ID: this.dataInput?.ID || 0,
        NumberOrder: formValue.NumberOrder,
        ProductGroupName: formValue.ProductGroupName,
        ProductGroupNo: formValue.ProductGroupNo,
        WarehouseID: this.dataInput?.WarehouseID || 1,
        IsDeleted: false
      },
      productRTCs: []
    };
    console.log("Payload", payload);
    this.tbProductRtcService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) 
          {
            if(payload.productGroupRTC.ID <=0)
              {
                this.notification.success('Thành công', 'Thêm mới thành công!');
              }else
              {
                this.notification.success('Thành công', 'Cập nhật thành công!');
              }
              this.formSubmitted.emit();
              this.activeModal.close(true);
         }else 
         {
          this.notification.warning('Thông báo', res.message || 'Không thể cập nhật sản phẩm!');
         }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể lưu nhóm TB');
      }
    });
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
