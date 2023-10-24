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
            <div id="actions">
                <!--div id="right-container-text">Inizia ora</div-->
                <div id="right-container-desc">
                    Conosci gli autori impressionisti del Ottocento. Inizia subito creando una nuova chat o accendendo a una creata in precedenza!
                </div>
                <div id="chat-now">Nuova chat</div>
                <div id="view-chat">
                    <span id="view-chat-text">Assisti a una chat</span>
                </div>
            </div>
        </div>
    </div>

    <div class="hidden" id="url">${process.env.URL}</div>
    
    <script src="/landing/app.js"></script>
</body>
</html>
    `
}

// riaggiungi loop su video