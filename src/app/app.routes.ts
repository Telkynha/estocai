import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { MovimentacoesComponent } from './pages/movimentacoes/movimentacoes.component';
import { ConfigComponent } from './components/forms/config/config.component';
import { AcessoComponent } from './components/forms/acesso/acesso.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { 
        path: '', 
        component: HomeComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'estoque', 
        component: EstoqueComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'movimentacoes', 
        component: MovimentacoesComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'config', 
        component: ConfigComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'acesso', 
        component: AcessoComponent 
    },
    { 
        path: '**', 
        redirectTo: '' 
    }
];