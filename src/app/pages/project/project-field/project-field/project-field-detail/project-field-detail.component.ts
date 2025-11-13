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
import { SelectControlComponent } from '../../../../old/select-control/select-control.component';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { MeetingMinuteService } from '../../../meeting-minute/meeting-minute-service/meeting-minute.service';
import { ProjectFieldService } from '../project-field-service/project-field.service';
import { ProjectService } from '../../../project-service/project.service';

interface BussinessField {
  ID: number;
  STT: number;
  Code: string;
  Name: string;
  Note: string;
  IsDeleted: boolean;
}
@Component({
  selector: 'app-project-field-detail',
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
  templateUrl: './project-field-detail.component.html',
  styleUrl: './project-field-detail.component.css'
})
export class ProjectFieldDetailComponent implements OnInit, AfterViewInit {
  @Input() isEditMode: boolean = false;
  @Input() projectField: any = null;
  constructor(
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder,
    private projectFieldService: ProjectFieldService,
  ) {}
  form!: FormGroup;
  newBussinessField: BussinessField = {
    ID: 0,
    STT: 0,
    Code: '',
    Name: '',
    Note: '',
    IsDeleted: false,
  };
  ngOnInit(): void {
    this.form = this.fb.group({
      STT: [0, [Validators.required]],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      Note: [''],
    });
    // Luôn patch value từ projectField nếu có (cả edit và add mode)
    // projectField đã được truyền vào từ component cha với STT đã được tính sẵn
    if(this.projectField){
      this.form.patchValue(this.projectField);
    }else{
      this.form.patchValue(this.newBussinessField);
    }
    console.log('ngOnInit');
  }
  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
  }
  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };
  closeModal() {
    this.activeModal.close(false);
  }
  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valueRaw = this.form.getRawValue();
    // GỬI TRỰC TIẾP OBJECT BusinessField (không lồng ProjectField)
    const projectField: any = {
      ID: this.projectField.ID ?? 0,
      STT: valueRaw.STT,
      Code: typeof valueRaw.Code === 'string' ? valueRaw.Code.trim() : valueRaw.Code,
      Name: typeof valueRaw.Name === 'string' ? valueRaw.Name.trim() : valueRaw.Name,
      Note: typeof valueRaw.Note === 'string' ? valueRaw.Note.trim() : valueRaw.Note,
      IsDeleted: false,
    };
  
    console.log('Gửi đi:', projectField);
    this.performSave(projectField);
  }
  performSave(value: any): void {
    // Gửi 1 object → backend nhận List → bọc trong mảng
    this.projectFieldService.saveProjectField([value]).subscribe({  // ← BỌC TRONG []
      next: (res: any) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', res.message);
          this.form.markAsPristine(); // optional
          this.activeModal.close(true);
        }else if(res.status ===2){
          this.notification.warning('Thông báo', res.message);
          this.form.markAsPristine(); // optional
        }
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu!');
        console.error('Lỗi khi lưu:', err);
      }
    });
  }
}
