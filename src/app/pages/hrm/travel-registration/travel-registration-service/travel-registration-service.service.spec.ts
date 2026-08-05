import { TestBed } from '@angular/core/testing';

import { TravelRegistrationServiceService } from './travel-registration-service.service';

describe('TravelRegistrationServiceService', () => {
  let service: TravelRegistrationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TravelRegistrationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
