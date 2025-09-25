import { TestBed } from '@angular/core/testing';

import { ListProductProjectService } from './list-product-project.service';

describe('ListProductProjectService', () => {
  let service: ListProductProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListProductProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
