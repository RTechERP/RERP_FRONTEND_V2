import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportHrDetailComponent } from './daily-report-hr-detail.component';

describe('DailyReportHrDetailComponent', () => {
  let component: DailyReportHrDetailComponent;
  let fixture: ComponentFixture<DailyReportHrDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportHrDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportHrDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
