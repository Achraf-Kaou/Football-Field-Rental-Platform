import { Component, signal, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerSidebar } from '../../common/manager-sidebar/manager-sidebar';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [ManagerSidebar, CommonModule],
  templateUrl: './manager-layout.html',
  styleUrl: './manager-layout.css',
})
export class ManagerLayout {
  @ViewChild(ManagerSidebar) sidebarComponent!: ManagerSidebar;
  
  isSidebarCollapsed = signal(false);
  isMobileView = signal(false);

  ngOnInit() {
    this.checkMobileView();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobileView();
  }

  private checkMobileView() {
    const isMobile = window.innerWidth <= 768;
    this.isMobileView.set(isMobile);
    
    // Auto-collapse on mobile
    if (isMobile && !this.isSidebarCollapsed()) {
      // Only auto-collapse if not explicitly opened by user
      this.isSidebarCollapsed.set(true);
    }
  }

  onSidebarCollapse(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }

  toggleSidebar() {
    // Toggle the sidebar state
    this.isSidebarCollapsed.update(collapsed => !collapsed);
    
    // If you have a reference to the sidebar component, you can call its toggle method
    if (this.sidebarComponent) {
      this.sidebarComponent.toggleCollapse();
    }
  }
}