module.exports = (sessionId = "", chats = {}) => {
    return /* html */`
<html lang="it">
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="/base.css">
    <link rel="stylesheet" type="text/css" href="/chat/style.css">
    <title>Live chat ✨</title>
</head>
<body>
    <h1>Live chat</h1>
    <h3>Session ID: ${sessionId}</h3>

    <div class="hidden" id="session-id">${sessionId}</div>
    <div class="hidden" id="chats">${JSON.stringify(chats)}</div>
    
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="/chat/app.js"></script>
</body>
</html>
    `
}