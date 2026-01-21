import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiCriteriaComponent } from './kpi-criteria.component';

describe('KpiCriteriaComponent', () => {
  let component: KpiCriteriaComponent;
  let fixture: ComponentFixture<KpiCriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCriteriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
