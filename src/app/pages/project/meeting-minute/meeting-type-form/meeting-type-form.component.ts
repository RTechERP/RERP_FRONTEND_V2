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
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectControlComponent } from '../../../old/select-control/select-control.component';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';

import { MeetingMinuteComponent } from '../meeting-minute.component';
import { MeetingMinuteService } from '../meeting-minute-service/meeting-minute.service';
import { NzFormModule } from 'ng-zorro-antd/form';

interface MeetingType {
  GroupID: number;
  TypeCode: string;
  TypeName: string;
  TypeContent: string;
}
@Component({
  selector: 'app-meeting-type-form',
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
    NzSplitterModule,
    NzButtonModule,
    // NzModalModule,
    FormsModule,
    NzFormModule,   
  ],
  templateUrl: './meeting-type-form.component.html',
  styleUrl: './meeting-type-form.component.css',
})
export class MeetingTypeFormComponent implements OnInit, AfterViewInit {
  @Input() meetingtype: any = null; 
  meetingtypeID: number = 0;
  form!: FormGroup;
  ngOnInit(): void {
    this.newMeetingType = {
      GroupID: 0,
      TypeCode: '',
      TypeName: '',
      TypeContent: '',
    };
    this.form = this.fb.group({
      GroupID: [null, [Validators.required]],
      TypeCode: ['', [this.trimRequiredValidator]],
      TypeName: ['', [this.trimRequiredValidator]],
      TypeContent: [''],
    });
    this.fillFormData();
  }

  ngAfterViewInit(): void {}

  newMeetingType: MeetingType = {
    GroupID: 0,
    TypeCode: '',
    TypeName: '',
    TypeContent: '',
  };

  constructor(
    private notification: NzNotificationService,
    private meetingminuteService: MeetingMinuteService,
    private activeModal: NgbActiveModal,
    // private modal: NzModalService,
    // private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder,
  ) {}

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };

  closeModal() {
    this.activeModal.close(true);
  }
  fillFormData(): void {
    if (!this.meetingtype) return;

    const data = this.meetingtype;

    this.meetingtypeID = data.ID
    this.form.patchValue({
      GroupID: data.GroupID,
      TypeCode: data.TypeCode,
      TypeName: data.TypeName,
      TypeContent:data.TypeContent
    });
  }

  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valueRaw = this.form.getRawValue();
    const value = {
      GroupID: valueRaw.GroupID,
      TypeCode: typeof valueRaw.TypeCode === 'string' ? valueRaw.TypeCode.trim() : valueRaw.TypeCode,
      TypeName: typeof valueRaw.TypeName === 'string' ? valueRaw.TypeName.trim() : valueRaw.TypeName,
      TypeContent: typeof valueRaw.TypeContent === 'string' ? valueRaw.TypeContent.trim() : valueRaw.TypeContent,
    };
    const payload = [{
      ID : this.meetingtypeID ?? 0,
      GroupID: value.GroupID,
      TypeCode: value.TypeCode,
      TypeName: value.TypeName,
      TypeContent: value.TypeContent,
    }];
    this.meetingminuteService.saveDataMeetingType(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');
          this.closeModal();
        }else if(res.status === 2) {
          this.notification.warning('Thông báo', 'Mã loại cuộc họp đã tồn tại!');
        } else {
          this.notification.warning('Thông báo', 'Không thể thêm mới!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', err.message || 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      },
    });
  }
}
