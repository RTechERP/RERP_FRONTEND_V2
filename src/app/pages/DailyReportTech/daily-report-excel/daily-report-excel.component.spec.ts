import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportExcelComponent } from './daily-report-excel.component';

describe('DailyReportExcelComponent', () => {
  let component: DailyReportExcelComponent;
  let fixture: ComponentFixture<DailyReportExcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportExcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
