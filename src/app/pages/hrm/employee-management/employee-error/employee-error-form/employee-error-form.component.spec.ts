import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeErrorFormComponent } from './employee-error-form.component';

describe('EmployeeErrorFormComponent', () => {
  let component: EmployeeErrorFormComponent;
  let fixture: ComponentFixture<EmployeeErrorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeErrorFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeErrorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
