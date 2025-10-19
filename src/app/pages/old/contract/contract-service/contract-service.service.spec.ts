/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ContractServiceService } from './contract-service.service';

describe('Service: ContractService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContractServiceService]
    });
  });

  it('should ...', inject([ContractServiceService], (service: ContractServiceService) => {
    expect(service).toBeTruthy();
  }));
});
