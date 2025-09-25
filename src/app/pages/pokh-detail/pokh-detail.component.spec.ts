import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokhDetailComponent } from './pokh-detail.component';

describe('PokhDetailComponent', () => {
  let component: PokhDetailComponent;
  let fixture: ComponentFixture<PokhDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
