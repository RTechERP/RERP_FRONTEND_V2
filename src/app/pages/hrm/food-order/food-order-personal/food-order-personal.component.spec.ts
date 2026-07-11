import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodOrderPersonalComponent } from './food-order-personal.component';

describe('FoodOrderPersonalComponent', () => {
  let component: FoodOrderPersonalComponent;
  let fixture: ComponentFixture<FoodOrderPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodOrderPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodOrderPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
