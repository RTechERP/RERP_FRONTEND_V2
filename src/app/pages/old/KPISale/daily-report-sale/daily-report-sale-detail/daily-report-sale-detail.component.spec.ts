import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportSaleDetailComponent } from './daily-report-sale-detail.component';

describe('DailyReportSaleDetailComponent', () => {
  let component: DailyReportSaleDetailComponent;
  let fixture: ComponentFixture<DailyReportSaleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportSaleDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportSaleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
