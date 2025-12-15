import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRtcPurchaseRequestComponent } from './product-rtc-purchase-request.component';

describe('ProductRtcPurchaseRequestComponent', () => {
  let component: ProductRtcPurchaseRequestComponent;
  let fixture: ComponentFixture<ProductRtcPurchaseRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRtcPurchaseRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRtcPurchaseRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
