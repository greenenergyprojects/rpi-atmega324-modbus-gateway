import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('actions.ActionSetCurve');

import { Action, ActionError } from './action';


export class ActionSetCurve extends Action {

    private _curve: number;

    constructor (curve: number) {
        super();
        this._curve = curve;
    }

    public async execute (): Promise<Action> {
        this._startedAt = new Date();
        for (let cnt = 0; cnt < 3; cnt++) {
            try {
                await this._device.writeHeatCurve(this._curve);
                const v = await this._device.readHeatCurve(0);
                if (v !== this._curve) {
                    throw new Error('wrong response ' + v);
                }
                this.finish();
                return this;
            } catch (err) {
                this.addError(err);
            }
        }
        throw new ActionError(this, 'setting curve ' + this._curve + ' fails');
    }

}
