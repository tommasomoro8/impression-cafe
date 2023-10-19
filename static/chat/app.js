
const chats = JSON.parse(document.getElementById("chats").innerText); document.getElementById("chats").remove()

console.log(chats)

const sessionId = document.getElementById("session-id").innerText; document.getElementById("session-id").remove()

const socket = io("/chat", { query: `sessionId=${sessionId}` })

socket.on("chat", chat => {
    console.log(chat)
})