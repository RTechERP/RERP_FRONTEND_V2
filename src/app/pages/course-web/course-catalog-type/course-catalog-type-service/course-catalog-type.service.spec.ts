import { TestBed } from '@angular/core/testing';

import { CourseCatalogTypeService } from './course-catalog-type.service';

describe('CourseCatalogTypeService', () => {
  let service: CourseCatalogTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseCatalogTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
