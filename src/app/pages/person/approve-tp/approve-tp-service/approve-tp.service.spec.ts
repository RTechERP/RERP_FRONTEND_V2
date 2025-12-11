import { TestBed } from '@angular/core/testing';

import { ApproveTpService } from './approve-tp.service';

describe('ApproveTpService', () => {
  let service: ApproveTpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApproveTpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
