import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRtcQrCodeImportExcelComponent } from './product-rtc-qr-code-import-excel.component';

describe('ProductRtcQrCodeImportExcelComponent', () => {
  let component: ProductRtcQrCodeImportExcelComponent;
  let fixture: ComponentFixture<ProductRtcQrCodeImportExcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRtcQrCodeImportExcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRtcQrCodeImportExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

