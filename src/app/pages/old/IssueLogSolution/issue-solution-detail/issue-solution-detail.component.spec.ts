import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueSolutionDetailComponent } from './issue-solution-detail.component';

describe('IssueSolutionDetailComponent', () => {
  let component: IssueSolutionDetailComponent;
  let fixture: ComponentFixture<IssueSolutionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueSolutionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueSolutionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
