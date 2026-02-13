// IF STATEMENT = if a condition is true, execute some code
// if not , do something else

const myAge = document.getElementById("myText");0
const mySubmit = document.getElementById("mySubmit");
const result = document.getElementById("myResult");

let age;

mySubmit.onclick = function() {
    age = myAge.value;
    age = Number(age)
    if (age >= 18) {
        result.textContent = "You are welcome!!"
    }
    else if (age == 0) {
        result.textContent = "You was just born!!!"
    }
    else {
        result.textContent = "You cook!!!"
    }
}


















    // let age = 0;
// let sex = "male";
// if (age >= 18) {
//     console.log("You are welcome");
// }
// else if (sex == "female") {
//     console.log("You are welcome");
    
// }
// else {
//     console.log("You cook");
    
// }


// let age = 1;

// if (age >= 18) {
//     console.log("You are welcome");
// }else {
//     console.log("You cook");
// }

// let time = 9;
// if (time < 12) {
//     console.log("Good morning!");
// }else {
//     console.log("Good afternoon!");
// }

// let isStudent = false;
// if (isStudent) {
//     console.log("You are a student !");
// }else {
//     console.log("You are NOT a student !");
// }


// let age = window.prompt("How old are you?");
// age = Number(age);
// let hasLicense = window.prompt("DO YOU HAVE LICENSE?");
// hasLicense = Boolean(hasLicense)
// if (age >= 16) {
//     console.log("You are old enough to drive");

//     if (hasLicense) {
//         console.log("You have your License");

//     }else {
//         console.log("You do not have your license, yet!");
        
//     }
// }
// else { console.log("You must be 16+ to have a license"); }




