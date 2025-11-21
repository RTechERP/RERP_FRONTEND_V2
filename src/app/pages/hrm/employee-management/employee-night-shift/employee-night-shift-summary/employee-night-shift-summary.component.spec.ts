import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeNightShiftSummaryComponent } from './employee-night-shift-summary.component';

describe('EmployeeNightShiftSummaryComponent', () => {
  let component: EmployeeNightShiftSummaryComponent;
  let fixture: ComponentFixture<EmployeeNightShiftSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeNightShiftSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeNightShiftSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
