const url = document.getElementById("url").innerText; document.getElementById("url").remove()
const sessionId = document.getElementById("session-id").innerText; document.getElementById("session-id").remove()
const chats = JSON.parse(document.getElementById("chats").innerText); document.getElementById("chats").remove()
const writePermissionPassword = document.getElementById("wpp").innerText; document.getElementById("wpp").remove()

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
        id: "seurat",
        view: document.getElementById("chat-seurat"),
        button: document.getElementById("chat-button-seurat"),
        lastMessageTimestamp: -3,
        buttonPreviewInterval: undefined
    }
]

const socket = io("/chat", { query: `sessionId=${sessionId}` })

let botResponse
let hallo = false

socket.on("chat", chat => {
    const authorContainer = document.getElementById(chat.authorId)
    if (chat.status == "input") {

        const userResponse = document.createElement("div")
        userResponse.className = "message user-message"
        userResponse.innerText = chat.audioTranscription
        authorContainer.append(userResponse)

        const userAudio = document.createElement("div")
        userAudio.className = "message user-audio"
            const userAudioElement = document.createElement("audio")
            userAudioElement.controls = true
                const userAudioSourceElement = document.createElement("source")
                userAudioSourceElement.src = url + "audio/" + sessionId + "/" + chat.audioId
                userAudioSourceElement.type = "audio/wav"
                userAudioElement.append(userAudioSourceElement)
            userAudio.append(userAudioElement)
        authorContainer.append(userAudio)

    } else if (chat.status == "start-output-stream") {

        botResponse = document.createElement("div")
        botResponse.className = "message bot-message"
        authorContainer.append(botResponse)

    } else if (chat.status == "output-audio-stream") {

        const botAudio = document.createElement("div")
        botAudio.className = "message bot-audio"
            const botAudioElement = document.createElement("audio")
            botAudioElement.controls = true
                const botAudioSourceElement = document.createElement("source")
                botAudioSourceElement.src = chat.content
                botAudioSourceElement.type = "audio/mp3"
                botAudioElement.append(botAudioSourceElement)
                botAudio.append(botAudioElement)
        authorContainer.append(botAudio)

        if (!hallo) {
            hallo = true

            botAudioElement.play()

        }

    } else if (chat.status == "output-text-stream") {
        const scrollBefore = authorContainer.clientHeight + authorContainer.scrollTop === authorContainer.scrollHeight

        botResponse.innerText += chat.content

        if (scrollBefore)
            authorContainer.scrollTo(0, authorContainer.scrollHeight)


    }




    if (chat.status !== "output-text-stream") {

        chatAuthors[findIndexOfAuthor(chat.authorId.split("-")[1])].lastMessageTimestamp = chat.timestamp
        rearrangeChatList()

    }

})

for (const [key, value] of Object.entries(chats)) {
    const authorContainer = document.getElementById(key)
    for (let i = 0; i < value.length; i++) {
        if (value[i].role == "user") {
            const userResponse = document.createElement("div")
            userResponse.className = "message user-message"
            userResponse.innerText = value[i].content
            authorContainer.append(userResponse)
    
            const userAudio = document.createElement("div")
            userAudio.className = "message user-audio"
                const userAudioElement = document.createElement("audio")
                userAudioElement.controls = true
                    const userAudioSourceElement = document.createElement("source")
                    userAudioSourceElement.src = url + "audio/" + sessionId + "/" + value[i].audioId
                    userAudioSourceElement.type = "audio/wav"
                    userAudioElement.append(userAudioSourceElement)
                userAudio.append(userAudioElement)
            authorContainer.append(userAudio)
        } else {
            const botResponse = document.createElement("div")
            botResponse.className = "message bot-message"
            botResponse.innerText = value[i].content
            authorContainer.append(botResponse)
    
            const botAudio = document.createElement("div")
            botAudio.className = "message bot-audio"
                const botAudioElement = document.createElement("audio")
                botAudioElement.controls = true
                    const botAudioSourceElement = document.createElement("source")
                    botAudioSourceElement.src = url + "audio/" + sessionId + "/" + value[i].audioId
                    botAudioSourceElement.type = "audio/mp3"
                    botAudioElement.append(botAudioSourceElement)
                    botAudio.append(botAudioElement)
            authorContainer.append(botAudio)
        }

        if (i == value.length-1) {
            chatAuthors[findIndexOfAuthor(key.split("-")[1])].lastMessageTimestamp = value[i].timestamp
            rearrangeChatList()
            authorContainer.scrollTo(0, authorContainer.scrollHeight)
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

if (!firstCall)
    rearrangeChatList()






let inputMode = "mic" // "send"
const inputAction = document.getElementById("input-action")
const textInput = document.getElementById("text-input")
let isRecording = false
const stopRecording = document.getElementById("stop-recording-audio-input")

addEventListener("keypress", (e) => {
    if (e.key === "Enter" && inputMode == "send" && textInput.value)
        send()
})

inputAction.addEventListener("touchstart", () => {
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
    micToSend()
})

textInput.addEventListener("blur", () => {
    if (!textInput.value)
        sendToMic()
})

async function send() {
    const value = textInput.value

    textInput.value = ""

    const formData = new FormData()
    formData.append("inputText", value)
    
    const myHeaders = new Headers();
    myHeaders.append("writepermissionpassword", writePermissionPassword)
    
    let result = await fetch(url + "api/" + sessionId + "/new-chat/chat-" + selectedAuthor + "?input=text", {
        method: 'post',
        headers: myHeaders,
        body: formData,
        redirect: 'follow'
    })
    
    console.log(result)
    const responsejson = await result.json()
    console.log(responsejson)
}


function micToSend() {
    document.getElementById("input-action").innerText = "send"
    inputMode = "send"
}

function sendToMic() {
    document.getElementById("input-action").innerText = "start rec"
    inputMode = "mic"
}

let mediaRecorder
let audioChunks = []


function startRecording() {
    isRecording = true
    stopRecording.classList.add("active")

    document.getElementById("input-action").innerText = "stop rec"

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

        document.getElementById("input-action").innerText = "loading"
    }
}



async function sendAudioDataToServer(audioBlob) {
    const formData = new FormData()
    formData.append("audio", audioBlob, "test.wav")

    const myHeaders = new Headers();
    myHeaders.append("writepermissionpassword", writePermissionPassword)

    let result  = await fetch(url + "api/" + sessionId + "/new-chat/chat-" + selectedAuthor, {
        method: 'post',
        headers: myHeaders,
        body: formData,
        redirect: 'follow'
    })
    
    console.log(result)
    const responsejson = await result.json()
    console.log(responsejson)

    // const userResponse = document.createElement("div")
    // userResponse.className = "message user-message"
    // userResponse.innerText = responsejson.audioTranscription
    // document.getElementById("chat-monet").append(userResponse)

    // const userAudio = document.createElement("div")
    // userAudio.className = "message user-audio"
    //     const userAudioElement = document.createElement("audio")
    //     userAudioElement.controls = true
    //         const userAudioSourceElement = document.createElement("source")
    //         userAudioSourceElement.src = "http://localhost:3000/audio/" + sessionId + "/" + responsejson.audioId
    //         userAudioSourceElement.type = "audio/wav"
    //         userAudioElement.append(userAudioSourceElement)
    //     userAudio.append(userAudioElement)
    // document.getElementById("chat-monet").append(userAudio)

    // const botResponse = document.createElement("div")
    // botResponse.className = "message bot-message"
    // botResponse.innerText = responsejson.response
    // document.getElementById("chat-monet").append(botResponse)

    // const botAudio = document.createElement("div")
    // botAudio.className = "message bot-audio"
    //     const botAudioElement = document.createElement("audio")
    //     botAudioElement.controls = true
    //         const botAudioSourceElement = document.createElement("source")
    //         botAudioSourceElement.src = "http://localhost:3000/audio/" + sessionId + "/" + responsejson.assistantAudioId
    //         botAudioSourceElement.type = "audio/wav"
    //         botAudioElement.append(botAudioSourceElement)
    //         botAudio.append(botAudioElement)
    // document.getElementById("chat-monet").append(botAudio)

    // botAudioElement.play()
}



chatAuthors[0].button.click()

socket.on("chat", chat => {
    console.log(chat)
})