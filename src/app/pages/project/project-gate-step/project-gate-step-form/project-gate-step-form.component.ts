import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ProjectGateStepService } from '../project-gate-step.service';

@Component({
  selector: 'app-project-gate-step-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    NzSelectModule,
    NzCheckboxModule,
    NzGridModule
  ],
  templateUrl: './project-gate-step-form.component.html',
  styleUrls: ['./project-gate-step-form.component.css']
})
export class ProjectGateStepFormComponent implements OnInit {
  @Input() dataInput: any = null;
  /** Danh sách Gate để FE chọn (truyền từ management) */
  @Input() gateList: any[] = [];
  /** Danh sách phòng ban để multi-select */
  @Input() departmentList: any[] = [];
  /** Danh sách chức vụ để multi-select */
  @Input() positionList: any[] = [];
  /** Danh sách template */
  @Input() templateList: any[] = [];

  form!: FormGroup;
  isEdit = false;
  loading = false;

  get checkListsFormArray(): FormArray {
    return this.form.get('CheckLists') as FormArray;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: ProjectGateStepService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        ProjectGateID: this.dataInput.ProjectGateID ?? null,
        TT: this.dataInput.TT ?? '',
        SortOrder: this.dataInput.SortOrder ?? null,
        Content: this.dataInput.Content ?? '',
        ChucVuID: this.dataInput.ChucVuID ?? null,
        DepartmentIDs: this.dataInput.DepartmentIDs ?? [],
        PositionIDs: this.dataInput.PositionIDs ?? [],
        ProjectGateStepTemplateID: this.dataInput.ProjectGateStepTemplateID ?? null
      });

      if (this.dataInput.CheckLists && this.dataInput.CheckLists.length > 0) {
        this.dataInput.CheckLists.forEach((item: any) => {
          this.addCheckListItem(item);
        });
      }
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      ProjectGateID: [null, [Validators.required]],
      TT: ['', [Validators.maxLength(200)]],
      SortOrder: [null],
      Content: ['', [Validators.maxLength(550)]],
      ChucVuID: [null],          // Lưu ID đơn lẻ (bàn giao cũ)
      DepartmentIDs: [[]],       // Multi-select phòng ban
      PositionIDs: [[]],         // Multi-select chức vụ phụ trách
      ProjectGateStepTemplateID: [null],
      CheckLists: this.fb.array([])
    });
  }

  createCheckListItem(item: any = null): FormGroup {
    return this.fb.group({
      ID: [item ? item.ID : 0],
      ProjectGateStepID: [item ? item.ProjectGateStepID : 0],
      Type: [item ? item.Type : null, [Validators.required]],
      Description: [item ? item.Description : '', [Validators.required, Validators.maxLength(550)]]
    });
  }

  addCheckListItem(item: any = null): void {
    this.checkListsFormArray.push(this.createCheckListItem(item));
  }

  removeCheckListItem(index: number): void {
    this.checkListsFormArray.removeAt(index);
  }

  onSubmit(closeAfterSave: boolean): void {
    if (this.form.valid) {
      this.loading = true;
      const payload = [this.form.value];

      this.service.save(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
          if (closeAfterSave) {
            this.activeModal.close('save');
          } else {
            if (!this.isEdit) {
              this.resetForm();
            }
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  resetForm(): void {
    this.form.reset({
      ID: 0,
      ProjectGateID: null,
      TT: '',
      SortOrder: null,
      Content: '',
      ChucVuID: null,
      DepartmentIDs: [],
      PositionIDs: [],
      ProjectGateStepTemplateID: null
    });
    while (this.checkListsFormArray.length !== 0) {
      this.checkListsFormArray.removeAt(0);
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
