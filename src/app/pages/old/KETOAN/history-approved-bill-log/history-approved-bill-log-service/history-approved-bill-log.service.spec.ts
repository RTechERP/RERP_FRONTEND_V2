import { TestBed } from '@angular/core/testing';

import { HistoryApprovedBillLogService } from './history-approved-bill-log.service';

describe('HistoryApprovedBillLogService', () => {
  let service: HistoryApprovedBillLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryApprovedBillLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
