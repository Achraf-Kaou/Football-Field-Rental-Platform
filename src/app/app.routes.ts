import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { Home } from './components/home/home';
import { Fields } from './components/fields/fields';
import { Booking } from './components/booking/booking';
import { UserBookings } from './components/bookings-user/bookings-user';
import { Chat } from './components/chat/chat';
import { ManagerSidebar } from './components/common/manager-sidebar/manager-sidebar';
/* import { AuthCallbackComponent } from './components/common/auth-callback/auth-callback';
 */
export const routes: Routes = [
    {
        path: '',
        component: MainComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        path: 'home',
        component: Home
    },
    {
        path: 'fields',
        component: Fields
    },
    {
        path: 'booking',
        component: Booking
    },
    {
        path: 'user-bookings',
        component: UserBookings
    },
    {
        path: 'chat',
        component: Chat
    },
    {
        path: 'manager-sidebar',
        component: ManagerSidebar
    },
/*     { path: 'auth/callback', component: AuthCallbackComponent },
 */];
