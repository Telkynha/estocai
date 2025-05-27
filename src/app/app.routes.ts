import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { MovimentacoesComponent } from './pages/movimentacoes/movimentacoes.component';
import { EstatisticasComponent } from './pages/estatisticas/estatisticas.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'estoque', component: EstoqueComponent },
    { path: 'movimentacoes', component: MovimentacoesComponent },
    { path: 'estatisticas', component: EstatisticasComponent },
];
