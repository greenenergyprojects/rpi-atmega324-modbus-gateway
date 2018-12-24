import { Injectable, isDevMode, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { IUserLogin, User, IUserAuth } from '../data/common/server/user';
import { AuthService } from './auth.service';
import { IModalLoginConfig, ModalLoginComponent } from '../modals/modal-login';


@Injectable()
export class ServerService {

    private _viewContainerRefs: ViewContainerRef [] = [];
    private _isModalLoginEnabled = false;
    private _isModalLoginActive = false;
    private _serverUri: string;
    private _authServerUri: string;
    private _authUri: string;
    private _remoteToken: string;
    private _autoLogin: IUserLogin; // = { userid: 'test', password: 'geheim' };

    constructor (private httpClient: HttpClient, private _authService: AuthService, private _componentFactoryResolver: ComponentFactoryResolver) {
        // ng serve      --> development mode, server running on same host
        // npm run build --prod --> production mode, server can run on any host and supports loading ngx app
        this._serverUri = isDevMode() ? 'http://localhost:8080' : '';
        this._authServerUri = isDevMode() ? 'http://localhost:8080' : '';
        this._authUri = this._authServerUri + '/auth';
    }

    public get isModalLoginEnabled (): boolean {
        return this._isModalLoginEnabled;
    }

    public set enableModalLogin (enable: boolean) {
        this._isModalLoginEnabled = enable;
    }

    public get isModalLoginActive (): boolean {
        return this._isModalLoginActive;
    }

    public pushViewContainerRef (viewContainerRef: ViewContainerRef) {
        if (!viewContainerRef) { throw new Error('illegal argument'); }
        this._viewContainerRefs.push(viewContainerRef);
        this._isModalLoginEnabled = true;
    }

    public popViewContainerRef (): ViewContainerRef {
        if (this._viewContainerRefs.length === 0) {
            return null;
        } else {
            const rv = this._viewContainerRefs.splice(this._viewContainerRefs.length - 1, 1)[0];
            if (this._viewContainerRefs.length === 0) {
                this._isModalLoginEnabled = false;
            }
        }
    }

    // public async httpGetJson (resource: string): Promise<Object> {
    //     try {
    //         const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    //         const uri = this._serverUri + resource;
    //         const response = await this.httpClient.get(uri, { headers: headers, responseType: 'json' }).toPromise();
    //         return response;
    //     } catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    public async httpGetJson (resource: string, options?: { headers?: HttpHeaders }, token?: string): Promise<any> {
        if (!this.isModalLoginEnabled) {
            try {
                return this.performHttpGetJson(resource, options, token);
            } catch (err) {
                console.log(err);
                throw err;
            }
        } else {
            let cnt = 0;
            while (true) {
                try {
                    const response = await this.performHttpGetJson(resource, options, token);
                    return response;
                } catch (err) {
                    await this.handleHttpError(err, cnt++);
                }
            }
        }
    }


    public async httpPostAndGetJson (resource: string, data: any,  options?: { headers?: HttpHeaders }, token?: string): Promise<any> {
        if (!this.isModalLoginEnabled) {
            try {
                return this.performHttpPostAndGetJson(resource, data, options, token);
            } catch (err) {
                console.log(err);
                throw err;
            }
        } else {
            let cnt = 0;
            while (true) {
                try {
                    const response = await this.performHttpPostAndGetJson(resource, data, options, token);
                    return response;
                } catch (err) {
                    await this.handleHttpError(err, cnt++);
                }
            }
        }
    }


    public async authenticate (userid?: string, remoteToken?: string): Promise<void> {
        if (this._remoteToken && this._authService.userid) {
            this._authService.token = this._remoteToken;
        } else if (userid && remoteToken) {
            this._authService.userid = userid;
            this._authService.token = remoteToken;
        } else {
            const config: IModalLoginConfig = {
                title: userid ? 'Anmeldung erneuern...' : null,
                userid: userid,
                loginButtonText: userid ? 'Weiter' : null
            };
            // const userLogin = await this.performModalLoginDialog(viewContainerRef, config);
            let userLogin: IUserLogin;
            let response: IUserAuth;
            while (!response || response.userid !== userLogin.userid || !response.token || response.token.type !== 'remote') {
                if (this._autoLogin) {
                    userLogin = this._autoLogin;
                    this._autoLogin = undefined;
                } else {
                    userLogin = await this.performModalLoginDialog(config);
                }
                try {
                    response = <IUserAuth> await this.performHttpPostAndGetJson(this._authUri, userLogin);
                    if (!response.userid || !response.token.value) {
                        console.log('Error: invalid response from auth server');
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            this._remoteToken = response.token.value;
            this._authService.userid = response.userid;
            this._authService.token = response.token.value;
        }

        try {
            const response2: any = await this.performHttpGetJson('/auth');
            if (response2.htlid !== this._authService.userid || !response2.accessToken || !response2.user) {
                throw new Error('invalid get auth response');
            }
            if (!response2.htlid || !response2.accessToken || !response2.user) {
                console.log('Error: invalid response from auth server');
            }
            this._authService.userid = response2.htlid;
            this._authService.token = response2.accessToken;
            this._authService.user = new User(response2.user);
        } catch (err) {
            if (err instanceof HttpErrorResponse && err.status === 401) {
                this.extractAuthUriFromHeader(err.headers);
                this._remoteToken = undefined;
                const rv = await this.authenticate(userid, undefined);
                return rv;
            }
            throw err;
        }
    }

    // ***************************************************************************

    private async performModalLoginDialog (config: IModalLoginConfig, viewContainerRef?: ViewContainerRef): Promise<IUserLogin> {
        if (!this.isModalLoginEnabled) { throw new Error('ModalLogin disabled'); }
        if (this.isModalLoginActive) { throw new Error('modal login is active'); }
        console.log('---> open modal login');
        this._isModalLoginActive = true;
        try {
            viewContainerRef = viewContainerRef || this._viewContainerRefs[this._viewContainerRefs.length - 1];
            const factory = this._componentFactoryResolver.resolveComponentFactory(ModalLoginComponent);
            const modalLoginRef = viewContainerRef.createComponent(factory);
            modalLoginRef.changeDetectorRef.detectChanges();
            const modalLoginComponent: ModalLoginComponent = (<any>modalLoginRef)._component;

            try {
                const rv = await modalLoginComponent.show(config);
                const index = viewContainerRef.indexOf(<any>modalLoginRef);
                viewContainerRef.remove(index);
                return rv;
            } catch (err) {
                const index = viewContainerRef.indexOf(<any>modalLoginRef);
                viewContainerRef.remove(index);
                throw err;
            }
        } finally {
            console.log('---> close modal login');
            this._isModalLoginActive = false;
        }
    }

    private async handleHttpError(err: any, cnt: number) {
        console.log(err);
        if (err instanceof HttpErrorResponse && err.status === 401) {
            if (cnt++ > 0) {
                console.log('server authorization problem');
            }
            this.extractAuthUriFromHeader(err.headers);
            await this.authenticate();
        } else {
            throw err;
        }
    }

    private extractAuthUriFromHeader (headers: HttpHeaders) {
        const authHeader = headers.get('WWW-Authenticate');
        if (authHeader && authHeader.indexOf('Bearer') >= 0) {
            const fname = 'authorization_uri="';
            let index1 = authHeader.indexOf(fname);
            index1 = index1 < 0 ? index1 : index1 + fname.length;
            const index2 = index1 < 0 ? -1 : authHeader.indexOf('"', index1);
            if (index1 >= 0 && index2 >= 0 && index2 > index1) {
                const newAuthUri = this._authServerUri +  authHeader.substring(index1, index2);
                if (this._authUri !== newAuthUri) {
                    this._authUri = newAuthUri;
                    console.log('new authorization_uri ' + this._authUri);
                }
                return;
            }
        }
        console.log('Warning: cannot extract authorization_uri from header WWW-Authenticate');
    }

    private async performHttpGetJson (resource: string, options?: { headers?: HttpHeaders }, token?: string): Promise<Object> {
        if (!resource) {
            return Promise.reject(new Error('invalid arguments'));
        }
        let headers = options && options.headers ? options.headers : new HttpHeaders({
            'Content-Type': 'application/json',
        });
        if (token) {
            headers = headers.append('Authorization', 'Bearer ' + token);
        }
        const httpClientOptions = { headers: headers };
        const uri = resource === '/auth' ? this._authUri : this._serverUri + resource;
        try {
            const response = await this.httpClient.get(uri, { headers: headers, responseType: 'json' }).toPromise();
            return response;
        } catch (err) {
            throw err;
        }
    }

    private async performHttpPostAndGetJson (resource: string, body: any,
                                             options?: { headers?: HttpHeaders }, token?: string): Promise<Object> {
        if (!resource || !body) {
            return Promise.reject(new Error('invalid arguments'));
        }
        let headers = options && options.headers ? options.headers : new HttpHeaders({
            'Content-Type': 'application/json',
        });
        if (token) {
            headers = headers.append('Authorization', 'Bearer ' + token);
        }
        const uri = resource !== this._authUri ? this._serverUri + resource : this._authUri;
        return await this.httpClient.post(uri, body, { headers: headers, responseType: 'json' } ).toPromise();
    }



}
