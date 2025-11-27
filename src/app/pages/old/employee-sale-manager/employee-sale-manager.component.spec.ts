import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSaleManagerComponent } from './employee-sale-manager.component';

describe('EmployeeSaleManagerComponent', () => {
  let component: EmployeeSaleManagerComponent;
  let fixture: ComponentFixture<EmployeeSaleManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeSaleManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeSaleManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
