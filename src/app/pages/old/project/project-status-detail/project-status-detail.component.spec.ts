import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStatusDetailComponent } from './project-status-detail.component';

describe('ProjectStatusDetailComponent', () => {
  let component: ProjectStatusDetailComponent;
  let fixture: ComponentFixture<ProjectStatusDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectStatusDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectStatusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
