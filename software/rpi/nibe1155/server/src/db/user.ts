

import { IAuthUser, AuthUser } from '../client/auth-user';
import * as password from '../utils/password';

export interface IUser {
    userid:         string;
    surname?:       string;
    firstname?:     string;
    password?:      string;
    passwordHash?:  string;
    login?:         IUserLoginLogout;
    logout?:        IUserLoginLogout;
}

export class User implements IUser, IAuthUser {
    private _userid:         string;
    private _surname?:       string;
    private _firstname?:     string;
    private _password?:      string;
    private _passwordHash?:  string;
    private _login?:         UserLoginLogout;
    private _logout?:        UserLoginLogout;

    constructor (data: IUser, ignoredAttributes: string[] = []) {
        try {
            if (!data.userid || typeof(data.userid) !== 'string') { throw new Error('illegal/missing userid'); }
            this._userid = data.userid;

            if (data.surname !== undefined) {
                if (!data.surname || typeof(data.surname) !== 'string') { throw new Error('illegal/missing surname'); }
                this._surname = data.surname;
            }

            if (data.firstname !== undefined) {
                if (!data.firstname || typeof(data.firstname) !== 'string') { throw new Error('illegal/missing firstname'); }
                this._firstname = data.firstname;
            }

            if (data.password !== undefined) {
                if (!data.password || typeof(data.password) !== 'string') { throw new Error('illegal/missing password'); }
                this._password = data.password;
            }

            if (data.passwordHash !== undefined) {
                if (!data.passwordHash || typeof(data.passwordHash) !== 'string') { throw new Error('illegal/missing passwordHash'); }
                this._passwordHash = data.passwordHash;
            }

            if (data.login !== undefined) {
                this._login = new UserLoginLogout(data.login);
            }

            if (data.logout !== undefined) {
                this._logout = new UserLoginLogout(data.logout);
            }

            let ignoredAttributeCount = 0;
            for (const a of ignoredAttributes) {
                if ((<any>data)[a] !== undefined) {
                    ignoredAttributeCount++;
                }
            }

            if (Object.keys(this).length !== Object.keys(data).length - ignoredAttributeCount) {
                throw new Error('illegal attributes');
            }
        } catch (err) {
            console.log(err);
            console.log(data);
            throw new Error('Illegal IUser');
        }
    }

    public toObject (preserveDate?: boolean): IUser {
        const rv: IUser  = { userid:   this._userid };
        if (this._surname !== undefined)      { rv.surname       = this._surname;                         }
        if (this._firstname !== undefined)    { rv.firstname     = this._firstname;                       }
        if (this._password !== undefined)     { rv.password      = this._password;                        }
        if (this._passwordHash !== undefined) { rv.passwordHash  = this._passwordHash;                    }
        if (this._login !== undefined)        { rv.login         = this._login.toObject(preserveDate);    }
        if (this._logout !== undefined)       { rv.logout        = this._logout.toObject(preserveDate);   }
        return rv;
    }

    public toIAuthUser (preserveDate?: boolean): IAuthUser {
        const rv: IAuthUser  = { userid:   this._userid };
        if (this._surname  !== undefined   ) { rv.surname = this._surname;     }
        if (this._firstname  !== undefined ) { rv.firstname = this._firstname; }
        return rv;
    }

    public verifyPassword (value: string): boolean {
        const pwHash = this.passwordHash;
        if (password.isHashed(value)) {
            return value === pwHash;
        } else {
            return password.verify(value, pwHash);
        }
    }

    public get userid (): string {
        return this._userid;
    }

    public get surname (): string {
        return this._surname;
    }

    public get firstname (): string {
        return this._firstname;
    }

    public get password (): string {
        return this._password;
    }

    public get passwordHash (): string {
        return this._passwordHash;
    }

    public get login (): UserLoginLogout {
        return this._login;
    }

    public get logout (): UserLoginLogout {
        return this._logout;
    }


}

// ******************************************************

export interface IUserLoginLogout {
    at: number | Date;
    socket: string;
}

export class UserLoginLogout implements IUserLoginLogout {
    private _at: Date;
    private _socket: string;

    constructor (data: IUserLoginLogout) {
        try {
            if (!data.at) { throw new Error('illegal/missing at'); }
            const atMillis = data.at instanceof Date ? data.at.getTime() : data.at;
            if (isNaN(atMillis) || atMillis < 0) { throw new Error('illegal at'); }
            this._at = new Date(atMillis);

            if (!data.socket || typeof(data.socket) !== 'string') { throw new Error('illegal/missing socket'); }
            this._socket = data.socket;

            if (Object.keys(this).length !== Object.keys(data).length) {
                throw new Error('illegal attributes');
            }
        } catch (err) {
            console.log(err);
            console.log(data);
            throw new Error('Illegal IUserLoginLogout');
        }
    }

    public toObject (preserveDate?: boolean): IUserLoginLogout {
        const rv: IUserLoginLogout  = {
            at: preserveDate ? new Date(this._at) : this._at.getTime(),
            socket: this._socket
        };
        return rv;
    }

    public get at (): Date {
        return this._at;
    }

    public get atMillis (): number {
        return this._at.getTime();
    }

    public get socket (): string {
        return this._socket;
    }

}

// ******************************************************

