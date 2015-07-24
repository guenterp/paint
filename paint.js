'use strict';

(function(window) {
	var DomHlpr = {
		getCheckedValue: function(elementName) {
			var checkedVal,
				values = document.getElementsByName(elementName);

			for (var i = 0; i < values.length; i++) {
				if (values[i].checked) {
						checkedVal = values[i].value;
						break;
				}
			}

			return checkedVal;
		},
		getCheckedNumber: function(elementName) {
			var val = this.getCheckedValue(elementName);
			return val ? parseInt(val, 10) : null;
		}
	};
	window.DomHlpr = DomHlpr;
})(window);

(function(window) {
	var ColorHlpr = {
		hexToRgb: function(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
			} : null;
		},
		rgbToGL: function(rgb) {
			return rgb ? {
				r: rgb.r / 255,
				g: rgb.g / 255,
				b: rgb.b / 255
			} : null;
		},
		hexToGL: function(hex) {
			return this.rgbToGL(
				this.hexToRgb(hex)
			);
		}
	};
	window.ColorHlpr = ColorHlpr;
})(window);

(function(window) {
	var windowToClipX = function(clientX, width) {
		var numerator = 2 * clientX;
		var scaled = numerator / width;
		return -1 + scaled;
	};
	var windowToClipY = function(clientY, height) {
		var numerator = 2 * (height - clientY);
		var scaled = numerator / height;
		return -1 + scaled;
	};
	var CoordHlpr = {
		windowToClip: function(clientX, clientY, width, height) {
			var clipX = windowToClipX(clientX, width);
			var clipY = windowToClipY(clientY, height);
			return vec2(clipX, clipY);
		}
	};
	window.CoordHlpr = CoordHlpr;
})(window);

(function(window, CoordHlpr, ColorHlpr, DomHlpr) {
	var 	MAX_SHAPES = 1000;
	var	_gl,
		_program,
		_vBuffer,
		_cBuffer,
		_canvas,
		_numDrawn = 0,
		_drawStartPoint,
		_rgbColor = {r: 1.0, g: 1.0, b: 0},
		_lineWidth = 1;

	var updateSettings = function(evt) { 
		evt.preventDefault();
		_rgbColor = ColorHlpr.hexToGL(document.getElementById('squareColor').value);
		_lineWidth = DomHlpr.getCheckedNumber('lineWidth');
	};

	var drawLine = function(canvasPoint1, canvasPoint2) {
		var startX = canvasPoint1.x,
			startY = canvasPoint1.y,
			endX = canvasPoint2.x,
			endY = canvasPoint2.y;
		var vertices = [
			CoordHlpr.windowToClip(startX, startY, _canvas.width, _canvas.height),
			CoordHlpr.windowToClip(endX, endY, _canvas.width, _canvas.height)
		];
		_gl.lineWidth(_lineWidth);

		var offset = sizeof.vec2 * 2 * _numDrawn;
		_gl.bindBuffer(_gl.ARRAY_BUFFER, _vBuffer);
		_gl.bufferSubData(_gl.ARRAY_BUFFER, offset, flatten(vertices));

		var colors = [
			_rgbColor.r, _rgbColor.g, _rgbColor.b,
			_rgbColor.r, _rgbColor.g, _rgbColor.b,
		];
		var colorOffset = sizeof.vec3 * 2 * _numDrawn;
		_gl.bindBuffer(_gl.ARRAY_BUFFER, _cBuffer);
		_gl.bufferSubData(_gl.ARRAY_BUFFER, colorOffset, flatten(colors));

		render();
		_numDrawn++;
	};

	var render = function() {
		_gl.clear( _gl.COLOR_BUFFER_BIT );
		_gl.drawArrays( _gl.LINES, 0, _numDrawn * 2 );
	};

	var drawStart = function(e) {
		_drawStartPoint = { x: e.offsetX==undefined?e.layerX:e.offsetX, y: e.offsetY==undefined?e.layerY:e.offsetY };
	};

	var drawing = function(e) {
		var currentPoint;
		if (_drawStartPoint) {
			currentPoint = { x: e.offsetX==undefined?e.layerX:e.offsetX, y: e.offsetY==undefined?e.layerY:e.offsetY };
			drawLine(_drawStartPoint, currentPoint);
			_drawStartPoint = currentPoint;
		}
	};

	var drawEnd = function() {
		_drawStartPoint = null;
	};

	var initBufferSize = function() {
		var sizeOfVertex = sizeof.vec2;
		var sizeOfLine = sizeOfVertex * 2;
		return sizeOfLine * MAX_SHAPES;
	};

	var App = {
		init: function() {
			_canvas = document.getElementById('gl-canvas');
			_gl = WebGLUtils.setupWebGL( _canvas );
			if ( !_gl ) { alert( 'WebGL isn\'t available' ); }
			document.getElementById('settings').addEventListener('change', updateSettings);
			_canvas.addEventListener('mousedown', drawStart);
			_canvas.addEventListener('mousemove', drawing);
			_canvas.addEventListener('mouseup', drawEnd);
			_gl.viewport( 0, 0, _canvas.width, _canvas.height );
			_gl.clearColor(0.0, 0.0, 0.0, 1.0);
			_gl.lineWidth(_lineWidth);
			_program = initShaders( _gl, 'vertex-shader', 'fragment-shader' );
			_gl.useProgram( _program );

			_vBuffer = _gl.createBuffer();
			_gl.bindBuffer( _gl.ARRAY_BUFFER, _vBuffer );
			_gl.bufferData( _gl.ARRAY_BUFFER, initBufferSize(), _gl.STATIC_DRAW );

			var vPosition = _gl.getAttribLocation( _program, 'vPosition' );
			_gl.vertexAttribPointer( vPosition, 2, _gl.FLOAT, false, 0, 0 );
			_gl.enableVertexAttribArray( vPosition );

			_cBuffer = _gl.createBuffer();
			_gl.bindBuffer( _gl.ARRAY_BUFFER, _cBuffer );
			_gl.bufferData( _gl.ARRAY_BUFFER, initBufferSize(), _gl.STATIC_DRAW );

			var vColor = _gl.getAttribLocation( _program, 'vColor' );
			_gl.vertexAttribPointer( vColor, 3, _gl.FLOAT, false, 0, 0 );
			_gl.enableVertexAttribArray( vColor );

			render();
		}
	};
	window.App = App;
}(window, window.CoordHlpr, window.ColorHlpr, window.DomHlpr));

(function(App) {
	document.addEventListener('DOMContentLoaded', function() {
		App.init();
	});

}(window.App || (window.App = {})));
