import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralCategoryComponent } from './general-category.component';

describe('GeneralCategoryComponent', () => {
  let component: GeneralCategoryComponent;
  let fixture: ComponentFixture<GeneralCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
