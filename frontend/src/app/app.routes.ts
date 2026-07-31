import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransbordoComponent } from './components/transbordo/transbordo.component';
import { ConhecimentoComponent } from './components/conhecimento/conhecimento.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transbordo', component: TransbordoComponent },
  { path: 'conhecimento', component: ConhecimentoComponent },
  { path: '**', redirectTo: 'dashboard' },
];
