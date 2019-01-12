// import * as passwordHash from 'password-hash';
// import { LdapPassword } from './ldap-password';
const sha256 = require('sha256');

// export interface Options extends passwordHash.Options {
  export interface Options {
  // algorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512';
  algorithm?: 'sha256';
  ldap?: '{SSHA}';
}

export function generate (password: string, options?: Options): string {
  if (password.indexOf('{PLAIN}') === 0) {
    password = password.substr(7);
  }
  if (options && options.ldap) {
    throw new Error('not implemented yet');
  } else {
    return sha256(password);
  }
}

export function verify (password: string, hashedPassword: string): boolean {
  if (!hashedPassword || !password) {
    return false;
  }
  if (hashedPassword.indexOf('{SSHA}') === 0) {
    // return LdapPassword.verifiy(hashedPassword, password);
    return false;
  } else {
    return sha256(password) === hashedPassword;
  }
}


export function isHashed (password: string): boolean {
  // return passwordHash.isHashed(password) || (password && password.indexOf('{SSHA}') === 0);
  return true;
}
