import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeOnleavePersonComponent } from './employee-onleave-person.component';

describe('EmployeeOnleavePersonComponent', () => {
  let component: EmployeeOnleavePersonComponent;
  let fixture: ComponentFixture<EmployeeOnleavePersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeOnleavePersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeOnleavePersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
