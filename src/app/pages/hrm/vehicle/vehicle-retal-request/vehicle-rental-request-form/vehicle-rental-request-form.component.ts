import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { VehicleRentalRequestService, VehicleRentalRequest } from '../vehicle-rental-request.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { ProjectService } from '../../../../project/project-service/project.service';

@Component({
  selector: 'app-vehicle-rental-request-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzSpinModule
  ],
  templateUrl: './vehicle-rental-request-form.component.html',
  styleUrls: ['./vehicle-rental-request-form.component.css']
})
export class VehicleRentalRequestFormComponent implements OnInit {
  @Input() record: VehicleRentalRequest | null = null;
  @Input() maxSTT: number = 0;
  
  form!: FormGroup;
  loading = false;
  
  @Input() employees: any[] = [];
  groupedEmployees: any[] = [];
  @Input() departments: any[] = [];
  @Input() projects: any[] = [];

  title = 'Thêm mới yêu cầu thuê xe';

  formatterVND = (value: number | string): string => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  parserVND = (value: string): any => value ? value.replace(/,/g, '') : '';

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private vehicleRentalRequestService: VehicleRentalRequestService,
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    if (this.record) {
      this.title = 'Cập nhật yêu cầu thuê xe';
    }
    this.initForm();
    this.loadDropdowns();
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [this.record?.ID || 0],
      DateRequest: [this.record?.DateRequest ? new Date(this.record.DateRequest) : new Date(), Validators.required],
      STT: [this.record?.STT || (this.maxSTT + 1)],
      EmployeeRequestID: [this.record?.EmployeeRequestID || null, Validators.required],
      DepartmentID: [{ value: this.record?.DepartmentID || null, disabled: true }],
      VehicleType: [this.record?.VehicleType != null ? Number(this.record.VehicleType) : null, Validators.required],
      PackageName: [this.record?.PackageName || '', Validators.required],
      ProjectID: [this.record?.ProjectID || null],
      PackageQuantity: [this.record?.PackageQuantity || 1, Validators.required],
      PackageLengthCm: [this.record?.PackageLengthCm || null],
      PackageWidthCm: [this.record?.PackageWidthCm || null],
      PackageHeightCm: [this.record?.PackageHeightCm || null],
      PackageWeightKg: [this.record?.PackageWeightKg || null],
      DepartureLocation: [this.record?.DepartureLocation || '', Validators.required],
      AddressLocation: [this.record?.AddressLocation || '', Validators.required],
      DistanceKm: [this.record?.DistanceKm || null],
      NameNCC: [this.record?.NameNCC || ''],
      Cost: [this.record?.Cost || null],
      Note: [this.record?.Note || '']
    });

    this.form.get('EmployeeRequestID')?.valueChanges.subscribe(employeeId => {
      if (employeeId) {
        const emp = this.employees.find(x => x.ID === employeeId);
        if (emp && emp.DepartmentID) {
          this.form.get('DepartmentID')?.setValue(emp.DepartmentID);
        }
      } else {
        this.form.get('DepartmentID')?.setValue(null);
      }
    });
  }

  loadDropdowns(): void {
    this.vehicleRentalRequestService.getEmployees().subscribe(res => {
      if (res?.status === 1) {
        this.employees = res.data || [];
        this.groupDropdownEmployees(this.employees);
      }
    });

    this.vehicleRentalRequestService.getDepartments().subscribe(res => {
      if (res?.status === 1) {
        this.departments = res.data || [];
      }
    });

    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.projects = Array.isArray(res.data) ? res.data : [res.data];
        }
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.loading = true;
    const formData = this.form.getRawValue(); // gets disabled fields as well
    const payload = [formData]; // Backend expects a list

      this.vehicleRentalRequestService.saveData(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công');
            this.activeModal.close(true);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
          }
        },
        error: () => {
          this.loading = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi gọi API');
        }
      });
  }

  onCancel(): void {
    this.activeModal.close(false);
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }
}
