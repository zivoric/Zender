## Theoretical Code Example
```js
let Z = Zender.getAPI();
let textField = document.getElementById("target"); // span
let zField = Z.field(textField, {
	allowLetters: false
});
zField.on("update", function(e) {
	console.log(this.latex);
	console.log(e.changes);
});
console.log(zField.latex);
```