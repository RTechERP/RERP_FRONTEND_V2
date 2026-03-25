/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

<<<<<<<< HEAD:src/app/pages/hrm/day-off/day-off.component.spec.ts
import { DayOffComponent } from './day-off.component';

describe('DayOffComponent', () => {
  let component: DayOffComponent;
  let fixture: ComponentFixture<DayOffComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DayOffComponent ]
========
import { PaymentOrderTeamComponent } from './payment-order-team.component';

describe('PaymentOrderTeamComponent', () => {
  let component: PaymentOrderTeamComponent;
  let fixture: ComponentFixture<PaymentOrderTeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentOrderTeamComponent ]
>>>>>>>> f846a535f3b816dd9f24156d4b3a1cd834c5d6be:src/app/pages/general-category/payment-order-team/payment-order-team.component.spec.ts
    })
    .compileComponents();
  }));

  beforeEach(() => {
<<<<<<<< HEAD:src/app/pages/hrm/day-off/day-off.component.spec.ts
    fixture = TestBed.createComponent(DayOffComponent);
========
    fixture = TestBed.createComponent(PaymentOrderTeamComponent);
>>>>>>>> f846a535f3b816dd9f24156d4b3a1cd834c5d6be:src/app/pages/general-category/payment-order-team/payment-order-team.component.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
