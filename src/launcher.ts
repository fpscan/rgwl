import { loadGame, initRetroFs, localData, loadStroe } from './fs';

// function loadScript (source, beforeEl, async = true, defer = true) {
//   return new Promise((resolve, reject) => {
//     let script = document.createElement('script');
//     const prior = beforeEl || document.getElementsByTagName('script')[0];
//     script.async = async;
//     script.defer = defer;
//     function onloadHander() {
//       resolve(null)
//     }
//     script.onload = onloadHander;
//     script.src = source;
//     prior.parentNode.insertBefore(script, prior);
//   })
// }
export function loadScript(source: string, callback: Function, async = true, defer = true) {
  var script = document.createElement('script');
  var prior = document.getElementsByTagName('script')[0];
  script.async = async
  script.defer = defer
  script.onload = function () {
    setTimeout(callback, 0);
  };
  script.src = source;
  prior.parentNode.insertBefore(script, prior)
}

export function initModule () {
  window.Module = {
    noInitialRun: true,
    // arguments: ["-v", "--menu"],
    arguments: ["/home/web_user/retroarch/userdata/content/downloads/"],
    preRun: [],
    postRun: [function() {
      console.log('pppsssssssssst rrrrrrrrrrrrrun')
    }],
    onRuntimeInitialized: function() {
    }, 
    print: function(text)
    {
      console.log(text);
    },
    printErr: function(text)
    {
      console.log(text);
    },
    canvas: document.getElementById('canvas'),
    totalDependencies: 0,
    monitorRunDependencies: function(left)
    {
      this.totalDependencies = Math.max(this.totalDependencies, left);
    }
  }
}

function run () {
  loadStroe()
  const { game, platform, core } = localData.save.selectedGame
  if (!game || !platform || !core)  return
  initModule()
  window.Module.arguments = [`/home/web_user/retroarch/userdata/content/downloads/${game}`],
  window.Module.onRuntimeInitialized = () => {
    console.log('runtime inited')
    loadGame(platform, game, (memFs) => {
      console.log('game fs ok')
      initRetroFs(memFs, () => {
        console.log('retro fs ok')
        window.Module['callMain'](window.Module['arguments']);
        window.Module['resumeMainLoop']()
        // document.getElementById('canvas').focus()
        // setTimeout(() => {
        //   window.Module.canvas.style.width = '80%'
        //   window.Module.canvas.style.height = 'auto'
        // }, 1000)
      })
    })
  }
  loadScript(`cores/${core}_libretro.js`, () => {
    console.log('core loaded')
  })
}

const keys = {
  9: "tab",
  13: "enter",
  16: "shift",
  18: "alt",
  27: "Escape",
  33: "rePag",
  34: "avPag",
  35: "end",
  36: "home",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12"
};
window.addEventListener('keydown', function (e) {
  if (Object.values(keys).includes(e.key)) {
    e.preventDefault();
  }
});

let gpInterval;
if(location.search) {
  window.addEventListener("gamepadconnected", function(e) {
    console.log("launcher: controller connected")
    if (!gpInterval) {
      gpInterval = setInterval(pollGamepads, 100)
    }
  })
  run()
}

const launcherEl = document.getElementById('launcher')
window['fullScreen'] = () => {
  const elemBar = document.getElementById('bar');
  const dispStyle = getComputedStyle(elemBar)['display'];
  if (document.fullscreenElement) {
    document.exitFullscreen()
    if (dispStyle === 'none') {
      document.getElementById('bar').style.display = 'block';
    }
  } else {
    launcherEl.requestFullscreen()
    if (dispStyle !== 'none') {
      document.getElementById('bar').style.display = 'none';
    }
  }
}
window['exitToApp'] = () => {
  keyPress('Escape')
  setTimeout(() => {
    keyPress('Escape')
    setTimeout(parent.window.exitGame, 600)
    clearInterval(gpInterval)
  }, 50)
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

function hideBar() {
  const elemBar = document.getElementById('bar');
  const dispStyle = getComputedStyle(elemBar)['display'];
  if (dispStyle === 'none') {
    document.getElementById('bar').style.display = 'block';
  } else {
    document.getElementById('bar').style.display = 'none';
  }
}

function keyPress(code: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', {code }))
  setTimeout(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code }))
    console.log('key press', code)
  }, 33)
}
window['keyPress'] = keyPress

const HotKeys: [number, number, number, string|Function][] = [
  [6, 9, 0, 'F1'],
  [4, 9, 0, hideBar],
  [6, 8, 0, window['fullScreen']],
  [4, 8, 0, window['exitToApp']],
  [7, 8, 0, 'F2'],
  [7, 9, 0, 'F4'],
]
function pollGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
  for (let i = 0; i < 1; i++) {
    const gp = gamepads[i];
    if (gp) {
      const pressed: number[] = []
      for (let j = 0; j < gp.buttons.length; j++) {
        if (gp.buttons[j].pressed) {
          pressed.push(j)
        }
      }
      if (pressed.length) {
        console.log(pressed)
        HotKeys.forEach((x) => {
          const [k1, k2, ts, KeyOrFn] = x
          if ((ts + 600) < gp.timestamp && pressed.includes(k1) && pressed.includes(k2)) {
            x[2] = gp.timestamp
            if (typeof KeyOrFn === 'string') {
              keyPress(KeyOrFn)
            } else {
              KeyOrFn()
            }
          }
        })
      }
    }
  }
}
