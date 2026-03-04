import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryKpiEmployeePointComponent } from './summary-kpi-employee-point.component';

describe('SummaryKpiEmployeePointComponent', () => {
  let component: SummaryKpiEmployeePointComponent;
  let fixture: ComponentFixture<SummaryKpiEmployeePointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryKpiEmployeePointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryKpiEmployeePointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
