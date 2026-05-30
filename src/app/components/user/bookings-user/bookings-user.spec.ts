import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingsUser } from './bookings-user';

describe('BookingsUser', () => {
  let component: BookingsUser;
  let fixture: ComponentFixture<BookingsUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingsUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
