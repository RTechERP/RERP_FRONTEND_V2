import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalRef, NzModalModule, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DrawingProjectService } from '../drawing-project.service';
import { ProjectService } from '../../project-service/project.service';

@Component({
  selector: 'app-drawing-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule
  ],
  templateUrl: './drawing-project-detail.component.html',
  styleUrl: './drawing-project-detail.component.css'
})
export class DrawingProjectDetailComponent implements OnInit {
  private nzModalData = inject(NZ_MODAL_DATA);
  data: any = null;

  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private drawingService = inject(DrawingProjectService);
  private projectService = inject(ProjectService);

  form!: FormGroup;
  isSubmitting: boolean = false;
  employeeOptions: { label: string, value: number }[] = [];
  projectTypeOptions: { label: string, value: number }[] = [];

  ngOnInit(): void {
    this.data = this.nzModalData?.data || null;
    this.initForm();
    this.loadDropdowns();

    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

  loadDropdowns(): void {
    this.drawingService.getEmployees().subscribe((res: any) => {
      if (res && res.data) {
        const options: {label: string, value: number}[] = [];
        res.data.forEach((item: any) => {
          options.push({ label: `${item.Code} - ${item.FullName}`, value: item.ID });
        });
        this.employeeOptions = options;
      }
    });

    this.drawingService.getProjectType().subscribe((res: any) => {
      if (res && res.data) {
        const options: {label: string, value: number}[] = [];
        res.data.forEach((item: any) => {
          options.push({ label: `${item.ProjectTypeCode} - ${item.ProjectTypeName}`, value: item.ID });
        });
        this.projectTypeOptions = options;
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      ProjectID: [null, [Validators.required]],
      ProjectTypeID: [null, [Validators.required]],
      DrawingName: [null, [Validators.required]],
      Version: [null, [Validators.required]],
      DesignByID: [null],
      DesignDate: [null]
    });
  }

  submitForm(): void {
    if (this.isSubmitting) return;

    if (this.form.valid) {
      this.isSubmitting = true;
      const formValue = this.form.getRawValue();

      this.drawingService.saveData(formValue).subscribe({
        next: (res: any) => {
          if (res.status === 1 || res.isSuccess || res.data) {
            this.message.success('Lưu dữ liệu thành công!');
            this.modalRef.close(true);
          } else {
            this.message.error(res.message || 'Lỗi khi lưu dữ liệu!');
            this.isSubmitting = false;
          }
        },
        error: (err: any) => {
          console.error(err);
          this.message.error(err?.error?.message || 'Có lỗi xảy ra khi lưu!');
          this.isSubmitting = false;
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng điền đủ thông tin bắt buộc');
    }
  }

  destroyModal(): void {
    this.modalRef.close();
  }
}
