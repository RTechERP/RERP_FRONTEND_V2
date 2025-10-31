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
import { ProjectService } from '../project-service/project.service';
interface FirmBase {
  ID?: number,
  FirmCode: string,
  FirmName: string,
  FirmType: number,
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
  selector: 'app-firm-base-detail',
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
  templateUrl: './firm-base-detail.component.html',
  styleUrl: './firm-base-detail.component.css'
})
export class FirmBaseDetailComponent {
  newFirmBase: FirmBase= {
    FirmCode: '',
    FirmName: '',
    FirmType: 1,
  };
  firmtype = [
    { id: 2, name: 'Demo' },
    { id: 1, name: 'Sale' }
  ];
  formGroup: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private projectService :ProjectService
  ) { 
    this.formGroup = this.fb.group({
      FirmName: ['', [Validators.required]],
      FirmCode: ['', [Validators.required, noVietnameseValidator]],
      FirmType: [1, [Validators.required]]
    });
  }
  ngOnInit(): void {
    // Patch form values from input data
    this.formGroup.patchValue({
      FirmName: this.newFirmBase.FirmName || '',
      FirmCode: this.newFirmBase.FirmCode || '',
    });
    
  }
  ngAfterViewInit(): void {
  }
   // Hàm để lấy error message cho FirmName
   getFirmNameError(): string | undefined {
    const control = this.formGroup.get('FirmName');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập tên hãng!';
      }
    }
    return undefined;
  }
  //hàm thêm
  addNewFirm(){
    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload = {   
        FirmCode: formValue.FirmCode,
        FirmName: formValue.FirmName,
    };
  console.log("payload",payload);
    this.projectService.saveFirmBase(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể thêm hãng!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      }
    });
  }
  // Hàm để lấy error message cho FirmCode
  getFirmCodeError(): string | undefined {
    const control = this.formGroup.get('FirmCode');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập mã hãng!';
      }
      if (control.errors?.['vietnameseChars']) {
        return 'Mã hãng không được chứa ký tự tiếng Việt!';
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
  closeModal() {
    this.activeModal.dismiss(true);
  }
}
