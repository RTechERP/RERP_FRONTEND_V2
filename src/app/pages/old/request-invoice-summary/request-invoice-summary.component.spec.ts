import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceSummaryComponent } from './request-invoice-summary.component';

describe('RequestInvoiceSummaryComponent', () => {
  let component: RequestInvoiceSummaryComponent;
  let fixture: ComponentFixture<RequestInvoiceSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
