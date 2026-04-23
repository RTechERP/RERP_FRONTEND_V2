import { TestBed } from '@angular/core/testing';

import { CustomerIndustryService } from './customer-industry.service';

describe('CustomerIndustryService', () => {
  let service: CustomerIndustryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerIndustryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
