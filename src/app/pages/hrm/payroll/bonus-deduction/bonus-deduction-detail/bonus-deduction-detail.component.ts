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
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
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
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { PayrollService } from '../../payroll.service';
import { ProjectService } from '../../../../project/project-service/project.service';

@Component({
  selector: 'app-bonus-deduction-detail',
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
    NzInputNumberModule
  ],
  templateUrl: './bonus-deduction-detail.component.html',
  styleUrl: './bonus-deduction-detail.component.css'
})
export class BonusDeductionDetailComponent implements OnInit {
  constructor(
    private payrollService: PayrollService,
    private projectService: ProjectService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
  ) { }
  @Input() payrollBonusDeuctions: any;

  employees: any[] = [];
  employeeId: number = 0;

  @Input() year: any = new Date();
  @Input() month: number = new Date().getMonth() + 1;
  KPIBonus: number | null = null;
  OtherBonus: number | null = null;
  ParkingMoney: number | null = null;
  Punish5S: number | null = null;
  OtherDeduction: number | null = null;
  BHXH: number | null = null;
  SalaryAdvance: number | null = null;
  Note: string = '';

  isSave: any = false;

  onMoneyInputDynamic(event: any, fieldName: keyof this): void {
    let value = event?.target?.value ?? '';
    value = String(value);
    const numericValue = value
      .replace(/[^0-9.]/g, '')   // chỉ giữ số và dấu .
      .replace(/(\..*)\./g, '$1'); // chỉ cho 1 dấu .

    event.target.value = numericValue;
    (this as any)[fieldName] = numericValue ? parseFloat(numericValue) : null;
  }

  formatNumber(value: number | null): string {
    return value != null ? value.toLocaleString('en-US') : '';
  }

  ngOnInit(): void {
    this.getEmployee();
    this.fillData();
  }

  getEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        debugger
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  fillData() {
    if (this.payrollBonusDeuctions.ID > 0) {
      this.employeeId = this.payrollBonusDeuctions.EmployeeID;
      this.year = new Date(this.payrollBonusDeuctions.YearValue, 0, 1);
      this.month = this.payrollBonusDeuctions.MonthValue;
      this.KPIBonus = this.payrollBonusDeuctions.KPIBonus;
      this.OtherBonus = this.payrollBonusDeuctions.OtherBonus;
      this.ParkingMoney = this.payrollBonusDeuctions.ParkingMoney;
      this.Punish5S = this.payrollBonusDeuctions.Punish5S;
      this.OtherDeduction = this.payrollBonusDeuctions.OtherDeduction;
      this.BHXH = this.payrollBonusDeuctions.BHXH;
      this.SalaryAdvance = this.payrollBonusDeuctions.SalaryAdvance;
      this.Note = this.payrollBonusDeuctions.Note;
    }
  }

  onSubmit() {
    if (this.employeeId == 0) {
      this.notification.create(
        'error',
        'Thông báo',
        'Vui lòng chọn nhân viên!'
      );
      return;
    }
    // nếu tất cả các trường của phạt bị =0 hoặc k điền thì thông báo, nếu có 1 cái có value >0 thì cho phép lưu
    let flag = false;
    if (this.KPIBonus == 0 && this.OtherBonus == 0 && this.ParkingMoney == 0 && this.Punish5S == 0 && this.OtherDeduction == 0 && this.BHXH == 0 && this.SalaryAdvance == 0) {
      this.notification.create(
        'error',
        'Thông báo',
        'Vui lòng nhập ít nhất 1 trường!'
      );
      return;
    }
    this.saveData();
  }

  checkEmployee(employeeId: number): void {
    debugger
    this.employeeId = employeeId;
    this.payrollService
      .checkEmployeePayrollBonusDeduction(
        this.year.getFullYear(),
        this.month,
        this.employeeId
      )
      .subscribe({
        next: (response: any) => {
          if (response.status == 1 && response.data != null) {
            this.payrollBonusDeuctions = response.data;
            this.fillData();
          } else {
            this.KPIBonus = null;
            this.OtherBonus = null;
            this.ParkingMoney = null;
            this.Punish5S = null;
            this.OtherDeduction = null;
            this.BHXH = null;
            this.SalaryAdvance = null;
            this.Note = '';
          }
        },
        error: (err: any) => {
          this.notification.create('error', 'Thông báo', 'Lỗi dữ liệu!');
        },
      });
  }


  async saveData() {
    this.isSave = true;
    let data = {
      ID: this.payrollBonusDeuctions.ID > 0 ? this.payrollBonusDeuctions.ID : 0,
      EmployeeID: this.employeeId,
      YearValue: this.year.getFullYear(),
      MonthValue: this.month,
      TotalWorkDay: 0,
      KPIBonus: this.KPIBonus,
      OtherBonus: this.OtherBonus,
      ParkingMoney: this.ParkingMoney,
      Punish5S: this.Punish5S,
      OtherDeduction: this.OtherDeduction,
      BHXH: this.BHXH,
      SalaryAdvance: this.SalaryAdvance,
      Note: this.Note,
      IsDeleted: false
    }

    this.payrollService.saveEmployeePayrollBonusDeuction(data).subscribe({
      next: (response: any) => {
        this.isSave = false;
        if (response.status == 1) {
          this.notification.create(
            'success',
            'Thông báo',
            'Lưu thành công!'
          );
          this.activeModal.dismiss();
        }
        else {
          this.notification.create(
            'error',
            'Thông báo',
            response.message
          );
        }
      },
      error: (err: any) => {
        this.isSave = false;
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi lưu dữ liệu!'
        );
      }
    });

  }
}

