/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { FilmManagementService } from './film-management.service';

describe('Service: FilmManagement', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilmManagementService]
    });
  });

  it('should ...', inject([FilmManagementService], (service: FilmManagementService) => {
    expect(service).toBeTruthy();
  }));
});
