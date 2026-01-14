import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportLXCPComponent } from './daily-report-lxcp.component';

describe('DailyReportLXCPComponent', () => {
  let component: DailyReportLXCPComponent;
  let fixture: ComponentFixture<DailyReportLXCPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportLXCPComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportLXCPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
