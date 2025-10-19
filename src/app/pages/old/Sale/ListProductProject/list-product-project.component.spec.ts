import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListProductProjectComponent } from './list-product-project.component';

describe('ListProductProjectComponent', () => {
  let component: ListProductProjectComponent;
  let fixture: ComponentFixture<ListProductProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListProductProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListProductProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
