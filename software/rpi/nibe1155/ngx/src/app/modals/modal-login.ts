// https://ng-bootstrap.github.io/#/components/modal/examples

// https://www.npmjs.com/package/@fortawesome/angular-fontawesome
// npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/angular-fontawesome

import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbModalConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { IUserLogin } from '../data/common/server/user';

export interface IModalLoginConfig {
    title?: string;
    userid?: string;
    loginButtonText?: string;
    buttonEyeVisible?: boolean;
    isUseridEditable?: boolean;
}

@Component({
    selector: 'app-modal-login',
    exportAs: 'ModalLoginComponent',
    template: `
        <ng-template #content let-c="close" let-d="dismiss">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-basic-title">{{title}}</h5>
            </div>
            <div class="modal-body">
                <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" (keydown)="keyDown($event)">
                    <div class="form-group">
                        <label class="sr-only" for="inputHtlid">HTL-ID</label>
                        <input formControlName="userid" class="form-control" type="Text" placeholder="User-ID" minlength="2" maxlength="24"
                             [readonly]="!isUseridEditable"/>
                    </div>
                    <div class="form-group">
                        <div class="input-group">
                        <input formControlName="password" class="form-control" type="{{passwordInputType}}" placeholder="Password"/>
                        <span *ngIf="buttonEyeVisible" class="input-group-btn">
                            <button id="button-eye" class="btn btn-outline-secondary" type="button" style="display: block;" (click)="togglePasswordShown()">
                                <fa-icon [icon]="(passwordInputType==='Password')?'eye':'eye-slash'"></fa-icon>
                            </button>
                        </span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="!loginForm.valid" (click)="c('Login click'); login()">{{loginButtonText}}</button>
            </div>
        </ng-template>
    `,
    styles: [ `
        .ng-valid[required], .ng-valid.required  {
            border-left: 5px solid green
        }
        .ng-invalid:not(form) {
            border-left: 5px solid red
        }
        .form-signin {
            max-width: 300px;
            padding: 0px;
            margin: 0 auto;
        }
        #input-htlid, #input-password, #button-eye, #button-eye-slash {
            border-radius: 0.25rem;
        }
    `]
})
export class ModalLoginComponent {

    @ViewChild('content') content: ElementRef;

    public title: string;
    public loginButtonText: string;
    public loginForm: FormGroup;
    public isUseridEditable: boolean;
    public passwordInputType = 'Password';
    public buttonEyeVisible: boolean;

    private _modalReference: NgbModalRef;
    private _waiting: { res: (result: IUserLogin) => void, rej: (error: any) => void };;

    constructor (config: NgbModalConfig, private modalService: NgbModal) {
        // customize default values of modals used by this component tree
        console.log('ModalLoginComponent constructor');
        config.backdrop = 'static';
        config.keyboard = false;
        this.title = 'Anmelden...';
        this.loginButtonText = 'Login';
        this.isUseridEditable = true;
        this.buttonEyeVisible = true;
        this.loginForm = new FormGroup({
            userid: new FormControl('', [ Validators.required] ),
            password: new FormControl('', [ Validators.required ])
        });

    }

    open (content) {
        this._modalReference = this.modalService.open(content);
    }

    cancel () {
        console.log('Error: cancel not implemented');
    }

    public login () {
        this._modalReference = null;
        if (!this._waiting) {
            console.log('Error Login - missing promise...');
        } else {
            const res = this._waiting.res;
            this._waiting = null;
            res(this.loginForm.value);
        }
    }

    public keyDown (event) {
        // check enter on keyboard
        if (event.keyCode === 13) {
            if (!this.loginForm.invalid) {
                setTimeout( () => {
                    this._modalReference.close('enter');
                    this.login();
                }, 1);

            }
        }
    }

    public togglePasswordShown() {
        console.log(this.passwordInputType);
        if (this.passwordInputType === 'Password') {
            this.passwordInputType = 'Text';
        } else {
            this.passwordInputType = 'Password';
        }
    }

    public async show (config?: IModalLoginConfig): Promise<IUserLogin> {
        if (this._modalReference) {
            return Promise.resolve(null); // null -> authorization in progress
        }
        config = config || {};
        this.title = config.title || 'Anmelden...';
        this.loginButtonText = config.loginButtonText || 'Login';
        this.isUseridEditable = config.isUseridEditable;
        if (this.isUseridEditable !== true && this.isUseridEditable !== false) {
            this.isUseridEditable = true;
        }
        this.buttonEyeVisible = config.buttonEyeVisible || true;
        // if (config.userid) {
        //     this.loginForm.setValue({ userid: config.userid });
        // }

        return new Promise<any> ( (resolve, reject) => {
            this._waiting = { res: resolve, rej: reject };
            this._modalReference = this.modalService.open(this.content);
        });
    }

}


//     public show (config?: IModalLoginConfig): Promise<IUserLogin> {
//         if (this._isVisible) {
//             return Promise.reject(new Error('Modal dialog already visibl'));
//         }
//         this._isVisible = true;
//         this.title = config.title || 'Authorize';
//         this.htlid = config.htlid || '';
//         this.password = '';
//         this.checkbox = config.checkbox || { visible: false, selected: true, text: 'Stay loggined' };
//         this.loginButtonText = config.loginButtonText || 'Login';
//         this.buttonEyeVisible = config.buttonEyeVisible || true;
//         this.enableHtlid = (this.htlid === '');

//         return new Promise<any> ( (resolve, reject) => {
//             this._resolve = resolve;
//             this._reject = reject;
//             this.childModal.show();

//             // needed beacuse autofocus does not work in modal
//             // see https://v4-alpha.getbootstrap.com/components/modal/#how-it-works
//             this.childModal.onShown.subscribe(() => {
//                 if (this.enableHtlid) {
//                     this. _inputHtlid.nativeElement.focus();
//                 } else {
//                     this. _inputPassword.nativeElement.focus();
//                 }
//             });

//         // needed when user clicks escape
//             this.childModal.onEsc = this.cancel.bind(this);

//             // needed when user hides modal by clicking outside
//             this.childModal.onHidden.subscribe( () => {

//                 if (!this._isCancelled) {
//                     this.cancel();
//                 }
//             });
//         });
//     }

//     public login () {
//         this.childModal.hide();
//         this._isVisible = false;
//         this._resolve( { htlid: this.htlid, password: this.password });
//     }

//     public cancel (e?) {
//         this._isCancelled = true;
//         this.childModal.hide();
//         this._isVisible = false;
//         this.htlid = undefined;
//         this.password = undefined;
//         this._resolve( { htlid: this.htlid, password: this.password } );
//     }

// }


// export class IModalLoginCheckbox {
//     visible: boolean;
//     selected: boolean;
//     text: string;
// }

// export class IModalLoginConfig {
//     title?: string;
//     htlid?: string;
//     loginButtonText?: string;
//     checkbox?: IModalLoginCheckbox;
//     buttonEyeVisible?: boolean;
// }
