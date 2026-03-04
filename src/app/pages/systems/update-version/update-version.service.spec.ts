import { TestBed } from '@angular/core/testing';

import { UpdateVersionService } from './update-version.service';

describe('UpdateVersionService', () => {
  let service: UpdateVersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateVersionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
