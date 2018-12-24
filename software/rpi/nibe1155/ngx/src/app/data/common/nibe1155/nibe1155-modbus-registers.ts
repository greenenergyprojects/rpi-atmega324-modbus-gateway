export interface INibe1155Definition {
    id:          number;
    isLogset:    boolean;
    label:       string;
    classname:   'Nibe1155Value' | 'Nibe1155CompressorStateValue' | 'Nibe1155PumpStateValue' | 'Nibe1155PumpModeValue' |
                 'Nibe1155OperationModeValue' | 'Nibe1155AlarmValue';
    type:        'R' | 'R/W';
    unit:        '' | '°C' | 'h' | 'Wh' | 'W' | 'A' | 'Hz' | '%';
    factor:      0.01 | 0.1 | 1 | 10 | 100 | 1000 | 10000;
    format:      string;
    description: string;
    help:        string;
    size:        'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
}

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
    48072 | 48453 |
    48659 | 48660 | 48661 | 48662 | 48663 | 48664;

export interface INibe1155Labels {
    supplyS1Temp:           INibe1155Definition;
    supplyS1ReturnTemp:     INibe1155Definition;
    brineInTemp:            INibe1155Definition;
    brineOutTemp:           INibe1155Definition;
    condensorOutTemp:       INibe1155Definition;
    hotGasTemp:             INibe1155Definition;
    liquidLineTemp:         INibe1155Definition;
    suctionTemp:            INibe1155Definition;
    supplyTemp:             INibe1155Definition;
    degreeMinutes:          INibe1155Definition;
    calcSupplyTemp:         INibe1155Definition;
    electricHeaterPower:    INibe1155Definition;
    compressorFrequency:    INibe1155Definition;
    compressorInPower:      INibe1155Definition;
    compressorState:        INibe1155Definition;
    brinePumpState:         INibe1155Definition;
    supplyPumpState:        INibe1155Definition;
    supplyPumpSpeed:        INibe1155Definition;
    brinePumpSpeed:         INibe1155Definition;
    outdoorTemp:            INibe1155Definition;
    roomTemp:               INibe1155Definition;
    outdoorTempAverage:     INibe1155Definition;
    currentL1:              INibe1155Definition;
    currentL2:              INibe1155Definition;
    currentL3:              INibe1155Definition;
    energyCompAndElHeater:  INibe1155Definition;
    energyCompressor:       INibe1155Definition;
    compFrequTarget:        INibe1155Definition;
    compPower10Min:         INibe1155Definition;
    compNumberOfStarts:     INibe1155Definition;
    compTotalOperationTime: INibe1155Definition;
    alarm:                  INibe1155Definition;
    alarmReset:             INibe1155Definition;
    heatCurveS1:            INibe1155Definition;
    heatOffsetS1:           INibe1155Definition;
    supplyMinS1:            INibe1155Definition;
    supplyMaxS1:            INibe1155Definition;
    ownHeatCurveP7:         INibe1155Definition;
    ownHeatCurveP6:         INibe1155Definition;
    ownHeatCurveP5:         INibe1155Definition;
    ownHeatCurveP4:         INibe1155Definition;
    ownHeatCurveP3:         INibe1155Definition;
    ownHeatCurveP2:         INibe1155Definition;
    ownHeatCurveP1:         INibe1155Definition;
    regMaxSupplyDiff:       INibe1155Definition;
    regMinCompFrequ:        INibe1155Definition;
    regMaxCompFrequ:        INibe1155Definition;
    operationalMode:        INibe1155Definition;
    supplyPumpMode:         INibe1155Definition;
    brinePumpMode:          INibe1155Definition;
    dmStartHeating:         INibe1155Definition;
    addHeatingStep:         INibe1155Definition;
    addHeatingMaxPower:     INibe1155Definition;
    addHeatingFuse:         INibe1155Definition;
    allowAdditiveHeating:   INibe1155Definition;
    allowHeating:           INibe1155Definition;
    stopTempHeating:        INibe1155Definition;
    stopTempAddHeating:     INibe1155Definition;
    dmDiffStartAddHeating:  INibe1155Definition;
    autoHeatMedPumpSpeed:   INibe1155Definition;
    cutOffFrequActivated2:  INibe1155Definition;
    cutOffFrequActivated1:  INibe1155Definition;
    cutOffFrequStart2:      INibe1155Definition;
    cutOffFrequStart1:      INibe1155Definition;
    cutOffFrequStop2:       INibe1155Definition;
    cutOffFrequStop1:       INibe1155Definition;
}

export type Nibe1155ModbusRegisterLabels = keyof INibe1155Labels;


export class Nibe1155ModbusRegisters {

    // tslint:disable:max-line-length
    static regDefById: { [ id in Nibe1155ModbusIds ]: INibe1155Definition } =  {
        // LOGSet registers (fast refresh time)
          40008: { id: 40008, isLogset: true,  label: 'supplyS1Temp',           classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Supply S1 temperature (BT2)', help: 'Heizkreis Vorlauf'}
        , 40012: { id: 40012, isLogset: true,  label: 'supplyS1ReturnTemp',     classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Supply return temperature (BT3)', help: 'Heizkreis Rücklauf' }
        , 40015: { id: 40015, isLogset: true,  label: 'brineInTemp',            classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Brine-In temperature (BT10)', help: 'Sole ein' }
        , 40016: { id: 40016, isLogset: true,  label: 'brineOutTemp',           classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Brine-out temperature (BT11)', help: 'Sole aus' }
        , 40017: { id: 40017, isLogset: true,  label: 'condensorOutTemp',       classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Condensor-Out temperature (BT12)', help: 'Kondensatorausgang' }
        , 40018: { id: 40018, isLogset: true,  label: 'hotGasTemp',             classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Hot-Gas (BT14)', help: 'Verdampfergas' }
        , 40019: { id: 40019, isLogset: true,  label: 'liquidLineTemp',         classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Liquid-Line (BT15)', help: 'Flüssigkeit' }
        , 40022: { id: 40022, isLogset: true,  label: 'suctionTemp',            classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Suction temperature (BT17)', help: 'Ansaugung' }
        , 40071: { id: 40071, isLogset: true,  label: 'supplyTemp',             classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'External supply temperature (BT25)', help: 'Puffer' }
        , 43005: { id: 43005, isLogset: true,  label: 'degreeMinutes',          classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's16', factor: 10,   format: '%-6.01f', description: 'Degree Minutes (16 bit)', help: 'Gradminuten' }
        , 43009: { id: 43009, isLogset: true,  label: 'calcSupplyTemp',         classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Calculated Supply tempreature S1', help: 'Berechneter Vorlauf (BT50)' }
        , 43084: { id: 43084, isLogset: true,  label: 'electricHeaterPower',    classname: 'Nibe1155Value',                type: 'R',   unit: 'W',   size: 's16', factor: 0.1,  format: '%3d',     description: 'Current power from internal electrical addtion', help: 'Zusatzheizung' }
        , 43136: { id: 43136, isLogset: true,  label: 'compressorFrequency',    classname: 'Nibe1155Value',                type: 'R',   unit: 'Hz',  size: 'u16', factor: 10,   format: '%-5.01f', description: 'Compressor frequency', help: 'Kompressorfrequenz' }
        , 43141: { id: 43141, isLogset: true,  label: 'compressorInPower',      classname: 'Nibe1155Value',                type: 'R',   unit: 'W',   size: 'u16', factor: 0.1,  format: '%3d',     description: 'Compressor in power', help: 'Kompressorverbrauch' }
        , 43427: { id: 43427, isLogset: true,  label: 'compressorState',        classname: 'Nibe1155CompressorStateValue', type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Compressor state', help: '20=stop,40=start,60=run,100=stopping' }
        , 43431: { id: 43431, isLogset: true,  label: 'supplyPumpState',        classname: 'Nibe1155PumpStateValue',       type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Supply pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43433: { id: 43433, isLogset: true,  label: 'brinePumpState',         classname: 'Nibe1155PumpStateValue',       type: 'R',   unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Brine pump state', help: '10=off,15=start,20=on,40=10day,80=cal' }
        , 43437: { id: 43437, isLogset: true,  label: 'supplyPumpSpeed',        classname: 'Nibe1155Value',                type: 'R',   unit: '%',   size: 'u8',  factor: 1,    format: '%-3d',    description: 'Supply pump speed', help: 'heizungspumpe' }
        , 43439: { id: 43439, isLogset: true,  label: 'brinePumpSpeed',         classname: 'Nibe1155Value',                type: 'R',   unit: '%',   size: 'u8',  factor: 1,    format: '%-3d',    description: 'Brine pump speed', help: 'Solepumpe' }
        // normal registers (long refresh time)
        , 40004: { id: 40004, isLogset: false, label: 'outdoorTemp',            classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-5.01f', description: 'Outdoor temperature (BT1)', help: 'Außentemperatur'}
        , 40033: { id: 40033, isLogset: false, label: 'roomTemp',               classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Room Temperature S1 (BT50)', help: 'Innentemperatur' }
        , 40067: { id: 40067, isLogset: false, label: 'outdoorTempAverage',     classname: 'Nibe1155Value',                type: 'R',   unit: '°C',  size: 's16', factor: 10,   format: '%-4.01f', description: 'Outdoor Temperature (BT1) average', help: 'Gemittelte Außentemperatur' }
        , 40079: { id: 40079, isLogset: false, label: 'currentL1',              classname: 'Nibe1155Value',                type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L1', help: '' }
        , 40081: { id: 40081, isLogset: false, label: 'currentL2',              classname: 'Nibe1155Value',                type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L2', help: '' }
        , 40083: { id: 40083, isLogset: false, label: 'currentL3',              classname: 'Nibe1155Value',                type: 'R',   unit: 'A',   size: 'u32', factor: 10,   format: '%-4.01f', description: 'Electrical Heater current L3', help: '' }
        , 42439: { id: 42439, isLogset: false, label: 'energyCompAndElHeater',  classname: 'Nibe1155Value',                type: 'R',   unit: 'Wh',  size: 'u32', factor: 10000,   format: '%-5.01f', description: 'Accumulated energy total', help: '' }
        , 42447: { id: 42447, isLogset: false, label: 'energyCompressor',       classname: 'Nibe1155Value',                type: 'R',   unit: 'Wh',  size: 'u32', factor: 10000,   format: '%-5.01f', description: 'Accumulated energy compressor', help: '' }
        , 43182: { id: 43182, isLogset: false, label: 'compFrequTarget',        classname: 'Nibe1155Value',                type: 'R',   unit: 'Hz',  size: 'u16', factor: 1,    format: '%-3d',    description: 'Compressor frequency before cut off', help: '' }
        , 43375: { id: 43375, isLogset: false, label: 'compPower10Min',         classname: 'Nibe1155Value',                type: 'R',   unit: 'W',   size: 's16', factor: 1,    format: '%-4d',    description: 'Compressor in power mean (10min)', help: '' }
        , 43416: { id: 43416, isLogset: false, label: 'compNumberOfStarts',     classname: 'Nibe1155Value',                type: 'R',   unit: '',    size: 's32', factor: 1,    format: '%-6d',    description: 'Total number of compressor starts', help: '' }
        , 43420: { id: 43420, isLogset: false, label: 'compTotalOperationTime', classname: 'Nibe1155Value',                type: 'R',   unit: 'h',   size: 's32', factor: 1,    format: '%-6d',    description: 'Compressor total operation time', help: '' }
        , 45001: { id: 45001, isLogset: false, label: 'alarm',                  classname: 'Nibe1155AlarmValue',           type: 'R',   unit: '',    size: 's16', factor: 1,    format: '%-3d',    description: 'Number of the most severe current alarm', help: '' }
        , 45171: { id: 45171, isLogset: false, label: 'alarmReset',             classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%-1d',    description: 'Accumulated energy compressor', help: '' }
        , 47007: { id: 47007, isLogset: false, label: 'heatCurveS1',            classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve S1', help: 'Auswahl Heizkurve 0..15' }
        , 47011: { id: 47011, isLogset: false, label: 'heatOffsetS1',           classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%3d',     description: 'Heat offset S1', help: 'Offset Heizkurve -10..+10' }
        , 47015: { id: 47015, isLogset: false, label: 'supplyMinS1',            classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Heat supply minimum S1', help: 'Vorlauf Minimaltemperatur 5°C .. 70°C' }
        , 47019: { id: 47019, isLogset: false, label: 'supplyMaxS1',            classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%-6.01f', description: 'Heat supply maximum S1', help: 'Vorlauf Maximaltemperatur 5°C .. 80°C' }
        , 47020: { id: 47020, isLogset: false, label: 'ownHeatCurveP7',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +30°C, 5°C .. 80°C', help: '' }
        , 47021: { id: 47021, isLogset: false, label: 'ownHeatCurveP6',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +20°C, 5°C .. 80°C', help: '' }
        , 47022: { id: 47022, isLogset: false, label: 'ownHeatCurveP5',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei +10°C, 5°C .. 80°C', help: '' }
        , 47023: { id: 47023, isLogset: false, label: 'ownHeatCurveP4',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei 0°C, 5°C .. 80°C', help: '' }
        , 47024: { id: 47024, isLogset: false, label: 'ownHeatCurveP3',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -10°C, 5°C .. 80°C', help: '' }
        , 47025: { id: 47025, isLogset: false, label: 'ownHeatCurveP2',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -20°C, 5°C .. 80°C', help: '' }
        , 47026: { id: 47026, isLogset: false, label: 'ownHeatCurveP1',         classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's8',  factor: 1,    format: '%2d',     description: 'Heat curve 0 bei -30°C, 5°C .. 80°C', help: '' }
        , 47100: { id: 47100, isLogset: false, label: 'regMaxSupplyDiff',       classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 'u8',  factor: 10,   format: '%-6.01f', description: 'Regulator max difference supply to calculated supply temperature', help: '' }
        , 47103: { id: 47103, isLogset: false, label: 'regMinCompFrequ',        classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 's16', factor: 1,    format: '%-3d',    description: 'Regulator minimal compressor frequency', help: '' }
        , 47104: { id: 47104, isLogset: false, label: 'regMaxCompFrequ',        classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 's16', factor: 1,    format: '%-3d',    description: 'Regulator maximal compressor frequency', help: '' }
        , 47137: { id: 47137, isLogset: false, label: 'operationalMode',        classname: 'Nibe1155OperationModeValue',   type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Operation mode of heat pump', help: '0=auto, 1=manual, 2=add heat only' }
        , 47138: { id: 47138, isLogset: false, label: 'supplyPumpMode',         classname: 'Nibe1155PumpModeValue',        type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%2d',     description: 'Operation mode of heat medium pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47139: { id: 47139, isLogset: false, label: 'brinePumpMode',          classname: 'Nibe1155PumpModeValue',        type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%2d',     description: 'Operation mode of brine pump', help: '10=intermittent, 20=continous, 30=economy, 40=auto' }
        , 47206: { id: 47206, isLogset: false, label: 'dmStartHeating',         classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%6d',     description: 'Degree minutes for start of heating (compressro)', help: '-1000 .. -30' }
        , 47209: { id: 47209, isLogset: false, label: 'addHeatingStep',         classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%6d',     description: 'Degree minutes for next step of additional heater', help: '' }
        , 47212: { id: 47212, isLogset: false, label: 'addHeatingMaxPower',     classname: 'Nibe1155Value',                type: 'R/W', unit: 'W',   size: 's16', factor: 0.1,  format: '%4.02f',  description: 'Maximal power of additional heater', help: '0W ... 6000W' }
        , 47214: { id: 47214, isLogset: false, label: 'addHeatingFuse',         classname: 'Nibe1155Value',                type: 'R/W', unit: 'A',   size: 'u16', factor: 1,    format: '%3d',     description: 'Fuse current for heater', help: '0A ... 400A' }
        , 47370: { id: 47370, isLogset: false, label: 'allowAdditiveHeating',   classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Allow electrical heating', help: '0 .. 1' }
        , 47371: { id: 47371, isLogset: false, label: 'allowHeating',           classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 'u8',  factor: 1,    format: '%1d',     description: 'Allow heat pump heating', help: '0 .. 1' }
        , 47375: { id: 47375, isLogset: false, label: 'stopTempHeating',        classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%5.01f', description: 'Heating stop temperature', help: '-20°C .. +40°C' }
        , 47376: { id: 47376, isLogset: false, label: 'stopTempAddHeating',     classname: 'Nibe1155Value',                type: 'R/W', unit: '°C',  size: 's16', factor: 10,   format: '%5.01f', description: 'Additive Heating stop temperature', help: '-25°C .. 40°C' }
        , 48072: { id: 48072, isLogset: false, label: 'dmDiffStartAddHeating',  classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's16', factor: 1,    format: '%3d',     description: 'DM below last comp step to start elect. heat.', help: '?' }
        , 48453: { id: 48453, isLogset: false, label: 'autoHeatMedPumpSpeed',   classname: 'Nibe1155Value',                type: 'R/W', unit: '%',   size: 's8',  factor: 1,    format: '%1d',     description: 'Auto heat medium pump speed, heat', help: '' }
        , 48659: { id: 48659, isLogset: false, label: 'cutOffFrequActivated2',  classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%1d',     description: 'Cut of frequency activated 2', help: 'forbid start 2 ... stop 2' }
        , 48660: { id: 48660, isLogset: false, label: 'cutOffFrequActivated1',  classname: 'Nibe1155Value',                type: 'R/W', unit: '',    size: 's8',  factor: 1,    format: '%1d',     description: 'Cut of frequency activated 1', help: 'forbid start 1 ... stop 1' }
        , 48661: { id: 48661, isLogset: false, label: 'cutOffFrequStart2',      classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency start 2', help: '17Hz .. 115Hz' }
        , 48662: { id: 48662, isLogset: false, label: 'cutOffFrequStart1',      classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency start 1', help: '17Hz .. 115Hz' }
        , 48663: { id: 48663, isLogset: false, label: 'cutOffFrequStop2',       classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency stop 2', help: '22Hz .. 120Hz' }
        , 48664: { id: 48664, isLogset: false, label: 'cutOffFrequStop1',       classname: 'Nibe1155Value',                type: 'R/W', unit: 'Hz',  size: 'u8',  factor: 1,    format: '%3d',     description: 'Cut of frequency stop 1', help: '22Hz .. 120Hz' }
    };
    // tslint:enable:max-line-length

    static regDefByLabel: { [ id in Nibe1155ModbusRegisterLabels ]: INibe1155Definition } = {
        // start of the LOG.SET registers
          supplyS1Temp:           Nibe1155ModbusRegisters.regDefById[40008]
        , supplyS1ReturnTemp:     Nibe1155ModbusRegisters.regDefById[40012]
        , brineInTemp:            Nibe1155ModbusRegisters.regDefById[40015]
        , brineOutTemp:           Nibe1155ModbusRegisters.regDefById[40016]
        , condensorOutTemp:       Nibe1155ModbusRegisters.regDefById[40017]
        , hotGasTemp:             Nibe1155ModbusRegisters.regDefById[40018]
        , liquidLineTemp:         Nibe1155ModbusRegisters.regDefById[40019]
        , suctionTemp:            Nibe1155ModbusRegisters.regDefById[40022]
        , supplyTemp:             Nibe1155ModbusRegisters.regDefById[40071]
        , degreeMinutes:          Nibe1155ModbusRegisters.regDefById[43005]
        , calcSupplyTemp:         Nibe1155ModbusRegisters.regDefById[43009]
        , electricHeaterPower:    Nibe1155ModbusRegisters.regDefById[43084]
        , compressorFrequency:    Nibe1155ModbusRegisters.regDefById[43136]
        , compressorInPower:      Nibe1155ModbusRegisters.regDefById[43141]
        , compressorState:        Nibe1155ModbusRegisters.regDefById[43427]
        , supplyPumpState:        Nibe1155ModbusRegisters.regDefById[43431]
        , brinePumpState:         Nibe1155ModbusRegisters.regDefById[43433]
        , supplyPumpSpeed:        Nibe1155ModbusRegisters.regDefById[43437]
        , brinePumpSpeed:         Nibe1155ModbusRegisters.regDefById[43439]
        , outdoorTemp:            Nibe1155ModbusRegisters.regDefById[40004]
        , roomTemp:               Nibe1155ModbusRegisters.regDefById[40033]
        , outdoorTempAverage:     Nibe1155ModbusRegisters.regDefById[40067]
        , currentL1:              Nibe1155ModbusRegisters.regDefById[40079]
        , currentL2:              Nibe1155ModbusRegisters.regDefById[40081]
        , currentL3:              Nibe1155ModbusRegisters.regDefById[40083]
        , energyCompAndElHeater:  Nibe1155ModbusRegisters.regDefById[42439]
        , energyCompressor:       Nibe1155ModbusRegisters.regDefById[42447]
        , compFrequTarget:        Nibe1155ModbusRegisters.regDefById[43182]
        , compPower10Min:         Nibe1155ModbusRegisters.regDefById[43375]
        , compNumberOfStarts:     Nibe1155ModbusRegisters.regDefById[43416]
        , compTotalOperationTime: Nibe1155ModbusRegisters.regDefById[43420]
        , alarm:                  Nibe1155ModbusRegisters.regDefById[45001]
        , alarmReset:             Nibe1155ModbusRegisters.regDefById[45171]
        , heatCurveS1:            Nibe1155ModbusRegisters.regDefById[47007]
        , heatOffsetS1:           Nibe1155ModbusRegisters.regDefById[47011]
        , supplyMinS1:            Nibe1155ModbusRegisters.regDefById[47015]
        , supplyMaxS1:            Nibe1155ModbusRegisters.regDefById[47019]
        , ownHeatCurveP7:         Nibe1155ModbusRegisters.regDefById[47020]
        , ownHeatCurveP6:         Nibe1155ModbusRegisters.regDefById[47021]
        , ownHeatCurveP5:         Nibe1155ModbusRegisters.regDefById[47022]
        , ownHeatCurveP4:         Nibe1155ModbusRegisters.regDefById[47023]
        , ownHeatCurveP3:         Nibe1155ModbusRegisters.regDefById[47024]
        , ownHeatCurveP2:         Nibe1155ModbusRegisters.regDefById[47025]
        , ownHeatCurveP1:         Nibe1155ModbusRegisters.regDefById[47026]
        , regMaxSupplyDiff:       Nibe1155ModbusRegisters.regDefById[47100]
        , regMinCompFrequ:        Nibe1155ModbusRegisters.regDefById[47103]
        , regMaxCompFrequ:        Nibe1155ModbusRegisters.regDefById[47104]
        , operationalMode:        Nibe1155ModbusRegisters.regDefById[47137]
        , supplyPumpMode:         Nibe1155ModbusRegisters.regDefById[47138]
        , brinePumpMode:          Nibe1155ModbusRegisters.regDefById[47139]
        , dmStartHeating:         Nibe1155ModbusRegisters.regDefById[47206]
        , addHeatingStep:         Nibe1155ModbusRegisters.regDefById[47209]
        , addHeatingMaxPower:     Nibe1155ModbusRegisters.regDefById[47212]
        , addHeatingFuse:         Nibe1155ModbusRegisters.regDefById[47214]
        , allowAdditiveHeating:   Nibe1155ModbusRegisters.regDefById[47370]
        , allowHeating:           Nibe1155ModbusRegisters.regDefById[47371]
        , stopTempHeating:        Nibe1155ModbusRegisters.regDefById[47375]
        , stopTempAddHeating:     Nibe1155ModbusRegisters.regDefById[47376]
        , dmDiffStartAddHeating:  Nibe1155ModbusRegisters.regDefById[48072]
        , autoHeatMedPumpSpeed:   Nibe1155ModbusRegisters.regDefById[48453]
        , cutOffFrequActivated2:  Nibe1155ModbusRegisters.regDefById[48659]
        , cutOffFrequActivated1:  Nibe1155ModbusRegisters.regDefById[48660]
        , cutOffFrequStart2:      Nibe1155ModbusRegisters.regDefById[48661]
        , cutOffFrequStart1:      Nibe1155ModbusRegisters.regDefById[48662]
        , cutOffFrequStop2:       Nibe1155ModbusRegisters.regDefById[48663]
        , cutOffFrequStop1:       Nibe1155ModbusRegisters.regDefById[48664]
    };
}
