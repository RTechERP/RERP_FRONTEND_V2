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

import { FlightBookingManagementService } from '../flight-booking-management.service';
import { FlightBookingSaveDTO } from '../models';
import { ProjectService } from '../../../project/project-service/project.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { UserService } from '../../../../services/user.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
  selector: 'app-flight-booking-form',
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
  templateUrl: './flight-booking-form.component.html',
  styleUrl: './flight-booking-form.component.css'
})
export class FlightBookingFormComponent implements OnInit, OnChanges {
  @Input() id?: number;

  private fb = inject(NonNullableFormBuilder);
  private service = inject(FlightBookingManagementService);
  private projectService = inject(ProjectService);
  private employeeService = inject(EmployeeService);
  private userService = inject(UserService);
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  public activeModal = inject(NgbActiveModal);

  validateForm = this.fb.group({
    ID: this.fb.control(0),
    EmployeeRequestID: this.fb.control<number | null>(null),
    EmployeeIDs: this.fb.control<number[]>([], [Validators.required]),
    ProjectID: this.fb.control<number | null>(null, [Validators.required]),
    DepartureAddress: this.fb.control('', [Validators.required]),
    ArrivesAddress: this.fb.control('', [Validators.required]),
    Reason: this.fb.control('', [Validators.required]),
    Note: this.fb.control(''),
    ApproveID: this.fb.control<number | null>(null, [Validators.required]),
    Proposals: this.fb.array([])
  });

  isLoading = false;
  isSaving = false;

  // Danh sách lựa chọn
  employees: any[] = [];
  projects: any[] = [];
  groupedEmployees: any[] = [];
  approvers: any[] = [];

  // Gợi ý lịch sử
  historicalSuggestions: any = { departures: [], arrivals: [], airlines: [] };
  filteredDepartures: string[] = [];
  filteredArrivals: string[] = [];
  filteredAirlines: string[] = [];

  timeHours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  timeMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  formatterVND = (value: number | string): string => {
    if (!value && value !== 0) return '';
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  parserVND = (value: string): number => Number(value.replace(/\./g, ''));

  get proposals() {
    return this.validateForm.controls.Proposals as FormArray;
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadHistoricalSuggestions();
    if (this.id) {
      this.loadData(this.id);
    } else {
      // Default one proposal row for new record
      this.addProposal();
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
          this.loadForm(master, proposals);
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

  private loadForm(master: any, proposals: any[]): void {
    this.validateForm.patchValue({
      ID: master.ID ?? 0,
      EmployeeRequestID: master.EmployeeRequestID ?? null,
      EmployeeIDs: [master.EmployeeID], // In edit mode, usually editing one record
      ProjectID: master.ProjectID ?? null,
      DepartureAddress: master.DepartureAddress ?? '',
      ArrivesAddress: master.ArrivesAddress ?? '',
      Reason: master.Reason ?? '',
      Note: master.Note ?? '',
      ApproveID: (proposals && proposals.length > 0) ? proposals[0].ApproveID : null
    });

    // Clear and load proposals
    while (this.proposals.length) {
      this.proposals.removeAt(0);
    }
    if (proposals && proposals.length > 0) {
      proposals.forEach(p => this.addProposal(p));
    } else {
      this.addProposal();
    }
    this.cdr.detectChanges();
  }

  addProposal(data?: any): void {
    const proposalGroup = this.fb.group({
      ID: this.fb.control(data?.ID ?? data?.id ?? 0),
      DepartureDate: this.fb.control(this.formatDateForInput(data?.DepartureDate ?? data?.departureDate ?? new Date()), [Validators.required]),
      DepartureTimeHour: this.fb.control(data?.DepartureTime || data?.departureTime ? String(new Date(data?.DepartureTime || data?.departureTime).getHours()).padStart(2, '0') : '08', [Validators.required]),
      DepartureTimeMinute: this.fb.control(data?.DepartureTime || data?.departureTime ? String(new Date(data?.DepartureTime || data?.departureTime).getMinutes()).padStart(2, '0') : '00', [Validators.required]),
      Airline: this.fb.control(data?.Airline ?? data?.airline ?? '', [Validators.required]),
      Price: this.fb.control(data?.Price ?? data?.price ?? 0, [Validators.required]),
      Baggage: this.fb.control(data?.Baggage ?? data?.baggage ?? ''),
      IsApprove: this.fb.control(data?.IsApprove ?? data?.isApprove ?? 0),
      HCNSProposal: this.fb.control(data?.HCNSProposal ?? data?.hcnsProposal ?? false),
      ReasonHCNSProposal: this.fb.control(data?.ReasonHCNSProposal ?? data?.reasonHCNSProposal ?? '')
    });
    this.proposals.push(proposalGroup);
    this.cdr.detectChanges();
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
          this.historicalSuggestions = res.data;
          // Initialize filtered lists with full data
          this.filteredDepartures = [...this.historicalSuggestions.departures];
          this.filteredArrivals = [...this.historicalSuggestions.arrivals];
          this.filteredAirlines = [...this.historicalSuggestions.airlines];
        }
      }
    });
  }

  onDepartureInput(value: string): void {
    const val = (value || '').toLowerCase();
    this.filteredDepartures = (this.historicalSuggestions.departures || []).filter((x: string) => x.toLowerCase().includes(val));
  }

  onArrivalInput(value: string): void {
    const val = (value || '').toLowerCase();
    this.filteredArrivals = (this.historicalSuggestions.arrivals || []).filter((x: string) => x.toLowerCase().includes(val));
  }

  onAirlineInput(value: string): void {
    const val = (value || '').toLowerCase();
    this.filteredAirlines = (this.historicalSuggestions.airlines || []).filter((x: string) => x.toLowerCase().includes(val));
  }

  onSubmit(): void {
    if (this.validateForm.invalid) {
      Object.keys(this.validateForm.controls).forEach(key => {
        const control = this.validateForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });

      // Mark proposals as touched
      this.proposals.controls.forEach((group: any) => {
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

    const formattedProposals = formData.Proposals.map((p: any) => {
      let departureTimeStr = '';
      if (p.DepartureDate) {
        const [year, month, day] = p.DepartureDate.split('-').map(Number);
        const dTime = new Date(year, month - 1, day, +(p.DepartureTimeHour || '00'), +(p.DepartureTimeMinute || '00'), 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        departureTimeStr = `${dTime.getFullYear()}-${pad(dTime.getMonth() + 1)}-${pad(dTime.getDate())}T${pad(dTime.getHours())}:${pad(dTime.getMinutes())}:${pad(dTime.getSeconds())}`;
      }
      return {
        ...p,
        DepartureTime: departureTimeStr,
        ApproveID: formData.ApproveID
      };
    });

    const body: FlightBookingSaveDTO = {
      ID: formData.ID,
      Reason: formData.Reason,
      ProjectID: formData.ProjectID,
      EmployeeRequestID: formData.EmployeeRequestID,
      DepartureAddress: formData.DepartureAddress,
      ArrivesAddress: formData.ArrivesAddress,
      Note: formData.Note,
      TravelerIDs: formData.EmployeeIDs,
      Proposals: formattedProposals as any
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
