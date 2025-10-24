/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeePayrollDetailEditComponent } from './employee-payroll-detail-edit.component';

describe('EmployeePayrollDetailEditComponent', () => {
  let component: EmployeePayrollDetailEditComponent;
  let fixture: ComponentFixture<EmployeePayrollDetailEditComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePayrollDetailEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePayrollDetailEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
