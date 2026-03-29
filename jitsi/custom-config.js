// TURN server for NAT traversal
config.p2p = {
    enabled: true,
    useStunTurn: true,
    stunServers: [
        { urls: "stun:204.168.189.51:3478" },
        { urls: "turn:204.168.189.51:3478", username: "jitsi", credential: "azurenexus2026turn" },
        { urls: "turn:204.168.189.51:3478?transport=tcp", username: "jitsi", credential: "azurenexus2026turn" }
    ],
    iceTransportPolicy: "all"
};
config.useStunTurn = true;
