import * as debugsx from 'debug-sx';
const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('actions.ActionSwitchBrinePumpOn');

import { Action, ActionError } from './action';


export class ActionSwitchBrinePumpOn extends Action {

    constructor () {
        super();
    }

    public async execute (): Promise<Action> {
        this._startedAt = new Date();
        for (let cnt = 0; cnt < 3; cnt++) {
            try {
                await this._device.writeBrinePumpMode('continous');
                const v = await this._device.readBrinePumpMode(0);
                if (v !== 'continous') {
                    throw new Error('wrong response ' + v);
                }
                this.finish();
                return this;
            } catch (err) {
                this.addError(err);
            }
        }
        throw new ActionError(this, 'setting brine pump mode "continous" fails');
    }

}
