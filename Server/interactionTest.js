var keyConst = {
    LEFT:   37,
    UP:     38,
    RIGHT:  39,
    DOWN:   40
  };

function checkKeyPress (key) {
    switch (key.keyCode) {
        case keyConst.LEFT:
            console.log("ArrowLeft");
            break;
        case keyConst.RIGHT:
            console.log("ArrowRight");
            break;
        case keyConst.UP:
            console.log("ArrowUp");
            break;
        case keyConst.DOWN:
            console.log("ArrowDown");
            break;
    }
}

window.addEventListener('keydown', checkKeyPress, false);
