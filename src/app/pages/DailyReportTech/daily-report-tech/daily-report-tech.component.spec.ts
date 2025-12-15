import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportTechComponent } from './daily-report-tech.component';

describe('DailyReportTechComponent', () => {
  let component: DailyReportTechComponent;
  let fixture: ComponentFixture<DailyReportTechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportTechComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
