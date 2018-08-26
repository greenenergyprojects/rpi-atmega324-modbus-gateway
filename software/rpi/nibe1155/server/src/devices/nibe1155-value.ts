
import { Value, IValue } from './value';
import { sprintf } from 'sprintf-js';

export interface INibe1155ValueBase extends IValue {
    id: number;
    factor: 0.01 | 0.1 | 1 | 10 | 100;
    size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    type: 'R' | 'R/W';
}

export interface INibe1155Value extends INibe1155ValueBase {
    rawValue: number;
    rawValueAt: Date;
    className: string;
    oldValue?: number;
    oldValueAt?: Date;
}

export class Nibe1155Value extends Value {
    protected _id: number;
    protected _factor: 0.01 | 0.1 | 1 | 10 | 100;
    protected _size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    protected _type: 'R' | 'R/W';
    protected _rawValue: number;
    protected _oldValue?: number;
    protected _oldValueAt?: Date;

    constructor (data: INibe1155ValueBase | INibe1155Value) {
        super(data);
        this._id = data.id;
        this._factor = data.factor;
        this._size = data.size;
        this._type = data.type;
        const x = <INibe1155Value>data;
        if (typeof x.rawValue === 'number') {
            if (typeof x.value !== 'number' || Number.isNaN(x.value)) {
                this._value = x.rawValue * data.factor;
            } else if (typeof x.value === 'number') {
                if (x.rawValue * data.factor !== x.value) {
                    throw new Error('invalid arguments, value differs to rawValue');
                }
            }
            this._rawValue = x.rawValue;
        } else {
            this._rawValue = null;
        }
        if (typeof x.oldValue !== 'number') {
            this._oldValue = Number.NaN;
            this._oldValueAt = null;
        } else {
            this._oldValue = x.oldValue;
            if (typeof x.oldValueAt === 'number') {
                this._oldValueAt = new Date(x.oldValueAt);
            } else if (data.valueAt instanceof Date) {
                this._oldValueAt = new Date(x.oldValueAt);
            } else {
                this._oldValue = Number.NaN;
                this._oldValueAt = null;
            }
        }
    }

    public get className (): string {
        return this.constructor.name;
    }

    public get id (): number {
        return this._id;
    }

    public get factor (): 0.01 | 0.1 | 1 | 10 | 100 {
        return this._factor;
    }

    public get size (): 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32' {
        return this._size;
    }

    public get type (): 'R' | 'R/W' {
        return this._type;
    }

    public get rawValue (): number {
        return this._rawValue;
    }

    public get oldValue (): number {
        return this._oldValue;
    }

    public get oldValueAt (): Date {
        return this._oldValueAt;
    }

    public get isValueChanged (): boolean {
        if (this._oldValueAt === null ) {
            return this._valueAt !== null;
        }
        return this._oldValueAt !== this._valueAt && this._oldValue !== this._value;
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                const s1 = sprintf(this._format, this._value).trim();
                const s2 = addTime ? sprintf(' (@%s)',  this._valueAt.toLocaleTimeString()) : '';
                return s1 + this._unit + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error';
        }
    }

    public clearValueChanged () {
        this._oldValue = this._value;
        this._oldValueAt = this._valueAt;
    }

    public setRawValue (value: number, at: Date) {
        this._rawValue = value;
        const oldValue = this._value;
        const oldValueAt = this._valueAt;
        /* tslint:disable:no-bitwise */
        switch (this._size) {
            case 'u8':  { const x = (value &       0xff); super.setValue(x / this._factor, at); break; }
            case 's8':  { const x = (value &       0xff); super.setValue((x >= 0x80 ? x - 0x100 : x ) / this._factor, at); break; }
            case 'u16': { const x = (value &     0xffff); super.setValue(x / this._factor, at); break; }
            case 's16': { const x = (value &     0xffff); super.setValue((x >= 0x8000 ? x - 0x10000 : x) / this._factor , at); break; }
            case 'u32': { const x = (value & 0xffffffff); super.setValue(x / this._factor, at); break; }
            case 's32': {
                const x = (value & 0xffffffff); super.setValue((x >= 0x80000000 ? x - 0x100000000 : x) / this._factor, at); break;
            }
            default:
                super.setValue(Number.NaN, at);
                throw new Error('unsupported size ' + this._size);
        }
        /* tslint:enable:no-bitwise */
        this._oldValue = oldValue;
        this._oldValueAt = oldValueAt;
    }

    public toObject (): INibe1155Value {
        const rv: INibe1155Value = <INibe1155Value>super.toObject();
        rv.id = this._id;
        rv.factor = this._factor;
        rv.size = this._size;
        rv.type = this._type;
        rv.className = this.className;
        rv.rawValue = this._rawValue;
        return rv;
    }

}


export class Nibe1155CompressorStateValue extends Nibe1155Value  {

    constructor (data: INibe1155Value | INibe1155ValueBase) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                let s1: string;
                switch (this._value) {
                    case  20: s1 = 'stopped'; break;
                    case  40: s1 = 'starting'; break;
                    case  60: s1 = 'running'; break;
                    case 100: s1 = 'stopping'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? sprintf(' (@%s)',  this._valueAt.toLocaleTimeString()) : '';
                return s1 + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error (' + this._value + ')';
        }
    }

}

export class Nibe1155PumpStateValue extends Nibe1155Value  {

    constructor (data: INibe1155Value | INibe1155ValueBase) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                let s1: string;
                switch (this._value) {
                    case 10: s1 = 'off'; break;
                    case 15: s1 = 'starting'; break;
                    case 20: s1 = 'on'; break;
                    case 40: s1 = '10-day-mode'; break;
                    case 80: s1 = 'calibration'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? sprintf(' (@%s)',  this._valueAt.toLocaleTimeString()) : '';
                return s1 + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error (' + this._value + ')';
        }
    }

}


export class Nibe1155PumpModeValue extends Nibe1155Value  {

    constructor (data: INibe1155Value | INibe1155ValueBase) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                let s1: string;
                switch (this._value) {
                    case 10: s1 = 'intermittent'; break;
                    case 20: s1 = 'continous'; break;
                    case 30: s1 = 'economy'; break;
                    case 40: s1 = 'auto'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? sprintf(' (@%s)',  this._valueAt.toLocaleTimeString()) : '';
                return s1 + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error (' + this._value + ')';
        }
    }

}

export class Nibe1155OperationModeValue extends Nibe1155Value  {

    constructor (data: INibe1155Value | INibe1155ValueBase) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                let s1: string;
                switch (this._value) {
                    case 0: s1 = 'auto'; break;
                    case 1: s1 = 'manual'; break;
                    case 2: s1 = 'add heat only'; break;
                    default: throw new Error('invalid value');
                }
                const s2 = addTime ? sprintf(' (@%s)',  this._valueAt.toLocaleTimeString()) : '';
                return s1 + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error (' + this._value + ')';
        }
    }

}

export class Nibe1155AlarmValue extends Nibe1155Value  {

    constructor (data: INibe1155Value | INibe1155ValueBase) {
        super(data);
    }

    public valueAsString (addTime: boolean) {
        try {
            if (this._valueAt instanceof Date) {
                let s1: string;
                switch (this._value) {
                    case    0: s1 = 'Kein Fehler'; break;
                    case  163: s1 = 'Hohe Kondensatortemperatur'; break;
                    default: s1 = '?'; break;
                }
                const s2 = addTime ? sprintf('(%d) (@%s)', this._value, this._valueAt.toLocaleTimeString()) : '';
                return s1 + s2;
            } else {
                return '';
            }
        } catch (err) {
            return 'Error (' + this._value + ')';
        }
    }

}
