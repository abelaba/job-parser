function showDialog() {
  if (document.getElementById('my-extension-dialog')) return

  const style = document.createElement('style')
  style.textContent = `
    html, body {
	height: 100%;
	margin: 0;
	padding: 0;
	position: relative;
    }
    #my-extension-dialog.confetti {
	display: flex;
	justify-content: center;
	align-items: center;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	z-index: 10000;
	pointer-events: none;
	padding: 1em;
	box-sizing: border-box;
	flex-wrap: wrap;
	overflow: hidden;
    }
	.confetti-piece {
	    position: absolute;
	    width: 10px;
	    height: 30px;
	    background: #ffd300;
	    top: 0;
	    opacity: 0;
	}
	.confetti-piece:nth-child(1) { left: 7%; transform: rotate(-40deg); animation: makeItRain 1116ms ease-out infinite; animation-delay: 182ms; }
	.confetti-piece:nth-child(2) { left: 14%; transform: rotate(4deg); animation: makeItRain 1076ms ease-out infinite; animation-delay: 161ms; }
	.confetti-piece:nth-child(3) { left: 21%; transform: rotate(-51deg); animation: makeItRain 1103ms ease-out infinite; animation-delay: 481ms; }
	.confetti-piece:nth-child(4) { left: 28%; transform: rotate(61deg); animation: makeItRain 708ms ease-out infinite; animation-delay: 334ms; }
	.confetti-piece:nth-child(5) { left: 35%; transform: rotate(-52deg); animation: makeItRain 776ms ease-out infinite; animation-delay: 302ms; }
	.confetti-piece:nth-child(6) { left: 42%; transform: rotate(38deg); animation: makeItRain 1168ms ease-out infinite; animation-delay: 180ms; }
	.confetti-piece:nth-child(7) { left: 49%; transform: rotate(11deg); animation: makeItRain 1200ms ease-out infinite; animation-delay: 395ms; }
	.confetti-piece:nth-child(8) { left: 56%; transform: rotate(49deg); animation: makeItRain 887ms ease-out infinite; animation-delay: 14ms; }
	.confetti-piece:nth-child(9) { left: 63%; transform: rotate(-72deg); animation: makeItRain 805ms ease-out infinite; animation-delay: 149ms; }
	.confetti-piece:nth-child(10) { left: 70%; transform: rotate(10deg); animation: makeItRain 1059ms ease-out infinite; animation-delay: 351ms; }
	.confetti-piece:nth-child(11) { left: 77%; transform: rotate(4deg); animation: makeItRain 1132ms ease-out infinite; animation-delay: 307ms; }
	.confetti-piece:nth-child(12) { left: 84%; transform: rotate(42deg); animation: makeItRain 776ms ease-out infinite; animation-delay: 464ms; }
	.confetti-piece:nth-child(13) { left: 91%; transform: rotate(-72deg); animation: makeItRain 818ms ease-out infinite; animation-delay: 429ms; }
	.confetti-piece:nth-child(odd) { background: #7431e8; }
	.confetti-piece:nth-child(even) { z-index: 1; }
	.confetti-piece:nth-child(4n) { width: 5px; height: 12px; animation-duration: 2000ms; }
	.confetti-piece:nth-child(3n) { width: 3px; height: 10px; animation-duration: 2500ms; animation-delay: 1000ms; }
	.confetti-piece:nth-child(4n-7) { background: red; }
    @keyframes makeItRain {
	from { opacity: 0; }
	50% { opacity: 1; }
	to { transform: translateY(350px); }
    }

	.balloon {
	    height: 125px;
	    width: 105px;
	    border-radius: 75% 75% 70% 70%;
	    position: relative;
	}

	.balloon:before {
	    content: "";
	    height: 75px;
	    width: 1px;
	    padding: 1px;
	    background-color: #FDFD96;
	    display: block;
	    position: absolute;
	    top: 125px;
	    left: 0;
	    right: 0;
	    margin: auto;
	}

	.balloon:after {
	    content: "â–²";
	    text-align: center;
	    display: block;
	    position: absolute;
	    color: inherit;
	    top: 120px;
	    left: 0;
	    right: 0;
	    margin: auto;
	}

    @keyframes float {
	from {transform: translateY(100vh);
	    opacity: 1;}
	to {transform: translateY(-300vh);
	    opacity: 0;}
    }
    `
  document.head.appendChild(style)

  const dialog = document.createElement('div')
  dialog.id = 'my-extension-dialog'
  dialog.className = 'confetti'
  for (let i = 0; i < 13; i++) {
    const piece = document.createElement('div')
    piece.className = 'confetti-piece'
    dialog.appendChild(piece)
  }

  function random(num) {
    return Math.floor(Math.random() * num)
  }

  function getRandomStyles() {
    var r = random(255)
    var g = random(255)
    var b = random(255)
    var mt = random(200)
    var ml = random(50)
    var dur = random(5) + 5
    return `
	background-color: rgba(${r},${g},${b},0.7);
	color: rgba(${r},${g},${b},0.7); 
	box-shadow: inset -7px -3px 10px rgba(${r - 10},${g - 10},${b - 10},0.7);
	margin: ${mt}px 0 0 ${ml}px;
	animation: float ${dur}s ease-in infinite
	`
  }

  for (var i = 10; i > 0; i--) {
    var balloon = document.createElement('div')
    balloon.className = 'balloon'
    balloon.style.cssText = getRandomStyles()
    dialog.append(balloon)
  }

  document.body.appendChild(dialog)

  setTimeout(() => {
    dialog.style.transition = 'opacity 0.5s ease-out'
    dialog.style.opacity = 0

    setTimeout(() => {
      dialog.remove()
    }, 500)
  }, 5000)
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'SHOWDIALOG') {
    showDialog()
  }
})
