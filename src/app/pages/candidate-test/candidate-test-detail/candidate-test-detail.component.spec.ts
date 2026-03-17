import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateTestDetailComponent } from './candidate-test-detail.component';

describe('CandidateTestDetailComponent', () => {
  let component: CandidateTestDetailComponent;
  let fixture: ComponentFixture<CandidateTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateTestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
