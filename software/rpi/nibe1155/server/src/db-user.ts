
import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('dbUser');

import { User } from './data/common/nibe1155/user';
const sha256 = require('sha256');

export interface IDbUserConfig {
    users?: {
        userid: string;
        surname?: string;
        firstname?: string;
        isAdmin?: boolean;
        disabled?: boolean;
        password: string;
        passwordType?: 'raw' | 'sha-256';
    } [];
}


export class DbUser {

    public static async createInstance (config?: IDbUserConfig): Promise<DbUser> {
        if (DbUser._instance) { throw new Error('instance already created'); }
        DbUser._instance = new DbUser();
            // Object.seal(this._instance);
            // Object.seal(this._instance.constructor);
        await DbUser._instance.init(config);
        return DbUser._instance;
    }

    public static getInstance (): DbUser {
        if (!this._instance) { throw new Error('instance not created yet'); }
        return this._instance;
    }

    private static _instance: DbUser;


    // **********************************

    private _config: IDbUserConfig;
    private _users: { [ id: string ]: { model: User, password: string, passwordType: 'raw' | 'sha-256' } } = {};

    private constructor () {
    }

    public getUser (userid: string): User {
        const u = this._users[userid];
        return u && u.model;
    }

    public verifyPassword (userid: string, password: string, passwordType?: 'raw' | 'sha-256') {
        const user = this._users[userid];
        if (!user) {
            throw new Error('userid ' + userid + 'not known');
        }
        if (!passwordType) { passwordType = 'raw'; }

        if (passwordType === user.passwordType) {
            if (password !== user.password) { throw new Error('invalid password'); }

        } else if (user.passwordType === 'sha-256' && passwordType === 'raw') {
            const p = sha256(password);
            if (p !== user.password) { throw new Error('invalid password'); }

        } else if (user.passwordType === 'raw' && passwordType === 'sha-256') {
            const p = sha256(user.password);
            if (p !== password) { throw new Error('invalid password'); }

        } else {
            throw new Error('invalid password type');
        }
    }

    private async init (config: IDbUserConfig) {
        this._config = config;
        if (Array.isArray(config.users)) {
            for (const u of config.users) {
                if (u.disabled === true) {
                    continue;
                }
                try {
                    const x = Object.assign({}, u);
                    delete x.password;
                    delete x.passwordType;
                    delete x.disabled;
                    const m = new User(x);
                    if (!u.passwordType) { u.passwordType = 'raw'; }
                    this._users[m.userid] = { model: m, password: u.password, passwordType: u.passwordType };
                } catch (err) {
                    debug.warn('error on users config for user %o', u);
                }
            }
        }

    }
}
