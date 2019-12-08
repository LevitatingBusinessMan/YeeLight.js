const EventEmitter = require("events")

class YeeLight extends EventEmitter {   
    lastCommand = 0
    listeners = {}
 
    constructor(msg) {
        super()
        const headers = YeeLight.parseHeaders(msg)
        Object.assign(this, headers)

        const location = this.Location.substring("yeelight://".length);
        this.ip = location.split(":")[0]
        this.port = location.split(":")[1]

        this.server = require("net").connect({port: this.port, host: this.ip})

        this.server.on("data", d => {
            d = JSON.parse(d)

            //Check if this is a notifaction message
            if (d.method) {
                Object.assign(this, d.params)

                //Emit updated props
                this.emit("update", d.params)
            }
            
            //Else response message
            else if (typeof d.id != "undefined") {
                if (this.listeners[d.id]) {
                    
                    //Run callback
                    this.listeners[d.id](d)

                    delete this.listeners[d.id]
                }
            }
        })
        this.server.on("close", console.log)
        this.server.on("error", console.error)
        this.server.on("close", hadError => this.emit("disconnected"))
    }

    async powerOn () {
        return await this.Command("set_power", ["on"])
    }

    async powerOff () {
        return await this.Command("set_power", ["off"])
    }

    async setPower (state, ...params) {
        //Convert boolean
        if (state === true)
            state = "on"
        else if (state === false)
            state = "off"

        //Add power setting as first param
        params.unshift(state)

        return await this.Command("set_power", params)
        
    }

    async toggle () {
        return await this.Command("toggle")
    }

    async setBright (brightness, ...params) {
        if (typeof brightness === "string")
            brightness = parseInt(brightness)

        params.unshift(brightness)

        return await this.Command("set_bright", params)
    }

    Command (method, params=[]) {
        return new Promise ((resolve, reject) => {
            const id = this.lastCommand++

            const command = {id, method, params}
    
            //Add to response listeners
            this.listeners[id] = resolve

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
