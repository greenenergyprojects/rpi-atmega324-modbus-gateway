import * as path from 'path';
import * as fs from 'fs';

import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as nconf from 'nconf';

import { handleError, RouterError, BadRequestError, AuthenticationError, NotFoundError } from './routers/router-error';
import { UserLogin, IUserLogin } from './client/user-login';
import { User, IUser } from './db/user';
import { Database } from './db/database';
import { IRequestWithUser, IRequestUser } from './server';
// import { delayMillis } from './utils/util';

import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('auth');

export class Auth {

    public static async createInstance(): Promise<Auth> {
        if (Auth._instance) { throw new Error('instance already created'); }
        Auth._instance = new Auth();
            // Object.seal(this._instance);
            // Object.seal(this._instance.constructor);
        await Auth._instance.init();
        return Auth._instance;
    }

    private static _instance: Auth;

    public static get Instance (): Auth {
        if (!this._instance) { throw new Error('instance not created yet'); }
        return this._instance;
    }


    // **********************************

    private _configAuth: IConfigAuth;
    private _privateKey: Buffer;
    private _publicKeys: Buffer [] = [];
    private _mapUser: { [htlid: string]: User } = {};

    private constructor () {
    }

    public get authServerUri (): string {
        return this._configAuth.server_uri;
    }

    public async handleGetAuth (req: IRequestWithUser, res: express.Response, next: express.NextFunction) {
        try {
            const userAuth: IUserAuth = { htlid: req.user.id };
            userAuth.accessToken = this.createAccessToken({htlid: req.user.id, type: 'access'});
            const u = await Database.Instance.getUser(req.user.id);
            if (!u || u.userid !== req.user.id) {
                throw new AuthenticationError('cannot refresh user ' + req.user.id + ' from database');
            }
            this._mapUser[u.userid] = u;
            userAuth.user = u.toIAuthUser();
            // await delayMillis(500);
            res.json(userAuth);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    public async handlePostAuth (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            let userLogin: UserLogin;
            try {
                userLogin = new UserLogin(req.body);
            } catch (err) {
                throw new AuthenticationError('invalid request body for userLogin');
            }
            const user = await Database.Instance.getUser(userLogin.id);
            if (!user) {
                if (this._mapUser[userLogin.id]) {
                    delete this._mapUser[userLogin.id];
                }
                throw new AuthenticationError('unknown user ' + userLogin.id);
            }
            this._mapUser[user.userid] = user;

            if (!user.verifyPassword(userLogin.password)) {
                throw new AuthenticationError('invalid password for user ' + userLogin.id);
            }
            const userAuth: IUserAuth = { htlid: user.userid };
            let token: string;
            if (userLogin.stayLoggedIn === undefined || userLogin.stayLoggedIn === true) {
                token = this.createRemoteToken({htlid: user.userid, type: 'remote'});
                userAuth.remoteToken = token;
            } else {
                token = this.createRemoteToken({htlid: user.userid, type: 'access'});
                userAuth.accessToken = token;
            }
            if (req.headers['content-type'] === 'application/json') {
                // login request send from ngx application, response json
                if (debug.fine.enabled) {
                    debug.fine('handleLogin(): login %s -> response htlid and tokens', user.userid);
                }
                // res.json({ htlid: req.user.htlid, remoteToken: req.remoteToken, accessToken: req.accessToken });
                userAuth.user = user.toIAuthUser();
                // await delayMillis(500);
                res.json(userAuth);
            } else {
                // login request send from non ngx html form, response ngx application
                if (debug.fine.enabled) {
                    debug.fine('handleLogin(): login %s (urlenc) -> response ngmain including htlid and tokens', user.userid);
                }
                res.render('ngmain.pug', { htlid: userAuth.htlid, token: token });
            }
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    public async authorizeRequest (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const hAuth = req.headers.authorization;
            if (!hAuth || typeof hAuth !== 'string' || !hAuth.startsWith('Bearer ')) {
                 throw new AuthenticationError('missing proper bearer token');
            }
            const token = hAuth.substr(7);

            let tContent: ITokenContent;
            try {
                tContent = <ITokenContent>await this.verifyToken(token);
            } catch (err) {
                debug.fine('%s %s -> authorization error\n%e', req.method, req.originalUrl, err);
                throw new AuthenticationError('invalid token');
            }
            if (tContent.exp * 1000 <= Date.now()) {
                throw new AuthenticationError('token expired');
            }
            const user = this._mapUser[ tContent.id ];
            if (!user) { throw new AuthenticationError('token not accepted'); }

            (<IRequestWithUser>req).user = {
                id: tContent.id,
                iat: tContent.iat,
                exp: tContent.exp,
                model: user
            };
            next();

        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    public createRemoteToken (data: string | object | Buffer): string {
        return this.createToken(data, this._configAuth.remoteTokenTimeout, this._configAuth.remoteTokenMinimumSeconds);
    }

    public createAccessToken (data: string | object | Buffer): string {
        return this.createToken(data, this._configAuth.accessTokenTimeout);
    }

    public async verifyToken (token: string): Promise<string | object> {
        const errors: any [] = [];
        for (const pk of this._publicKeys) {
            try  {
                const rv = this.decodeToken(token, pk);
                return rv;
            } catch (err) {
                errors.push(err);
            }
        }
        if (errors.length > 0) {
            throw errors[0];
        } else {
            throw new Error('decoding fails');
        }
    }

    // *****************************************************************************

    private async init (): Promise<void> {
        this._configAuth = nconf.get('auth');
        if (!this._configAuth || !this._configAuth.privatekey || !this._configAuth.publickey ||
            !this._configAuth.authorization_uri || !this._configAuth.accessTokenTimeout ||
            !this._configAuth.remoteTokenTimeout || !this._configAuth.remoteTokenMinimumSeconds) {
            throw new Error('missing data in config.auth');
        }
        const privFileName = path.join(__dirname, '..', this._configAuth.privatekey);
        this._privateKey = fs.readFileSync(privFileName);
        this._configAuth.publickey = Array.isArray(this._configAuth.publickey) ?
                                         this._configAuth.publickey : [ this._configAuth.publickey ];
        for (const fn of this._configAuth.publickey) {
            const pubFileName = fn.startsWith('/') ? fn : path.join(__dirname, '..', fn);
            this._publicKeys.push(fs.readFileSync(pubFileName));
        }

        // check if keys are porper working
        const token1 = await this.createRemoteToken({}); await this.verifyToken(token1);
        const token2 = await this.createAccessToken({}); await this.verifyToken(token2);
    }

    private async decodeToken (token: string, publicKey: Buffer): Promise<string | object> {
        let cause: any;
        const rv = await new Promise<string | object>( (resolve, reject) => {
            jwt.verify(token, publicKey, (err, decoded) => {
                if (err) {
                    cause = err;
                    resolve(undefined);
                } else {
                    resolve(decoded);
                }
            });
        });
        if (rv) {
            return rv;
        } else if (cause instanceof Error) {
            throw cause;
        } else {
            throw new Error('invalid token or publickey');
        }
    }

    private createToken (data: string | object | Buffer, expiresIn: string, minSeconds?: number): string {
        const f = expiresIn.split(':');
        if (f.length === 3) {
            const now = new Date();
            const expTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +f[0], +f[1], +f[2] );
            let seconds = Math.floor((expTime.getTime() - now.getTime()) / 1000);
            if (seconds < this._configAuth.remoteTokenMinimumSeconds) {
                seconds += 24 * 60 * 60; // timeout on next day
            }
            seconds = minSeconds ? Math.max(seconds, minSeconds) : seconds;
            expiresIn =  seconds + 's';
        }
        const token = jwt.sign(data, this._privateKey, { expiresIn: expiresIn, algorithm: 'RS256' });
        return token;
    }

}

interface ITokenContent {
    id: string;
    type: string;
    iat: number;
    exp: number;
}

export class DbAuthError extends Error {
    private _description: string;

    constructor(message: string, description?: string) {
        super(message);
        this._description = description;
    }

    public get description (): string {
        return this._description || 'no detail description available';
    }
}

export interface IConfigAuth {
    server_uri?: string;
    privatekey: string;
    publickey: string | string [];
    authorization_uri: string;
    accessTokenTimeout: string;
    remoteTokenTimeout: string;
    remoteTokenMinimumSeconds: number;
}

export interface IUserAuth {
    htlid: string;
    accessToken?: string;
    remoteToken?: string;
    user?: IUser;
}

