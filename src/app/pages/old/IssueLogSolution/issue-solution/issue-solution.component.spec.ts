import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueSolutionComponent } from './issue-solution.component';

describe('IssueSolutionComponent', () => {
  let component: IssueSolutionComponent;
  let fixture: ComponentFixture<IssueSolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueSolutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueSolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
