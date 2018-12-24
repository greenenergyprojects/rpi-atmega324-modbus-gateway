
import * as debugsx from 'debug-sx';
const debug: debugsx.IFullLogger = debugsx.createFullLogger('auth');

import * as path from 'path';
import * as fs from 'fs';

import * as express from 'express';
import * as jwt from 'jsonwebtoken';

import { handleError, RouterError, BadRequestError, AuthenticationError, NotFoundError } from './routers/router-error';

import { User, IUserLogin, IUserAuth } from './data/common/server/user';
import { DbUser } from './db-user';


export interface IAuthConfig {
    privatekey: string;
    publickey: string;
    authorizationUri: string;
    accessTokenTimeout: string;
    remoteTokenTimeout: string;
    remoteTokenMinimumSeconds: number;
    serverUri?: string;
    foreignLogin?: [ { userid: string, account: [ string | RegExp ] } ];
}


export class Auth {

    public static async createInstance (config?: IAuthConfig): Promise<Auth> {
        if (Auth._instance) { throw new Error('instance already created'); }
        Auth._instance = new Auth();
            // Object.seal(this._instance);
            // Object.seal(this._instance.constructor);
        await Auth._instance.init(config);
        return Auth._instance;
    }

    public static getInstance (): Auth {
        if (!this._instance) { throw new Error('instance not created yet'); }
        return this._instance;
    }

    private static _instance: Auth;


    // **********************************

    private _config: IAuthConfig;
    private _privateKey: Buffer;
    private _publicKey: Buffer;

    private constructor () {
    }

    public get authorizationUri (): string {
        return this._config && this._config.authorizationUri;
    }

    public createRemoteToken (data: string | object | Buffer): string {
        return this.createToken(data, this._config.remoteTokenTimeout, this._config.remoteTokenMinimumSeconds);
    }

    public createAccessToken (data: string | object | Buffer): string {
        return this.createToken(data, this._config.accessTokenTimeout);
    }

    public async verifyToken (token: string): Promise<string | object> {
        let cause: any;
        const rv = await new Promise<string | object>( (resolve, reject) => {
            jwt.verify(token, this._publicKey, (err, decoded) => {
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
            throw new Error('invalid token');
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
            const user = DbUser.getInstance().getUser(tContent.userid);
            if (user) {
                (<IRequestWithUser>req).user = {
                    userid: tContent.userid,
                    iat: tContent.iat,
                    exp: tContent.exp,
                    model: user
                };
                next();
            } else {
                throw new AuthenticationError('invalid user ' + tContent.userid);
            }
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }


    public async handleGetAuth (req: IRequestWithUser, res: express.Response, next: express.NextFunction) {
        try {
            const m = req.user.model;
            if (!(m instanceof User)) { throw new Error('invalid user model in request'); }

            const tokenContent: ITokenRequest = {
                userid: req.user.userid,
                type: 'access'
            };
            const userAuth: IUserAuth = {
                 userid: req.user.userid,
                 token: { type: 'asscess', value: this.createAccessToken(tokenContent) }
            };
            if (m.surename) { userAuth.surename = m.surename; }
            if (m.firstname) { userAuth.firstname = m.firstname; }
            if (m.isAdmin) { userAuth.isAdmin = m.isAdmin; }
            res.json(userAuth);
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    public async handlePostAuth (req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userLogin = <IUserLogin>req.body;
            let authorizedByUserId: string;
            try {
                DbUser.getInstance().verifyPassword(userLogin.userid, userLogin.password);
                authorizedByUserId = userLogin.userid;
            } catch (err) {
                if (Array.isArray(this._config.foreignLogin)) {
                    cfgLoop: for (const cfg of this._config.foreignLogin) {
                        if (cfg.userid && userLogin.password.startsWith(cfg.userid)) {
                            const pw = userLogin.password.substr(cfg.userid.length);
                            try {
                                DbUser.getInstance().verifyPassword(cfg.userid, pw);
                                for (const a of cfg.account) {
                                    const filter = a instanceof RegExp ? a : new RegExp(a.substring(1, a.length - 1));
                                    if (cfg.userid.match(filter)) {
                                        authorizedByUserId = cfg.userid;
                                        break cfgLoop;
                                    }
                                }
                            } catch (err) {}
                        }
                    }
                }
                if (!authorizedByUserId) {
                    throw new AuthenticationError('invalid password for user ' + userLogin.userid);
                }
                debug.warn('Login ' + userLogin.userid + ' authorized by ' + authorizedByUserId);

            }
            const tokenContent: ITokenRequest = {
                userid: userLogin.userid,
                type: 'remote'
            };
            const userAuth: IUserAuth = {
                 userid: authorizedByUserId,
                 token: { type: 'remote', value: this.createRemoteToken(tokenContent) }
            };
            const u = DbUser.getInstance().getUser(userLogin.userid);
            if (u && u.surename) { userAuth.surename = u.surename; }
            if (u && u.firstname) { userAuth.firstname = u.firstname; }
            if (u && u.isAdmin) { userAuth.isAdmin = u.isAdmin; }

            if (req.headers['content-type'] === 'application/json') {
                // login request send from ngx application, response json
                if (debug.fine.enabled) {
                    debug.fine('handleLogin(): login %s -> response %o', userAuth);
                }
                res.json(userAuth);
            } else {
                throw new BadRequestError('missing application/json in header');
            }
        } catch (err) {
            handleError(err, req, res, next, debug);
        }
    }

    // **********************************************************************

    private async init (config: IAuthConfig) {
        this._config = config;
        if (!config) { throw new Error('missing config'); }
        if (!config.privatekey) { throw new Error('missing config.privatekey'); }
        if (!config.publickey) { throw new Error('missing config.publickey'); }

        const privFileName = path.join(__dirname, '..', this._config.privatekey);
        try {
            this._privateKey = fs.readFileSync(privFileName);
        } catch (err) {
            throw new AuthError('invalid/missing private key (' + privFileName + ')', err);
        }

        const pubFileName = path.join(__dirname, '..', this._config.publickey);
        try {
            this._publicKey = fs.readFileSync(pubFileName);
        } catch (err) {
            throw new AuthError('invalid/missing public key (' + pubFileName + ')', err);
        }

        try {
            const token1 = await this.createRemoteToken({}); await this.verifyToken(token1);
            const token2 = await this.createAccessToken({}); await this.verifyToken(token2);
        } catch (err) {
            throw new AuthError('cannot create tokens with given keys/parameters', err);
        }
    }

    private createToken (data: string | object | Buffer, expiresIn: string, minSeconds?: number): string {
        const f = expiresIn.split(':');
        if (f.length === 3) {
            const now = new Date();
            const expTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +f[0], +f[1], +f[2] );
            let seconds = Math.floor((expTime.getTime() - now.getTime()) / 1000);
            if (seconds < this._config.remoteTokenMinimumSeconds) {
                seconds += 24 * 60 * 60; // timeout on next day
            }
            seconds = minSeconds ? Math.max(seconds, minSeconds) : seconds;
            expiresIn =  seconds + 's';
        }
        const token = jwt.sign(data, this._privateKey, { expiresIn: expiresIn, algorithm: 'RS256' });
        return token;
    }


}

interface ITokenRequest {
    userid: string;
    type: 'remote' | 'access';
}

interface ITokenContent {
    userid: string;
    type: 'remote' | 'request';
    iat: number;
    exp: number;
}

export interface IRequestUser {
    userid: string;
    iat: number;
    exp: number;
    model: User;
}

export interface IRequestWithUser extends express.Request {
    user: IRequestUser;
}

export class AuthError extends Error {

    constructor (msg: string, public cause?: Error) {
        super(msg);
    }
}
