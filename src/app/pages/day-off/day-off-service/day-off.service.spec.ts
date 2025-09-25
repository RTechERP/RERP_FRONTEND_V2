/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DayOffService } from './day-off.service';

describe('Service: DayOff', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DayOffService]
    });
  });

  it('should ...', inject([DayOffService], (service: DayOffService) => {
    expect(service).toBeTruthy();
  }));
});
