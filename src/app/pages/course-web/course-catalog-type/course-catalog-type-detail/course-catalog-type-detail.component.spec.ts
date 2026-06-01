import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCatalogTypeDetailComponent } from './course-catalog-type-detail.component';

describe('CourseCatalogTypeDetailComponent', () => {
  let component: CourseCatalogTypeDetailComponent;
  let fixture: ComponentFixture<CourseCatalogTypeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCatalogTypeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCatalogTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
