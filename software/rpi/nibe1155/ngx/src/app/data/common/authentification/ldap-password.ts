
// import * as jssha from 'jssha';

// const sha1 = require('sha1');
// const md4 = require('js-md4');
// const atob = require('atob');
// const btoa = require('btoa');

// declare function unescape (s: string): string;

// export class LdapPassword {

//     public static verifiy (hash: string, password: string) {
//         const pw1 = new LdapPassword(hash);
//         const pw2 = new LdapPassword(password, pw1._saltBytes);
//         const rv = (pw1._slapdPasswordHash === pw2._slapdPasswordHash);
//         return rv;
//     }

//     private static base64ToUint8Array (base64: string) {
//         const binary =  atob(base64);
//         const len = binary.length;
//         const bytes = new Uint8Array(new ArrayBuffer(len));
//         for (let i = 0; i < len; i++)        {
//             bytes[i] = binary.charCodeAt(i);
//         }
//         return bytes;
//     }

//     private static str2Uint8Array (str: string): Uint8Array  {
//         const utf8 = unescape(encodeURIComponent(str));
//         const arr = [];
//         for (let i = 0; i < utf8.length; i++) {
//             arr.push(utf8.charCodeAt(i));
//         }
//         const buffer = new ArrayBuffer(arr.length);
//         const bufferView = new Uint8Array(buffer);
//         for (let i = 0; i < arr.length; i++) {
//             bufferView[i] = arr[i];
//         }
//         return bufferView;
//     }

//     private static hexstr2Uint8Array (str: string): Uint8Array {
//         const buf = new ArrayBuffer(str.length / 2);
//         const bufView = new Uint8Array(buf);
//         for (let i = 0, j = 0, strLen = str.length; i < strLen; j++) {
//             const c1 = str.charAt(i++);
//             const c2 = str.charAt(i++);
//             const x = parseInt(c1, 16) * 16 + parseInt(c2, 16);
//             bufView[j] = x;
//         }
//         return bufView;
//     }

//     private static utf16str2Uint8Array (str: string): Uint8Array {
//         const buf = new ArrayBuffer(str.length * 2);
//         const bufView = new Uint8Array(buf);
//         for (let i = 0, j = 0, strLen = str.length; j < strLen; j++) {
//             const x = str.charCodeAt(j);
//             if (x < 255) {
//                 bufView[i++] = x;
//                 bufView[i++] = 0;
//             } else {
//                 bufView[i++] = Math.floor(x % 256);
//                 bufView[i++] = Math.floor(x / 256);
//             }
//         }
//         return bufView;
//     }

//     private static arrayBufferToBase64 (buffer: ArrayBuffer): string {
//         let binary = '';
//         const len = buffer.byteLength;
//         for (let i = 0; i < len; i++) {
//             binary += String.fromCharCode((<any>buffer)[i]);
//         }

//       return btoa(binary);
//     }

//     private static concatTypedArrays (a: any, b: any): any { // a, b TypedArray of same type
//         const c = new (a.constructor)(a.length + b.length);
//         c.set(a, 0);
//         c.set(b, a.length);
//         return c;
//     }

//     private static getSalt (size: number): number [] {
//         const rv: number [] = [];
//         while (size--) {
//             rv.push(Math.floor(Math.random() * 256));
//         }
//         return rv;
//     }

//     // ** non static attributes and methods **********************************************

//     private _slapdPasswordHash: string;
//     private _sambaPasswordHash: string;
//     private _saltBytes: Uint8Array;
//     private _sha1Bytes: Uint8Array;

//     constructor (password: string, salt?: Uint8Array | number []) {
//         if (typeof(password) !== 'string') {
//             throw new Error('no valid password (' + typeof password + ')');
//         }
//         if (password.startsWith('{SSHA}')) {
//             this._slapdPasswordHash = password;
//             const ba = LdapPassword.base64ToUint8Array(password.substr(6));
//             let saltLength;
//             switch (ba.length) {
//                 case 24: saltLength = 4; break; // SHA-1 (20 Byte + 4 Byte Salt)
//                 default: throw new Error('password length not supported');
//             }
//             this._saltBytes = new Uint8Array(new ArrayBuffer(saltLength));
//             this._sha1Bytes = new Uint8Array(new ArrayBuffer(ba.length - saltLength));
//             for (let i = 0; i < ba.length; i++) {
//                 if (i < this._sha1Bytes.length) {
//                    this._sha1Bytes[i] = ba[i];
//                 } else {
//                     this._saltBytes[i - this._sha1Bytes.length] = ba[i];
//                 }
//             }
//         } else {
//             if (salt instanceof Uint8Array) {
//                 this._saltBytes = salt;
//             } else {
//                 if (!Array.isArray(salt) || salt.length === 0) {
//                   salt = LdapPassword.getSalt(4);
//                 }
//                 this._saltBytes = new Uint8Array(new ArrayBuffer(4));
//                 for (let i = 0; i < 4; i++) {
//                     this._saltBytes[i] = salt[i];
//                 }
//             }
//             if (password.startsWith('{PLAIN}')) {
//                 password = password.substr(7);
//             }
//             const pwBytes = LdapPassword.str2Uint8Array(password);
//             const shaObj = new jssha('SHA-1', 'ARRAYBUFFER');
//             shaObj.update(<any>pwBytes);
//             shaObj.update(<any>this._saltBytes);
//             const hash = shaObj.getHash('HEX');
//             const hashBytes = LdapPassword.hexstr2Uint8Array(hash);
//             const bb = LdapPassword.concatTypedArrays(hashBytes, this._saltBytes);
//             this._slapdPasswordHash = '{SSHA}' + LdapPassword.arrayBufferToBase64(bb);
//             this._sambaPasswordHash = md4(LdapPassword.utf16str2Uint8Array(password)).toUpperCase();
//         }
//     }

//     public get slapdPasswordHash (): string {
//         return this._slapdPasswordHash;
//     }

//     public get sambaPasswordHash (): string {
//         return this._sambaPasswordHash;
//     }

// }
