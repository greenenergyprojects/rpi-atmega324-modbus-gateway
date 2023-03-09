

export const VERSION = '0.3.4';
process.env.TZ = 'Europe/Vienna';

import * as fs from 'fs';
import * as path from 'path';

import * as nconf from 'nconf';
import { sprintf } from 'sprintf-js';

import * as git from './utils/git';

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

// debugsx.addHandler(debugsx.createConsoleHandler('stdout'));
debugsx.addHandler(debugsx.createRawConsoleHandler());
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

import { Server } from './server';
import { Auth } from './auth';
import { DbUser } from './db-user';
import { ModbusSerial } from './modbus/modbus-serial';
import { Nibe1155 } from './devices/nibe1155';
import { HeatPump } from './devices/heat-pump';
import { Statistics } from './statistics';
import { UdpServer } from './udp-server';

let modbus: ModbusSerial;

doStartup();

export interface IStartModeConfig {
    disabled?: boolean;
    mode: 'off' | 'frequency';
    fSetpoint?: number;
}

async function doHeatPumpControlling () {
    const hp = HeatPump.getInstance();
    // await hp.start(HeatpumpControllerMode.off);
    // await hp.setDesiredMode(new Nibe1155Controller({
    //     createdAt: new Date(),
    //     desiredMode: HeatpumpControllerMode.off,
    //     fMin: 25,
    //     fMax: 50,
    //     tempMin: 35,
    //     tempMax: 45
    // }));


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

    await delay(2000);
    debug.info('Start of Home Control Server V' + VERSION);
    try {
        if (nconf.get('git')) {
            const gitInfo = await git.getGitInfo();
            startupPrintVersion(gitInfo);
        }
        await startupParallel();
        modbus = new ModbusSerial();
        debug.info('try to open serial interface for Modbus-ASCII...');
        await modbus.open();
        try {
            Statistics.createInstance(nconf.get('statistics'));
            await Nibe1155.createInstance(modbus, nconf.get('nibe1155'));
            await HeatPump.createInstance(Nibe1155.Instance, nconf.get('heat-pump'));
            await startupServer();
            // doHeatPumpControlling();
            const hp = HeatPump.getInstance();
            await hp.start();
            // const startModeConfig: IStartModeConfig = nconf.get('startmode');
            // try {
            //     if (!startModeConfig || startModeConfig.disabled === true) {
            //         await hp.start(HeatpumpControllerMode.off);
            //     } else {
            //         await hp.setDesiredMode(new Nibe1155Controller({
            //             createdAt: new Date(),
            //             desiredMode: <HeatpumpControllerMode>startModeConfig.mode,
            //             fSetpoint: startModeConfig.fSetpoint
            //         }));
            //         await hp.start( <HeatpumpControllerMode>startModeConfig.mode);
            //     }
            // } catch (err) {
            //     debug.warn('Error on config startmode', err);
            //     await hp.start(HeatpumpControllerMode.off);
            // }
        } catch (err) {
            debug.warn(err);
        }
        debug.info('set SIGINT handler for CTRL+C');
        process.on('SIGINT', () => {
            console.log('...caught interrupt signal');
            shutdown('interrupt signal (CTRL + C)').catch( (err) => {
                console.log(err);
                process.exit(1);
            });
        });
        debug.info('startup finished, enter now normal running mode.');

    }  catch (err) {
        console.log(err);
        console.log('-----------------------------------------');
        console.log('Error: exit program');
        process.exit(1);
    }
}

async function shutdown (src: string): Promise<void> {
    debug.info('starting shutdown ... (caused by %s)', src || '?');
    const shutdownMillis = +nconf.get('shutdownMillis');
    const timer = setTimeout( () => {
        console.log('Some jobs hanging? End program with exit code 1!');
        process.exit(1);
    }, shutdownMillis > 0 ? shutdownMillis : 500);
    let rv = 0;

    try { await Server.getInstance().stop(); } catch (err) { rv++; console.log(err); }
    debug.fine('monitor shutdown done');

    clearTimeout(timer);
    debug.info('shutdown successfully finished');
    process.exit(rv);
}

async function startupParallel (): Promise<any []> {
    debug.info('startupParallel finished');
    return [];
}

async function startupServer (): Promise<void> {
    const configServer = nconf.get('server');
    const configAuth = nconf.get('auth');
    const configUsers = nconf.get('database-users');
    if (configServer && configServer.start) {
        await DbUser.createInstance(configUsers);
        await Auth.createInstance(configAuth);
        await Server.getInstance().start();
        await UdpServer.createInstanceAsync(nconf.get('udpServer') || { disabled: true });
    }
}

async function delay (ms: number) {
    return new Promise<void>( (res, rej) => {
        setTimeout( () => {
            res();
        }, ms);
    });
}

function startupPrintVersion (info?: git.GitInfo) {
    console.log('main.ts Version ' + VERSION);
    if (info) {
        console.log('GIT: ' + info.branch + ' (' + info.hash + ')');
        const cnt = info.modified.length;
        console.log('     ' + (cnt === 0 ? 'No files modified' : cnt + ' files modified'));
    }
}
