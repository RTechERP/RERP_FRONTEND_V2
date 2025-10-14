/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HolidayServiceService } from './holiday-service.service';

describe('Service: HolidayService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HolidayServiceService]
    });
  });

  it('should ...', inject([HolidayServiceService], (service: HolidayServiceService) => {
    expect(service).toBeTruthy();
  }));
});
