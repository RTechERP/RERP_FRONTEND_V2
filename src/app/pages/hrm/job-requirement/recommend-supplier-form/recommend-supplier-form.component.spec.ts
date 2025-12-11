import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendSupplierFormComponent } from './recommend-supplier-form.component';

describe('RecommendSupplierFormComponent', () => {
  let component: RecommendSupplierFormComponent;
  let fixture: ComponentFixture<RecommendSupplierFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendSupplierFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendSupplierFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
