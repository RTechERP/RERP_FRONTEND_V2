import { TestBed } from '@angular/core/testing';

import { TaxCompanyService } from './tax-company.service';

describe('TaxCompanyService', () => {
  let service: TaxCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxCompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
