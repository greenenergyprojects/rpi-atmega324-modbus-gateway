
import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('Action');

import { Nibe1155 } from '../nibe1155';

export abstract class Action {

    protected _at: Date;
    protected _startedAt: Date;
    protected _finishedAt: Date;
    protected _timeoutAt: Date;
    protected _errors: Error [] = [];
    protected _device: Nibe1155;

    constructor () {
        this._at = new Date();
        this._device = Nibe1155.Instance;
    }

    public finish (error?: Error) {
        if (this._finishedAt) { throw new Error('action already finished'); }
        this._finishedAt = new Date();
        if (error) {
            this._errors.push(error);
            debug.warn('Action %s finished with error %s', this.constructor.name);
        } else {
            debug.info('Action %s finished successful', this.constructor.name);
        }
    }

    public addError (error: Error) {
        this._errors.push(error);
    }

    public get at(): Date {
        return this._at;
    }

    public get timeoutAt (): Date {
        return this._timeoutAt;
    }

    public get finishedAt (): Date {
        return this.finishedAt;
    }

    public get error (): Error {
        const l = this._errors.length;
        return l > 0 ? this._errors[l - 1] : undefined;
    }

    public get errors (): Error [] {
        return this._errors;
    }

    public abstract async execute (): Promise<Action>;

}


export class ActionError extends Error {

    private _cause: Error;
    private _action: Action;

    public constructor (action: Action, message?: string, cause?: Error) {
        super(message);
        this._action = action;
        this._cause = cause;
    }

    public get cause (): Error {
        return this._cause;
    }

    public get action (): Action {
        return this._action;
    }

}