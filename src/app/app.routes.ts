import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { DashboardComponent } from './components/manager/dashboard/dashboard.component';
import { Home } from './components/user/home/home';
import { Fields } from './components/user/fields/fields';
import { BookingComponent } from './components/user/booking/booking';
import { UserBookings } from './components/user/bookings-user/bookings-user';
import { Chat } from './components/chat/chat';
import { ManagerSidebar } from './components/common/manager-sidebar/manager-sidebar';
import { DeleteModal } from './components/ui/delete-modal/delete-modal';
import { ComplexForm } from './components/manager/complex-form/complex-form';
import { ComplexOverview } from './components/manager/complex-overview/complex-overview';
import { FieldForm } from './components/manager/field-form/field-form';
import { FieldAvailability } from './components/manager/field-availability/field-availability';
import { ManagerBooking } from './components/manager/manager-booking/manager-booking';
import { ComplexList } from './components/manager/complex-list/complex-list';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard, UserRole } from './guards/role.guard';
import { Unauthorized } from './components/common/unauthorized/unauthorized';

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
    path: 'unauthorized',
    component: Unauthorized
  },
  {
    path: 'user',
    component: Home,
    title: 'home',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'user/fields',
    component: Fields,
    title: 'fields list',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'user/booking/:idField',
    component: BookingComponent,
    title: 'book a field',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'user/user-bookings',
    component: UserBookings,
    title: 'my bookings',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'user/chat',
    component: Chat,
    title: 'chat',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager',
    component: DashboardComponent,
    title: 'dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex/new',
    component: ComplexForm,
    title: 'new complex',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex/:id',
    component: ComplexOverview,
    title: 'complex overview',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex/:id/edit',
    component: ComplexForm,
    title: 'edit complex',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex/:complexId/field/new',
    component: FieldForm,
    title: 'new field',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex/:complexId/field/:fieldId/edit',
    component: FieldForm,
    title: 'edit field',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/field-availability/:id',
    component: FieldAvailability,
    title: 'field availability',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/manager-booking/:complexId',
    component: ManagerBooking,
    title: 'manager booking',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'manager/complex-list',
    component: ComplexList,
    title: 'complex list',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.MANAGER, UserRole.ADMIN] }
  },
  {
    path: 'chat',
    component: Chat,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN] }
  }

  /*     { path: 'auth/callback', component: AuthCallbackComponent },
   */
];