import { DataRecord } from '../data-record';

export interface IUserLogin {
    userid: string;
    password: string;
}

export interface IUserAuth extends IUser {
    userid: string;
    token: { type: 'remote' | 'asscess', value: string };
    surename?: string;
    firstname?: string;
    isAdmin?: boolean;
}

export interface IUser {
    userid: string;
    surename?: string;
    firstname?: string;
    isAdmin?: boolean;
}

export class User extends DataRecord<IUser> implements IUser {

    private _userid: string;
    private _surename?: string;
    private _firstname?: string;
    private _isAdmin?: boolean;

    constructor (data: IUser) {
        super(data);
        try {
            let attCnt = 0;
            for (const a of Object.getOwnPropertyNames(data)) {
                if ( [ ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseDate(data, { attribute: a, validate: true } );
                } else if ( [ ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseNumber(data, { attribute: a, validate: true, min: 0 } );
                } else if ( [ 'userid', 'surename', 'firstname' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseString(data, { attribute: a, validate: true } );
                } else if ( [ 'isAdmin' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseBoolean(data, { attribute: a, validate: true } );
                } else {
                    throw new Error('attribute ' + a + ' not found in data:IUser');
                }
                attCnt++;
            }
            if (attCnt !== Object.getOwnPropertyNames(this).length) {
                throw new Error('attribute count mismatch');
            }
        } catch (err) {
            throw new UserError(data, 'parsing IUser fails', err);
        }
    }

    public equals (u: IUser): boolean {
        if (!u) { return false; }
        if (u.userid !== this._userid) { return false; }
        if (u.surename !== this._surename) { return false; }
        if (u.firstname !== this._firstname) { return false; }
        if (u.isAdmin !== this._isAdmin) { return false; }
        return true;
    }

    public toObject (convertData = false): IUser {
        const rv: IUser = {
            userid:   this._userid,
        };
        if (this._surename) {
            rv.surename = this._surename;
        }
        if (this._firstname) {
            rv.firstname = this._firstname;
        }
        if (this._isAdmin === true || this._isAdmin === false) {
            rv.isAdmin = this._isAdmin;
        }
        return rv;
    }

    public get userid (): string {
        return this._userid;
    }

    public get surename (): string {
        return this._surename;
    }

    public get firstname (): string {
        return this._firstname;
    }

    public get isAdmin (): boolean {
        return this._isAdmin;
    }


}

export class UserError extends Error {
    constructor (public data: IUser, msg: string, public cause?: Error) { super(msg); }
}
