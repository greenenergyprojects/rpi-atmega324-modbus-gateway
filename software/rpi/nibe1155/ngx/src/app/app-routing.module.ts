import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OverviewComponent } from './components/overview.component';
import { FroniusSymoComponent } from './components/fronius-symo.component';
import { BoilerComponent } from './components/boiler.component';
import { Nibe1155Component } from './components/nibe1155.component';

const routes: Routes = [
    { path: '', redirectTo: '/app/overview', pathMatch: 'full' },
    { path: 'app/overview', component: OverviewComponent },
    // { path: 'app/grid', component: GridComponent },
    // { path: 'app/froniusmeter', component: FroniusmeterComponent },
    { path: 'app/froniussymo', component: FroniusSymoComponent },
    { path: 'app/boiler', component: BoilerComponent },
    { path: 'app/nibe1155', component: Nibe1155Component }
];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
