import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokhDetailSlickgridComponent } from './pokh-detail-slickgrid.component';

describe('PokhDetailSlickgridComponent', () => {
  let component: PokhDetailSlickgridComponent;
  let fixture: ComponentFixture<PokhDetailSlickgridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhDetailSlickgridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhDetailSlickgridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
