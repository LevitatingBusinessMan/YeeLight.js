const EventEmitter = require("events")

class YeeLight extends EventEmitter {   
    lastCommand = 0
 
    constructor(msg) {
        super()
        const headers = YeeLight.parseHeaders(msg)
        Object.assign(this, headers)

        const location = this.Location.substring("yeelight://".length);
        this.ip = location.split(":")[0]
        this.port = location.split(":")[1]

        this.server = require("net").connect({port: this.port, host: this.ip})

        //Notification messages
        this.server.on("data", d => {
            d = JSON.parse(d)

            //Make sure this is a notification message
            if (d.method) {
                Object.assign(this, d.params)

                //Emit updated props
                this.emit("update", d.params)
            }
        })

        //this.server.on("connect", () => this.emit("connected"))
    }

    async setPower(value, ...params) {
        //Convert boolean
        if (value === true)
            value = "on"
        else if (value === false)
            value = "off"

        //Add power setting as first param
        params.unshift(value)

        return await this.Command("set_power", params)
        
    }

    async toggle() {
        return await this.Command("toggle")
    }

    Command (method, params=[]) {
        return new Promise ((resolve, reject) => {
            const id = this.lastCommand++

            const command = {id, method, params}
    
            this.server.once("data", d => {
                d = JSON.parse(d)

                if (d.id == id)
                    resolve(d)
                
            })
    
            this.server.write(JSON.stringify(command) + "\r\n")
        })
    }

    static parseHeaders (msg) {
        //Parse UDP message
        const lines = msg.toString().split("\r\n")
        const firstLine = lines.shift()
        
        const headers = new Object()

        lines.forEach(header => {
            const [name, value] = header.split(": ")
            headers[name] = value
        })

        return headers
    }

    static getID (msg) {
        //Get light ID from udp message
        return this.parseHeaders(msg).id
    }
}

module.exports = YeeLight

/*
NOTIFY * HTTP/1.1
Host: 239.255.255.250:1982
Cache-Control: max-age=3600
Location: yeelight://192.168.1.239:55443
NTS: ssdp:alive
Server: POSIX, UPnP/1.0 YGLC/1
id: 0x000000000015243f
model: color
fw_ver: 18
support: get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene
cron_add cron_get cron_del set_ct_abx set_rgb
power: on
bright: 100
color_mode: 2
ct: 4000
rgb: 16711680
hue: 100
sat: 35
name: my_bulb

HTTP/1.1 200 OK
Cache-Control: max-age=3600
Date:
Ext:
Location: yeelight://192.168.1.239:55443
Server: POSIX UPnP/1.0 YGLC/1
id: 0x000000000015243f
model: color
fw_ver: 18
support: get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene
cron_add cron_get cron_del set_ct_abx set_rgb
power: on
bright: 100
color_mode: 2
ct: 4000
rgb: 16711680
hue: 100
sat: 35
name: my_bulb
*/