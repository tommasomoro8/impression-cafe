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