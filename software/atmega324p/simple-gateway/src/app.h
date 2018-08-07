#ifndef APP_H_
#define APP_H_

// declarations

struct App_Ringbuffer {
    uint8_t buffer[256];
    uint8_t length;
    uint8_t wIndex;
    uint8_t rIndex;
};

struct App_Gateway {
    uint8_t lastModbusByte[2];
    uint8_t modbusByteCnt;
    uint8_t lrc;
    uint16_t crc;
};

struct App_ErrCounter {
    uint8_t modbus_ascii_lrc;
    uint8_t modbus_ascii_crlf;
};

struct App {
    uint8_t flags_u8;
    uint8_t isGateway;
    uint8_t isModbusMonitor;
    uint8_t sendRequest;
    struct App_Ringbuffer uart0_in;
    struct App_Ringbuffer uart0_out;
    struct App_Gateway gateway;
    struct App_ErrCounter errorCnt;
};

extern struct App app;


// defines

#define APP_EVENT_NEW_FRAME    0x01
#define APP_EVENT_MODBUS_ERROR 0x02
#define APP_EVENT_GW_LRCERR       0x04
#define APP_EVENT_GW_INVALIDCHAR  0x08
#define APP_EVENT_4   0x10
#define APP_EVENT_5   0x20
#define APP_EVENT_6   0x40
#define APP_EVENT_7   0x80


// functions

void app_init ();
void app_main ();

void app_handleUart0Byte (uint8_t data);
void app_handleUart1Byte (uint8_t data, uint8_t status);
void app_handleUart1Timeout ();

void app_task_1ms   ();
void app_task_2ms   ();
void app_task_4ms   ();
void app_task_8ms   ();
void app_task_16ms  ();
void app_task_32ms  ();
void app_task_64ms  ();
void app_task_128ms ();

#endif  // APP_H_
