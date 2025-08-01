// vale.component.ts
// Importa le dipendenze Angular necessarie per il componente
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// Importa RxJS per la gestione delle subscription e l'osservazione degli stati
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// Importa i moduli Angular per il template e le funzionalità HTTP
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// Importa il servizio personalizzato per gestire le conversazioni con gli agenti AI
import { ConversationService, ConversationState } from '../../services/conversation.service';

// Interfaccia che definisce la struttura di un'offerta di lavoro
// Contiene tutti i campi ricevuti dall'API di Vale HR
interface JobOffer {
  id: number;                    // ID univoco dell'offerta
  user_id: number;               // ID dell'utente che ha creato l'offerta
  title: string;                 // Titolo della posizione lavorativa
  description: string;           // Descrizione dettagliata del lavoro
  must_have: string;             // Requisiti obbligatori
  hard_skill: string;            // Competenze tecniche richieste
  soft_skill: string;            // Competenze trasversali richieste
  responsabilita: string;        // Responsabilità del ruolo
  attivita_lavorativa: string;   // Attività lavorative principali
  created_at: string;            // Data di creazione
  updated_at: string;            // Data di ultimo aggiornamento
  isActive: number;              // Flag per indicare se l'offerta è attiva
  ral: string;                   // Retribuzione annua lorda minima
  luogo: string;                 // Luogo di lavoro
  contract_type: string;         // Tipo di contratto (es. tempo indeterminato)
  job_type: string;              // Modalità di lavoro (es. remoto, ibrido)
  ral_max: string;               // Retribuzione annua lorda massima
  user: {                        // Informazioni sull'utente che ha pubblicato l'offerta
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    breezy_sessions: any[];
  };
}

// Interfaccia per la risposta dell'API
interface ApiResponse {
  success: boolean;    // Indica se la richiesta è andata a buon fine
  data: JobOffer[];    // Array delle offerte di lavoro
}

// Decoratore del componente Angular
@Component({
  selector: 'app-vale',                                              // Nome del selettore HTML
  templateUrl: './vale.component.html',                             // Template HTML associato
  styleUrls: ['./vale.component.scss'],                             // Fogli di stile CSS
  imports: [CommonModule, FormsModule, HttpClientModule],           // Moduli importati (standalone component)
  standalone: true                                                  // Componente standalone (non richiede NgModule)
})
export class ValeComponent implements OnInit, OnDestroy {
  // Subject per gestire la distruzione delle subscription RxJS
  // Previene memory leak quando il componente viene distrutto
  private destroy$ = new Subject<void>();
  
  // CONFIGURAZIONE
  jobApiUrl: string = 'https://aziende.vale-hr.it/api/job-descriptions';  // URL dell'API per le offerte di lavoro
  
  // STATO DEL COMPONENTE
  // Stato della conversazione vocale sincronizzato con il ConversationService
  conversationState: ConversationState = {
    status: 'disconnected',        // Stato della connessione ('connected', 'disconnected', 'connecting')
    mode: 'idle',                  // Modalità corrente ('listening', 'speaking', 'idle')
    currentAgent: null,            // Agente attualmente attivo
    inputVolume: 0,                // Volume dell'input audio dell'utente
    outputVolume: 0,               // Volume dell'output audio dell'agente
    sdkLoaded: false,              // Flag se l'SDK ElevenLabs è caricato
    sdkLoading: false,             // Flag se l'SDK è in fase di caricamento
    isAgentSpeaking: false,        // True quando l'agente sta parlando
    isUserSpeaking: false,         // True quando l'utente sta parlando
    visualState: 'idle',           // Stato visuale dell'interfaccia
    lastSpeaker: null,             // Ultimo speaker (user/agent)
    speakingIntensity: 0           // Intensità del parlato per animazioni
  };
  
  // DATI
  jobOffers: JobOffer[] = [];      // Array delle offerte di lavoro ricevute dall'API
  hasSearched: boolean = false;    // Flag per indicare se è stata effettuata almeno una ricerca

  // COSTRUTTORE
  constructor(
    private http: HttpClient,              // Servizio Angular per le chiamate HTTP
    public conversationService: ConversationService  // Servizio per gestire le conversazioni vocali
  ) {
    // Inizializza gli strumenti client (ora delegato al ConversationService)
    this.setupClientTools();
  }

  // LIFECYCLE HOOKS

  /**
   * Inizializzazione del componente - eseguito dopo la creazione
   */
  ngOnInit(): void {
    // Sottoscrivi agli aggiornamenti dello stato conversazione
    // Utilizza takeUntil per evitare memory leak quando il componente viene distrutto
    this.conversationService.conversationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Aggiorna lo stato locale con quello del servizio
        this.conversationState = state;
      });

    // Ascolta gli eventi personalizzati per i risultati di lavoro
    // L'agente AI può inviare risultati che vengono intercettati qui
    window.addEventListener('jobResultsUpdated', this.handleJobResults.bind(this) as EventListener);
  }

  /**
   * Pulizia del componente - eseguito prima della distruzione
   */
  ngOnDestroy(): void {
    // Emette un segnale per completare tutte le subscription attive
    this.destroy$.next();
    this.destroy$.complete();
    
    // Rimuovi listener evento per evitare memory leak
    window.removeEventListener('jobResultsUpdated', this.handleJobResults.bind(this) as EventListener);
  }

  // METODI PUBBLICI

  /**
   * Avvia conversazione vocale con l'agente VALE
   * Utilizza il ConversationService per gestire la connessione con ElevenLabs
   */
  async startConversation(): Promise<void> {
    try {
      console.log('🚀 Avvio conversazione con agente VALE...');
      // Delega al ConversationService l'avvio della conversazione con l'agente 'vale'
      await this.conversationService.startConversation('vale');
    } catch (error) {
      console.error('Errore avvio conversazione:', error);
    }
  }

  /**
   * Termina la conversazione vocale attiva
   */
  async stopConversation(): Promise<void> {
    try {
      console.log('🔚 Termine conversazione...');
      // Delega al ConversationService la chiusura della conversazione
      await this.conversationService.endConversation();
    } catch (error) {
      console.error('Errore termine conversazione:', error);
    }
  }

  /**
   * Reset della ricerca - pulisce l'array delle offerte di lavoro
   * Utilizzato per iniziare una nuova ricerca
   */
  resetSearch(): void {
    this.jobOffers = [];
    this.hasSearched = false;  // Reset anche il flag di ricerca
  }

  /**
   * Genera URL per aprire ElevenLabs direttamente nel browser
   * Utile per debug o accesso diretto all'agente
   */
  getElevenLabsUrl(): string {
    // Recupera le informazioni dell'agente VALE dal ConversationService
    const valeAgent = this.conversationService.getAgentById('vale');
    return `https://elevenlabs.io/conversational-ai/agent/${valeAgent?.agentId}`;
  }

  /**
   * TrackBy function per ottimizzare le performance di ngFor
   * Angular utilizza questa funzione per identificare in modo univoco gli elementi della lista
   */
  trackByJobId(index: number, job: JobOffer): number {
    return job.id;  // Restituisce l'ID univoco dell'offerta di lavoro
  }

  // METODI PRIVATI

  /**
   * Gestisce i risultati di lavoro ricevuti dal ConversationService
   * Questo metodo viene chiamato quando l'agente AI trova offerte di lavoro
   * e le invia tramite un evento personalizzato
   */
  private handleJobResults(event: Event): void {
    // Cast dell'evento generico a CustomEvent per accedere ai dettagli
    const customEvent = event as CustomEvent;
    // Estrae l'array delle offerte di lavoro dall'evento
    const jobs = customEvent.detail.jobs;
    console.log('📋 Ricevuti nuovi risultati di lavoro:', jobs);
    // Aggiorna la proprietà locale con i nuovi risultati
    // Questo triggererà l'aggiornamento dell'interfaccia utente
    this.jobOffers = jobs;
    this.hasSearched = true;  // Marca che è stata effettuata una ricerca
  }

  /**
   * Setup degli strumenti client per ElevenLabs
   * Precedentemente configurava direttamente l'SDK, ora è gestito dal ConversationService
   * Mantenuto per compatibilità e future estensioni
   */
  private setupClientTools(): void {
    console.log('Client tools ora gestiti dal ConversationService');
    // La configurazione degli strumenti client è stata centralizzata
    // nel ConversationService per una migliore gestione e riutilizzo
  }

}