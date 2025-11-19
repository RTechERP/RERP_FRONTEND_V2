import { TestBed } from '@angular/core/testing';

import { ProtectgearService } from './protectgear.service';

describe('ProtectgearService', () => {
  let service: ProtectgearService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProtectgearService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
