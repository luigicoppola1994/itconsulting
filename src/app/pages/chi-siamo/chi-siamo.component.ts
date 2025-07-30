// chi-siamo.component.ts
import { Component, OnInit } from '@angular/core';

interface Statistic {
  number: string;
  label: string;
  description: string;
}

interface Value {
  icon: string;
  title: string;
  description: string;
}

interface ProcessoHR {
  icon: string;
  title: string;
  description: string;
}

interface ServizioPersonalizzato {
  icon: string;
  title: string;
  description: string;
}

interface FinancialYear {
  year: number;
  amount: string;
  description: string;
}

@Component({
  selector: 'app-chi-siamo',
  templateUrl: './chi-siamo.component.html',
  styleUrls: ['./chi-siamo.component.scss']
})
export class ChiSiamoComponent implements OnInit {

  showAdditionalContent: boolean = false;

  // Statistics data matching the image
  statistics: Statistic[] = [
    {
      number: '48',
      label: 'OFFERTE DI LAVORO ATTIVE',
      description: 'Ogni giorno pubblichiamo nuove offerte di lavoro nel settore IT; vieni a scoprire le nostre offerte.'
    },
    {
      number: '80',
      label: 'CLIENTI SODDISFATTI',
      description: 'La soddisfazione del cliente è il nostro maggior vanto. Offriamo servizi di consulenza professionale sulle principali tecnologie software.'
    },
    {
      number: '20,000',
      label: 'CANDIDATURE',
      description: 'Un archivio con 20 anni di storia del recruiting con più di 20\'000 candidature di successo e tante ancora in corso'
    }
  ];

  // Company values
  values: Value[] = [
    {
      icon: 'fas fa-star',
      title: 'Eccellenza nelle competenze',
      description: 'Selezioniamo e formiamo talenti per garantire professionalità e capacità all\'avanguardia.'
    },
    {
      icon: 'fas fa-cogs',
      title: 'Flessibilità operativa',
      description: 'Modelli di collaborazione su misura, adattabili alle specifiche esigenze di ogni cliente.'
    },
    {
      icon: 'fas fa-handshake',
      title: 'Relazioni di lungo termine',
      description: 'Instauriamo partnership solide, basate su fiducia e risultati concreti.'
    }
  ];

  // Financial data
  financialData: FinancialYear[] = [
    {
      year: 2021,
      amount: '1.717.744,00 €',
      description: 'Fatturato in continua crescita dall\'anno precedente.'
    },
    {
      year: 2022,
      amount: '2.173.400,00 €',
      description: 'Avvio dei laboratori di sviluppo software "chiavi in mano".'
    },
    {
      year: 2023,
      amount: '2.864.794,00 €',
      description: 'Investimenti sugli staff di ricerca e incremento assunzioni.'
    },
    {
      year: 2024,
      amount: '4.374.407,00 €',
      description: 'Investimenti su progetti di Ricerca e Sviluppo.'
    }
  ];

  // Processi HR data
  processiHR: ProcessoHR[] = [
    {
      icon: 'fas fa-search',
      title: 'Ricerca e Selezione',
      description: 'Selezione accurata di professionisti IT con competenze specifiche per ogni progetto'
    },
    {
      icon: 'fas fa-user-check',
      title: 'Valutazione Competenze',
      description: 'Assessment tecnico approfondito per garantire l\'allineamento con i requisiti del cliente'
    },
    {
      icon: 'fas fa-clock',
      title: 'Time-to-Hire Rapido',
      description: 'Processi ottimizzati per ridurre i tempi di inserimento delle risorse'
    },
    {
      icon: 'fas fa-handshake',
      title: 'Matching Perfetto',
      description: 'Abbinamento ideale tra competenze tecniche e necessità aziendali del cliente'
    }
  ];

  // Servizi Personalizzati data
  serviziPersonalizzati: ServizioPersonalizzato[] = [
    {
      icon: 'fas fa-cogs',
      title: 'Consulenza su Misura',
      description: 'Servizi di consulenza IT personalizzati in base alle specifiche esigenze aziendali'
    },
    {
      icon: 'fas fa-graduation-cap',
      title: 'Formazione Specializzata',
      description: 'Programmi formativi tecnici customizzati per team di sviluppo e IT'
    },
    {
      icon: 'fas fa-project-diagram',
      title: 'Gestione Progetti',
      description: 'Supporto completo nella gestione di progetti tecnologici complessi'
    },
    {
      icon: 'fas fa-tools',
      title: 'Soluzioni Chiavi in Mano',
      description: 'Sviluppo completo di soluzioni software dalla progettazione al deployment'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.initializeAnimations();
  }

  /**
   * Initialize scroll animations
   */
  private initializeAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    // Observe sections after view init
    setTimeout(() => {
      const sections = document.querySelectorAll('.main-content-section, .statistics-section, .details-section');
      sections.forEach(section => observer.observe(section));
    }, 100);
  }

  /**
   * Toggle additional content visibility
   */
  toggleAdditionalContent(): void {
    this.showAdditionalContent = !this.showAdditionalContent;
    
    // Scroll to the additional content if showing
    if (this.showAdditionalContent) {
      setTimeout(() => {
        const element = document.querySelector('.details-section');
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }

  /**
   * Handle contact button click
   */
  onContactClick(): void {
    // Navigate to contact section or open contact modal
    console.log('Contact clicked');
    // Example: this.router.navigate(['/contatti']);
  }

  /**
   * Handle services button click
   */
  onServicesClick(): void {
    // Navigate to services section
    console.log('Services clicked');
    // Example: this.router.navigate(['/consulenza']);
  }

  /**
   * Track by function for ngFor performance
   * @param index Item index
   * @param item Item object
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Track by function for financial data
   * @param index Item index
   * @param item Financial year data
   */
  trackByYear(index: number, item: FinancialYear): number {
    return item.year;
  }

  /**
   * Get formatted contact information
   */
  getContactInfo() {
    return {
      founder: 'Ing. Vincenzo Esposito',
      role: 'CEO & Founder',
      email: 'vincenzo.esposito@itconsultingsrl.it',
      phone: '+39 335 525 06 64',
      address: 'Centro Direzionale di Napoli Torre G3',
      website: 'www.itconsultingsrl.it'
    };
  }

  /**
   * Format number with thousands separator
   * @param num Number to format
   */
  formatNumber(num: string): string {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Animate counter numbers
   * @param targetElement Target DOM element
   * @param finalNumber Final number to reach
   * @param duration Animation duration in ms
   */
  private animateCounter(targetElement: HTMLElement, finalNumber: number, duration: number = 2000): void {
    let startNumber = 0;
    const increment = finalNumber / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      startNumber += increment;
      if (startNumber >= finalNumber) {
        startNumber = finalNumber;
        clearInterval(timer);
      }
      targetElement.textContent = Math.floor(startNumber).toString();
    }, 16);
  }

  /**
   * Start counter animations when statistics section is visible
   */
  startCounterAnimations(): void {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((element, index) => {
      const stat = this.statistics[index];
      const numericValue = parseInt(stat.number.replace(/[^\d]/g, ''));
      this.animateCounter(element as HTMLElement, numericValue);
    });
  }

  /**
   * Handle scroll to section
   * @param sectionId Section identifier
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get company statistics for external use
   */
  getCompanyStats() {
    return {
      employees: 120,
      activeJobs: 48,
      satisfiedClients: 80,
      candidatesProcessed: 20000,
      yearsOfExperience: 11,
      officesCount: 3
    };
  }

  /**
   * Handle responsive menu toggle
   */
  toggleMobileMenu(): void {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('active');
    }
  }

  /**
   * Handle value card interaction
   * @param value Selected value
   */
  onValueClick(value: Value): void {
    console.log('Value selected:', value.title);
    // Could show more details or navigate to specific section
  }

  /**
   * Handle financial year click
   * @param year Financial year data
   */
  onFinancialYearClick(year: FinancialYear): void {
    console.log('Financial year selected:', year.year);
    // Could show detailed financial information
  }

  /**
   * Load dynamic content based on user preferences
   */
  private loadDynamicContent(): void {
    // Example: Load additional content based on user role or preferences
    const userPreferences = this.getUserPreferences();
    if (userPreferences?.showExtendedContent) {
      this.showAdditionalContent = true;
    }
  }

  /**
   * Get user preferences from local storage or service
   */
  private getUserPreferences(): any {
    try {
      const preferences = localStorage.getItem('userPreferences');
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.warn('Could not load user preferences:', error);
      return null;
    }
  }

  /**
   * Save user preferences
   * @param preferences User preferences object
   */
  saveUserPreferences(preferences: any): void {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Could not save user preferences:', error);
    }
  }

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause animations if needed
        console.log('Page hidden - pausing animations');
      } else {
        // Page is visible, resume animations
        console.log('Page visible - resuming animations');
      }
    });
  }

  /**
   * Cleanup component resources
   */
  ngOnDestroy(): void {
    // Clean up event listeners and subscriptions
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle error states gracefully
   * @param error Error object
   */
  private handleError(error: any): void {
    console.error('Component error:', error);
    // Could show user-friendly error message or fallback content
  }

  /**
   * Get aria labels for accessibility
   * @param statistic Statistic object
   */
  getAriaLabel(statistic: Statistic): string {
    return `${statistic.number} ${statistic.label}. ${statistic.description}`;
  }

  /**
   * Handle keyboard navigation
   * @param event Keyboard event
   * @param action Action to perform
   */
  onKeyboardNavigation(event: KeyboardEvent, action: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switch (action) {
        case 'contact':
          this.onContactClick();
          break;
        case 'services':
          this.onServicesClick();
          break;
        case 'toggle':
          this.toggleAdditionalContent();
          break;
      }
    }
  }
}