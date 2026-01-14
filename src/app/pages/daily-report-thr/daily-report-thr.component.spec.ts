import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportThrComponent } from './daily-report-thr.component';

describe('DailyReportTHRComponent', () => {
  let component: DailyReportThrComponent;
  let fixture: ComponentFixture<DailyReportThrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportThrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportThrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
