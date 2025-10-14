import { TestBed } from '@angular/core/testing';

import { TradePriceService } from './trade-price.service';

describe('TradePriceService', () => {
  let service: TradePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
