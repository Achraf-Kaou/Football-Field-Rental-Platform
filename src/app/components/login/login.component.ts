import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode = signal<'login' | 'signup'>('login');

  email = signal<string>('');
  password = signal<string>('');
  name = signal<string>('');
  phone = signal<string>('');

  handleSignup(){
    console.log("handleSignup")
  }

  handleLogin(){
    console.timeLog("handleLogin")
  }

  reset(){
    this.email.update(()=> '')
    this.password.update(()=> '')
    
  }

}
