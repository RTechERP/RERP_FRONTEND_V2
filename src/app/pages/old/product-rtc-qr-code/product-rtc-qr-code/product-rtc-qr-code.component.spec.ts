import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRtcQrCodeComponent } from './product-rtc-qr-code.component';

describe('ProductRtcQrCodeComponent', () => {
  let component: ProductRtcQrCodeComponent;
  let fixture: ComponentFixture<ProductRtcQrCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRtcQrCodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRtcQrCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
