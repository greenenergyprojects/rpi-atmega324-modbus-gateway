export interface IAuthUser {
    userid: string;
    surname?: string;
    firstname?: string;
}


export class AuthUser implements IAuthUser {

    private _userid: string;
    private _surname?: string;
    private _firstname?: string;


    public constructor(data: IAuthUser) {
        try {
            if (typeof data.userid === 'string' && data.userid) {
                this._userid = data.userid;
            }
            if (data.surname && typeof data.surname === 'string') {
                this._surname = data.surname;
            }
            if (data.firstname && typeof data.firstname === 'string') {
                this._firstname = data.firstname;
            }
            if (Object.keys(data).length !== Object.keys(this).length) {
                throw new Error();
            }
        } catch (err) {
            console.log(err);
            console.log(data);
            throw new Error('invalid IAuthUser');
        }
    }

    public toObject (preserveDate?: boolean): IAuthUser {
        const rv: IAuthUser = {
            userid: this._userid,
        };
        if (this._surname) {
            rv.surname = this._surname;
         }
        if (this._firstname) {
           rv.firstname = this._firstname;
        }
        return rv;
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


    public isEqual (u: IAuthUser) {
        if (Object.keys(u).length !== Object.keys(this).length) { return false; }
        if (u.userid !== this._userid) { return false; }
        if (u.surname !== this._surname) { return false; }
        if (u.firstname !== this._firstname) { return false; }
        return true;
    }

}
