import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, Input } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DateTime } from 'luxon';
import { FormControl, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ProjectService } from '../project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-project-current-situation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './project-current-situation.component.html',
  styleUrl: './project-current-situation.component.css'
})
export class ProjectCurrentSituationComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @ViewChild('tb_ProjectCurrentSituation', { static: false })
  tb_ProjectCurrentSituationTableElement!: ElementRef;
  private tb_ProjectCurrentSituationTable!: Tabulator;
  currentSituationData: any[] = [];
  form!: FormGroup;
  projects: any[] = [];
  employees: any[] = [];
  currentUser: any = null;

  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    // Lấy thông tin user hiện tại
    this.currentUser = this.appUserService.currentUser;
    
    this.form = new FormGroup({
      projectId: new FormControl(this.projectId || null, [Validators.required]),
      updatedBy: new FormControl(
        { value: this.currentUser?.EmployeeID || null, disabled: true },
        [Validators.required]
      ),
      content: new FormControl('', [Validators.required]),
    });

    this.getProjects();
    this.getEmployees();
    
    // Nếu có projectId từ input, tự động load data
    if (this.projectId && this.projectId > 0) {
      // Load data ngay
      setTimeout(() => {
        this.loadData();
      }, 100);
    }
    
    // Subscribe to projectId changes
    this.form.get('projectId')?.valueChanges.subscribe((value) => {
      if (value) {
        this.loadData();
      } else {
        this.currentSituationData = [];
        if (this.tb_ProjectCurrentSituationTable) {
          this.tb_ProjectCurrentSituationTable.setData([]);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_ProjectCurrentSituationTableElement?.nativeElement) {
        this.drawTbProjectCurrentSituationTable(this.tb_ProjectCurrentSituationTableElement.nativeElement);
      }
    }, 0);
  }

  getProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.projects = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách dự án');
      }
    });
  }

  getEmployees(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.employees = this.projectService.createdDataGroup(
            response.data,
            'DepartmentName'
          );
        }
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
      }
    });
  }

  loadData(): void {
    // Ưu tiên sử dụng projectId từ @Input, nếu không có thì lấy từ form
    const projectId = this.projectId && this.projectId > 0 
      ? this.projectId 
      : this.form.get('projectId')?.value;
    if (!projectId || projectId <= 0) {
      this.currentSituationData = [];
      if (this.tb_ProjectCurrentSituationTable) {
        this.tb_ProjectCurrentSituationTable.setData([]);
      }
      return;
    }
    
    this.projectService.getProjectCurrentSituationData(projectId).subscribe({
      next: (response: any) => {
        if ( response.status === 1) {
          this.currentSituationData =response.data;
          if (this.tb_ProjectCurrentSituationTable) {
            this.tb_ProjectCurrentSituationTable.setData(this.currentSituationData);
          }
        } else {
          this.currentSituationData = [];
          if (this.tb_ProjectCurrentSituationTable) {
            this.tb_ProjectCurrentSituationTable.setData([]);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading current situation data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu tình hình hiện tại');
        this.currentSituationData = [];
        if (this.tb_ProjectCurrentSituationTable) {
          this.tb_ProjectCurrentSituationTable.setData([]);
        }
      }
    });
  }

  saveData(): void {
    // Validate form trước khi lưu
    if (!this.validateForm()) {
      return;
    }

    // Ưu tiên sử dụng projectId từ @Input, nếu không có thì lấy từ form
    const projectId = this.projectId && this.projectId > 0 
      ? this.projectId 
      : this.form.get('projectId')?.value;
    const content = this.form.get('content')?.value?.trim();
    const employeeId = this.currentUser?.EmployeeID || 0;
    
    const payload = {
      ID: 0, // Tạo mới
      ProjectID: projectId,
      EmployeeID: employeeId,
      ContentSituation: content,
      // DateSituation sẽ được set ở backend (DateTime.Now)
    };

    this.projectService.saveProjectCurrentSituationData(payload).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.notification.success('Thành công', response.message || 'Thêm tình hình hiện tại thành công!');
          // Reset form content
          this.form.get('content')?.setValue('');
          // Reload data để cập nhật bảng (không đóng form)
          this.loadData();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error saving current situation:', error);
        const errorMessage = error.error?.message || error.message || 'Có lỗi xảy ra khi lưu dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.form.controls).forEach(k => {
      const c = this.form.get(k);
      const v = c?.value;
      if (typeof v === 'string' && !c?.disabled) {
        c!.setValue(v.trim(), { emitEvent: false });
      }
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.form.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'projectId':
            return 'Vui lòng chọn dự án!';
          case 'content':
            return 'Vui lòng nhập nội dung!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
    this.trimAllStringControls();
    
    // Nếu đã có projectId từ input, không cần validate projectId trong form
    const requiredFields = this.projectId && this.projectId > 0 
      ? ['content'] 
      : ['projectId', 'content'];
    
    const invalidFields = requiredFields.filter(key => {
      const control = this.form.get(key);
      return !control || control.invalid || control.value === '' || control.value == null;
    });
    
    // Kiểm tra projectId nếu không có từ input
    if (!this.projectId || this.projectId <= 0) {
      const projectIdControl = this.form.get('projectId');
      if (!projectIdControl || !projectIdControl.value || projectIdControl.value <= 0) {
        invalidFields.push('projectId');
      }
    }
    
    if (invalidFields.length > 0) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }
  //#endregion

  closeModal(): void {
    this.activeModal.close({ 
      success: true 
    });
  }

  drawTbProjectCurrentSituationTable(container: HTMLElement): void {
    this.tb_ProjectCurrentSituationTable = new Tabulator(container, {
      data: this.currentSituationData,
      layout: 'fitColumns',
      pagination: false,
      paginationSize: 10,
      height: '100%',
      columns: [
        {
          title: 'Người cập nhật',
          field: 'FullName',
          hozAlign: 'left',
          width: 200,
       
        },
        {
          title: 'Ngày cập nhật',
          field: 'DateSituation',
          hozAlign: 'center',
          width: 180,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            if (value) {
              const dateTime = DateTime.fromISO(value);
              value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy HH:mm:ss') : '';
            }
            return value;
          }
        },
        {
          title: 'Nội dung',
          field: 'ContentSituation',
          hozAlign: 'left',
          formatter: 'textarea',
        },
      ],
    });
  }
}
