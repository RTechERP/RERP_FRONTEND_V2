import { TestBed } from '@angular/core/testing';

import { HistoryMoneyService } from './history-money.service';

describe('HistoryMoneyService', () => {
  let service: HistoryMoneyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryMoneyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
