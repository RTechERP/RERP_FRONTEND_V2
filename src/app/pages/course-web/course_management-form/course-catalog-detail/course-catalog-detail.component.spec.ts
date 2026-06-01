import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCatalogDetailComponent } from './course-catalog-detail.component';

describe('CourseCatalogDetailComponent', () => {
  let component: CourseCatalogDetailComponent;
  let fixture: ComponentFixture<CourseCatalogDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCatalogDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCatalogDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
