//const = a variable can't be changed


const PI = 3.14159;
let radius;
let circumference;

// PI = 200;  ///will be error
// radius = window.prompt('Enter the redius of a circle');
radius = Number(radius);
document.getElementById("mySubmit").onclick = function() {
    radius = document.getElementById("myText").value;
    radius = Number(radius);
    circumference = 2 * PI * radius;
    document.getElementById('result').textContent = circumference + "cm";
}