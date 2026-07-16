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
import { FlightBookingSaveDTO, FlightBookingPassenger } from '../models';
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
  @Input() isCopy: boolean = false;

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
    ProjectID: this.fb.control<number | null>(null, [Validators.required]),
    DepartureAddress: this.fb.control('', [Validators.required]),
    ArrivesAddress: this.fb.control('', [Validators.required]),
    Reason: this.fb.control('', [Validators.required]),
    Note: this.fb.control(''),
    ApproveID: this.fb.control<number | null>(null, [Validators.required]),
    IsRoundTrip: this.fb.control(false),
    Passengers: this.fb.array([]),
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
  historicalBookings: any[] = [];
  filteredDepartures: string[] = [];
  filteredArrivals: string[] = [];
  filteredAirlines: string[] = [];
  filteredBaggages: string[] = [];

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

  get passengers() {
    return this.validateForm.controls.Passengers as FormArray;
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadHistoricalSuggestions();

    this.validateForm.get('IsRoundTrip')?.valueChanges.subscribe(val => {
      this.updateRoundTripValidators(val || false);
    });

    if (this.id) {
      this.loadData(this.id);
    } else {
      // Default one proposal row and one passenger row for new record
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
          const passengers = data.passengers || data.Passengers || [];
          this.loadForm(master, proposals, passengers);
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

  private loadForm(master: any, proposals: any[], passengers: any[]): void {
    this.validateForm.patchValue({
      ID: this.isCopy ? 0 : (master.ID ?? 0),
      EmployeeRequestID: master.EmployeeRequestID ?? null,
      ProjectID: master.ProjectID ?? null,
      DepartureAddress: master.DepartureAddress ?? '',
      ArrivesAddress: master.ArrivesAddress ?? '',
      Reason: master.Reason ?? '',
      Note: master.Note ?? '',
      IsRoundTrip: master.IsRoundTrip ?? false,
      ApproveID: (proposals && proposals.length > 0) ? proposals[0].ApproveID : null
    });

    // Clear and load proposals
    while (this.proposals.length) {
      this.proposals.removeAt(0);
    }
    if (proposals && proposals.length > 0) {
      proposals.forEach(p => {
        if (this.isCopy) {
          p = { ...p, ID: 0, id: 0, IsApprove: 0, isApprove: 0, HCNSProposal: false, hcnsProposal: false, ReasonHCNSProposal: '', reasonHCNSProposal: '' };
        }
        this.addProposal(p);
      });
    } else {
      this.addProposal();
    }

    // Clear and load passengers
    while (this.passengers.length) {
      this.passengers.removeAt(0);
    }
    if (passengers && passengers.length > 0) {
      passengers.forEach(pass => {
        if (this.isCopy) {
          pass = { ...pass, ID: 0, id: 0 };
        }
        this.addPassenger(pass);
      });
    } else {
      this.addPassenger();
    }

    this.updateRoundTripValidators(master.IsRoundTrip ?? false);
    this.cdr.detectChanges();
  }

  addProposal(data?: any): void {
    const isRoundTrip = this.validateForm.get('IsRoundTrip')?.value ?? false;
    const proposalGroup = this.fb.group({
      ID: this.fb.control(data?.ID ?? data?.id ?? 0),
      DepartureDate: this.fb.control(this.formatDateForInput(data?.DepartureDate ?? data?.departureDate ?? new Date()), [Validators.required]),
      DepartureTimeHour: this.fb.control(data?.DepartureTime || data?.departureTime ? String(new Date(data?.DepartureTime || data?.departureTime).getHours()).padStart(2, '0') : '08', [Validators.required]),
      DepartureTimeMinute: this.fb.control(data?.DepartureTime || data?.departureTime ? String(new Date(data?.DepartureTime || data?.departureTime).getMinutes()).padStart(2, '0') : '00', [Validators.required]),
      
      ReturnDate: this.fb.control(this.formatDateForInput(data?.ReturnDate ?? data?.returnDate ?? ''), isRoundTrip ? [Validators.required] : []),
      ReturnTimeHour: this.fb.control(data?.ReturnTime || data?.returnTime ? String(new Date(data?.ReturnTime || data?.returnTime).getHours()).padStart(2, '0') : '08', isRoundTrip ? [Validators.required] : []),
      ReturnTimeMinute: this.fb.control(data?.ReturnTime || data?.returnTime ? String(new Date(data?.ReturnTime || data?.returnTime).getMinutes()).padStart(2, '0') : '00', isRoundTrip ? [Validators.required] : []),

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

  addPassenger(data?: any): void {
    const type = data?.Type ?? data?.type ?? 1;
    const group = this.fb.group({
      ID: this.fb.control(data?.ID ?? data?.id ?? 0),
      Type: this.fb.control(type, [Validators.required]),
      EmployeeID: this.fb.control<number | null>(data?.EmployeeID ?? data?.employeeID ?? null),
      FullName: this.fb.control(data?.FullName ?? data?.fullName ?? '', [Validators.required])
    });

    // Subscriptions for dynamics
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Cần ít nhất một người đi');
    }
  }

  updateRoundTripValidators(isRoundTrip: boolean): void {
    this.proposals.controls.forEach((group: any) => {
      const returnDateCtrl = group.get('ReturnDate');
      const returnTimeHourCtrl = group.get('ReturnTimeHour');
      const returnTimeMinuteCtrl = group.get('ReturnTimeMinute');
      
      if (isRoundTrip) {
        returnDateCtrl?.setValidators([Validators.required]);
        returnTimeHourCtrl?.setValidators([Validators.required]);
        returnTimeMinuteCtrl?.setValidators([Validators.required]);
      } else {
        returnDateCtrl?.clearValidators();
        returnTimeHourCtrl?.clearValidators();
        returnTimeMinuteCtrl?.clearValidators();
      }
      returnDateCtrl?.updateValueAndValidity();
      returnTimeHourCtrl?.updateValueAndValidity();
      returnTimeMinuteCtrl?.updateValueAndValidity();
    });
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
          this.historicalBookings = res.data || [];
        }
      }
    });
  }

  onDepartureInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredDepartures = Array.from(new Set(
      this.historicalBookings
        .filter(s => s.DepartureAddress && s.DepartureAddress.toString().toLowerCase().includes(valStr))
        .map(s => s.DepartureAddress)
    ));
  }

  onArrivalInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredArrivals = Array.from(new Set(
      this.historicalBookings
        .filter(s => s.ArrivesAddress && s.ArrivesAddress.toString().toLowerCase().includes(valStr))
        .map(s => s.ArrivesAddress)
    ));
  }

  onAirlineInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredAirlines = Array.from(new Set(
      this.historicalBookings
        .filter(s => s.Airline && s.Airline.toString().toLowerCase().includes(valStr))
        .map(s => s.Airline)
    ));
  }

  onBaggageInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredBaggages = Array.from(new Set(
      this.historicalBookings
        .filter(s => s.Baggage && s.Baggage.toString().toLowerCase().includes(valStr))
        .map(s => s.Baggage)
    ));
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

      // Mark passengers as touched
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
    const isRoundTrip = formData.IsRoundTrip;

    const formattedProposals = formData.Proposals.map((p: any) => {
      let departureTimeStr = '';
      if (p.DepartureDate) {
        const [year, month, day] = p.DepartureDate.split('-').map(Number);
        const dTime = new Date(year, month - 1, day, +(p.DepartureTimeHour || '00'), +(p.DepartureTimeMinute || '00'), 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        departureTimeStr = `${dTime.getFullYear()}-${pad(dTime.getMonth() + 1)}-${pad(dTime.getDate())}T${pad(dTime.getHours())}:${pad(dTime.getMinutes())}:${pad(dTime.getSeconds())}`;
      }

      let returnTimeStr = '';
      let returnDateStr = '';
      if (isRoundTrip && p.ReturnDate) {
        const [year, month, day] = p.ReturnDate.split('-').map(Number);
        const rTime = new Date(year, month - 1, day, +(p.ReturnTimeHour || '00'), +(p.ReturnTimeMinute || '00'), 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        returnTimeStr = `${rTime.getFullYear()}-${pad(rTime.getMonth() + 1)}-${pad(rTime.getDate())}T${pad(rTime.getHours())}:${pad(rTime.getMinutes())}:${pad(rTime.getSeconds())}`;
        returnDateStr = p.ReturnDate;
      }

      return {
        ...p,
        DepartureTime: departureTimeStr,
        ReturnDate: returnDateStr ? returnDateStr : null,
        ReturnTime: returnTimeStr ? returnTimeStr : null,
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
      TravelerIDs: (formData.Passengers as FlightBookingPassenger[])
        .filter(p => p.Type === 1 && p.EmployeeID)
        .map(p => p.EmployeeID as number),
      Passengers: formData.Passengers as FlightBookingPassenger[],
      Proposals: formattedProposals as any,
      IsRoundTrip: formData.IsRoundTrip
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
