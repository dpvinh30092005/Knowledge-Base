//RANDOM NUMBER GENERATOR



// const min = 50;
// const max = 100;

// let randomNum = Math.floor(Math.random() * max) + min;
// console.log(randomNum);


const myButton = document.getElementById("myBtn");
const myLabel = document.getElementById("myLabel")
const min = 50;
const max = 100;
let randomNum;

myButton.onclick = function () {
    randomNum = Math.floor(Math.random() * max) + min;
    myLabel.textContent = randomNum;
}