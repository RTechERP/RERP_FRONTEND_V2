import { TestBed } from '@angular/core/testing';

import { ProductRtcQrCodeService } from './product-rtc-qr-code.service';

describe('ProductRtcQrCodeService', () => {
  let service: ProductRtcQrCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductRtcQrCodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
