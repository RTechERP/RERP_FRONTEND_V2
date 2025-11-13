import { TestBed } from '@angular/core/testing';

import { FilmManagementService } from './film-management.service';

describe('FilmManagementService', () => {
  let service: FilmManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilmManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
