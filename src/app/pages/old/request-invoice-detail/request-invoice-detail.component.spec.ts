import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceDetailComponent } from './request-invoice-detail.component';

describe('RequestInvoiceDetailComponent', () => {
  let component: RequestInvoiceDetailComponent;
  let fixture: ComponentFixture<RequestInvoiceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
