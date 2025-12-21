import { TestBed } from '@angular/core/testing';

import { AccountingContractService } from './accounting-contract.service';

describe('AccountingContractService', () => {
  let service: AccountingContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountingContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
