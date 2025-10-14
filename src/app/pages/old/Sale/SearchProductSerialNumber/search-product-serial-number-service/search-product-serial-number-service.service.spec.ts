import { TestBed } from '@angular/core/testing';

import { SearchProductSerialNumberServiceService } from './search-product-serial-number-service.service';

describe('SearchProductSerialNumberServiceService', () => {
  let service: SearchProductSerialNumberServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchProductSerialNumberServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
