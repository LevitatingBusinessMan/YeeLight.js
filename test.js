const Client_ = require(__dirname)
const Client = new Client_()

Client.on("discovered", light => {
    light.setPower("on").then(console.log)
    light.setBright("80").then(console.log)
})

Client.Discover()
