import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceDetailNewPrimengComponent } from './request-invoice-detail-new-primeng.component';

describe('RequestInvoiceDetailNewPrimengComponent', () => {
  let component: RequestInvoiceDetailNewPrimengComponent;
  let fixture: ComponentFixture<RequestInvoiceDetailNewPrimengComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceDetailNewPrimengComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceDetailNewPrimengComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
