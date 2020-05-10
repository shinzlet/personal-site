const states = [
  { bg: 0x261837, fg: 0x766793, time: 02 * 3600 },
  { bg: 0x664d5a, fg: 0xb86f6f, time: 06 * 3600 },
  { bg: 0x664d5a, fg: 0x000000, time: 06 * 3600 },
  { bg: 0xd9ad99, fg: 0x333333, time: 08 * 3600 },
  { bg: 0xddecff, fg: 0x2c1c53, time: 12 * 3600 },
  { bg: 0xddecff, fg: 0x2c1c53, time: 15 * 3600 },
  { bg: 0x753538, fg: 0x000000, time: 19 * 3600 },
  { bg: 0x753538, fg: 0xffdddd, time: 19 * 3600 },
  { bg: 0x601010, fg: 0xc33b3b, time: 20 * 3600 },
  { bg: 0x261837, fg: 0x766793, time: 24 * 3600 }
]

var colorShouldUpdate = false

function getCurrentState() {
  const date = new Date()
  const seconds = date.getSeconds() + 60 * date.getMinutes() + 3600 * date.getHours()
  return getStateForTime(seconds, states)
}

function getStateForTime(time, states) {
  // Edge case - if there is only one state, it's always the first state.
  if (states.length === 1) {
	 return {
		prevState: states[0],
		nextState: states[0],
		blend: 0
	 }
  }

  // The time must be between the start and end of a day, in seconds
  time %= 3600 * 24

  // Assume that the current time is *after* the final state
  let prevState = states[states.length - 1]
  let nextState = states[0]

  // Try to break that assumption
  for (let i = 0; i < states.length; i++) {
	 if (states[i].time > time) {
		break
	 }

	 prevState = states[i]
	 nextState = states[(i + 1) % states.length]
  }

  // Compute the coefficient for interpolation (0 is prev, 1 is next)
  let blend = mdf(prevState.time, time, nextState.time, 3600 * 24)

  return {prevState, nextState, blend}
}

function updateColors(state) {
  const prev = state.prevState
  const next = state.nextState
  const blend = state.blend

  Object.keys(prev).forEach(key => {
	 if (key === 'time') {
		return
	 }

	 const newColor = blendHexColors(prev[key], next[key], blend)
	 document.documentElement.style.setProperty(`--${key}`, newColor)
  })
}

// Given two numeric literal hex values (e.g. 0xabcdef):
// If the blend factor is 0, returns c1. If 1, returns c2.
// if 0 < blend < 1, returns a linear RGB interpolation.
// This returns a color code string, not a numeric literal.
function blendHexColors(c1, c2, blend) {
  let colorCode = '#'

  for (let i = 2; i >= 0; i--) {
	 const mask = 0xff << (8 * i)
	 const ch1 = (c1 & mask) >> (8 * i)
	 const ch2 = (c2 & mask) >> (8 * i)
	 const sum = ch1 * (1 - blend) + ch2 * (blend)
	 const hexCh = Math.floor(sum).toString(16).padStart(2, '0')
	 colorCode += hexCh
  }

  return colorCode
}

// Modular distance fraction:
// Given a modular base and three values, bottom, middle, and top,
// returns a number between 0 and 1 to represent how far middle is
// from reaching top, if 0 was bottom and 1 was top.
function mdf(bottom, middle, top, base) {
  return ((middle + base - bottom) % base) / ((top + base - bottom) % base)
}

const theme = getCookie('theme')
if (theme) {
  updateColorsWithTheme(theme)

  window.addEventListener('load', () => {
    const newSelected = document
      .querySelector(`#theme-selector > option[value='${theme}']`)
    newSelected.selected = true
  })
} else {
  updateColors(getCurrentState())
}

window.addEventListener('load', () => {
  const sidebarToggle = document.getElementById('hamburger')

  sidebarToggle.addEventListener('click', () => {
    document.body.classList.toggle('force-sidebar')
  })

  document.getElementById('theme-selector').addEventListener('input', e => { 
    setCookie('theme', e.target.value)
    updateColorsWithTheme(e.target.value)
  })

})

function setCookie(name, value) {
  document.cookie = `${name}=${value};path=/;max-age=${2**31 - 1}`
} 
function getCookie(name) {
  let match = document.cookie.match(new RegExp(`${name}=([^;]+)`))

  if (match) {
    return match[1]
  }
}

function updateColorsWithTheme(theme) {
  if (theme === 'earthly') {
    colorShouldUpdate = true
    updateColors(getCurrentState())
  } else {
    colorShouldUpdate = false
    const time = parseFloat(theme) * 3600
    const currentState = getStateForTime(time, states)
    updateColors(currentState) 
  }
}

window.setInterval(() => {
  if (colorShouldUpdate) {
    updateColorsWithTheme(getCookie('theme'))
    console.log('updated theme')
  }
}, 60 * 1000)
