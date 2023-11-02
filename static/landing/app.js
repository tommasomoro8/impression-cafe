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
    document.getElementById("session-info-time").innerText = ((new Date()).toLocaleDateString('it', { weekday:"short", year:"numeric", month:"short", day:"numeric"})).toUpperCase()

    document.getElementById("right-hidden-container").classList.add("newchat")
    document.getElementById("left-container").classList.add("newchat")
    document.getElementById("right-container").classList.add("newchat")

    document.getElementById("title-logo").classList.add("newchat")
    document.getElementById("actions-bottom").classList.add("newchat")
    document.getElementById("actions-top").classList.add("newchat")
    setTimeout(() => {
        document.getElementById("show").style.display = "none"
        document.getElementById("show-later").style.display = "flex"

        setTimeout(() => {
            document.getElementById("show-later").classList.add("show")
        }, 50)
    }, 700)

    const dateBeforeApiCall = Date.now()

    let result = await fetch("/api/new-session", { method: 'POST' })

    if (result.status !== 200)
        return console.error("openNewChatSection post error")

    result = await result.json()

    document.getElementById("session-info-id").innerText = result.sessionId

    // let result = {
    //     sessionId: "DZJIg8i74j2QIsHLpQ7P",
    // }

    const dateAfterApiCall = Date.now()
    
    setTimeout(() => 
        window.location.href = "/chat/" + result.sessionId,
    1000 - (dateAfterApiCall - dateBeforeApiCall))
}

window.addEventListener("pageshow", (event) => {
    const historyTraversal = event.persisted || ( typeof window.performance != "undefined" && window.performance.navigation.type === 2 )
    if (historyTraversal) {
        // Handle page restore.
        document.getElementById("right-hidden-container").classList.remove("newchat")
        document.getElementById("left-container").classList.remove("newchat")
        document.getElementById("right-container").classList.remove("newchat")

        document.getElementById("show-later").classList.remove("show")
        document.getElementById("show").style.display = ""
        document.getElementById("show-later").style.display = "none"

        setTimeout(() => {
            document.getElementById("title-logo").classList.remove("newchat")
            document.getElementById("actions-bottom").classList.remove("newchat")
            document.getElementById("actions-top").classList.remove("newchat")
        }, 300)

        clicked = false
    }
})


let isOpenCredists = false

document.getElementById("actions-bottom-text").addEventListener("click", () => {
    openCredists(!isOpenCredists)
    isOpenCredists = !isOpenCredists
})

function openCredists(open = true) {
    if (open) {
        document.getElementById("title-logo").style.transition = "height 0.6s linear, opacity 0.5s cubic-bezier(0, 1.5, 1, 1)"
        document.getElementById("actions-top").style.transition = "height 1s linear, opacity 0.2s cubic-bezier(0, 1.5, 1, 1)"

        setTimeout(() => {
            document.getElementById("actions-top").classList.add("open-credits")
            document.getElementById("title-logo").classList.add("open-credits")
            document.getElementById("actions-bottom").classList.add("open-credits")
    
    
            document.getElementById("actions-bottom-text").classList.add("open-credits")
    
            document.getElementById("actions-bottom-text").innerText = "< Indietro"
    
    
            document.getElementById("actions-bottom-scroll-view").classList.add("open-credits")
    
            document.getElementById("actions-bottom-scroll-view").scrollTo(0, 0)
        }, 100)

    } else {
        document.getElementById("actions-top").classList.remove("open-credits")
        document.getElementById("title-logo").classList.remove("open-credits")
        document.getElementById("actions-bottom").classList.remove("open-credits")


        document.getElementById("actions-bottom-text").classList.remove("open-credits")

        document.getElementById("actions-bottom-text").innerText = "Crediti e Avvertenze"


        document.getElementById("actions-bottom-scroll-view").classList.remove("open-credits")

        // setTimeout(() => {
        //     document.getElementById("title-logo").style.transition = "height 1s cubic-bezier(0.075, 0.82, 0.165, 1), opacity 0.4s cubic-bezier(0.18, 1.09, 0.83, 1.01)"
        //     document.getElementById("actions-top").style.transition = "height 1s cubic-bezier(0.075, 0.82, 0.165, 1), opacity 0.4s cubic-bezier(0.18, 1.09, 0.83, 1.01)"
        // }, 200)
    }
}


function openLink(link) {
    window.open(link)
}