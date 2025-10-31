/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { TeamServiceService } from './team-service.service';

describe('Service: TeamService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TeamServiceService]
    });
  });

  it('should ...', inject([TeamServiceService], (service: TeamServiceService) => {
    expect(service).toBeTruthy();
  }));
});
