import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzColDirective, NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormItemComponent, NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { EmployeePayrollService } from '../../employee-payroll-service/employee-payroll.service';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-employee-payroll-detail-edit',
  templateUrl: './employee-payroll-detail-edit.component.html',
  styleUrls: ['./employee-payroll-detail-edit.component.css'],
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    CommonModule,
    NzInputNumberModule,
    CommonModule,

  ]
})
export class EmployeePayrollDetailEditComponent implements OnInit {
  @Input() employeePayrollDetailID: any = 0;
  @Input() employees: any[] = [];
  // employees: any[] = [];
  EmployeeID: number = 0;
  TotalWorkday: number = 0;
  Bonus: number = 0;
  Other: number = 0;
  ParkingMoney: number = 0;
  OtherDeduction: number = 0;
  Note: string = '';

  employeePayrollDetail: any;

  isSaving = false;

  constructor(
    private employeePayrollService: EmployeePayrollService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    // this.getEmployee();
    this.loadData();
  }
  onSubmit() {
    // check nhân viên null =>>
    this.saveData();
  }
  loadData() {
      this.isSaving = true;
    this.employeePayrollService.getEmployeePayrollDetailByID(this.employeePayrollDetailID).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.employeePayrollDetail = res.data;

          this.EmployeeID = res.data.EmployeeID;
          this.TotalWorkday = res.data.TotalWorkday;
          this.Bonus = res.data.Bonus;
          this.Other = res.data.Other;
          this.ParkingMoney = res.data.ParkingMoney;
          this.OtherDeduction = res.data.OtherDeduction;
          this.Note = res.data.Note;
        }

      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }
  saveData() {
    // các khoản cộng
    this.employeePayrollDetail.Bonus = this.Bonus;
    this.employeePayrollDetail.Other = this.Other;


    //Tính tổng thu nhập thực tế
    this.employeePayrollDetail.RealSalary = this.employeePayrollDetail.RealSalary
      + this.employeePayrollDetail.Bonus
      + this.employeePayrollDetail.Other
    // Các khoản trừ 
    this.employeePayrollDetail.ParkingMoney = this.ParkingMoney;
    this.employeePayrollDetail.OtherDeduction = this.OtherDeduction;
    let totalDeduction = this.employeePayrollDetail.Insurances
      + this.employeePayrollDetail.UnionFees
      + this.employeePayrollDetail.AdvancePayment
      + this.employeePayrollDetail.DepartmentalFees
      + this.employeePayrollDetail.ParkingMoney
      + this.employeePayrollDetail.Punish5S
      + this.employeePayrollDetail.OtherDeduction;
    this.employeePayrollDetail.ActualAmountReceived = this.employeePayrollDetail.RealSalary - totalDeduction;

    this.employeePayrollDetail.Note = this.Note.trim();
    this.employeePayrollDetail.EmployeeID = this.EmployeeID;
    this.employeePayrollService.postSaveEmployeePayrollDetail(this.employeePayrollDetail).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.create(
            "success",
            "Thông báo",
            "Cập nhật bảng lương thành công!"
          )
          this.activeModal.close();

        }
        else {
          this.notification.error('Lỗi', 'Không cập nhật được dữ liệu');
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }

  getEmployee() {
    this.employeePayrollService.getEmployee(-1, 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.employees = this.employeePayrollService.createdDataGroup(res.data, 'DepartmentName');
        }

      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }
}
