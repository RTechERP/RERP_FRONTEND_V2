import { TestBed } from '@angular/core/testing';

import { CommercialPriceRequestServiceService } from './commercial-price-request-service.service';

describe('CommercialPriceRequestServiceService', () => {
  let service: CommercialPriceRequestServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommercialPriceRequestServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
