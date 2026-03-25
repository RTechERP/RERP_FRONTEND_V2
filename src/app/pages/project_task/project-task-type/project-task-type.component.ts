import {
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ProjectTaskTypeService } from './project-task-type.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-project-task-type',
  templateUrl: './project-task-type.component.html',
  styleUrl: './project-task-type.component.css',
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzToolTipModule,
    NzNotificationModule,
    NzSpinModule,
    NzTagModule,
    NzSelectModule,
    ReactiveFormsModule,
    Menubar,
  ],
})
export class ProjectTaskTypeComponent implements OnInit {
  dataList: any[] = [];
  departmentList = signal<any[]>([]);
  selectedRow: any = null;
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  menuBars: any[] = [];


  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private projectTaskTypeService: ProjectTaskTypeService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.initMenuBar();
    this.loadData();
    this.loadDepartments();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.openAddModal(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.openEditModalFromToolbar(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteFromToolbar(),
      },
    ];
  }

  private initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      Code: ['', [Validators.required, Validators.maxLength(50)]],
      TypeName: ['', [Validators.required, Validators.maxLength(255)]],
      DepartmentID: [null],
      IsDeleted: [false],
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.projectTaskTypeService.getProjectTaskType().subscribe({
      next: (res: any) => {
        this.dataList = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
        this.isLoading = false;
      },
      error: (error: any) => {
        const errorMessage =
          error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        this.isLoading = false;
      },
    });
  }

  loadDepartments(): void {
    this.projectTaskTypeService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.departmentList.set(res.data || []);
        }
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  selectRow(row: any): void {
    this.selectedRow = this.selectedRow?.ID === row.ID ? null : row;
  }

  isSelected(row: any): boolean {
    return this.selectedRow?.ID === row.ID;
  }

  openAddModal(): void {
    this.form.reset({ ID: 0, Code: '', TypeName: '', DepartmentID: null, IsDeleted: false });
    this.showModal();
  }

  openEditModal(row: any): void {
    this.selectedRow = row;
    this.form.patchValue({
      ID: row.ID,
      Code: row.Code,
      TypeName: row.TypeName,
      DepartmentID: row.DepartmentID,
      IsDeleted: row.IsDeleted ?? false,
    });
    this.showModal();
  }

  openEditModalFromToolbar(): void {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại task cần sửa');
      return;
    }
    this.openEditModal(this.selectedRow);
  }

  private showModal(): void {
    const el = document.getElementById('projectTaskTypeModal');
    const modal = new (window as any).bootstrap.Modal(el);
    modal.show();
  }

  onSubmit(): void {
    if (this.isSaving) return;

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSaving = true;
    const formData = this.form.getRawValue();

    this.projectTaskTypeService.saveProjectTaskType(formData).subscribe({
      next: (res: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          res?.message || (formData.ID > 0 ? 'Cập nhật thành công' : 'Thêm mới thành công')
        );
        this.isSaving = false;
        const modalEl = document.getElementById('projectTaskTypeModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        this.selectedRow = null;
        this.loadData();
      },
      error: (error: any) => {
        const errorMessage =
          error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        this.isSaving = false;
      },
    });
  }

  deleteRecord(row: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa loại task "<strong>${row['TypeName']}</strong>" không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteData = { ...row, IsDeleted: true };
        this.projectTaskTypeService.saveProjectTaskType(deleteData).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa loại task thành công');
            if (this.selectedRow?.ID === row.ID) this.selectedRow = null;
            this.loadData();
          },
          error: (error: any) => {
            const errorMessage =
              error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          },
        });
      },
    });
  }

  deleteFromToolbar(): void {
    if (!this.selectedRow) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại task cần xóa');
      return;
    }
    this.deleteRecord(this.selectedRow);
  }

  formatDate(value: any): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  getDepartmentName(deptId: number): string {
    if (!deptId) return '-';
    const dept = this.departmentList().find(d => d.ID === deptId);
    return dept ? dept.Name : '-';
  }
}
