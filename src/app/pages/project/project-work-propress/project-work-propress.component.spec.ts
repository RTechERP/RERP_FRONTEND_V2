import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkPropressComponent } from './project-work-propress.component';

describe('ProjectWorkPropressComponent', () => {
  let component: ProjectWorkPropressComponent;
  let fixture: ComponentFixture<ProjectWorkPropressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkPropressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkPropressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
