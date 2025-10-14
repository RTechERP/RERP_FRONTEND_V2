/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TsAssetRecoveryService } from './ts-asset-recovery.service';

describe('Service: TsAssetRecovery', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TsAssetRecoveryService]
    });
  });

  it('should ...', inject([TsAssetRecoveryService], (service: TsAssetRecoveryService) => {
    expect(service).toBeTruthy();
  }));
});
