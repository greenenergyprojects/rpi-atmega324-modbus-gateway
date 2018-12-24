
import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('dbUser');

import { User } from './data/common/server/user';


export interface IDbUserConfig {
    users?: {
        userid: string;
        surname?: string;
        firstname?: string;
        isAdmin?: boolean;
        disabled?: boolean;
        password: string;
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
    private _users: { [ id: string ]: { model: User, passwordHash: string } } = {};

    private constructor () {
    }

    public getUser (userid: string): User {
        const u = this._users[userid];
        return u && u.model;
    }

    public verifyPassword (userid: string, password: string) {
        const user = this._users[userid];
        if (!user) { 
            throw new Error('userid ' + userid + 'not known');
        }
        if (user.passwordHash !== password) {
            throw new Error('invalid password');
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
                    const m = new User(x);
                    this._users[m.userid] = { model: m, passwordHash: u.password };
                } catch (err) {
                    debug.warn('error on users config for user %o', u);
                }
            }
        }

    }
}
