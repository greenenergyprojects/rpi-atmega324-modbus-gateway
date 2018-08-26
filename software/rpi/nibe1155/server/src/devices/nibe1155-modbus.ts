import { INibe1155Value, INibe1155ValueBase } from './nibe1155-value';

export type Nibe1155ModbusIds =
    // LOG.SET registers (low polling time)
    40008 | 40012 | 40015 | 40016 | 40017 | 40018 | 40019 | 40022 | 40071 |
    43005 | 43009 | 43084 | 43136 | 43141 | 43427 | 43431 | 43433 | 43437 | 43439 |
    // normal register (high polling time)
    40004 | 40033 | 40067 | 40079 | 40081 | 40083 |
    42439 | 42447 | 43182 | 43375 | 43416 | 43420 | 45001 | 45171 |
    47007 | 47011 | 47015 | 47019 | 47020 | 47021 | 47022 | 47023 | 47024 | 47025 | 47026 |
    47100 | 47103 | 47104 |
    47137 | 47138 | 47139 | 47206 | 47209 | 47212 | 47214 | 47370 | 47371 | 47376 | 47375 |
    48072 |
    48659 | 48660 | 48661 | 48662 | 48663 | 48664;

export interface INibe1155 {
    supplyS1Temp:           INibe1155Value;
    supplyReturnTemp:       INibe1155Value;
    brineInTemp:            INibe1155Value;
    brineOutTemp:           INibe1155Value;
    condensorOutTemp:       INibe1155Value;
    hotGasTemp:             INibe1155Value;
    liquidLineTemp:         INibe1155Value;
    suctionTemp:            INibe1155Value;
    supplyTemp:             INibe1155Value;
    degreeMinutes:          INibe1155Value;
    calcSupplyTemp:         INibe1155Value;
    electricHeaterPower:    INibe1155Value;
    compressorFrequency:    INibe1155Value;
    compressorInPower:      INibe1155Value;
    compressorState:        INibe1155Value;
    brinePumpState:         INibe1155Value;
    supplyPumpState:        INibe1155Value;
    supplyPumpSpeed:        INibe1155Value;
    brinePumpSpeed:         INibe1155Value;
    // start of normal register
    outdoorTemp:            INibe1155Value;
    roomTemp:               INibe1155Value;
    outdoorTempAverage:     INibe1155Value;
    currentL1:              INibe1155Value;
    currentL2:              INibe1155Value;
    currentL3:              INibe1155Value;
    energyCompAndElHeater:  INibe1155Value;
    energyCompressor:       INibe1155Value;
    compFrequTarget:        INibe1155Value;
    compPower10Min:         INibe1155Value;
    compNumberOfStarts:     INibe1155Value;
    compTotalOperationTime: INibe1155Value;
    alarm:                  INibe1155Value;
    alarmReset:             INibe1155Value;
    heatCurveS1:            INibe1155Value;
    heatOffsetS1:           INibe1155Value;
    supplyMinS1:            INibe1155Value;
    supplyMaxS1:            INibe1155Value;
    ownHeatCurveP7:         INibe1155Value;
    ownHeatCurveP6:         INibe1155Value;
    ownHeatCurveP5:         INibe1155Value;
    ownHeatCurveP4:         INibe1155Value;
    ownHeatCurveP3:         INibe1155Value;
    ownHeatCurveP2:         INibe1155Value;
    ownHeatCurveP1:         INibe1155Value;
    regMaxSupplyDiff:       INibe1155Value;
    regMinCompFrequ:        INibe1155Value;
    regMaxCompFrequ:        INibe1155Value;
    operationalMode:        INibe1155Value;
    supplyPumpMode:         INibe1155Value;
    brinePumpMode:          INibe1155Value;
    dmStartHeating:         INibe1155Value;
    addHeatingStep:         INibe1155Value;
    addHeatingMaxPower:     INibe1155Value;
    addHeatingFuse:         INibe1155Value;
    allowAdditiveHeating:   INibe1155Value;
    allowHeating:           INibe1155Value;
    stopTempHeating:        INibe1155Value;
    stopTempAddHeating:     INibe1155Value;
    dmDiffStartAddHeating:  INibe1155Value;
    cutOffFrequActivated2:  INibe1155Value;
    cutOffFrequActivated1:  INibe1155Value;
    cutOffFrequStart2:      INibe1155Value;
    cutOffFrequStart1:      INibe1155Value;
    cutOffFrequStop2:       INibe1155Value;
    cutOffFrequStop1:       INibe1155Value;
}

export type Nibe1155ModbusAttributes = keyof INibe1155;


export class Nibe1155Modbus {

    // tslint:disable:max-line-length
    static regDefById: { [ id in Nibe1155ModbusIds ]: INibe1155ValueBase } =  {
          40008: { id: 40008, label: 'supplyS1Temp',           type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Supply S1 temperature (BT2)', help: 'Heizkreis Vorlauf'}
        , 40012: { id: 40012, label: 'supplyReturnTemp',       type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Supply return temperature (BT3)', help: 'Heizkreis Rücklauf' }
        , 40015: { id: 40015, label: 'brineInTemp',            type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Brine-In temperature (BT10)', help: 'Sole ein' }
        , 40016: { id: 40016, label: 'brineOutTemp',           type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Brine-out temperature (BT11)', help: 'Sole aus' }
        , 40017: { id: 40017, label: 'condensorOutTemp',       type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Condensor-Out temperature (BT12)', help: 'Kondensatorausgang' }
        , 40018: { id: 40018, label: 'hotGasTemp',             type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Hot-Gas (BT14)', help: 'Verdampfergas' }
        , 40019: { id: 40019, label: 'liquidLineTemp',         type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Liquid-Line (BT15)', help: 'Flüssigkeit' }
        , 40022: { id: 40022, label: 'suctionTemp',            type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Suction temperature (BT17)', help: 'Ansaugung' }
        , 40071: { id: 40071, label: 'supplyTemp',             type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'External supply temperature (BT25)', help: 'Puffer' }
        , 43005: { id: 43005, label: 'degreeMinutes',          type: 'R/W', unit: '',    size: 's16', factor: 10,   format: '%-6.01f', description: 'Degree Minutes (16 bit)', help: 'Gradminuten' }
        , 43009: { id: 43009, label: 'calcSupplyTemp',         type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Calculated Supply tempreature S1', help: 'Berechneter Vorlauf (BT50)' }
        , 43084: { id: 43084, label: 'electricHeaterPower',    type: 'R',   unit: 'W',   size: 's16', factor: 0.1,  format: '%3d',     description: 'Current power from internal electrical addtion', help: 'Zusatzheizung' }
        , 43136: { id: 43136, label: 'compressorFrequency',    type: 'R',   unit: 'Hz',  size: 'u16', factor: 10,   format: '%-5.01f', description: 'Compressor frequency', help: 'Kompressorfrequenz' }
        , 43141: { id: 43141, label: 'compressorInPower',      type: 'R',   unit: 'W',   size: 'u16', factor: 0.1,  format: '%3d',     description: 'Compressor in power', help: 'Kompressorverbrauch' }
        , 43427: { id: 43427, label: 'compressorState',        type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Compressor state', help: '20=stop,40=start,60=run,100=stopping' }
        , 43431: { id: 43431, label: 'supplyPumpState',        type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Supply pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43433: { id: 43433, label: 'brinePumpState',         type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Brine pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43437: { id: 43437, label: 'supplyPumpSpeed',        type: 'R',   unit: '%',   size: 'u8',  factor: 1,    format: '%-3d',    description: 'Supply pump speed', help: 'heizungspumpe' }
        , 43439: { id: 43439, label: 'brinePumpSpeed',         type: 'R',   unit: '%',   size: 'u8',  factor: 1,    format: '%-3d',    description: 'Brine pump speed', help: 'Solepumpe' }
        // , 40071: { id: 40071, label: '',       type: 'R', unit: '°C', size: 's16', factor: 1, description: '', help: '' }
        , 40004: { id: 40004, label: 'outdoorTemp',            type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Outdoor temperature (BT1)', help: 'Außentemperatur'}
        , 40033: { id: 40033, label: 'roomTemp',               type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Room Temperature S1 (BT50)', help: 'Innentemperatur' }
        , 40067: { id: 40067, label: 'outdoorTempAverage',     type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Outdoor Temperature (BT1) average', help: 'Gemittelte Außentemperatur' }
        , 40079: { id: 40079, label: 'currentL1',              type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L1', help: '' }
        , 40081: { id: 40081, label: 'currentL2',              type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L2', help: '' }
        , 40083: { id: 40083, label: 'currentL3',              type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L3', help: '' }
        , 42439: { id: 42439, label: 'energyCompAndElHeater',  type: 'R',   unit: 'kWh', size: 'u32', factor: 10,   format: '%-5.01f', description: 'Accumulated energy total', help: '' }
        , 42447: { id: 42447, label: 'energyCompressor',       type: 'R',   unit: 'kWh', size: 'u32', factor: 10,   format: '%-5.01f', description: 'Accumulated energy compressor', help: '' }
        , 43182: { id: 43182, label: 'compFrequTarget',        type: 'R',   unit: 'Hz',  size: 'u16', factor: 1,    format: '%-3d',    description: 'Compressor frequency before cut off', help: '' }
        , 43375: { id: 43375, label: 'compPower10Min',         type: 'R',   unit: 'W',   size: 's16', factor: 1,    format: '%-4d',    description: 'Compressor in power mean (10min)', help: '' }
        , 43416: { id: 43416, label: 'compNumberOfStarts',     type: 'R',   unit: '',    size: 's32', factor: 1,    format: '%-6d',    description: 'Total number of compressor starts', help: '' }
        , 43420: { id: 43420, label: 'compTotalOperationTime', type: 'R',   unit: 'h',   size: 's32', factor: 1,    format: '%-6d',    description: 'Compressor total operation time', help: '' }
        , 45001: { id: 45001, label: 'alarm',                  type: 'R',   unit: '',    size: 's16', factor: 1,    format: '%-3d',    description: 'Number of the most severe current alarm', help: '' }
        , 45171: { id: 45171, label: 'alarmReset',             type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%-1d',    description: 'Accumulated energy compressor', help: '' }
        , 47007: { id: 47007, label: 'heatCurveS1',            type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve S1', help: 'Auswahl Heizkurve 0..15' }
        , 47011: { id: 47011, label: 'heatOffsetS1',           type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%3d',     description: 'Heat offset S1', help: 'Offset Heizkurve -10..+10' }
        , 47015: { id: 47015, label: 'supplyMinS1',            type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Heat supply minimum S1', help: 'Vorlauf Minimaltemperatur 5°C .. 70°C' }
        , 47019: { id: 47019, label: 'supplyMaxS1',            type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Heat supply maximum S1', help: 'Vorlauf Maximaltemperatur 5°C .. 80°C' }
        , 47020: { id: 47020, label: 'ownHeatCurveP7',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +30°C, 5°C .. 80°C', help: '' }
        , 47021: { id: 47021, label: 'ownHeatCurveP6',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +20°C, 5°C .. 80°C', help: '' }
        , 47022: { id: 47022, label: 'ownHeatCurveP5',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +10°C, 5°C .. 80°C', help: '' }
        , 47023: { id: 47023, label: 'ownHeatCurveP4',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei 0°C, 5°C .. 80°C', help: '' }
        , 47024: { id: 47024, label: 'ownHeatCurveP3',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -10°C, 5°C .. 80°C', help: '' }
        , 47025: { id: 47025, label: 'ownHeatCurveP2',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -20°C, 5°C .. 80°C', help: '' }
        , 47026: { id: 47026, label: 'ownHeatCurveP1',         type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -30°C, 5°C .. 80°C', help: '' }
        , 47100: { id: 47100, label: 'regMaxSupplyDiff',       type: 'R/W', unit: '°C',  size: 'u8',  factor: 10,   format: '%-6.01f', description: 'Regulator max difference supply to calculated supply temperature', help: '' }
        , 47103: { id: 47103, label: 'regMinCompFrequ',        type: 'R/W', unit: 'Hz',  size: 's16', factor: 1,    format: '%-3d',    description: 'Regulator minimal compressor frequency', help: '' }
        , 47104: { id: 47104, label: 'regMaxCompFrequ',        type: 'R/W', unit: 'Hz',  size: 's16', factor: 1,    format: '%-3d',    description: 'Regulator maximal compressor frequency', help: '' }
        , 47137: { id: 47137, label: 'operationalMode',        type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Operation mode of heat pump', help: '0=auto, 1=manual, 2=add heat only' }
        , 47138: { id: 47138, label: 'supplyPumpMode',         type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%2d',     description: 'Operation mode of heat medium pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47139: { id: 47139, label: 'brinePumpMode',          type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%2d',     description: 'Operation mode of brine pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47206: { id: 47206, label: 'dmStartHeating',         type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%6d',     description: 'Degree minutes for start of heating (compressro)', help: '-1000 .. -30' }
        , 47209: { id: 47209, label: 'addHeatingStep',         type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%6d',     description: 'Degree minutes for next step of additional heater', help: '' }
        , 47212: { id: 47212, label: 'addHeatingMaxPower',     type: 'R/W', unit: 'W',   size: 's16', factor: 0.1,  format: '%4.02f',  description: 'Maximal power of additional heater', help: '0W ... 6000W' }
        , 47214: { id: 47214, label: 'addHeatingFuse',         type: 'R/W', unit: 'A',   size: 'u16', factor: 1,    format: '%3d',     description: 'Fuse current for heater', help: '0A ... 400A' }
        , 47370: { id: 47370, label: 'allowAdditiveHeating',   type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Allow electrical heating', help: '0 .. 1' }
        , 47371: { id: 47371, label: 'allowHeating',           type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Allow heat pump heating', help: '0 .. 1' }
        , 47375: { id: 47375, label: 'stopTempHeating',        type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%5.01f', description: 'Heating stop temperature', help: '-20°C .. +40°C' }
        , 47376: { id: 47376, label: 'stopTempAddHeating',     type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%5.01f', description: 'Additive Heating stop temperature', help: '-25°C .. 40°C' }
        , 48072: { id: 48072, label: 'dmDiffStartAddHeating',  type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%3d',     description: 'DM below last comp step to start elect. heat.', help: '?' }
        , 48659: { id: 48659, label: 'cutOffFrequActivated2',  type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%1d',     description: 'Cut of frequency activated 2', help: 'forbid start 2 ... stop 2' }
        , 48660: { id: 48660, label: 'cutOffFrequActivated1',  type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%1d',     description: 'Cut of frequency activated 1', help: 'forbid start 1 ... stop 1' }
        , 48661: { id: 48661, label: 'cutOffFrequStart2',      type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency start 2', help: '17Hz .. 115Hz' }
        , 48662: { id: 48662, label: 'cutOffFrequStart1',      type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency start 1', help: '17Hz .. 115Hz' }
        , 48663: { id: 48663, label: 'cutOffFrequStop2',       type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency stop 2', help: '22Hz .. 120Hz' }
        , 48664: { id: 48664, label: 'cutOffFrequStop1',       type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency stop 1', help: '22Hz .. 120Hz' }
    };
    // tslint:enable:max-line-length

    static regDefByLable: { [ id in Nibe1155ModbusAttributes ]: INibe1155ValueBase } = {
        // start of the LOG.SET registers
          supplyS1Temp:           Nibe1155Modbus.regDefById[40008]
        , supplyReturnTemp:       Nibe1155Modbus.regDefById[40012]
        , brineInTemp:            Nibe1155Modbus.regDefById[40015]
        , brineOutTemp:           Nibe1155Modbus.regDefById[40016]
        , condensorOutTemp:       Nibe1155Modbus.regDefById[40017]
        , hotGasTemp:             Nibe1155Modbus.regDefById[40018]
        , liquidLineTemp:         Nibe1155Modbus.regDefById[40019]
        , suctionTemp:            Nibe1155Modbus.regDefById[40022]
        , supplyTemp:             Nibe1155Modbus.regDefById[40071]
        , degreeMinutes:          Nibe1155Modbus.regDefById[43005]
        , calcSupplyTemp:         Nibe1155Modbus.regDefById[43009]
        , electricHeaterPower:    Nibe1155Modbus.regDefById[43084]
        , compressorFrequency:    Nibe1155Modbus.regDefById[43136]
        , compressorInPower:      Nibe1155Modbus.regDefById[43141]
        , compressorState:        Nibe1155Modbus.regDefById[43427]
        , supplyPumpState:        Nibe1155Modbus.regDefById[43431]
        , brinePumpState:         Nibe1155Modbus.regDefById[43433]
        , supplyPumpSpeed:        Nibe1155Modbus.regDefById[43437]
        , brinePumpSpeed:         Nibe1155Modbus.regDefById[43439]
        // start of the normal registers
        , outdoorTemp:            Nibe1155Modbus.regDefById[40004]
        , roomTemp:               Nibe1155Modbus.regDefById[40033]
        , outdoorTempAverage:     Nibe1155Modbus.regDefById[40067]
        , currentL1:              Nibe1155Modbus.regDefById[40079]
        , currentL2:              Nibe1155Modbus.regDefById[40081]
        , currentL3:              Nibe1155Modbus.regDefById[40083]
        , energyCompAndElHeater:  Nibe1155Modbus.regDefById[42439]
        , energyCompressor:       Nibe1155Modbus.regDefById[42447]
        , compFrequTarget:        Nibe1155Modbus.regDefById[43182]
        , compPower10Min:         Nibe1155Modbus.regDefById[43375]
        , compNumberOfStarts:     Nibe1155Modbus.regDefById[43416]
        , compTotalOperationTime: Nibe1155Modbus.regDefById[43420]
        , alarm:                  Nibe1155Modbus.regDefById[45001]
        , alarmReset:             Nibe1155Modbus.regDefById[45171]
        , heatCurveS1:            Nibe1155Modbus.regDefById[47007]
        , heatOffsetS1:           Nibe1155Modbus.regDefById[47011]
        , supplyMinS1:            Nibe1155Modbus.regDefById[47015]
        , supplyMaxS1:            Nibe1155Modbus.regDefById[47019]
        , ownHeatCurveP7:         Nibe1155Modbus.regDefById[47020]
        , ownHeatCurveP6:         Nibe1155Modbus.regDefById[47021]
        , ownHeatCurveP5:         Nibe1155Modbus.regDefById[47022]
        , ownHeatCurveP4:         Nibe1155Modbus.regDefById[47023]
        , ownHeatCurveP3:         Nibe1155Modbus.regDefById[47024]
        , ownHeatCurveP2:         Nibe1155Modbus.regDefById[47025]
        , ownHeatCurveP1:         Nibe1155Modbus.regDefById[47026]
        , regMaxSupplyDiff:       Nibe1155Modbus.regDefById[47100]
        , regMinCompFrequ:        Nibe1155Modbus.regDefById[47103]
        , regMaxCompFrequ:        Nibe1155Modbus.regDefById[47104]
        , operationalMode:        Nibe1155Modbus.regDefById[47137]
        , supplyPumpMode:         Nibe1155Modbus.regDefById[47138]
        , brinePumpMode:          Nibe1155Modbus.regDefById[47139]
        , dmStartHeating:         Nibe1155Modbus.regDefById[47206]
        , addHeatingStep:         Nibe1155Modbus.regDefById[47209]
        , addHeatingMaxPower:     Nibe1155Modbus.regDefById[47212]
        , addHeatingFuse:         Nibe1155Modbus.regDefById[47214]
        , allowAdditiveHeating:   Nibe1155Modbus.regDefById[47370]
        , allowHeating:           Nibe1155Modbus.regDefById[47371]
        , stopTempHeating:        Nibe1155Modbus.regDefById[47375]
        , stopTempAddHeating:     Nibe1155Modbus.regDefById[47376]
        , dmDiffStartAddHeating:  Nibe1155Modbus.regDefById[48072]
        , cutOffFrequActivated2:  Nibe1155Modbus.regDefById[48659]
        , cutOffFrequActivated1:  Nibe1155Modbus.regDefById[48660]
        , cutOffFrequStart2:      Nibe1155Modbus.regDefById[48661]
        , cutOffFrequStart1:      Nibe1155Modbus.regDefById[48662]
        , cutOffFrequStop2:       Nibe1155Modbus.regDefById[48663]
        , cutOffFrequStop1:       Nibe1155Modbus.regDefById[48664]
    };
}
