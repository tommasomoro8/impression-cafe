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
    <title>ImpressionChat</title>
</head>
<body>
    <div id="container">
        <div id="left-container">
            <!--div id="left-container-text">Parla con monet</div-->
            <img id="img-bg" src="/landing/artworks/0.jpeg"/>
        </div>
        <div id="right-container">
            <div>Inizia ora</div>
            <div>Inizia ora</div>
            <div id="chat-now" class="img0">Chatta ora</div>
            <div id="view-chat" class="img0">
                <span id="view-chat-text" class="img0">Assisti a una chat</span>
            </div>
        </div>
    </div>

    <div class="hidden" id="url">${process.env.URL}</div>
    
    <script src="/landing/app.js"></script>
</body>
</html>
    `
}