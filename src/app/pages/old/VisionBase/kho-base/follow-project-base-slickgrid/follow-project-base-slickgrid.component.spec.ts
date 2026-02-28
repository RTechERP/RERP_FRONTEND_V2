import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FollowProjectBaseSlickgridComponent } from './follow-project-base-slickgrid.component';

describe('FollowProjectBaseSlickgridComponent', () => {
    let component: FollowProjectBaseSlickgridComponent;
    let fixture: ComponentFixture<FollowProjectBaseSlickgridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FollowProjectBaseSlickgridComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FollowProjectBaseSlickgridComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
