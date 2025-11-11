import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder, AbstractControl } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { KhoBaseService } from '../../kho-base-service/kho-base.service';

@Component({
  selector: 'app-firm-base-detail',
  templateUrl: './firm-base-detail.component.html',
  styleUrls: ['./firm-base-detail.component.css'],
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    CommonModule,
  ]
})
export class FirmBaseDetailComponent implements OnInit {



    constructor(
      public activeModal: NgbActiveModal,
      private modal: NzModalService,
      private notification: NzNotificationService,
      private khoBaseService: KhoBaseService,
    ) { }

  private fb = inject(NonNullableFormBuilder);
  validateForm = this.fb.group({
    FirmCode: this.fb.control('', [Validators.required]),
    FirmName: this.fb.control('', [Validators.required]),
  });

  ngOnInit() {
  }
  isSubmitting = false;
  onSubmit() {
    
    if (this.validateForm.valid) {
          this.isSubmitting = true;
      let firmCode = this.validateForm.get('FirmCode')?.value ?? '';
      this.khoBaseService.getCheckExistFirmBase(firmCode).subscribe({
        next: (response: any) => {
          if (response.status == 1) {
            // update project
            if (!response.isExist) {
              this.khoBaseService.postSaveFirmBase(this.validateForm.value).subscribe({
                next: (res: any) => {
                  if (res.status == 1) {
                    this.notification.create(
                      'success',
                      'Thông báo',
                      'Thêm dữ liệu thành công!'
                    );
                    this.activeModal.close('success');
                  } else {
                    this.notification.create(
                      'error',
                      'Thông báo',
                      'Lưu dữ liệu thất bại!'
                    );
                  }
                   this.isSubmitting = false;
                },
                error: (err: any) => { 
                   this.isSubmitting = false;
                }
              });
            }
            else {
              this.notification.create(
                'error',
                'Thông báo',
                'Mã hãng đã tồn tại!'
              );
               this.isSubmitting = false;
              return;
            }
          } else {
            this.notification.create(
              'error',
              'Thông báo',
              'Lưu dữ liệu thất bại!'
            );
             this.isSubmitting = false;
          }
        },
        error: (err: any) => {
           this.isSubmitting = false;
         }
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
