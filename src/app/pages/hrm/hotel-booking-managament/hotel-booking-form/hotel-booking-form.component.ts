import { Component, OnInit, Input, inject, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators, NonNullableFormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { HotelBookingManagementService } from '../hotel-booking-management.service';
import { HotelBookingSaveDTO, HotelBookingEmployee } from '../models';
import { ProjectService } from '../../../project/project-service/project.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { UserService } from '../../../../services/user.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
  selector: 'app-hotel-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule,
    NzDividerModule,
    NzTableModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzAutocompleteModule,
    NzCardModule
  ],
  templateUrl: './hotel-booking-form.component.html',
  styleUrl: './hotel-booking-form.component.css'
})
export class HotelBookingFormComponent implements OnInit, OnChanges {
  @Input() id?: number;
  @Input() isCopy: boolean = false;

  private fb = inject(NonNullableFormBuilder);
  private service = inject(HotelBookingManagementService);
  private projectService = inject(ProjectService);
  private employeeService = inject(EmployeeService);
  private userService = inject(UserService);
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  public activeModal = inject(NgbActiveModal);

  validateForm = this.fb.group({
    ID: this.fb.control(0),
    EmployeeRequestID: this.fb.control<number | null>(null),
    ProjectID: this.fb.control<number | null>(null, [Validators.required]),
    Location: this.fb.control('', [Validators.required]),
    CheckinDate: this.fb.control(this.formatDateForInput(new Date()), [Validators.required]),
    CheckOutDate: this.fb.control(this.formatDateForInput(new Date(Date.now() + 86400000)), [Validators.required]),
    Reason: this.fb.control('', [Validators.required]),
    Note: this.fb.control(''),
    EmployeeApproverID: this.fb.control<number | null>(null, [Validators.required]),
    Employees: this.fb.array([]),
    Proposals: this.fb.array([])
  });

  isLoading = false;
  isSaving = false;

  // Options selections
  employees: any[] = [];
  projects: any[] = [];
  groupedEmployees: any[] = [];
  approvers: any[] = [];

  // Historical autocomplete suggestions
  historicalSuggestions: any[] = [];
  filteredLocations: string[] = [];
  filteredRoomTypes: string[] = [];

  formatterVND = (value: number | string): string => {
    if (!value && value !== 0) return '';
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  parserVND = (value: string): number => Number(value.replace(/\./g, ''));

  get proposals() {
    return this.validateForm.controls.Proposals as FormArray;
  }

  get passengers() {
    return this.validateForm.controls.Employees as FormArray;
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadHistoricalSuggestions();

    if (this.id) {
      this.loadData(this.id);
    } else {
      // Default initial row for proposals and guests
      this.addProposal();
      this.addPassenger();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id'] && this.id) {
      this.loadData(this.id);
    }
  }

  private loadData(id: number): void {
    this.isLoading = true;
    this.service.getByID(id).subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data) {
          const data = res.data;
          const master = data.master || data.Master;
          const proposals = data.proposals || data.Proposals;
          const employees = data.employees || data.Employees || [];
          this.loadForm(master, proposals, employees);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
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
        this.isLoading = false;
      }
    });
  }

  private loadForm(master: any, proposals: any[], employees: any[]): void {
    this.validateForm.patchValue({
      ID: this.isCopy ? 0 : (master.ID ?? 0),
      EmployeeRequestID: master.EmployeeRequestID ?? null,
      ProjectID: master.ProjectID ?? null,
      Location: master.Location ?? '',
      CheckinDate: this.formatDateForInput(master.CheckinDate),
      CheckOutDate: this.formatDateForInput(master.CheckOutDate),
      Reason: master.Reason ?? '',
      Note: master.Note ?? '',
      EmployeeApproverID: master.EmployeeApproverID ?? null
    });

    // Clear and load proposals
    while (this.proposals.length) {
      this.proposals.removeAt(0);
    }
    if (proposals && proposals.length > 0) {
      proposals.forEach(p => {
        if (this.isCopy) {
          p = { ...p, ID: 0, id: 0, IsApprove: 0, isApprove: 0, IsHCNSProposal: false, isHCNSProposal: false, ReasonHCNSProposal: '', reasonHCNSProposal: '' };
        }
        this.addProposal(p);
      });
    } else {
      this.addProposal();
    }

    // Clear and load guests
    while (this.passengers.length) {
      this.passengers.removeAt(0);
    }
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        if (this.isCopy) {
          emp = { ...emp, ID: 0, id: 0 };
        }
        this.addPassenger(emp);
      });
    } else {
      this.addPassenger();
    }

    this.cdr.detectChanges();
  }

  addProposal(data?: any): void {
    const proposalGroup = this.fb.group({
      ID: this.fb.control(data?.ID ?? data?.id ?? 0),
      TypeRoom: this.fb.control(data?.TypeRoom ?? data?.typeRoom ?? '', [Validators.required]),
      Quantity: this.fb.control(data?.Quantity ?? data?.quantity ?? 1, [Validators.required, Validators.min(1)]),
      UnitPrice: this.fb.control(data?.UnitPrice ?? data?.unitPrice ?? 0, [Validators.required, Validators.min(0)]),
      TotalAmount: this.fb.control(data?.TotalAmount ?? data?.totalAmount ?? 0),
      Note: this.fb.control(data?.Note ?? data?.note ?? ''),
      IsHCNSProposal: this.fb.control(data?.IsHCNSProposal ?? data?.isHCNSProposal ?? false),
      ReasonHCNSProposal: this.fb.control(data?.ReasonHCNSProposal ?? data?.reasonHCNSProposal ?? ''),
      IsApprove: this.fb.control(data?.IsApprove ?? data?.isApprove ?? 0),
      ApproveID: this.fb.control(data?.ApproveID ?? data?.approveID ?? null),
      ReasonDecline: this.fb.control(data?.ReasonDecline ?? data?.reasonDecline ?? '')
    });

    // Auto calculate TotalAmount when Quantity or UnitPrice changes
    proposalGroup.get('Quantity')?.valueChanges.subscribe(() => this.calculateTotalAmount(proposalGroup));
    proposalGroup.get('UnitPrice')?.valueChanges.subscribe(() => this.calculateTotalAmount(proposalGroup));

    this.proposals.push(proposalGroup);
    this.cdr.detectChanges();
  }

  private calculateTotalAmount(group: FormGroup): void {
    const qty = group.get('Quantity')?.value ?? 0;
    const price = group.get('UnitPrice')?.value ?? 0;
    group.get('TotalAmount')?.setValue(qty * price, { emitEvent: false });
  }

  addPassenger(data?: any): void {
    const type = data?.Type ?? data?.type ?? 1;
    const group = this.fb.group({
      ID: this.fb.control(data?.ID ?? data?.id ?? 0),
      Type: this.fb.control(type, [Validators.required]),
      EmployeeID: this.fb.control<number | null>(data?.EmployeeID ?? data?.employeeID ?? null),
      FullName: this.fb.control(data?.FullName ?? data?.fullName ?? '', [Validators.required])
    });

    group.get('Type')?.valueChanges.subscribe(typeVal => {
      const empIdCtrl = group.get('EmployeeID');
      const nameCtrl = group.get('FullName');
      if (typeVal === 1) {
        empIdCtrl?.setValidators([Validators.required]);
        nameCtrl?.disable();
      } else {
        empIdCtrl?.clearValidators();
        empIdCtrl?.setValue(null);
        nameCtrl?.enable();
      }
      empIdCtrl?.updateValueAndValidity();
      nameCtrl?.updateValueAndValidity();
    });

    group.get('EmployeeID')?.valueChanges.subscribe(empId => {
      if (group.get('Type')?.value === 1 && empId) {
        const emp = this.employees.find(e => e.ID === empId);
        if (emp) {
          group.get('FullName')?.setValue(emp.FullName);
        }
      }
    });

    if (type === 1) {
      group.get('EmployeeID')?.setValidators([Validators.required]);
      group.get('FullName')?.disable();
    }

    this.passengers.push(group);
    this.cdr.detectChanges();
  }

  removePassenger(index: number): void {
    if (this.passengers.length > 1) {
      this.passengers.removeAt(index);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Cần ít nhất một người sử dụng phòng');
    }
  }

  removeProposal(index: number): void {
    if (this.proposals.length > 1) {
      this.proposals.removeAt(index);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Cần ít nhất một phương án đề xuất');
    }
  }

  private formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.employees = res.data || [];
          this.groupEmployees(this.employees);
          this.approvers = this.employees.filter((emp: any) => emp.DepartmentID === 1);
        }
      }
    });
  }

  private groupEmployees(employees: any[]): void {
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

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.projects = Array.isArray(res.data) ? res.data : [res.data];
        }
      }
    });
  }

  loadHistoricalSuggestions(): void {
    this.service.getHistoricalSuggestions().subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.historicalSuggestions = res.data || [];
        }
      }
    });
  }

  onLocationInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredLocations = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.Location && s.Location.toString().toLowerCase().includes(valStr))
        .map(s => s.Location)
    ));
  }

  onRoomTypeInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredRoomTypes = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.TypeRoom && s.TypeRoom.toString().toLowerCase().includes(valStr))
        .map(s => s.TypeRoom)
    ));
  }

  onSubmit(): void {
    if (this.validateForm.invalid) {
      Object.keys(this.validateForm.controls).forEach(key => {
        const control = this.validateForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });

      this.proposals.controls.forEach((group: any) => {
        Object.keys(group.controls).forEach(k => {
          group.get(k).markAsTouched();
          group.get(k).updateValueAndValidity();
        });
      });

      this.passengers.controls.forEach((group: any) => {
        Object.keys(group.controls).forEach(k => {
          group.get(k).markAsTouched();
          group.get(k).updateValueAndValidity();
        });
      });

      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    this.isSaving = true;
    const formData = this.validateForm.getRawValue();

    const body: HotelBookingSaveDTO = {
      ID: formData.ID,
      Reason: formData.Reason,
      ProjectID: formData.ProjectID,
      EmployeeRequestID: formData.EmployeeRequestID,
      Location: formData.Location,
      CheckinDate: formData.CheckinDate,
      CheckOutDate: formData.CheckOutDate,
      EmployeeApproverID: formData.EmployeeApproverID,
      Note: formData.Note,
      TravelerIDs: (formData.Employees as HotelBookingEmployee[])
        .filter(p => p.Type === 1 && p.EmployeeID)
        .map(p => p.EmployeeID as number),
      Employees: formData.Employees as HotelBookingEmployee[],
      Proposals: formData.Proposals.map((p: any) => ({
        ...p,
        ApproveID: formData.EmployeeApproverID
      })) as any
    };

    this.service.saveData(body).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu thất bại');
        }
        this.isSaving = false;
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
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
}
