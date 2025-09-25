import { TestBed } from '@angular/core/testing';

import { RequestInvoiceDetailServiceService } from './request-invoice-detail-service.service';

describe('RequestInvoiceDetailServiceService', () => {
  let service: RequestInvoiceDetailServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestInvoiceDetailServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
