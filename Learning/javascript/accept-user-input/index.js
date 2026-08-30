// How to accept user input



// 1. Easy way = window prompt
// 2. Profession way  = html text box

// let userName;
// userName = window.prompt("What's yours username?")
// console.log(userName);


let username;
document.getElementById("mySubmit").onclick = function(){
    username = document.getElementById("myText").value;
    document.getElementById("myH1").textContent = `Hello ${username}`
}