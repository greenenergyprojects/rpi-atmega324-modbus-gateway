




export const VERSION = '0.0.1';

import * as nconf from 'nconf';
import * as fs from 'fs';
import * as path from 'path';

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
import { ModbusRequest } from './modbus/modbus-request';
import { resolve } from 'dns';

doStartup();

async function doStartup () {

    const modbus = new ModbusSerial();
    await modbus.open();

    const requ1 = ModbusRequest.createReadHoldRegister(247, 0x2000 + 1, 1);
    const resp1 = await modbus.write(requ1.request);
    await delay(100);

    const requ2 = ModbusRequest.createReadHoldRegister(247, 0x1204 + 1, 1);
    const resp2 = await modbus.write(requ2.request);
    await delay(100);

    const requ3 = ModbusRequest.createReadHoldRegister(247, 0x1000 + 1, 1);
    const resp3 = await modbus.write(requ3.request);
    const requ4 = ModbusRequest.createReadHoldRegister(247, 0x1020 + 1, 1);
    const resp4 = await modbus.write(requ4.request);
    const requ5 = ModbusRequest.createReadHoldRegister(247, 0x1040 + 1, 1);
    const resp5 = await modbus.write(requ5.request);
    await delay(100);

    // for (let i = 0; i <= 20; i++) {
    //     const requ = ModbusRequest.createWriteHoldRegister(247, 0x1005 + 1, 15);
    //     const resp = await modbus.write(requ.request);
    //     await delay(5000);
    // }
    const now = Date.now();
    {
        while (Date.now() < (now + 30 * 60 * 1000)) {
            const requ = ModbusRequest.createWriteHoldRegister(247, 0x1300 + 1, 2000);
            const resp = await modbus.write(requ.request);
            await delay(5000);
        }
    }

}

async function delay (ms: number) {
    return new Promise<void>( (res, rej) => {
        setTimeout( () => {
            res();
        }, ms);
    });
}



// import * as SerialPort from 'serialport';
// import { sprintf } from 'sprintf-js';


// // var SerialPort = require('serialport');

// var port = new SerialPort('/dev/ttyS0', { baudRate: 115200 }, function (err) {
//     if (err) {
//         console.log(err);
//     } else {
//        console.log('Port /dev/ttyS0 opened');
//        port.on('data', (b) => handleDataASCII(b));
//        // setInterval( () => { writeModbusFrame() }, 1000);
//        // setInterval( () => { writeSaiaMeter() }, 2000);
//        setInterval( () => { writeEGOHeater() }, 2000);
//     }
// });

// var wCnt = 0;

// function writeModbusFrame () {
//     wCnt++;
//     if (wCnt % 5 === 0) {
//         port.write(':01031000003AB1\r\n');  // LRC error
//     } else {
//         port.write(':01031000003BB1\r\n');
//     }
// }

// function writeSaiaMeter () {
//         console.log('send request...');
// 	port.write(':010300010001FA\r\n');
// }

// function writeEGOHeater () {
//         console.log('send request...');
// 	port.write(':F70320000001E5\r\n');
// }


// var s = '';
// var x = [];
// var cnt = 0;
// var errors = 0;

// function handleDataASCII (data) {
//     for (const b of data.values()) {
//         if (b === 10) {
//             console.log(s);
//             s = '';
//         } else if (b !== 13) {
//             s = s + String.fromCharCode(b);
//         }
//         cnt++;
//     }
// }


// function handleDataLine (data) {
//     for (const b of data.values()) {
//         if (b === 10) {
//             console.log(s);
//             if (s.startsWith('write ') && s.length >= 8) {
//                 let value = parseInt(s.substr(6,2), 16);
//                 x.push(value);
//                 if (value === 0xd9) {
//                     if (x.length !== 8) {
//                         errors++;
//                     }
//                     console.log('cnt=' + cnt + ', errors=' + errors + '  -> ', x);
//                     x = [];
//                 }
//             }
//             s = '';
//         } else if (b !== 13) {
//             s = s + String.fromCharCode(b);
//         }
//         cnt++;
//     }
// }
