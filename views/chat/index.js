module.exports = (sessionId = "", chats = {}, sessionCreationTimestamp) => {
    return /* html */`
<html lang="it">
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="/base.css">
    <link rel="stylesheet" type="text/css" href="/chat/style.css">
    <link rel="icon" type="image/x-icon" href="/logo/small-rounded.png">
    <title>ImpressionCafé - Live chat</title>
</head>
<body>
    <div id="stop-recording-audio-input"></div>
    <div id="container">
        <div id="left-container">
            <div id="left-container-top">
                <div id="chats-title">Chats</div>

                <div id="chat-button-order">
                    <div class="chat-button active" id="chat-button-monet">
                        <div class="chat-button-left">
                            <img class="chat-button-img" src="${process.env.URL}chat/img/claude_monet.jpeg"/>
                        </div>
                        <div class="chat-button-right">
                            <div class="chat-button-name">Claude Monet</div>
                            <div class="chat-button-preview">Ultimo messaggio ora</div>
                        </div>
                    </div>
                    <div class="chat-button" id="chat-button-degas">
                        <div class="chat-button-left">
                            <img class="chat-button-img" src="${process.env.URL}chat/img/edgar_degas.jpeg"/>
                        </div>
                        <div class="chat-button-right">
                            <div class="chat-button-name">Edgar Degas</div>
                            <div class="chat-button-preview">Ultimo messaggio 1h fa</div>
                        </div>
                    </div>
                    <div class="chat-button" id="chat-button-seurat">
                        <div class="chat-button-left">
                            <img class="chat-button-img" src="${process.env.URL}chat/img/georges_seurat.jpeg"/>
                        </div>
                        <div class="chat-button-right">
                            <div class="chat-button-name">Georges Seurat</div>
                            <div class="chat-button-preview">Nessun messaggio</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="session-info">
                <div>Session ID:</div>
                <div id="session-info-id">${sessionId}</div>
                <div>Session created:</div>
                <div>${(new Date(sessionCreationTimestamp*1000).toLocaleDateString('it', { weekday:"short", year:"numeric", month:"short", day:"numeric"})).toUpperCase()}</div>
            </div>
        </div>
        <div id="right-container">
            <div class="chat-container active" id="chat-monet"></div>
            <div class="chat-container" id="chat-degas"></div>
            <div class="chat-container" id="chat-seurat"></div>

            <div id="chat-container-input">
                <input type="text" id="text-input"/>
                <div id="input-action">mic</div>
            </div>
        </div>
    </div>


    <div class="hidden" id="session-id">${sessionId}</div>
    <div class="hidden" id="chats">${JSON.stringify(chats)}</div>
    <div class="hidden" id="url">${process.env.URL}</div>
    
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="/chat/app.js"></script>
</body>
</html>
    `
}