import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';

import { MakertrainingService } from '../makertraining-service/makertraining.service';

@Component({
  selector: 'app-makertraining-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzSplitterModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './makertraining-type-form.component.html',
  styleUrl: './makertraining-type-form.component.css',
})
export class MakertrainingTypeFormComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  isLoading: boolean = false;
  isCheckmode: boolean = false;
  isSaveAndAddNew: boolean = false;
  hasSavedData: boolean = false;

  constructor(
    private notification: NzNotificationService,
    private makerTrainingService: MakertrainingService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      ID: [0],
      STT: [0],
      TypeCode: ['', [Validators.required, Validators.maxLength(50)]],
      TypeName: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  ngAfterViewInit(): void {}

  closeModal(result: any = false) {
    this.activeModal.close(result || this.hasSavedData);
  }

  save(isAddNew: boolean = false): void {
    this.isSaveAndAddNew = isAddNew;
    this.saveData();
  }

  saveData() {
    this.form.patchValue({
      TypeCode: (this.form.value.TypeCode || '').trim(),
      TypeName: (this.form.value.TypeName || '').trim(),
    });

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isLoading = true;
    const payload = this.form.value;

    this.makerTrainingService.saveMakerTrainingType(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Lưu thành công!');
          this.hasSavedData = true;
          if (this.isSaveAndAddNew) {
            this.resetForm();
          } else {
            this.activeModal.close(true);
          }
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lưu hạng mục!',
          );
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu!');
        console.error(err);
      },
    });
  }

  resetForm() {
    this.form.reset({
      ID: 0,
      STT: 0,
      TypeCode: '',
      TypeName: '',
    });
  }
}

