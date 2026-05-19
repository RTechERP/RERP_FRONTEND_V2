import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseEmployeeComponent } from './choose-employee.component';

describe('ChooseEmployeeComponent', () => {
  let component: ChooseEmployeeComponent;
  let fixture: ComponentFixture<ChooseEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
