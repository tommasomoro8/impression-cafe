module.exports = () => {
    return /* html */`
<html lang="it">
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="/base.css">
    <link rel="stylesheet" type="text/css" href="/landing/style.css">
    <link rel="icon" type="image/x-icon" href="/logo/small-rounded.png">
    <title>ImpressionCafé</title>
</head>
<body>
    <div id="container">
        <div id="left-container">
            <video autoplay muted>
                <source src="/landing/video/test.mp4" type="video/mp4">
            </video>
        </div>
        <div id="right-container">
            <span id="show">
                <div id="title-logo">
                    <div id="title">ImpressionCafé</div>
                </div>
                <div id="actions-top">
                    <div id="chat-now">Nuova chat</div>
                    <div id="view-chat">
                        <span id="view-chat-text">Assisti a una chat</span>
                    </div>
                </div>
                <div id="actions-bottom">
                    <div id="recognitions">Riconoscimenti</div>
                    &nbsp|&nbsp
                    <div id="disclaimer">Disclaimer</div>
                </div>
            </span>
            <span id="show-later">
                <div id="left-container-top">
                    <div id="chats-title">Chats</div>

                    <div id="chat-button-order">
                        <div class="chat-button ">
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
                    <div id="session-info-id"></div>
                    <div>Session created:</div>
                    <div id="session-info-time"></div>
                </div>
            </span>
        </div>
        <div id="right-hidden-container"></div>
    </div>

    <div class="hidden" id="url">${process.env.URL}</div>
    
    <script src="/landing/app.js"></script>
</body>
</html>
    `
}

// riaggiungi loop su video