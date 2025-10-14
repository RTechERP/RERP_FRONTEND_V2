import { TestBed } from '@angular/core/testing';

import { QuotationSaleService } from './quotation-sale.service';

describe('QuotationSaleService', () => {
  let service: QuotationSaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotationSaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
