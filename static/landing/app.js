const url = document.getElementById("url").innerText; document.getElementById("url").remove()


function openAssistSection(open = true) {
    if (open) document.getElementById("title-logo").classList.add("assist")
    else document.getElementById("title-logo").classList.remove("assist")

    if (open) document.getElementById("actions-bottom").classList.add("assist")
    else document.getElementById("actions-bottom").classList.remove("assist")

    if (open) document.getElementById("actions-top").classList.add("assist")
    else document.getElementById("actions-top").classList.remove("assist")

}

let clicked = false

document.getElementById("chat-now").addEventListener("click", () => {
    if (clicked)
        return
    clicked = true

    openNewChatSection()
})

async function openNewChatSection() {
    // let result = await fetch("/api/new-session", { method: 'POST' })

    // if (result.status !== 200)
    //     return console.error("openNewChatSection post error")

    // result = await result.json()

    let result = {
        sessionId: "WFv2BSSiTIwwfQDY7D2p",
    }

    document.getElementById("right-hidden-container").classList.add("newchat")
    document.getElementById("left-container").classList.add("newchat")
    document.getElementById("right-container").classList.add("newchat")

    setTimeout(() => window.location.href = "/chat/" + result.sessionId, 1000)
}

window.addEventListener("pageshow", (event) => {
    const historyTraversal = event.persisted || ( typeof window.performance != "undefined" && window.performance.navigation.type === 2 )
    if (historyTraversal) {
        // Handle page restore.
        document.getElementById("right-hidden-container").classList.remove("newchat")
        document.getElementById("left-container").classList.remove("newchat")
        document.getElementById("right-container").classList.remove("newchat")
        clicked = false
    }
})