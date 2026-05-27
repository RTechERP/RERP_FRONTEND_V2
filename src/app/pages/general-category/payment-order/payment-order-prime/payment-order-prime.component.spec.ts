import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentOrderPrimeComponent } from './payment-order-prime.component';

describe('PaymentOrderPrimeComponent', () => {
  let component: PaymentOrderPrimeComponent;
  let fixture: ComponentFixture<PaymentOrderPrimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentOrderPrimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentOrderPrimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
