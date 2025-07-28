import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';

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
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen: boolean = true;
  @Input() selectedItem: MenuItem | null = null;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() backToHome = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  
  isEntering: boolean = false;
  private destroy$ = new Subject<void>();
  private hasAnimated: boolean = false;
  
  menuItems: MenuItem[] = [
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Anima solo la prima volta che la sidebar si apre
    if (this.isOpen && !this.hasAnimated) {
      this.triggerEnterAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Anima solo quando isOpen cambia da false a true, non per altri cambiamenti
    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue && !this.hasAnimated) {
      this.triggerEnterAnimation();
    }
    
    // Se selectedItem cambia, NON rianimare la sidebar
    // L'animazione dovrebbe avvenire solo quando la sidebar si apre/chiude
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerEnterAnimation(): void {
    this.isEntering = true;
    this.hasAnimated = true;
    
    setTimeout(() => {
      this.isEntering = false;
    }, 400);
  }

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