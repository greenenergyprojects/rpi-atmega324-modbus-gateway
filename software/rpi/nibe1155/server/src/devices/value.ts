
export interface IValue {
    label: string;
    format: string;
    description?: string;
    help?: string;
    unit?: string;
    value?: number;
    valueAt?: Date | number;
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
            this._value = null;
            this._valueAt = null;
        } else {
            this._value = data.value;
            if (typeof data.valueAt === 'number') {
                this._valueAt = new Date(data.valueAt);
            } else if (data.valueAt instanceof Date) {
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

    public toObject (preserveDate?: boolean) {
        const rv: IValue = {
            label: this._label,
            format: this._format
        };
        if (this._description)      { rv.description = this._description; }
        if (this._unit)             { rv.unit = this._unit; }
        if (this._help)             { rv.help = this._help; }
        if (this._value !== null)   { rv.value = this._value; }
        if (this._valueAt !== null) { rv.valueAt = preserveDate ? this._valueAt : this._valueAt.getTime(); }
        return rv;
    }

    protected setValue (value: number, at: Date) {
        this._value = value;
        this._valueAt = at;
    }

}
