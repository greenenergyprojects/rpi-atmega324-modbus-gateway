# Manufacturing report

## Gerber Files

See [https://support.jlcpcb.com/article/44-how-to-export-kicad-pcb-to-gerber-files](https://support.jlcpcb.com/article/44-how-to-export-kicad-pcb-to-gerber-files)

# Bugs / Improvements

| Reference | Description |
| --------- | ----------- |
|           |             |


# Software

## Atmega324P Fuses

See [http://www.engbedded.com/fusecalc](http://www.engbedded.com/fusecalc)

* Ext crystal Osc, Frequ. 8.0- MHz, Startup 1K CK + 4.1ms
* Preserve EEPROM memory through Chip Erase cycle
* Serial program downloading enabled
* Brownout detection level 1.8V
* Watchdog disabled
* Boot flash size 1024 words, boot start 3c00 (=byte address 7800)
* Boot reset vector

```
avrdude -c usbasp -p atmega324p -U lfuse:w:0xfe:m -U hfuse:w:0xd2:m
avrdude -c usbasp -p atmega324p -U efuse:w:0xfe:m
```

## Bootloader

[https://www.htl-mechatronik.at/gitweb/public/sx/?p=Atmel-Bootloader.git;a=summary](https://www.htl-mechatronik.at/gitweb/public/sx/?p=Atmel-Bootloader.git;a=summary)

Download file [bootloader_atmega324p_115200_12MHz](https://www.htl-mechatronik.at/gitweb/public/sx/?p=Atmel-Bootloader.git;a=blob;f=bootloader_atmega324p/bootloader_atmega324p_115200_12MHz.hex)

avrdude -c usbasp -p atmega324p
avrdude -c usbasp -p atmega324p -e -U flash:w:bootloader_atmega324p_57600_12MHz.hex:i

## UART Baudrate

For the microcontroller UART0 the baudrate 115200 Bit/s is recommended. This speed ensures a high data rate between RPI and microcontroller. Higher speeds are not possible with 12MHz system frequency.

Microcontroller: f = 12MHz		

|  Baudrate  |   Optimal UBRR0L  |     Error
|:----------:|:-----------------:| :-----------:
|     9600   |      155,25       |    0,0016
|    19200   |       77,12       |    0,0016
|    37400   |       39,11       |    0,0027
|    57600   |       25,04       |    0,0017
| **115200** |     **12,02**     |  **0,0017**
|   230400   |        5,51       |   -0,0888
|   560800   |        1,67       |   -0,1942


## Raspberry serial

Disable serial interface for Terminal with the tool `raspi-config`. Select `5 Interfacing Options` -> `P6 Serial` and select `NO`. Reboot is needed if the configuration has changed.


In the raspberry PI3 default configuration the Uart is used for Bluetooth communication. To allow serial port communcation via pin Txd (GPIO10) and Rxd (GPIO12)  a configuration change is necessary.

Edit the file`/boot/config.txt` and set the last lines to

```
enable_uart=1
core_freq=250
```

After reboot you can use `/dev/serial0` for serial communication between microcontroller and Raspberry. It depends on the raspberry version if `/dev/serial0` is a link to `/dev/ttyAMA0` (older raspberry) or `dev/ttyS0` (newer raspberry).

For more information:  
[http://www.netzmafia.de/skripten/hardware/RasPi/RasPi_Serial.html](http://www.netzmafia.de/skripten/hardware/RasPi/RasPi_Serial.html)


