import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('actions.ActionSwitchBrinePumpOff');

import { Action, ActionError } from './action';


export class ActionSwitchBrinePumpOff extends Action {

    constructor () {
        super();
    }

    public async execute (): Promise<Action> {
        this._startedAt = new Date();
        for (let cnt = 0; cnt < 3; cnt++) {
            try {
                await this._device.writeBrinePumpMode('auto');
                const v = await this._device.readBrinePumpMode(0);
                if (v !== 'auto') {
                    throw new Error('wrong response ' + v);
                }
                this.finish();
                return this;
            } catch (err) {
                this.addError(err);
            }
        }
        throw new ActionError(this, 'setting brine pump mode "auto" fails');
    }

}
