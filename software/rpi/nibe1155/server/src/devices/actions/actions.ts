import { ActionSwitchHeatPumpOff } from './action-switch-heat-pump-off';
import { ActionSwitchBrinePumpOff } from './action-switch-brine-pump-off';
import { ActionSwitchHeatPumpOn } from './action-switch-heat-pump-on';
import { ActionSwitchBrinePumpOn } from './action-switch-brine-pump-on';
import { ActionSetCurve } from './action-set-curve';
import { ActionSetCurve0Temp } from './action-set-curve0-temp';

export class Actions {
    static SwitchHeatPumpOff  = ActionSwitchHeatPumpOff;
    static SwitchBrinePumpOff = ActionSwitchBrinePumpOff;
    static SwitchHeatPumpOn   = ActionSwitchHeatPumpOn;
    static SwitchBrinePumpOn  = ActionSwitchBrinePumpOn;
    static SetCurve           = ActionSetCurve;
    static SetCurve0Temp      = ActionSetCurve0Temp;
}
