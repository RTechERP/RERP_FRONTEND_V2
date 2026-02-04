import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendSupplierComponent } from './recommend-supplier.component';

describe('RecommendSupplierComponent', () => {
  let component: RecommendSupplierComponent;
  let fixture: ComponentFixture<RecommendSupplierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendSupplierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendSupplierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
