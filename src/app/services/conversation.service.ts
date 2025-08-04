import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Importa i tipi necessari dall'SDK di ElevenLabs
import { Conversation, SessionConfig, Callbacks, InputConfig, ClientToolsConfig, Role, Status, Mode } from '@11labs/client';

// Definisce le opzioni per l'avvio di una sessione di conversazione
type SessionOptions = SessionConfig & Partial<Callbacks> & Partial<InputConfig> & {
  agentId: string;
  clientTools?: Record<string, (parameters: any) => string | number | void | Promise<string | number | void>>;
};

// Interfaccia per l'istanza della conversazione, riflette i metodi disponibili dall'SDK
interface ConversationInstance {
  endSession(): Promise<void>;
  getId(): string;
  setVolume(options: { volume: number }): void;
  getInputVolume(): number;
  getOutputVolume(): number;
  getInputByteFrequencyData(): Uint8Array;
  getOutputByteFrequencyData(): Uint8Array;
  // sendText è stato rimosso da qui in quanto non è un metodo esposto direttamente dall'SDK
  // per inviare testo arbitrario che l'agente pronuncia.
  // La pronuncia del messaggio di trasferimento deve essere gestita dalla logica dell'agente stesso
  // prima di chiamare il tool.
}

// Interfaccia per la configurazione di un singolo agente
interface AgentConfig {
  id: string; // ID interno per la gestione dell'applicazione (es. 'vale', 'contatti')
  name: string; // Nome visualizzato dell'agente
  agentId: string; // ID dell'agente sulla piattaforma ElevenLabs
  description: string; // Breve descrizione dell'agente
  avatar?: string; // Percorso dell'immagine dell'avatar
  color?: string; // Colore associato all'agente per l'interfaccia utente
}

// Interfaccia per lo stato complessivo della conversazione
export interface ConversationState {
  status: 'connected' | 'connecting' | 'disconnected'; // Stato della connessione (connesso, in connessione, disconnesso)
  mode: 'speaking' | 'listening' | 'idle'; // Modalità dell'interazione (agente parla, utente parla, inattivo)
  currentAgent: AgentConfig | null; // L'agente attualmente attivo
  conversationId?: string; // ID della sessione di conversazione corrente
  lastMessage?: string; // L'ultimo messaggio scambiato
  error?: string; // Messaggio di errore, se presente
  inputVolume: number; // Volume dell'input del microfono
  outputVolume: number; // Volume dell'output dell'agente
  sdkLoaded: boolean; // Indica se l'SDK è stato caricato
  sdkLoading: boolean; // Indica se l'SDK è in fase di caricamento
  isAgentSpeaking: boolean; // Vero se l'agente sta parlando
  isUserSpeaking: boolean; // Vero se l'utente sta parlando
  visualState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error'; // Stato visivo per l'UI
  lastSpeaker: 'agent' | 'user' | null; // Chi ha parlato l'ultima volta
  speakingIntensity: number; // Intensità del parlato per effetti visivi
}

// Interfacce per le offerte di lavoro (specifiche per VALE)
interface JobOffer {
  id: number;
  user_id: number;
  title: string;
  description: string;
  must_have: string;
  hard_skill: string;
  soft_skill: string;
  responsabilita: string;
  attivita_lavorativa: string;
  created_at: string;
  updated_at: string;
  isActive: number;
  ral: string;
  luogo: string;
  contract_type: string;
  job_type: string;
  ral_max: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    breezy_sessions: any[];
  };
}

interface JobApiResponse {
  success: boolean;
  data: JobOffer[];
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService implements OnDestroy {
  // Istanza della conversazione ElevenLabs SDK
  private conversation: ConversationInstance | null = null;
  
  // Subject per lo stato della conversazione, utilizzato per notificare i componenti
  private conversationStateSubject = new BehaviorSubject<ConversationState>({
    status: 'disconnected',
    mode: 'idle',
    currentAgent: null,
    inputVolume: 0,
    outputVolume: 0,
    sdkLoaded: false,
    sdkLoading: false,
    isAgentSpeaking: false,
    isUserSpeaking: false,
    visualState: 'idle',
    lastSpeaker: null,
    speakingIntensity: 0
  });

  // Solo VALE - assistente universale che parla su tutte le pagine
  private agents: AgentConfig[] = [
    {
      id: 'vale',
      name: 'VALE',
      agentId: 'agent_4401k1jdyf5keey8pzph1qhxfh20',
      description: 'Assistente universale per tutte le pagine',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#3B82F6'
    }
  ];

  // Observable pubblico per permettere ai componenti di sottoscriversi allo stato della conversazione
  public conversationState$: Observable<ConversationState> = this.conversationStateSubject.asObservable();
  
  private volumeUpdateInterval?: number; // Intervallo per l'aggiornamento del volume
  private speakingDetectionThreshold = 0.1; // Soglia per rilevare il parlato
  
  // Dati specifici per VALE
  private jobOffers: JobOffer[] = [];
  private jobApiUrl = 'https://aziende.vale-hr.it/api/job-descriptions';

  // Costruttore del servizio, inietta il Router di Angular
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    console.log('🎤 ConversationService inizializzato');
    this.updateState({ sdkLoaded: true }); // Imposta l'SDK come caricato all'avvio del servizio
  }

  // Restituisce la configurazione di un agente tramite il suo ID interno
  getAgentById(agentId: string): AgentConfig | undefined {
    return this.agents.find(agent => agent.id === agentId);
  }

  // Restituisce tutte le configurazioni degli agenti
  getAllAgents(): AgentConfig[] {
    return this.agents;
  }

  // Restituisce l'agente attualmente attivo nella conversazione
  getActiveAgent(): AgentConfig | null {
    return this.conversationStateSubject.value.currentAgent;
  }

  /**
   * VALE è sempre attivo su tutte le pagine.
   * @param routePath Il percorso della rotta della pagina (ignorato, VALE parla sempre).
   */
  async setActiveAgentByRoute(routePath: string): Promise<void> {
    const valeAgent = this.agents[0]; // VALE è l'unico agente
    const currentState = this.conversationStateSubject.value;

    console.log(`🎤 VALE è attivo su pagina: ${routePath}`);

    // Se VALE non è già impostato come agente corrente
    if (!currentState.currentAgent || currentState.currentAgent.id !== 'vale') {
      this.updateState({ 
        currentAgent: { ...valeAgent },
        visualState: currentState.isAgentSpeaking ? 'speaking' : (currentState.isUserSpeaking ? 'listening' : 'idle')
      });
    }
  }

  /**
   * Avvia una nuova sessione di conversazione con l'agente specificato.
   * @param agentId L'ID interno dell'agente con cui avviare la conversazione.
   */
  async startConversation(agentId: string): Promise<void> {
    try {
      const agent = this.getAgentById(agentId);
      if (!agent) {
        throw new Error(`Agente ${agentId} non trovato`);
      }

      // Se una conversazione è già attiva con lo STESSO agente, non fare nulla
      if (this.conversationStateSubject.value.status === 'connected' && 
          this.conversationStateSubject.value.currentAgent?.id === agentId) {
        console.log(`✅ Conversazione con ${agent.name} già attiva. Nessuna azione necessaria.`);
        return;
      }

      // Termina la conversazione esistente se è con un agente DIVERSO o se deve essere resettata
      if (this.conversation && this.conversationStateSubject.value.currentAgent?.id !== agentId) {
        await this.endConversation();
      }

      // Aggiorna lo stato per indicare che la connessione è in corso
      this.updateState({ 
        status: 'connecting', 
        currentAgent: { ...agent },
        error: undefined,
        visualState: 'connecting',
        isAgentSpeaking: false,
        isUserSpeaking: false,
        speakingIntensity: 0
      });

      console.log(`🔄 Avvio conversazione con ${agent.name} (colore: ${agent.color})...`);

      // Configura le opzioni della sessione per l'SDK di ElevenLabs
      const sessionOptions: SessionOptions = {
        agentId: agent.agentId,
        
        // Definisce i tool client-side che VALE può chiamare
        clientTools: {
          redirectToExternalURL: (parameters: any) => {
            console.log('🔧 Tool redirectToExternalURL chiamato:', parameters);
            this.handleRedirectTool(parameters);
            return `Reindirizzamento a ${parameters.url} completato`;
          },

          // Tool per filtrare offerte di lavoro
          getFilteredAnnunci: (parameters: any) => {
            console.log('🔧 Tool getFilteredAnnunci chiamato:', parameters);
            return this.handleGetFilteredAnnunci(parameters);
          }
        },
        
        // Callback quando la connessione è stabilita
        onConnect: () => {
          console.log(`✅ Connesso all'agente ${agent.name}`);
          this.updateState({
            status: 'connected',
            conversationId: this.conversation?.getId(), // Usa optional chaining
            error: undefined,
            visualState: 'listening',
            currentAgent: { ...agent }
          });
          this.startVolumeMonitoring(); // Avvia il monitoraggio del volume
        },

        // Callback quando la connessione viene disconnessa
        onDisconnect: () => {
          console.log(`❌ Disconnesso dall'agente ${agent.name}`);
          this.updateState({
            status: 'disconnected',
            mode: 'idle',
            conversationId: undefined,
            visualState: 'idle',
            isAgentSpeaking: false,
            isUserSpeaking: false,
            lastSpeaker: null,
            speakingIntensity: 0
          });
          this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
        },

        // Callback quando viene ricevuto un messaggio (testo)
        onMessage: ({ message, source }: { message: string; source: Role }) => {
          console.log(`💬 Messaggio da ${source} (${agent.name}):`, message);
          const speaker: 'agent' | 'user' = String(source).toLowerCase() === 'agent' ? 'agent' : 'user';
          
          this.updateState({ 
            lastMessage: message,
            lastSpeaker: speaker
          });
        },

        // Callback quando lo stato generale della sessione cambia
        onStatusChange: ({ status }: { status: Status }) => {
          console.log(`🔄 Cambio stato: ${status}`);
          this.updateVisualStateFromStatus(status);
        },

        // Callback quando la modalità di interazione cambia (parlato, ascolto, inattivo)
        onModeChange: ({ mode }: { mode: Mode }) => {
          console.log(`🎤 Cambio modalità: ${mode}`);
          const internalMode = mode as ConversationState['mode'];
          
          const isAgentSpeaking = internalMode === 'speaking';
          const isUserSpeaking = internalMode === 'listening';
          
          this.updateState({ 
            mode: internalMode,
            isAgentSpeaking,
            isUserSpeaking,
            visualState: this.getVisualStateFromMode(internalMode),
            lastSpeaker: isAgentSpeaking ? 'agent' : (isUserSpeaking ? 'user' : this.conversationStateSubject.value.lastSpeaker)
          });
        },

        // Callback in caso di errore della sessione
        onError: (error: any) => {
          console.error('❌ Errore conversazione:', error);
          this.updateState({
            error: `Errore di connessione con ${agent.name}: ${error.message || error}`,
            status: 'disconnected',
            mode: 'idle',
            visualState: 'error',
            isAgentSpeaking: false,
            isUserSpeaking: false,
            speakingIntensity: 0
          });
          this.stopVolumeMonitoring();
        }
      };

      // Avvia la sessione di conversazione con ElevenLabs
      this.conversation = await Conversation.startSession(sessionOptions);
      console.log(`🚀 Conversazione avviata con ${agent.name}, ID: ${this.conversation?.getId()}`); // Usa optional chaining

    } catch (error) {
      console.error('❌ Errore nell\'avvio della conversazione:', error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Errore sconosciuto nell\'avvio della conversazione',
        status: 'disconnected',
        currentAgent: null,
        visualState: 'error'
      });
      throw error;
    }
  }

  /**
   * Gestisce il tool `redirectToExternalURL` chiamato dall'agente.
   * Esegue un reindirizzamento a un URL interno o esterno.
   * @param parameters I parametri del tool, inclusi `url` e `description`.
   */
  private handleRedirectTool(parameters: any): void {
    const { url, description } = parameters;
    console.log(`🔗 Gestione redirect tool: ${url} (${description || 'Nessuna descrizione'})`);
    try {
      this.showNotification(description || `Reindirizzamento a ${url}...`);
      if (this.isInternalUrl(url)) {
        const route = url.startsWith('/') ? url.substring(1) : url;
        // Naviga verso la rotta interna
        this.router.navigate([route]).catch(error => {
          console.error('❌ Errore navigazione:', error);
        });
      } else {
        // Apre un nuovo tab per URL esterni
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ Errore nel redirect tool:', error);
    }
  }


  /**
   * Avvia/ferma la conversazione con VALE (l'unico agente disponibile).
   */
  async switchAgentWithTool(newAgentId: string = 'vale'): Promise<void> {
    // Solo VALE è supportato
    if (newAgentId !== 'vale') {
      console.warn(`Solo VALE è supportato, ma è stato richiesto: ${newAgentId}. Uso VALE.`);
    }

    const currentState = this.conversationStateSubject.value;
    
    if (currentState.status === 'connected') {
      // Se è già connesso, termina la conversazione
      await this.endConversation();
    } else {
      // Se non è connesso, avvia la conversazione
      await this.startConversation('vale');
    }
  }

  // Metodo di compatibilità
  async switchAgent(newAgentId: string = 'vale'): Promise<void> {
    return this.switchAgentWithTool(newAgentId);
  }

  /**
   * Termina la sessione di conversazione attiva.
   */
  async endConversation(): Promise<void> {
    if (!this.conversation) {
      return;
    }

    try {
      await this.conversation.endSession();
      console.log('🔚 Conversazione terminata');
    } catch (error) {
      console.error('❌ Errore nella chiusura della conversazione:', error);
    } finally {
      this.conversation = null; // Resetta l'istanza della conversazione
      this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
      this.updateState({ // Resetta lo stato della conversazione
        status: 'disconnected',
        mode: 'idle',
        conversationId: undefined,
        lastMessage: undefined,
        error: undefined,
        inputVolume: 0,
        outputVolume: 0,
        visualState: 'idle',
        isAgentSpeaking: false,
        isUserSpeaking: false,
        lastSpeaker: null,
        speakingIntensity: 0
      });
    }
  }

  // Controlla se un URL è interno all'applicazione (VALE parla su tutte le pagine)
  private isInternalUrl(url: string): boolean {
    const internalRoutes = [
      '/vale', '/chi-siamo', '/contatti', '/prodotti', '/consulenza', '/formazione',
      'vale', 'chi-siamo', 'contatti', 'prodotti', 'consulenza', 'formazione', '', 'home'
    ];
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return internalRoutes.includes(cleanUrl.toLowerCase()) || 
           (url.startsWith('/') && !url.startsWith('//') && !url.includes('://'));
  }

  // Mostra una notifica temporanea all'utente
  private showNotification(message: string, type: 'info' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#EF4444' : '#3B82F6';
    
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        backdrop-filter: blur(10px);
        animation: slideInFromRight 0.3s ease-out;
      ">
        🔗 ${message}
      </div>
    `;
    
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Metodi di supporto per la gestione dello stato visivo
  private getVisualStateFromMode(mode: ConversationState['mode']): ConversationState['visualState'] {
    switch (mode) {
      case 'speaking': return 'speaking';
      case 'listening': return 'listening';
      case 'idle': return 'idle';
      default: return 'idle';
    }
  }

  private updateVisualStateFromStatus(status: Status): void {
    const currentState = this.conversationStateSubject.value;
    let newVisualState: ConversationState['visualState'] = currentState.visualState;

    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
      case 'connected':
        newVisualState = currentState.mode === 'speaking' ? 'speaking' : 'listening';
        break;
      case 'connecting':
        newVisualState = 'connecting';
        break;
      case 'disconnected':
        newVisualState = 'idle';
        break;
    }

    if (newVisualState !== currentState.visualState) {
      this.updateState({ visualState: newVisualState });
    }
  }

  // Avvia il monitoraggio del volume di input e output per aggiornare lo stato visivo
  private startVolumeMonitoring(): void {
    if (this.volumeUpdateInterval) {
      clearInterval(this.volumeUpdateInterval);
    }

    this.volumeUpdateInterval = window.setInterval(() => {
      if (this.conversation) {
        try {
          const inputVolume = this.conversation.getInputVolume();
          const outputVolume = this.conversation.getOutputVolume();
          
          const currentState = this.conversationStateSubject.value;
          
          const speakingIntensity = Math.max(inputVolume, outputVolume);
          const isUserCurrentlySpeaking = inputVolume > this.speakingDetectionThreshold;
          const isAgentCurrentlySpeaking = outputVolume > this.speakingDetectionThreshold;

          if (isUserCurrentlySpeaking !== currentState.isUserSpeaking || 
              isAgentCurrentlySpeaking !== currentState.isAgentSpeaking ||
              Math.abs(speakingIntensity - currentState.speakingIntensity) > 0.05) {
            
            let newVisualState = currentState.visualState;
            
            if (isAgentCurrentlySpeaking) {
              newVisualState = 'speaking';
            } else if (isUserCurrentlySpeaking) {
              newVisualState = 'listening';
            } else if (currentState.status === 'connected') {
              newVisualState = 'idle';
            }

            this.updateState({ 
              inputVolume, 
              outputVolume,
              isUserSpeaking: isUserCurrentlySpeaking,
              isAgentSpeaking: isAgentCurrentlySpeaking,
              visualState: newVisualState,
              speakingIntensity,
              lastSpeaker: isAgentCurrentlySpeaking ? 'agent' : 
                          (isUserCurrentlySpeaking ? 'user' : currentState.lastSpeaker)
            });
          } else {
            this.updateState({ inputVolume, outputVolume });
          }
        } catch (error) {
          // Ignora errori di monitoraggio del volume (possono verificarsi se l'audio è disabilitato rapidamente)
        }
      }
    }, 100);
  }

  // Ferma il monitoraggio del volume
  private stopVolumeMonitoring(): void {
    if (this.volumeUpdateInterval) {
      clearInterval(this.volumeUpdateInterval);
      this.volumeUpdateInterval = undefined;
    }
  }

  // Imposta il volume dell'output dell'agente
  setOutputVolume(volume: number): void {
    if (!this.conversation) {
      console.warn('⚠️ Nessuna conversazione attiva per impostare il volume');
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume)); // Limita il volume tra 0 e 1
    
    try {
      this.conversation.setVolume({ volume: clampedVolume });
      console.log(`🔊 Volume impostato a: ${clampedVolume}`);
    } catch (error) {
      console.error('❌ Errore nell\'impostazione del volume:', error);
    }
  }

  // Restituisce l'ID della conversazione corrente
  getCurrentConversationId(): string | null {
    return this.conversation?.getId() || null;
  }

  // Restituisce i dati di frequenza dell'input audio
  getInputFrequencyData(): Uint8Array | null {
    return this.conversation?.getInputByteFrequencyData() || null;
  }

  // Restituisce i dati di frequenza dell'output audio
  getOutputFrequencyData(): Uint8Array | null {
    return this.conversation?.getOutputByteFrequencyData() || null;
  }

  // Restituisce lo stato attuale della conversazione
  getCurrentState(): ConversationState {
    return this.conversationStateSubject.value;
  }

  // Aggiorna lo stato della conversazione e notifica i sottoscrittori
  private updateState(newState: Partial<ConversationState>): void {
    const currentState = this.conversationStateSubject.value;
    const updatedState = {
      ...currentState,
      ...newState
    };
    
    // Log per il cambio di colore dell'agente, utile per il debug visivo
    if (newState.currentAgent && newState.currentAgent.id !== currentState.currentAgent?.id) {
      console.log(`🎨 Cambio illuminazione: ${currentState.currentAgent?.name} (${currentState.currentAgent?.color}) → ${newState.currentAgent.name} (${newState.currentAgent.color})`);
    }
    
    this.conversationStateSubject.next(updatedState);
  }

  // Metodi di convenienza per controllare lo stato
  isConnected(): boolean {
    return this.conversationStateSubject.value.status === 'connected';
  }

  isSpeaking(): boolean {
    return this.conversationStateSubject.value.isAgentSpeaking;
  }

  isListening(): boolean {
    return this.conversationStateSubject.value.isUserSpeaking;
  }

  isSDKLoaded(): boolean {
    return this.conversationStateSubject.value.sdkLoaded;
  }

  isSDKLoading(): boolean {
    return this.conversationStateSubject.value.sdkLoading;
  }

  getVisualState(): ConversationState['visualState'] {
    return this.conversationStateSubject.value.visualState;
  }

  getLastSpeaker(): 'agent' | 'user' | null {
    return this.conversationStateSubject.value.lastSpeaker;
  }

  getSpeakingIntensity(): number {
    return this.conversationStateSubject.value.speakingIntensity;
  }

  /**
   * Gestisce il tool getFilteredAnnunci per l'agente VALE
   */
  private async handleGetFilteredAnnunci(parameters: any): Promise<string> {
    try {
      console.log('🔧 getFilteredAnnunci chiamato con parametri:', parameters);
      
      // Se non abbiamo annunci caricati, caricali prima
      if (this.jobOffers.length === 0) {
        await this.loadJobOffers();
      }

      const filters = parameters || {};
      let filteredJobs = [...this.jobOffers];

      // Filtra per titolo/parole chiave
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(keywords) ||
          job.description.toLowerCase().includes(keywords) ||
          job.hard_skill.toLowerCase().includes(keywords) ||
          job.soft_skill.toLowerCase().includes(keywords)
        );
      }

      // Filtra per location (campo luogo)
      if (filters.location) {
        const location = filters.location.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.luogo.toLowerCase().includes(location)
        );
      }

      // Filtra per tipo di contratto
      if (filters.contract_type) {
        const contractType = filters.contract_type.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.contract_type.toLowerCase().includes(contractType)
        );
      }

      // Filtra per tipo di lavoro (remote, office, hybrid)
      if (filters.job_type) {
        const jobType = filters.job_type.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.job_type.toLowerCase().includes(jobType)
        );
      }

      // Filtra per range salariale (ral è stringa)
      if (filters.min_salary) {
        const minSalary = parseInt(filters.min_salary);
        filteredJobs = filteredJobs.filter(job => 
          parseFloat(job.ral) >= minSalary
        );
      }

      if (filters.max_salary) {
        const maxSalary = parseInt(filters.max_salary);
        filteredJobs = filteredJobs.filter(job => 
          parseFloat(job.ral) <= maxSalary || (job.ral_max && parseFloat(job.ral_max) <= maxSalary)
        );
      }

      // Notifica i componenti che ci sono nuovi risultati
      this.notifyJobResults(filteredJobs);
      
      const result = `Trovati ${filteredJobs.length} annunci corrispondenti ai filtri. ${filteredJobs.length > 0 ? 'Ecco le prime offerte: ' + filteredJobs.slice(0, 3).map(j => `${j.title} presso ${j.user.name} a ${j.luogo}`).join(', ') : 'Prova con criteri diversi.'}`;
      
      console.log('✅ getFilteredAnnunci risultato:', result);
      return result;

    } catch (error) {
      console.error('❌ Errore nel filtraggio degli annunci:', error);
      return `Errore nel filtraggio degli annunci: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
    }
  }

  /**
   * Carica le offerte di lavoro dall'API
   */
  private async loadJobOffers(): Promise<void> {
    try {
      console.log('📡 Caricamento offerte di lavoro...');
      
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<JobApiResponse>(
        this.jobApiUrl,
        { headers }
      ).toPromise();

      if (response && response.data) {
        this.jobOffers = response.data;
        console.log(`✅ Caricate ${response.data.length} offerte di lavoro`);
      }

    } catch (error) {
      console.error('❌ Errore nel caricamento delle offerte:', error);
      throw error;
    }
  }

  /**
   * Notifica i componenti sui nuovi risultati di lavoro
   */
  private notifyJobResults(jobs: JobOffer[]): void {
    // Emette un evento customizzato per notificare i componenti
    const event = new CustomEvent('jobResultsUpdated', { 
      detail: { jobs } 
    });
    window.dispatchEvent(event);
  }

  // Metodo chiamato quando il servizio viene distrutto (pulizia risorse)
  ngOnDestroy(): void {
    this.endConversation(); // Termina qualsiasi conversazione attiva
    this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
  }
}
