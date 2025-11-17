import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgvProductComponent } from './agv-product.component';

describe('AgvProductComponent', () => {
  let component: AgvProductComponent;
  let fixture: ComponentFixture<AgvProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgvProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgvProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
