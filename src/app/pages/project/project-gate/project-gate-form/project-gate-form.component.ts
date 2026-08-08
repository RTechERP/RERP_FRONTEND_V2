import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ProjectGateService } from '../project-gate.service';

@Component({
  selector: 'app-project-gate-form',
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
    NzCheckboxModule
  ],
  templateUrl: './project-gate-form.component.html',
  styleUrls: ['./project-gate-form.component.css']
})
export class ProjectGateFormComponent implements OnInit {
  @Input() dataInput: any = null;
  @Input() saveCallback?: () => void;
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  isEdit = false;
  loading = false;

  // Lookup for parent gate selection
  allGates: any[] = [];
  parentGateOptions: any[] = [];

  // Type options: 1 = Giải pháp, 2 = Triển khai
  typeOptions = [
    { label: 'Giải pháp', value: 1 },
    { label: 'Triển khai', value: 2 }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: ProjectGateService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    // Watch Optional toggle to clear/validate ParentID
    this.form.get('Optional')!.valueChanges.subscribe((isOptional: boolean) => {
      const parentCtrl = this.form.get('ParentID')!;
      if (!isOptional) {
        parentCtrl.setValue(null, { emitEvent: false });
      }
      this.refreshParentOptions();
    });

    // Watch Type to filter parent gate options
    this.form.get('Type')!.valueChanges.subscribe(() => {
      this.refreshParentOptions();
    });

    this.loadAllGates();

    if (this.isEdit && this.dataInput?.ID) {
      this.loadGateDetail(this.dataInput.ID);
    }
  }

  loadGateDetail(id: number): void {
    this.loading = true;
    this.service.getByID(id).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.data) {
          this.dataInput = res.data;
          this.patchFormData();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.patchFormData();
      }
    });
  }

  patchFormData(): void {
    if (!this.dataInput) return;
    const parentId = this.dataInput.ParentID ?? this.dataInput.parentId ?? this.dataInput.ParentId ?? null;
    const isOpt = !!(this.dataInput.Optional ?? this.dataInput.isOptional ?? this.dataInput.IsOptional ?? (parentId != null));

    this.form.patchValue({
      ID: this.dataInput.ID,
      STT: this.dataInput.STT,
      GateCode: this.dataInput.GateCode,
      GateName: this.dataInput.GateName,
      StepName: this.dataInput.StepName,
      Target: this.dataInput.Target,
      RequireInput: this.dataInput.RequireInput,
      RequireOuput: this.dataInput.RequireOuput,
      ActionIfRejected: this.dataInput.ActionIfRejected,
      Type: this.dataInput.Type ?? null,
      Optional: isOpt,
      ParentID: parentId
    }, { emitEvent: false });

    this.refreshParentOptions();
  }

  loadAllGates(): void {
    this.service.getAll().subscribe({
      next: (res: any) => {
        const allData: any[] = res.data || [];
        this.allGates = allData.filter((g: any) => g.ID !== (this.dataInput?.ID ?? 0));

        if (this.isEdit && this.dataInput) {
          this.refreshParentOptions();
        } else {
          this.refreshParentOptions();
          // Auto-fill next STT when adding new (not edit)
          const maxSTT = allData.reduce((max: number, g: any) => {
            const stt = typeof g.STT === 'number' ? g.STT : 0;
            return stt > max ? stt : max;
          }, 0);
          this.form.get('STT')!.setValue(maxSTT + 1);
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        if (this.isEdit && this.dataInput) {
          this.refreshParentOptions();
        }
      }
    });
  }

  refreshParentOptions(): void {
    const selectedType = this.form.get('Type')!.value;
    if (selectedType != null) {
      this.parentGateOptions = this.allGates.filter(g => g.Type == selectedType);
    } else {
      this.parentGateOptions = [...this.allGates];
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      STT: [null, [Validators.required]],
      GateCode: ['', [Validators.required, Validators.maxLength(200)]],
      GateName: ['', [Validators.required, Validators.maxLength(550)]],
      StepName: ['', [Validators.required, Validators.maxLength(550)]],
      Target: ['', [Validators.maxLength(550)]],
      RequireInput: ['', [Validators.maxLength(550)]],
      RequireOuput: ['', [Validators.maxLength(550)]],
      ActionIfRejected: ['', [Validators.maxLength(550)]],
      Type: [null],
      Optional: [false],
      ParentID: [null]
    });
  }

  get isOptional(): boolean {
    return !!this.form.get('Optional')!.value;
  }

  onSubmit(closeAfterSave: boolean): void {
    if (this.form.valid) {
      this.loading = true;
      const formValue = { ...this.form.value };
      formValue.Optional = !!formValue.Optional;
      if (!formValue.Optional) {
        formValue.ParentID = null;
      }
      const payload = [formValue];

      this.service.save(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status === 2) {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Mã Gate đã tồn tại!');
            return;
          }
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
          this.saveSuccess.emit();
          if (this.saveCallback) {
            this.saveCallback();
          }
          if (closeAfterSave) {
            this.activeModal.close('save');
          } else {
            if (!this.isEdit) {
              const currentSTT = Number(this.form.get('STT')?.value) || 0;
              const nextSTT = currentSTT > 0 ? currentSTT + 1 : 1;
              this.form.reset({
                ID: 0,
                STT: nextSTT,
                GateCode: '',
                GateName: '',
                StepName: '',
                Target: '',
                RequireInput: '',
                RequireOuput: '',
                ActionIfRejected: '',
                Type: null,
                Optional: false,
                ParentID: null
              });
              this.loadAllGates();
            }
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
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

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
