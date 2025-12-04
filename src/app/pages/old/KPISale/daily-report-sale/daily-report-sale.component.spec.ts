import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportSaleComponent } from './daily-report-sale.component';

describe('DailyReportSaleComponent', () => {
  let component: DailyReportSaleComponent;
  let fixture: ComponentFixture<DailyReportSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
