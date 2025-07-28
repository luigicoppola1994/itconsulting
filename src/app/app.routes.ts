import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  // Rotta per la Home (componente standalone)
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full' // IMPORTANTE: specifica che deve matchare esattamente il path vuoto
  },
  
  // Rotta esplicita per /home (opzionale, se vuoi che /home porti alla stessa pagina)
  {
    path: 'home',
    component: HomeComponent
  },

  // Rotte degli agenti che usano MainLayoutComponent
  {
    path: 'vale',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/vale/vale.component').then(m => m.ValeComponent)
      }
    ]
  },
  
  {
    path: 'chi-siamo',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/chi-siamo/chi-siamo.component').then(m => m.ChiSiamoComponent)
      }
    ]
  },
  
  {
    path: 'contatti',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/contatti/contatti.component').then(m => m.ContattiComponent)
      }
    ]
  },
  
  {
    path: 'prodotti',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/prodotti/prodotti.component').then(m => m.ProdottiComponent)
      }
    ]
  },
  
  {
    path: 'consulenza',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/consulenza/consulenza.component').then(m => m.ConsulenzaComponent)
      }
    ]
  },
  
  {
    path: 'formazione',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/formazione/formazione.component').then(m => m.FormazioneComponent)
      }
    ]
  },

  // Rotta wildcard per gestire percorsi non trovati
  { 
    path: '**', 
    redirectTo: '' 
  }
];