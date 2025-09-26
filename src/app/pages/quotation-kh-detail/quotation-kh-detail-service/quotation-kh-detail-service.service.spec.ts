import { TestBed } from '@angular/core/testing';

import { QuotationKhDetailServiceService } from './quotation-kh-detail-service.service';

describe('QuotationKhDetailServiceService', () => {
  let service: QuotationKhDetailServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotationKhDetailServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
