import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiErrorTypeComponent } from './kpi-error-type.component';

describe('KpiErrorTypeComponent', () => {
  let component: KpiErrorTypeComponent;
  let fixture: ComponentFixture<KpiErrorTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiErrorTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiErrorTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
