# Server key

```bash
openssl genrsa > server-key.pem
openssl rsa -in server-key.pem -pubout -out server-pubkey.pem
```
