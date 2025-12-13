import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryEmployeeComponent } from './summary-employee.component';

describe('SummaryEmployeeComponent', () => {
  let component: SummaryEmployeeComponent;
  let fixture: ComponentFixture<SummaryEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
