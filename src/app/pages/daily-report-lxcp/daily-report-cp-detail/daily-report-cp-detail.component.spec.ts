import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportCpDetailComponent } from './daily-report-cp-detail.component';

describe('DailyReportCpDetailComponent', () => {
  let component: DailyReportCpDetailComponent;
  let fixture: ComponentFixture<DailyReportCpDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportCpDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportCpDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
