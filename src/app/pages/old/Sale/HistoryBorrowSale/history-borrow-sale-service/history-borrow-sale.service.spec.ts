import { TestBed } from '@angular/core/testing';

import { HistoryBorrowSaleService } from './history-borrow-sale.service';

describe('HistoryBorrowSaleService', () => {
  let service: HistoryBorrowSaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryBorrowSaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
