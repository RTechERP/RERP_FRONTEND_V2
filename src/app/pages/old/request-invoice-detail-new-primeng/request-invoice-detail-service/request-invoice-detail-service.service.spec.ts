import { TestBed } from '@angular/core/testing';

import { RequestInvoiceDetailService } from './request-invoice-detail-service.service';

describe('RequestInvoiceDetailService', () => {
  let service: RequestInvoiceDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestInvoiceDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
