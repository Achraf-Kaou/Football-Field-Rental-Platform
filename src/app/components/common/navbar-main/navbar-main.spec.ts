import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarMain } from './navbar-main';
import { TranslateModule } from '@ngx-translate/core';

describe('NavbarMain', () => {
  let component: NavbarMain;
  let fixture: ComponentFixture<NavbarMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarMain, TranslateModule.forRoot()]
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
