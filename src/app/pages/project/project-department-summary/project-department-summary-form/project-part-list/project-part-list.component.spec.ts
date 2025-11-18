import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartListComponent } from './project-part-list.component';

describe('ProjectPartListComponent', () => {
  let component: ProjectPartListComponent;
  let fixture: ComponentFixture<ProjectPartListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
