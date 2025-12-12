import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportSaleAdminComponent } from './daily-report-sale-admin.component';

describe('DailyReportSaleAdminComponent', () => {
  let component: DailyReportSaleAdminComponent;
  let fixture: ComponentFixture<DailyReportSaleAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportSaleAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportSaleAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
