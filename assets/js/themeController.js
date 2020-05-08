const states = [
  { bg: 0x261837, fg: 0x766793, time: 02 * 3600 },
  { bg: 0x664d5a, fg: 0xb86f6f, time: 06 * 3600 },
  { bg: 0x664d5a, fg: 0x000000, time: 06 * 3600 },
  { bg: 0xd9ad99, fg: 0x333333, time: 08 * 3600 },
  { bg: 0xddecff, fg: 0x2c1c53, time: 12 * 3600 }, { bg: 0xddecff, fg: 0x2c1c53, time: 15 * 3600 },
  { bg: 0x753538, fg: 0x000000, time: 19 * 3600 },
  { bg: 0x753538, fg: 0xffdddd, time: 19 * 3600 },
  { bg: 0x601010, fg: 0xc33b3b, time: 20 * 3600 },
  { bg: 0x261837, fg: 0x766793, time: 24 * 3600 }
]

const date = new Date()
const seconds = date.getSeconds() + 60 * date.getMinutes() + 3600 * date.getHours()
const currentState = getState(seconds, states)
updateColors(currentState)

document.getElementById('theme-selector').addEventListener("input", e => {
	if (e.target.value === 'earthly') {
		const date = new Date()
		const seconds = date.getSeconds() + 60 * date.getMinutes() + 3600 * date.getHours()
		const currentState = getState(seconds, states)
		updateColors(currentState)
	} else {
		const time = parseFloat(e.target.value) * 3600
	   const currentState = getState(time, states)
	   updateColors(currentState) 
	}
})

function sweep() {
  const event = new Event('input', {
	 bubbles: true,
	 cancelable: true
  })

  window.setInterval(() => {
	 const range = document.getElementById('time')
	 range.value = (parseFloat(range.value) + 60) % parseFloat(range.max)
	 range.dispatchEvent(event)
  }, 100)
}
// sweep()


function getState(time, states) {
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
		break;
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
		return;
	 }

	 const newColor = blendHexColors(prev[key], next[key], blend)
	 document.documentElement.style.setProperty(`--${key}`, newColor)
  })
}

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

// MDF: Modular Distance Fraction
// For any values of bottom, middle, and top between 0 and max,
// this function returns a value 0 to 1 representing how far
// 'middle' is along the arc from 'bottom' to 'top'
// under modular arithmetic under 'max'.
// For example, under mod 5, '4' is halfway between '3' and '0'.
// So, mdf(3, 4, 0, 5) would return 0.5.
// If bottom < middle < top (ignoring modular arithmetic),
// this function is equivalent to (middle - bottom) / (top - bottom).
function mdf(bottom, middle, top, max) {
  // Derived using modular arithmetic and a translation that shifts
  // 'bottom' to zero using addition, not subtraction
  // (Done that way to avoid JS weirdness where %
  //  is the remainder operator, not actual positive modulus)
  return ((middle + max - bottom) % max) / ((top + max - bottom) % max)
}
