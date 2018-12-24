// https://fontawesome.com/how-to-use/on-the-web/using-with/angular
// https://ng-bootstrap.github.io/#/components/modal/examples

import { Component, OnInit, Input, ViewChild, ApplicationRef } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

export interface ISyncButtonConfig {
    text: string;
    classes: {
        default: string;
        onBusy?: string;
        onSuccess?: string;
        onError?: string;
    };
    handler: {
        onClick?: (config: ISyncButtonConfig) => Promise<void>;
        onCancel?: (config: ISyncButtonConfig) => void;
    };
}

@Component({
    selector: 'app-sync-button',
    template: `
        <button [ngClass]="classes" (click)="onClick()" placement="top" #tooltip="ngbTooltip" ngbTooltip triggers="manual">
            <fa-icon [icon]="'sync'" [pulse]="isBusy"></fa-icon>
            <span style="margin-left:10px">{{config.text}}</span>
        </button>`,
})
export class SyncButtonComponent implements OnInit {

    @Input() config: ISyncButtonConfig;
    @ViewChild('tooltip') public tooltip: NgbTooltip;

    public isBusy = false;
    public classes: string;

    private _pending: Promise<void>;
    private _lastError: any;

    constructor (private _applicationRef: ApplicationRef) {

    }

    public ngOnInit () {
        this.classes = this.config.classes.default;
        console.log(this.tooltip);
    }

    public async onClick () {
        if (!this.isBusy) {
            if (this.config.classes.onBusy) {
                this.classes = this.config.classes.onBusy;
            } else {
                this.classes = this.config.classes.default;
            }
            this.isBusy = true;
            if (this.config.handler.onClick) {
                try {
                    const p = this.config.handler.onClick(this.config);
                    this._pending = p;
                    await p;
                    if (this._pending !== p) {
                        // job already done
                        return;
                    }
                    this._lastError = null;
                    if (this.config.classes.onSuccess) {
                        this.classes = this.config.classes.onSuccess;
                    } else {
                        this.classes = this.config.classes.default;
                    }
                } catch (err) {
                    if (err instanceof Error && err.message) {
                        console.log(err);
                        this.tooltip.ngbTooltip = err.message;
                        this.tooltip.open();
                        setTimeout( () => { this.tooltip.close(); }, 2000);
                    }
                    this._lastError = err;
                    if (this.config.classes.onError) {
                        this.classes = this.config.classes.onError;
                    } else {
                        this.classes = this.config.classes.default;
                    }
                } finally {
                    this.isBusy = false;
                    this._pending = null;
                }
            }
        } else {
            if (this.config.handler.onCancel) {
                this.config.handler.onCancel(this.config);
            } else {
                this._lastError = new Error('cancelled');
                if (this.config.classes.onError) {
                    this.classes = this.config.classes.onError;
                } else {
                    this.classes = this.config.classes.default;
                }
                this.isBusy = false;
                this._pending = null;
            }
        }

    }
}
