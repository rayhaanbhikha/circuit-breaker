const sizeOf = require("object-sizeof");

let arr = [];
for (let i = 0; i < 1024; i++) {
  if (i % 2 === 0) {
    arr.push(1);
  } else {
    arr.push(0);
  }
}

console.log(sizeOf(arr));
