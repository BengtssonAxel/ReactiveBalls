let audioCtx, analyser, ampWindow, freqWindows;

//Defines the canvas and allow for usage
var canvas = document.querySelector('canvas');

//sets the Canvas to the size of the browser window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Allows for drawing on a 2d plain
var ctx = canvas.getContext('2d');

// Creates a mouse object with x and y coordinates
var mouse = {
	x: undefined,
	y: undefined,
};

// Sets the max and min of the balls
var maxRadius = 30;
var minRadius = 30;

// Array containing the colors of the balls
var colorArray = ['#0D1A26', '#3F6473', '#5E888C', '#DCE4F2', '#BF5A5A'];

// Adds an eventListner to locate the x and y of the mouse pos
window.addEventListener('mousemove', function (event) {
	mouse.x = event.x;
	mouse.y = event.y;
});

// Adds an eventListner that listens for a resizing of the window
window.addEventListener('resize', function () {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	// This runs every time the window is being resized
	init();
});

// This creates an circle (ball) object with parameters for the circles
function Circle(x, y, dx, dy, radius) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.radius = radius;
	this.minRadius = radius;
	// This fetches an random color from our array
	this.color = colorArray[Math.floor(Math.random() * colorArray.length)];
	// The function that draws out the circles
	this.draw = function () {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	};

	// This function updates the position of the circles
	this.update = function () {
		const bins = analyser.frequencyBinCount;
		const freq = new Float32Array(bins);
		const wave = new Float32Array(bins);
		analyser.getFloatFrequencyData(freq);
		analyser.getFloatTimeDomainData(wave);

		if (this.x + this.radius > innerWidth || this.x - this.radius < 0) {
			this.dx = -this.dx;
		}
		if (this.y + this.radius > innerHeight || this.y - this.radius < 0) {
			this.dy = -this.dy;
		}
		this.x += this.dx;
		this.y += this.dy;

		if (this.radius < maxRadius) {
			if (this.color == '#0D1A26') {
				this.radius = -freq[0] / 6;
			} else if (this.color == '#3F6473') {
				this.radius = -freq[4] / 6;
			} else if (this.color == '#5E888C') {
				this.radius = -freq[7] / 6;
			} else if (this.color == '#DCE4F2') {
				this.radius = -freq[10] / 6;
			} else if (this.color == '#BF5A5A') {
				this.radius = -freq[14] / 6;
			}
		}

		// Draws the new pos and size of the circle
		this.draw();
	};
}

// Creates an array of circle objects
var circleArray = [];

// Initialises the filling of the circle array and gives the random values
function init() {
	circleArray = [];
	for (var i = 0; i < 600; i++) {
		var radius = 10;
		//var radius = Math.random() * 10 + 1;
		var x = Math.random() * (innerWidth - radius * 2) + radius;
		var y = Math.random() * (innerHeight - radius * 2) + radius;
		var dx = (Math.random() - 0.5) * 4;
		var dy = (Math.random() - 0.5) * 4;
		circleArray.push(new Circle(x, y, dx, dy, radius));
	}
}

// Creates an infinite loop that calls the update function and itself. It also clears the canvas with each pass
function animate() {
	requestAnimationFrame(animate);
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	for (var i = 1; i < circleArray.length; i++) {
		circleArray[i].update();
	}
}

function onDocumentReady() {
	// Initalise microphone
	navigator.getUserMedia(
		{ audio: true },
		onMicSuccess, // Call this when microphone is ready
		(error) => {
			console.error('Could not init microphone', error);
		}
	);
}

// Microphone successfully initalised, now have access to audio data
function onMicSuccess(stream) {
	audioCtx = new AudioContext();

	audioCtx.addEventListener('statechange', () => {
		console.log('Audio context state: ' + audioCtx.state);
	});

	lowPassFilter = audioCtx.createBiquadFilter();
	lowPassFilter.type = 'lowpass';
	lowPassFilter.gain.value = -100;
	lowPassFilter.frequency.value = 22050;

	highPassFilter = audioCtx.createBiquadFilter();
	highPassFilter.type = 'highpass';
	highPassFilter.gain.value = -100;
	highPassFilter.frequency.value = 1;

	analyser = audioCtx.createAnalyser();

	// fftSize must be a power of 2. Higher values slower, more detailed
	// Range is 32-32768
	analyser.fftSize = 32;

	// smoothingTimeConstant ranges from 0.0 to 1.0
	// 0 = no averaging. Fast response, jittery
	// 1 = maximum averaging. Slow response, smooth
	analyser.smoothingTimeConstant = 0.9;

	// Microphone -> analyser
	const micSource = audioCtx.createMediaStreamSource(stream);
	micSource.connect(analyser);
	lowPassFilter.connect(highPassFilter);
	highPassFilter.connect(analyser);

	// Start loop
	window.requestAnimationFrame(animate);
}

if (document.readyState != 'loading') {
	onDocumentReady();
} else {
	document.addEventListener('DOMContentLoaded', onDocumentReady);
}

//Starts the programme
init();
