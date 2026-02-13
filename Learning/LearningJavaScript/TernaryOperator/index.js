// ternary operator = a shortcut if{} and else{} statements
//                     helps to assign a variable based on condition
//                     condition ? codeIfTrue : codeIfFalse;

// let age = 21;
// let msg = age >= 18 ? "You're an adult" : "You're a minor";
// console.log(msg);

// let time = 16;
// let greeting = time < 12 ? "GoodMorning" : "Good Afternoon";
// console.log(greeting);

// let isStudent = true;
// let msg = isStudent ? "You are a student" : "You are not a student";
// console.log(msg);

let purchaseAmount = 10000;
let discount = purchaseAmount >= 100 ? 10 : 0;
console.log(
  `Your total is $${purchaseAmount - purchaseAmount * (discount / 100)}`
);
