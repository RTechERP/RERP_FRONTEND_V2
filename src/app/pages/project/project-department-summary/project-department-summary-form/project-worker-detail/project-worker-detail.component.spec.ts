import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkerDetailComponent } from './project-worker-detail.component';

describe('ProjectWorkerDetailComponent', () => {
  let component: ProjectWorkerDetailComponent;
  let fixture: ComponentFixture<ProjectWorkerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkerDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
