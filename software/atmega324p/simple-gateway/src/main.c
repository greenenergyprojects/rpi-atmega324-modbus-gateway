//***********************************************************************
// AIIT Template Level 3
// ----------------------------------------------------------------------
// Description:
//   UART-Support, Timer, Task-System, 7-Segment-Support, LCD-Support
// ----------------------------------------------------------------------
// Created: Aug 23, 2016 (SX)
//***********************************************************************

#include "./global.h"

#include <stdio.h>
#include <string.h>

#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>

#include "./sys.h"
#include "./app.h"

// defines
// ...

// declarations and definations
// ...

// constants located in program flash and SRAM
const char MAIN_WELCOME[] = "\n\rmodbus-gateway";
const char MAIN_DATE[] = __DATE__;
const char MAIN_TIME[] = __TIME__;
const char MAIN_HELP[] = "\r\n";


int main () {
    sys_init();

    app_init();
    printf("%s %s %s %s", MAIN_WELCOME, MAIN_DATE, MAIN_TIME, MAIN_HELP);
    sys_newline();

    // enable interrupt system
    sei();

    while (1) {
        sys_main();
        app_main();
    }
    return 0;
}
