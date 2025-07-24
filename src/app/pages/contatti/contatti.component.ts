import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Di solito già presente per i standalone
import { FormsModule } from '@angular/forms'; // <--- IMPORTA QUESTO!

@Component({
  selector: 'app-contatti',
  standalone: true, // <--- Assicurati che sia 'true'
  imports: [
    CommonModule, // Necessario per direttive comuni come ngIf, ngFor
    FormsModule     // <--- AGGIUNGI QUI FormsModule
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
    question: ''
  };

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    console.log('Dati del form inviati:', this.contactForm);
    alert('Grazie per averci contattato! Abbiamo ricevuto il tuo messaggio.');
    this.resetForm();
  }

  resetForm(): void {
    this.contactForm = {
      name: '',
      phone: '',
      email: '',
      company: '',
      subject: '',
      question: ''
    };
  }
}