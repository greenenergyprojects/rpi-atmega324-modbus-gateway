
import { sprintf } from 'sprintf-js';

import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('modbus:ModbusAsciiFrame');


export class ModbusAsciiFrame {


    private _at: Date;
    private _frame?: string;
    private _buffer?: Buffer;
    private _lrcOk: boolean;

    public constructor (x?: Buffer | string ) {
        this._at = new Date();
        if (x && x instanceof Buffer && x.length >= 2) {
            this._buffer = x;
            let lrc = 0;
            let s = ':';
            for (let i = 0; i < x.length; i++) {
                /* tslint:disable-next-line:no-bitwise */
                lrc = (lrc + x[i]) & 0xff;
                s = s + sprintf('%02X', x[i]);
            }
            this._frame = s + sprintf('%02X\r\n', ((255 - lrc) + 1) % 256);
            this._lrcOk = true;

        } else if (x && typeof(x) === 'string' && x.length >= 9 && x.match(/^:([0-9A-F][0-9A-F])+\x0d\x0a$/)) {
            this._frame = x;
            this._buffer = Buffer.alloc((x.length - 5) / 2);
            let lrc = 0;
            for (let i = 1, j = 0; i < x.length - 4; i += 2, j++) {
                const b = parseInt(x.substr(i, 2), 16);
                /* tslint:disable-next-line:no-bitwise */
                lrc = (lrc + b) & 0xff;
                this._buffer[j] = b;
            }
            const fLrc = parseInt(x.substr(x.length - 4, 2), 16);
            this._lrcOk = fLrc === (((255 - lrc) + 1) % 256);
        } else {
            throw new Error('illegal argument');
        }
    }

    public get at (): Date {
        return this._at;
    }

    public get frame (): string {
        return this._frame;
    }

    public get buffer (): Buffer {
        return this._buffer;
    }

    public get lrcOk (): boolean {
        return this._lrcOk;
    }

    public byteAt (index: number): number {
        return this._buffer[index];
    }

    public wordAt (index: number): number {
        return this._buffer[index] * 256 + this._buffer[index + 1];
    }

    public valueAt (index: number, type: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32') {
        switch (type) {
            case 'u8':  return this.u8At(index);
            case 's8':  return this.s8At(index);
            case 'u16': return this.u16At(index);
            case 's16': return this.s16At(index);
            case 'u32': return this.u32At(index);
            case 's32': return this.s32At(index);
            default: return Number.NaN;
        }
    }

    public u8At (index: number): number {
        if (!this._buffer || this.buffer.length < index) { return Number.NaN; }
        const rv = this._buffer[index + 1];
        return rv;
    }

    public s8At (index: number): number {
        if (!this._buffer || this.buffer.length < index) { return Number.NaN; }
        const rv = this._buffer[index + 1];
        return rv >= 128 ? rv - 256 : rv;
    }

    public u16At (index: number): number {
        if (!this._buffer || this.buffer.length < index) { return Number.NaN; }
        const rv = this._buffer[index] * 256 + this._buffer[index + 1];
        return rv;
    }

    public s16At (index: number): number {
        if (!this._buffer || this.buffer.length < index) { return Number.NaN; }
        const rv = this._buffer[index] * 256 + this._buffer[index + 1];
        return rv >= 32768 ? rv - 65536 : rv;
    }

    public u32At (index: number): number {
        if (!this._buffer || this.buffer.length < index + 2) { return Number.NaN; }
        // tslint:disable-next-line:max-line-length
        const rv = ( (this._buffer[index + 2] * 256 + this._buffer[index + 3]) * 256 + this._buffer[index + 0]) * 256 + this._buffer[index + 1];
        return rv;
    }

    public s32At (index: number): number {
        if (!this._buffer || this.buffer.length < index + 2) { return Number.NaN; }
        // tslint:disable-next-line:max-line-length
        const rv = ( (this._buffer[index + 2] * 256 + this._buffer[index + 3]) * 256 + this._buffer[index + 0]) * 256 + this._buffer[index + 1];
        return rv >= 0x80000000 ? rv - 0x100000000 : rv;;
    }

}
