
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

    public static createWriteMultipleHoldRegisters (dev: number, addr: number, quantity: number, values: number []): ModbusRequest {
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
