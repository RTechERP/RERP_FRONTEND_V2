import { TestBed } from '@angular/core/testing';

import { CustomerMajorService } from './customer-major.service';

describe('CustomerMajorService', () => {
  let service: CustomerMajorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerMajorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
