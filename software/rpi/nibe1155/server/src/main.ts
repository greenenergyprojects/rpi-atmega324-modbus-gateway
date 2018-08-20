

export const VERSION = '0.0.1';

import * as fs from 'fs';
import * as path from 'path';

import * as nconf from 'nconf';
import { sprintf } from 'sprintf-js';

process.on('unhandledRejection', (reason, p) => {
    const now = new Date();
    console.log(now.toLocaleDateString() + '/' + now.toLocaleTimeString() + ': unhandled rejection at: Promise', p, 'reason:', reason);
});

// ***********************************************************
// configuration, logging
// ***********************************************************

nconf.argv().env();
const configFilename = path.join(__dirname, '../config.json');
try {
    fs.accessSync(configFilename, fs.constants.R_OK);
    nconf.file(configFilename);
} catch (err) {
    console.log('Error on config file ' + configFilename + '\n' + err);
    process.exit(1);
}

let debugConfig: any = nconf.get('debug');
if (!debugConfig) {
    debugConfig = { enabled: '*::*' };
}
for (const a in debugConfig) {
    if (debugConfig.hasOwnProperty(a)) {
        const name: string = (a === 'enabled') ? 'DEBUG' : 'DEBUG_' + a.toUpperCase();
        if (!process.env[name] && (debugConfig[a] !== undefined || debugConfig[a] !== undefined)) {
            process.env[name] = debugConfig[a] ? debugConfig[a] : debugConfig[a];
        }
    }
}

// logging with debug-sx/debug
import * as debugsx from 'debug-sx';
const debug: debugsx.IDefaultLogger = debugsx.createDefaultLogger('main');

debugsx.addHandler(debugsx.createConsoleHandler('stdout'));
const logfileConfig = nconf.get('logfile');
if (logfileConfig) {
    for (const att in logfileConfig) {
        if (!logfileConfig.hasOwnProperty(att)) { continue; }
        const logHandlerConfig = logfileConfig[att];
        if (logHandlerConfig.disabled) { continue; }
        const h = debugsx.createFileHandler( logHandlerConfig);
        console.log('Logging ' + att + ' to ' + logHandlerConfig.filename);
        debugsx.addHandler(h);
    }
}


// ***********************************************************
// startup of application
//   ... things to do before server can be started
// ***********************************************************

import { ModbusSerial } from './modbus/modbus-serial';
import { ModbusRequest, ModbusRequestFactory } from './modbus/modbus-request';
import { Nibe1155 } from './devices/nibe1155';
import { HeatPump } from './devices/heat-pump';
import { Statistics } from './statistics';
import { Server } from './server';

let modbus: ModbusSerial;
const regTab: { [ id: number ]: IRegister } = {};

doStartup();

async function doHeatPumpControlling () {
    const hp = HeatPump.Instance;
    await hp.start('off');
    await delay(5000);
    hp.desiredMode = 'pumpsOn';
    await delay(15000);
    hp.desiredMode = 'off';
    await delay(60000);
    await hp.stop();
}


async function doStartup () {

    Statistics.createInstance(nconf.get('statistics'));
    modbus = new ModbusSerial();
    await modbus.open();
    try {
        await Nibe1155.createInstance(modbus);
        await HeatPump.createInstance(Nibe1155.Instance);
        await startupServer();
    } catch (err) {
        debug.warn(err);
    }
    // doHeatPumpControlling();

    return;
}

async function startupServer (): Promise<void> {
    const configServer = nconf.get('server');
    if (configServer && configServer.start) {
        await Server.Instance.start();
    }
}

async function delay (ms: number) {
    return new Promise<void>( (res, rej) => {
        setTimeout( () => {
            res();
        }, ms);
    });
}


interface IRegister {
    id: number;
    logset: boolean;
    unit: string;
    size: 'u8' | 's8' | 'u16' | 's16' | 'u32' | 's32';
    factor: 0.1 | 1 | 10 | 100;
    mode: 'R' | 'R/W';
    name: string;
    help?: string;
}



    // initRegTab();
    // // readRegister ();
    // for (let i = 0; i < 1; i++) {
    //     debug.info('%d: set GM=-100', i);
    //     await setDeggreeMinutes(-100);
    //     await delay(1000);
    // }
    // await setDeggreeMinutes(-100);
    // // await setHeatOffsetS1(10);
    // // await setCompressorMinFrequency(17);
    // // await setCompressorMaxFrequency(120);
    // // debug.info('HeatOffset=%d', await getHeatOffsetS1());
    // // await setCompressorCutoffFrequency2(30, 80);
    // // await setCompressorCutoffFrequency1(20, 25);
    // // await setDeggreeMinutes(-100);
    // // await readRegister ([48659, 48660, 48662, 48664, 48661, 48663]);

    // // debug.info('Minimal compressor frequency: %d', await getCompressorMinFrequency());
    // // debug.info('Maximal compressor frequency: %d', await getCompressorMaxFrequency());
    // while (true) {
    //     const gm = await getDeggreeMinutes();
    //     const cf = await getCompressorFrequency();
    //     const cP = await getCompressorInPower();
    //     const hvl = await getSupplyS1Temp();
    //     const hrl = await getSupplyReturnTemp();
    //     const tPuffer = await getExternalSupplyTemp();
    //     const e = await getHeatMeterCompressor();
    //     const s = sprintf('GradMinuten = %-5f  Compressor = %4.01fHz / %-4fW   Heizung VL / RL = %-4.01f°C / %-4.01f°C  Puffer = %-4.01f°C  E = %-5.02fkWh',
    //                       gm, cf, cP, hvl, hrl, tPuffer, e);
    //     debug.info(s);
    //     await setDeggreeMinutes(-100);
    //     const now = new Date();
    //     const s1 = sprintf('"%04d-%02d-%02d","%02d:%02d:%02d"',
    //         now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    //     const s2 = sprintf('"%.3f","%.3f","%.3f","%.3f","%.3f","%.3f"', gm, cf, cP, hvl, hrl, tPuffer);
    //     const sLog = s1 + ',' + s2 + '\n';
    //     fs.appendFileSync('/var/log/fronius/nibe.csv', sLog.replace(/\./g, ','));
    //     // await delay(1000);
    // }




// function initRegTab () {
//     // tslint:disable:max-line-length
//     const rt: IRegister [] = [
//           { id: 40004, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Outdoor temperature (BT1)', help: 'Außentemperatur' }
//         , { id: 40008, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Supply S1 temperature (BT2)', help: 'Heizkreis Vorlauf' }
//         , { id: 40012, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Supply return temperature (BT3)', help: 'Heizkreis Rücklauf' }
//         , { id: 40015, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Brine-In temperature (BT10)', help: 'Sole ein' }
//         , { id: 40016, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Brine-out temperature (BT11)', help: 'Sole aus' }
//         , { id: 40017, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Condensor-Out temperature (BT12)' }
//         , { id: 40018, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Hot-Gas (BT14)' }
//         , { id: 40019, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Liquid-Line (BT15)' }
//         , { id: 40022, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Suction temperature (BT17)', help: 'Ansaugung' }
//         , { id: 40071, logset: true,  unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'External supply temperature (BT25)', help: 'Puffer' }
//         , { id: 43005, logset: true,  unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Degree Minutes (16 bit)', help: 'Gradminuten' }
//         , { id: 43084, logset: true,  unit: 'kW',  size: 's16', factor: 100, mode: 'R',   name: 'Current power from internal electrical addtion' }
//         , { id: 43136, logset: true,  unit: 'Hz',  size: 'u16', factor: 10,  mode: 'R',   name: 'Compressor frequency' }
//         , { id: 43141, logset: true,  unit: 'W',   size: 'u16', factor: 0.1, mode: 'R',   name: 'Compressor in power' }
//         , { id: 43427, logset: true,  unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Compressor state (20=stop,40=start,60=run,100=stopping)' }
//         , { id: 43431, logset: true,  unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Supply pump state (10=off,15=start,20=on,40=10day,80=cal)' }
//         , { id: 43433, logset: true,  unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Brine pump state (10=off,15=start,20=on,40=10day,80=cal)' }
//         , { id: 43437, logset: true,  unit: '%',   size: 'u8',  factor: 1,   mode: 'R',   name: 'Supply pump speed' }
//         , { id: 43439, logset: true,  unit: '%',   size: 'u8',  factor: 1,   mode: 'R',   name: 'Brine pump speed' }

//         , { id: 44308, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat meter - heat compressor' }
//         , { id: 40033, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Innentemperatur (BT50)' }
//         , { id: 40067, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Outdoor temperature (BT1) average' }
//         , { id: 40079, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L3' }
//         , { id: 40081, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L2' }
//         , { id: 40083, logset: false, unit: 'A',   size: 'u32', factor: 10,  mode: 'R',   name: 'Current L1' }
//         , { id: 40185, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Outdoor temperature (BT1) average 1h' }
//         , { id: 40195, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Innentemperatur (BT50) average' }
//         , { id: 40316, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Inverter limit status' }
//         , { id: 40317, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Inverter drive status' }
//         , { id: 40321, logset: false, unit: 'Hz',  size: 'u16', factor: 1,   mode: 'R',   name: 'Compressor frequency request' }
//         , { id: 40322, logset: false, unit: 'Hz',  size: 'u16', factor: 100, mode: 'R',   name: 'Max compressor frequency heating' }
//         , { id: 40323, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter alarm code' }
//         , { id: 40324, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter fault code' }
//         , { id: 40326, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter drive command' }
//         , { id: 40327, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Pic version' }
//         , { id: 40328, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE inverter 8051 version' }
//         , { id: 40329, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Def. Wizard' }
//         , { id: 40330, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Mce version' }
//         , { id: 40331, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Hw version' }
//         , { id: 40332, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'NIBE Inverter Hw type' }
//         , { id: 40813, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Compressor slow down reason' }
//         , { id: 40872, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R',   name: '+Adjust Parallel adjustment' }
//         , { id: 40874, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: '+Adjust Temp indoor' }
//         , { id: 40875, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: '+Adjust Temp outdoor' }
//         , { id: 40877, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: '+Adjust Activated' }
//         , { id: 40878, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: '+Adjust Need (call for heat)' }
//         , { id: 40940, logset: false, unit: '',    size: 's32', factor: 10,  mode: 'R',   name: 'Degree Minutes (32 bit)' }
//         , { id: 40993, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter min speed' }
//         , { id: 40994, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Inverter max speed' }
//         , { id: 41191, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'PV Panel State' }
//         , { id: 42033, logset: false, unit: '°C',  size: 'u8',  factor: 10,  mode: 'R',   name: 'PV Panel Heat Offset' }
//         , { id: 42100, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Außentemperatur (BT1) average 24h' }
//         , { id: 42101, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Used heating power average 24h - ?? °C ??' }
//         , { id: 42439, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat Meter - Heat compressor and Add - Total system' }
//         , { id: 42447, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat Meter - Heat compressor - Total system' }
//         , { id: 43001, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R',   name: 'Software version' }
//         , { id: 43013, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Freeze Protection Status' }
//         , { id: 43064, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Heat Medium Flow dT Set Point' }
//         , { id: 43065, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Heat Medium Flow dT Actual' }
//         , { id: 43081, logset: false, unit: 'h',   size: 's32', factor: 10,  mode: 'R',   name: 'Total electric additive operation time' }
//         , { id: 43086, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Heating action Priority' }
//         , { id: 43122, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R',   name: 'Compressor current min. frequency' }
//         , { id: 43123, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R',   name: 'Compressor current max. frequency' }
//         , { id: 43132, logset: false, unit: 'sec', size: 'u16', factor: 1,   mode: 'R',   name: 'Time since last comm. to inverter' }
//         , { id: 43140, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R',   name: 'Inverter temperature' }
//         , { id: 43147, logset: false, unit: 'A',   size: 's16', factor: 1,   mode: 'R',   name: 'Compressor in current' }
//         , { id: 43161, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'External adjustment activated via input S1' }
//         , { id: 43163, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Blocking status - shunt contr. add heat acc' }
//         , { id: 43171, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Blocking status - step contr. add heat acc' }
//         , { id: 43239, logset: false, unit: 'Hz',  size: 'u16', factor: 1,   mode: 'R',   name: 'Compressor frequency target' }
//         , { id: 43375, logset: false, unit: 'W',   size: 's16', factor: 1,   mode: 'R',   name: 'Compressor in power mean (10 seconds)' }
//         , { id: 43416, logset: false, unit: '',    size: 's32', factor: 1,   mode: 'R',   name: 'Number of compressor starts' }
//         , { id: 43420, logset: false, unit: 'h',   size: 's32', factor: 1,   mode: 'R',   name: 'Compressor total operation time' }
//         , { id: 43435, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Compressor state' }
//         , { id: 44300, logset: false, unit: 'kWh', size: 'u32', factor: 10,  mode: 'R',   name: 'Heat meter - heat compressor and addition' }
//         , { id: 44874, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'State SG Ready' }
//         , { id: 44878, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'SG Ready input A' }
//         , { id: 44879, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'SG Ready input B' }
//         , { id: 44910, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Brine pump dT actual' }
//         , { id: 44911, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R',   name: 'Brine pump dT Set Point' }
//         , { id: 45001, logset: false,  unit: '',    size: 's16', factor: 1,   mode: 'R',   name: 'Most severe alarm number' }
//         , { id: 47325, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Step controlled add. - max. steps' }
//         , { id: 40879, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: '+Adjust parallel factor' }
//         , { id: 40880, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: '+Adjust max change' }
//         , { id: 40888, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: '+Adjust affect S1' }
//         , { id: 45171, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Alarm reset' }
//         , { id: 47007, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Heat curve S1' }
//         , { id: 47011, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Heat offset S1' }
//         , { id: 47015, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Minimum temperature supply S1' }
//         , { id: 47019, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Maximum temperature supply S1' }
//         , { id: 47020, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (???°C)' }
//         , { id: 47021, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (+20°C)' }
//         , { id: 47022, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (+10°C)' }
//         , { id: 47023, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (  0°C)' }
//         , { id: 47024, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-10°C)' }
//         , { id: 47025, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-20°C)' }
//         , { id: 47026, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Own heating curve P1 (-30°C)' }
//         , { id: 47027, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Point offset outdoor temperature' }
//         , { id: 47028, logset: false, unit: '°C',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Point offset value' }
//         , { id: 47032, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'External adjustment S1' }
//         , { id: 47036, logset: false, unit: '',    size: 's16', factor: 10,  mode: 'R/W', name: 'External adjustment with room sensor S1' }
//         , { id: 47099, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Gmz - Compressor frequency regulator GMz' }
//         , { id: 47100, logset: false, unit: '°C',  size: 'u8',  factor: 10,  mode: 'R/W', name: 'Max. difference supply to calculated supply' }
//         , { id: 47101, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Compressor freq - reg P' }
//         , { id: 47102, logset: false, unit: 'Hz',  size: 's8',  factor: 1,   mode: 'R/W', name: 'Compressor freq - max delta F' }
//         , { id: 47103, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R/W', name: 'Compressor freq - maximum' }
//         , { id: 47104, logset: false, unit: 'Hz',  size: 's16', factor: 1,   mode: 'R/W', name: 'Compressor freq - minimum' }
//         , { id: 47131, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Language (2=Deutsch)' }
//         , { id: 47135, logset: false, unit: 'min', size: 'u8',  factor: 1,   mode: 'R/W', name: 'Period heat' }
//         , { id: 47137, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode (0=Auto,1=manual,2=add.heat only)' }
//         , { id: 47138, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode heat medium pump' }
//         , { id: 47139, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Operational mode brine pump' }
//         , { id: 47206, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - start heating' }
//         , { id: 47209, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - value to start next electric add. step' }
//         , { id: 47210, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes - start add. with shunt' }
//         , { id: 47212, logset: false, unit: 'kW',  size: 's16', factor: 100, mode: 'R/W', name: 'Max int. add. power' }
//         , { id: 47214, logset: false, unit: 'A',   size: 'u16', factor: 1,   mode: 'R/W', name: 'Fuse' }
//         , { id: 47370, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Allow active heating' }
//         , { id: 47371, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Allow heating' }
//         , { id: 47375, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Stop temperature heating' }
//         , { id: 47376, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Stop temperature additive heating' }
//         , { id: 47377, logset: false, unit: 'h',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Outdoor filter time' }
//         , { id: 47378, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Max diff. compressor' }
//         , { id: 47379, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Max diff. addition' }
//         , { id: 47380, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Low brine out autoreset' }
//         , { id: 47381, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'Low brine out temperature' }
//         , { id: 47382, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'High brine in autoreset' }
//         , { id: 47383, logset: false, unit: '°C',  size: 's16', factor: 10,  mode: 'R/W', name: 'High brine in temperature' }
//         , { id: 47384, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Date format' }
//         , { id: 47385, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Time format' }
//         , { id: 47387, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'HW production' }
//         , { id: 47388, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Alarm lower room temperature' }
//         , { id: 47394, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Use room sensor S1' }
//         , { id: 47398, logset: false, unit: '',    size: 'u8',  factor: 10,  mode: 'R/W', name: 'Room sensor setpoint S1' }
//         , { id: 47402, logset: false, unit: '',    size: 'u8',  factor: 10,  mode: 'R/W', name: 'Room sensor factor S1' }
//         , { id: 47414, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Speed circulation pump heat ??? =max. speed ???' }
//         , { id: 47418, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Speed brine pump ??? =max. speed ???' }
//         , { id: 48043, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Holiday activated' }
//         , { id: 48072, logset: false, unit: '',    size: 's16', factor: 1,   mode: 'R/W', name: 'Degree minutes diff start addition' }
//         , { id: 48275, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Max charge pump reg speed' }
//         , { id: 48282, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'SG Ready heating' }
//         , { id: 48453, logset: false, unit: '%',   size: 's8',  factor: 1,   mode: 'R/W', name: 'Auto heat medium pump speed ?? unit % ??' }
//         , { id: 48458, logset: false, unit: '%',   size: 'u8',  factor: 1,   mode: 'R/W', name: 'Max speed circulation pump heat' }
//         , { id: 48659, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency activated 2' }
//         , { id: 48660, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency activated 1' }
//         , { id: 48661, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency start 2 ?? stop  1 =  90Hz ??' }
//         , { id: 48662, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency start 1 ?? start 2 =  17Hz ?? ' }
//         , { id: 48663, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency stop 2  ?? stop  2 = 118Hz ??' }
//         , { id: 48664, logset: false, unit: 'Hz',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Cut off frequency stop 1  ?? start 1 =  30Hz ??' }
//         , { id: 48755, logset: false, unit: '',    size: 'u16', factor: 1,   mode: 'R/W', name: 'Transformer ratio' }
//         , { id: 48889, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R/W', name: 'Modbus40 disable LOG.SET' }
//         , { id: 49192, logset: false, unit: '°C',  size: 'u8',  factor: 1,   mode: 'R/W', name: 'Fixed delta t brine pump' }
//         , { id: 49193, logset: false, unit: '',    size: 's8',  factor: 1,   mode: 'R/W', name: 'Brine pump auto controlled (1=auto)' }
//         // , { id: 43091, logset: false, unit: '',    size: 'u8',  factor: 1,   mode: 'R',   name: 'Internal electrical add. state - number of active steps' }

//     ];
//     // tslint:enable:max-line-length

//     for (const r of rt) {
//         regTab[r.id] = r;
//     }
// }

// async function readRegister (ids?: number []) {

//     if (!Array.isArray(ids)) {
//         ids = [];
//         for (const id in regTab) {
//             if (!regTab.hasOwnProperty(id)) { continue; }
//             const i = +id;
//             if (i < 0 || i > 65535) { continue; }
//             ids.push(i);
//         }
//     }
//     for (const id of ids) {
//         const r = regTab[id];
//         if (!r) {
//             debug.warn('cannot find register with id %s', id);
//             continue;
//         }
//         let cnt = 0;
//         while (true) {
//             if (cnt >= 5) {
//                 debug.warn('cannot read id %5d', r.id);
//                 break;
//             }
//             cnt++;
//             try {
//                 const quantity = +r.size.substr(1)  <= 16 ? 1 : 2;
//                 const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, quantity);
//                 await modbus.send(requ);
//                 // debug.info('%s', resp.frame);
//                 if (!requ.response.lrcOk) {
//                     await delay(500);
//                     continue;
//                 }
//                 let value: number;
//                 switch (r.size) {
//                     case 'u8':  value = requ.response.u8At(3) / r.factor; break;
//                     case 's8':  value = requ.response.s8At(3) / r.factor; break;
//                     case 'u16': value = requ.response.u16At(3) / r.factor; break;
//                     case 's16': value = requ.response.s16At(3) / r.factor; break;
//                     case 'u32': value = requ.response.u32At(3) / r.factor; break;
//                     case 's32': value = requ.response.s32At(3) / r.factor; break;
//                 }
//                 debug.info(sprintf('%05d: %10.02f%-3s -> %s', r.id, value, r.unit, r.name));
//                 break;
//             } catch (err) {
//                 debug.warn('cannot read %d\n%e', r.id, err);
//             }
//             // await delay(100);
//         }

//     }

// }

// async function setDeggreeMinutes (value: number) {
//     try {
//         const r = regTab[43005];
//         const requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ value >= 0 ? value * r.factor : 65536 + value * r.factor]
//         );
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, resp.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function getDeggreeMinutes (): Promise<number> {
//     try {
//         const r = regTab[43005];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, resp.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function setHeatOffsetS1 (value: number) {
//     try {
//         const r = regTab[47011];
//         const requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ value >= 0 ? value * r.factor : 65536 + value * r.factor]
//         );
//         await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, resp.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function setCompressorMinFrequency (value: number) {
//     try {
//         const r = regTab[47103];
//         const requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ value >= 0 ? value * r.factor : 65536 + value * r.factor]
//         );
//         await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, resp.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function setCompressorCutoffFrequency1 (start: number, stop: number) {
//     try {
//         let r = regTab[48662];
//         let requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ start >= 0 ? start * r.factor : 65536 + start * r.factor]
//         );
//         await modbus.send(requ);
//         debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         r = regTab[48664];
//         requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ stop >= 0 ? stop * r.factor : 65536 + stop * r.factor]
//         );
//         await modbus.send(requ);
//         debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function setCompressorCutoffFrequency2 (start: number, stop: number) {
//     try {
//         let r = regTab[48661];
//         let requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ start >= 0 ? start * r.factor : 65536 + start * r.factor]
//         );
//         await modbus.send(requ);
//         debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         r = regTab[48663];
//         requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ stop >= 0 ? stop * r.factor : 65536 + stop * r.factor]
//         );
//         await modbus.send(requ);
//         debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function getCompressorMinFrequency (): Promise<number> {
//     try {
//         const r = regTab[47103];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, resp.frame);
//         return requ.response.valueAt(3, r.size) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function setCompressorMaxFrequency (value: number) {
//     try {
//         const r = regTab[47104];
//         const requ = ModbusRequestFactory.createWriteMultipleHoldRegisters(1, r.id + 1, 1,
//             [ value >= 0 ? value * r.factor : 65536 + value * r.factor]
//         );
//         await modbus.send(requ);
//         debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//     } catch (err) {
//         debug.warn(err);
//     }
// }

// async function getCompressorMaxFrequency (): Promise<number> {
//     try {
//         const r = regTab[47104];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.valueAt(3, r.size) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }


// async function getHeatOffsetS1 (): Promise<number> {
//     try {
//         const r = regTab[47011];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function getCompressorFrequency (): Promise<number> {
//     try {
//         const r = regTab[43136];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function getCompressorInPower (): Promise<number> {
//     try {
//         const r = regTab[43141];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.valueAt(3, r.size) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }



// async function getSupplyS1Temp (): Promise<number> {
//     try {
//         const r = regTab[40008];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function getSupplyReturnTemp (): Promise<number> {
//     try {
//         const r = regTab[40012];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }

// async function getExternalSupplyTemp (): Promise<number> {
//     try {
//         const r = regTab[40071];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }


// async function getHeatMeterCompressor (): Promise<number> {
//     try {
//         const r = regTab[44308];
//         const requ = ModbusRequestFactory.createReadHoldRegister(1, r.id + 1, 1);
//         const resp = await modbus.send(requ);
//         // debug.info('request: %s  -> response: %s', requ.request.frame, requ.response.frame);
//         return requ.response.s16At(3) / r.factor;
//     } catch (err) {
//         debug.warn(err);
//         return Number.NaN;
//     }
// }




