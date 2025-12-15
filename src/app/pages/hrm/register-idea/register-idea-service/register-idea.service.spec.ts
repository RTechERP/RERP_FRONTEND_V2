import { TestBed } from '@angular/core/testing';

import { RegisterIdeaService } from './register-idea.service';

describe('RegisterIdeaService', () => {
  let service: RegisterIdeaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegisterIdeaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
