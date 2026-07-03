import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { VisaRequestService, BusinessVisaRequest } from '../visa-request.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
  selector: 'app-visa-request-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzFormModule,
    NzGridModule,
    NzAutocompleteModule
  ],
  templateUrl: './visa-request-form.component.html',
  styleUrls: ['./visa-request-form.component.css']
})
export class VisaRequestFormComponent implements OnInit {
  @Input() record: any = null;
  @Input() maxSTT: number = 0;
  @Input() isCopy: boolean = false;

  formData: BusinessVisaRequest = {
    ID: 0,
    Type: 1, // Mặc định là CBNV
    Gender: 1
  };

  tripDates: Date[] = [];
  isSaving = false;
  employees: any[] = [];
  groupedEmployees: any[] = [];

  historicalSuggestions: any[] = [];
  filteredNations: string[] = [];
  filteredFullNames: string[] = [];
  filteredPassports: string[] = [];
  filteredJobs: string[] = [];
  filteredCompanies: string[] = [];
  filteredDestinations: string[] = [];
  filteredVisaIssueDates: string[] = [];
  filteredStatuses: string[] = [];
  filteredCosts: number[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private visaRequestService: VisaRequestService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadHistoricalSuggestions();

    if (this.record) {
      this.formData = { ...this.record };
      if (this.formData.BusinessTripFromDate && this.formData.BusinessTripToDate) {
        this.tripDates = [new Date(this.formData.BusinessTripFromDate), new Date(this.formData.BusinessTripToDate)];
      }
      if (this.isCopy) {
        this.formData.ID = 0;
        this.formData.STT = (this.maxSTT || 0) + 1;
      }
    } else {
      this.formData.STT = (this.maxSTT || 0) + 1;
    }
  }

  private loadDropdowns(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.employees = res.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      }
    });
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

  onTypeChange(): void {
    if (this.formData.Type === 1) {
      this.formData.CompanyName = 'RTC Technology Viet Nam';
    } else {
      this.formData.EmployeeID = undefined;
      this.formData.CompanyName = '';
    }
  }

  onEmployeeChange(): void {
    if (this.formData.EmployeeID) {
      const selectedEmp = this.employees.find(x => x.ID === this.formData.EmployeeID);
      if (selectedEmp) {
        this.formData.FullName = selectedEmp.FullName;
        this.formData.DateOfBirth = selectedEmp.BirthOfDate;
        this.formData.Gender = selectedEmp.Gender; // Giả sử Gender có trong employee
      }
    }
  }

  onTripDatesChange(result: Date[]): void {
    if (result && result.length === 2) {
      this.formData.BusinessTripFromDate = result[0];
      this.formData.BusinessTripToDate = result[1];
    } else {
      this.formData.BusinessTripFromDate = undefined;
      this.formData.BusinessTripToDate = undefined;
    }
  }

  loadHistoricalSuggestions(): void {
    this.visaRequestService.getHistoricalSuggestions().subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.historicalSuggestions = res.data || [];
        }
      }
    });
  }

  onNationInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredNations = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.Nation && s.Nation.toString().toLowerCase().includes(valStr))
        .map(s => s.Nation)
    ));
  }

  onFullNameInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredFullNames = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.FullName && s.FullName.toString().toLowerCase().includes(valStr))
        .map(s => s.FullName)
    ));
  }

  onPassportInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredPassports = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.HoChieu && s.HoChieu.toString().toLowerCase().includes(valStr))
        .map(s => s.HoChieu)
    ));
  }

  onJobInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredJobs = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.NgheNghiep && s.NgheNghiep.toString().toLowerCase().includes(valStr))
        .map(s => s.NgheNghiep)
    ));
  }

  onCompanyInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredCompanies = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.CompanyName && s.CompanyName.toString().toLowerCase().includes(valStr))
        .map(s => s.CompanyName)
    ));
  }

  onDestinationInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredDestinations = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.Destination && s.Destination.toString().toLowerCase().includes(valStr))
        .map(s => s.Destination)
    ));
  }

  onVisaIssueDateInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredVisaIssueDates = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.VisaIssueDate && s.VisaIssueDate.toString().toLowerCase().includes(valStr))
        .map(s => s.VisaIssueDate)
    ));
  }

  onStatusInput(value: string | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredStatuses = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.Status && s.Status.toString().toLowerCase().includes(valStr))
        .map(s => s.Status)
    ));
  }

  onCostInput(value: number | any): void {
    const valStr = (value || '').toString().toLowerCase();
    this.filteredCosts = Array.from(new Set(
      this.historicalSuggestions
        .filter(s => s.Cost !== null && s.Cost !== undefined && s.Cost.toString().toLowerCase().includes(valStr))
        .map(s => s.Cost)
    ));
  }

  onCostChange(value: any): void {
    const parsed = this.parserVND(value);
    this.formData.Cost = parsed;
    this.onCostInput(parsed);
  }

  save(): void {
    // Validate
    if (this.formData.Type === 1 && !this.formData.EmployeeID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên');
      return;
    }

    if (this.formData.Type === 2 && !this.formData.FullName) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập họ và tên');
      return;
    }

    if (!this.formData.Destination) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập điểm đến');
      return;
    }

    this.isSaving = true;
    this.visaRequestService.saveData(this.formData).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        }
      },
      error: () => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra');
      }
    });
  }

  formatterVND = (value: number): string => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
  parserVND = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return Number((value || '').toString().replace(/\$\s?|(,*)/g, '')) || 0;
  };

  dismiss(): void {
    this.activeModal.dismiss();
  }
}
