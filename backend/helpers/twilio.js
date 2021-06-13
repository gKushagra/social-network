require('dotenv').config();

/**
 * method creates a new
 * room instance
 * @returns Promise
 */
const createRoom = () => {
    const client = require('twilio')(process.env.tSid, process.env.tToken);

    return client.video.rooms.create({ type: 'go', maxParticipants: 2 })
        .then(room => {
            return room
        });
}

const completeRoom = (roomId) => {
    const client = require('twilio')(process.env.tSid, process.env.tToken);

    return client.video.rooms(roomId)
        .update({ status: 'completed' })
        .then(room => {
            return room
        });
}

/**
 * method creates a new access token
 * to consume
 * @param {*} room 
 * @param {*} user 
 * @returns access token
 */
const genAccessToken = (room, user) => {
    console.log(room, user);
    const AccessToken = require('twilio').jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const videoGrant = new VideoGrant({
        room: room
    });

    const token = new AccessToken(
        process.env.tSid,
        process.env.tKey,
        process.env.tSecret,
        { identity: user }
    );

    token.addGrant(videoGrant);
    console.log(token.toJwt());
    return token.toJwt();
}

module.exports = {
    createRoom,
    genAccessToken,
    completeRoom,
}