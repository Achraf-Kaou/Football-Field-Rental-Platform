import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { DashboardComponent } from './components/manager/dashboard/dashboard.component';
import { Home } from './components/user/home/home';
import { Fields } from './components/user/fields/fields';
import { Booking } from './components/user/booking/booking';
import { UserBookings } from './components/user/bookings-user/bookings-user';
import { Chat } from './components/chat/chat';
import { ManagerSidebar } from './components/common/manager-sidebar/manager-sidebar';
import { DeleteModal } from './components/ui/delete-modal/delete-modal';
import { ComplexForm } from './components/manager/complex-form/complex-form';
import { AddComplex } from './components/manager/add-complex/add-complex';
import { ComplexOverview } from './components/manager/complex-overview/complex-overview';
import { FieldForm } from './components/manager/field-form/field-form';
import { FieldAvailability } from './components/manager/field-availability/field-availability';
import { ManagerBooking } from './components/manager/manager-booking/manager-booking';
import { ComplexList } from './components/manager/complex-list/complex-list';
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
        path: 'user',
        component: Home,
        title: 'home',
        children: [
            {
                path: 'fields',
                component: Fields,
                title: 'fields list'
            },
            {
                path: 'booking',
                component: Booking,
                title: 'book a field'
            },
            {
                path: 'user-bookings',
                component: UserBookings,
                title: 'my bookings'
            },
            {
                path: 'chat',
                component: Chat,
                title: 'chat'
            },
        ]
    },
    {
        path: 'manager',
        component: DashboardComponent,
        title: 'dashboard',
    },
    {
        path: 'manager/complex',
        component: ComplexOverview,
        title: 'complex overview',
    },
    {
        path: 'manager/complex/new',
        component: AddComplex,
        title: 'new complex'
    },
    {
        path: 'manager/complex/:id',
        component: AddComplex,
        title: 'edit complex'
    },
    {
        path: 'manager/field-form',
        component: FieldForm,
        title: 'field form'
    },
    {
        path: 'manager/field-availability',
        component: FieldAvailability,
        title: 'field availability'
    },
    {
        path: 'manager/manager-booking',
        component: ManagerBooking,
        title: 'manager booking'
    },
    {
        path: 'manager/complex-list',
        component: ComplexList,
        title: 'complex list'
    },
    {
        path: 'chat',
        component: Chat
    },

/*     { path: 'auth/callback', component: AuthCallbackComponent },
 */];
