import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIAGVCriteriaViewComponent } from './kpicriteria-view.component';

describe('KPIAGVCriteriaViewComponent', () => {
  let component: KPIAGVCriteriaViewComponent;
  let fixture: ComponentFixture<KPIAGVCriteriaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIAGVCriteriaViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIAGVCriteriaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

