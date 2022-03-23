import { sprintf } from 'sprintf-js';

export interface INibe1155SimpleValue {
    rawValue: number;
    rawValueAt: number;
}

export interface INibe1155Values {
    controller?: INibe1155Controller;
    completeValues?: { [id: string ]: INibe1155Value };
    simpleValues?: { [id: string ]: INibe1155SimpleValue };
    logsetIds?: number [];
}

export interface INibe1155Controller {
    createdAt: Date | string | number;
    state: string;
    running: boolean;
    desiredState?: string;
    inProgressSince?: Date;
    setPointTemp?: number;
    fSetpoint?: number;
}

export interface IValue {
    label: string;
    format: string;
    description?: string;
    help?: string;
    unit?: string;
    value?: number;
    valueAt?: Date;
}

export abstract class Value implements IValue {
    protected _label: string;
    protected _format: string;
    protected _description: string;
    protected _unit: string;
    protected _help: string;
    protected _value?: number;
    protected _valueAt?: Date;

    public constructor (data: IValue) {
        this._label = data.label;
        this._format = data.format;
        this._description = data.description || '';
        this._unit = data.unit || '';
        this._help = data.help || '';
        if (typeof data.value !== 'number') {
            this._value = Number.NaN;
            this._valueAt = null;
        } else {
            this._value = data.value;
            if (typeof data.valueAt === 'number') {
                this._valueAt = new Date(data.valueAt);
            } else if (data.valueAt instanceof Date) {
                this._valueAt = new Date(data.valueAt);
            } else if (typeof data.valueAt === 'string') {
                this._valueAt = new Date(data.valueAt);
            } else {
                this._valueAt = new Date();
            }
        }
    }

    public get label (): string {
        return this._label;
    }

    public get format (): string {
        return this._format;
    }

    public get description (): string {
        return this._description;
    }

    public get unit (): string {
        return this._unit;
    }

    public get help (): string {
        return this._help;
    }

    public get value (): number {
        return this._value;
    }

    public get valueAt (): Date {
        return this._valueAt;
    }

    public toObject () {
        const rv: IValue = {
            label: this._label,
            format: this._format
        };
        if (this._description)      { rv.description = this._description; }
        if (this._unit)             { rv.unit = this._unit; }
        if (this._help)             { rv.help = this._help; }
        if (this._value !== null)   { rv.value = this._value; }
        if (this._valueAt !== null) { rv.valueAt = this._valueAt; }
        return rv;
    }

    protected setValue (value: number, at: Date) {
        this._value = value;
        this._valueAt = at;
    }

}


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

    public static createInstance (data: INibe1155Value): Nibe1155Value {
        let rv: Nibe1155Value;
        switch (data.className) {
            case 'Nibe1155Value':                rv = new Nibe1155Value(data); break;
            case 'Nibe1155CompressorStateValue': rv = new Nibe1155CompressorStateValue(data); break;
            case 'Nibe1155PumpStateValue':       rv = new Nibe1155PumpStateValue(data); break;
            case 'Nibe1155PumpModeValue':        rv = new Nibe1155PumpModeValue(data); break;
            case 'Nibe1155OperationModeValue':   rv = new Nibe1155OperationModeValue(data); break;
            case 'Nibe1155AlarmValue':           rv = new Nibe1155AlarmValue(data); break;
            default: throw new Error('invalid/missing className ' + data.className);
        }
        return rv;

    }

    /* tslint:disable:member-ordering */
    protected _id: number;
    protected _factor: 0.01 | 0.1 | 1 | 10 | 100;
    protected _size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    protected _type: 'R' | 'R/W';
    protected _rawValue: number;
    protected _oldValue?: number;
    protected _oldValueAt?: Date;
    /* tslint:enable:member-ordering */

    constructor (data: INibe1155ValueBase | INibe1155Value) {
        super(data);
        this._id = data.id;
        this._factor = data.factor;
        this._size = data.size;
        this._type = data.type;
        const x = <INibe1155Value>data;
        if (typeof x.rawValue === 'number') {
            if (typeof x.value !== 'number' || Number.isNaN(x.value)) {
                this.setRawValue(x.rawValue, x.rawValueAt);
            } else if (typeof x.value === 'number') {
                this.setRawValue(x.rawValue, this._valueAt);
                if (this._value !== x.value) {
                    console.log(x);
                    throw new Error('invalid arguments, value differs to rawValue (id=' + x.id + ')');
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



