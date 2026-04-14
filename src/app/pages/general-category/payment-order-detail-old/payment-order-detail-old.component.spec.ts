import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentOrderDetailOldComponent } from './payment-order-detail-old.component';

describe('PaymentOrderDetailOldComponent', () => {
  let component: PaymentOrderDetailOldComponent;
  let fixture: ComponentFixture<PaymentOrderDetailOldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentOrderDetailOldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentOrderDetailOldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
