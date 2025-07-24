import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component'; // Importa HomeComponent direttamente

export const routes: Routes = [
  // Rotta per la Home (senza MainLayoutComponent)
  {
    path: '', // Questo intercetterà sia '/' che '/home' se vuoi che sia la stessa pagina
    component: HomeComponent
  },
  {
    path: 'home', // Puoi avere anche una rotta esplicita per '/home' se serve
    component: HomeComponent
  },

  // Rotte che usano MainLayoutComponent come layout principale
  {
    path: '', // Questa è una rotta 'dummy' che serve solo a raggruppare le child routes
    component: MainLayoutComponent,
    children: [
      // Le rotte child non devono avere un path vuoto se la parent path è vuota e non vuoi che si sovrapponga
      // {
      //   path: '', // Rimuovi o commenta questa riga se hai già la Home di primo livello
      //   loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      // },
      // {
      //   path: 'home', // Rimuovi o commenta questa riga
      //   loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      // },
      {
        path: 'chi-siamo',
        loadComponent: () => import('./pages/chi-siamo/chi-siamo.component').then(m => m.ChiSiamoComponent)
      },
      {
        path: 'vale',
        loadComponent: () => import('./pages/vale/vale.component').then(m => m.ValeComponent)
      },
      {
        path: 'contatti',
        loadComponent: () => import('./pages/contatti/contatti.component').then(m => m.ContattiComponent)
      },
      {
        path: 'prodotti',
        loadComponent: () => import('./pages/prodotti/prodotti.component').then(m => m.ProdottiComponent)
      },
      {
        path: 'consulenza',
        loadComponent: () => import('./pages/consulenza/consulenza.component').then(m => m.ConsulenzaComponent)
      },
      {
        path: 'formazione',
        loadComponent: () => import('./pages/formazione/formazione.component').then(m => m.FormazioneComponent)
      }
    ]
  },

  // Rotta wildcard per gestire percorsi non trovati, reindirizza alla Home
  { path: '**', redirectTo: '' }
];