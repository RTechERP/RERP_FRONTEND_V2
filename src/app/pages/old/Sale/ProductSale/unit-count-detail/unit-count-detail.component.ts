import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
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
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
interface UnitCount {
  ID?: number,
  UnitCode: string,
  UnitName: string,
}

// Custom validator để kiểm tra ký tự tiếng Việt
function noVietnameseValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Không validate nếu giá trị rỗng
  }
  
  // Regex để kiểm tra ký tự tiếng Việt
  const vietnameseRegex = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴđĐ]/i;
  
  if (vietnameseRegex.test(control.value)) {
    return { vietnameseChars: true };
  }
  
  return null;
}
@Component({
  selector: 'app-unit-count-detail',
  standalone:true,
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
  newUnitCount: UnitCount={
    UnitName: '',
    UnitCode: '',
  }
  @Input() listProductGroupcbb: any[] = [];
  
  formGroup: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService
  ) { 
    this.formGroup = this.fb.group({
      UnitCode: ['', [Validators.required, noVietnameseValidator]],
      UnitName: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Patch form values from input data
    this.formGroup.patchValue({
      UnitCode: this.newUnitCount.UnitCode || '',
      UnitName: this.newUnitCount.UnitName || ''
    });
  }

  ngAfterViewInit(): void {
    
  }
  addNewLocation(){
    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload = [{   
        UnitCode: formValue.UnitCode,
        UnitName: formValue.UnitName,
    }];
    console.log("p", payload)
    this.productsaleService.saveDataUnitCount(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể thêm đơn vị tính!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      }
    });
  }
  closeModal() {
    this.activeModal.dismiss(true);
  }

  // Hàm để lấy error message cho UnitCode
  getUnitCodeError(): string | undefined {
    const control = this.formGroup.get('UnitCode');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập mã đơn vị!';
      }
      if (control.errors?.['vietnameseChars']) {
        return 'Mã đơn vị không được chứa ký tự tiếng Việt!';
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
