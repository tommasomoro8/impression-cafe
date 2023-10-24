const url = document.getElementById("url").innerText; document.getElementById("url").remove()

function changeImg(num) {
    document.getElementById("img-bg").className = "changing"
    setTimeout(() => {
        document.getElementById("img-bg").src = `/landing/artworks/${num}.jpeg`
        document.getElementById("img-bg").style.animation = "idle 0s linear forwards"

        document.getElementById("chat-now").className = "img"+num
        document.getElementById("view-chat").className = "img"+num
        document.getElementById("view-chat-text").className = "img"+num
        setTimeout(() => {
            document.getElementById("img-bg").style.animation = "imgscale 15s linear forwards"
        }, 101)
        document.getElementById("img-bg").className = ""
    }, 1000)
}

changeImg(0)
let i = 1
setInterval(() => {
    if (i >= 3)
        i = 0
    changeImg(i)
    i++
}, 3000)