import { TestBed } from '@angular/core/testing';

import { RegisterContractService } from './register-contract.service';

describe('RegisterContractService', () => {
  let service: RegisterContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegisterContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
