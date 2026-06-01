import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCatalogTypeComponent } from './course-catalog-type.component';

describe('CourseCatalogTypeComponent', () => {
  let component: CourseCatalogTypeComponent;
  let fixture: ComponentFixture<CourseCatalogTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCatalogTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCatalogTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
