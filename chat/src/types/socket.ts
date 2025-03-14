export enum SocketEvents {
    Connect = 'connect',
    Disconnect = 'disconnect',
    ConnectError = 'connect_error',
    UsersUpdate = 'users:update',
    UserJoin = 'user:join',
    WebRTCOffer = 'webrtc:offer',
    WebRTCAnswer = 'webrtc:answer',
    WebRTCICECandidate = 'webrtc:icecandidate',
}