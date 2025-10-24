/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeePayrollBonusDeductionDetailComponent } from './employee-payroll-bonus-deduction-detail.component';

describe('EmployeePayrollBonusDeductionDetailComponent', () => {
  let component: EmployeePayrollBonusDeductionDetailComponent;
  let fixture: ComponentFixture<EmployeePayrollBonusDeductionDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePayrollBonusDeductionDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePayrollBonusDeductionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
