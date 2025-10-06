import { TestBed } from '@angular/core/testing';

import { QuotationKhServicesService } from './quotation-kh-services.service';

describe('QuotationKhServicesService', () => {
  let service: QuotationKhServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotationKhServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
