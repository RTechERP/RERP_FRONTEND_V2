import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgChartRtcNewComponent } from './org-chart-rtc-new.component';

describe('OrgChartRtcNewComponent', () => {
  let component: OrgChartRtcNewComponent;
  let fixture: ComponentFixture<OrgChartRtcNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgChartRtcNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgChartRtcNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
