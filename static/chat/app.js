const url = document.getElementById("url").innerText; document.getElementById("url").remove()
const sessionId = document.getElementById("session-id").innerText; document.getElementById("session-id").remove()
const chats = JSON.parse(document.getElementById("chats").innerText); document.getElementById("chats").remove()
const writePermissionPassword = document.getElementById("wpp").innerText; document.getElementById("wpp").remove()

let TEMPDATA

if (writePermissionPassword)
    activeChatting()

let firstCall = false

let selectedAuthor = ""

const dividers = [1, 1000, 60, 60, 24, 30, 12]
const dividersName = ["now", "s", "m", "h", "g", "m", "a"]

function seeTimeDifference(time, returnMs = false) {
    const now = new Date().getTime()
    const message = new Date(time*1000).getTime()

    let value = now - message

    if (returnMs)
        return value

    for (let i = 0; i < dividers.length; i++) {
        if (value/dividers[i] < 1) {
            return {
                value,
                measureOfTime: dividersName[i-1],
                measureOfTimeNum: i-1,
                nowDate: now,
                messageDate: message,
            }
        }
        value = value/dividers[i]
    }

    return {
        value,
        measureOfTime: dividersName[dividers.length-1],
        measureOfTimeNum: dividers.length-1,
        nowDate: now,
        messageDate: message,
    }
}


const chatAuthors = [
    {
        id: "monet",
        view: document.getElementById("chat-monet"),
        button: document.getElementById("chat-button-monet"),
        lastMessageTimestamp: -1,
        buttonPreviewInterval: undefined
    },
    {
        id: "degas",
        view: document.getElementById("chat-degas"),
        button: document.getElementById("chat-button-degas"),
        lastMessageTimestamp: -2,
        buttonPreviewInterval: undefined
    },
    {
        id: "renoir",
        view: document.getElementById("chat-renoir"),
        button: document.getElementById("chat-button-renoir"),
        lastMessageTimestamp: -3,
        buttonPreviewInterval: undefined
    },
    {
        id: "manet",
        view: document.getElementById("chat-manet"),
        button: document.getElementById("chat-button-manet"),
        lastMessageTimestamp: -4,
        buttonPreviewInterval: undefined
    }
]

function appendUserMessage(text = "", authorId) {
    const authorContainer = document.getElementById(authorId)

    const userResponse = document.createElement("div")
    userResponse.className = "message user-message"
    userResponse.innerText = text
    authorContainer.append(userResponse)

    return userResponse
}

function appendUserAudio(link, authorId) {
    const authorContainer = document.getElementById(authorId)

    const userAudio = document.createElement("div")
    userAudio.className = "message user-audio"
        const userAudioElement = document.createElement("audio")
        userAudioElement.controls = true
            const userAudioSourceElement = document.createElement("source")
            userAudioSourceElement.src = link
            userAudioSourceElement.type = "audio/wav"
            userAudioElement.append(userAudioSourceElement)
        userAudio.append(userAudioElement)
    authorContainer.append(userAudio)

    return userAudioElement
}

function appendBotMessage(text = "", authorId) {
    const authorContainer = document.getElementById(authorId)

    const botResponse = document.createElement("div")
    botResponse.className = "message bot-message"
    botResponse.innerText = text
    authorContainer.append(botResponse)

    return botResponse
}

function appendBotAudio(link, authorId) {
    const authorContainer = document.getElementById(authorId)

    const botAudio = document.createElement("div")
    botAudio.className = "message bot-audio"
        const botAudioElement = document.createElement("audio")
        botAudioElement.controls = true
            const botAudioSourceElement = document.createElement("source")
            botAudioSourceElement.src = link
            botAudioSourceElement.type = "audio/mp3"
            botAudioElement.append(botAudioSourceElement)
            botAudio.append(botAudioElement)
    authorContainer.append(botAudio)
    
    return botAudioElement
}

function addSpaceBeforeNumbers(inputString) {
    return inputString.replace(/(\D)(?=\d)/g, '$1 ');
}

const socket = io("/chat", { query: `sessionId=${sessionId}` })

let botResponse
let hallo = false

socket.on("chat", chat => {
    const authorContainer = document.getElementById(chat.authorId)
    const scrollBefore = authorContainer.clientHeight + authorContainer.scrollTop === authorContainer.scrollHeight

    if (chat.status == "input") {
        appendUserMessage(chat.audioTranscription, chat.authorId)
        if (chat.audioId)
            appendUserAudio(url + "audio/" + sessionId + "/" + chat.audioId, chat.authorId)
    } else if (chat.status == "start-output-stream") {
        botResponse = appendBotMessage("", chat.authorId)
    } else if (chat.status == "output-audio-stream") {
        let botAudioElement
        if (chat.audioId)
            botAudioElement = appendBotAudio(url + "audio/" + sessionId + "/" + chat.audioId, chat.authorId)

        if (chat.audioId && chat.audioOrder === 0) {
            console.log(Date.now() - TEMPDATA)
        }

        if (!hallo) {
            hallo = true
            // if (chat.audioId)
            //     botAudioElement.play()
        }
    } else if (chat.status == "output-text-stream") {

        botResponse.innerText += chat.content
        botResponse.innerText = addSpaceBeforeNumbers(botResponse.innerText)

    }

    if (chat.status !== "output-text-stream") {
        chatAuthors[findIndexOfAuthor(chat.authorId.split("-")[1])].lastMessageTimestamp = chat.timestamp
        rearrangeChatList()
    }
    
    if (scrollBefore)
            authorContainer.scrollTo(0, authorContainer.scrollHeight)
})

for (const [key, value] of Object.entries(chats)) {
    for (let i = 0; i < value.length; i++) {
        if (value[i].role == "user") {
            appendUserMessage(value[i].content, key)
            if (value[i].audioId)
                appendUserAudio(url + "audio/" + sessionId + "/" + value[i].audioId, key)
        } else {
            appendBotMessage(value[i].content, key)
            if (value[i].audioId)
                appendBotAudio(url + "audio/" + sessionId + "/" + value[i].audioId, key)
        }

        if (i == value.length-1) {
            chatAuthors[findIndexOfAuthor(key.split("-")[1])].lastMessageTimestamp = value[i].timestamp
            rearrangeChatList()
            document.getElementById(key).scrollTo(0, document.getElementById(key).scrollHeight)
            firstCall = true
        }
    }
}

function findIndexOfAuthor(authorId) {
    for (let i = 0; i < chatAuthors.length; i++)
        if (authorId == chatAuthors[i].id)
            return i
}

for (let i = 0; i < chatAuthors.length; i++) {
    const a = chatAuthors[i]

    a.button.addEventListener("click", () => {
        a.button.classList.add("active")
        a.view.classList.add("active")
        for (let j = 0; j < chatAuthors.length; j++) {
            if (chatAuthors[j].id !== a.id) {
                chatAuthors[j].button.classList.remove("active")
                chatAuthors[j].view.classList.remove("active")
            } else {
                selectedAuthor = chatAuthors[j].id
            }
        }
        a.view.scrollTo(0, a.view.scrollHeight)
    })
}

function displayTimeDifference(chatAuthor, chatButtonPreview) {
    if (!chatAuthor.lastMessageTimestamp || chatAuthor.lastMessageTimestamp <= 0) {
        chatButtonPreview.innerText = "Nessun messaggio"
    } else {
        const a = seeTimeDifference(chatAuthor.lastMessageTimestamp)
        if (a.measureOfTimeNum === 0 || a.measureOfTimeNum === 1)
            chatButtonPreview.innerText = "Ultimo messaggio ora"
        else
            chatButtonPreview.innerText = `Ultimo messaggio ${parseInt(a.value)}${a.measureOfTime} fa`
    } 
}

function rearrangeChatList() {
    chatAuthors.sort((a, b) => {
        if (a.lastMessageTimestamp < b.lastMessageTimestamp) return 1
        if (a.lastMessageTimestamp > b.lastMessageTimestamp) return -1
        return 0
    })

    for (let i = 0; i < chatAuthors.length; i++) {
        chatAuthors[i].button.style.transform = `translate(0, ${i*80}px)`

        displayTimeDifference(chatAuthors[i], chatAuthors[i].button.childNodes[3].childNodes[3])

        clearInterval(chatAuthors[i].buttonPreviewInterval)

        chatAuthors[i].buttonPreviewInterval = setInterval(() => {
            displayTimeDifference(chatAuthors[i], chatAuthors[i].button.childNodes[3].childNodes[3])
        }, 1000)
    }
}

function activeChatting() {
    const chatContainers = document.getElementsByClassName("chat-container")
    for (let i = 0; i < chatContainers.length; i++) {
        chatContainers[i].classList.add("chatting-active")
        chatContainers[i].scrollTo(0, chatContainers[i].scrollHeight)
    }

    document.getElementById("chat-container-input").classList.add("chatting-active")
}

if (!firstCall) {
    rearrangeChatList()
}









const inputAction = document.getElementById("input-action")
const inputActionImg = document.getElementById("input-action-img")
const textInput = document.getElementById("text-input")
const stopRecording = document.getElementById("stop-recording-audio-input")

let inputMode = "mic" // "send" - "loading"
let isRecording = false

function selectInputActionState(mode) {
    switch (mode) {
        case "send":
            inputActionImg.src = url + "chat/img/send.png"
            inputActionImg.className = "send"
            break;
        case "mic":
            inputActionImg.src = url + "chat/img/mic.png"
            inputActionImg.className = "mic"
            break;
        case "loading":
            inputActionImg.className = "loading"
            inputActionImg.src = url + "chat/img/loading.svg"
            break;
    }
}


function openAudioModal(open = true) {
    if (open) {
        document.getElementById("audio-input").classList.add("show")
        document.getElementById("text-input").classList.add("hide")
    } else {
        document.getElementById("audio-input").classList.remove("show")
        document.getElementById("text-input").classList.remove("hide")
    }
}

openAudioModal()




document.onkeydown = (e) => {
    if (e.key == "Enter" && inputMode == "send" && textInput.value) {
        send()
    } else if (e.key != "Enter" && inputMode != "loading") {
        setTimeout(() => {
            if (!textInput.value) {
                sendToMic()
            } else {
                micToSend()
            }
        }, 10)
    }
}



inputAction.addEventListener("touchstart", () => {
    if (inputMode == "loading")
        return

    if (inputMode == "send")
        return send()

    setTimeout(() => {
        if (!textInput.value)
            startRecording()
    }, 50)
})

stopRecording.addEventListener("touchend", endRecording)


inputAction.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || e.sourceCapabilities.firesTouchEvents)
        return

    if (inputMode == "loading")
        return

    if (inputMode == "send")
        return send()

    setTimeout(() => {
        if (!textInput.value)
            startRecording()
    }, 50)
})
stopRecording.addEventListener("mouseup", (e) => {
    if (e.button !== 0 || e.sourceCapabilities.firesTouchEvents)
        return

    endRecording()
})



textInput.addEventListener("focus", () => {
    if (inputMode == "loading")
        return

    if (textInput.value)
        micToSend()
})

textInput.addEventListener("blur", () => {
    if (inputMode == "loading")
        return

    if (!textInput.value)
        sendToMic()
})


async function send() {
    const value = textInput.value

    textInput.value = ""

    const formData = new FormData()
    formData.append("inputText", value)
    
    const myHeaders = new Headers()
    myHeaders.append("writepermissionpassword", writePermissionPassword)

    TEMPDATA = Date.now()

    inputMode = "loading"
    selectInputActionState("loading")
    
    let result = await fetch(url + "api/" + sessionId + "/new-chat/chat-" + selectedAuthor + "?input=text", {
        method: 'post',
        headers: myHeaders,
        body: formData,
        redirect: 'follow'
    })
    
    console.log(result)
    const responsejson = await result.json()
    console.log(responsejson)

    inputMode = textInput.value ? "send" : "mic"
    selectInputActionState(textInput.value ? "send" : "mic")
}


function micToSend() {
    selectInputActionState("send")
    inputMode = "send"
}

function sendToMic() {
    selectInputActionState("mic")
    inputMode = "mic"
}

let mediaRecorder
let audioChunks = []


function startRecording() {
    isRecording = true
    stopRecording.classList.add("active")

    // document.getElementById("input-action").innerText = "stop rec"

    console.warn("start recording")

    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
            mediaRecorder = new MediaRecorder(stream)

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0)
                    audioChunks.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/wav" })

                sendAudioDataToServer(audioBlob)

                audioChunks = []
            }

            mediaRecorder.start()
        })
        .catch((err) => {
            console.error("Error accessing the microphone: " + err);
        })
}

function endRecording() {
    if (!isRecording)
        return
    
    isRecording = false
    stopRecording.classList.remove("active")

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop()

        selectInputActionState("loading")
    }
}



async function sendAudioDataToServer(audioBlob) {
    const formData = new FormData()
    formData.append("audio", audioBlob, "test.wav")

    const myHeaders = new Headers();
    myHeaders.append("writepermissionpassword", writePermissionPassword)

    console.warn("stop recording")

    inputMode = "loading"
    selectInputActionState("loading")

    let result  = await fetch(url + "api/" + sessionId + "/new-chat/chat-" + selectedAuthor, {
        method: 'post',
        headers: myHeaders,
        body: formData,
        redirect: 'follow'
    })
    
    try {
        const responsejson = await result.json()
        console.log(responsejson)
    } catch (error) {
        console.log(result)
    }

    inputMode = textInput.value ? "send" : "mic"
    selectInputActionState(textInput.value ? "send" : "mic")
}






chatAuthors[0].button.click()

let audioQueue = {}
let previusAudioOrder = -1
let previusAudio
let previusAudioElement

socket.on("chat", chat => {
    if (chat.status == "input") {
        audioQueue = {}
        previusAudio = undefined
        previusAudioElement = undefined
        previusAudioOrder = -1
    } else if (chat.status === "output-audio-stream") {
        audioQueue[chat.audioOrder] = chat.binaryAudio
        console.log(audioQueue)

        while (chat.audioOrder-1 === previusAudioOrder || audioQueue[previusAudioOrder+1] !== undefined) {
            // const thisChat = audioQueue[previusAudioOrder+1]
            // const previusChat = audioQueue[previusAudioOrder]

            const blob = new Blob((Object.keys(audioQueue).map(key => audioQueue[key])).splice(0, previusAudioOrder+2), { type: "audio/wav" })


            const botAudio = document.createElement("div")
            botAudio.className = "message bot-audio"
                const audioElement = document.createElement("audio")
                audioElement.controls = true
                    const botAudioSourceElement = document.createElement("source")
                    botAudioSourceElement.src = window.URL.createObjectURL(blob)
                    botAudioSourceElement.type = "audio/mp3"
                audioElement.append(botAudioSourceElement)
            botAudio.append(audioElement)
            document.getElementById(chat.authorId).append(botAudio)



            if (previusAudioElement) {
                audioElement.currentTime = previusAudioElement.currentTime
                if (!previusAudioElement.paused)
                    audioElement.play()
                previusAudio.remove()
            } else {
                audioElement.play()
            }
            
            previusAudio = botAudio
            previusAudioElement = audioElement
            previusAudioOrder++
        }
    }
})