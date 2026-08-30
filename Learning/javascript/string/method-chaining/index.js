/*
    method chaining = calling one method after another 
                        in one continuous line of code
*/
// -------------NO METHOD CHAINING------------

let userName = window.prompt("Enter your username");

// userName = userName.trim();
// let letter = userName.charAt(0);
// letter = letter.toUpperCase();

// let extraChars = userName.slice(1);

// userName = letter + extraChars;
// console.log(userName);

// -------------METHOD CHAINING------------
userName =
  userName.trim().charAt(0).toUpperCase() +
  userName.trim().slice(1).toLowerCase();

console.log(userName);;
