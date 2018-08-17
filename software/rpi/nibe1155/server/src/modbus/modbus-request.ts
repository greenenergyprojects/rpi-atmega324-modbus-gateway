
import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('modbus:ModbusRequest');

import { ModbusAsciiFrame } from './modbus-ascii-frame';
import { ModbusSerial } from './modbus-serial';

export class ModbusRequest {
    protected _request: ModbusAsciiFrame;
    protected _requestReceived: ModbusAsciiFrame;
    protected _response: ModbusAsciiFrame;
    protected _sentAt: Date;
    protected _requestReceivedAt: Date;
    protected _responseAt: Date;
    protected _error: ModbusRequestError;

    constructor (request: ModbusAsciiFrame) {
        this._request = request;
    }

    public get request (): ModbusAsciiFrame {
        return this._request;
    }

    public get requestReceived (): ModbusAsciiFrame {
        return this._requestReceived;
    }

    public set requestReceived (value: ModbusAsciiFrame) {
        if (this._requestReceived) { throw new Error('_requestReceived already set'); }
        if (!this._request.buffer || !value.buffer) { throw new Error('cannot set requestReceived, internal error'); }
        if (this._request.buffer.length !== value.buffer.length) {
            throw new Error('cannot set requestReceived, received frame is not the sent request');
        }
        for (let i = 0; i < this._request.buffer.length; i++) {
            if (this._request.buffer[i] !== value.buffer[i]) {
                throw new Error('cannot set requestReceived, received frame differs to the sent request');
            }
        }
        this._requestReceived = value;
        this._requestReceivedAt = new Date();
    }

    public get response (): ModbusAsciiFrame {
        return this._response;
    }

    public set response (value: ModbusAsciiFrame) {
        if (this._error || this._response) { throw new Error('response/error already set'); }
        if (!this._requestReceived) { throw new Error('requestReceived not set before'); }
        this._response = value;
        this._responseAt = new Date();
    }

    public get sentAt (): Date {
        return this._sentAt;
    }

    public set sentAt (value: Date) {
        if (this._sentAt) { throw new Error('sentAt already set'); }
        this._sentAt = value;
    }

    public get requestReceivedAt (): Date {
        return this._requestReceivedAt;
    }

    public get responseAt (): Date {
        return this._responseAt;
    }

    public get error (): ModbusRequestError {
        return this._error;
    }

    public set error (value: ModbusRequestError) {
        if (this._error) { throw new Error('error already set'); }
        this._error = value;
    }
}

export class ModbusRequestFactory extends ModbusRequest {

    public static createReadHoldRegister (dev: number, addr: number, quantity: number, isLogSetRegister?: boolean): ModbusRequestFactory {
        if (dev < 0 || dev > 255) { throw new Error('illegal arguments'); }
        if (addr < 1 || addr >= 0x10000) { throw new Error('illegal arguments'); }
        if (quantity < 1 || quantity >= 0x7d) { throw new Error('illegal arguments'); }
        const b = Buffer.alloc(6);
        b[0] = dev;
        b[1] = 0x03;
        /* tslint:disable:no-bitwise */
        b[2] = (addr - 1) >> 8;
        b[3] = (addr - 1) & 0xff;
        /* tslint:enable:no-bitwise */
        b[4] = 0;
        b[5] = quantity;
        return new ModbusRequestFactory(new ModbusAsciiFrame(b), isLogSetRegister);
    }

    public static createWriteHoldRegister (dev: number, addr: number, value: number, isLogSetRegister?: boolean): ModbusRequestFactory {
        if (dev < 0 || dev > 255) { throw new Error('illegal arguments'); }
        if (addr < 1 || addr >= 0x10000) { throw new Error('illegal arguments'); }
        if (value < 0 || value >= 0xffff) { throw new Error('illegal arguments'); }
        const b = Buffer.alloc(6);
        b[0] = dev;
        b[1] = 0x06;
        /* tslint:disable:no-bitwise */
        b[2] = (addr - 1) >> 8;
        b[3] = (addr - 1) & 0xff;
        b[4] = value >> 8;
        b[5] = value & 0xff;
        /* tslint:enable:no-bitwise */
        return new ModbusRequestFactory(new ModbusAsciiFrame(b), isLogSetRegister);
    }

    public static createWriteMultipleHoldRegisters (
        dev: number, addr: number, quantity: number, values: number [], isLogSetRegister?: boolean): ModbusRequestFactory {
        if (dev < 0 || dev > 255) { throw new Error('illegal arguments'); }
        if (addr < 1 || addr >= 0x10000) { throw new Error('illegal arguments'); }
        if (!Array.isArray(values)) { throw new Error('illegal arguments'); }
        // if (value < 0 || value >= 0xffff) { throw new Error('illegal arguments'); }
        const b = Buffer.alloc(7 + quantity * 2);
        b[0] = dev;
        b[1] = 0x10;
        /* tslint:disable:no-bitwise */
        b[2] = (addr - 1) >> 8;
        b[3] = (addr - 1) & 0xff;
        b[4] = quantity >> 8;
        b[5] = quantity & 0xff;
        b[6] = quantity * 2;
        for (let i = 0; i < quantity; i++) {
            const v = values[i];
            if (v < 0 || v >= 0xffff) { throw new Error('illegal arguments'); }
            b[7 + i * 2] = v >> 8;
            b[8 + i * 2] = v & 0xff;
        }
        /* tslint:enable:no-bitwise */
        return new ModbusRequestFactory(new ModbusAsciiFrame(b), isLogSetRegister);
    }

    private _isLogSetRegister: boolean;

    constructor (request: ModbusAsciiFrame, isLogSetRegister?: boolean) {
        super(request);
        this._isLogSetRegister = isLogSetRegister === true ? true : false;
    }

    public get isLogSetRegister (): boolean {
        return this._isLogSetRegister;
    }

}


export class ModbusRequestError extends Error {

    private _request: ModbusRequest;
    private _cause: any;

    constructor (message: string, request: ModbusRequest, cause?: any) {
        super(message);
        this._request = request;
        this._cause = cause;
    }

    public get request (): ModbusRequest {
        return this._request;
    }

    public get cause (): any {
        return this._cause;
    }

}


