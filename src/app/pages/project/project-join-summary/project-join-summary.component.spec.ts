import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectJoinSummaryComponent } from './project-join-summary.component';

describe('ProjectJoinSummaryComponent', () => {
  let component: ProjectJoinSummaryComponent;
  let fixture: ComponentFixture<ProjectJoinSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectJoinSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectJoinSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
