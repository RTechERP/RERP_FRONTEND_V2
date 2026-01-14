import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportMachineComponent } from './daily-report-machine.component';

describe('DailyReportMachineComponent', () => {
  let component: DailyReportMachineComponent;
  let fixture: ComponentFixture<DailyReportMachineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportMachineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportMachineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
