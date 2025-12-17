import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarMain } from './navbar-main';

describe('NavbarMain', () => {
  let component: NavbarMain;
  let fixture: ComponentFixture<NavbarMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarMain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
