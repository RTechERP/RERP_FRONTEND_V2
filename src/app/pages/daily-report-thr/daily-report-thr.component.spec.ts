import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportTHRComponent } from './daily-report-thr.component';

describe('DailyReportTHRComponent', () => {
  let component: DailyReportTHRComponent;
  let fixture: ComponentFixture<DailyReportTHRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportTHRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportTHRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
