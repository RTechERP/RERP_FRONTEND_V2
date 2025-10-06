import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectMachinePriceComponent } from './project-machine-price.component';

describe('ProjectMachinePriceComponent', () => {
  let component: ProjectMachinePriceComponent;
  let fixture: ComponentFixture<ProjectMachinePriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectMachinePriceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectMachinePriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
