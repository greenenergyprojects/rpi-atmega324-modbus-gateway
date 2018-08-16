
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
            this._frame = s + sprintf('%02X\r\n', (255 - lrc) + 1);
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
            this._lrcOk = fLrc === (255 - lrc) + 1;
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

    public get lrcOk (): boolean {
        return this._lrcOk;
    }


}
