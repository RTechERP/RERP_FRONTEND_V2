/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PositionServiceService } from './position-service.service';

describe('Service: PositionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PositionServiceService]
    });
  });

  it('should ...', inject([PositionServiceService], (service: PositionServiceService) => {
    expect(service).toBeTruthy();
  }));
});
