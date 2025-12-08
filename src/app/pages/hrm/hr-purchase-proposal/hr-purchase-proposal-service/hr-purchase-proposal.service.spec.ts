import { TestBed } from '@angular/core/testing';

import { HrPurchaseProposalService } from './hr-purchase-proposal.service';

describe('HrPurchaseProposalService', () => {
  let service: HrPurchaseProposalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HrPurchaseProposalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
