import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from "./components/login/login.component";
import { NavBarComponent } from "./components/common/navbar/navbar.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginComponent, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
