export interface IUserLogin {
    id: string;
    password: string;
    stayLoggedIn?: boolean;
}

export class UserLogin implements IUserLogin {

    private _id: string;
    private _password: string;
    private _stayLoggedIn?: boolean;

    constructor (data: IUserLogin) {
        try {
            if (!data.id || typeof data.id !== 'string') { throw new Error('missing/invalid id'); }
            this._id = data.id;
            if (!data.password || typeof data.password !== 'string') { throw new Error('missing/invalid password'); }
            this._password = data.password;
            if (data.stayLoggedIn !== undefined) {
                if (typeof data.stayLoggedIn !== 'boolean') { throw new Error('missing/invalid stayLoggedIn'); }
                this._stayLoggedIn = data.stayLoggedIn;
            }
            if (Object.keys(this).length !== Object.keys(data).length) {
                throw new Error('invalid attributes');
            }
        } catch (err) {
            console.log(err);
            console.log(data);
            throw new Error('Error on IUserLogin');
        }
    }

    public get id (): string {
        return this._id;
    }

    public get password (): string {
        return this._password;
    }

    public get stayLoggedIn (): boolean {
        return this._stayLoggedIn;
    }

}

