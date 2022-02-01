var slideIndex = 1;
showDivs(slideIndex);

function plusDivs(n) {
    var side
    if (n == 1) {
        side = "right";
    } else {
        side = "left";
    }
  showDivs(slideIndex += n, side);
}

async function showDivs(n, side) {
  var i;
  var x = document.getElementsByClassName("background-img");
  if (n > x.length) {slideIndex = 1}
  if (n < 1) {slideIndex = x.length}
    for (i = 0; i < x.length; i++) {
        if (side == "right") {
            x[i].animate([
                //translate position and opacity
                {transform: 'translateX(-100%)', opacity: 0, blur: '0px'},
                {transform: 'translateX(0)', opacity: 1, blur: '10px'}

            ], {
                duration: 300,
                fill: 'forwards'
            });
        } else if(side == "left") {
            x[i].animate([
                //translate position and opacity
                {transform: 'translateX(100%)', opacity: 0, blur: '0px'},
                {transform: 'translateX(0)', opacity: 1, blur: '10px'}
            ], {
                duration: 300,
                fill: 'forwards'
            });
        }

        x[i].style.display = "none";
    }
    x[slideIndex-1].style.display = "block";
}

setInterval(function() {
    plusDivs(-1);
}, 5000);