/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OverTimeService } from './over-time.service';

describe('Service: OverTime', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OverTimeService]
    });
  });

  it('should ...', inject([OverTimeService], (service: OverTimeService) => {
    expect(service).toBeTruthy();
  }));
});
