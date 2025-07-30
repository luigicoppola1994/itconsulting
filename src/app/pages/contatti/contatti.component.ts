import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-contatti',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './contatti.component.html',
  styleUrls: ['./contatti.component.scss']
})
export class ContattiComponent implements OnInit {

  contactForm = {
    name: '',
    phone: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    privacy: false
  };

  isSubmitting = false;

  // FAQ Data
  faqs: FAQ[] = [
    {
      question: 'Quali servizi offrite?',
      answer: 'Offriamo consulenza IT, sviluppo software, recruiting specializzato, formazione tecnica e soluzioni chiavi in mano per aziende di ogni dimensione.',
      isOpen: false
    },
    {
      question: 'Come posso richiedere un preventivo?',
      answer: 'Puoi compilare il form di contatto specificando le tue esigenze, oppure chiamarci direttamente. Ti risponderemo entro 24 ore con un preventivo personalizzato.',
      isOpen: false
    },
    {
      question: 'Lavorate solo in modalità remota?',
      answer: 'Offriamo sia servizi in modalità remota che on-site. Abbiamo sedi a Napoli, Roma e Milano per essere sempre vicini ai nostri clienti.',
      isOpen: false
    },
    {
      question: 'Quali tecnologie utilizzate?',
      answer: 'Il nostro team è esperto in tutte le principali tecnologie del mercato IT: Java, .NET, JavaScript, Python, Angular, React, Cloud Computing e molto altro.',
      isOpen: false
    },
    {
      question: 'Avete esperienza nel mio settore?',
      answer: 'Abbiamo lavorato con clienti di diversi settori: fintech, e-commerce, sanità, pubblica amministrazione, manifatturiero e startup innovative.',
      isOpen: false
    },
    {
      question: 'Offrite supporto post-progetto?',
      answer: 'Sì, offriamo servizi di manutenzione, supporto tecnico e evolutiva per tutti i progetti realizzati, con contratti di assistenza personalizzati.',
      isOpen: false
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
      const sections = document.querySelectorAll('.contact-info-section, .contact-form-section, .faq-section');
      sections.forEach(section => observer.observe(section));
    }, 100);
  }

  /**
   * Submit contact form
   */
  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      this.showSuccessMessage();
      this.resetForm();
    } catch (error) {
      this.showErrorMessage();
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Reset contact form
   */
  resetForm(): void {
    this.contactForm = {
      name: '',
      phone: '',
      email: '',
      company: '',
      subject: '',
      message: '',
      privacy: false
    };
  }

  /**
   * Scroll to contact form
   */
  scrollToForm(): void {
    const element = document.getElementById('contact-form');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Scroll to offices section
   */
  scrollToOffices(): void {
    const element = document.getElementById('offices');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  /**
   * Toggle FAQ item
   */
  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
    
    // Close other FAQs (accordion behavior)
    this.faqs.forEach((faq, i) => {
      if (i !== index) {
        faq.isOpen = false;
      }
    });
  }

  /**
   * Simulate API call for form submission
   */
  private simulateApiCall(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form submitted:', this.contactForm);
        resolve();
      }, 2000);
    });
  }

  /**
   * Show success message
   */
  private showSuccessMessage(): void {
    // In a real app, you might use a toast service or modal
    alert('🎉 Grazie per averci contattato!\n\nAbbiamo ricevuto il tuo messaggio e ti risponderemo entro 24 ore lavorative.');
  }

  /**
   * Show error message
   */
  private showErrorMessage(): void {
    alert('❌ Si è verificato un errore nell\'invio del messaggio.\n\nTi preghiamo di riprovare o contattarci direttamente via telefono.');
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Italian)
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+39|0039|39)?[\s\-]?[0-9]{2,3}[\s\-]?[0-9]{6,8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number
   */
  formatPhoneNumber(phone: string): string {
    // Simple formatting for Italian numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+39 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  }

  /**
   * Handle phone input formatting
   */
  onPhoneInput(event: any): void {
    const input = event.target;
    const value = input.value;
    input.value = this.formatPhoneNumber(value);
    this.contactForm.phone = input.value;
  }

  /**
   * Get contact methods data
   */
  getContactMethods() {
    return [
      {
        icon: 'fas fa-phone',
        title: 'Chiamaci',
        primary: '+39 335 525 06 64',
        secondary: 'Lun-Ven: 9:00-18:00'
      },
      {
        icon: 'fas fa-envelope',
        title: 'Scrivici',
        primary: 'info@itconsultingsrl.it',
        secondary: 'Risposta entro 24h'
      },
      {
        icon: 'fas fa-map-marker-alt',
        title: 'Vieni a trovarci',
        primary: 'Centro Direzionale di Napoli\nTorre G3 - 24° Piano',
        secondary: 'Su appuntamento'
      }
    ];
  }

  /**
   * Get office locations data
   */
  getOfficeLocations() {
    return [
      {
        name: 'Sede Principale - Napoli',
        type: 'Headquarters',
        address: 'Centro Direzionale di Napoli\nTorre G3 - 24° Piano\n80143 Napoli (NA)',
        phone: '+39 081 123 4567',
        email: 'napoli@itconsultingsrl.it',
        services: ['R&S Lab', 'Formazione', 'Recruiting']
      },
      {
        name: 'Sede Roma',
        type: 'Operativa',
        address: 'Via Roma, 123\n00100 Roma (RM)',
        phone: '+39 06 123 4567',
        email: 'roma@itconsultingsrl.it',
        services: ['Recruiting', 'Colloqui']
      },
      {
        name: 'Sede Milano',
        type: 'Operativa',
        address: 'Via Milano, 456\n20100 Milano (MI)',
        phone: '+39 02 123 4567',
        email: 'milano@itconsultingsrl.it',
        services: ['Recruiting', 'Colloqui']
      }
    ];
  }

  /**
   * Handle form field focus
   */
  onFieldFocus(fieldName: string): void {
    // Add visual feedback or analytics tracking
    console.log(`Field focused: ${fieldName}`);
  }

  /**
   * Handle form field blur
   */
  onFieldBlur(fieldName: string): void {
    // Validate field or save draft
    console.log(`Field blurred: ${fieldName}`);
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return !!(
      this.contactForm.name.trim() &&
      this.contactForm.email.trim() &&
      this.isValidEmail(this.contactForm.email) &&
      this.contactForm.subject &&
      this.contactForm.message.trim() &&
      this.contactForm.privacy
    );
  }
}