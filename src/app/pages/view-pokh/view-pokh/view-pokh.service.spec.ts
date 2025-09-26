import { TestBed } from '@angular/core/testing';

import { ViewPokhService } from './view-pokh.service';

describe('ViewPokhService', () => {
  let service: ViewPokhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewPokhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
