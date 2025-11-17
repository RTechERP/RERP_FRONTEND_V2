import { TestBed } from '@angular/core/testing';

import { PoRequestPriceRtcService } from './po-request-price-rtc.service';

describe('PoRequestPriceRtcService', () => {
  let service: PoRequestPriceRtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoRequestPriceRtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
