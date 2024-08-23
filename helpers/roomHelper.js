const Room = require('../models/Room')

// const _findRoom = (name) => {
//     Room.find(roomName).then()
// }

const createRoom = async (roomName, callback) =>{
    let error
    let room
    try{
        room = await Room.create({name:roomName})
    }catch(err){
        error = err
        console.log('error al crear la sala', roomName)
    }
    callback(error, room)
}

module.exports = { createRoom }