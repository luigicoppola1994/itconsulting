import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

interface MenuItem {
  name: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  showSidebar: boolean = false;
  selectedMenuItem: MenuItem | null = null;

  menuItems: MenuItem[] = [
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkCurrentRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl === '/' || currentUrl === '/home') {
      this.showSidebar = false;
      this.selectedMenuItem = null;
    } else {
      const routePath = currentUrl.replace('/', '');
      const matchingItem = this.menuItems.find(item => item.link === routePath);
      
      if (matchingItem) {
        this.showSidebar = true;
        this.selectedMenuItem = matchingItem;
      }
    }
  }

  // Metodo semplificato - naviga solo alla home
  onBackToHome(): void {
    this.showSidebar = false;
    this.selectedMenuItem = null;
    this.router.navigate(['/']);
  }

  // Metodo rimosso - la sidebar non si chiude più
  // onCloseSidebar(): void { ... }
  // onToggleSidebar(): void { ... }
}