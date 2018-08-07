var SerialPort = require('serialport');

var port = new SerialPort('/dev/ttyS0', { baudRate: 115200 }, function (err) {
    if (err) {
        console.log(err);
    } else {
       console.log('Port /dev/ttyS0 opened');
       port.on('data', (b) => handleDataASCII(b));
       setInterval( () => { writeModbusFrame() }, 1000);
    }
});

var wCnt = 0;

function writeModbusFrame () {
    wCnt++;
    if (wCnt % 5 === 0) {
        port.write(':01031000003AB1\r\n');  // LRC error
    } else {
        port.write(':01031000003BB1\r\n');
    }
}

var s = '';
var x = [];
var cnt = 0;
var errors = 0;

function handleDataASCII (data) {
    for (const b of data.values()) {
        if (b === 10) {
            console.log(s);
            s = '';
        } else if (b !== 13) {
            s = s + String.fromCharCode(b);
        }
        cnt++;
    }
}


function handleDataLine (data) {
    for (const b of data.values()) {
        if (b === 10) {
            console.log(s);
            if (s.startsWith('write ') && s.length >= 8) {
                let value = parseInt(s.substr(6,2), 16);
                x.push(value);
                if (value === 0xd9) {
                    if (x.length !== 8) {
                        errors++;
                    }
                    console.log('cnt=' + cnt + ', errors=' + errors + '  -> ', x);
                    x = [];
                }
            }
            s = '';
        } else if (b !== 13) {
            s = s + String.fromCharCode(b);
        }
        cnt++;
    }
}

