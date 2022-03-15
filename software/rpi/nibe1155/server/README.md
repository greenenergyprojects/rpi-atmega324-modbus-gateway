# Server

This server is running on Node.js javascript VM and programmed in Typescript.

## Start of server

All preparations must be done before starting the server!

### Start for remote-debugging

`pi@rpi:~/..../server $ nodemon --inspect=0.0.0.0:9229 --inspect-brk=0.0.0.0:9229 dist/main.js`

### Start from shell

You can use the tool [screen](https://wiki.debian.org/screen) for a session based start.

```
pi@rpi:~/prj $ cd server
pi@rpi:~/prj/server $ npm intsall --prod
pi@rpi:~/prj/server $ npm build
pi@rpi:~/prj/server $ npm start
```

### Start as system service

Create a systemd service file in `/etc/systemd/system/`.

For example: file `/etc/systemd/system/server.service`

```
[Unit]
Description=Node.js program 
After=syslog.target
After=network.target
After=local-fs.target

[Service]
#Type=oneshot
#RemainAfterExit=yes
Type=simple
ExecStart=/usr/bin/node /usr/share/server/dist/main.js
ExecStop=/etc/init.d/nfs-common stop
WorkingDirectory=/home/pi
User=pi
Group=pi

[Install]
WantedBy=multi-user.target

```

Now create the `/usr/share/server` and copy the dist folder of the project to this directory.

Now you can use the following commands:

| `systemctl daemon-reload` | reload the systemd configuration |
| `systemctl start server` | start the server  |
| `systemctl stop server` | start the server  |
| `systemctl status server` | show what's going on |
| `systemctl enable server.service` | activate automatic start of server on system startup |
| `systemctl disable server.service` | deactivate automatic start of server on system startup |
| `journalctl -f -u server.service` | print out stdout/stderr output of server  |


## Preparations

### Installing


### File config.json

Create a config.json file like this one in the server directory.

Up to raspberry 2 boards `dev/ttyAMA0` can be used for serial device. For raspberry 3 use `/dev/ttyS0`.

```
{
    "modbus": {
        "device": "/dev/ttyS0",
        "baudrate": 115200
    },
    "git": false,
    "debug": {
        "depth": 3,
        "colors" : true,
        "wtimediff": 6,
        "time": "ddd, yyyy-mm-dd HH:MM:ss.l",
        "wmodule": 15,
        "wlevel": 6,
        "location": "-*",
        "enabled": "*::WARN, *::INFO"
    },
    "shutdownMillis": 3000
}

```


