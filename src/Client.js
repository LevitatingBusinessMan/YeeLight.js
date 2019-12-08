const EventEmitter = require("events")
const YeeLight = require(__dirname + "/YeeLight")

class Client extends EventEmitter {
    static YeeLight = YeeLight;
    server = require("dgram").createSocket("udp4");
    lights = new Array()

	constructor () {
		super()
		this.server.bind(1982, () => {
			this.server.setMulticastLoopback(false)
			this.server.addMembership("239.255.255.250")
		})

		this.server.on('message', (msg, rinfo) => {
			const id = YeeLight.getID(msg);
			
			//New light  
			if (!this.lights.find(l => l.id == id)) {
				const newLight = new YeeLight(msg)
				this.lights.push(newLight)
				this.emit("discovered", newLight)
			}
		});
	}
    
    Discover () {
		let message = "M-SEARCH * HTTP/1.1\r\n"
		message += "HOST: 239.255.255.250:1982\r\n"
		message += "MAN: \"ssdp:discover\"\r\n"
		message += "ST: wifi_bulb\r\n"
		
		this.server.send(message, 1982, "239.255.255.250")
	}
    
}

module.exports = Client