
export abstract class DataRecord<T> {

    static getMissingAttributes (data: any, attributes: string []): string {
        let rv = '';
        const att = Object.getOwnPropertyNames(data);
        for (const a of attributes) {
            if (att.indexOf(a) < 0) {
                rv += rv === '' ? a : ',' + a;
            }
        }
        return rv;
    }

    static parseNumber (data: any, options: IParseNumberOptions): number {
        if (!options || !options.attribute) { throw new ParseNumberError('missing options/attribute name'); }
        if (!data || typeof(data[options.attribute]) !== 'number') { throw new ParseNumberError('missing data/attribute name'); }
        if (!options.validate && (!data || !data[options.attribute])) { return null; }
        try {
            let value = data[options.attribute];
            if (typeof value !== 'number') {
                throw new Error('value has invalid type (' + typeof value + ')');
            }
            if (options) {
                if (!options.validate && (value === undefined || value === null)) {
                    return null;
                }
                if (options.allowNaN && Number.isNaN(value)) {
                    return value;
                }
                if (typeof options.min === 'number' && value < options.min) {
                    throw new Error('value ' + value + ' below min ' + options.min);
                }
                if (typeof options.max === 'number' && value > options.max) {
                    throw new Error('value ' + value + ' above max ' + options.max);
                }
                if (typeof options.lowerLimit === 'number' && value < options.lowerLimit) {
                    value = options.lowerLimit;
                }
                if (typeof options.upperLimit === 'number' && value < options.upperLimit) {
                    value = options.upperLimit;
                }
                if (typeof options.limitDecimalPlaces === 'number') {
                    const k = Math.pow(10,  options.limitDecimalPlaces);
                    value = Math.round(value * k) / k;
                }
                return value;
            }
        } catch (err) {
            throw new ParseNumberError(options.attribute  + ' parse error', err);
        }
    }

    static parseDate (data: any, options: IParseDateOptions): Date {
        if (!options || !options.attribute) { throw new ParseNumberError('missing options/attribute name'); }
        if (!data || !data[options.attribute]) { throw new ParseNumberError('missing data/attribute name'); }
        if (!options.validate && (!data || data[options.attribute] === undefined || data[options.attribute] === null)) { return null; }
        try {
            let rv: Date;
            const value = data[options.attribute];
            if (value instanceof Date) {
                rv = new Date(value.getTime());
            } else if (typeof value === 'number') {
                rv = new Date(value);
            } else if (typeof value === 'string') {
                rv = new Date(value);
            } else {
                throw new Error('value has invalid type (' + typeof value + ')');
            }
            return rv;
        } catch (err) {
            throw new ParseDateError(options.attribute + ' parse error', err);
        }
    }

    static parseEnum<T> (data: any, options: IParseEnumOptions<T>): T {
        if (!options || !options.attribute) { throw new ParseEnumError('missing options/attribute name'); }
        if (!data || !data[options.attribute]) { throw new ParseEnumError('missing data/attribute name'); }
        if (!options.validate && (!data || data[options.attribute] === undefined || data[options.attribute] === null)) { return null; }
        try {
            const value = data[options.attribute];
            if (options.validValues.indexOf(value) < 0) {
                throw new Error('illegal value ("' + value + '") in attribute ' + options.attribute);
            }
            return value;
        } catch (err) {
            throw new ParseEnumError(options.attribute + ' parse error', err);
        }
    }

    static parseString (data: any, options: IParseStringOptions): string {
        if (!options || !options.attribute) { throw new ParseStringError('missing options/attribute name'); }
        if (!data || !data[options.attribute]) { throw new ParseStringError('missing data/attribute name'); }
        if (!options.validate && (!data || data[options.attribute] === undefined || data[options.attribute] === null)) { return null; }
        try {
            let rv: string;
            const value = data[options.attribute];
            if (typeof value === 'string') {
                if (!options.notEmpty && value === '') { throw new Error('empty strings not allowed'); }
                rv = value;
            } else {
                throw new Error('value has invalid type (' + typeof value + ')');
            }
            return rv;
        } catch (err) {
            throw new ParseStringError(options.attribute + ' parse error', err);
        }
    }

    static parseBoolean (data: any, options: IParseBooleanOptions): string {
        if (!options || !options.attribute) { throw new ParseBooleanError('missing options/attribute name'); }
        if (!data || !data[options.attribute]) { throw new ParseBooleanError('missing data/attribute name'); }
        if (!options.validate && (!data || data[options.attribute] === undefined || data[options.attribute] === null)) { return null; }
        try {
            let rv: string;
            const value = data[options.attribute];
            if (value === true || value === false) {
                rv = value;
            } else {
                throw new Error('value has invalid type (' + typeof value + ')');
            }
            return rv;
        } catch (err) {
            throw new ParseBooleanError(options.attribute + ' parse error', err);
        }
    }

    // static enumToStringValues<T>(myEnum: T): keyof T {
    //     return Object.keys(myEnum).filter(k => typeof (myEnum as any)[k] === 'number') as any;
    // }
    static enumToStringValues<T>(myEnum: T): string [] {
        const rv: string [] = [];
        Object.keys(myEnum).forEach( item => rv.push((<any>myEnum)[item]));
        return rv;
    }


    constructor (data: T) {
    }

    public abstract toObject (convertDate?: boolean): T;
}


export interface IParseDateOptions {
    attribute: string;
    validate?: boolean;
}

export interface IParseEnumOptions<T> {
    attribute: string;
    validate?: boolean;
    validValues: string [];
}

export interface IParseNumberOptions {
    attribute: string;
    validate?: boolean;
    allowNaN?: boolean;
    min?: number;
    max?: number;
    upperLimit?: number;
    lowerLimit?: number;
    limitDecimalPlaces?: number;
}

export interface IParseStringOptions {
    attribute: string;
    validate?: boolean;
    notEmpty?: boolean;
}

export interface IParseBooleanOptions {
    attribute: string;
    validate?: boolean;
}


export class ParseDateError extends Error {
    constructor (msg: string, public cause?: Error) { super(msg); }
}

export class ParseEnumError extends Error {
    constructor (msg: string, public cause?: Error) { super(msg); }
}

export class ParseNumberError extends Error {
    constructor (msg: string, public cause?: Error) { super(msg); }
}

export class ParseStringError extends Error {
    constructor (msg: string, public cause?: Error) { super(msg); }
}

export class ParseBooleanError extends Error {
    constructor (msg: string, public cause?: Error) { super(msg); }
}
