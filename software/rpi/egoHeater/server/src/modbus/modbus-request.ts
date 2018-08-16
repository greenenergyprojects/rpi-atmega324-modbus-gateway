
import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('modbus:ModbusRequest');

import { ModbusAsciiFrame } from './modbus-ascii-frame';
import { ModbusSerial } from './modbus-serial';

export class ModbusRequest {

    public static createReadHoldRegister (dev: number, addr: number, quantity: number): ModbusRequest {
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
        return new ModbusRequest(new ModbusAsciiFrame(b));
    }

    public static createWriteHoldRegister (dev: number, addr: number, value: number): ModbusRequest {
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
        return new ModbusRequest(new ModbusAsciiFrame(b));
    }

    private _request: ModbusAsciiFrame;
    private _response: ModbusAsciiFrame;
    private _sentAt: Date;

    constructor (request: ModbusAsciiFrame) {
        this._request = request;
    }

    public get request (): ModbusAsciiFrame {
        return this._request;
    }

    public async send (serial: ModbusSerial): Promise<ModbusAsciiFrame> {
        // serial.write(this);
        return null;
    }



}
