/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EarlyLateService } from './early-late.service';

describe('Service: EarlyLate', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EarlyLateService]
    });
  });

  it('should ...', inject([EarlyLateService], (service: EarlyLateService) => {
    expect(service).toBeTruthy();
  }));
});
