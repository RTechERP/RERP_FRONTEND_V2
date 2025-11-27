import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { SelectControlComponent } from '../../../../old/select-control/select-control.component';

import { CustomerServiceService } from '../../customer/customer-service/customer-service.service';
import { CustomerMajorService } from '../customer-major-service/customer-major.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
@Component({
  selector: 'app-customer-major-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    CommonModule,
    NzTreeSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './customer-major-detail.component.html',
  styleUrl: './customer-major-detail.component.css',
})
export class CustomerMajorDetailComponent implements OnInit, AfterViewInit {
  @Input() EditID!: number;
  @Input() isEditMode!: boolean;

  // Form validation
  formGroup: FormGroup;

  Code: any = '';
  Name: any = '';
  majorData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private customerService: CustomerServiceService,
    private customerMajorService: CustomerMajorService,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      STT: [0, [Validators.required, Validators.min(1)]],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadCustomerSpecialization();
  }

  ngAfterViewInit(): void {}

  loadCustomerSpecialization(): void {
    this.customerService.getCustomerSpecialization().subscribe({
      next: (response) => {
        if (response.status === 1) {
          if (this.isEditMode) {
            this.loadDetail(this.EditID);
          } else {
            this.majorData = response.data;
            this.formGroup.patchValue({
              STT: this.majorData.length + 1,
            });
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadDetail(id: number): void {
    this.customerMajorService.getDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          // Cập nhật form values
          this.formGroup.patchValue({
            STT: response.data.STT,
            Code: response.data.Code,
            Name: response.data.Name,
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  closeModal() {
    this.activeModal.close(false);
  }

  save() {
    // Validate form trước khi lưu
    if (!this.validateForm()) {
      return;
    }

    // Lấy giá trị từ form controls
    const formValues = this.formGroup.value;

    const model: any = {
      STT: formValues.STT,
      Code: formValues.Code,
      Name: formValues.Name,
    };

    if (this.isEditMode && this.EditID) {
      model.ID = this.EditID;
    }

    this.customerMajorService.save(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(
            'Lỗi',
            res?.message || 'Không thể lưu dữ liệu'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.message || 'Không thể lưu dữ liệu'
        );
      },
    });
  }

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.formGroup.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'STT':
            return 'Vui lòng nhập STT!';
          case 'Code':
            return 'Vui lòng nhập mã ngành nghề!';
          case 'Name':
            return 'Vui lòng nhập tên ngành nghề!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
      if (control.errors?.['min']) {
        switch (fieldName) {
          case 'STT':
            return 'STT phải lớn hơn 0!';
          default:
            return 'Giá trị không hợp lệ!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
    this.trimAllStringControls();
    const requiredFields = ['STT', 'Code', 'Name'];
    const invalidFields = requiredFields.filter((key) => {
      const control = this.formGroup.get(key);
      return (
        !control ||
        control.invalid ||
        control.value === '' ||
        control.value == null
      );
    });
    if (invalidFields.length > 0) {
      this.formGroup.markAllAsTouched();
      return false;
    }
    return true;
  }
  //#endregion
}
