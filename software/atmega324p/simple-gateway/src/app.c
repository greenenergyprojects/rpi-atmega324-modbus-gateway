#include "global.h"
#include <stdio.h>
#include <string.h>

#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>

#include "app.h"
#include "sys.h"

// defines
#ifdef TEST
    #define FRAME_END_FIRST '\n'
    #define FRAME_END_SECOND '\r'
#else
    #define FRAME_END_FIRST '\r'
    #define FRAME_END_SECOND '\n'
#endif

// declarations and definations

struct App app;


// functions

void app_init (void) {
    memset((void *)&app, 0, sizeof(app));
    PORTD &= ~(1 << PD6);  // PD6=DE1  = 0 -> disable Modbus 1 as transmitter
    PORTD &= ~(1 << PD7);  // PD7=nRE1 = 0 -> enable Modbus 1 as receiver
    PORTD &= ~(1 << PD4);  // PD4=DE2  = 0 -> disable Modbus 2
    PORTD |=  (1 << PD5);  // PD5=nRE2 = 1 -> disable Modbus 2

    app.isGateway = 1;
}


//--------------------------------------------------------

void app_inc8BitCnt (uint8_t *cnt) {
    *cnt = *cnt < 255 ? *cnt++ : *cnt;
}

void app_ringBuffer_clear (struct App_Ringbuffer *b) {
    b->length = 0;
    b->rIndex = 0;
    b->wIndex = 0;
}

uint8_t app_ringBuffer_write (struct App_Ringbuffer *b, uint8_t data) {
    if (b->length >= sizeof b->buffer) {
        return 1;
    }
    b->length++;
    b->buffer[b->wIndex++] = data;
    return 0;
}

uint8_t app_ringBuffer_replace (struct App_Ringbuffer *b, uint8_t data) {
    b->buffer[b->wIndex - 1] = data;
    return 0;
}

uint8_t app_ringBuffer_writeString (struct App_Ringbuffer *b, const char *s) {
    uint8_t c;
    while (1) {
        c = *s++;
        if (c == 0) {
            return 0;
        } else if(app_ringBuffer_write(b, c)) {
            return 1;
        }
    }
}

uint8_t app_ringBuffer_read (struct App_Ringbuffer *b) {
    if (b->length > 0) {
        b->length--;
        return b->buffer[b->rIndex++];
    } else {
        return 0;  // Error
    }
}

// ------------------------------------------------------------------------

void app_main (void) {
    if (app.uart0_out.length > 0) {
        if (UCSR0A & (1 << UDRE0)) {
            uint8_t x = app_ringBuffer_read(&app.uart0_out);
            // printf("write %02x\n", x);
            UDR0 = x;
            UCSR0A |= (1 << TXC0);
        }
    }
    if (app.sendRequest) {
        if (app.uart0_in.length == 0) {
            if (UCSR1A & (1 << TXC1)) {
                app.sendRequest = 0;
                PORTD &= ~(1 << PD6);  // PD6=DE1  = 0 -> disable Modbus 1 as transmitter
                // printf("sending via modbus1 finished\n");
            }
        } else {
            PORTD |= (1 << PD6);   // PD6=DE1  = 0 -> enable Modbus 1 as transmitter
            if (UCSR1A & (1 << UDRE0)) {
                uint8_t x = app_ringBuffer_read(&app.uart0_in);
                UDR1 = x;
                UCSR1A |= (1 << TXC1);
            }
        }
    }

}


uint16_t app_updateModbusCrc (uint16_t crc, uint8_t b) {
    crc = crc ^ b;
    for (uint8_t i = 0; i < 8; i++) {
        if ((crc & 0x0001) == 0x0001) {
            crc = (crc >> 1) ^ 0xa001;
        } else {
            crc = crc >> 1;
        }
    }
    return crc;
}


void app_handleUart0Byte (uint8_t data) {
    static uint8_t frameActive = 0;
    static uint8_t frameEnd;
    static uint8_t cnt;
    static uint8_t lrc;
    static uint8_t lastData;
    static uint8_t lastByte;
    static uint16_t crc;
    uint8_t b;

    if (data == ':') {
        // printf("read %02x -> start of frame\n", data);
        frameActive = 1;
        frameEnd = 0;
        cnt = 0;
        lrc = 0;
        crc = 0xffff;
        app_ringBuffer_clear(&app.uart0_in);
        app_updateModbusCrc(0, 1);
        sys_setEvent(APP_EVENT_NEW_FRAME);
        return;

    } else if (!frameActive) {
        // printf("Missing start of frame\n");
        return;

    } else if (frameEnd) {
        if (data == FRAME_END_SECOND) {
            if (lrc != 0) {
                app_inc8BitCnt(&app.errorCnt.modbus_ascii_lrc);
                app_ringBuffer_writeString(&app.uart0_out, ":0080017E\r\n");
            } else {
                app.sendRequest = 1;
            }
            frameActive = 0;
        } else {
            app_inc8BitCnt(&app.errorCnt.modbus_ascii_crlf);
        }
        return;
    }

    if (data >= '0' && data <= '9') {
        // printf("read %02x --> %c\n", data, data);
        b = data - '0';
    } else if (data >= 'A' && data <= 'F') {
        // printf("read %02x --> %c\n", data, data);
        b = data - 'A' + 10;
    } else {
        // printf("read %02x -> end?\n", data);
        b = 0xff;
    }

    if (b <= 0x0f) {
        if (cnt % 2) {
            b = lastData * 16 + b;
            lrc += b;
            app_ringBuffer_write(&app.uart0_in, b);
            if (cnt > 1) {
                crc = app_updateModbusCrc(crc, lastByte);
                // printf("update crc with %02x -> %04x\n", lastByte, crc);
            }
            lastByte = b;
        } else {
            lastData = b;
        }

    } else if (data == FRAME_END_FIRST) {
        if (cnt % 2) {
            // printf("read %02x -> invalid end of frame\n", data);
            frameActive = 0;
        } else {
            frameEnd = 1;
            // printf("crc=%04x\n", crc);
            app_ringBuffer_replace(&app.uart0_in, crc & 0xff);
            app_ringBuffer_write(&app.uart0_in, crc >> 8);
        }

    } else {
        // sys_setEvent(APP_EVENT_GW_INVALIDCHAR);
        frameActive = 0;
    }

    cnt++;

}

void app_writeModbusASCIIByte (uint8_t b) {
    for (uint8_t i = 0; i < 2; i++) {
        uint8_t x = (i == 0) ? b >> 4 : b & 0x0f;
        if (x >= 0 && x <= 9) {
            app_ringBuffer_write(&app.uart0_out, x + '0');
        } else {
            app_ringBuffer_write(&app.uart0_out, x - 10 + 'A');
        }
    }
}


void app_handleUart1Byte (uint8_t data, uint8_t status) {
    if (app.isModbusMonitor) {
        sei();
    }

    if (status & 0xf0) {
        PORTB |= (1 << PB3);
        PORTB &= ~(1 << PB3);
        sys_setEvent(APP_EVENT_MODBUS_ERROR);
        if (app.isModbusMonitor) {
            printf("\n\rU\n\r");
        }
        return;

    } else if (status & (1 << SYS_MODBUS_STATUS_NEWFRAME)) {
        PORTB |= (1 << PB0);
        PORTB &= ~(1 << PB0);
        sys_setEvent(APP_EVENT_NEW_FRAME);
        if (app.isModbusMonitor) {
            printf("\n\r");
        }
        if (app.isGateway) {
            app_ringBuffer_write(&app.uart0_out, ':');
            app.gateway.lrc = 0;
            app.gateway.crc = 0xffff;
            app.gateway.modbusByteCnt = 0;
        }

    } else if (status & (1 << SYS_MODBUS_STATUS_ERR_FRAME)) {
        PORTB |= (1 << PB1);
        PORTB &= ~(1 << PB1);
        sys_setEvent(APP_EVENT_MODBUS_ERROR);
        if (app.isModbusMonitor) {
            printf("XX");
        }

    } else {
        // PORTB |= (1 << PB2);
        // PORTB &= ~(1 << PB2);
    }

    if (app.isModbusMonitor) {
        for (uint8_t i = 0; i < 2; i++) {
            uint8_t x = (i == 0) ? data >> 4 : data & 0x0f;
            if (x >= 0 && x <= 9) {
                putchar(x + '0');
            } else {
                putchar(x - 10 + 'a');
            }
        }
    }

    if (app.isGateway) {
        // shift bytes by 2, because CRC (2 bytes) must be replayce by LRC on end
        app.gateway.modbusByteCnt = app.gateway.modbusByteCnt < 0xff ? app.gateway.modbusByteCnt + 1 : app.gateway.modbusByteCnt;
        if (app.gateway.modbusByteCnt > 2) {
            uint8_t b = app.gateway.lastModbusByte[1];
            app_writeModbusASCIIByte(b);
            app.gateway.lrc += b;
        }
        sei();
        app.gateway.lastModbusByte[1] = app.gateway.lastModbusByte[0];
        app.gateway.lastModbusByte[0] = data;
        app.gateway.crc = app_updateModbusCrc(app.gateway.crc, data);
    }
}

void app_handleUart1Timeout () {
    PORTB |= (1 << PB0);
    PORTB &= ~(1 << PB0);
    sys_setEvent(APP_EVENT_NEW_FRAME);
    if (app.isModbusMonitor) {
        printf("\n\r");
    }
    if (app.isGateway) {
        if (app.gateway.modbusByteCnt > 0) {
            // printf(" CRC=%04x ", app.gateway.crc);
            // CRC must be 0x0000 if frame ok
            uint8_t lrc = app.gateway.crc == 0 ? ((unsigned char)(-((signed char)app.gateway.lrc))) : ~app.gateway.lrc;
            app_writeModbusASCIIByte(lrc);
        }
        app_ringBuffer_write(&app.uart0_out, '\r');
        app_ringBuffer_write(&app.uart0_out, '\n');
    }
}

//--------------------------------------------------------

void app_task_1ms (void) {}
void app_task_2ms (void) {}

void app_task_4ms (void) {
    static uint8_t brOld = 0;
    uint8_t swRight = (PINC & 0x80) != 0;
    uint16_t br;
    // if (swRight) {
    //     br = 19200;
    // } else {
    //     br = 9600;
    // }
    // if (brOld != br) {
    //     sys.modbus[0].dT1_35 = 70 * F_CPU / 16 / br;
    //     sys.modbus[0].dT1_15 = 30 * F_CPU / 16 / br;
    //     OCR1A = sys.modbus[0].dT1_35;
    // }
    // UBRR1L = (F_CPU / br + 4)/8 - 1;
}

void app_task_8ms (void) {
    static uint8_t timerD9 = 0, timerD8 = 0, timerD7 = 0;

    timerD9++;
    if (timerD9 >= 125) {
        timerD9 = 0;
        sys_setLedD9(1);
    } else if (timerD9 == 16) {
        sys_setLedD9(0);
    }

    if (timerD8 > 0) {
        timerD8--;
    } else if (sys_clearEvent(APP_EVENT_NEW_FRAME)) {
        timerD8 = 30;
    }
    sys_setLedD8(timerD8 > 15);

    if (timerD7 > 0) {
        timerD7--;
    } else if (sys_clearEvent(APP_EVENT_MODBUS_ERROR)) {
        timerD7 = 30;
    }
    sys_setLedD8(timerD7 > 15);
}


void app_task_16ms (void) {}
void app_task_32ms (void) {}
void app_task_64ms (void) {}

void app_task_128ms (void) {
    static uint8_t timer = 0;
    timer = timer >= 8 ? 0 : timer + 1;

    if (timer == 0) {
        // UDR1 = 0x41;
        // app_handleUart1Byte(0x41, 0);
    }
}

