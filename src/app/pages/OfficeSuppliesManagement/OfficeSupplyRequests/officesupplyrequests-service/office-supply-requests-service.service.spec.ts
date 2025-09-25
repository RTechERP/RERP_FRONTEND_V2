import { TestBed } from '@angular/core/testing';

import {DangkyvppServiceService} from './office-supply-requests-service.service';

describe('DangkyvppServiceService', () => {
  let service: DangkyvppServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DangkyvppServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
