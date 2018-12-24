import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { IUserAuth, User } from './data/common/server/user';
import { ServerService } from './services/server.service';
import { AuthService } from './services/auth.service';
import { UseExistingWebDriver } from 'protractor/built/driverProviders';
import { IServerVersion } from './data/common/server/server-version';
import { ISyncButtonConfig } from './components/sync-button.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'Home Control';
    cnt = 1;

    buttonConfig: ISyncButtonConfig = {
        text: 'Hello',
        classes: {
            default: 'btn btn-primary',
            onBusy: 'btn btn-secondary',
            onSuccess: 'btn btn-success',
            onError: 'btn btn-danger'
        },
        handler: {
            onClick: (config) => this.helloClicked(config)
        }
    };

    public constructor (private _viewContainerRef: ViewContainerRef, private _serverService: ServerService, private _authService: AuthService ) {
        this._serverService.pushViewContainerRef(this._viewContainerRef);
    }

    public async ngOnInit () {
        try {
            const v = <IServerVersion> await this._serverService.httpGetJson('/version', null);

            if (v && v.user && v.user.token) {
                const x = Object.assign( {}, v.user);
                delete x.token;
                const user = new User(x);
                this._authService.userid = user.userid;
                this._authService.token = v.user.token.value;
                this._authService.user = user;
                console.log('set user', user.toObject());
            }
        } catch (err) {
            console.log(err);
        }
    }

    public async test () {
        console.log('test');
        this._serverService.httpGetJson('/test');
    }

    private async helloClicked (config: ISyncButtonConfig): Promise<void> {
        return new Promise<void>( (res, rej) => {
            config.handler.onCancel = (cfg) => {
                rej(new Error(cfg.text + ' ' + this.cnt++ + ' XXX'));
            };
            setTimeout( () => { res(); }, 2000);
        });
    }

}
