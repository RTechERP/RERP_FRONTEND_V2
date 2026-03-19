import { TestBed } from '@angular/core/testing';

import { AccountingContractTypeMasterService } from './accounting-contract-type-master.service';

describe('AccountingContractTypeMasterService', () => {
  let service: AccountingContractTypeMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountingContractTypeMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
