import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchProductSerialNumberComponent } from './search-product-serial-number.component';

describe('SearchProductSerialNumberComponent', () => {
  let component: SearchProductSerialNumberComponent;
  let fixture: ComponentFixture<SearchProductSerialNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchProductSerialNumberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchProductSerialNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
