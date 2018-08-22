import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('actions.ActionSetCurve0Temp');

import { Action, ActionError } from './action';


export class ActionSetCurve0Temp extends Action {

    private _temp: number [];

    constructor (temp: number | number []) {
        super();
        if (Array.isArray(temp)) {
            if (temp.length < 1 || temp.length > 7 ) {
                 throw new Error('temp array length ' + temp.length + ') above maximum of 7');
            }
            this._temp = [];
            let lastTemp = temp[0];
            for (let i = 0; i < 7; i++) {
                const t = i < temp.length ? temp[i] : lastTemp;
                if (t < 5 || t > 80) { throw new Error('temperature ' + t + ' out of range (5..80°C)'); }
                this._temp.push(t);
                lastTemp = t;
            }
        } else {
            const t = temp;
            if (t < 5 || t > 80) { throw new Error('temperature ' + t + ' out of range (5..80°C)'); }
            this._temp = [ t, t, t, t, t, t, t ];
        }
    }

    public async execute (): Promise<Action> {
        this._startedAt = new Date();
        loop1: for (let i = 0; i < this._temp.length; i++) {
            for (let cnt = 0; cnt < 3; cnt++) {
                try {
                    const t = this._temp[i];
                    const tOut = [ -30, -20, -10, 0, 10, 20, 30 ][i];
                    debugger;
                    await this._device.writeOwnHeatCurvePoint(<any>tOut, t);
                    const rv = await this._device.readOwnHeatCurvePoint(<any>tOut, 0);
                    if (rv !== t) {
                        throw new Error('wrong response on tOut=' + tOut + '°C, get ' + rv + '°C, expect ' + t + '°C');
                    }
                    continue loop1;
                } catch (err) {
                    this.addError(err);
                }
            }
            throw new ActionError(this, 'setting curve0 temp to ' + this._temp +  ' fails');
        }
        this.finish();
        return this;
    }

}
