/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { TbProductRtcService } from './tb-product-rtc.service';

describe('Service: TbProductRtc', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TbProductRtcService]
    });
  });

  it('should ...', inject([TbProductRtcService], (service: TbProductRtcService) => {
    expect(service).toBeTruthy();
  }));
});
