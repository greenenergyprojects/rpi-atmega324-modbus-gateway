.PHONY: clean all

$(shell mkdir -p dist >/dev/null)
$(shell mkdir -p build >/dev/null)

all: dist/atmega324p.hex
	@avr-size --mcu=atmega324p --format=avr dist/atmega324p.elf	


dist/atmega324p.hex: dist/atmega324p.elf
	avr-objcopy -O ihex $< $@

dist/atmega324p.elf: build/main.o build/sys.o build/app.o
	avr-gcc -o $@ -mmcu=atmega324p build/main.o build/sys.o build/app.o

build/main.o: src/main.c src/global.h src/sys.h src/app.h
	avr-gcc -o $@ -mmcu=atmega324p -Os -c src/main.c

build/sys.o: src/sys.c src/global.h src/sys.h
	avr-gcc -o $@ -mmcu=atmega324p -Os -c src/sys.c

build/app.o: src/app.c src/global.h src/app.h
	avr-gcc -o $@ -mmcu=atmega324p -Os -c src/app.c

clean:
	-@rm -r dist
	-@rm -r build
