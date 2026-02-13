// type conversion = change the datatype of a value to another
            //(strings, numbers, booleans)


// let age = window.prompt("How old are u");

// age = Number(age);
// age+=1;
// console.log(age, typeof age);



// let x, y,z;

// // x = "pizza";
// // y = "pizza";
// // z = "pizza";

// x = "0";
// y = "0";
// z = "0";


// x = Number(x);
// y = String(y);
// z = Boolean(z);

// console.log(x, typeof x);
// console.log(y, typeof y);
// console.log(z, typeof z);



document.getElementById("mySubmit").onclick = function() {
    let x = document.getElementById("myText").value;
    x = Number(x);
    console.log(x, typeof x);
}