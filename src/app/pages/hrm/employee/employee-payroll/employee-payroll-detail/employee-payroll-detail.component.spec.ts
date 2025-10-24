/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeePayrollDetailComponent } from './employee-payroll-detail.component';

describe('EmployeePayrollDetailComponent', () => {
  let component: EmployeePayrollDetailComponent;
  let fixture: ComponentFixture<EmployeePayrollDetailComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePayrollDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePayrollDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
