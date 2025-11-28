import { TestBed } from '@angular/core/testing';

import { RequestInvoiceStatusLinkService } from './request-invoice-status-link.service';

describe('RequestInvoiceStatusLinkService', () => {
  let service: RequestInvoiceStatusLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestInvoiceStatusLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
