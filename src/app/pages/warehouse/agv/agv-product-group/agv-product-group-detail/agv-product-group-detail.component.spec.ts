import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgvProductGroupDetailComponent } from './agv-product-group-detail.component';

describe('AgvProductGroupDetailComponent', () => {
  let component: AgvProductGroupDetailComponent;
  let fixture: ComponentFixture<AgvProductGroupDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgvProductGroupDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgvProductGroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
