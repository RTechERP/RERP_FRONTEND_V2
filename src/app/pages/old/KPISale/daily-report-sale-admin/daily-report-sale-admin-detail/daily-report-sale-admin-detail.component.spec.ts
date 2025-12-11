import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportSaleAdminDetailComponent } from './daily-report-sale-admin-detail.component';

describe('DailyReportSaleAdminDetailComponent', () => {
  let component: DailyReportSaleAdminDetailComponent;
  let fixture: ComponentFixture<DailyReportSaleAdminDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportSaleAdminDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportSaleAdminDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
