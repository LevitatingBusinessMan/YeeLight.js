const Client_ = require(__dirname)
const Client = new Client_()

Client.on("discovered", light => {
    light.toggle()
})

Client.Discover()
