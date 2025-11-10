import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

interface UnitCount {
  ID?: number;
  UnitCode: string;
  UnitName: string;
}

// Custom validator để kiểm tra ký tự tiếng Việt
function noVietnameseValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Không validate nếu giá trị rỗng
  }

  const vietnameseRegex = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴđĐ]/i;

  if (vietnameseRegex.test(control.value)) {
    return { vietnameseChars: true };
  }

  return null;
}

@Component({
  selector: 'app-unit-count-detail',
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
  templateUrl: './unit-count-detail.component.html',
  styleUrl: './unit-count-detail.component.css'
})
export class UnitCountDetailComponent implements OnInit, AfterViewInit {
  // giữ cả ID
  newUnitCount: UnitCount = {
    UnitName: '',
    UnitCode: '',
  };

  @Input() listProductGroupcbb: any[] = [];
  @Input() unitCount: UnitCount | null = null; // nhận input có thể có ID
  formGroup: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private productsaleService: ProductsaleServiceService
  ) {
    this.formGroup = this.fb.group({
      UnitCode: ['', [Validators.required]],
      UnitName: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Nếu component nhận dữ liệu unitCount (tức là sửa), patch form và giữ ID
    if (this.unitCount) {
      this.newUnitCount.ID = this.unitCount.ID;
      this.formGroup.patchValue({
        UnitCode: this.unitCount.UnitCode || '',
        UnitName: this.unitCount.UnitName || ''
      });
    } else {
      // mặc định (thêm mới)
      this.formGroup.patchValue({
        UnitCode: this.newUnitCount.UnitCode || '',
        UnitName: this.newUnitCount.UnitName || ''
      });
    }
  }

  ngAfterViewInit(): void { }

  // unify: dùng 1 method save cho cả create/update
  saveUnitCount(): void {
if (this.formGroup.invalid) {
    Object.values(this.formGroup.controls).forEach(c => {
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đủ thông tin bắt buộc');
    return;
  }
    const formValue = this.formGroup.getRawValue();
    const payload: any = {
      UnitCode: formValue.UnitCode,
      UnitName: formValue.UnitName
    };

    // Nếu có ID -> update, ngược lại -> create
    if (this.newUnitCount.ID && this.newUnitCount.ID > 0) {
      // giả sử API update nhận (id, payload) hoặc payload chứa ID
      payload.ID = this.newUnitCount.ID;
      const payloadList = [payload];
      console.log('Update payload:', payloadList);
      
      this.productsaleService.saveDataUnitCount(payloadList).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal('updated');
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể cập nhật đơn vị tính!');
          }
        },
        error: (err) => {
          const apiMessage = err.error?.message || 'Có lỗi xảy ra khi cập nhật!';
          this.notification.error(NOTIFICATION_TITLE.error, apiMessage);
        }
      });
    } else {
      // create
      const createPayload = [payload]; // theo dạng API bạn dùng trước đó
      console.log('Create payload:', createPayload);
      this.productsaleService.saveDataUnitCount(createPayload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal('updated');
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message.message || 'Không thể thêm đơn vị tính!');
          }
        },
        error: (err) => {
          const apiMessage = err.error?.message || 'Có lỗi xảy ra khi thêm mới!';
          this.notification.error(NOTIFICATION_TITLE.error, apiMessage);
        }
      });
    }
  }

  // Đóng modal và trả về giá trị cho component cha
  closeModal(result?: any) {
    this.activeModal.close(result);
  }

  // Hàm để lấy error message cho UnitCode
  getUnitCodeError(): string | undefined {
    const control = this.formGroup.get('UnitCode');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập mã đơn vị!';
      }
    }
    return undefined;
  }

  // Hàm để lấy error message cho UnitName
  getUnitNameError(): string | undefined {
    const control = this.formGroup.get('UnitName');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập tên đơn vị!';
      }
    }
    return undefined;
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
}
