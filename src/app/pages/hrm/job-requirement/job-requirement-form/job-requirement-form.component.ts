import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';




import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule } from 'ng-zorro-antd/upload';

import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HandoverService } from '../../handover/handover-service/handover.service';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-job-requirement-form',
  standalone: true,
  imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzFormModule,
         NzInputModule,
        NzIconModule,
        NzButtonModule,
        NzModalModule,
        NzSplitterModule,
        NzCheckboxModule,
        NzSelectModule,
        NzDatePickerModule,
        NzGridModule,
        
  ],
  templateUrl: './job-requirement-form.component.html',
  styleUrl: './job-requirement-form.component.css'
})
export class JobRequirementFormComponent implements OnInit, AfterViewInit {

  @Input() JobRequirementID: number = 0;
  @Input() dataInput: any;
  @Input() isCheckmode: boolean = false;
  formGroup: FormGroup;
  cbbEmployeeGroup: any[] = [];
  dataDepartment: any[] =[];
  dateFormat = 'dd/MM/yyyy';
  cbbEmployee: any;
  currentEmployee: any;
  currentUser: any;


  ngOnInit(): void {
      this.getdataEmployee();
      this.getdataDepartment();

      this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
        this.currentEmployee = Array.isArray(this.currentUser)
      ? this.currentUser[0]
      : this.currentUser;
    });
  }

  ngAfterViewInit(): void {
      
  }

    constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private jobRequirementService: JobRequirementService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private handoverService: HandoverService,
    private authService: AuthService,
  ) {
     this.formGroup = this.fb.group({
      STT: 0,
      NameDocument: [null, [Validators.required, Validators.maxLength(100)]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      DepartmentID: ['', [Validators.required]],
      EmployeeDepartment: ['', [Validators.required]],
      RequiredDepartment: ['', [Validators.required]],
      CoordinationDepartment: ['', [Validators.required]],
      EmployeeID: ['', [Validators.required]],
      DatePromulgate: ['', [Validators.required]],
      DateEffective: ['', [Validators.required]],
      SignedEmployeeID: [0],
      AffectedScope: [''],
      GroupType: 1,
      IsPromulgated: [false],
      IsOnWeb: [false],
    });
  }

    filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

    closeModal() {
    this.activeModal.close(true);
  }

    onSelectEmployee(employeeID: number): void {
    if (!employeeID) {
    this.formGroup.patchValue({
      EmployeeID: null,
      EmployeeDepartment: null,
    });
    return;
  }

    // Tìm object nhân viên trong danh sách
    const employee = this.cbbEmployee.find((e: any) => e.ID === employeeID);

    if (!employee) return;

    const EmployeeID = employee.ID || 0;
    if (EmployeeID && EmployeeID > 0) {
      this.formGroup.value.EmployeeID = employee.ID;
    } 
    const selected = this.cbbEmployee.find((e: any) => e.ID === employeeID);
    if (selected) {
       this.formGroup.patchValue({
    EmployeeID: selected.ID,
    EmployeeDepartment: selected.DepartmentID
  });

    }
  }
    getdataEmployee() {
    this.handoverService.getAllEmployee().subscribe((response: any) => {
      const data = response.data || [];
      this.cbbEmployee = data;

      // Gom nhóm theo phòng ban
      const groupMap = new Map<string, any[]>();
      data.forEach((item: any) => {
        if (!groupMap.has(item.DepartmentName)) {
          groupMap.set(item.DepartmentName, []);
        }
        groupMap.get(item.DepartmentName)?.push(item);
      });

      this.cbbEmployeeGroup = Array.from(
        groupMap,
        ([department, employees]) => ({
          department,
          employees,
        })
      );
    });
  }

    getdataDepartment() {
    this.handoverService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  saveData() {

  }
}
