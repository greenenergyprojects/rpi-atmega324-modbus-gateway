

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
    await hp.start('on');
    // Nibe1155.Instance.setPointDegreeMinutes = -5;
    // await Nibe1155.Instance.writeCutOffFreq2Stop(120);
    // await Nibe1155.Instance.readCutOffFrequStop2(0);
    // await Nibe1155.Instance.readCutOffFrequStart2(0);
    // await Nibe1155.Instance.readHeatTempMin(0);
    // await Nibe1155.Instance.readHeatTempMax(0);
    // await Nibe1155.Instance.readStopTempHeating(0);
    // await Nibe1155.Instance.writeHeatCurve(0); await Nibe1155.Instance.readHeatCurve(0);
    // await Nibe1155.Instance.writeAllowHeating(true); await Nibe1155.Instance.readIsHeatingAllowed(0);
    // await Nibe1155.Instance.writeDegreeMinutes(100);
    // await Nibe1155.Instance.writeHeatTempMax(41.5);
    // await Nibe1155.Instance.readHeatTempMax(0);
    // await Nibe1155.Instance.writeHeatTempMax(20); await Nibe1155.Instance.readHeatTempMax(0);
    // await Nibe1155.Instance.writeHeatTempMin(20); await Nibe1155.Instance.readHeatTempMin(0);
    // await Nibe1155.Instance.writeStopTempHeating(40); await Nibe1155.Instance.readStopTempHeating(0);
    // await Nibe1155.Instance.writeBrinePumpMode('auto'); await Nibe1155.Instance.readBrinePumpMode(0);
    // await Nibe1155.Instance.writeSupplyPumpMode('economy'); await Nibe1155.Instance.readSupplyPumpMode(0);
    // Nibe1155.Instance.setPointDegreeMinutes = undefined;

    // await hp.start('off');
    // await hp.start('pumpsOn');
    // await delay(10000);
    // hp.desiredMode = 'pumpsOn';
    // await delay(30000);
    // hp.desiredMode = 'off';
    // await delay(10000);
    // await hp.stop();
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
    doHeatPumpControlling();

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
