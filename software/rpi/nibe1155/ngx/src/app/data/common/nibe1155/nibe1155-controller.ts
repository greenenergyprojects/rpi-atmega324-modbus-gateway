
import { DataRecord } from '../data-record';

export enum HeatpumpControllerMode { off = 'off', init = 'init', frequency = 'frequency', test = 'test', error = 'error', disabled = 'disabled' }

export interface INibe1155Controller {
    createdAt: Date | number | string;
    desiredMode?: HeatpumpControllerMode;
    currentMode?: HeatpumpControllerMode;
    running?: boolean;
    inProgressSince?: Date | number | string;
    pin?: string;
    fSetpoint?: number;
    fMin?: number;
    fMax?: number;
    tempSetpoint?: number;
    tempMin?: number;
    tempMax?: number;
}
export class Nibe1155Controller extends DataRecord<INibe1155Controller> implements INibe1155Controller {

    private _createdAt:       Date;
    private _desiredMode?:    HeatpumpControllerMode;
    private _currentMode?:    HeatpumpControllerMode;
    private _running?:        boolean;
    private _inProgressSince: Date;
    private _pin?:            string;
    private _fSetpoint?:      number;
    private _fMin?:           number;
    private _fMax?:           number;
    private _tempSetpoint?:   number;
    private _tempMin?:        number;
    private _tempMax?:        number;

    constructor (data: INibe1155Controller) {
        super(data);
        try {
            const missing = DataRecord.getMissingAttributes( data, [ 'createdAt' ]);
            if (missing) {
                throw new Error('missing attribute ' + missing);
            }
            let attCnt = 0;
            for (const a of Object.getOwnPropertyNames(data)) {
                if ( [ 'createdAt', 'inProgressSince' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseDate(data, { attribute: a, validate: true } );
                } else if ( [ 'fSetpoint', 'fMin', 'fMax', 'tempSetpoint', 'tempMin', 'tempMax' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseNumber(data, { attribute: a, validate: true, min: 0 } );
                } else if ( [ 'running' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseBoolean(data, { attribute: a, validate: true } );
                } else if ( [ 'desiredMode', 'currentMode' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseEnum<HeatpumpControllerMode>(
                        data, {attribute: a, validate: true, validValues: DataRecord.enumToStringValues(HeatpumpControllerMode) }
                    );
                } else {
                    throw new Error('attribute ' + a + ' not found in data:INibe1155Controller');
                }
                attCnt++;
            }
            if (attCnt !== Object.getOwnPropertyNames(this).length) {
                throw new Error('attribute count mismatch');
            }
        } catch (err) {
            throw new Nibe1155ControllerError(data, 'parsing INibe1155Controller fails', err);
        }
    }

    public toObject (preserveDate = true): INibe1155Controller {
        const rv: INibe1155Controller = {
            createdAt: preserveDate ? this._createdAt : this._createdAt.getTime(),
        };
        if (this._running === true || this._running === false) { rv.running = this._running; }
        if (this._currentMode     !== undefined) { rv.currentMode     = this._currentMode; }
        if (this._desiredMode     !== undefined)  { rv.desiredMode    = this._desiredMode; }
        if (this._inProgressSince !== undefined) { rv.inProgressSince = preserveDate ? this._inProgressSince : this._inProgressSince.getTime(); }
        if (this._pin             !== undefined) { rv.pin             = this._pin; }
        if (this._fSetpoint       !== undefined) { rv.fSetpoint       = this._fSetpoint; }
        if (this._fMin            !== undefined) { rv.fMin            = this._fMin; }
        if (this._fMax            !== undefined) { rv.fMax            = this._fMax; }
        if (this._tempSetpoint    !== undefined) { rv.tempSetpoint    = this._tempSetpoint; }
        if (this._tempMin         !== undefined) { rv.tempMin         = this._tempMin; }
        if (this._tempMax         !== undefined) { rv.tempMax         = this._tempMax; }
        return rv;
    }

    public get createdAt (): Date {
        return this._createdAt;
    }

    public get desiredMode (): HeatpumpControllerMode {
        return this._desiredMode;
    }

    public get currentMode (): HeatpumpControllerMode {
        return this._currentMode;
    }

    public get running (): boolean {
        return this._running;
    }

    public get inProgressSince (): Date {
        return this._inProgressSince;
    }

    public get pin (): string {
        return this._pin;
    }

    public get fSetpoint (): number {
        return this._fSetpoint;
    }

    public get fMin (): number {
        return this._fMin;
    }

    public get fMax (): number {
        return this._fMax;
    }

    public get tempSetpoint (): number {
        return this._tempSetpoint;
    }

    public get tempMin (): number {
        return this._tempMin;
    }

    public get tempMax (): number {
        return this._tempMax;
    }

}

export class Nibe1155ControllerError extends Error {
    constructor (public data: INibe1155Controller, msg: string, public cause?: Error) { super(msg); }
}
