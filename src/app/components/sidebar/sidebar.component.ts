import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface MenuItem {
  name: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;
  @Input() selectedItem: MenuItem | null = null;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() backToHome = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  constructor(private router: Router) {}

  onItemClick(item: MenuItem): void {
    this.router.navigate([item.link]);
  }

  onCloseSidebar(): void {
    this.closeSidebar.emit();
  }

  onBackToHome(): void {
    this.backToHome.emit();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}