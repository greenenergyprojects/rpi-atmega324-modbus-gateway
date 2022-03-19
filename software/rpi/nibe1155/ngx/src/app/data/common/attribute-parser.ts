// version 24.7.2021
// version 18.7.2021
// version 29.6.2021

// eslint-disable-next-line unicorn/no-static-only-class
export class AttributeParser {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static removeUndefined (object: any): void {
        for (const key of Object.getOwnPropertyNames(object)) {
            if (object[key] === undefined) {
                delete object[key];
            }
        }
    }

    // static getEnumKey<T> (type: any, value: typeof type): keyof T | undefined {
    // 	const rv = Object.keys(type).find( k => (type as any)[k] === value) as keyof T;
    // 	return rv;
    // }

    /**
     * Returns key of mapped enum type.
     *
     * Example:
     * ```ts
     * getEnumKey<typeof EnumOfReturnKey, EnumOfValue>(EnumOfValue, value);
     * ```
     * @param enumType enum type of return key
     * @param value value of mapped enum
     * @returns key
     */
    static getEnumKey<T, V> (enumType: { [P: string]: string | number }, value: V): keyof T | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Object.keys(enumType).find( k => (enumType as any)[k] === value) as keyof T;
    }

    // curb53 hash: https://stackoverflow.com/a/52171480/5076315
    static stringHash53Bit (from: string, seed = 0): number {
        let h1 = 0xDE_AD_BE_EF ^ seed;
        let h2 = 0x41_C6_CE_57 ^ seed;
        for (let i = 0, ch; i < from.length; i++) {
            ch = from.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2_654_435_761);
            h2 = Math.imul(h2 ^ ch, 1_597_334_677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2_246_822_507) ^ Math.imul(h2 ^ (h2 >>> 13), 3_266_489_909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2_246_822_507) ^ Math.imul(h1 ^ (h1 >>> 13), 3_266_489_909);
        return 4_294_967_296 * (2_097_151 & h2) + (h1 >>> 0);
    }

    static childOptions<P, T> (key: keyof P, options?: TToObjectOptions<P>): TToObjectOptions<T> | undefined {
        let opt: TToObjectOptions<T> | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childOptions = options && options.attributes && (options.attributes as unknown as any)[key] as TToObjectOptions<T>;
        if (childOptions) {
            opt = childOptions;
            if (!opt.dates && options && options.dates) {
                opt.dates = options.dates;
            }
        } else if (options && options.dates) {
            opt = { dates: options.dates };
        }
        return opt;
    }

    /* eslint-disable unicorn/prevent-abbreviations */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    static toObject<T> (object: { [Property in keyof T]: T[keyof T] }, options?: TToObjectOptions<T>): T {
        const rv: T = {} as T;
        for (const key of Object.getOwnPropertyNames(object) as (keyof T)[]) {
            const ignore = options && options.attributes ? options.attributes.ignore : undefined;
            if (typeof ignore === 'string' && ignore === key) { continue; }
            if (Array.isArray(ignore) && ignore.includes(key) ) { continue; }
            const only = options && options.attributes ? options.attributes.only : undefined;
            if (typeof only === 'string' && only !== key) { continue; }
            if (Array.isArray(only) && !only.includes(key) ) { continue; }

            try {
                const v = object[key];
                if (v === undefined) { continue; }
                const cb = options && options.callbacks && (options.callbacks)[key] as unknown as TToObjectCallback<T> [] | TToObjectCallback<T>;
                if (Array.isArray(cb)) {
                    let vx = v;
                    for (const cx of cb) {
                        vx = cx(vx, key);
                    }
                    if (vx !== undefined) {
                        rv[key] = vx;
                    }
                    continue;
                } else if (cb) {
                    const vx = cb(v, key);
                    if (vx !== undefined) {
                        rv[key] = vx;
                    }
                    continue;
                }
                if (v === null) {
                    rv[key] = v;
                } else if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') {
                    rv[key] = v;
                } else if (typeof v === 'object' && typeof (v as unknown as any).toObject === 'function') {
                    const vObj = (v as unknown as any).toObject(this.childOptions(key, options));
                    if (typeof vObj !== 'object') { throw new TypeError('wrong result of toObject()'); }
                    rv[key] = vObj;
                } else if (Array.isArray(v)) {
                    const a = [];
                    for (const x of v) {
                        if (typeof x === 'boolean' || typeof x === 'number' || typeof x === 'string') {
                            a.push(x);
                        } else if (typeof x === 'object' && typeof x.toObject === 'function') {
                            const xObj = x.toObject(this.childOptions(key, options));
                            if (typeof xObj !== 'object') { throw new TypeError('wrong result of toObject()'); }
                            a.push(xObj);
                        } else {
                            throw new TypeError('invalid value type of array element');
                        }
                    }
                    rv[key] = a as any;
                } else if (v instanceof Date) {
                    const d = options ? options.dates : undefined;
                    if (!d) {
                        rv[key] = v;
                    } else if (typeof d === 'function') {
                        const x = d(v);
                        if (x !== undefined) {
                            rv[key] = x as any;
                        }
                    } else {
                        switch (d) {
                            case 'millis': rv[key] = v.getTime() as any; break;
                            case 'seconds': rv[key] = Math.floor(v.getTime() / 1000) as any; break;
                            case 'ISOString': rv[key] = v.toISOString() as any; break;
                            default: rv[key] = new Date(v) as any; break;
                        }
                    }
                } else {
                    throw new TypeError('invalid value type');
                }

            } catch (error) {
                throw new ToObjectError(object.constructor.name + '.toObject() fails on attribute ' + key, error);
            }
        }
        return rv;
    }
    /* eslint-enable unicorn/prevent-abbreviations */
    /* eslint-enable @typescript-eslint/no-explicit-any */

    static parseBoolean (value: unknown, name: string,  options?: IParseBooleanOptions): boolean {
        try {
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
                if (typeof value  === 'undefined' || value === null) { return value as unknown as boolean; }
            if (options && options.allowValueAsString && typeof value  === 'string') {
                if (value.toLowerCase() === 'true') {
                    value = true;
                } else if (value.toLowerCase() === 'false') {
                    value = false;
                } else {
                    value = +value;
                }
            }
            if (options && options.allowValueAsNumber && typeof value  === 'number') {
                value = value !== 0;
            }
            if (typeof value  !== 'boolean') { throw new TypeError('invalid value type (' + typeof value + ')'); }
            if (options && options.expected && options.expected !== value) { throw new Error('unexpected value ' + value); }
            return value;

        } catch (error) {
            throw new ParseBooleanError(name + ' -> parseBoolean() fails', error);
        }
    }


    static parseNumber (value: unknown, name: string,  options?: IParseNumberOptions): number {
        try {
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
            if (typeof value  === 'undefined' || value === null) { return value as unknown as number; }
            if (options && options.allowValueAsString && typeof value === 'string') {
                value = +value;
            }
            if (typeof value !== 'number') { throw new TypeError('invalid value type (' + typeof value + ')'); }
            if (options && options.expected !== undefined) {
                if (options && Array.isArray(options.expected)) {
                    if (options && !options.expected.includes(value)) {
                        throw new Error('value ' + value + ' not in expected set');
                    }
                } else if (options && options.expected !== value) {
                    throw new Error('unexpected value ' + value);
                }
            }
            if (options && typeof options.min === 'number' && value < options.min) {
                throw new Error('value ' + value + ' lower than min ' + options.min);
            }
            if (options && typeof options.max === 'number' && value > options.max) {
                throw new Error('value ' + value + ' greater than max ' + options.max);
            }
            return value;

        } catch (error) {
            throw new ParseNumberError(name + ' -> parseNumber() fails', error);
        }
    }

    static parseDate (value: unknown, name: string, options?: IParseDateOptions): Date {
        try {
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
                if (typeof value === 'undefined' || value === null) { return value as unknown as Date; }
            if (options && options.allowMillis && typeof value === 'number') { return new Date(value); }
            if (options && options.allowSeconds && typeof value === 'number') { return new Date(value * 1000); }
            if (options && options.allowString && typeof value === 'string') { return new Date(value); }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Date(value as unknown as any);

        } catch (error) {
            throw new ParseDateError(name + ' -> parseDate() fails', error);
        }
    }

    static parseString (value: unknown, name: string, options?: IParseStringOptions): string {
        try {
            if (options && options.nullToUndefined && value === null) { value = undefined; }
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
            if (typeof value === 'undefined' || value === null) { return value as unknown as string; }
            if (typeof value !== 'string') { throw new TypeError('invalid value type (' + typeof value  + ')'); }
            if (options && options.allowEmptyString && value === '') { return value; }
            if (value === '') { throw new Error('empty strings not allowed'); }
            if (options && options.allowValues && Array.isArray(options.allowValues) && options.allowValues.includes(value)) {
                return value;
            }
            if (!options || !options.validate) { return value; }
            if (options.validate.test(value)) { return value; }
            throw new Error('invalid value "' + value + '"');

        } catch (error) {
            throw new ParseStringError(name + ' -> parseString() fails', error);
        }
    }

    static parseStringArray (value: unknown, name: string, options?: IParseStringArrayOptions): string [] {
        try {
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
            if (typeof value === 'undefined' || value === null) { return value as unknown as string []; }
            if (options && options.allowString && typeof value  === 'string') { return [ value ]; }
            if (!Array.isArray(value)) { throw new TypeError('value not an array'); }
            if (!options || !options.allowEmptyArray && value.length === 0) { throw new Error('empty array not allowed'); }
            const rv: string [] = [];
            // eslint-disable-next-line unicorn/no-for-loop
            for (let i = 0; i < value.length; i++) {
                const s = value[i];
                const t = typeof s;
                if (t !== 'string') { throw new TypeError('invalid type ' + t + ' of item index ' + i); }
                rv.push(s);
            }
            return rv;

        } catch (error) {
            throw new ParseStringArrayError(name + ' -> parseStringArray() fails', error);
        }
    }

    static parseArray<T> (value: unknown, name: string, options?: IParseArrayOptions<T>): T [] {
        try {
            if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
            if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
            if (typeof value === 'undefined' || value === null) { return value as unknown as T []; }
            if (!Array.isArray(value)) { throw new TypeError('value not an array'); }
            if (options || !options.allowEmptyArray && value.length === 0) { throw new Error('empty array not allowed'); }
            const rv: T [] = [];
            for (const v of value) {
                if (options && options.typeof && typeof v !== options.typeof) { throw new Error('invalid array item'); }
                if (options && options.callback) {
                    rv.push(options.callback(v));
                } else {
                    rv.push(v);
                }
            }
            return rv;

        } catch (error) {
            throw new ParseArrayError(name + ' -> parseStringArray() fails', error);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseEnum<T> (value: unknown, name: string, type: any, options?: IParseEnumOptions): T {
        if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
        if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
        if (typeof value === 'undefined' || value === null) { return value as unknown as T; }
        try {
            for (const key in type) {
                if (value === type[key]) {
                    if (options && options.enumValueAsNumber && typeof value === 'number') {
                        return value as unknown as T;
                    } else if (options && options.enumValueAsNumber && typeof +key === 'number') {
                        return +key as unknown as T;
                    } else if (options && options.enumValue ) {
                        return key as unknown as T;
                    } else {
                        return value as T;
                    }
                }
            }
            throw new Error('invalid value ' + value);

        } catch (error) {
            throw new ParseEnumError(name + ' -> parseEnum() fails', error);
        }
    }

    static parseType<T> (value: unknown, name: string, allowed: string [], options?: IParseTypeOptions): T {
        if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
        if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
        if (typeof value === 'undefined' || value === null) { return value as unknown as T; }
        try {
            if (options && options.allowIndex && typeof value === 'number' && value >= 0 && value < allowed.length) {
                return allowed[value] as unknown as T;
            }
            if (typeof value === 'string' && allowed.includes(value)) {
                return value as unknown as T;
            }
            throw new Error('invalid value ' + value);

        } catch (error) {
            throw new ParseTypeError(name + ' -> parseType() fails', error);
        }
    }

    static parseObject<T, X> (value: unknown, name: string, options?: IParseObjectOptions<X>): T {
        if ((!options || !options.allowUndefined) && typeof value === 'undefined') { throw new Error('undefined not allowed'); }
        if ((!options || !options.allowNull) && value === null) { throw new Error('null not allowed'); }
        if (typeof value === 'undefined' || value === null) { return value as unknown as T; }
        if (typeof value !== 'object') { throw new TypeError('not an object'); }
        const attributes = Object.getOwnPropertyNames(value);
        if (attributes.length === 0) {
            if (options && !options.allowEmptyObject) { throw new Error('empty object not allowed'); }
            if (options && options.removeEmptyObject) { return undefined as unknown as T; }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rv: any = {};
        try {
            for (const a of attributes) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const v = (value as any)[a];
                if (options && options.callback) {
                    rv[a] = options.callback(a, v);
                } else {
                    rv[a] = v;
                }
            }
            return rv as T;

        } catch (error) {
            throw new ParseObjectError(name + ' -> parseType() fails', error);
        }
    }

}

export type TToObjectOptions<T> = {
    dates?: 'Date' | 'millis' | 'seconds' | 'ISOString' | ((d: Date) => unknown | undefined);
    callbacks?: TToObjectAttributeCallbacks<T>;
    attributes?: TToObjectAttributes<T>;
};

export type TToObjectCallback<T> = (value: unknown, attribute: string | number | symbol) => T[keyof T];

export type TToObjectAttributeCallbacks<T> = {
    [Property in keyof T]?: TToObjectCallback<T> | TToObjectCallback<T> [];
};

export type TToObjectAttributes<T> = {
    ignore?: keyof T | (keyof T) [];
    only?: keyof T | (keyof T) [];
    options?: { [Property in keyof T]: TToObjectOptions<unknown> }
};

export interface IParseBooleanOptions {
    expected?: boolean;
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowValueAsString?: boolean;
    allowValueAsNumber?: boolean;
}

export interface IParseNumberOptions {
    expected?: number | number [];
    min?: number;
    max?: number;
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowValueAsString?: boolean;
}

export interface IParseDateOptions {
    allowMillis?: boolean;
    allowSeconds?: boolean;
    allowString?: boolean;
    allowUndefined?: boolean;
    allowNull?: boolean;
}

export interface IParseStringOptions {
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowEmptyString?: boolean;
    allowValues?: string [];
    nullToUndefined?: boolean;
    validate?: RegExp;
}

export interface IParseStringArrayOptions {
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowString?: boolean;
    allowEmptyArray?: boolean;
}

export interface IParseArrayOptions<T> {
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowEmptyArray?: boolean;
    typeof?: string;
    callback?: (item: unknown) => T;
}

export interface IParseEnumOptions {
    allowUndefined?: boolean;
    allowNull?: boolean;
    enumValue?: boolean;
    enumValueAsNumber?: boolean;
}

export interface IParseTypeOptions {
    allowUndefined?: boolean;
    allowNull?: boolean;
    allowIndex?: boolean;
}

export interface IParseObjectOptions<T> {
    allowUndefined?: boolean;
    allowNull?: boolean;
    callback?: (key: string, value: unknown) => T;
    allowEmptyObject?: boolean;
    removeEmptyObject?: boolean;
}

export class ToObjectError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseBooleanError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseNumberError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseDateError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseStringError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseStringArrayError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseArrayError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseEnumError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseTypeError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}

export class ParseObjectError extends Error {
    constructor (message: string, public readonly cause?: unknown) { super(message); }
}
