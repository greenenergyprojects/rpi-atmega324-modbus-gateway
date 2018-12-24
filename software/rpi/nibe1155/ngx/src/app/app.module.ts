import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NavbarComponent } from './navbar/navbar.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ModalLoginComponent } from './modals/modal-login';
import { SyncButtonComponent } from './components/sync-button.component';
import { OverviewComponent } from './components/overview.component';
import { OverviewChartComponent } from './components/overview-chart.component';
import { BoilerComponent } from './components/boiler.component';
import { BoilerControllerComponent } from './components/boiler-controller.component';
import { HeatingControllerComponent } from './components/heating-controller.component';
import { FroniusSymoComponent } from './components/fronius-symo.component';
import { Nibe1155Component } from './components/nibe1155.component';

import { ConfigService } from './services/config.service';
import { DataService } from './services/data.service';
import { ServerService } from './services/server.service';
import { AuthService } from './services/auth.service';
import { AddAuthHeaderInterceptor } from './services/add-auth-header.interceptor';
import { ValidatorDirective } from './directives/validator.directive';

import { ChartsModule } from 'ng4-charts/ng4-charts';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEye, faEyeSlash, faSpinner, faSync } from '@fortawesome/free-solid-svg-icons';
library.add(faEye, faEyeSlash, faSpinner, faSync);

@NgModule({
    declarations: [
        ValidatorDirective,
        NavbarComponent, AppComponent, ModalLoginComponent, SyncButtonComponent,
        OverviewComponent, OverviewChartComponent,
        BoilerComponent, BoilerControllerComponent, HeatingControllerComponent,
        FroniusSymoComponent,
        Nibe1155Component
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule, ReactiveFormsModule,
        HttpClientModule,
        NgbModule, NgbAccordionModule,
        FontAwesomeModule, ChartsModule
    ],
    providers: [
        ConfigService,
        DataService,
        ServerService,
        AuthService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AddAuthHeaderInterceptor,
            multi: true,
        }
    ],
    entryComponents: [ ModalLoginComponent ],
    bootstrap: [AppComponent]
})
export class AppModule { }
