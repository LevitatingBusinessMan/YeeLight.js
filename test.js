const Client = require(__dirname + "/src/Client")

Client.Discover(light => {
    light.on()
})
