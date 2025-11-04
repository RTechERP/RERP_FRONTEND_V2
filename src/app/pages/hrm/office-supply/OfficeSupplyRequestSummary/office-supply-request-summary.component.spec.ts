import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestSummaryComponent } from './office-supply-request-summary.component';

describe('OfficeSupplyRequestSummaryComponent', () => {
  let component: OfficeSupplyRequestSummaryComponent;
  let fixture: ComponentFixture<OfficeSupplyRequestSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyRequestSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyRequestSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
