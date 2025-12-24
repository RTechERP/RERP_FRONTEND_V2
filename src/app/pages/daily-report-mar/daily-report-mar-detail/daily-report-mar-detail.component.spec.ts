import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportMarDetailComponent } from './daily-report-mar-detail.component';

describe('DailyReportMarDetailComponent', () => {
  let component: DailyReportMarDetailComponent;
  let fixture: ComponentFixture<DailyReportMarDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportMarDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportMarDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
