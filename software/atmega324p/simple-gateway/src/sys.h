#ifndef SYS_H_
#define SYS_H_

#if GLOBAL_UART_RECBUFSIZE > 255
  #error "Error: GLOBAL_UART_RECBUFSIZE value over maximum (255)"
#endif

// declarations

typedef uint8_t Sys_Event;

struct Sys_Modbus {
    uint16_t dT1_35;
    uint16_t dT1_15;
    uint16_t errorCnt;
    uint16_t receivedByteCnt;
};

struct Sys_Uart {
    uint8_t rpos_u8;
    uint8_t wpos_u8;
    uint8_t errcnt_u8;
    uint8_t rbuffer_u8[GLOBAL_UART0_RECBUFSIZE];
};

struct Sys {
    uint8_t flags;
    uint8_t taskErr_u8;
    Sys_Event  eventFlag;
    struct Sys_Uart uart;
    struct Sys_Modbus modbus[1];
};


// declaration and definations

extern volatile struct Sys sys;


// defines

// SYS_FLAG_SREG_I must have same position as I-Bit in Status-Register!!
#define SYS_FLAG_SREG_I          0x80

#define SYS_MODBUS_STATUS_ERR7      7
#define SYS_MODBUS_STATUS_ERR6      6
#define SYS_MODBUS_STATUS_ERR5      5
#define SYS_MODBUS_STATUS_ERR_FRAME 1
#define SYS_MODBUS_STATUS_NEWFRAME  0

// functions

void      sys_init (void);
void      sys_main (void);

void      sys_sei (void);
void      sys_cli (void);

uint8_t   sys_inc8BitCnt (uint8_t count);
uint16_t  sys_inc16BitCnt (uint16_t count);

void      sys_newline (void);

Sys_Event sys_setEvent (Sys_Event event);
Sys_Event sys_clearEvent (Sys_Event event);
Sys_Event sys_isEventPending (Sys_Event event);

uint8_t   sys_uart_available ();
int16_t   sys_uart_getBufferByte (uint8_t pos);
void      sys_uart_flush ();

void      sys_setLedD7 (uint8_t on);
void      sys_setLedD8 (uint8_t on);
void      sys_setLedD9 (uint8_t on);
void      sys_toggleLedD7 ();
void      sys_toggleLedD8 ();
void      sys_toggleLedD9 ();

#endif // SYS_H_
