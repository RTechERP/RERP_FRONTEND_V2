import { Component, Input, OnInit } from '@angular/core';
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
    this.loadAllGates();

    if (this.isEdit) {
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
        Optional: this.dataInput.Optional ?? false,
        ParentID: this.dataInput.ParentID ?? null
      });
    }

    // Watch Optional toggle to clear/validate ParentID
    this.form.get('Optional')!.valueChanges.subscribe((isOptional: boolean) => {
      const parentCtrl = this.form.get('ParentID')!;
      if (!isOptional) {
        parentCtrl.setValue(null);
      }
      this.refreshParentOptions();
    });

    // Watch Type to filter parent gate options
    this.form.get('Type')!.valueChanges.subscribe(() => {
      this.form.get('ParentID')!.setValue(null);
      this.refreshParentOptions();
    });
  }

  loadAllGates(): void {
    this.service.getAll().subscribe({
      next: (res: any) => {
        const allData: any[] = res.data || [];
        this.allGates = allData.filter((g: any) => g.ID !== (this.dataInput?.ID ?? 0));
        this.refreshParentOptions();

        // Auto-fill next STT when adding new (not edit)
        if (!this.isEdit) {
          const maxSTT = allData.reduce((max: number, g: any) => {
            const stt = typeof g.STT === 'number' ? g.STT : 0;
            return stt > max ? stt : max;
          }, 0);
          this.form.get('STT')!.setValue(maxSTT + 1);
        }
      },
      error: () => { }
    });
  }

  refreshParentOptions(): void {
    const selectedType = this.form.get('Type')!.value;
    if (selectedType) {
      this.parentGateOptions = this.allGates.filter(g => g.Type === selectedType);
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
      const payload = [this.form.value];

      this.service.save(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status === 2) {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Mã Gate đã tồn tại!');
            return;
          }
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
          if (closeAfterSave) {
            this.activeModal.close('save');
          } else {
            if (!this.isEdit) {
              this.form.reset({
                ID: 0,
                STT: null,
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
