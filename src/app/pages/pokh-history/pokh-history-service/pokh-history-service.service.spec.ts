import { TestBed } from '@angular/core/testing';

import { PokhHistoryServiceService } from './pokh-history-service.service';

describe('PokhHistoryServiceService', () => {
  let service: PokhHistoryServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokhHistoryServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
