import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkerSyntheticComponent } from './project-worker-synthetic.component';

describe('ProjectWorkerSyntheticComponent', () => {
  let component: ProjectWorkerSyntheticComponent;
  let fixture: ComponentFixture<ProjectWorkerSyntheticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkerSyntheticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkerSyntheticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
