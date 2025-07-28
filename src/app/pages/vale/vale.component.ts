// vale.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: Date;
  image: string;
}

@Component({
  selector: 'app-vale',
  templateUrl: './vale.component.html',
  styleUrls: ['./vale.component.scss']
})
export class ValeComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  isScrolled = false;
  currentSection = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadBlogPosts();
    this.animateOnScroll();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
    this.updateCurrentSection();
  }

  loadBlogPosts(): void {
    // Simulazione caricamento blog posts
    // In produzione, questi dati verrebbero da un servizio
    this.blogPosts = [
      {
        id: 1,
        title: 'Sviluppatore Full Stack - Milano',
        excerpt: 'Cerchiamo uno sviluppatore Full Stack con esperienza in Angular e Node.js per un progetto innovativo nel settore fintech.',
        category: 'Offerta di Lavoro',
        date: new Date('2024-03-15'),
        image: '/assets/images/job1.jpg'
      },
      {
        id: 2,
        title: 'Corso Gratuito: React e TypeScript',
        excerpt: 'Partecipa al nostro corso intensivo di 3 settimane su React e TypeScript. Certificazione inclusa.',
        category: 'Formazione',
        date: new Date('2024-03-10'),
        image: '/assets/images/course1.jpg'
      },
      {
        id: 3,
        title: 'Data Scientist - Roma',
        excerpt: 'Opportunità per Data Scientist con competenze in Python, Machine Learning e Big Data.',
        category: 'Offerta di Lavoro',
        date: new Date('2024-03-08'),
        image: '/assets/images/job2.jpg'
      }
    ];
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Offset per header fisso
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openContactForm(): void {
    // Implementa apertura modale o navigazione a form di contatto
    // Per ora, navighiamo alla pagina contatti
    this.router.navigate(['/contatti']);
  }

  updateCurrentSection(): void {
    const sections = ['candidati', 'aziende'];
    const scrollPosition = window.scrollY + 100;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const { top, bottom } = element.getBoundingClientRect();
        if (top <= 100 && bottom >= 100) {
          this.currentSection = section;
          break;
        }
      }
    }
  }

  animateOnScroll(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
        }
      });
    }, options);

    // Osserva tutti gli elementi con classe animate-on-scroll
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));
  }

  // Metodi utility per gestione form (se necessario)
  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  handleFormSubmit(formData: any): void {
    // Gestione invio form
    console.log('Form submitted:', formData);
  }

  // Metodo per lazy loading immagini
  lazyLoadImage(imageSrc: string): string {
    // Implementazione lazy loading
    return imageSrc;
  }

  // Gestione errori
  handleError(error: any): void {
    console.error('Si è verificato un errore:', error);
    // Implementa notifica all'utente
  }

  // Tracking eventi (per analytics)
  trackEvent(eventName: string, eventData?: any): void {
    // Implementa tracking con Google Analytics o altro
    console.log('Event tracked:', eventName, eventData);
  }
}