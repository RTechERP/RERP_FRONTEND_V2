/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeePayrollBonusDeductionComponent } from './employee-payroll-bonus-deduction.component';

describe('EmployeePayrollBonusDeductionComponent', () => {
  let component: EmployeePayrollBonusDeductionComponent;
  let fixture: ComponentFixture<EmployeePayrollBonusDeductionComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePayrollBonusDeductionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePayrollBonusDeductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
