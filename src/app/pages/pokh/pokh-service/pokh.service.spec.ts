import { TestBed } from '@angular/core/testing';

import { PokhService } from './pokh.service';

describe('PokhService', () => {
  let service: PokhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
