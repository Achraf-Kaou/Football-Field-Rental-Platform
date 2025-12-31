import { Component, signal } from '@angular/core';
import { ManagerSidebar } from '../../common/manager-sidebar/manager-sidebar';

@Component({
  selector: 'app-manager-layout',
  imports: [ManagerSidebar],
  templateUrl: './manager-layout.html',
  styleUrl: './manager-layout.css',
})
export class ManagerLayout {
  isSidebarCollapsed = signal(false);

  onSidebarCollapse(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }
}
