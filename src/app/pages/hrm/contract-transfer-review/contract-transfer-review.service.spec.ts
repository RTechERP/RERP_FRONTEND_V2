import { TestBed } from '@angular/core/testing';

import { ContractTransferReviewService } from './contract-transfer-review.service';

describe('ContractTransferReviewService', () => {
  let service: ContractTransferReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContractTransferReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
