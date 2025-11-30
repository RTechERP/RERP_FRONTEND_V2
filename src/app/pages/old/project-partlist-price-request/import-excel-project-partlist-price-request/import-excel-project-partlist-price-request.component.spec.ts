import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelProjectPartlistPriceRequestComponent } from './import-excel-project-partlist-price-request.component';

describe('ImportExcelProjectPartlistPriceRequestComponent', () => {
  let component: ImportExcelProjectPartlistPriceRequestComponent;
  let fixture: ComponentFixture<ImportExcelProjectPartlistPriceRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelProjectPartlistPriceRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelProjectPartlistPriceRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
