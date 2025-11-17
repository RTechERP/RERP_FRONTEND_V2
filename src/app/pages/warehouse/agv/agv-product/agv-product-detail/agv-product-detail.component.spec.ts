import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgvProductDetailComponent } from './agv-product-detail.component';

describe('AgvProductDetailComponent', () => {
  let component: AgvProductDetailComponent;
  let fixture: ComponentFixture<AgvProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgvProductDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgvProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
