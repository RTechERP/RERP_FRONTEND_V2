import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiSyntheticYearsComponent } from './kpi-synthetic-years.component';

describe('KpiSyntheticYearsComponent', () => {
  let component: KpiSyntheticYearsComponent;
  let fixture: ComponentFixture<KpiSyntheticYearsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiSyntheticYearsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiSyntheticYearsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
