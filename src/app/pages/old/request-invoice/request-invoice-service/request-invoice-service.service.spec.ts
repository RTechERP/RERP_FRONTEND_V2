import { TestBed } from '@angular/core/testing';

import { RequestInvoiceService } from './request-invoice-service.service';

describe('RequestInvoiceService', () => {
  let service: RequestInvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestInvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
