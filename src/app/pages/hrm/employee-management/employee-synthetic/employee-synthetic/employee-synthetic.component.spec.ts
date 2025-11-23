import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSyntheticComponent } from './employee-synthetic.component';

describe('EmployeeSyntheticComponent', () => {
  let component: EmployeeSyntheticComponent;
  let fixture: ComponentFixture<EmployeeSyntheticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSyntheticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeSyntheticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
