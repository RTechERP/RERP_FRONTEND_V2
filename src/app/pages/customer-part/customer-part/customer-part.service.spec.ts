import { TestBed } from '@angular/core/testing';

import { CustomerPartService } from './customer-part.service';

describe('CustomerPartService', () => {
  let service: CustomerPartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerPartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
