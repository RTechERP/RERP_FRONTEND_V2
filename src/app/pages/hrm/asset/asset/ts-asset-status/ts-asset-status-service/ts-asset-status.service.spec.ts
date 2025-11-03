/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TsAssetStatusService } from './ts-asset-status.service';

describe('Service: TsAssetStatus', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TsAssetStatusService]
    });
  });

  it('should ...', inject([TsAssetStatusService], (service: TsAssetStatusService) => {
    expect(service).toBeTruthy();
  }));
});
