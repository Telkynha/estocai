import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { MovimentacoesComponent } from './pages/movimentacoes/movimentacoes.component';
import { EstatisticasComponent } from './pages/estatisticas/estatisticas.component';
import { ConfigComponent } from './components/forms/config/config.component';
import { AcessoComponent } from './components/forms/acesso/acesso.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'estoque', component: EstoqueComponent },
    { path: 'movimentacoes', component: MovimentacoesComponent },
    { path: 'estatisticas', component: EstatisticasComponent },
    { path: 'config', component: ConfigComponent },
    { path: 'acesso', component: AcessoComponent },
    { path: '**', redirectTo: '' }
];