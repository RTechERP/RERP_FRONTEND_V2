import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReportLxDetailComponent } from './daily-report-lx-detail.component';

describe('DailyReportLxDetailComponent', () => {
  let component: DailyReportLxDetailComponent;
  let fixture: ComponentFixture<DailyReportLxDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReportLxDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReportLxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
