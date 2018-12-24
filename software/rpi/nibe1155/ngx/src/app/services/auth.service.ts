// import { Injectable, ViewContainerRef } from '@angular/core';
// import { HttpRequest } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';

import { User } from '../data/common/server/user';

export class AuthService {

    public useridObservable: Observable<string>;
    public userObservable: Observable<User>;

    private _userid: string;
    private _user: User;
    private _token: string;

    private _useridSubject =  new Subject<string>();
    private _tokenSubject = new Subject<string>();
    private _userSubject = new Subject<User>();

    constructor () {
        this.useridObservable = this._useridSubject.asObservable();
        this.userObservable = this._userSubject.asObservable();
    }


    public set userid (value: string) {
        if (value !== undefined && !value) {
            throw new Error('invalid value for userid');
        }
        this._userid = value;
        this._useridSubject.next(value);
    }

    public get userid (): string {
        return this._userid;
    }

    public set token (value: string) {
        if (value !== undefined && !value) {
            throw new Error('invalid value for token');
        }
        this._token = value;
        this._tokenSubject.next(value);
    }

    public get token (): string {
        return this._token;
    }

    public set user (value: User) {
        if (value !== undefined && !value) {
            throw new Error('invalid value for user');
        }
        if (this._user && this._user.equals(value)) {
            return;
        }
        this._user = value;
        this._userSubject.next(value);
    }

}
