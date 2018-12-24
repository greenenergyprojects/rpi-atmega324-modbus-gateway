import { Directive, Input, HostListener } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';

@Directive({
    selector: '[app-validator][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: ValidatorDirective, multi: true }
    ]
})
export class ValidatorDirective implements Validator {
    @Input() element: ValidatorElement<any>;
    @Input() name: string;

    constructor() { }

    validate(c: FormControl) {
        this.element.onChange(this.name, c.value);
        if (this.element.isValid(this.name, c.value)) {
            return null;
        } else {
            return { name: { valid: false } };
        }
    }

    @HostListener ('keypress', ['$event']) keypress = (event) => {
        this.element.onEvent('keypress', event, this.name);
    }

    @HostListener ('paste', ['$event']) paste = (event) => {
        this.element.onEvent('paste', event, this.name);
    }

    @HostListener ('blur', ['$event']) blur = (event) => {
        this.element.onEvent('blur', event, this.name);
    }

    // @HostListener ('focusout', ['$event']) focusout = (event) => {
    //     this.element.onEvent('focusout', event, this.name);
    // }
}

export class ValidatorElement<T> {
    public value: T;
    public callbackIsValid: ((e: ValidatorElement<any>, name: string, value: T) => boolean);
    public callbackOnChange: ((e: ValidatorElement<any>, name: string, value: T) => void);
    public callbackOnEvent: ((e: ValidatorElement<any>, name: string, typ: string, event: any) => void);

    constructor (value: T, callbackOnChange?: ((e: ValidatorElement<any>, name: string, value: T) => void),
                           callbackIsValid?:  ((e: ValidatorElement<any>, name: string, value: T) => boolean),
                           callbackOnEvent?:  ((e: ValidatorElement<any>, name: string, typ: string, event: any) => void)) {
        this.value = value;
        this.callbackOnChange = callbackOnChange;
        this.callbackIsValid = callbackIsValid;
        this.callbackOnEvent = callbackOnEvent;
    }

    isValid (name?: string, value?: T): boolean {
        if (this.callbackIsValid) {
            return this.callbackIsValid(this, name, value);
        } else {
            return true;
        }
    }

    onChange (name?: string, value?: T): void {
        if (this.callbackOnChange) {
            this.callbackOnChange(this, name, value);
        }
    }

    onEvent (eventTyp: string, event: any, name?: string): void {
        // console.log('Event ' + eventTyp);
        // console.log(event);
        if (this.callbackOnEvent) {
            this.callbackOnEvent(this, name, eventTyp, event);
            // use event.preventDefault() to suppress event
        }
    }

}
