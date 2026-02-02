import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPICriteriaViewComponent } from './kpicriteria-view.component';

describe('KPICriteriaViewComponent', () => {
  let component: KPICriteriaViewComponent;
  let fixture: ComponentFixture<KPICriteriaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPICriteriaViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPICriteriaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
