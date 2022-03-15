
import { sprintf } from 'sprintf-js';

import { CommonLogger } from '../../common-logger';
import { DataRecord } from '../data-record';
import { Nibe1155ModbusRegisters, INibe1155Definition } from './nibe1155-modbus-registers';

export interface INibe1155Value {
    id: number;
    value?: number;
    valueAt?: Date | number | string;
    recentValue?: number;
    recentValueAt?: Date | number | string;
    rawValue?: number;
}

export class Nibe1155Value extends DataRecord<INibe1155Value> implements INibe1155Value {
    private _id: number;
    private _value: number;
    private _valueAt: Date;
    private _rawValue: number;
    private _recentValue?: number;
    private _recentValueAt?: Date;

    public constructor (data: INibe1155Value) {
        super(data);
        try {
            const missing = DataRecord.getMissingAttributes( data, [ 'id' ]);
            if (missing) {
                throw new Error('missing attribute ' + missing);
            }
            let attCnt = 0;
            for (const a of Object.getOwnPropertyNames(data)) {
                if ( [ 'id' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseNumber(data, { attribute: a, validate: true, min: 0, max: 65535 } );
                } else if ( [ 'value', 'recentValue' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseNumber(data, { attribute: a, validate: true } );
                } else if ( [ 'rawValue' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseNumber(data, { attribute: a, validate: true, min: 0 } );
                } else if ( [ 'valueAt', 'recentValueAt' ].indexOf(a) >= 0 ) {
                    (<any>this)['_' + a] = DataRecord.parseDate(data, { attribute: a, validate: true } );
                } else {
                    throw new Error('attribute ' + a + ' not found in data:INibe1155Value');
                }
                attCnt++;
            }
            if (attCnt !== Object.getOwnPropertyNames(this).length) {
                throw new Error('attribute count mismatch');
            }
            if (this._value === undefined) { this._value = null; }
            if (this._valueAt === undefined) { this._valueAt = null; }
            if (this._recentValue === undefined) { this._recentValue = null; }
            if (this._recentValueAt === undefined) { this._recentValueAt = null; }
            if (this._rawValue === undefined) { this._rawValue = null; }

            if (!this.isKnownRegister) {
                throw new Error('invalid modbus id ' + this._id);
            }
        } catch (err) {
            throw new Nibe1155ValueError(data, 'parsing INibe1155Value fails', err);
        }
    }

    public toObject (preserveDate = true): INibe1155Value {
        const rv: INibe1155Value = {
            id: this._id,
        };
        if (this._value !== null) { rv.value = this._value; }
        if (this._valueAt !== null) { rv.valueAt = preserveDate ? this.valueAt : this.valueAt.getTime(); }
        if (this._recentValue !== null) { rv.recentValue = this._recentValue; }
        if (this._recentValueAt !== null) { rv.recentValueAt = preserveDate ? this._recentValueAt : this._recentValueAt.getTime(); }
        if (this._rawValue !== null) { rv.rawValue = this._rawValue; }
        return rv;
    }

    public get id (): number {
        return this._id;
    }

    public get value (): number {
        return (this._value || this._value === 0) ? this._value : Number.NaN;
    }

    public get valueAt (): Date | null {
        return this._valueAt ? this._valueAt : null;
    }

    public get recentValue (): number {
        return (this._recentValue || this._recentValue === 0) ? this._recentValue : Number.NaN;
    }

    public get recentValueAt (): Date | null {
        return this._recentValueAt ? this._recentValueAt : null;
    }

    public get rawValue (): number {
        return (this._rawValue || this._rawValue === 0) ? this._rawValue : Number.NaN;
    }

    public get label (): string {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.label : '?';
    }

    public get description (): string {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.description : '';
    }

    public get help (): string {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.help : '';
    }

    public get type (): 'R' | 'R/W' | '?' {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.type : '?';
    }

    public get unit (): '' | '°C' | 'h' | 'Wh' | 'W' | 'A' | 'Hz' | '%' | '?' {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.unit : '?';
    }

    public get format (): string {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.format : '?';
    }

    public get modbusRegSize (): 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32' | '?' {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.size : '?';
    }

    public get modbusValueFactor (): number {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.factor : 0;
    }

    public get isModbusLogSetRegister (): boolean {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r ? r.isLogset : false;    }

    public get isKnownRegister (): boolean {
        const x: { [ id: number ]: INibe1155Definition } = Nibe1155ModbusRegisters.regDefById;
        const r: INibe1155Definition = x[this._id];
        return r !== undefined;
    }

    public get isValueChanged (): boolean {
        if (this._recentValueAt === null ) {
            return this._valueAt !== null;
        }
        return this._recentValueAt !== this._valueAt && this._recentValue !== this._value;
    }

    public clearValueChanged () {
        this._recentValue = this._value;
        this._recentValueAt = this._valueAt;
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                const s1 = sprintf(this.format, this._value).trim();
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + this.unit + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error';
        }
    }


    public setRawValue (value: number, at: Date) {
        this._rawValue = value;
        /* tslint:disable:no-bitwise */
        try {
            const factor = this.modbusValueFactor;
            if (factor === 0) {
                throw new Error('modbus factor === 0');
            }
            switch (this.modbusRegSize) {
                case 'u8':  { const x = (value &       0xff); this.setValue(x / factor, at); break; }
                case 's8':  { const x = (value &       0xff); this.setValue((x >= 0x80 ? x - 0x100 : x ) / factor, at); break; }
                case 'u16': { const x = (value &     0xffff); this.setValue(x / factor, at); break; }
                case 's16': { const x = (value &     0xffff); this.setValue((x >= 0x8000 ? x - 0x10000 : x) / factor , at); break; }
                case 'u32': { const x = (value & 0xffffffff); this.setValue(x / factor, at); break; }
                case 's32': {
                    const x = (value & 0xffffffff); this.setValue((x >= 0x80000000 ? x - 0x100000000 : x) / factor, at); break;
                }
                default:
                    this.setValue(Number.NaN, at);
                    throw new Error('unsupported size ' + this.modbusRegSize);
            }
            /* tslint:enable:no-bitwise */

        } catch (err) {
            CommonLogger.warn('Nibe1155Value', 'cannot set raw value', err);
        }
    }

    private setValue (value: number, at: Date) {
        if (value !== undefined && value !== null && at instanceof Date) {
            this._recentValue = this._value;
            this._recentValueAt = this._valueAt;
            this._value = value;
            this._valueAt = at;
        } else {
            CommonLogger.warn('Nibe1155Value', 'setting new value fails');
        }
    }

}

export class Nibe1155ValueError extends Error {
    constructor (public data: INibe1155Value, msg: string, public cause?: Error) { super(msg); }
}


export class Nibe1155CompressorStateValue extends Nibe1155Value  {

    constructor (data: INibe1155Value) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this.valueAt instanceof Date) {
                let s1: string;
                switch (this.value) {
                    case  20: s1 = 'stopped'; break;
                    case  40: s1 = 'starting'; break;
                    case  60: s1 = 'running'; break;
                    case 100: s1 = 'stopping'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error (' + this.value + ')';
        }
    }
}


export class Nibe1155PumpStateValue extends Nibe1155Value  {

    constructor (data: INibe1155Value) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this.valueAt instanceof Date) {
                let s1: string;
                switch (this.value) {
                    case 10: s1 = 'off'; break;
                    case 15: s1 = 'starting'; break;
                    case 20: s1 = 'on'; break;
                    case 40: s1 = '10-day-mode'; break;
                    case 80: s1 = 'calibration'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error (' + this.value + ')';
        }
    }

}

export class Nibe1155PumpModeValue extends Nibe1155Value  {

    constructor (data: INibe1155Value) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this.valueAt instanceof Date) {
                let s1: string;
                switch (this.value) {
                    case 10: s1 = 'intermittent'; break;
                    case 20: s1 = 'continous'; break;
                    case 30: s1 = 'economy'; break;
                    case 40: s1 = 'auto'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error (' + this.value + ')';
        }
    }

}

export class Nibe1155OperationModeValue extends Nibe1155Value  {

    constructor (data: INibe1155Value) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this.valueAt instanceof Date) {
                let s1: string;
                switch (this.value) {
                    case 0: s1 = 'auto'; break;
                    case 1: s1 = 'manual'; break;
                    case 2: s1 = 'add heat only'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error (' + this.value + ')';
        }
    }

}

export class Nibe1155AlarmValue extends Nibe1155Value  {

    constructor (data: INibe1155Value) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this.valueAt instanceof Date) {
                let s1: string;
                switch (this.value) {
                    case    0: s1 = 'Kein Fehler'; break;
                    case  163: s1 = 'Hohe Kondensatortemperatur'; break;
                    default: s1 = '?'; break;
                }
                const s2 = addTime ? ' (@' + this.valueAt.toLocaleTimeString() + ')' : '';
                return s1 + s2;
            } else {
                return '?';
            }
        } catch (err) {
            return 'Error (' + this.value + ')';
        }
    }

}
