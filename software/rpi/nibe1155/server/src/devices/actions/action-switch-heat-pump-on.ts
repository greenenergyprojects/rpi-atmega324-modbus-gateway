import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('actions.ActionSwitchHeatPumpOn');

import { Action, ActionError } from './action';


export class ActionSwitchHeatPumpOn extends Action {

    constructor () {
        super();
    }

    public async execute (): Promise<Action> {
        this._startedAt = new Date();
        for (let cnt = 0; cnt < 3; cnt++) {
            try {
                await this._device.writeSupplyPumpMode('continous');
                const v = await this._device.readSupplyPumpMode(0);
                console.log(v);
                if (v !== 'continous') {
                    throw new Error('wrong response ' + v);
                }
                this.finish();
                return this;
            } catch (err) {
                debug.warn(err);
                this.addError(err);
            }
        }
        throw new ActionError(this, 'setting heat pump mode "continous" fails');
    }

}
