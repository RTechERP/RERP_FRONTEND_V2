import { ProjectService } from './../project-service/project.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-change',
  imports: [
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzButtonModule,
    NzFormModule,
    CommonModule
  ],
  templateUrl: './project-change.component.html',
  styleUrl: './project-change.component.css',
})
export class ProjectChangeComponent implements OnInit {
  @Input() projectIdOld: any;
  @Input() reportIds: any[] = [];
  projects: any;
  projectIdNew: any;
  disable: any = false;
  projectChangeForm!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.getProjectModal();
  }

  initForm() {
    this.projectChangeForm = this.fb.group({
      projectIdOld: [{value: null, disabled: true}, [Validators.required, Validators.min(1)]],
      projectIdNew: [null, [Validators.required, Validators.min(1)]]
    }, {
      validators: this.projectValidator.bind(this)
    });

    // Subscribe để trigger validation khi giá trị thay đổi
    this.projectChangeForm.get('projectIdOld')?.valueChanges.subscribe(() => {
      this.projectChangeForm.updateValueAndValidity();
    });

    this.projectChangeForm.get('projectIdNew')?.valueChanges.subscribe(() => {
      this.projectChangeForm.updateValueAndValidity();
    });
  }

  // Custom validator để kiểm tra 2 dự án không được giống nhau
  projectValidator(formGroup: FormGroup) {
    const projectIdOld = formGroup.get('projectIdOld')?.value;
    const projectIdNew = formGroup.get('projectIdNew')?.value;
    
    if (projectIdOld && projectIdNew && projectIdOld === projectIdNew) {
      return { sameProject: true };
    }
    return null;
  }

  setFormValues() {
    if (this.projectIdOld) {
      // Enable temporarily to set value, then disable again
      const control = this.projectChangeForm.get('projectIdOld');
      if (control) {
        control.enable();
        control.setValue(this.projectIdOld);
        control.disable();
      }
    }
  }

  getProjectModal() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
        // Set giá trị sau khi projects đã được load
        this.setFormValues();
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  saveChange() {
    // Mark all fields as touched để hiển thị lỗi
    this.markFormGroupTouched(this.projectChangeForm);

    // Kiểm tra form có hợp lệ không
    if (this.projectChangeForm.invalid) {
      // Kiểm tra lỗi cụ thể
      if (this.projectChangeForm.hasError('sameProject')) {
        this.notification.error(
          'Thông báo',
          'Hai dự án không được giống nhau. Vui lòng kiểm tra lại!',
        );
      } else {
        this.notification.error('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      }
      return;
    }

    // Lấy giá trị từ form
    const formValue = this.projectChangeForm.getRawValue();
    this.projectIdOld = formValue.projectIdOld;
    this.projectIdNew = formValue.projectIdNew;

    if (this.disable == true) {
      this.saveProjectWorkReport();
    } else {
      this.saveChangeProject();
    }
  }

  // Helper method để mark all fields as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  saveProjectWorkReport() {
    const dataSave = {
      ProjectIDOld: this.projectIdOld,
      ProjectIDNew: this.projectIdNew,
      reportIDs: this.reportIds,
    };

    this.projectService.saveProjectWorkReport(dataSave).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success('Thông báo', 'Đã chuyển dự án!')
          this.activeModal.dismiss(true);
        }
      },
      error: (error: any) => {
        const msg = error.message || error.error?.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  saveChangeProject() {
    this.projectService
      .saveChangeProject(this.projectIdOld, this.projectIdNew)
      .subscribe({
        next: (response: any) => {
          if (response.data == true) {
            this.notification.success('Thông báo', 'Đã chuyển dự án!')
            this.activeModal.dismiss(true);
          }
        },
        error: (error: any) => {
          const msg = error.message || error.error?.message || 'Lỗi không xác định';
          this.notification.error('Thông báo', msg);
          console.error('Lỗi:', error.error);
        },
      });
  }

  // Getter methods để dễ dàng truy cập form controls trong template
  get projectIdOldControl() {
    return this.projectChangeForm.get('projectIdOld');
  }

  get projectIdNewControl() {
    return this.projectChangeForm.get('projectIdNew');
  }
}
