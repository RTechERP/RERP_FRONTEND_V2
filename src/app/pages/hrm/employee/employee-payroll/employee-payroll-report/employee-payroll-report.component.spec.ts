/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeePayrollReportComponent } from './employee-payroll-report.component';

describe('EmployeePayrollReportComponent', () => {
  let component: EmployeePayrollReportComponent;
  let fixture: ComponentFixture<EmployeePayrollReportComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePayrollReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePayrollReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
