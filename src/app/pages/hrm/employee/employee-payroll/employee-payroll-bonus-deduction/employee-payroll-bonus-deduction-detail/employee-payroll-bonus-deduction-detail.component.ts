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
import { EmployeePayrollService } from '../../employee-payroll-service/employee-payroll.service';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";

@Component({
  selector: 'app-employee-payroll-bonus-deduction-detail',
  templateUrl: './employee-payroll-bonus-deduction-detail.component.html',
  styleUrls: ['./employee-payroll-bonus-deduction-detail.component.css'],
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
  ]
})
export class EmployeePayrollBonusDeductionDetailComponent implements OnInit {


  constructor(
    private employeePayrollService: EmployeePayrollService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
  ) { }
  @Input() employees: any[] = [];
  @Input() EmployeePayrollBonusDeuctions: any;
  EmployeeID: number = 0;

  YearValue: Date = new Date();
  MonthValue: number = new Date().getMonth() + 1;
  KPIBonus: number = 0;
  OtherBonus: number = 0;
  ParkingMoney: number = 0;
  Punish5S: number = 0;
  OtherDeduction: number = 0;
  BHXH: number = 0;
  SalaryAdvance: number = 0;
  Note: string = '';

  ngOnInit() {
    this.fillData();
  }
  onEmployeeChange(event: any) {
    this.EmployeeID = event ?? 0;
  }
  fillData() {
    console.log(this.EmployeePayrollBonusDeuctions)
    if (this.EmployeePayrollBonusDeuctions !== undefined) {
      this.EmployeeID = this.EmployeePayrollBonusDeuctions.EmployeeID;
      this.YearValue =new Date( this.EmployeePayrollBonusDeuctions.YearValue,0,1);
      this.MonthValue = this.EmployeePayrollBonusDeuctions.MonthValue;
      this.KPIBonus = this.EmployeePayrollBonusDeuctions.KPIBonus;
      this.OtherBonus = this.EmployeePayrollBonusDeuctions.OtherBonus;
      this.ParkingMoney = this.EmployeePayrollBonusDeuctions.ParkingMoney;
      this.Punish5S = this.EmployeePayrollBonusDeuctions.Punish5S;
      this.OtherDeduction = this.EmployeePayrollBonusDeuctions.OtherDeduction;
      this.BHXH = this.EmployeePayrollBonusDeuctions.BHXH;
      this.SalaryAdvance = this.EmployeePayrollBonusDeuctions.SalaryAdvance;
      this.Note = this.EmployeePayrollBonusDeuctions.Note;
    }
  }
  onSubmit(){
    if(this.EmployeeID == 0){
      this.notification.create(
        'error',
        'Thông báo',
        'Vui lòng chọn nhân viên!'
      );
      return;
    }
    // nếu tất cả các trường của phạt bị =0 hoặc k điền thì thông báo, nếu có 1 cái có value >0 thì cho phép lưu
    let flag = false;
    if(this.KPIBonus == 0 && this.OtherBonus == 0 && this.ParkingMoney == 0 && this.Punish5S == 0 && this.OtherDeduction == 0 && this.BHXH == 0 && this.SalaryAdvance == 0){
      this.notification.create(
        'error',
        'Thông báo',
        'Vui lòng nhập ít nhất 1 trường!'
      );
      return;
    }
    this.saveData();
  }
  saveData(){
    
    let object = {
      ID:0,
      EmployeeID: this.EmployeeID,
      YearValue: this.YearValue.getFullYear(),
      MonthValue: this.MonthValue,
      TotalWorkDay:0,
      KPIBonus: this.KPIBonus,
      OtherBonus: this.OtherBonus,
      ParkingMoney: this.ParkingMoney,
      Punish5S: this.Punish5S,
      OtherDeduction: this.OtherDeduction,
      BHXH: this.BHXH,
      SalaryAdvance: this.SalaryAdvance,
      Note: this.Note,
    }
if(this.EmployeePayrollBonusDeuctions !== undefined){
  object.ID = this.EmployeePayrollBonusDeuctions.ID;
}
    console.log(object)
    this.employeePayrollService.postSaveEmployeePayrollBonusDeuction(object).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.notification.create(
            'success',
            'Thông báo',
            'Lưu thành công!'
          );
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
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi lưu dữ liệu!'
        );
      }
    }); 

  }
}
