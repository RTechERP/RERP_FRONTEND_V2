import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryKpiErrorEmployeeMonthComponent } from './summary-kpi-error-employee-month.component';

describe('SummaryKpiErrorEmployeeMonthComponent', () => {
  let component: SummaryKpiErrorEmployeeMonthComponent;
  let fixture: ComponentFixture<SummaryKpiErrorEmployeeMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryKpiErrorEmployeeMonthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryKpiErrorEmployeeMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
