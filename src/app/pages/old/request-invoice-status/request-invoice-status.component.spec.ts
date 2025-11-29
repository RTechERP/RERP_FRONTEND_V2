import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceStatusComponent } from './request-invoice-status.component';

describe('RequestInvoiceStatusComponent', () => {
  let component: RequestInvoiceStatusComponent;
  let fixture: ComponentFixture<RequestInvoiceStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
