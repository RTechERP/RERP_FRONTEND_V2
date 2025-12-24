import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportMachineDetailComponent } from './daily-report-machine-detail.component';

describe('DailyReportMachineDetailComponent', () => {
  let component: DailyReportMachineDetailComponent;
  let fixture: ComponentFixture<DailyReportMachineDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportMachineDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportMachineDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
