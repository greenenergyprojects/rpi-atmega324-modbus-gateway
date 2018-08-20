import * as debugsx from 'debug-sx';
const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('database:Database');

import * as nconf from 'nconf';
import { clearInterval } from 'timers';

import { User } from './user';




export class Database {

    public static async createInstance (): Promise<Database> {
        if (Database._instance) { throw new Error('instance already created'); }
        Database._instance = new Database();
        await Database._instance.start();
        return Database._instance;
    }

    private static _instance: Database;

    public static get Instance (): Database {
        if (!Database._instance) { throw new Error('database not available yet'); }
        return Database._instance;
    }

    // ***************************************

    private _config: IConfigDatabase;
    private _timer: NodeJS.Timer;

    private constructor () {
        this._config = nconf.get('database');
    }


    public async getUser (userid: string): Promise<User> {
        const users = (this._config && Array.isArray(this._config.users)) ? this._config.users : [];
        const user = users.find( (u) => { return u.id === userid; } );
        if (user) {
            return new User({userid: user.id, password: user.password });
        } else {
            return undefined;
        }
    }


    private async start () {
    }

}


interface IConfigDatabase {
    users: {
        id: string;
        password: string;
    } [];
}
