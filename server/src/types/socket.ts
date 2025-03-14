export enum SocketEvents {
    Connection = 'connection',
    UserJoin = 'user:join',
    Disconnect = 'disconnect',
    UsersUpdate = 'users:update',
    WebRTCOffer = 'webrtc:offer',
    WebRTCAnswer = 'webrtc:answer',
    WebRTCICECandidate = 'webrtc:icecandidate',
}
