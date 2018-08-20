
import { Value, IValue } from './value';

export interface INibe1155Value extends IValue {
    id: number;
    factor: 0.01 | 0.1 | 1 | 10 | 100;
    size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    type: 'R' | 'R/W';
    rawValue?: number;
    oldValue?: number;
    oldValueAt?: Date | number;
}

export class Nibe1155Value extends Value {
    protected _id: number;
    protected _factor: 0.01 | 0.1 | 1 | 10 | 100;
    protected _size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    protected _type: 'R' | 'R/W';
    protected _rawValue: number;
    protected _oldValue?: number;
    protected _oldValueAt?: Date;

    constructor (data: INibe1155Value) {
        super(data);
        this._id = data.id;
        this._factor = data.factor;
        this._size = data.size;
        this._type = data.type;
        if (typeof data.rawValue === 'number') {
            if (typeof data.value !== 'number' || Number.isNaN(data.value)) {
                this._value = data.rawValue * data.factor;
            } else if (typeof data.value === 'number') {
                if (data.rawValue * data.factor !== data.value) {
                    throw new Error('invalid arguments, value differs to rawValue');
                }
            }
            this._rawValue = data.rawValue;
        } else {
            this._rawValue = null;
        }
        if (typeof data.oldValue !== 'number') {
            this._oldValue = Number.NaN;
            this._oldValueAt = null;
        } else {
            this._oldValue = data.oldValue;
            if (typeof data.oldValueAt === 'number') {
                this._oldValueAt = new Date(data.oldValueAt);
            } else if (data.valueAt instanceof Date) {
                this._oldValueAt = new Date(data.oldValueAt);
            } else {
                this._oldValue = Number.NaN;
                this._oldValueAt = null;
            }
        }
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

    public setRawValue (value: number, at: Date) {
        this._rawValue = value;
        const oldValue = this._value;
        const oldValueAt = this._valueAt;
        /* tslint:disable:no-bitwise */
        switch (this._size) {
            case 'u8':  { const x = (value &       0xff) / this._factor; super.setValue(x, at); break; }
            case 's8':  { const x = (value &       0xff) / this._factor; super.setValue(x >= 0x80 ? x - 0x100 : x, at); break; }
            case 'u16': { const x = (value &     0xffff) / this._factor; super.setValue(x, at); break; }
            case 's16': { const x = (value &     0xffff) / this._factor; super.setValue(x >= 0x8000 ? x - 0x10000 : x, at); break; }
            case 'u32': { const x = (value & 0xffffffff) / this._factor; super.setValue(x, at); break; }
            case 's32': { const x = (value & 0xffffffff) / this._factor; super.setValue(x >= 0x80000000 ? x - 0x100000000 : x, at); break; }
            default:
                super.setValue(Number.NaN, at);
                throw new Error('unsupported size ' + this._size);
        }
        /* tslint:enable:no-bitwise */
        this._oldValue = oldValue;
        this._oldValueAt = oldValueAt;
    }

    public toObject (preserveDate?: boolean): INibe1155Value {
        const rv: INibe1155Value = <INibe1155Value>super.toObject(preserveDate);
        rv.id = this._id;
        rv.factor = this._factor;
        rv.size = this._size;
        rv.type = this._type;
        if (this._rawValue !== null) { rv.rawValue = this._rawValue; }
        return rv;
    }


}
