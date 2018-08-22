import { INibe1155Value } from './nibe1155-value';

export type Nibe1155ModbusIds =
    // LOG.SET registers (low polling time)
    40004 | 40008 | 40012 | 40015 | 40016 | 40017 | 40018 | 40019 | 40022 | 40071 |
    43005 | 43084 | 43136 | 43141 | 43427 | 43431 | 43433 | 43437 | 43439 |
    // normal register (high polling time)
    40033 | 40067 | 40079 | 40081 | 40083 |
    47007 | 47011 | 47015 | 47019 | 47020 | 47021 | 47022 | 47023 | 47024 | 47025 | 47026 |
    47137 | 47138 | 47139 | 47206 | 47209 | 47212 | 47214 | 47370 | 47371 | 47376 | 47375 |
    48072 |
    48659 | 48660 | 48661 | 48662 | 48663 | 48664;

export interface INibe1155 {
    outdoorTemp:           INibe1155Value;
    supplyS1Temp:          INibe1155Value;
    supplyReturnTemp:      INibe1155Value;
    brineInTemp:           INibe1155Value;
    brineOutTemp:          INibe1155Value;
    condensorOutTemp:      INibe1155Value;
    hotGasTemp:            INibe1155Value;
    liquidLineTemp:        INibe1155Value;
    suctionTemp:           INibe1155Value;
    supplyTemp:            INibe1155Value;
    degreeMinutes:         INibe1155Value;
    electricHeaterPower:   INibe1155Value;
    compressorFrequency:   INibe1155Value;
    compressorInPower:     INibe1155Value;
    compressorState:       INibe1155Value;
    supplyPumpState:       INibe1155Value;
    brinePumpState:        INibe1155Value;
    supplyPumpSpeed:       INibe1155Value;
    brinePumpSpeed:        INibe1155Value;
    // start of normal register
    roomTemp:              INibe1155Value;
    outdoorTempAverage:    INibe1155Value;
    currentL1:             INibe1155Value;
    currentL2:             INibe1155Value;
    currentL3:             INibe1155Value;
    heatCurveS1:           INibe1155Value;
    heatOffsetS1:          INibe1155Value;
    supplyMinS1:           INibe1155Value;
    supplyMaxS1:           INibe1155Value;
    ownHeatCurveP7:        INibe1155Value;
    ownHeatCurveP6:        INibe1155Value;
    ownHeatCurveP5:        INibe1155Value;
    ownHeatCurveP4:        INibe1155Value;
    ownHeatCurveP3:        INibe1155Value;
    ownHeatCurveP2:        INibe1155Value;
    ownHeatCurveP1:        INibe1155Value;
    operationalMode:       INibe1155Value;
    supplyPumpMode:        INibe1155Value;
    brinePumpMode:         INibe1155Value;
    dmStartHeating:        INibe1155Value;
    addHeatingStep:        INibe1155Value;
    addHeatingMaxPower:    INibe1155Value;
    addHeatingFuse:        INibe1155Value;
    allowAdditiveHeating:  INibe1155Value;
    allowHeating:          INibe1155Value;
    stopTempHeating:       INibe1155Value;
    stopTempAddHeating:    INibe1155Value;
    dmDiffStartAddHeating: INibe1155Value;
    cutOffFrequActivated2: INibe1155Value;
    cutOffFrequActivated1: INibe1155Value;
    cutOffFrequStart2:     INibe1155Value;
    cutOffFrequStart1:     INibe1155Value;
    cutOffFrequStop2:      INibe1155Value;
    cutOffFrequStop1:      INibe1155Value;
}

export type Nibe1155ModbusAttributes = keyof INibe1155;


export class Nibe1155Modbus {

    // tslint:disable:max-line-length
    static regDefById: { [ id in Nibe1155ModbusIds ]: INibe1155Value } =  {
          40004: { id: 40004, label: 'outdoorTemp',           type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-5.01f', description: 'Outdoor temperature (BT1)', help: 'Außentemperatur'}
        , 40008: { id: 40008, label: 'supplyS1Temp',          type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Supply S1 temperature (BT2)', help: 'Heizkreis Vorlauf'}
        , 40012: { id: 40012, label: 'supplyReturnTemp',      type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Supply return temperature (BT3)', help: 'Heizkreis Rücklauf' }
        , 40015: { id: 40015, label: 'brineInTemp',           type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-5.01f', description: 'Brine-In temperature (BT10)', help: 'Sole ein' }
        , 40016: { id: 40016, label: 'brineOutTemp',          type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-5.01f', description: 'Brine-out temperature (BT11)', help: 'Sole aus' }
        , 40017: { id: 40017, label: 'condensorOutTemp',      type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Condensor-Out temperature (BT12)', help: 'Kondensatorausgang' }
        , 40018: { id: 40018, label: 'hotGasTemp',            type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Hot-Gas (BT14)', help: 'Verdampfergas' }
        , 40019: { id: 40019, label: 'liquidLineTemp',        type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Liquid-Line (BT15)', help: 'Flüssigkeit' }
        , 40022: { id: 40022, label: 'suctionTemp',           type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Suction temperature (BT17)', help: 'Ansaugung' }
        , 40071: { id: 40071, label: 'supplyTemp',            type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'External supply temperature (BT25)', help: 'Puffer' }
        , 43005: { id: 43005, label: 'degreeMinutes',         type: 'R/W', unit: '',   size: 's16', factor: 10,  format: '%-6.01f', description: 'Degree Minutes (16 bit)', help: 'Gradminuten' }
        , 43084: { id: 43084, label: 'electricHeaterPower',   type: 'R',   unit: 'W',  size: 's16', factor: 0.1, format: '%3d',     description: 'Current power from internal electrical addtion', help: 'Zusatzheizung' }
        , 43136: { id: 43136, label: 'compressorFrequency',   type: 'R',   unit: 'Hz', size: 'u16', factor: 10,  format: '%-5.01f', description: 'Compressor frequency', help: 'Kompressorfrequenz' }
        , 43141: { id: 43141, label: 'compressorInPower',     type: 'R',   unit: 'W',  size: 'u16', factor: 0.1, format: '%3d',     description: 'Compressor in power', help: 'Kompressorverbrauch' }
        , 43427: { id: 43427, label: 'compressorState',       type: 'R',   unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Compressor state', help: '20=stop,40=start,60=run,100=stopping' }
        , 43431: { id: 43431, label: 'supplyPumpState',       type: 'R',   unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Supply pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43433: { id: 43433, label: 'brinePumpState',        type: 'R',   unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Brine pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43437: { id: 43437, label: 'supplyPumpSpeed',       type: 'R',   unit: '%',  size: 'u8',  factor: 1,   format: '%-3d',    description: 'Supply pump speed', help: 'heizungspumpe' }
        , 43439: { id: 43439, label: 'brinePumpSpeed',        type: 'R',   unit: '%',  size: 'u8',  factor: 1,   format: '%-3d',    description: 'Brine pump speed', help: 'Solepumpe' }
        // , 40071: { id: 40071, label: '',       type: 'R', unit: '°C', size: 's16', factor: 1, description: '', help: '' }
        , 40033: { id: 40033, label: 'roomTemp',              type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Room Temperature S1 (BT50)', help: 'Innentemperatur' }
        , 40067: { id: 40067, label: 'outdoorTempAverage',    type: 'R',   unit: '°C', size: 's16', factor: 10,  format: '%-4.01f', description: 'Outdoor Temperature (BT1) average', help: 'Gemittelte Außentemperatur' }
        , 40079: { id: 40079, label: 'currentL1',             type: 'R',   unit: 'A',  size: 'u32', factor: 10,  format: '%-4.01f', description: 'Electrical Heater current L1', help: '' }
        , 40081: { id: 40081, label: 'currentL2',             type: 'R',   unit: 'A',  size: 'u32', factor: 10,  format: '%-4.01f', description: 'Electrical Heater current L2', help: '' }
        , 40083: { id: 40083, label: 'currentL3',             type: 'R',   unit: 'A',  size: 'u32', factor: 10,  format: '%-4.01f', description: 'Electrical Heater current L3', help: '' }
        , 47007: { id: 47007, label: 'heatCurveS1',           type: 'R/W', unit: '',   size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve S1', help: 'Auswahl Heizkurve 0..15' }
        , 47011: { id: 47011, label: 'heatOffsetS1',          type: 'R/W', unit: '',   size: 's8',  factor: 1,   format: '%3d',     description: 'Heat offset S1', help: 'Offset Heizkurve -10..+10' }
        , 47015: { id: 47015, label: 'supplyMinS1',           type: 'R/W', unit: '°C', size: 's16', factor: 10,  format: '%4d',     description: 'Heat supply minimum S1', help: 'Vorlauf Minimaltemperatur 5°C .. 70°C' }
        , 47019: { id: 47019, label: 'supplyMaxS1',           type: 'R/W', unit: '°C', size: 's16', factor: 10,  format: '%4d',     description: 'Heat supply maximum S1', help: 'Vorlauf Maximaltemperatur 5°C .. 80°C' }
        , 47020: { id: 47020, label: 'ownHeatCurveP7',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei +30°C, 5°C .. 80°C' }
        , 47021: { id: 47021, label: 'ownHeatCurveP6',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei +20°C, 5°C .. 80°C' }
        , 47022: { id: 47022, label: 'ownHeatCurveP5',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei +10°C, 5°C .. 80°C' }
        , 47023: { id: 47023, label: 'ownHeatCurveP4',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei 0°C, 5°C .. 80°C' }
        , 47024: { id: 47024, label: 'ownHeatCurveP3',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei -10°C, 5°C .. 80°C' }
        , 47025: { id: 47025, label: 'ownHeatCurveP2',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei -20°C, 5°C .. 80°C' }
        , 47026: { id: 47026, label: 'ownHeatCurveP1',        type: 'R/W', unit: '°C', size: 's8',  factor: 1,   format: '%2d',     description: 'Heat curve 0 bei -30°C, 5°C .. 80°C' }
        , 47137: { id: 47137, label: 'operationalMode',       type: 'R/W', unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Operation mode of heat pump', help: '0=auto, 1=manual, 2=add heat only' }
        , 47138: { id: 47138, label: 'supplyPumpMode',        type: 'R/W', unit: '',   size: 'u8',  factor: 1,   format: '%2d',     description: 'Operation mode of heat medium pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47139: { id: 47139, label: 'brinePumpMode',         type: 'R/W', unit: '',   size: 'u8',  factor: 1,   format: '%2d',     description: 'Operation mode of brine pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47206: { id: 47206, label: 'dmStartHeating',        type: 'R/W', unit: '',   size: 's16', factor: 1,   format: '%6d',     description: 'Degree minutes for start of heating (compressro)', help: '-1000 .. -30' }
        , 47209: { id: 47209, label: 'addHeatingStep',        type: 'R/W', unit: '',   size: 's16', factor: 1,   format: '%6d',     description: 'Degree minutes for next step of additional heater', help: '' }
        , 47212: { id: 47212, label: 'addHeatingMaxPower',    type: 'R/W', unit: 'W',  size: 's16', factor: 0.1, format: '%4.02f',  description: 'Maximal power of additional heater', help: '0W ... 6000W' }
        , 47214: { id: 47214, label: 'addHeatingFuse',        type: 'R/W', unit: 'A',  size: 'u16', factor: 1,   format: '%3d',     description: 'Fuse current for heater', help: '0A ... 400A' }
        , 47370: { id: 47370, label: 'allowAdditiveHeating',  type: 'R/W', unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Allow electrical heating', help: '0 .. 1' }
        , 47371: { id: 47371, label: 'allowHeating',          type: 'R/W', unit: '',   size: 'u8',  factor: 1,   format: '%1d',     description: 'Allow heat pump heating', help: '0 .. 1' }
        , 47375: { id: 47375, label: 'stopTempHeating',       type: 'R/W', unit: '°C', size: 's16', factor: 10,  format: '%5.01f', description: 'Heating stop temperature', help: '-20°C .. +40°C' }
        , 47376: { id: 47376, label: 'stopTempAddHeating',    type: 'R/W', unit: '°C', size: 's16', factor: 10,  format: '%5.01f', description: 'Additive Heating stop temperature', help: '-25°C .. 40°C' }
        , 48072: { id: 48072, label: 'dmDiffStartAddHeating', type: 'R/W', unit: '',   size: 's16', factor: 1,   format: '%3d',     description: 'DM below last comp step to start elect. heat.', help: '?' }
        , 48659: { id: 48659, label: 'cutOffFrequActivated2', type: 'R/W', unit: '',   size: 's8',  factor: 1,   format: '%1d',     description: 'Cut of frequency activated 2', help: 'forbid start 2 ... stop 2' }
        , 48660: { id: 48660, label: 'cutOffFrequActivated1', type: 'R/W', unit: '',   size: 's8',  factor: 1,   format: '%1d',     description: 'Cut of frequency activated 1', help: 'forbid start 1 ... stop 1' }
        , 48661: { id: 48661, label: 'cutOffFrequStart2',     type: 'R/W', unit: 'Hz', size: 'u8',  factor: 1,   format: '%3d',     description: 'Cut of frequency start 2', help: '17Hz .. 115Hz' }
        , 48662: { id: 48662, label: 'cutOffFrequStart1',     type: 'R/W', unit: 'Hz', size: 'u8',  factor: 1,   format: '%3d',     description: 'Cut of frequency start 1', help: '17Hz .. 115Hz' }
        , 48663: { id: 48663, label: 'cutOffFrequStop2',      type: 'R/W', unit: 'Hz', size: 'u8',  factor: 1,   format: '%3d',     description: 'Cut of frequency stop 2', help: '22Hz .. 120Hz' }
        , 48664: { id: 48664, label: 'cutOffFrequStop1',      type: 'R/W', unit: 'Hz', size: 'u8',  factor: 1,   format: '%3d',     description: 'Cut of frequency stop 1', help: '22Hz .. 120Hz' }
    };
    // tslint:enable:max-line-length

    static regDefByLable: { [ id in Nibe1155ModbusAttributes ]: INibe1155Value } = {
        // start of the LOG.SET registers
          outdoorTemp:           Nibe1155Modbus.regDefById[40004]
        , supplyS1Temp:          Nibe1155Modbus.regDefById[40008]
        , supplyReturnTemp:      Nibe1155Modbus.regDefById[40012]
        , brineInTemp:           Nibe1155Modbus.regDefById[40015]
        , brineOutTemp:          Nibe1155Modbus.regDefById[40016]
        , condensorOutTemp:      Nibe1155Modbus.regDefById[40017]
        , hotGasTemp:            Nibe1155Modbus.regDefById[40018]
        , liquidLineTemp:        Nibe1155Modbus.regDefById[40019]
        , suctionTemp:           Nibe1155Modbus.regDefById[40022]
        , supplyTemp:            Nibe1155Modbus.regDefById[40071]
        , degreeMinutes:         Nibe1155Modbus.regDefById[43005]
        , electricHeaterPower:   Nibe1155Modbus.regDefById[43084]
        , compressorFrequency:   Nibe1155Modbus.regDefById[43136]
        , compressorInPower:     Nibe1155Modbus.regDefById[43141]
        , compressorState:       Nibe1155Modbus.regDefById[43427]
        , supplyPumpState:       Nibe1155Modbus.regDefById[43431]
        , brinePumpState:        Nibe1155Modbus.regDefById[43433]
        , supplyPumpSpeed:       Nibe1155Modbus.regDefById[43437]
        , brinePumpSpeed:        Nibe1155Modbus.regDefById[43439]
        // start of the normal registers
        , roomTemp:              Nibe1155Modbus.regDefById[40033]
        , outdoorTempAverage:    Nibe1155Modbus.regDefById[40067]
        , currentL1:             Nibe1155Modbus.regDefById[40079]
        , currentL2:             Nibe1155Modbus.regDefById[40081]
        , currentL3:             Nibe1155Modbus.regDefById[40083]
        , heatCurveS1:           Nibe1155Modbus.regDefById[47007]
        , heatOffsetS1:          Nibe1155Modbus.regDefById[47011]
        , supplyMinS1:           Nibe1155Modbus.regDefById[47015]
        , supplyMaxS1:           Nibe1155Modbus.regDefById[47019]
        , ownHeatCurveP7:        Nibe1155Modbus.regDefById[47020]
        , ownHeatCurveP6:        Nibe1155Modbus.regDefById[47021]
        , ownHeatCurveP5:        Nibe1155Modbus.regDefById[47022]
        , ownHeatCurveP4:        Nibe1155Modbus.regDefById[47023]
        , ownHeatCurveP3:        Nibe1155Modbus.regDefById[47024]
        , ownHeatCurveP2:        Nibe1155Modbus.regDefById[47025]
        , ownHeatCurveP1:        Nibe1155Modbus.regDefById[47026]
        , operationalMode:       Nibe1155Modbus.regDefById[47137]
        , supplyPumpMode:        Nibe1155Modbus.regDefById[47138]
        , brinePumpMode:         Nibe1155Modbus.regDefById[47139]
        , dmStartHeating:        Nibe1155Modbus.regDefById[47206]
        , addHeatingStep:        Nibe1155Modbus.regDefById[47209]
        , addHeatingMaxPower:    Nibe1155Modbus.regDefById[47212]
        , addHeatingFuse:        Nibe1155Modbus.regDefById[47214]
        , allowAdditiveHeating:  Nibe1155Modbus.regDefById[47370]
        , allowHeating:          Nibe1155Modbus.regDefById[47371]
        , stopTempHeating:       Nibe1155Modbus.regDefById[47375]
        , stopTempAddHeating:    Nibe1155Modbus.regDefById[47376]
        , dmDiffStartAddHeating: Nibe1155Modbus.regDefById[48072]
        , cutOffFrequActivated2: Nibe1155Modbus.regDefById[48659]
        , cutOffFrequActivated1: Nibe1155Modbus.regDefById[48660]
        , cutOffFrequStart2:     Nibe1155Modbus.regDefById[48661]
        , cutOffFrequStart1:     Nibe1155Modbus.regDefById[48662]
        , cutOffFrequStop2:      Nibe1155Modbus.regDefById[48663]
        , cutOffFrequStop1:      Nibe1155Modbus.regDefById[48664]
    };
}



    // tslint:disable:max-line-length
    //   , { id: 44308, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat meter - heat compressor' }
    //   , { id: 40033, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Innentemperatur (BT50)' }
    //   , { id: 40067, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Outdoor temperature (BT1) average' }
    //   , { id: 40079, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L3' }
    //   , { id: 40081, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L2' }
    //   , { id: 40083, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L1' }
    //   , { id: 40185, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Outdoor temperature (BT1) average 1h' }
    //   , { id: 40195, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Innentemperatur (BT50) average' }
    //   , { id: 40316, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Inverter limit status' }
    //   , { id: 40317, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Inverter drive status' }
    //   , { id: 40321, logset: false, unit: 'Hz',  size: 'u16', factor: 1,   mode: 'R',   name: 'Compressor frequency request' }
    //   , { id: 40322, logset: false, unit: 'Hz',  size: 'u16', factor: 100, mode: 'R',   name: 'Max compressor frequency heating' }
    //   , { id: 40323, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter alarm code' }
    //   , { id: 40324, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter fault code' }
    //   , { id: 40326, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter drive command' }
    //   , { id: 40327, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Pic version' }
    //   , { id: 40328, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE inverter 8051 version' }
    //   , { id: 40329, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Def. Wizard' }
    //   , { id: 40330, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Mce version' }
    //   , { id: 40331, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Hw version' }
    //   , { id: 40332, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Hw type' }
    //   , { id: 40813, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Compressor slow down reason' }
    //   , { id: 40872, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R',   name: '+Adjust Parallel adjustment' }
    //   , { id: 40874, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: '+Adjust Temp indoor' }
    //   , { id: 40875, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: '+Adjust Temp outdoor' }
    //   , { id: 40877, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: '+Adjust Activated' }
    //   , { id: 40878, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: '+Adjust Need (call for heat)' }
    //   , { id: 40940, logset: false, unit: '',    size: 's32', factor: 10,  mode: 'R',   name: 'Degree Minutes (32 bit)' }
    //   , { id: 40993, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter min speed' }
    //   , { id: 40994, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter max speed' }
    //   , { id: 41191, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'PV Panel State' }
    //   , { id: 42033, logset: false, unit: '°C',  size: 'u8',  factor: 10,  mode: 'R',   name: 'PV Panel Heat Offset' }
    //   , { id: 42100, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Außentemperatur (BT1) average 24h' }
    //   , { id: 42101, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Used heating power average 24h - ?? °C ??' }
    //   , { id: 42439, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat Meter - Heat compressor and Add - Total system' }
    //   , { id: 42447, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat Meter - Heat compressor - Total system' }
    //   , { id: 43001, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Software version' }
    //   , { id: 43013, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Freeze Protection Status' }
    //   , { id: 43064, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Heat Medium Flow dT Set Point' }
    //   , { id: 43065, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Heat Medium Flow dT Actual' }
    //   , { id: 43081, logset: false, unit: 'h',   size: 's32', factor: 10,  mode: 'R',   name: 'Total electric additive operation time' }
    //   , { id: 43086, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Heating action Priority' }
    //   , { id: 43122, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R',   name: 'Compressor current min. frequency' }
    //   , { id: 43123, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R',   name: 'Compressor current max. frequency' }
    //   , { id: 43132, logset: false, unit: 'sec', size: 'u16', factor: 1,   mode: 'R',   name: 'Time since last comm. to inverter' }
    //   , { id: 43140, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Inverter temperature' }
    //   , { id: 43147, logset: false, unit: 'A',   size: 's16', factor: 1,   mode: 'R',   name: 'Compressor in current' }
    //   , { id: 43161, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'External adjustment activated via input S1' }
    //   , { id: 43163, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Blocking status - shunt contr. add heat acc' }
    //   , { id: 43171, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Blocking status - step contr. add heat acc' }
    //   , { id: 43239, logset: false, unit: 'Hz',  size: 'u16', factor: 1,   mode: 'R',   name: 'Compressor frequency target' }
    //   , { id: 43375, logset: false, unit: 'W',   size: 's16', factor: 1,   mode: 'R',   name: 'Compressor in power mean (10 seconds)' }
    //   , { id: 43416, logset: false, unit: '',    size: 's32', factor: 1,   mode: 'R',   name: 'Number of compressor starts' }
    //   , { id: 43420, logset: false, unit: 'h',   size: 's32', factor: 1,   mode: 'R',   name: 'Compressor total operation time' }
    //   , { id: 43435, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Compressor state' }
    //   , { id: 44300, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat meter - heat compressor and addition' }
    //   , { id: 44874, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'State SG Ready' }
    //   , { id: 44878, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'SG Ready input A' }
    //   , { id: 44879, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'SG Ready input B' }
    //   , { id: 44910, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Brine pump dT actual' }
    //   , { id: 44911, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Brine pump dT Set Point' }
    //   , { id: 45001, logset: false,  unit: '',    size: 's16', factor: 1,   mode: 'R',   name: 'Most severe alarm number' }
    //   , { id: 47325, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Step controlled add. - max. steps' }
    //   , { id: 40879, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: '+Adjust parallel factor' }
    //   , { id: 40880, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: '+Adjust max change' }
    //   , { id: 40888, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: '+Adjust affect S1' }
    //   , { id: 45171, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Alarm reset' }
    //   , { id: 47007, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Heat curve S1' }
    //   , { id: 47011, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Heat offset S1' }
    //   , { id: 47015, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Minimum temperature supply S1' }
    //   , { id: 47019, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Maximum temperature supply S1' }
    //   , { id: 47020, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (???°C)' }
    //   , { id: 47021, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (+20°C)' }
    //   , { id: 47022, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (+10°C)' }
    //   , { id: 47023, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (  0°C)' }
    //   , { id: 47024, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-10°C)' }
    //   , { id: 47025, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-20°C)' }
    //   , { id: 47026, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-30°C)' }
    //   , { id: 47027, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Point offset outdoor temperature' }
    //   , { id: 47028, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Point offset value' }
    //   , { id: 47032, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'External adjustment S1' }
    //   , { id: 47036, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R/W', name: 'External adjustment with room sensor S1' }
    //   , { id: 47099, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Gmz - Compressor frequency regulator GMz' }
    //   , { id: 47100, logset: false, unit: '°C',  size: 'u8',  factor: 10,  mode: 'R/W', name: 'Max. difference supply to calculated supply' }
    //   , { id: 47101, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Compressor freq - reg P' }
    //   , { id: 47102, logset: false, unit: 'Hz',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Compressor freq - max delta F' }
    //   , { id: 47103, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R/W', name: 'Compressor freq - maximum' }
    //   , { id: 47104, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R/W', name: 'Compressor freq - minimum' }
    //   , { id: 47131, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Language (2=Deutsch)' }
    //   , { id: 47135, logset: false, unit: 'min', size: 'u8',  factor: 1,   mode: 'R/W', name: 'Period heat' }
    //   , { id: 47137, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode (0=Auto,1=manual,2=add.heat only)' }
    //   , { id: 47138, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode heat medium pump' }
    //   , { id: 47139, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode brine pump' }
    //   , { id: 47206, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - start heating' }
    //   , { id: 47209, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - value to start next electric add. step' }
    //   , { id: 47210, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - start add. with shunt' }
    //   , { id: 47212, logset: false, unit: 'kW',  size: 's16', factor: 100, mode: 'R/W', name: 'Max int. add. power' }
    //   , { id: 47214, logset: false, unit: 'A',   size: 'u16', factor: 1,   mode: 'R/W', name: 'Fuse' }
    //   , { id: 47370, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Allow active heating' }
    //   , { id: 47371, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Allow heating' }
    //   , { id: 47375, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Stop temperature heating' }
    //   , { id: 47376, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Stop temperature additive heating' }
    //   , { id: 47377, logset: false, unit: 'h',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Outdoor filter time' }
    //   , { id: 47378, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Max diff. compressor' }
    //   , { id: 47379, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Max diff. addition' }
    //   , { id: 47380, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Low brine out autoreset' }
    //   , { id: 47381, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Low brine out temperature' }
    //   , { id: 47382, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'High brine in autoreset' }
    //   , { id: 47383, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'High brine in temperature' }
    //   , { id: 47384, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Date format' }
    //   , { id: 47385, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Time format' }
    //   , { id: 47387, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'HW production' }
    //   , { id: 47388, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Alarm lower room temperature' }
    //   , { id: 47394, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Use room sensor S1' }
    //   , { id: 47398, logset: false, unit: '',    size: 'u8',  factor: 10,  mode: 'R/W', name: 'Room sensor setpoint S1' }
    //   , { id: 47402, logset: false, unit: '',    size: 'u8',  factor: 10,  mode: 'R/W', name: 'Room sensor factor S1' }
    //   , { id: 47414, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Speed circulation pump heat ??? =max. speed ???' }
    //   , { id: 47418, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Speed brine pump ??? =max. speed ???' }
    //   , { id: 48043, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Holiday activated' }
    //   , { id: 48072, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes diff start addition' }
    //   , { id: 48275, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Max charge pump reg speed' }
    //   , { id: 48282, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'SG Ready heating' }
    //   , { id: 48453, logset: false, unit: '%',   size: 's8',  factor: 1,   mode: 'R/W', name: 'Auto heat medium pump speed ?? unit % ??' }
    //   , { id: 48458, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Max speed circulation pump heat' }
    //   , { id: 48659, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency activated 2' }
    //   , { id: 48660, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency activated 1' }
    //   , { id: 48661, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency start 2 ?? stop  1 =  90Hz ??' }
    //   , { id: 48662, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency start 1 ?? start 2 =  17Hz ?? ' }
    //   , { id: 48663, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency stop 2  ?? stop  2 = 118Hz ??' }
    //   , { id: 48664, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency stop 1  ?? start 1 =  30Hz ??' }
    //   , { id: 48755, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R/W', name: 'Transformer ratio' }
    //   , { id: 48889, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Modbus40 disable LOG.SET' }
    //   , { id: 49192, logset: false, unit: '°C',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Fixed delta t brine pump' }
    //   , { id: 49193, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Brine pump auto controlled (1=auto)' }
    //   // , { id: 43091, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Internal electrical add. state - number of active steps' }
    // tslint:enable:max-line-length
