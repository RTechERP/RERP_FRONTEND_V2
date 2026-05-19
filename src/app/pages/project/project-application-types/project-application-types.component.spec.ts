import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectApplicationTypesComponent } from './project-application-types.component';

describe('ProjectApplicationTypesComponent', () => {
  let component: ProjectApplicationTypesComponent;
  let fixture: ComponentFixture<ProjectApplicationTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectApplicationTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectApplicationTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
