import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRtcQrCodeFormComponent } from './product-rtc-qr-code-form.component';

describe('ProductRtcQrCodeFormComponent', () => {
  let component: ProductRtcQrCodeFormComponent;
  let fixture: ComponentFixture<ProductRtcQrCodeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRtcQrCodeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRtcQrCodeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
