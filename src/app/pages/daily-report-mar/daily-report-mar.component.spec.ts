import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportMarComponent } from './daily-report-mar.component';

describe('DailyReportMarComponent', () => {
  let component: DailyReportMarComponent;
  let fixture: ComponentFixture<DailyReportMarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportMarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportMarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
