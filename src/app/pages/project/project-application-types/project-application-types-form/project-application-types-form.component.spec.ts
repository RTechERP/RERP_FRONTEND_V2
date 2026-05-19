import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectApplicationTypesFormComponent } from './project-application-types-form.component';

describe('ProjectApplicationTypesFormComponent', () => {
  let component: ProjectApplicationTypesFormComponent;
  let fixture: ComponentFixture<ProjectApplicationTypesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectApplicationTypesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectApplicationTypesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
