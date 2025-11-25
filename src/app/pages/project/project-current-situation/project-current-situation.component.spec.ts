import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCurrentSituationComponent } from './project-current-situation.component';

describe('ProjectCurrentSituationComponent', () => {
  let component: ProjectCurrentSituationComponent;
  let fixture: ComponentFixture<ProjectCurrentSituationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCurrentSituationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCurrentSituationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
