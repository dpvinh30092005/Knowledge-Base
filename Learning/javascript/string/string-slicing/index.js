// String slicing = creating a substring from a portion of
//another string
// string.slice(start, end)

// const fullName = "Zjt Code";
// let firstName = fullName.slice(0, 3);
// let lastName = fullName.slice(4, 8);
// let firstChar = fullName.slice(0, 1);
// let lastChar = fullName.slice(-1);

// let firstName = fullName.slice(0, fullName.indexOf(" "));
// let lastName = fullName.slice(fullName.indexOf(" ") + 1);
// console.log(firstName);
// console.log(lastName);
// console.log(firstChar);
// console.log(lastChar);

const email = "dpvinh@gmail.com";

let userName = email.slice(0, email.indexOf("@"))
let extension = email.slice (email.indexOf("@") + 1)
console.log(userName);
console.log(extension);