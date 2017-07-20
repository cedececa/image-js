(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.IJS = {})));
}(this, (function (exports) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = commonjsGlobal.BlobBuilder
  || commonjsGlobal.WebKitBlobBuilder
  || commonjsGlobal.MSBlobBuilder
  || commonjsGlobal.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  for (var i = 0; i < ary.length; i++) {
    var chunk = ary[i];
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      ary[i] = buf;
    }
  }
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary);

  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
}

function BlobConstructor(ary, options) {
  mapArrayBufferViews(ary);
  return new Blob(ary, options || {});
}

var index$2 = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? commonjsGlobal.Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

var Mutation = commonjsGlobal.MutationObserver || commonjsGlobal.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = commonjsGlobal.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!commonjsGlobal.setImmediate && typeof commonjsGlobal.MessageChannel !== 'undefined') {
    var channel = new commonjsGlobal.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in commonjsGlobal && 'onreadystatechange' in commonjsGlobal.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = commonjsGlobal.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      commonjsGlobal.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

var browser$2 = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];

var browser = Promise$1;

function Promise$1(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise$1.prototype["catch"] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise$1.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};

function unwrap(promise, func, value) {
  browser$2(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return handlers.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

Promise$1.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise$1.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise$1.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise$1.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}

var index$4 = typeof Promise === 'function' ? Promise : browser;

/* jshint -W079 */



//
// PRIVATE
//

// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function binaryStringToArrayBuffer(binary) {
  var length = binary.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  var i = -1;
  while (++i < length) {
    arr[i] = binary.charCodeAt(i);
  }
  return buf;
}

// Can't find original post, but this is close
// http://stackoverflow.com/questions/6965107/ (continues on next line)
// converting-between-strings-and-arraybuffers
function arrayBufferToBinaryString(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var length = bytes.byteLength;
  var i = -1;
  while (++i < length) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

// doesn't download the image more than once, because
// browsers aren't dumb. uses the cache
function loadImage(src, crossOrigin) {
  return new index$4(function (resolve, reject) {
    var img = new Image();
    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }
    img.onload = function () {
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function imgToCanvas(img) {
  var canvas = document.createElement('canvas');

  canvas.width = img.width;
  canvas.height = img.height;

  // copy the image contents to the canvas
  var context = canvas.getContext('2d');
  context.drawImage(
    img,
    0, 0,
    img.width, img.height,
    0, 0,
    img.width, img.height);

  return canvas;
}

//
// PUBLIC
//

/**
 * Shim for
 * [new Blob()]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob.Blob}
 * to support
 * [older browsers that use the deprecated <code>BlobBuilder</code> API]{@link http://caniuse.com/blob}.
 *
 * @param {Array} parts - content of the <code>Blob</code>
 * @param {Object} options - usually just <code>{type: myContentType}</code>
 * @returns {Blob}
 */
function createBlob(parts, options) {
  options = options || {};
  if (typeof options === 'string') {
    options = {type: options}; // do you a solid here
  }
  return new index$2(parts, options);
}

/**
 * Shim for
 * [URL.createObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL}
 * to support browsers that only have the prefixed
 * <code>webkitURL</code> (e.g. Android <4.4).
 * @param {Blob} blob
 * @returns {string} url
 */
function createObjectURL(blob) {
  return (window.URL || window.webkitURL).createObjectURL(blob);
}

/**
 * Shim for
 * [URL.revokeObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL}
 * to support browsers that only have the prefixed
 * <code>webkitURL</code> (e.g. Android <4.4).
 * @param {string} url
 */
function revokeObjectURL(url) {
  return (window.URL || window.webkitURL).revokeObjectURL(url);
}

/**
 * Convert a <code>Blob</code> to a binary string. Returns a Promise.
 *
 * @param {Blob} blob
 * @returns {Promise} Promise that resolves with the binary string
 */
function blobToBinaryString(blob) {
  return new index$4(function (resolve, reject) {
    var reader = new FileReader();
    var hasBinaryString = typeof reader.readAsBinaryString === 'function';
    reader.onloadend = function (e) {
      var result = e.target.result || '';
      if (hasBinaryString) {
        return resolve(result);
      }
      resolve(arrayBufferToBinaryString(result));
    };
    reader.onerror = reject;
    if (hasBinaryString) {
      reader.readAsBinaryString(blob);
    } else {
      reader.readAsArrayBuffer(blob);
    }
  });
}

/**
 * Convert a base64-encoded string to a <code>Blob</code>. Returns a Promise.
 * @param {string} base64
 * @param {string|undefined} type - the content type (optional)
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function base64StringToBlob(base64, type) {
  return index$4.resolve().then(function () {
    var parts = [binaryStringToArrayBuffer(atob(base64))];
    return type ? createBlob(parts, {type: type}) : createBlob(parts);
  });
}

/**
 * Convert a binary string to a <code>Blob</code>. Returns a Promise.
 * @param {string} binary
 * @param {string|undefined} type - the content type (optional)
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function binaryStringToBlob(binary, type) {
  return index$4.resolve().then(function () {
    return base64StringToBlob(btoa(binary), type);
  });
}

/**
 * Convert a <code>Blob</code> to a binary string. Returns a Promise.
 * @param {Blob} blob
 * @returns {Promise} Promise that resolves with the binary string
 */
function blobToBase64String(blob) {
  return blobToBinaryString(blob).then(function (binary) {
    return btoa(binary);
  });
}

/**
 * Convert a data URL string
 * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>)
 * to a <code>Blob</code>. Returns a Promise.
 * @param {string} dataURL
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function dataURLToBlob(dataURL) {
  return index$4.resolve().then(function () {
    var type = dataURL.match(/data:([^;]+)/)[1];
    var base64 = dataURL.replace(/^[^,]+,/, '');

    var buff = binaryStringToArrayBuffer(atob(base64));
    return createBlob([buff], {type: type});
  });
}

/**
 * Convert an image's <code>src</code> URL to a data URL by loading the image and painting
 * it to a <code>canvas</code>. Returns a Promise.
 *
 * <p/>Note: this will coerce the image to the desired content type, and it
 * will only paint the first frame of an animated GIF.
 *
 * @param {string} src
 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
 *                                         'Anonymous' to avoid "tainted canvas" errors
 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns {Promise} Promise that resolves with the data URL string
 */
function imgSrcToDataURL(src, type, crossOrigin, quality) {
  type = type || 'image/png';

  return loadImage(src, crossOrigin).then(function (img) {
    return imgToCanvas(img);
  }).then(function (canvas) {
    return canvas.toDataURL(type, quality);
  });
}

/**
 * Convert a <code>canvas</code> to a <code>Blob</code>. Returns a Promise.
 * @param {string} canvas
 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function canvasToBlob(canvas, type, quality) {
  return index$4.resolve().then(function () {
    if (typeof canvas.toBlob === 'function') {
      return new index$4(function (resolve) {
        canvas.toBlob(resolve, type, quality);
      });
    }
    return dataURLToBlob(canvas.toDataURL(type, quality));
  });
}

/**
 * Convert an image's <code>src</code> URL to a <code>Blob</code> by loading the image and painting
 * it to a <code>canvas</code>. Returns a Promise.
 *
 * <p/>Note: this will coerce the image to the desired content type, and it
 * will only paint the first frame of an animated GIF.
 *
 * @param {string} src
 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
 *                                         'Anonymous' to avoid "tainted canvas" errors
 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
 *                                     if the requested type is 'image/jpeg' or 'image/webp'
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function imgSrcToBlob(src, type, crossOrigin, quality) {
  type = type || 'image/png';

  return loadImage(src, crossOrigin).then(function (img) {
    return imgToCanvas(img);
  }).then(function (canvas) {
    return canvasToBlob(canvas, type, quality);
  });
}

/**
 * Convert an <code>ArrayBuffer</code> to a <code>Blob</code>. Returns a Promise.
 *
 * @param {ArrayBuffer} buffer
 * @param {string|undefined} type - the content type (optional)
 * @returns {Promise} Promise that resolves with the <code>Blob</code>
 */
function arrayBufferToBlob(buffer, type) {
  return index$4.resolve().then(function () {
    return createBlob([buffer], type);
  });
}

/**
 * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>. Returns a Promise.
 * @param {Blob} blob
 * @returns {Promise} Promise that resolves with the <code>ArrayBuffer</code>
 */
function blobToArrayBuffer(blob) {
  return new index$4(function (resolve, reject) {
    var reader = new FileReader();
    reader.onloadend = function (e) {
      var result = e.target.result || new ArrayBuffer(0);
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

var index = {
  createBlob         : createBlob,
  createObjectURL    : createObjectURL,
  revokeObjectURL    : revokeObjectURL,
  imgSrcToBlob       : imgSrcToBlob,
  imgSrcToDataURL    : imgSrcToDataURL,
  canvasToBlob       : canvasToBlob,
  dataURLToBlob      : dataURLToBlob,
  blobToBase64String : blobToBase64String,
  base64StringToBlob : base64StringToBlob,
  binaryStringToBlob : binaryStringToBlob,
  blobToBinaryString : blobToBinaryString,
  arrayBufferToBlob  : arrayBufferToBlob,
  blobToArrayBuffer  : blobToArrayBuffer
};

var index_1 = index.canvasToBlob;

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

var index$6 = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

var utf8 = createCommonjsModule(function (module, exports) {
/*! https://mths.be/utf8js v2.1.2 by @mathias */
(function(root) {

	// Detect free variables `exports`
	var freeExports = 'object' == 'object' && exports;

	// Detect free variable `module`
	var freeModule = 'object' == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.1.2',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof undefined == 'function' &&
		typeof undefined.amd == 'object' &&
		undefined.amd
	) {
		undefined(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(commonjsGlobal));
});

const defaultByteLength = 1024 * 8;
const charArray = [];

/**
 * IOBuffer
 * @constructor
 * @param {undefined|number|ArrayBuffer|TypedArray|IOBuffer|Buffer} data - The data to construct the IOBuffer with.
 *
 * If it's a number, it will initialize the buffer with the number as the buffer's length<br>
 * If it's undefined, it will initialize the buffer with a default length of 8 Kb<br>
 * If its an ArrayBuffer, a TypedArray, an IOBuffer instance,
 * or a Node.js Buffer, it will create a view over the underlying ArrayBuffer.
 * @param {object} [options]
 * @param {number} [options.offset=0] - Ignore the first n bytes of the ArrayBuffer
 * @property {ArrayBuffer} buffer - Reference to the internal ArrayBuffer object
 * @property {number} length - Byte length of the internal ArrayBuffer
 * @property {number} offset - The current offset of the buffer's pointer
 * @property {number} byteLength - Byte length of the internal ArrayBuffer
 * @property {number} byteOffset - Byte offset of the internal ArrayBuffer
 */
class IOBuffer {
    constructor(data, options) {
        options = options || {};
        var dataIsGiven = false;
        if (data === undefined) {
            data = defaultByteLength;
        }
        if (typeof data === 'number') {
            data = new ArrayBuffer(data);
        } else {
            dataIsGiven = true;
            this._lastWrittenByte = data.byteLength;
        }

        const offset = options.offset ? options.offset >>> 0 : 0;
        let byteLength = data.byteLength - offset;
        let dvOffset = offset;
        if (data.buffer) {
            if (data.byteLength !== data.buffer.byteLength) {
                dvOffset = data.byteOffset + offset;
            }
            data = data.buffer;
        }
        if (dataIsGiven) {
            this._lastWrittenByte = byteLength;
        } else {
            this._lastWrittenByte = 0;
        }
        this.buffer = data;
        this.length = byteLength;
        this.byteLength = byteLength;
        this.byteOffset = dvOffset;
        this.offset = 0;
        this.littleEndian = true;
        this._data = new DataView(this.buffer, dvOffset, byteLength);
        this._mark = 0;
        this._marks = [];
    }

    /**
     * Checks if the memory allocated to the buffer is sufficient to store more bytes after the offset
     * @param {number} [byteLength=1] The needed memory in bytes
     * @return {boolean} Returns true if there is sufficient space and false otherwise
     */
    available(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        return (this.offset + byteLength) <= this.length;
    }

    /**
     * Check if little-endian mode is used for reading and writing multi-byte values
     * @return {boolean} Returns true if little-endian mode is used, false otherwise
     */
    isLittleEndian() {
        return this.littleEndian;
    }

    /**
     * Set little-endian mode for reading and writing multi-byte values
     * @return {IOBuffer}
     */
    setLittleEndian() {
        this.littleEndian = true;
        return this;
    }

    /**
     * Check if big-endian mode is used for reading and writing multi-byte values
     * @return {boolean} Returns true if big-endian mode is used, false otherwise
     */
    isBigEndian() {
        return !this.littleEndian;
    }

    /**
     * Switches to big-endian mode for reading and writing multi-byte values
     * @return {IOBuffer}
     */
    setBigEndian() {
        this.littleEndian = false;
        return this;
    }

    /**
     * Move the pointer n bytes forward
     * @param {number} n
     * @return {IOBuffer}
     */
    skip(n) {
        if (n === undefined) n = 1;
        this.offset += n;
        return this;
    }

    /**
     * Move the pointer to the given offset
     * @param {number} offset
     * @return {IOBuffer}
     */
    seek(offset) {
        this.offset = offset;
        return this;
    }

    /**
     * Store the current pointer offset.
     * @see {@link IOBuffer#reset}
     * @return {IOBuffer}
     */
    mark() {
        this._mark = this.offset;
        return this;
    }

    /**
     * Move the pointer back to the last pointer offset set by mark
     * @see {@link IOBuffer#mark}
     * @return {IOBuffer}
     */
    reset() {
        this.offset = this._mark;
        return this;
    }

    /**
     * Push the current pointer offset to the mark stack
     * @see {@link IOBuffer#popMark}
     * @return {IOBuffer}
     */
    pushMark() {
        this._marks.push(this.offset);
        return this;
    }

    /**
     * Pop the last pointer offset from the mark stack, and set the current pointer offset to the popped value
     * @see {@link IOBuffer#pushMark}
     * @return {IOBuffer}
     */
    popMark() {
        const offset = this._marks.pop();
        if (offset === undefined) throw new Error('Mark stack empty');
        this.seek(offset);
        return this;
    }

    /**
     * Move the pointer offset back to 0
     * @return {IOBuffer}
     */
    rewind() {
        this.offset = 0;
        return this;
    }

    /**
     * Make sure the buffer has sufficient memory to write a given byteLength at the current pointer offset
     * If the buffer's memory is insufficient, this method will create a new buffer (a copy) with a length
     * that is twice (byteLength + current offset)
     * @param {number} [byteLength = 1]
     * @return {IOBuffer}
     */
    ensureAvailable(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        if (!this.available(byteLength)) {
            const lengthNeeded = this.offset + byteLength;
            const newLength = lengthNeeded * 2;
            const newArray = new Uint8Array(newLength);
            newArray.set(new Uint8Array(this.buffer));
            this.buffer = newArray.buffer;
            this.length = this.byteLength = newLength;
            this._data = new DataView(this.buffer);
        }
        return this;
    }

    /**
     * Read a byte and return false if the byte's value is 0, or true otherwise
     * Moves pointer forward
     * @return {boolean}
     */
    readBoolean() {
        return this.readUint8() !== 0;
    }

    /**
     * Read a signed 8-bit integer and move pointer forward
     * @return {number}
     */
    readInt8() {
        return this._data.getInt8(this.offset++);
    }

    /**
     * Read an unsigned 8-bit integer and move pointer forward
     * @return {number}
     */
    readUint8() {
        return this._data.getUint8(this.offset++);
    }

    /**
     * Alias for {@link IOBuffer#readUint8}
     * @return {number}
     */
    readByte() {
        return this.readUint8();
    }

    /**
     * Read n bytes and move pointer forward.
     * @param {number} n
     * @return {Uint8Array}
     */
    readBytes(n) {
        if (n === undefined) n = 1;
        var bytes = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            bytes[i] = this.readByte();
        }
        return bytes;
    }

    /**
     * Read a 16-bit signed integer and move pointer forward
     * @return {number}
     */
    readInt16() {
        var value = this._data.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    /**
     * Read a 16-bit unsigned integer and move pointer forward
     * @return {number}
     */
    readUint16() {
        var value = this._data.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    /**
     * Read a 32-bit signed integer and move pointer forward
     * @return {number}
     */
    readInt32() {
        var value = this._data.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 32-bit unsigned integer and move pointer forward
     * @return {number}
     */
    readUint32() {
        var value = this._data.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 32-bit floating number and move pointer forward
     * @return {number}
     */
    readFloat32() {
        var value = this._data.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 64-bit floating number and move pointer forward
     * @return {number}
     */
    readFloat64() {
        var value = this._data.getFloat64(this.offset, this.littleEndian);
        this.offset += 8;
        return value;
    }

    /**
     * Read 1-byte ascii character and move pointer forward
     * @return {string}
     */
    readChar() {
        return String.fromCharCode(this.readInt8());
    }

    /**
     * Read n 1-byte ascii characters and move pointer forward
     * @param {number} n
     * @return {string}
     */
    readChars(n) {
        if (n === undefined) n = 1;
        charArray.length = n;
        for (var i = 0; i < n; i++) {
            charArray[i] = this.readChar();
        }
        return charArray.join('');
    }

    /**
     * Read the next n bytes, return a UTF-8 decoded string and move pointer forward
     * @param {number} n
     * @return {string}
     */
    readUtf8(n) {
        if (n === undefined) n = 1;
        const bString = this.readChars(n);
        return utf8.decode(bString);
    }

    /**
     * Write 0xff if the passed value is truthy, 0x00 otherwise
     * @param {any} value
     * @return {IOBuffer}
     */
    writeBoolean(value) {
        this.writeUint8(value ? 0xff : 0x00);
        return this;
    }

    /**
     * Write value as an 8-bit signed integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt8(value) {
        this.ensureAvailable(1);
        this._data.setInt8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as a 8-bit unsigned integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeUint8(value) {
        this.ensureAvailable(1);
        this._data.setUint8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * An alias for {@link IOBuffer#writeUint8}
     * @param {number} value
     * @return {IOBuffer}
     */
    writeByte(value) {
        return this.writeUint8(value);
    }

    /**
     * Write bytes
     * @param {Array|Uint8Array} bytes
     * @return {IOBuffer}
     */
    writeBytes(bytes) {
        this.ensureAvailable(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            this._data.setUint8(this.offset++, bytes[i]);
        }
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as an 16-bit signed integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt16(value) {
        this.ensureAvailable(2);
        this._data.setInt16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as a 16-bit unsigned integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeUint16(value) {
        this.ensureAvailable(2);
        this._data.setUint16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit signed integer at the current pointer offset
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt32(value) {
        this.ensureAvailable(4);
        this._data.setInt32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit unsigned integer at the current pointer offset
     * @param {number} value - The value to set
     * @return {IOBuffer}
     */
    writeUint32(value) {
        this.ensureAvailable(4);
        this._data.setUint32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit floating number at the current pointer offset
     * @param {number} value - The value to set
     * @return {IOBuffer}
     */
    writeFloat32(value) {
        this.ensureAvailable(4);
        this._data.setFloat32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 64-bit floating number at the current pointer offset
     * @param {number} value
     * @return {IOBuffer}
     */
    writeFloat64(value) {
        this.ensureAvailable(8);
        this._data.setFloat64(this.offset, value, this.littleEndian);
        this.offset += 8;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write the charCode of the passed string's first character to the current pointer offset
     * @param {string} str - The character to set
     * @return {IOBuffer}
     */
    writeChar(str) {
        return this.writeUint8(str.charCodeAt(0));
    }

    /**
     * Write the charCodes of the passed string's characters to the current pointer offset
     * @param {string} str
     * @return {IOBuffer}
     */
    writeChars(str) {
        for (var i = 0; i < str.length; i++) {
            this.writeUint8(str.charCodeAt(i));
        }
        return this;
    }

    /**
     * UTF-8 encode and write the passed string to the current pointer offset
     * @param {string} str
     * @return {IOBuffer}
     */
    writeUtf8(str) {
        const bString = utf8.encode(str);
        return this.writeChars(bString);
    }

    /**
     * Export a Uint8Array view of the internal buffer.
     * The view starts at the byte offset and its length
     * is calculated to stop at the last written byte or the original length.
     * @return {Uint8Array}
     */
    toArray() {
        return new Uint8Array(this.buffer, this.byteOffset, this._lastWrittenByte);
    }

    /**
     * Same as {@link IOBuffer#toArray} but returns a Buffer if possible. Otherwise returns a Uint8Array.
     * @return {Buffer|Uint8Array}
     */
    getBuffer() {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(this.toArray());
        } else {
            return this.toArray();
        }
    }

    /**
     * Update the last written byte offset
     * @private
     */
    _updateLastWrittenByte() {
        if (this.offset > this._lastWrittenByte) {
            this._lastWrittenByte = this.offset;
        }
    }
}

var IOBuffer_1 = IOBuffer;

var constants = {
    BITMAPV5HEADER: {
        LogicalColorSpace: { // https://msdn.microsoft.com/en-us/library/cc250396.aspx
            LCS_CALIBRATED_RGB: 0x00000000,
            LCS_sRGB: 0x73524742,  // eslint-disable-line camelcase
            LCS_WINDOWS_COLOR_SPACE: 0x57696E20
        },
        Compression: { // https://msdn.microsoft.com/en-us/library/cc250415.aspx
            BI_RGB: 0x0000, // No compression
            BI_RLE8: 0x0001,
            BI_RLE4: 0x0002,
            BI_BITFIELDS: 0x0003,
            BI_JPEG: 0x0004,
            BI_PNG: 0x0005,
            BI_CMYK: 0x000B,
            BI_CMYKRLE8: 0x000C,
            BI_CMYKRLE4: 0x000D
        },
        GamutMappingIntent: { // https://msdn.microsoft.com/en-us/library/cc250392.aspx
            LCS_GM_ABS_COLORIMETRIC: 0x00000008,
            LCS_GM_BUSINESS: 0x00000001,
            LCS_GM_GRAPHICS: 0x00000002,
            LCS_GM_IMAGES: 0x00000004
        }
    }
};

const tableLeft = [];
for (var i = 0; i <= 8; i++) {
    tableLeft.push(0b11111111 << i);
}
var encode$1 = function (imageData) {
    if (imageData.bitDepth !== 1) {
        throw new Error('Only bitDepth of 1 is supported');
    }
    if (!imageData.height || !imageData.width) {
        throw new Error('ImageData width and height are required');
    }

    if (imageData.components !== 1) {
        throw new Error('Only 1 component is supported');
    }

    if (imageData.channels !== 1) {
        throw new Error('Only 1 channel is supported');
    }

    var io = new IOBuffer_1();
    // skip header
    io.skip(14);
    writeBitmapV5Header(io, imageData);
    writeColorTable(io, imageData);
    const imageOffset = io.offset;
    writePixelArray(io, imageData);

    // write header at the end
    io.rewind();
    writeBitmapFileHeader(io, imageOffset);
    return io.getBuffer();
};

function writePixelArray(io, imgData) {
    const rowSize = Math.floor((imgData.bitDepth * imgData.width + 31) / 32) * 4;
    const dataRowSize = Math.ceil(imgData.bitDepth * imgData.width / 8);
    const skipSize = rowSize - dataRowSize;
    const bitOverflow = (imgData.bitDepth * imgData.width) % 8;
    const bitSkip = bitOverflow === 0 ? 0 : 8 - bitOverflow;
    const totalBytes = rowSize * imgData.height;

    var byteA, byteB;
    const ioData = new IOBuffer_1(imgData.data);
    let offset = 0; // Current off set in the ioData
    let relOffset = 0, iOffset = 8;
    io.mark();
    byteB = ioData.readUint8();
    for (var i = imgData.height - 1; i >= 0; i--) {
        const lastRow = (i === 0);
        io.reset();
        io.skip(i * rowSize);
        for (var j = 0; j < dataRowSize; j++) {
            const lastCol = (j === dataRowSize - 1);
            if (relOffset <= bitSkip && lastCol) {
                // no need to read new data
                io.writeByte((byteB << relOffset));
                if ((bitSkip === 0 || bitSkip === relOffset) && !lastRow) {
                    byteA = byteB;
                    byteB = ioData.readByte();
                }
            } else if (relOffset === 0) {
                byteA = byteB;
                byteB = ioData.readUint8();
                io.writeByte(byteA);
            } else {
                byteA = byteB;
                byteB = ioData.readUint8();
                io.writeByte(((byteA << relOffset) & tableLeft[relOffset]) | (byteB >> iOffset));
            }
            if (lastCol) {
                offset += (bitOverflow || 8);
                io.skip(skipSize);
                relOffset = offset % 8;
                iOffset = 8 - relOffset;
            } else {
                offset += 8;
            }
        }
    }
    if (rowSize > dataRowSize) {
        // make sure last written byte is correct
        io.reset();
        io.skip(totalBytes - 1);
        io.writeUint8(0);
    }

}

function writeColorTable(io, imgData) {
    // Color table is optional for bitDepth >= 8
    if (imgData.bitDepth > 8) return;
    // We only handle 1-bit images
    io
        .writeUint32(0x00000000) // black
        .writeUint32(0x00ffffff); //white
}

function writeBitmapFileHeader(io, imageOffset) {
    // 14 bytes bitmap file header
    io.writeChars('BM');
    // Size of BMP file in bytes
    io.writeInt32(io._lastWrittenByte);
    io.writeUint16(0);
    io.writeUint16(0);
    io.writeUint32(imageOffset);
}

function writeBitmapV5Header(io, imgData) {
    // Size of the header
    io
        .writeUint32(124)   // Header size
        .writeInt32(imgData.width) // bV5Width
        .writeInt32(imgData.height) // bV5Height
        .writeUint16(1)               // bv5Planes - must be set to 1
        .writeUint16(imgData.bitDepth) // bV5BitCount
        .writeUint32(constants.BITMAPV5HEADER.Compression.BI_RGB)  // bV5Compression - No compression
        .writeUint32(imgData.width * imgData.height * imgData.bitDepth) // bv5SizeImage - buffer size (optional if uncompressed)
        .writeInt32(0)  // bV5XPelsPerMeter - resolution
        .writeInt32(0)  // bV5YPelsPerMeter - resolution
        .writeUint32(Math.pow(2, imgData.bitDepth))
        .writeUint32(Math.pow(2, imgData.bitDepth))
        .writeUint32(0xff000000) // bV5RedMask
        .writeUint32(0x00ff0000) // bV5GreenMask
        .writeUint32(0x0000ff00) // bV5BlueMask
        .writeUint32(0x000000ff) // bV5AlphaMask
        .writeUint32(constants.BITMAPV5HEADER.LogicalColorSpace.LCS_sRGB)
        .skip(36)                // bV5Endpoints
        .skip(12)                // bV5GammaRed, Green, Blue
        .writeUint32(constants.BITMAPV5HEADER.GamutMappingIntent.LCS_GM_IMAGES)
        .skip(12);               // ProfileData, ProfileSize, Reserved
}

var encode = encode$1;

const defaultByteLength$1 = 1024 * 8;
const charArray$1 = [];

/**
 * IOBuffer
 * @constructor
 * @param {undefined|number|ArrayBuffer|TypedArray|IOBuffer|Buffer} data - The data to construct the IOBuffer with.
 *
 * If it's a number, it will initialize the buffer with the number as the buffer's length<br>
 * If it's undefined, it will initialize the buffer with a default length of 8 Kb<br>
 * If its an ArrayBuffer, a TypedArray, an IOBuffer instance,
 * or a Node.js Buffer, it will create a view over the underlying ArrayBuffer.
 * @param {object} [options]
 * @param {number} [options.offset=0] - Ignore the first n bytes of the ArrayBuffer
 * @property {ArrayBuffer} buffer - Reference to the internal ArrayBuffer object
 * @property {number} length - Byte length of the internal ArrayBuffer
 * @property {number} offset - The current offset of the buffer's pointer
 * @property {number} byteLength - Byte length of the internal ArrayBuffer
 * @property {number} byteOffset - Byte offset of the internal ArrayBuffer
 */
class IOBuffer$2 {
    constructor(data, options) {
        options = options || {};
        var dataIsGiven = false;
        if (data === undefined) {
            data = defaultByteLength$1;
        }
        if (typeof data === 'number') {
            data = new ArrayBuffer(data);
        } else {
            dataIsGiven = true;
            this._lastWrittenByte = data.byteLength;
        }

        const offset = options.offset ? options.offset >>> 0 : 0;
        let byteLength = data.byteLength - offset;
        let dvOffset = offset;
        if (data.buffer) {
            if (data.byteLength !== data.buffer.byteLength) {
                dvOffset = data.byteOffset + offset;
            }
            data = data.buffer;
        }
        if (dataIsGiven) {
            this._lastWrittenByte = byteLength;
        } else {
            this._lastWrittenByte = 0;
        }
        this.buffer = data;
        this.length = byteLength;
        this.byteLength = byteLength;
        this.byteOffset = dvOffset;
        this.offset = 0;
        this.littleEndian = true;
        this._data = new DataView(this.buffer, dvOffset, byteLength);
        this._mark = 0;
        this._marks = [];
    }

    /**
     * Checks if the memory allocated to the buffer is sufficient to store more bytes after the offset
     * @param {number} [byteLength=1] The needed memory in bytes
     * @return {boolean} Returns true if there is sufficient space and false otherwise
     */
    available(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        return (this.offset + byteLength) <= this.length;
    }

    /**
     * Check if little-endian mode is used for reading and writing multi-byte values
     * @return {boolean} Returns true if little-endian mode is used, false otherwise
     */
    isLittleEndian() {
        return this.littleEndian;
    }

    /**
     * Set little-endian mode for reading and writing multi-byte values
     * @return {IOBuffer}
     */
    setLittleEndian() {
        this.littleEndian = true;
        return this;
    }

    /**
     * Check if big-endian mode is used for reading and writing multi-byte values
     * @return {boolean} Returns true if big-endian mode is used, false otherwise
     */
    isBigEndian() {
        return !this.littleEndian;
    }

    /**
     * Switches to big-endian mode for reading and writing multi-byte values
     * @return {IOBuffer}
     */
    setBigEndian() {
        this.littleEndian = false;
        return this;
    }

    /**
     * Move the pointer n bytes forward
     * @param {number} n
     * @return {IOBuffer}
     */
    skip(n) {
        if (n === undefined) n = 1;
        this.offset += n;
        return this;
    }

    /**
     * Move the pointer to the given offset
     * @param {number} offset
     * @return {IOBuffer}
     */
    seek(offset) {
        this.offset = offset;
        return this;
    }

    /**
     * Store the current pointer offset.
     * @see {@link IOBuffer#reset}
     * @return {IOBuffer}
     */
    mark() {
        this._mark = this.offset;
        return this;
    }

    /**
     * Move the pointer back to the last pointer offset set by mark
     * @see {@link IOBuffer#mark}
     * @return {IOBuffer}
     */
    reset() {
        this.offset = this._mark;
        return this;
    }

    /**
     * Push the current pointer offset to the mark stack
     * @see {@link IOBuffer#popMark}
     * @return {IOBuffer}
     */
    pushMark() {
        this._marks.push(this.offset);
        return this;
    }

    /**
     * Pop the last pointer offset from the mark stack, and set the current pointer offset to the popped value
     * @see {@link IOBuffer#pushMark}
     * @return {IOBuffer}
     */
    popMark() {
        const offset = this._marks.pop();
        if (offset === undefined) throw new Error('Mark stack empty');
        this.seek(offset);
        return this;
    }

    /**
     * Move the pointer offset back to 0
     * @return {IOBuffer}
     */
    rewind() {
        this.offset = 0;
        return this;
    }

    /**
     * Make sure the buffer has sufficient memory to write a given byteLength at the current pointer offset
     * If the buffer's memory is insufficient, this method will create a new buffer (a copy) with a length
     * that is twice (byteLength + current offset)
     * @param {number} [byteLength = 1]
     * @return {IOBuffer}
     */
    ensureAvailable(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        if (!this.available(byteLength)) {
            const lengthNeeded = this.offset + byteLength;
            const newLength = lengthNeeded * 2;
            const newArray = new Uint8Array(newLength);
            newArray.set(new Uint8Array(this.buffer));
            this.buffer = newArray.buffer;
            this.length = this.byteLength = newLength;
            this._data = new DataView(this.buffer);
        }
        return this;
    }

    /**
     * Read a byte and return false if the byte's value is 0, or true otherwise
     * Moves pointer forward
     * @return {boolean}
     */
    readBoolean() {
        return this.readUint8() !== 0;
    }

    /**
     * Read a signed 8-bit integer and move pointer forward
     * @return {number}
     */
    readInt8() {
        return this._data.getInt8(this.offset++);
    }

    /**
     * Read an unsigned 8-bit integer and move pointer forward
     * @return {number}
     */
    readUint8() {
        return this._data.getUint8(this.offset++);
    }

    /**
     * Alias for {@link IOBuffer#readUint8}
     * @return {number}
     */
    readByte() {
        return this.readUint8();
    }

    /**
     * Read n bytes and move pointer forward.
     * @param {number} n
     * @return {Uint8Array}
     */
    readBytes(n) {
        if (n === undefined) n = 1;
        var bytes = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            bytes[i] = this.readByte();
        }
        return bytes;
    }

    /**
     * Read a 16-bit signed integer and move pointer forward
     * @return {number}
     */
    readInt16() {
        var value = this._data.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    /**
     * Read a 16-bit unsigned integer and move pointer forward
     * @return {number}
     */
    readUint16() {
        var value = this._data.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    /**
     * Read a 32-bit signed integer and move pointer forward
     * @return {number}
     */
    readInt32() {
        var value = this._data.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 32-bit unsigned integer and move pointer forward
     * @return {number}
     */
    readUint32() {
        var value = this._data.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 32-bit floating number and move pointer forward
     * @return {number}
     */
    readFloat32() {
        var value = this._data.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    /**
     * Read a 64-bit floating number and move pointer forward
     * @return {number}
     */
    readFloat64() {
        var value = this._data.getFloat64(this.offset, this.littleEndian);
        this.offset += 8;
        return value;
    }

    /**
     * Read 1-byte ascii character and move pointer forward
     * @return {string}
     */
    readChar() {
        return String.fromCharCode(this.readInt8());
    }

    /**
     * Read n 1-byte ascii characters and move pointer forward
     * @param {number} n
     * @return {string}
     */
    readChars(n) {
        if (n === undefined) n = 1;
        charArray$1.length = n;
        for (var i = 0; i < n; i++) {
            charArray$1[i] = this.readChar();
        }
        return charArray$1.join('');
    }

    /**
     * Read the next n bytes, return a UTF-8 decoded string and move pointer forward
     * @param {number} n
     * @return {string}
     */
    readUtf8(n) {
        if (n === undefined) n = 1;
        const bString = this.readChars(n);
        return utf8.decode(bString);
    }

    /**
     * Write 0xff if the passed value is truthy, 0x00 otherwise
     * @param {any} value
     * @return {IOBuffer}
     */
    writeBoolean(value) {
        this.writeUint8(value ? 0xff : 0x00);
        return this;
    }

    /**
     * Write value as an 8-bit signed integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt8(value) {
        this.ensureAvailable(1);
        this._data.setInt8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as a 8-bit unsigned integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeUint8(value) {
        this.ensureAvailable(1);
        this._data.setUint8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * An alias for {@link IOBuffer#writeUint8}
     * @param {number} value
     * @return {IOBuffer}
     */
    writeByte(value) {
        return this.writeUint8(value);
    }

    /**
     * Write bytes
     * @param {Array|Uint8Array} bytes
     * @return {IOBuffer}
     */
    writeBytes(bytes) {
        this.ensureAvailable(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            this._data.setUint8(this.offset++, bytes[i]);
        }
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as an 16-bit signed integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt16(value) {
        this.ensureAvailable(2);
        this._data.setInt16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write value as a 16-bit unsigned integer
     * @param {number} value
     * @return {IOBuffer}
     */
    writeUint16(value) {
        this.ensureAvailable(2);
        this._data.setUint16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit signed integer at the current pointer offset
     * @param {number} value
     * @return {IOBuffer}
     */
    writeInt32(value) {
        this.ensureAvailable(4);
        this._data.setInt32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit unsigned integer at the current pointer offset
     * @param {number} value - The value to set
     * @return {IOBuffer}
     */
    writeUint32(value) {
        this.ensureAvailable(4);
        this._data.setUint32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 32-bit floating number at the current pointer offset
     * @param {number} value - The value to set
     * @return {IOBuffer}
     */
    writeFloat32(value) {
        this.ensureAvailable(4);
        this._data.setFloat32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write a 64-bit floating number at the current pointer offset
     * @param {number} value
     * @return {IOBuffer}
     */
    writeFloat64(value) {
        this.ensureAvailable(8);
        this._data.setFloat64(this.offset, value, this.littleEndian);
        this.offset += 8;
        this._updateLastWrittenByte();
        return this;
    }

    /**
     * Write the charCode of the passed string's first character to the current pointer offset
     * @param {string} str - The character to set
     * @return {IOBuffer}
     */
    writeChar(str) {
        return this.writeUint8(str.charCodeAt(0));
    }

    /**
     * Write the charCodes of the passed string's characters to the current pointer offset
     * @param {string} str
     * @return {IOBuffer}
     */
    writeChars(str) {
        for (var i = 0; i < str.length; i++) {
            this.writeUint8(str.charCodeAt(i));
        }
        return this;
    }

    /**
     * UTF-8 encode and write the passed string to the current pointer offset
     * @param {string} str
     * @return {IOBuffer}
     */
    writeUtf8(str) {
        const bString = utf8.encode(str);
        return this.writeChars(bString);
    }

    /**
     * Export a Uint8Array view of the internal buffer.
     * The view starts at the byte offset and its length
     * is calculated to stop at the last written byte or the original length.
     * @return {Uint8Array}
     */
    toArray() {
        return new Uint8Array(this.buffer, this.byteOffset, this._lastWrittenByte);
    }

    /**
     * Same as {@link IOBuffer#toArray} but returns a Buffer if possible. Otherwise returns a Uint8Array.
     * @return {Buffer|Uint8Array}
     */
    getBuffer() {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(this.toArray());
        } else {
            return this.toArray();
        }
    }

    /**
     * Update the last written byte offset
     * @private
     */
    _updateLastWrittenByte() {
        if (this.offset > this._lastWrittenByte) {
            this._lastWrittenByte = this.offset;
        }
    }
}

var IOBuffer_1$2 = IOBuffer$2;

var common = createCommonjsModule(function (module, exports) {
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function (chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function (chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);
});

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.



/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED$1               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN$1             = 2;

/*============================================================================*/


function zero$1(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH$1    = 3;
var MAX_MATCH$1    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES$1  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS$1      = 256;
/* number of literal bytes 0..255 */

var L_CODES$1       = LITERALS$1 + 1 + LENGTH_CODES$1;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES$1       = 30;
/* number of distance codes */

var BL_CODES$1      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE$1     = 2 * L_CODES$1 + 1;
/* maximum heap size */

var MAX_BITS$1      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

/* eslint-disable comma-spacing,array-bracket-spacing */
var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* eslint-enable comma-spacing,array-bracket-spacing */

/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES$1);
zero$1(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES$1);
zero$1(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
}


var static_l_desc;
var static_d_desc;
var static_bl_desc;


function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
}



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short(s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m * 2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
        tree[m * 2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS$1 + 1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS$1; bits++) {
    next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n * 2 + 1];
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS$1 + 1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1 << extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length - 1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1 << extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1]/*.Len*/ = 5;
    static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES$1, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES$1;  n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES$1;  n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES$1; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  common.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n * 2;
  var _m2 = m * 2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n * 2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node * 2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0 * 2 + 1]; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0 * 2 + 1]; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes - 1,   5);
  send_bits(s, blcodes - 4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
    static_lenb = (s.static_len + 3 + 7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc * 2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize - 1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

var _tr_init_1  = _tr_init;
var _tr_stored_block_1 = _tr_stored_block;
var _tr_flush_block_1  = _tr_flush_block;
var _tr_tally_1 = _tr_tally;
var _tr_align_1 = _tr_align;

var trees = {
	_tr_init: _tr_init_1,
	_tr_stored_block: _tr_stored_block_1,
	_tr_flush_block: _tr_flush_block_1,
	_tr_tally: _tr_tally_1,
	_tr_align: _tr_align_1
};

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


var adler32_1 = adler32;

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc ^= -1;

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


var crc32_1 = crc32;

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var messages = {
  2:      'need dictionary',     /* Z_NEED_DICT       2  */
  1:      'stream end',          /* Z_STREAM_END      1  */
  0:      '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.







/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH$1      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH$1        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK$1            = 0;
var Z_STREAM_END$1    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION$1 = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY$1    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED$1  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2 * L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = messages[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  common.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only(s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  // zmemcpy(buf, strm->next_in, len);
  common.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      common.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH$1) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH$1) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
  if (flush === Z_FINISH$1) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$1) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH - 1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$1) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$1) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$1) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$1) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$1) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED$1; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new common.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new common.Buf16((2 * D_CODES + 1) * 2);
  this.bl_tree    = new common.Buf16((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new common.Buf16(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new common.Buf16(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new common.Buf16(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH$1;
  trees._tr_init(s);
  return Z_OK$1;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK$1) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK$1;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION$1) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$1 ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new common.Buf8(s.w_size * 2);
  s.head = new common.Buf16(s.hash_size);
  s.prev = new common.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;

  //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
  //s->pending_buf = (uchf *) overlay;
  s.pending_buf = new common.Buf8(s.pending_buf_size);

  // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
  //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
  s.d_buf = 1 * s.lit_bufsize;

  //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED$1, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
}


function deflate$1(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH$1)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED$1 + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK$1;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH$1) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH$1 && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK$1;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK$1;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH$1) { return Z_OK$1; }
  if (s.wrap <= 0) { return Z_STREAM_END$1; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK$1 : Z_STREAM_END$1;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK$1;
}


/* =========================================================================
 * Initializes the compression dictionary from the given byte
 * sequence without producing any compressed output.
 */
function deflateSetDictionary(strm, dictionary) {
  var dictLength = dictionary.length;

  var s;
  var str, n;
  var wrap;
  var avail;
  var next;
  var input;
  var tmpDict;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  s = strm.state;
  wrap = s.wrap;

  if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
    return Z_STREAM_ERROR;
  }

  /* when using zlib wrappers, compute Adler-32 for provided dictionary */
  if (wrap === 1) {
    /* adler32(strm->adler, dictionary, dictLength); */
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }

  s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

  /* if dictionary would fill window, just replace the history */
  if (dictLength >= s.w_size) {
    if (wrap === 0) {            /* already empty otherwise */
      /*** CLEAR_HASH(s); ***/
      zero(s.head); // Fill with NIL (= 0);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    /* use the tail */
    // dictionary = dictionary.slice(dictLength - s.w_size);
    tmpDict = new common.Buf8(s.w_size);
    common.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  /* insert dictionary into window and hash */
  avail = strm.avail_in;
  next = strm.next_in;
  input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    str = s.strstart;
    n = s.lookahead - (MIN_MATCH - 1);
    do {
      /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

      s.prev[str & s.w_mask] = s.head[s.ins_h];

      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK$1;
}


var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$1;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

var deflate_1$2 = {
	deflateInit: deflateInit_1,
	deflateInit2: deflateInit2_1,
	deflateReset: deflateReset_1,
	deflateResetKeep: deflateResetKeep_1,
	deflateSetHeader: deflateSetHeader_1,
	deflate: deflate_2$1,
	deflateEnd: deflateEnd_1,
	deflateSetDictionary: deflateSetDictionary_1,
	deflateInfo: deflateInfo
};

// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [ 0 ]); } catch (__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new common.Buf8(256);
for (var q = 0; q < 256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


// convert string to array (typed, when possible)
var string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new common.Buf8(buf_len);

  // convert
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, common.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for (var i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
var buf2binstring_1 = function (buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
var binstring2buf = function (str) {
  var buf = new common.Buf8(str.length);
  for (var i = 0, len = buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
var buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len * 2);

  for (out = 0, i = 0; i < len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = function (buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max - 1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

var strings = {
	string2buf: string2buf,
	buf2binstring: buf2binstring_1,
	binstring2buf: binstring2buf,
	buf2string: buf2string,
	utf8border: utf8border
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

var zstream = ZStream;

var toString$1 = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_SYNC_FLUSH    = 2;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
 * push a chunk with explicit flush (call [[Deflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
function Deflate(options) {
  if (!(this instanceof Deflate)) return new Deflate(options);

  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = deflate_1$2.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }

  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }

  if (opt.dictionary) {
    var dict;
    // Convert data if needed
    if (typeof opt.dictionary === 'string') {
      // If we need to compress text, change encoding to utf8.
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === '[object ArrayBuffer]') {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }

    status = deflate_1$2.deflateSetDictionary(this.strm, dict);

    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }

    this._dict_set = true;
  }
}

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the compression context.
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function (data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else if (toString$1.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new common.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = deflate_1$2.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(common.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(common.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = deflate_1$2.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === Z_SYNC_FLUSH) {
    this.onEnd(Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function (status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate algorithm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 * - dictionary
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg || messages[deflator.err]; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


var Deflate_1 = Deflate;
var deflate_2 = deflate;
var deflateRaw_1 = deflateRaw;
var gzip_1 = gzip;

var deflate_1 = {
	Deflate: Deflate_1,
	deflate: deflate_2,
	deflateRaw: deflateRaw_1,
	gzip: gzip_1
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

// See state defs from inflate.js
var BAD$1 = 30;       /* got a data error -- remain here until reset */
var TYPE$1 = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
var inffast = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  var s_window;               /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD$1;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD$1;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD$1;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE$1;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD$1;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.



var MAXBITS = 15;
var ENOUGH_LENS$1 = 852;
var ENOUGH_DISTS$1 = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES$1 = 0;
var LENS$1 = 1;
var DISTS$1 = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

var inftrees = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new common.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new common.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES$1 || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES$1) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS$1) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
    (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
    return 1;
  }

  /* process all codes and make table entries */
  for (;;) {
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
        (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.







var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH$2        = 4;
var Z_BLOCK$1         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK$2            = 0;
var Z_STREAM_END$2    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR$1  = -2;
var Z_DATA_ERROR$1    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR$1     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED$2  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var HEAD = 1;       /* i: waiting for magic header */
var FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var TIME = 3;       /* i: waiting for modification time (gzip) */
var OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var EXLEN = 5;      /* i: waiting for extra length (gzip) */
var EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var NAME = 7;       /* i: waiting for end of file name (gzip) */
var COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var HCRC = 9;       /* i: waiting for header crc (gzip) */
var DICTID = 10;    /* i: waiting for dictionary check value */
var DICT = 11;      /* waiting for inflateSetDictionary() call */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var STORED = 14;    /* i: waiting for stored size (length and complement) */
var COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var TABLE = 17;     /* i: waiting for dynamic block table lengths */
var LENLENS = 18;   /* i: waiting for code length code lengths */
var CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var LEN_ = 20;      /* i: same as LEN below, but only first time in */
var LEN = 21;       /* i: waiting for length/lit/eob code */
var LENEXT = 22;    /* i: waiting for length extra bits */
var DIST = 23;      /* i: waiting for distance code */
var DISTEXT = 24;   /* i: waiting for distance extra bits */
var MATCH = 25;     /* o: waiting for output space to copy string */
var LIT = 26;       /* o: waiting for output space to write literal */
var CHECK = 27;     /* i: waiting for 32-bit check value */
var LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var DONE = 29;      /* finished check, done -- remain here until reset */
var BAD = 30;       /* got a data error -- remain here until reset */
var MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS$1 = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS$1;


function zswap32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new common.Buf16(320); /* temporary storage for code lengths */
  this.work = new common.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR$1; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new common.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new common.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK$2;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR$1; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR$1; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR$1; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$2) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix;
var distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new common.Buf32(512);
    distfix = new common.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inftrees(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inftrees(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new common.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    common.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    common.arraySet(state.window, src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      common.arraySet(state.window, src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate$1(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new common.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR$1;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK$2;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32_1(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED$2) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED$2) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32_1(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32_1(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32_1(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32_1(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            common.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32_1(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32_1(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32_1(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = zswap32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK$1 || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        common.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = { bits: state.lenbits };
      ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = { bits: state.lenbits };
      ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = { bits: state.distbits };
      ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inffast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
        if ((state.flags ? hold : zswap32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END$2;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR$1;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR$1;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH$2))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH$2) && ret === Z_OK$2) {
    ret = Z_BUF_ERROR$1;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR$1;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK$2;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR$1; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR$1; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK$2;
}

function inflateSetDictionary(strm, dictionary) {
  var dictLength = dictionary.length;

  var state;
  var dictid;
  var ret;

  /* check state */
  if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR$1; }
  state = strm.state;

  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }

  /* check for correct dictionary identifier */
  if (state.mode === DICT) {
    dictid = 1; /* adler32(0, null, 0)*/
    /* dictid = adler32(dictid, dictionary, dictLength); */
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR$1;
    }
  }
  /* copy dictionary to window using updatewindow(), which will amend the
   existing dictionary if appropriate */
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR;
  }
  state.havedict = 1;
  // Tracev((stderr, "inflate:   dictionary set\n"));
  return Z_OK$2;
}

var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$1;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

var inflate_1$2 = {
	inflateReset: inflateReset_1,
	inflateReset2: inflateReset2_1,
	inflateResetKeep: inflateResetKeep_1,
	inflateInit: inflateInit_1,
	inflateInit2: inflateInit2_1,
	inflate: inflate_2$1,
	inflateEnd: inflateEnd_1,
	inflateGetHeader: inflateGetHeader_1,
	inflateSetDictionary: inflateSetDictionary_1,
	inflateInfo: inflateInfo
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var constants$3 = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

var gzheader = GZheader;

var toString$2 = Object.prototype.toString;

/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
 * push a chunk with explicit flush (call [[Inflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
function Inflate(options) {
  if (!(this instanceof Inflate)) return new Inflate(options);

  this.options = common.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = inflate_1$2.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== constants$3.Z_OK) {
    throw new Error(messages[status]);
  }

  this.header = new gzheader();

  inflate_1$2.inflateGetHeader(this.strm, this.header);
}

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the decompression context.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function (data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var dictionary = this.options.dictionary;
  var status, _mode;
  var next_out_utf8, tail, utf8str;
  var dict;

  // Flag to properly process Z_BUF_ERROR on testing inflate call
  // when we check that all output data was flushed.
  var allowBufError = false;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? constants$3.Z_FINISH : constants$3.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else if (toString$2.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new common.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = inflate_1$2.inflate(strm, constants$3.Z_NO_FLUSH);    /* no bad return value */

    if (status === constants$3.Z_NEED_DICT && dictionary) {
      // Convert data if needed
      if (typeof dictionary === 'string') {
        dict = strings.string2buf(dictionary);
      } else if (toString$2.call(dictionary) === '[object ArrayBuffer]') {
        dict = new Uint8Array(dictionary);
      } else {
        dict = dictionary;
      }

      status = inflate_1$2.inflateSetDictionary(this.strm, dict);

    }

    if (status === constants$3.Z_BUF_ERROR && allowBufError === true) {
      status = constants$3.Z_OK;
      allowBufError = false;
    }

    if (status !== constants$3.Z_STREAM_END && status !== constants$3.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === constants$3.Z_STREAM_END || (strm.avail_in === 0 && (_mode === constants$3.Z_FINISH || _mode === constants$3.Z_SYNC_FLUSH))) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { common.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(common.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }

    // When no more input data, we should check that internal inflate buffers
    // are flushed. The only way to do it when avail_out = 0 - run one more
    // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
    // Here we set flag to process this error properly.
    //
    // NOTE. Deflate does not return error in this case and does not needs such
    // logic.
    if (strm.avail_in === 0 && strm.avail_out === 0) {
      allowBufError = true;
    }

  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== constants$3.Z_STREAM_END);

  if (status === constants$3.Z_STREAM_END) {
    _mode = constants$3.Z_FINISH;
  }

  // Finalize on the last chunk.
  if (_mode === constants$3.Z_FINISH) {
    status = inflate_1$2.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === constants$3.Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === constants$3.Z_SYNC_FLUSH) {
    this.onEnd(constants$3.Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function (status) {
  // On success - join
  if (status === constants$3.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg || messages[inflator.err]; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


var Inflate_1 = Inflate;
var inflate_2 = inflate;
var inflateRaw_1 = inflateRaw;
var ungzip  = inflate;

var inflate_1 = {
	Inflate: Inflate_1,
	inflate: inflate_2,
	inflateRaw: inflateRaw_1,
	ungzip: ungzip
};

var assign    = common.assign;





var pako = {};

assign(pako, deflate_1, inflate_1, constants$3);

var index$9 = pako;

var index_2 = index$9.Inflate;
var index_3 = index$9.deflate;

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

const crcTable$1 = [];
for (let n = 0; n < 256; n++) {
    var c$1 = n;
    for (let k = 0; k < 8; k++) {
        if (c$1 & 1) {
            c$1 = 0xedb88320 ^ (c$1 >>> 1);
        } else {
            c$1 = c$1 >>> 1;
        }
    }
    crcTable$1[n] = c$1;
}

const initialCrc = 0xffffffff;
function updateCrc(crc, data, length) {
    var c = crc;
    for (var n = 0; n < length; n++) {
        c = crcTable$1[(c ^ data[n]) & 0xff] ^ (c >>> 8);
    }
    return c;
}

function crc(data, length) {
    return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
}

const empty = new Uint8Array(0);
const NULL = '\0';

const uint16 = new Uint16Array([0x00ff]);
const uint8 = new Uint8Array(uint16.buffer);
const osIsLittleEndian = uint8[0] === 0xff;

class PNGDecoder extends IOBuffer_1$2 {
    constructor(data, options) {
        super(data);
        const {
            checkCrc = false
        } = options;
        this._checkCrc = checkCrc;
        this._inflator = new index_2();
        this._png = null;
        this._end = false;
        // PNG is always big endian
        // https://www.w3.org/TR/PNG/#7Integers-and-byte-order
        this.setBigEndian();
    }

    decode() {
        this._png = {
            text: {}
        };
        this.decodeSignature();
        while (!this._end) {
            this.decodeChunk();
        }
        this.decodeImage();
        return this._png;
    }

    // https://www.w3.org/TR/PNG/#5PNG-file-signature
    decodeSignature() {
        for (var i = 0; i < pngSignature.length; i++) {
            if (this.readUint8() !== pngSignature[i]) {
                throw new Error(`wrong PNG signature. Byte at ${i} should be ${pngSignature[i]}.`);
            }
        }
    }

    // https://www.w3.org/TR/PNG/#5Chunk-layout
    decodeChunk() {
        const length = this.readUint32();
        const type = this.readChars(4);
        const offset = this.offset;
        switch (type) {
            // 11.2 Critical chunks
            case 'IHDR': // 11.2.2 IHDR Image header
                this.decodeIHDR();
                break;
            case 'PLTE': // 11.2.3 PLTE Palette
                this.decodePLTE(length);
                break;
            case 'IDAT': // 11.2.4 IDAT Image data
                this.decodeIDAT(length);
                break;
            case 'IEND': // 11.2.5 IEND Image trailer
                this._end = true;
                break;
            // 11.3 Ancillary chunks
            case 'tEXt': // 11.3.4.3 tEXt Textual data
                this.decodetEXt(length);
                break;
            case 'pHYs': // 11.3.5.3 pHYs Physical pixel dimensions
                this.decodepHYs();
                break;
            default:
                this.skip(length);
                break;
        }
        if (this.offset - offset !== length) {
            throw new Error(`Length mismatch while decoding chunk ${type}`);
        }
        if (this._checkCrc) {
            const expectedCrc = this.readUint32();
            const crcLength = length + 4; // includes type
            const actualCrc = crc(new Uint8Array(this.buffer, this.byteOffset + this.offset - crcLength - 4, crcLength), crcLength); // "- 4" because we already advanced by reading the CRC
            if (actualCrc !== expectedCrc) {
                throw new Error(`CRC mismatch for chunk ${type}. Expected ${expectedCrc}, found ${actualCrc}`);
            }
        } else {
            this.skip(4);
        }
    }

    // https://www.w3.org/TR/PNG/#11IHDR
    decodeIHDR() {
        var image = this._png;
        image.width = this.readUint32();
        image.height = this.readUint32();
        image.bitDepth = this.readUint8();
        image.colourType = this.readUint8();
        image.compressionMethod = this.readUint8();
        image.filterMethod = this.readUint8();
        image.interlaceMethod = this.readUint8();
        if (this._png.compressionMethod !== 0) {
            throw new Error('Unsupported compression method: ' + image.compressionMethod);
        }
    }

    // https://www.w3.org/TR/PNG/#11PLTE
    decodePLTE(length) {
        if (length % 3 !== 0) {
            throw new RangeError('PLTE field length must be a multiple of 3. Got ' + length);
        }
        var l = length / 3;
        this._hasPalette = true;
        var palette = this._palette = new Array(l);
        for (var i = 0; i < l; i++) {
            palette[i] = [this.readUint8(), this.readUint8(), this.readUint8()];
        }
    }

    // https://www.w3.org/TR/PNG/#11IDAT
    decodeIDAT(length) {
        this._inflator.push(new Uint8Array(this.buffer, this.offset + this.byteOffset, length), false);
        this.skip(length);
    }

    // https://www.w3.org/TR/PNG/#11tEXt
    decodetEXt(length) {
        var keyword = '';
        var char;
        while ((char = this.readChar()) !== NULL) {
            keyword += char;
        }
        this._png.text[keyword] = this.readChars(length - keyword.length - 1);
    }

    // https://www.w3.org/TR/PNG/#11pHYs
    decodepHYs() {
        const ppuX = this.readUint32();
        const ppuY = this.readUint32();
        const unitSpecifier = this.readByte();
        this._png.resolution = [ppuX, ppuY];
        this._png.unitSpecifier = unitSpecifier;
    }

    decodeImage() {
        this._inflator.push(empty, true);
        if (this._inflator.err) {
            throw new Error('Error while decompressing the data: ' + this._inflator.err);
        }
        var data = this._inflator.result;
        this._inflator = null;

        if (this._png.filterMethod !== 0) {
            throw new Error('Filter method ' + this._png.filterMethod + ' not supported');
        }

        if (this._png.interlaceMethod === 0) {
            this.decodeInterlaceNull(data);
        } else {
            throw new Error('Interlace method ' + this._png.interlaceMethod + ' not supported');
        }
    }

    decodeInterlaceNull(data) {

        var channels;
        switch (this._png.colourType) {
            case 0: channels = 1; break;
            case 2: channels = 3; break;
            case 3:
                if (!this._hasPalette) throw new Error('Missing palette');
                channels = 1;
                break;
            case 4: channels = 2; break;
            case 6: channels = 4; break;
            default: throw new Error('Unknown colour type: ' + this._png.colourType);
        }

        const height = this._png.height;
        const bytesPerPixel = channels * this._png.bitDepth / 8;
        const bytesPerLine = this._png.width * bytesPerPixel;
        const newData = new Uint8Array(this._png.height * bytesPerLine);

        var prevLine = empty;
        var offset = 0;
        var currentLine, newLine;

        for (var i = 0; i < height; i++) {
            currentLine = data.subarray(offset + 1, offset + 1 + bytesPerLine);
            newLine = newData.subarray(i * bytesPerLine, (i + 1) * bytesPerLine);
            switch (data[offset]) {
                case 0:
                    unfilterNone(currentLine, newLine, bytesPerLine);
                    break;
                case 1:
                    unfilterSub(currentLine, newLine, bytesPerLine, bytesPerPixel);
                    break;
                case 2:
                    unfilterUp(currentLine, newLine, prevLine, bytesPerLine);
                    break;
                case 3:
                    unfilterAverage(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel);
                    break;
                case 4:
                    unfilterPaeth(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel);
                    break;
                default: throw new Error('Unsupported filter: ' + data[offset]);
            }
            prevLine = newLine;
            offset += bytesPerLine + 1;
        }

        if (this._hasPalette) {
            this._png.palette = this._palette;
        }

        if (this._png.bitDepth === 16) {
            const uint16Data = new Uint16Array(newData.buffer);
            if (osIsLittleEndian) {
                for (var k = 0; k < uint16Data.length; k++) {
                    // PNG is always big endian. Swap the bytes.
                    uint16Data[k] = swap16(uint16Data[k]);
                }
            }
            this._png.data = uint16Data;
        } else {
            this._png.data = newData;
        }
    }


}

function unfilterNone(currentLine, newLine, bytesPerLine) {
    for (var i = 0; i < bytesPerLine; i++) {
        newLine[i] = currentLine[i];
    }
}

function unfilterSub(currentLine, newLine, bytesPerLine, bytesPerPixel) {
    var i = 0;
    for (; i < bytesPerPixel; i++) {
        // just copy first bytes
        newLine[i] = currentLine[i];
    }
    for (; i < bytesPerLine; i++) {
        newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xFF;
    }
}

function unfilterUp(currentLine, newLine, prevLine, bytesPerLine) {
    var i = 0;
    if (prevLine.length === 0) {
        // just copy bytes for first line
        for (; i < bytesPerLine; i++) {
            newLine[i] = currentLine[i];
        }
    } else {
        for (; i < bytesPerLine; i++) {
            newLine[i] = (currentLine[i] + prevLine[i]) & 0xFF;
        }
    }
}

function unfilterAverage(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel) {
    var i = 0;
    if (prevLine.length === 0) {
        for (; i < bytesPerPixel; i++) {
            newLine[i] = currentLine[i];
        }
        for (; i < bytesPerLine; i++) {
            newLine[i] = (currentLine[i] + (newLine[i - bytesPerPixel] >> 1)) & 0xFF;
        }
    } else {
        for (; i < bytesPerPixel; i++) {
            newLine[i] = (currentLine[i] + (prevLine[i] >> 1)) & 0xFF;
        }
        for (; i < bytesPerLine; i++) {
            newLine[i] = (currentLine[i] + ((newLine[i - bytesPerPixel] + prevLine[i]) >> 1)) & 0xFF;
        }
    }
}

function unfilterPaeth(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel) {
    var i = 0;
    if (prevLine.length === 0) {
        for (; i < bytesPerPixel; i++) {
            newLine[i] = currentLine[i];
        }
        for (; i < bytesPerLine; i++) {
            newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xFF;
        }
    } else {
        for (; i < bytesPerPixel; i++) {
            newLine[i] = (currentLine[i] + prevLine[i]) & 0xFF;
        }
        for (; i < bytesPerLine; i++) {
            newLine[i] = (currentLine[i] + paethPredictor(newLine[i - bytesPerPixel], prevLine[i], prevLine[i - bytesPerPixel])) & 0xFF;
        }
    }
}

function paethPredictor(a, b, c) {
    var p = a + b - c;
    var pa = Math.abs(p - a);
    var pb = Math.abs(p - b);
    var pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    else if (pb <= pc) return b;
    else return c;
}

function swap16(val) {
    return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
}

class PNGDecoder$1 extends IOBuffer_1$2 {
    constructor(data) {
        super();
        this._checkData(data);
        this.setBigEndian();
    }

    encode() {
        this.encodeSignature();
        this.encodeIHDR();
        this.encodeData();
        this.encodeIEND();
        return this.toArray();
    }

    // https://www.w3.org/TR/PNG/#5PNG-file-signature
    encodeSignature() {
        this.writeBytes(pngSignature);
    }

    // https://www.w3.org/TR/PNG/#11IHDR
    encodeIHDR() {
        this.writeUint32(13);

        this.writeChars('IHDR');

        this.writeUint32(this._png.width);
        this.writeUint32(this._png.height);
        this.writeByte(this._png.bitDepth);
        this.writeByte(this._png.colourType);
        this.writeByte(0); // Compression method
        this.writeByte(0); // Filter method
        this.writeByte(0); // Interlace method

        this.writeCrc(17);
    }

    // https://www.w3.org/TR/PNG/#11IEND
    encodeIEND() {
        this.writeUint32(0);

        this.writeChars('IEND');

        this.writeCrc(4);
    }

    // https://www.w3.org/TR/PNG/#11IDAT
    encodeIDAT(data) {
        this.writeUint32(data.length);

        this.writeChars('IDAT');

        this.writeBytes(data);

        this.writeCrc(data.length + 4);
    }

    encodeData() {
        const {
            width,
            height,
            channels,
            bitDepth,
            data
        } = this._png;
        const slotsPerLine = channels * width;
        const newData = new IOBuffer_1$2().setBigEndian();
        var offset = 0;
        for (var i = 0; i < height; i++) {
            newData.writeByte(0); // no filter
            /* istanbul ignore else */
            if (bitDepth === 8) {
                offset = writeDataBytes(data, newData, slotsPerLine, offset);
            } else if (bitDepth === 16) {
                offset = writeDataUint16(data, newData, slotsPerLine, offset);
            } else {
                throw new Error('unreachable');
            }
        }
        const buffer = newData.getBuffer();
        const compressed = index_3(buffer);
        this.encodeIDAT(compressed);
    }

    _checkData(data) {
        this._png = {
            width: checkInteger(data.width, 'width'),
            height: checkInteger(data.height, 'height'),
            data: data.data
        };
        const {colourType, channels, bitDepth} = getColourType(data);
        this._png.colourType = colourType;
        this._png.channels = channels;
        this._png.bitDepth = bitDepth;
        const expectedSize = this._png.width * this._png.height * channels;
        if (this._png.data.length !== expectedSize) {
            throw new RangeError(`wrong data size. Found ${this._png.data.length}, expected ${expectedSize}`);
        }
    }

    writeCrc(length) {
        this.writeUint32(crc(new Uint8Array(this.buffer, this.byteOffset + this.offset - length, length), length));
    }
}

function checkInteger(value, name) {
    if (Number.isInteger(value) && value > 0) {
        return value;
    }
    throw new TypeError(`${name} must be a positive integer`);
}

function getColourType(data) {
    const {
        components = 3,
        alpha = true,
        bitDepth = 8
    } = data;
    if (components !== 3 && components !== 1) {
        throw new RangeError(`unsupported number of components: ${components}`);
    }
    if (bitDepth !== 8 && bitDepth !== 16) {
        throw new RangeError(`unsupported bit depth: ${bitDepth}`);
    }
    const channels = components + Number(alpha);
    const returnValue = {channels, bitDepth};
    switch (channels) {
        case 4:
            returnValue.colourType = 6;
            break;
        case 3:
            returnValue.colourType = 2;
            break;
        case 1:
            returnValue.colourType = 0;
            break;
        case 2:
            returnValue.colourType = 4;
            break;
        default:
            throw new Error(`unsupported number of channels: ${channels}`);
    }
    return returnValue;
}

function writeDataBytes(data, newData, slotsPerLine, offset) {
    for (var j = 0; j < slotsPerLine; j++) {
        newData.writeByte(data[offset++]);
    }
    return offset;
}

function writeDataUint16(data, newData, slotsPerLine, offset) {
    for (var j = 0; j < slotsPerLine; j++) {
        newData.writeUint16(data[offset++]);
    }
    return offset;
}

function decodePNG(data, options = {}) {
    const decoder = new PNGDecoder(data, options);
    return decoder.decode();
}

function encodePNG(png) {
    const encoder = new PNGDecoder$1(png);
    return encoder.encode();
}

var name = "has-own";
var version = "1.0.0";
var description = "A safer .hasOwnProperty() - hasOwn(name, obj)";
var main$1 = "index.js";
var scripts = {"test":"make test"};
var author = "Aaron Heckmann <aaron.heckmann+github@gmail.com>";
var license = "MIT";
var repository = {"type":"git","url":"git://github.com/pebble/has-own.git"};
var homepage = "https://github.com/pebble/has-own/";
var devDependencies = {"mocha":"^1.21.0"};
var _package = {
	name: name,
	version: version,
	description: description,
	main: main$1,
	scripts: scripts,
	author: author,
	license: license,
	repository: repository,
	homepage: homepage,
	devDependencies: devDependencies
};

var _package$1 = Object.freeze({
	name: name,
	version: version,
	description: description,
	main: main$1,
	scripts: scripts,
	author: author,
	license: license,
	repository: repository,
	homepage: homepage,
	devDependencies: devDependencies,
	default: _package
});

var require$$0$2 = ( _package$1 && _package ) || _package$1;

var index$11 = createCommonjsModule(function (module, exports) {
var hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = exports = function hasOwn(prop, obj) {
  return hasOwnProperty.call(obj, prop);
};

exports.version = require$$0$2.version;
});

// Shortcuts for common image kinds

var BINARY = 'BINARY';
var GREY = 'GREY';
var GREYA = 'GREYA';
var RGB = 'RGB';
var RGBA = 'RGBA';
var CMYK = 'CMYK';
var CMYKA = 'CMYKA';

var RGB$1 = 'RGB';
var HSL = 'HSL';
var HSV = 'HSV';
var CMYK$1 = 'CMYK';
var GREY$1 = 'GREY';

var kinds = {};

kinds[BINARY] = {
    components: 1,
    alpha: 0,
    bitDepth: 1,
    colorModel: GREY$1
};

kinds[GREYA] = {
    components: 1,
    alpha: 1,
    bitDepth: 8,
    colorModel: GREY$1
};

kinds[GREY] = {
    components: 1,
    alpha: 0,
    bitDepth: 8,
    colorModel: GREY$1
};

kinds[RGBA] = {
    components: 3,
    alpha: 1,
    bitDepth: 8,
    colorModel: RGB$1
};

kinds[RGB] = {
    components: 3,
    alpha: 0,
    bitDepth: 8,
    colorModel: RGB$1
};

kinds[CMYK] = {
    components: 4,
    alpha: 0,
    bitDepth: 8,
    colorModel: CMYK$1
};

kinds[CMYKA] = {
    components: 4,
    alpha: 1,
    bitDepth: 8,
    colorModel: CMYK$1
};

function getKind(kind) {
    return kinds[kind];
}

function getTheoreticalPixelArraySize(image) {
    var length = image.channels * image.size;
    if (image.bitDepth === 1) {
        length = Math.ceil(length / 8);
    }
    return length;
}

function createPixelArray(image) {
    var length = image.channels * image.size;
    var arr = void 0;
    switch (image.bitDepth) {
        case 1:
            arr = new Uint8Array(Math.ceil(length / 8));
            break;
        case 8:
            arr = new Uint8ClampedArray(length);
            break;
        case 16:
            arr = new Uint16Array(length);
            break;
        case 32:
            arr = new Float32Array(length);
            break;
        default:
            throw new Error('Cannot create pixel array for bit depth ' + image.bitDepth);
    }

    // alpha channel is 100% by default
    if (image.alpha) {
        for (var i = image.components; i < arr.length; i += image.channels) {
            arr[i] = image.maxValue;
        }
    }

    return arr;
}

var env = 'browser';
var ImageData = self.ImageData;
var DOMImage = self.Image;

function Canvas(width, height) {
    var canvas = self.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function fetchBinary(url) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$withCredentials = _ref.withCredentials,
        withCredentials = _ref$withCredentials === undefined ? false : _ref$withCredentials;

    return new Promise(function (resolve, reject) {
        var xhr = new self.XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.withCredentials = withCredentials;

        xhr.onload = function (e) {
            if (this.status !== 200) reject(e);else resolve(this.response);
        };
        xhr.onerror = reject;
        xhr.send();
    });
}

function createWriteStream() {
    throw new Error('createWriteStream does not exist in the browser');
}

function writeFile() {
    throw new Error('writeFile does not exist in the browser');
}

function invert() {
    this.checkProcessable('invert', {
        bitDepth: [1, 8, 16]
    });

    if (this.bitDepth === 1) {
        // we simply invert all the integers value
        // there could be a small mistake if the number of points
        // is not a multiple of 8 but it is not important
        var data = this.data;
        for (var i = 0; i < data.length; i++) {
            data[i] = ~data[i];
        }
    } else {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                for (var k = 0; k < this.components; k++) {
                    var value = this.getValueXY(x, y, k);
                    this.setValueXY(x, y, k, this.maxValue - value);
                }
            }
        }
    }
}

function invertIterator() {
    this.checkProcessable('invert', {
        bitDepth: [1, 8, 16]
    });

    if (this.bitDepth === 1) {
        // we simply invert all the integers value
        // there could be a small mistake if the number of points
        // is not a multiple of 8 but it is not important
        var data = this.data;
        for (var i = 0; i < data.length; i++) {
            data[i] = ~data[i];
        }
    } else {
        for (var _ref of this.pixels()) {
            var index = _ref.index;
            var pixel = _ref.pixel;

            for (var k = 0; k < this.components; k++) {
                this.setValue(index, k, this.maxValue - pixel[k]);
            }
        }
    }
}

function invertOneLoop() {
    this.checkProcessable('invertOneLoop', {
        bitDepth: [8, 16]
    });

    var data = this.data;
    for (var i = 0; i < data.length; i += this.channels) {
        for (var j = 0; j < this.components; j++) {
            data[i + j] = this.maxValue - data[i + j];
        }
    }
}

// this code gives the same result as invert()
// but is based on a matrix of pixels
// may be easier to implement some algorithm
// but it will likely be much slower

function invertPixel() {
    this.checkProcessable('invertPixel', {
        bitDepth: [8, 16]
    });

    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            var value = this.getPixelXY(x, y);
            for (var k = 0; k < this.components; k++) {
                value[k] = this.maxValue - value[k];
            }
            this.setPixelXY(x, y, value);
        }
    }
}

// this code gives the same result as invert()
// but is based on a matrix of pixels
// may be easier to implement some algorithm
// but it will likely be much slower

// this method is 50 times SLOWER than invert !!!!!!

function invertApply() {

    if (this.bitDepth === 1) {
        // we simply invert all the integers value
        // there could be a small mistake if the number of points
        // is not a multiple of 8 but it is not important
        var data = this.data;
        for (var i = 0; i < data.length; i++) {
            data[i] = ~data[i];
        }
    } else {
        this.checkProcessable('invertApply', {
            bitDepth: [8, 16]
        });
        this.apply(function (index) {
            for (var k = 0; k < this.components; k++) {
                this.data[index + k] = this.maxValue - this.data[index + k];
            }
        });
    }
}

function invertBinaryLoop() {
    this.checkProcessable('invertBinaryLoop', {
        bitDepth: [1]
    });

    for (var i = 0; i < this.size; i++) {
        this.toggleBit(i);
    }
}

function validateArrayOfChannels(image) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels,
        allowAlpha = options.allowAlpha,
        defaultAlpha = options.defaultAlpha;


    if (typeof allowAlpha !== 'boolean') {
        allowAlpha = true;
    }

    if (typeof channels === 'undefined') {
        return allChannels(image, defaultAlpha);
    } else {
        return validateChannels(image, channels, allowAlpha);
    }
}

function allChannels(image, defaultAlpha) {
    var length = defaultAlpha ? image.channels : image.components;
    var array = new Array(length);
    for (var i = 0; i < length; i++) {
        array[i] = i;
    }
    return array;
}

function validateChannels(image, channels, allowAlpha) {
    if (!Array.isArray(channels)) {
        channels = [channels];
    }
    for (var c = 0; c < channels.length; c++) {
        channels[c] = validateChannel(image, channels[c], allowAlpha);
    }
    return channels;
}

function validateChannel(image, channel) {
    var allowAlpha = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    if (channel === undefined) {
        throw new RangeError('validateChannel : the channel has to be >=0 and <' + image.channels);
    }

    if (typeof channel === 'string') {
        switch (image.colorModel) {
            case GREY$1:
                break;
            case RGB$1:
                if ('rgb'.includes(channel)) {
                    switch (channel) {
                        case 'r':
                            channel = 0;
                            break;
                        case 'g':
                            channel = 1;
                            break;
                        case 'b':
                            channel = 2;
                            break;
                        // no default
                    }
                }
                break;
            case HSL:
                if ('hsl'.includes(channel)) {
                    switch (channel) {
                        case 'h':
                            channel = 0;
                            break;
                        case 's':
                            channel = 1;
                            break;
                        case 'l':
                            channel = 2;
                            break;
                        // no default
                    }
                }
                break;
            case HSV:
                if ('hsv'.includes(channel)) {
                    switch (channel) {
                        case 'h':
                            channel = 0;
                            break;
                        case 's':
                            channel = 1;
                            break;
                        case 'v':
                            channel = 2;
                            break;
                        // no default
                    }
                }
                break;
            case CMYK$1:
                if ('cmyk'.includes(channel)) {
                    switch (channel) {
                        case 'c':
                            channel = 0;
                            break;
                        case 'm':
                            channel = 1;
                            break;
                        case 'y':
                            channel = 2;
                            break;
                        case 'k':
                            channel = 3;
                            break;
                        // no default
                    }
                }
                break;
            default:
                throw new Error(`Unexpected color model: ${image.colorModel}`);
        }

        if (channel === 'a') {
            if (!image.alpha) {
                throw new Error('validateChannel : the image does not contain alpha channel');
            }
            channel = image.components;
        }

        if (typeof channel === 'string') {
            throw new Error('validateChannel : undefined channel: ' + channel);
        }
    }

    if (channel >= image.channels) {
        throw new RangeError('validateChannel : the channel has to be >=0 and <' + image.channels);
    }

    if (!allowAlpha && channel >= image.components) {
        throw new RangeError('validateChannel : alpha channel may not be selected');
    }

    return channel;
}

// we try the faster methods

/**
 * Invert an image. The image
 * @memberof Image
 * @instance
 * @param {object} options
 * @param {(undefined|number|string|[number]|[string])} [options.channels=undefined] Specify which channels should be processed
 *      * undefined : we take all the channels but alpha
 *      * number : this specific channel
 *      * string : converted to a channel based on rgb, cmyk, hsl or hsv (one letter code)
 *      * [number] : array of channels as numbers
 *      * [string] : array of channels as one letter string
 * @return {this}
 */
function invert$1() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var channels = options.channels;


    this.checkProcessable('invertOneLoop', {
        bitDepth: [1, 8, 16]
    });

    if (this.bitDepth === 1) {
        // we simply invert all the integers value
        // there could be a small mistake if the number of points
        // is not a multiple of 8 but it is not important
        var data = this.data;
        for (var i = 0; i < data.length; i++) {
            data[i] = ~data[i];
        }
    } else {
        channels = validateArrayOfChannels(this, { channels });

        for (var c = 0; c < channels.length; c++) {
            var j = channels[c];
            for (var _i = j; _i < this.data.length; _i += this.channels) {
                this.data[_i] = this.maxValue - this.data[_i];
            }
        }
    }

    return this;
}

/**
 * Flip an image horizontally.
 * @memberof Image
 * @instance
 * @return {this}
 */
function flipX() {
    this.checkProcessable('flipX', {
        bitDepth: [8, 16]
    });

    for (var i = 0; i < this.height; i++) {

        var offsetY = i * this.width * this.channels;

        for (var j = 0; j < Math.floor(this.width / 2); j++) {

            var posCurrent = j * this.channels + offsetY;
            var posOpposite = (this.width - j - 1) * this.channels + offsetY;

            for (var k = 0; k < this.channels; k++) {
                var tmp = this.data[posCurrent + k];
                this.data[posCurrent + k] = this.data[posOpposite + k];
                this.data[posOpposite + k] = tmp;
            }
        }
    }

    return this;
}

/**
 * Flip an image vertically. The image
 * @memberof Image
 * @instance
 * @return {this}
 */
function flipY() {
    this.checkProcessable('flipY', {
        bitDepth: [8, 16]
    });

    for (var i = 0; i < Math.floor(this.height / 2); i++) {

        for (var j = 0; j < this.width; j++) {
            var posCurrent = j * this.channels + i * this.width * this.channels;
            var posOpposite = j * this.channels + (this.height - 1 - i) * this.channels * this.width;

            for (var k = 0; k < this.channels; k++) {
                var tmp = this.data[posCurrent + k];
                this.data[posCurrent + k] = this.data[posOpposite + k];
                this.data[posOpposite + k] = tmp;
            }
        }
    }

    return this;
}

/**
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} kernel
 * @param {object} [options]
 * @param {Array} [options.channels] - Array of channels to treat. Defaults to all channels
 * @param {number} [options.bitDepth=this.bitDepth] - A new bit depth can be specified. This allows to use 32 bits to avoid clamping of floating-point numbers.
 * @param {boolean} [options.normalize=false]
 * @param {number} [options.divisor=1]
 * @param {string} [options.border='copy']
 * @return {Image}
 */
function convolutionFft(kernel) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  options = Object.assign({}, options);
  options.algorithm = 'fft';
  return this.convolution(kernel, options);
}

/**
 * Apply a filter to blur the image
 * @memberof Image
 * @instance
 * @param {object} options
 * @param {number} [options.radius=1] : number of pixels around the current pixel to average
 * @return {Image}
 */
// first release of mean filter
function blurFilter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$radius = options.radius,
        radius = _options$radius === undefined ? 1 : _options$radius;

    this.checkProcessable('meanFilter', {
        components: [1],
        bitDepth: [8, 16]
    });

    if (radius < 1) {
        throw new Error('Number of neighbors should be grater than 0');
    }

    var n = 2 * radius + 1;
    var size = n * n;
    var kernel = new Array(size);

    for (var i = 0; i < kernel.length; i++) {
        kernel[i] = 1;
    }

    return convolutionFft.call(this, kernel);
}

var index$14 = Number.isNaN || function (x) {
	return x !== x;
};

function assertNum(x) {
	if (typeof x !== 'number' || index$14(x)) {
		throw new TypeError('Expected a number');
	}
}

var asc = function (a, b) {
	assertNum(a);
	assertNum(b);
	return a - b;
};

/**
* Each pixel of the image becomes the median of the neightbour
 * pixels.
 * @memberof Image
* @instance
* @param {object} options
* @param {(undefined|number|string|[number]|[string])} [options.channels=undefined] Specify which channels should be processed
*      * undefined : we take all the channels but alpha
*      * number : this specific channel
*      * string : converted to a channel based on rgb, cmyk, hsl or hsv (one letter code)
*      * [number] : array of channels as numbers
*      * [string] : array of channels as one letter string
* @param {number} [options.radius=1] distance of the square to take the mean of.
* @param {string} [options.border='copy'] algorithm that will be applied after to deal with borders
* @return {Image}
*/
function medianFilter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$radius = options.radius,
        radius = _options$radius === undefined ? 1 : _options$radius,
        channels = options.channels,
        _options$border = options.border,
        border = _options$border === undefined ? 'copy' : _options$border;


    this.checkProcessable('median', {
        bitDepth: [8, 16]
    });

    if (radius < 1) {
        throw new Error('Kernel radius should be greater than 0');
    }

    channels = validateArrayOfChannels(this, channels, true);

    var kWidth = radius;
    var kHeight = radius;
    var newImage = Image$1.createFrom(this);

    var size = (kWidth * 2 + 1) * (kHeight * 2 + 1);
    var middle = Math.floor(size / 2);
    var kernel = new Array(size);

    for (var channel = 0; channel < channels.length; channel++) {
        var c = channels[channel];
        for (var y = kHeight; y < this.height - kHeight; y++) {
            for (var x = kWidth; x < this.width - kWidth; x++) {
                var n = 0;
                for (var j = -kHeight; j <= kHeight; j++) {
                    for (var i = -kWidth; i <= kWidth; i++) {
                        var _index = ((y + j) * this.width + x + i) * this.channels + c;
                        kernel[n++] = this.data[_index];
                    }
                }
                var index = (y * this.width + x) * this.channels + c;
                var newValue = kernel.sort(asc)[middle];

                newImage.data[index] = newValue;
            }
        }
    }
    if (this.alpha && !channels.includes(this.channels)) {
        for (var _i = this.components; _i < this.data.length; _i = _i + this.channels) {
            newImage.data[_i] = this.data[_i];
        }
    }

    newImage.setBorder({ size: [kWidth, kHeight], algorithm: border });

    return newImage;
} //End median function

var fftlib = createCommonjsModule(function (module, exports) {
/**
 * Fast Fourier Transform module
 * 1D-FFT/IFFT, 2D-FFT/IFFT (radix-2)
 */
var FFT = (function(){
  var FFT;  
  
  {
    FFT = exports;   // for CommonJS
  }
  
  var version = {
    release: '0.3.0',
    date: '2013-03'
  };
  FFT.toString = function() {
    return "version " + version.release + ", released " + version.date;
  };

  // core operations
  var _n = 0,          // order
      _bitrev = null,  // bit reversal table
      _cstb = null;    // sin/cos table

  var core = {
    init : function(n) {
      if(n !== 0 && (n & (n - 1)) === 0) {
        _n = n;
        core._initArray();
        core._makeBitReversalTable();
        core._makeCosSinTable();
      } else {
        throw new Error("init: radix-2 required");
      }
    },
    // 1D-FFT
    fft1d : function(re, im) {
      core.fft(re, im, 1);
    },
    // 1D-IFFT
    ifft1d : function(re, im) {
      var n = 1/_n;
      core.fft(re, im, -1);
      for(var i=0; i<_n; i++) {
        re[i] *= n;
        im[i] *= n;
      }
    },
     // 1D-IFFT
    bt1d : function(re, im) {
      core.fft(re, im, -1);
    },
    // 2D-FFT Not very useful if the number of rows have to be equal to cols
    fft2d : function(re, im) {
      var tre = [],
          tim = [],
          i = 0;
      // x-axis
      for(var y=0; y<_n; y++) {
        i = y*_n;
        for(var x1=0; x1<_n; x1++) {
          tre[x1] = re[x1 + i];
          tim[x1] = im[x1 + i];
        }
        core.fft1d(tre, tim);
        for(var x2=0; x2<_n; x2++) {
          re[x2 + i] = tre[x2];
          im[x2 + i] = tim[x2];
        }
      }
      // y-axis
      for(var x=0; x<_n; x++) {
        for(var y1=0; y1<_n; y1++) {
          i = x + y1*_n;
          tre[y1] = re[i];
          tim[y1] = im[i];
        }
        core.fft1d(tre, tim);
        for(var y2=0; y2<_n; y2++) {
          i = x + y2*_n;
          re[i] = tre[y2];
          im[i] = tim[y2];
        }
      }
    },
    // 2D-IFFT
    ifft2d : function(re, im) {
      var tre = [],
          tim = [],
          i = 0;
      // x-axis
      for(var y=0; y<_n; y++) {
        i = y*_n;
        for(var x1=0; x1<_n; x1++) {
          tre[x1] = re[x1 + i];
          tim[x1] = im[x1 + i];
        }
        core.ifft1d(tre, tim);
        for(var x2=0; x2<_n; x2++) {
          re[x2 + i] = tre[x2];
          im[x2 + i] = tim[x2];
        }
      }
      // y-axis
      for(var x=0; x<_n; x++) {
        for(var y1=0; y1<_n; y1++) {
          i = x + y1*_n;
          tre[y1] = re[i];
          tim[y1] = im[i];
        }
        core.ifft1d(tre, tim);
        for(var y2=0; y2<_n; y2++) {
          i = x + y2*_n;
          re[i] = tre[y2];
          im[i] = tim[y2];
        }
      }
    },
    // core operation of FFT
    fft : function(re, im, inv) {
      var d, h, ik, m, tmp, wr, wi, xr, xi,
          n4 = _n >> 2;
      // bit reversal
      for(var l=0; l<_n; l++) {
        m = _bitrev[l];
        if(l < m) {
          tmp = re[l];
          re[l] = re[m];
          re[m] = tmp;
          tmp = im[l];
          im[l] = im[m];
          im[m] = tmp;
        }
      }
      // butterfly operation
      for(var k=1; k<_n; k<<=1) {
        h = 0;
        d = _n/(k << 1);
        for(var j=0; j<k; j++) {
          wr = _cstb[h + n4];
          wi = inv*_cstb[h];
          for(var i=j; i<_n; i+=(k<<1)) {
            ik = i + k;
            xr = wr*re[ik] + wi*im[ik];
            xi = wr*im[ik] - wi*re[ik];
            re[ik] = re[i] - xr;
            re[i] += xr;
            im[ik] = im[i] - xi;
            im[i] += xi;
          }
          h += d;
        }
      }
    },
    // initialize the array (supports TypedArray)
    _initArray : function() {
      if(typeof Uint32Array !== 'undefined') {
        _bitrev = new Uint32Array(_n);
      } else {
        _bitrev = [];
      }
      if(typeof Float64Array !== 'undefined') {
        _cstb = new Float64Array(_n*1.25);
      } else {
        _cstb = [];
      }
    },
    // zero padding
    _paddingZero : function() {
      // TODO
    },
    // makes bit reversal table
    _makeBitReversalTable : function() {
      var i = 0,
          j = 0,
          k = 0;
      _bitrev[0] = 0;
      while(++i < _n) {
        k = _n >> 1;
        while(k <= j) {
          j -= k;
          k >>= 1;
        }
        j += k;
        _bitrev[i] = j;
      }
    },
    // makes trigonometiric function table
    _makeCosSinTable : function() {
      var n2 = _n >> 1,
          n4 = _n >> 2,
          n8 = _n >> 3,
          n2p4 = n2 + n4,
          t = Math.sin(Math.PI/_n),
          dc = 2*t*t,
          ds = Math.sqrt(dc*(2 - dc)),
          c = _cstb[n4] = 1,
          s = _cstb[0] = 0;
      t = 2*dc;
      for(var i=1; i<n8; i++) {
        c -= dc;
        dc += t*c;
        s += ds;
        ds -= t*s;
        _cstb[i] = s;
        _cstb[n4 - i] = c;
      }
      if(n8 !== 0) {
        _cstb[n8] = Math.sqrt(0.5);
      }
      for(var j=0; j<n4; j++) {
        _cstb[n2 - j]  = _cstb[j];
      }
      for(var k=0; k<n2p4; k++) {
        _cstb[k + n2] = -_cstb[k];
      }
    }
  };
  // aliases (public APIs)
  var apis = ['init', 'fft1d', 'ifft1d', 'fft2d', 'ifft2d'];
  for(var i=0; i<apis.length; i++) {
    FFT[apis[i]] = core[apis[i]];
  }
  FFT.bt = core.bt1d;
  FFT.fft = core.fft1d;
  FFT.ifft = core.ifft1d;
  
  return FFT;
}).call(commonjsGlobal);
});

var FFTUtils$2= {
    DEBUG : false,

    /**
     * Calculates the inverse of a 2D Fourier transform
     *
     * @param ft
     * @param ftRows
     * @param ftCols
     * @return
     */
    ifft2DArray : function(ft, ftRows, ftCols){
        var tempTransform = new Array(ftRows * ftCols);
        var nRows = ftRows / 2;
        var nCols = (ftCols - 1) * 2;
        // reverse transform columns
        fftlib.init(nRows);
        var tmpCols = {re: new Array(nRows), im: new Array(nRows)};
        for (var iCol = 0; iCol < ftCols; iCol++) {
            for (var iRow = nRows - 1; iRow >= 0; iRow--) {
                tmpCols.re[iRow] = ft[(iRow * 2) * ftCols + iCol];
                tmpCols.im[iRow] = ft[(iRow * 2 + 1) * ftCols + iCol];
            }
            //Unnormalized inverse transform
            fftlib.bt(tmpCols.re, tmpCols.im);
            for (var iRow = nRows - 1; iRow >= 0; iRow--) {
                tempTransform[(iRow * 2) * ftCols + iCol] = tmpCols.re[iRow];
                tempTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
            }
        }

        // reverse row transform
        var finalTransform = new Array(nRows * nCols);
        fftlib.init(nCols);
        var tmpRows = {re: new Array(nCols), im: new Array(nCols)};
        var scale = nCols * nRows;
        for (var iRow = 0; iRow < ftRows; iRow += 2) {
            tmpRows.re[0] = tempTransform[iRow * ftCols];
            tmpRows.im[0] = tempTransform[(iRow + 1) * ftCols];
            for (var iCol = 1; iCol < ftCols; iCol++) {
                tmpRows.re[iCol] = tempTransform[iRow * ftCols + iCol];
                tmpRows.im[iCol] = tempTransform[(iRow + 1) * ftCols + iCol];
                tmpRows.re[nCols - iCol] = tempTransform[iRow * ftCols + iCol];
                tmpRows.im[nCols - iCol] = -tempTransform[(iRow + 1) * ftCols + iCol];
            }
            //Unnormalized inverse transform
            fftlib.bt(tmpRows.re, tmpRows.im);

            var indexB = (iRow / 2) * nCols;
            for (var iCol = nCols - 1; iCol >= 0; iCol--) {
                finalTransform[indexB + iCol] = tmpRows.re[iCol] / scale;
            }
        }
        return finalTransform;
    },
    /**
     * Calculates the fourier transform of a matrix of size (nRows,nCols) It is
     * assumed that both nRows and nCols are a power of two
     *
     * On exit the matrix has dimensions (nRows * 2, nCols / 2 + 1) where the
     * even rows contain the real part and the odd rows the imaginary part of the
     * transform
     * @param data
     * @param nRows
     * @param nCols
     * @return
     */
    fft2DArray:function(data, nRows, nCols, opt) {
        var options = Object.assign({},{inplace:true});
        var ftCols = (nCols / 2 + 1);
        var ftRows = nRows * 2;
        var tempTransform = new Array(ftRows * ftCols);
        fftlib.init(nCols);
        // transform rows
        var tmpRows = {re: new Array(nCols), im: new Array(nCols)};
        var row1 = {re: new Array(nCols), im: new Array(nCols)};
        var row2 = {re: new Array(nCols), im: new Array(nCols)};
        var index, iRow0, iRow1, iRow2, iRow3;
        for (var iRow = 0; iRow < nRows / 2; iRow++) {
            index = (iRow * 2) * nCols;
            tmpRows.re = data.slice(index, index + nCols);

            index = (iRow * 2 + 1) * nCols;
            tmpRows.im = data.slice(index, index + nCols);

            fftlib.fft1d(tmpRows.re, tmpRows.im);

            this.reconstructTwoRealFFT(tmpRows, row1, row2);
            //Now lets put back the result into the output array
            iRow0 = (iRow * 4) * ftCols;
            iRow1 = (iRow * 4 + 1) * ftCols;
            iRow2 = (iRow * 4 + 2) * ftCols;
            iRow3 = (iRow * 4 + 3) * ftCols;
            for (var k = ftCols - 1; k >= 0; k--) {
                tempTransform[iRow0 + k] = row1.re[k];
                tempTransform[iRow1 + k] = row1.im[k];
                tempTransform[iRow2 + k] = row2.re[k];
                tempTransform[iRow3 + k] = row2.im[k];
            }
        }

        //console.log(tempTransform);
        row1 = null;
        row2 = null;
        // transform columns
        var finalTransform = new Array(ftRows * ftCols);

        fftlib.init(nRows);
        var tmpCols = {re: new Array(nRows), im: new Array(nRows)};
        for (var iCol = ftCols - 1; iCol >= 0; iCol--) {
            for (var iRow = nRows - 1; iRow >= 0; iRow--) {
                tmpCols.re[iRow] = tempTransform[(iRow * 2) * ftCols + iCol];
                tmpCols.im[iRow] = tempTransform[(iRow * 2 + 1) * ftCols + iCol];
                //TODO Chech why this happens
                if(isNaN(tmpCols.re[iRow])){
                    tmpCols.re[iRow]=0;
                }
                if(isNaN(tmpCols.im[iRow])){
                    tmpCols.im[iRow]=0;
                }
            }
            fftlib.fft1d(tmpCols.re, tmpCols.im);
            for (var iRow = nRows - 1; iRow >= 0; iRow--) {
                finalTransform[(iRow * 2) * ftCols + iCol] = tmpCols.re[iRow];
                finalTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
            }
        }

        //console.log(finalTransform);
        return finalTransform;

    },
    /**
     *
     * @param fourierTransform
     * @param realTransform1
     * @param realTransform2
     *
     * Reconstructs the individual Fourier transforms of two simultaneously
     * transformed series. Based on the Symmetry relationships (the asterisk
     * denotes the complex conjugate)
     *
     * F_{N-n} = F_n^{*} for a purely real f transformed to F
     *
     * G_{N-n} = G_n^{*} for a purely imaginary g transformed to G
     *
     */
    reconstructTwoRealFFT:function(fourierTransform, realTransform1, realTransform2) {
        var length = fourierTransform.re.length;

        // the components n=0 are trivial
        realTransform1.re[0] = fourierTransform.re[0];
        realTransform1.im[0] = 0.0;
        realTransform2.re[0] = fourierTransform.im[0];
        realTransform2.im[0] = 0.0;
        var rm, rp, im, ip, j;
        for (var i = length / 2; i > 0; i--) {
            j = length - i;
            rm = 0.5 * (fourierTransform.re[i] - fourierTransform.re[j]);
            rp = 0.5 * (fourierTransform.re[i] + fourierTransform.re[j]);
            im = 0.5 * (fourierTransform.im[i] - fourierTransform.im[j]);
            ip = 0.5 * (fourierTransform.im[i] + fourierTransform.im[j]);
            realTransform1.re[i] = rp;
            realTransform1.im[i] = im;
            realTransform1.re[j] = rp;
            realTransform1.im[j] = -im;
            realTransform2.re[i] = ip;
            realTransform2.im[i] = -rm;
            realTransform2.re[j] = ip;
            realTransform2.im[j] = rm;
        }
    },

    /**
     * In place version of convolute 2D
     *
     * @param ftSignal
     * @param ftFilter
     * @param ftRows
     * @param ftCols
     * @return
     */
    convolute2DI:function(ftSignal, ftFilter, ftRows, ftCols) {
        var re, im;
        for (var iRow = 0; iRow < ftRows / 2; iRow++) {
            for (var iCol = 0; iCol < ftCols; iCol++) {
                //
                re = ftSignal[(iRow * 2) * ftCols + iCol]
                    * ftFilter[(iRow * 2) * ftCols + iCol]
                    - ftSignal[(iRow * 2 + 1) * ftCols + iCol]
                    * ftFilter[(iRow * 2 + 1) * ftCols + iCol];
                im = ftSignal[(iRow * 2) * ftCols + iCol]
                    * ftFilter[(iRow * 2 + 1) * ftCols + iCol]
                    + ftSignal[(iRow * 2 + 1) * ftCols + iCol]
                    * ftFilter[(iRow * 2) * ftCols + iCol];
                //
                ftSignal[(iRow * 2) * ftCols + iCol] = re;
                ftSignal[(iRow * 2 + 1) * ftCols + iCol] = im;
            }
        }
    },
    /**
     *
     * @param data
     * @param kernel
     * @param nRows
     * @param nCols
     * @returns {*}
     */
    convolute:function(data, kernel, nRows, nCols, opt) {
        var ftSpectrum = new Array(nCols * nRows);
        for (var i = 0; i<nRows * nCols; i++) {
            ftSpectrum[i] = data[i];
        }

        ftSpectrum = this.fft2DArray(ftSpectrum, nRows, nCols);


        var dimR = kernel.length;
        var dimC = kernel[0].length;
        var ftFilterData = new Array(nCols * nRows);
        for(var i = 0; i < nCols * nRows; i++) {
            ftFilterData[i] = 0;
        }

        var iRow, iCol;
        var shiftR = Math.floor((dimR - 1) / 2);
        var shiftC = Math.floor((dimC - 1) / 2);
        for (var ir = 0; ir < dimR; ir++) {
            iRow = (ir - shiftR + nRows) % nRows;
            for (var ic = 0; ic < dimC; ic++) {
                iCol = (ic - shiftC + nCols) % nCols;
                ftFilterData[iRow * nCols + iCol] = kernel[ir][ic];
            }
        }
        ftFilterData = this.fft2DArray(ftFilterData, nRows, nCols);

        var ftRows = nRows * 2;
        var ftCols = nCols / 2 + 1;
        this.convolute2DI(ftSpectrum, ftFilterData, ftRows, ftCols);

        return this.ifft2DArray(ftSpectrum, ftRows, ftCols);
    },


    toRadix2:function(data, nRows, nCols) {
        var i, j, irow, icol;
        var cols = nCols, rows = nRows, prows=0, pcols=0;
        if(!(nCols !== 0 && (nCols & (nCols - 1)) === 0)) {
            //Then we have to make a pading to next radix2
            cols = 0;
            while((nCols>>++cols)!=0);
            cols=1<<cols;
            pcols = cols-nCols;
        }
        if(!(nRows !== 0 && (nRows & (nRows - 1)) === 0)) {
            //Then we have to make a pading to next radix2
            rows = 0;
            while((nRows>>++rows)!=0);
            rows=1<<rows;
            prows = (rows-nRows)*cols;
        }
        if(rows==nRows&&cols==nCols)//Do nothing. Returns the same input!!! Be careful
            return {data:data, rows:nRows, cols:nCols};

        var output = new Array(rows*cols);
        var shiftR = Math.floor((rows-nRows)/2)-nRows;
        var shiftC = Math.floor((cols-nCols)/2)-nCols;

        for( i = 0; i < rows; i++) {
            irow = i*cols;
            icol = ((i-shiftR) % nRows) * nCols;
            for( j = 0; j < cols; j++) {
                output[irow+j] = data[(icol+(j-shiftC) % nCols) ];
            }
        }
        return {data:output, rows:rows, cols:cols};
    },

    /**
     * Crop the given matrix to fit the corresponding number of rows and columns
     */
    crop:function(data, rows, cols, nRows, nCols, opt) {

        if(rows == nRows && cols == nCols)//Do nothing. Returns the same input!!! Be careful
            return data;

        var options = Object.assign({}, opt);

        var output = new Array(nCols*nRows);

        var shiftR = Math.floor((rows-nRows)/2);
        var shiftC = Math.floor((cols-nCols)/2);
        var destinyRow, sourceRow, i, j;
        for( i = 0; i < nRows; i++) {
            destinyRow = i*nCols;
            sourceRow = (i+shiftR)*cols;
            for( j = 0;j < nCols; j++) {
                output[destinyRow+j] = data[sourceRow+(j+shiftC)];
            }
        }

        return output;
    }
};

var FFTUtils_1 = FFTUtils$2;

var FFTUtils$1 = FFTUtils_1;
var FFT = fftlib;

var index$18 = {
	FFTUtils: FFTUtils$1,
	FFT: FFT
};

/**
 * Created by acastillo on 7/7/16.
 */
var FFTUtils = index$18.FFTUtils;

function convolutionFFT(input, kernel, opt) {
    var tmp = matrix2Array(input);
    var inputData = tmp.data;
    var options = Object.assign({normalize : false, divisor : 1, rows:tmp.rows, cols:tmp.cols}, opt);

    var nRows, nCols;
    if (options.rows&&options.cols) {
        nRows = options.rows;
        nCols = options.cols;
    }
    else {
        throw new Error("Invalid number of rows or columns " + nRows + " " + nCols)
    }

    var divisor = options.divisor;
    var i,j;
    var kHeight =  kernel.length;
    var kWidth =  kernel[0].length;
    if (options.normalize) {
        divisor = 0;
        for (i = 0; i < kHeight; i++)
            for (j = 0; j < kWidth; j++)
                divisor += kernel[i][j];
    }
    if (divisor === 0) {
        throw new RangeError('convolution: The divisor is equal to zero');
    }

    var radix2Sized = FFTUtils.toRadix2(inputData, nRows, nCols);
    var conv = FFTUtils.convolute(radix2Sized.data, kernel, radix2Sized.rows, radix2Sized.cols);
    conv = FFTUtils.crop(conv, radix2Sized.rows, radix2Sized.cols, nRows, nCols);

    if(divisor!=0&&divisor!=1){
        for(i=0;i<conv.length;i++){
            conv[i]/=divisor;
        }
    }

    return conv;
}

function convolutionDirect(input, kernel, opt) {
    var tmp = matrix2Array(input);
    var inputData = tmp.data;
    var options = Object.assign({normalize : false, divisor : 1, rows:tmp.rows, cols:tmp.cols}, opt);

    var nRows, nCols;
    if (options.rows&&options.cols) {
        nRows = options.rows;
        nCols = options.cols;
    }
    else {
        throw new Error("Invalid number of rows or columns " + nRows + " " + nCols)
    }

    var divisor = options.divisor;
    var kHeight =  kernel.length;
    var kWidth =  kernel[0].length;
    var i, j, x, y, index, sum, kVal, row, col;
    if (options.normalize) {
        divisor = 0;
        for (i = 0; i < kHeight; i++)
            for (j = 0; j < kWidth; j++)
                divisor += kernel[i][j];
    }
    if (divisor === 0) {
        throw new RangeError('convolution: The divisor is equal to zero');
    }

    var output = new Array(nRows*nCols);

    var hHeight = Math.floor(kHeight/2);
    var hWidth = Math.floor(kWidth/2);

    for (y = 0; y < nRows; y++) {
        for (x = 0; x < nCols; x++) {
            sum = 0;
            for ( j = 0; j < kHeight; j++) {
                for ( i = 0; i < kWidth; i++) {
                    kVal = kernel[kHeight - j - 1][kWidth - i - 1];
                    row = (y + j -hHeight + nRows) % nRows;
                    col = (x + i - hWidth + nCols) % nCols;
                    index = (row * nCols + col);
                    sum += inputData[index] * kVal;
                }
            }
            index = (y * nCols + x);
            output[index]= sum / divisor;
        }
    }
    return output;
}



function LoG(sigma, nPoints, options){
    var factor = 1000;
    if(options&&options.factor){
        factor = options.factor;
    }

    var kernel = new Array(nPoints);
    var i,j,tmp,y2,tmp2;

    factor*=-1;//-1/(Math.PI*Math.pow(sigma,4));
    var center = (nPoints-1)/2;
    var sigma2 = 2*sigma*sigma;
    for( i=0;i<nPoints;i++){
        kernel[i]=new Array(nPoints);
        y2 = (i-center)*(i-center);
        for( j=0;j<nPoints;j++){
            tmp = -((j-center)*(j-center)+y2)/sigma2;
            kernel[i][j]=Math.round(factor*(1+tmp)*Math.exp(tmp));
        }
    }

    return kernel;
}

function matrix2Array(input){
    var inputData=input;
    var nRows, nCols;
    if(typeof input[0]!="number"){
        nRows = input.length;
        nCols = input[0].length;
        inputData = new Array(nRows*nCols);
        for(var i=0;i<nRows;i++){
            for(var j=0;j<nCols;j++){
                inputData[i*nCols+j]=input[i][j];
            }
        }
    }
    else{
        var tmp = Math.sqrt(input.length);
        if(Number.isInteger(tmp)){
            nRows=tmp;
            nCols=tmp;
        }
    }

    return {data:inputData,rows:nRows,cols:nCols};
}


var index$16 = {
    fft:convolutionFFT,
    direct:convolutionDirect,
    kernelFactory:{LoG:LoG},
    matrix2Array:matrix2Array
};

var index_1$3 = index$16.direct;
var index_2$1 = index$16.fft;

var index$21 = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || index$14(val) || val === Infinity || val === -Infinity);
};

// https://github.com/paulmillr/es6-shim
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isinteger

var index$20 = Number.isInteger || function(val) {
  return typeof val === "number" &&
    index$21(val) &&
    Math.floor(val) === val;
};

function validateKernel(kernel) {
    var kHeight = void 0,
        kWidth = void 0;
    if (Array.isArray(kernel)) {
        if (Array.isArray(kernel[0])) {
            // 2D array
            if ((kernel.length & 1) === 0 || (kernel[0].length & 1) === 0) {
                throw new RangeError('validateKernel: Kernel rows and columns should be odd numbers');
            } else {
                kHeight = Math.floor(kernel.length / 2);
                kWidth = Math.floor(kernel[0].length / 2);
            }
        } else {
            var kernelWidth = Math.sqrt(kernel.length);
            if (index$20(kernelWidth)) {
                kWidth = kHeight = Math.floor(Math.sqrt(kernel.length) / 2);
            } else {
                throw new RangeError('validateKernel: Kernel array should be a square');
            }
            // we convert the array to a matrix
            var newKernel = new Array(kernelWidth);
            for (var i = 0; i < kernelWidth; i++) {
                newKernel[i] = new Array(kernelWidth);
                for (var j = 0; j < kernelWidth; j++) {
                    newKernel[i][j] = kernel[i * kernelWidth + j];
                }
            }
            kernel = newKernel;
        }
    } else {
        throw new Error('validateKernel: Invalid Kernel: ' + kernel);
    }
    return { kernel, kWidth, kHeight };
}

function directConvolution(input, kernel, output) {
    if (output === undefined) {
        const length = input.length + kernel.length - 1;
        output = new Array(length);
    }
    fill(output);
    for (var i = 0; i < input.length; i++) {
        for (var j = 0; j < kernel.length; j++) {
            output[i + j] += input[i] * kernel[j];
        }
    }
    return output;
}

function fill(array) {
    for (var i = 0; i < array.length; i++) {
        array[i] = 0;
    }
}

function convolutionSeparable(data, separatedKernel, width, height) {
    var result = new Array(data.length);
    var tmp = void 0,
        conv = void 0,
        offset = void 0,
        kernel = void 0;

    kernel = separatedKernel[1];
    offset = (kernel.length - 1) / 2;
    conv = new Array(width + kernel.length - 1);
    tmp = new Array(width);
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            tmp[x] = data[y * width + x];
        }
        directConvolution(tmp, kernel, conv);
        for (var _x = 0; _x < width; _x++) {
            result[y * width + _x] = conv[offset + _x];
        }
    }

    kernel = separatedKernel[0];
    offset = (kernel.length - 1) / 2;
    conv = new Array(height + kernel.length - 1);
    tmp = new Array(height);
    for (var _x2 = 0; _x2 < width; _x2++) {
        for (var _y = 0; _y < height; _y++) {
            tmp[_y] = result[_y * width + _x2];
        }
        directConvolution(tmp, kernel, conv);
        for (var _y2 = 0; _y2 < height; _y2++) {
            result[_y2 * width + _x2] = conv[offset + _y2];
        }
    }
    return result;
}

if (!Symbol.species) {
    Symbol.species = Symbol.for('@@species');
}

// https://github.com/lutzroeder/Mapack/blob/master/Source/LuDecomposition.cs
function LuDecomposition(matrix) {
    if (!(this instanceof LuDecomposition)) {
        return new LuDecomposition(matrix);
    }

    matrix = Matrix.checkMatrix(matrix);

    var lu = matrix.clone(),
        rows = lu.rows,
        columns = lu.columns,
        pivotVector = new Array(rows),
        pivotSign = 1,
        i, j, k, p, s, t, v,
        LUrowi, LUcolj, kmax;

    for (i = 0; i < rows; i++) {
        pivotVector[i] = i;
    }

    LUcolj = new Array(rows);

    for (j = 0; j < columns; j++) {

        for (i = 0; i < rows; i++) {
            LUcolj[i] = lu[i][j];
        }

        for (i = 0; i < rows; i++) {
            LUrowi = lu[i];
            kmax = Math.min(i, j);
            s = 0;
            for (k = 0; k < kmax; k++) {
                s += LUrowi[k] * LUcolj[k];
            }
            LUrowi[j] = LUcolj[i] -= s;
        }

        p = j;
        for (i = j + 1; i < rows; i++) {
            if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
                p = i;
            }
        }

        if (p !== j) {
            for (k = 0; k < columns; k++) {
                t = lu[p][k];
                lu[p][k] = lu[j][k];
                lu[j][k] = t;
            }

            v = pivotVector[p];
            pivotVector[p] = pivotVector[j];
            pivotVector[j] = v;

            pivotSign = -pivotSign;
        }

        if (j < rows && lu[j][j] !== 0) {
            for (i = j + 1; i < rows; i++) {
                lu[i][j] /= lu[j][j];
            }
        }
    }

    this.LU = lu;
    this.pivotVector = pivotVector;
    this.pivotSign = pivotSign;
}

LuDecomposition.prototype = {
    isSingular: function () {
        var data = this.LU,
            col = data.columns;
        for (var j = 0; j < col; j++) {
            if (data[j][j] === 0) {
                return true;
            }
        }
        return false;
    },
    get determinant() {
        var data = this.LU;
        if (!data.isSquare()) {
            throw new Error('Matrix must be square');
        }
        var determinant = this.pivotSign, col = data.columns;
        for (var j = 0; j < col; j++) {
            determinant *= data[j][j];
        }
        return determinant;
    },
    get lowerTriangularMatrix() {
        var data = this.LU,
            rows = data.rows,
            columns = data.columns,
            X = new Matrix(rows, columns);
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < columns; j++) {
                if (i > j) {
                    X[i][j] = data[i][j];
                } else if (i === j) {
                    X[i][j] = 1;
                } else {
                    X[i][j] = 0;
                }
            }
        }
        return X;
    },
    get upperTriangularMatrix() {
        var data = this.LU,
            rows = data.rows,
            columns = data.columns,
            X = new Matrix(rows, columns);
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < columns; j++) {
                if (i <= j) {
                    X[i][j] = data[i][j];
                } else {
                    X[i][j] = 0;
                }
            }
        }
        return X;
    },
    get pivotPermutationVector() {
        return this.pivotVector.slice();
    },
    solve: function (value) {
        value = Matrix.checkMatrix(value);

        var lu = this.LU,
            rows = lu.rows;

        if (rows !== value.rows) {
            throw new Error('Invalid matrix dimensions');
        }
        if (this.isSingular()) {
            throw new Error('LU matrix is singular');
        }

        var count = value.columns;
        var X = value.subMatrixRow(this.pivotVector, 0, count - 1);
        var columns = lu.columns;
        var i, j, k;

        for (k = 0; k < columns; k++) {
            for (i = k + 1; i < columns; i++) {
                for (j = 0; j < count; j++) {
                    X[i][j] -= X[k][j] * lu[i][k];
                }
            }
        }
        for (k = columns - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
                X[k][j] /= lu[k][k];
            }
            for (i = 0; i < k; i++) {
                for (j = 0; j < count; j++) {
                    X[i][j] -= X[k][j] * lu[i][k];
                }
            }
        }
        return X;
    }
};

function hypotenuse(a, b) {
    var r;
    if (Math.abs(a) > Math.abs(b)) {
        r = b / a;
        return Math.abs(a) * Math.sqrt(1 + r * r);
    }
    if (b !== 0) {
        r = a / b;
        return Math.abs(b) * Math.sqrt(1 + r * r);
    }
    return 0;
}

// For use in the decomposition algorithms. With big matrices, access time is
// too long on elements from array subclass
// todo check when it is fixed in v8
// http://jsperf.com/access-and-write-array-subclass


function getFilled2DArray(rows, columns, value) {
    var array = new Array(rows);
    for (var i = 0; i < rows; i++) {
        array[i] = new Array(columns);
        for (var j = 0; j < columns; j++) {
            array[i][j] = value;
        }
    }
    return array;
}

// https://github.com/lutzroeder/Mapack/blob/master/Source/SingularValueDecomposition.cs
function SingularValueDecomposition(value, options) {
    if (!(this instanceof SingularValueDecomposition)) {
        return new SingularValueDecomposition(value, options);
    }
    value = Matrix.checkMatrix(value);

    options = options || {};

    var m = value.rows,
        n = value.columns,
        nu = Math.min(m, n);

    var wantu = true, wantv = true;
    if (options.computeLeftSingularVectors === false) wantu = false;
    if (options.computeRightSingularVectors === false) wantv = false;
    var autoTranspose = options.autoTranspose === true;

    var swapped = false;
    var a;
    if (m < n) {
        if (!autoTranspose) {
            a = value.clone();
            // eslint-disable-next-line no-console
            console.warn('Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose');
        } else {
            a = value.transpose();
            m = a.rows;
            n = a.columns;
            swapped = true;
            var aux = wantu;
            wantu = wantv;
            wantv = aux;
        }
    } else {
        a = value.clone();
    }

    var s = new Array(Math.min(m + 1, n)),
        U = getFilled2DArray(m, nu, 0),
        V = getFilled2DArray(n, n, 0),
        e = new Array(n),
        work = new Array(m);

    var nct = Math.min(m - 1, n);
    var nrt = Math.max(0, Math.min(n - 2, m));

    var i, j, k, p, t, ks, f, cs, sn, max, kase,
        scale, sp, spm1, epm1, sk, ek, b, c, shift, g;

    for (k = 0, max = Math.max(nct, nrt); k < max; k++) {
        if (k < nct) {
            s[k] = 0;
            for (i = k; i < m; i++) {
                s[k] = hypotenuse(s[k], a[i][k]);
            }
            if (s[k] !== 0) {
                if (a[k][k] < 0) {
                    s[k] = -s[k];
                }
                for (i = k; i < m; i++) {
                    a[i][k] /= s[k];
                }
                a[k][k] += 1;
            }
            s[k] = -s[k];
        }

        for (j = k + 1; j < n; j++) {
            if ((k < nct) && (s[k] !== 0)) {
                t = 0;
                for (i = k; i < m; i++) {
                    t += a[i][k] * a[i][j];
                }
                t = -t / a[k][k];
                for (i = k; i < m; i++) {
                    a[i][j] += t * a[i][k];
                }
            }
            e[j] = a[k][j];
        }

        if (wantu && (k < nct)) {
            for (i = k; i < m; i++) {
                U[i][k] = a[i][k];
            }
        }

        if (k < nrt) {
            e[k] = 0;
            for (i = k + 1; i < n; i++) {
                e[k] = hypotenuse(e[k], e[i]);
            }
            if (e[k] !== 0) {
                if (e[k + 1] < 0) {
                    e[k] = 0 - e[k];
                }
                for (i = k + 1; i < n; i++) {
                    e[i] /= e[k];
                }
                e[k + 1] += 1;
            }
            e[k] = -e[k];
            if ((k + 1 < m) && (e[k] !== 0)) {
                for (i = k + 1; i < m; i++) {
                    work[i] = 0;
                }
                for (j = k + 1; j < n; j++) {
                    for (i = k + 1; i < m; i++) {
                        work[i] += e[j] * a[i][j];
                    }
                }
                for (j = k + 1; j < n; j++) {
                    t = -e[j] / e[k + 1];
                    for (i = k + 1; i < m; i++) {
                        a[i][j] += t * work[i];
                    }
                }
            }
            if (wantv) {
                for (i = k + 1; i < n; i++) {
                    V[i][k] = e[i];
                }
            }
        }
    }

    p = Math.min(n, m + 1);
    if (nct < n) {
        s[nct] = a[nct][nct];
    }
    if (m < p) {
        s[p - 1] = 0;
    }
    if (nrt + 1 < p) {
        e[nrt] = a[nrt][p - 1];
    }
    e[p - 1] = 0;

    if (wantu) {
        for (j = nct; j < nu; j++) {
            for (i = 0; i < m; i++) {
                U[i][j] = 0;
            }
            U[j][j] = 1;
        }
        for (k = nct - 1; k >= 0; k--) {
            if (s[k] !== 0) {
                for (j = k + 1; j < nu; j++) {
                    t = 0;
                    for (i = k; i < m; i++) {
                        t += U[i][k] * U[i][j];
                    }
                    t = -t / U[k][k];
                    for (i = k; i < m; i++) {
                        U[i][j] += t * U[i][k];
                    }
                }
                for (i = k; i < m; i++) {
                    U[i][k] = -U[i][k];
                }
                U[k][k] = 1 + U[k][k];
                for (i = 0; i < k - 1; i++) {
                    U[i][k] = 0;
                }
            } else {
                for (i = 0; i < m; i++) {
                    U[i][k] = 0;
                }
                U[k][k] = 1;
            }
        }
    }

    if (wantv) {
        for (k = n - 1; k >= 0; k--) {
            if ((k < nrt) && (e[k] !== 0)) {
                for (j = k + 1; j < n; j++) {
                    t = 0;
                    for (i = k + 1; i < n; i++) {
                        t += V[i][k] * V[i][j];
                    }
                    t = -t / V[k + 1][k];
                    for (i = k + 1; i < n; i++) {
                        V[i][j] += t * V[i][k];
                    }
                }
            }
            for (i = 0; i < n; i++) {
                V[i][k] = 0;
            }
            V[k][k] = 1;
        }
    }

    var pp = p - 1,
        iter = 0,
        eps = Math.pow(2, -52);
    while (p > 0) {
        for (k = p - 2; k >= -1; k--) {
            if (k === -1) {
                break;
            }
            if (Math.abs(e[k]) <= eps * (Math.abs(s[k]) + Math.abs(s[k + 1]))) {
                e[k] = 0;
                break;
            }
        }
        if (k === p - 2) {
            kase = 4;
        } else {
            for (ks = p - 1; ks >= k; ks--) {
                if (ks === k) {
                    break;
                }
                t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
                if (Math.abs(s[ks]) <= eps * t) {
                    s[ks] = 0;
                    break;
                }
            }
            if (ks === k) {
                kase = 3;
            } else if (ks === p - 1) {
                kase = 1;
            } else {
                kase = 2;
                k = ks;
            }
        }

        k++;

        switch (kase) {
            case 1: {
                f = e[p - 2];
                e[p - 2] = 0;
                for (j = p - 2; j >= k; j--) {
                    t = hypotenuse(s[j], f);
                    cs = s[j] / t;
                    sn = f / t;
                    s[j] = t;
                    if (j !== k) {
                        f = -sn * e[j - 1];
                        e[j - 1] = cs * e[j - 1];
                    }
                    if (wantv) {
                        for (i = 0; i < n; i++) {
                            t = cs * V[i][j] + sn * V[i][p - 1];
                            V[i][p - 1] = -sn * V[i][j] + cs * V[i][p - 1];
                            V[i][j] = t;
                        }
                    }
                }
                break;
            }
            case 2 : {
                f = e[k - 1];
                e[k - 1] = 0;
                for (j = k; j < p; j++) {
                    t = hypotenuse(s[j], f);
                    cs = s[j] / t;
                    sn = f / t;
                    s[j] = t;
                    f = -sn * e[j];
                    e[j] = cs * e[j];
                    if (wantu) {
                        for (i = 0; i < m; i++) {
                            t = cs * U[i][j] + sn * U[i][k - 1];
                            U[i][k - 1] = -sn * U[i][j] + cs * U[i][k - 1];
                            U[i][j] = t;
                        }
                    }
                }
                break;
            }
            case 3 : {
                scale = Math.max(Math.max(Math.max(Math.max(Math.abs(s[p - 1]), Math.abs(s[p - 2])), Math.abs(e[p - 2])), Math.abs(s[k])), Math.abs(e[k]));
                sp = s[p - 1] / scale;
                spm1 = s[p - 2] / scale;
                epm1 = e[p - 2] / scale;
                sk = s[k] / scale;
                ek = e[k] / scale;
                b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
                c = (sp * epm1) * (sp * epm1);
                shift = 0;
                if ((b !== 0) || (c !== 0)) {
                    shift = Math.sqrt(b * b + c);
                    if (b < 0) {
                        shift = -shift;
                    }
                    shift = c / (b + shift);
                }
                f = (sk + sp) * (sk - sp) + shift;
                g = sk * ek;
                for (j = k; j < p - 1; j++) {
                    t = hypotenuse(f, g);
                    cs = f / t;
                    sn = g / t;
                    if (j !== k) {
                        e[j - 1] = t;
                    }
                    f = cs * s[j] + sn * e[j];
                    e[j] = cs * e[j] - sn * s[j];
                    g = sn * s[j + 1];
                    s[j + 1] = cs * s[j + 1];
                    if (wantv) {
                        for (i = 0; i < n; i++) {
                            t = cs * V[i][j] + sn * V[i][j + 1];
                            V[i][j + 1] = -sn * V[i][j] + cs * V[i][j + 1];
                            V[i][j] = t;
                        }
                    }
                    t = hypotenuse(f, g);
                    cs = f / t;
                    sn = g / t;
                    s[j] = t;
                    f = cs * e[j] + sn * s[j + 1];
                    s[j + 1] = -sn * e[j] + cs * s[j + 1];
                    g = sn * e[j + 1];
                    e[j + 1] = cs * e[j + 1];
                    if (wantu && (j < m - 1)) {
                        for (i = 0; i < m; i++) {
                            t = cs * U[i][j] + sn * U[i][j + 1];
                            U[i][j + 1] = -sn * U[i][j] + cs * U[i][j + 1];
                            U[i][j] = t;
                        }
                    }
                }
                e[p - 2] = f;
                iter = iter + 1;
                break;
            }
            case 4: {
                if (s[k] <= 0) {
                    s[k] = (s[k] < 0 ? -s[k] : 0);
                    if (wantv) {
                        for (i = 0; i <= pp; i++) {
                            V[i][k] = -V[i][k];
                        }
                    }
                }
                while (k < pp) {
                    if (s[k] >= s[k + 1]) {
                        break;
                    }
                    t = s[k];
                    s[k] = s[k + 1];
                    s[k + 1] = t;
                    if (wantv && (k < n - 1)) {
                        for (i = 0; i < n; i++) {
                            t = V[i][k + 1];
                            V[i][k + 1] = V[i][k];
                            V[i][k] = t;
                        }
                    }
                    if (wantu && (k < m - 1)) {
                        for (i = 0; i < m; i++) {
                            t = U[i][k + 1];
                            U[i][k + 1] = U[i][k];
                            U[i][k] = t;
                        }
                    }
                    k++;
                }
                iter = 0;
                p--;
                break;
            }
            // no default
        }
    }

    if (swapped) {
        var tmp = V;
        V = U;
        U = tmp;
    }

    this.m = m;
    this.n = n;
    this.s = s;
    this.U = U;
    this.V = V;
}

SingularValueDecomposition.prototype = {
    get condition() {
        return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
    },
    get norm2() {
        return this.s[0];
    },
    get rank() {
        var eps = Math.pow(2, -52),
            tol = Math.max(this.m, this.n) * this.s[0] * eps,
            r = 0,
            s = this.s;
        for (var i = 0, ii = s.length; i < ii; i++) {
            if (s[i] > tol) {
                r++;
            }
        }
        return r;
    },
    get diagonal() {
        return this.s;
    },
    // https://github.com/accord-net/framework/blob/development/Sources/Accord.Math/Decompositions/SingularValueDecomposition.cs
    get threshold() {
        return (Math.pow(2, -52) / 2) * Math.max(this.m, this.n) * this.s[0];
    },
    get leftSingularVectors() {
        if (!Matrix.isMatrix(this.U)) {
            this.U = new Matrix(this.U);
        }
        return this.U;
    },
    get rightSingularVectors() {
        if (!Matrix.isMatrix(this.V)) {
            this.V = new Matrix(this.V);
        }
        return this.V;
    },
    get diagonalMatrix() {
        return Matrix.diag(this.s);
    },
    solve: function (value) {

        var Y = value,
            e = this.threshold,
            scols = this.s.length,
            Ls = Matrix.zeros(scols, scols),
            i;

        for (i = 0; i < scols; i++) {
            if (Math.abs(this.s[i]) <= e) {
                Ls[i][i] = 0;
            } else {
                Ls[i][i] = 1 / this.s[i];
            }
        }

        var U = this.U;
        var V = this.rightSingularVectors;

        var VL = V.mmul(Ls),
            vrows = V.rows,
            urows = U.length,
            VLU = Matrix.zeros(vrows, urows),
            j, k, sum;

        for (i = 0; i < vrows; i++) {
            for (j = 0; j < urows; j++) {
                sum = 0;
                for (k = 0; k < scols; k++) {
                    sum += VL[i][k] * U[j][k];
                }
                VLU[i][j] = sum;
            }
        }

        return VLU.mmul(Y);
    },
    solveForDiagonal: function (value) {
        return this.solve(Matrix.diag(value));
    },
    inverse: function () {
        var V = this.V;
        var e = this.threshold,
            vrows = V.length,
            vcols = V[0].length,
            X = new Matrix(vrows, this.s.length),
            i, j;

        for (i = 0; i < vrows; i++) {
            for (j = 0; j < vcols; j++) {
                if (Math.abs(this.s[j]) > e) {
                    X[i][j] = V[i][j] / this.s[j];
                } else {
                    X[i][j] = 0;
                }
            }
        }

        var U = this.U;

        var urows = U.length,
            ucols = U[0].length,
            Y = new Matrix(vrows, urows),
            k, sum;

        for (i = 0; i < vrows; i++) {
            for (j = 0; j < urows; j++) {
                sum = 0;
                for (k = 0; k < ucols; k++) {
                    sum += X[i][k] * U[j][k];
                }
                Y[i][j] = sum;
            }
        }

        return Y;
    }
};

var array$1 = createCommonjsModule(function (module, exports) {
'use strict';

function compareNumbers(a, b) {
    return a - b;
}

/**
 * Computes the sum of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.sum = function sum(values) {
    var sum = 0;
    for (var i = 0; i < values.length; i++) {
        sum += values[i];
    }
    return sum;
};

/**
 * Computes the maximum of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.max = function max(values) {
    var max = values[0];
    var l = values.length;
    for (var i = 1; i < l; i++) {
        if (values[i] > max) max = values[i];
    }
    return max;
};

/**
 * Computes the minimum of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.min = function min(values) {
    var min = values[0];
    var l = values.length;
    for (var i = 1; i < l; i++) {
        if (values[i] < min) min = values[i];
    }
    return min;
};

/**
 * Computes the min and max of the given values
 * @param {Array} values
 * @returns {{min: number, max: number}}
 */
exports.minMax = function minMax(values) {
    var min = values[0];
    var max = values[0];
    var l = values.length;
    for (var i = 1; i < l; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
    }
    return {
        min: min,
        max: max
    };
};

/**
 * Computes the arithmetic mean of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.arithmeticMean = function arithmeticMean(values) {
    var sum = 0;
    var l = values.length;
    for (var i = 0; i < l; i++) {
        sum += values[i];
    }
    return sum / l;
};

/**
 * {@link arithmeticMean}
 */
exports.mean = exports.arithmeticMean;

/**
 * Computes the geometric mean of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.geometricMean = function geometricMean(values) {
    var mul = 1;
    var l = values.length;
    for (var i = 0; i < l; i++) {
        mul *= values[i];
    }
    return Math.pow(mul, 1 / l);
};

/**
 * Computes the mean of the log of the given values
 * If the return value is exponentiated, it gives the same result as the
 * geometric mean.
 * @param {Array} values
 * @returns {number}
 */
exports.logMean = function logMean(values) {
    var lnsum = 0;
    var l = values.length;
    for (var i = 0; i < l; i++) {
        lnsum += Math.log(values[i]);
    }
    return lnsum / l;
};

/**
 * Computes the weighted grand mean for a list of means and sample sizes
 * @param {Array} means - Mean values for each set of samples
 * @param {Array} samples - Number of original values for each set of samples
 * @returns {number}
 */
exports.grandMean = function grandMean(means, samples) {
    var sum = 0;
    var n = 0;
    var l = means.length;
    for (var i = 0; i < l; i++) {
        sum += samples[i] * means[i];
        n += samples[i];
    }
    return sum / n;
};

/**
 * Computes the truncated mean of the given values using a given percentage
 * @param {Array} values
 * @param {number} percent - The percentage of values to keep (range: [0,1])
 * @param {boolean} [alreadySorted=false]
 * @returns {number}
 */
exports.truncatedMean = function truncatedMean(values, percent, alreadySorted) {
    if (alreadySorted === undefined) alreadySorted = false;
    if (!alreadySorted) {
        values = [].concat(values).sort(compareNumbers);
    }
    var l = values.length;
    var k = Math.floor(l * percent);
    var sum = 0;
    for (var i = k; i < (l - k); i++) {
        sum += values[i];
    }
    return sum / (l - 2 * k);
};

/**
 * Computes the harmonic mean of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.harmonicMean = function harmonicMean(values) {
    var sum = 0;
    var l = values.length;
    for (var i = 0; i < l; i++) {
        if (values[i] === 0) {
            throw new RangeError('value at index ' + i + 'is zero');
        }
        sum += 1 / values[i];
    }
    return l / sum;
};

/**
 * Computes the contraharmonic mean of the given values
 * @param {Array} values
 * @returns {number}
 */
exports.contraHarmonicMean = function contraHarmonicMean(values) {
    var r1 = 0;
    var r2 = 0;
    var l = values.length;
    for (var i = 0; i < l; i++) {
        r1 += values[i] * values[i];
        r2 += values[i];
    }
    if (r2 < 0) {
        throw new RangeError('sum of values is negative');
    }
    return r1 / r2;
};

/**
 * Computes the median of the given values
 * @param {Array} values
 * @param {boolean} [alreadySorted=false]
 * @returns {number}
 */
exports.median = function median(values, alreadySorted) {
    if (alreadySorted === undefined) alreadySorted = false;
    if (!alreadySorted) {
        values = [].concat(values).sort(compareNumbers);
    }
    var l = values.length;
    var half = Math.floor(l / 2);
    if (l % 2 === 0) {
        return (values[half - 1] + values[half]) * 0.5;
    } else {
        return values[half];
    }
};

/**
 * Computes the variance of the given values
 * @param {Array} values
 * @param {boolean} [unbiased=true] - if true, divide by (n-1); if false, divide by n.
 * @returns {number}
 */
exports.variance = function variance(values, unbiased) {
    if (unbiased === undefined) unbiased = true;
    var theMean = exports.mean(values);
    var theVariance = 0;
    var l = values.length;

    for (var i = 0; i < l; i++) {
        var x = values[i] - theMean;
        theVariance += x * x;
    }

    if (unbiased) {
        return theVariance / (l - 1);
    } else {
        return theVariance / l;
    }
};

/**
 * Computes the standard deviation of the given values
 * @param {Array} values
 * @param {boolean} [unbiased=true] - if true, divide by (n-1); if false, divide by n.
 * @returns {number}
 */
exports.standardDeviation = function standardDeviation(values, unbiased) {
    return Math.sqrt(exports.variance(values, unbiased));
};

exports.standardError = function standardError(values) {
    return exports.standardDeviation(values) / Math.sqrt(values.length);
};

/**
 * IEEE Transactions on biomedical engineering, vol. 52, no. 1, january 2005, p. 76-
 * Calculate the standard deviation via the Median of the absolute deviation
 *  The formula for the standard deviation only holds for Gaussian random variables.
 * @returns {{mean: number, stdev: number}}
 */
exports.robustMeanAndStdev = function robustMeanAndStdev(y) {
    var mean = 0, stdev = 0;
    var length = y.length, i = 0;
    for (i = 0; i < length; i++) {
        mean += y[i];
    }
    mean /= length;
    var averageDeviations = new Array(length);
    for (i = 0; i < length; i++)
        averageDeviations[i] = Math.abs(y[i] - mean);
    averageDeviations.sort(compareNumbers);
    if (length % 2 === 1) {
        stdev = averageDeviations[(length - 1) / 2] / 0.6745;
    } else {
        stdev = 0.5 * (averageDeviations[length / 2] + averageDeviations[length / 2 - 1]) / 0.6745;
    }

    return {
        mean: mean,
        stdev: stdev
    };
};

exports.quartiles = function quartiles(values, alreadySorted) {
    if (typeof (alreadySorted) === 'undefined') alreadySorted = false;
    if (!alreadySorted) {
        values = [].concat(values).sort(compareNumbers);
    }

    var quart = values.length / 4;
    var q1 = values[Math.ceil(quart) - 1];
    var q2 = exports.median(values, true);
    var q3 = values[Math.ceil(quart * 3) - 1];

    return {q1: q1, q2: q2, q3: q3};
};

exports.pooledStandardDeviation = function pooledStandardDeviation(samples, unbiased) {
    return Math.sqrt(exports.pooledVariance(samples, unbiased));
};

exports.pooledVariance = function pooledVariance(samples, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var sum = 0;
    var length = 0, l = samples.length;
    for (var i = 0; i < l; i++) {
        var values = samples[i];
        var vari = exports.variance(values);

        sum += (values.length - 1) * vari;

        if (unbiased)
            length += values.length - 1;
        else
            length += values.length;
    }
    return sum / length;
};

exports.mode = function mode(values) {
    var l = values.length,
        itemCount = new Array(l),
        i;
    for (i = 0; i < l; i++) {
        itemCount[i] = 0;
    }
    var itemArray = new Array(l);
    var count = 0;

    for (i = 0; i < l; i++) {
        var index = itemArray.indexOf(values[i]);
        if (index >= 0)
            itemCount[index]++;
        else {
            itemArray[count] = values[i];
            itemCount[count] = 1;
            count++;
        }
    }

    var maxValue = 0, maxIndex = 0;
    for (i = 0; i < count; i++) {
        if (itemCount[i] > maxValue) {
            maxValue = itemCount[i];
            maxIndex = i;
        }
    }

    return itemArray[maxIndex];
};

exports.covariance = function covariance(vector1, vector2, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var mean1 = exports.mean(vector1);
    var mean2 = exports.mean(vector2);

    if (vector1.length !== vector2.length)
        throw 'Vectors do not have the same dimensions';

    var cov = 0, l = vector1.length;
    for (var i = 0; i < l; i++) {
        var x = vector1[i] - mean1;
        var y = vector2[i] - mean2;
        cov += x * y;
    }

    if (unbiased)
        return cov / (l - 1);
    else
        return cov / l;
};

exports.skewness = function skewness(values, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var theMean = exports.mean(values);

    var s2 = 0, s3 = 0, l = values.length;
    for (var i = 0; i < l; i++) {
        var dev = values[i] - theMean;
        s2 += dev * dev;
        s3 += dev * dev * dev;
    }
    var m2 = s2 / l;
    var m3 = s3 / l;

    var g = m3 / (Math.pow(m2, 3 / 2.0));
    if (unbiased) {
        var a = Math.sqrt(l * (l - 1));
        var b = l - 2;
        return (a / b) * g;
    } else {
        return g;
    }
};

exports.kurtosis = function kurtosis(values, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var theMean = exports.mean(values);
    var n = values.length, s2 = 0, s4 = 0;

    for (var i = 0; i < n; i++) {
        var dev = values[i] - theMean;
        s2 += dev * dev;
        s4 += dev * dev * dev * dev;
    }
    var m2 = s2 / n;
    var m4 = s4 / n;

    if (unbiased) {
        var v = s2 / (n - 1);
        var a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
        var b = s4 / (v * v);
        var c = ((n - 1) * (n - 1)) / ((n - 2) * (n - 3));

        return a * b - 3 * c;
    } else {
        return m4 / (m2 * m2) - 3;
    }
};

exports.entropy = function entropy(values, eps) {
    if (typeof (eps) === 'undefined') eps = 0;
    var sum = 0, l = values.length;
    for (var i = 0; i < l; i++)
        sum += values[i] * Math.log(values[i] + eps);
    return -sum;
};

exports.weightedMean = function weightedMean(values, weights) {
    var sum = 0, l = values.length;
    for (var i = 0; i < l; i++)
        sum += values[i] * weights[i];
    return sum;
};

exports.weightedStandardDeviation = function weightedStandardDeviation(values, weights) {
    return Math.sqrt(exports.weightedVariance(values, weights));
};

exports.weightedVariance = function weightedVariance(values, weights) {
    var theMean = exports.weightedMean(values, weights);
    var vari = 0, l = values.length;
    var a = 0, b = 0;

    for (var i = 0; i < l; i++) {
        var z = values[i] - theMean;
        var w = weights[i];

        vari += w * (z * z);
        b += w;
        a += w * w;
    }

    return vari * (b / (b * b - a));
};

exports.center = function center(values, inPlace) {
    if (typeof (inPlace) === 'undefined') inPlace = false;

    var result = values;
    if (!inPlace)
        result = [].concat(values);

    var theMean = exports.mean(result), l = result.length;
    for (var i = 0; i < l; i++)
        result[i] -= theMean;
};

exports.standardize = function standardize(values, standardDev, inPlace) {
    if (typeof (standardDev) === 'undefined') standardDev = exports.standardDeviation(values);
    if (typeof (inPlace) === 'undefined') inPlace = false;
    var l = values.length;
    var result = inPlace ? values : new Array(l);
    for (var i = 0; i < l; i++)
        result[i] = values[i] / standardDev;
    return result;
};

exports.cumulativeSum = function cumulativeSum(array) {
    var l = array.length;
    var result = new Array(l);
    result[0] = array[0];
    for (var i = 1; i < l; i++)
        result[i] = result[i - 1] + array[i];
    return result;
};
});

var matrix$1 = createCommonjsModule(function (module, exports) {
'use strict';



function compareNumbers(a, b) {
    return a - b;
}

exports.max = function max(matrix) {
    var max = -Infinity;
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] > max) max = matrix[i][j];
        }
    }
    return max;
};

exports.min = function min(matrix) {
    var min = Infinity;
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] < min) min = matrix[i][j];
        }
    }
    return min;
};

exports.minMax = function minMax(matrix) {
    var min = Infinity;
    var max = -Infinity;
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] < min) min = matrix[i][j];
            if (matrix[i][j] > max) max = matrix[i][j];
        }
    }
    return {
        min:min,
        max:max
    };
};

exports.entropy = function entropy(matrix, eps) {
    if (typeof (eps) === 'undefined') {
        eps = 0;
    }
    var sum = 0,
        l1 = matrix.length,
        l2 = matrix[0].length;
    for (var i = 0; i < l1; i++) {
        for (var j = 0; j < l2; j++) {
            sum += matrix[i][j] * Math.log(matrix[i][j] + eps);
        }
    }
    return -sum;
};

exports.mean = function mean(matrix, dimension) {
    if (typeof (dimension) === 'undefined') {
        dimension = 0;
    }
    var rows = matrix.length,
        cols = matrix[0].length,
        theMean, N, i, j;

    if (dimension === -1) {
        theMean = [0];
        N = rows * cols;
        for (i = 0; i < rows; i++) {
            for (j = 0; j < cols; j++) {
                theMean[0] += matrix[i][j];
            }
        }
        theMean[0] /= N;
    } else if (dimension === 0) {
        theMean = new Array(cols);
        N = rows;
        for (j = 0; j < cols; j++) {
            theMean[j] = 0;
            for (i = 0; i < rows; i++) {
                theMean[j] += matrix[i][j];
            }
            theMean[j] /= N;
        }
    } else if (dimension === 1) {
        theMean = new Array(rows);
        N = cols;
        for (j = 0; j < rows; j++) {
            theMean[j] = 0;
            for (i = 0; i < cols; i++) {
                theMean[j] += matrix[j][i];
            }
            theMean[j] /= N;
        }
    } else {
        throw new Error('Invalid dimension');
    }
    return theMean;
};

exports.sum = function sum(matrix, dimension) {
    if (typeof (dimension) === 'undefined') {
        dimension = 0;
    }
    var rows = matrix.length,
        cols = matrix[0].length,
        theSum, i, j;

    if (dimension === -1) {
        theSum = [0];
        for (i = 0; i < rows; i++) {
            for (j = 0; j < cols; j++) {
                theSum[0] += matrix[i][j];
            }
        }
    } else if (dimension === 0) {
        theSum = new Array(cols);
        for (j = 0; j < cols; j++) {
            theSum[j] = 0;
            for (i = 0; i < rows; i++) {
                theSum[j] += matrix[i][j];
            }
        }
    } else if (dimension === 1) {
        theSum = new Array(rows);
        for (j = 0; j < rows; j++) {
            theSum[j] = 0;
            for (i = 0; i < cols; i++) {
                theSum[j] += matrix[j][i];
            }
        }
    } else {
        throw new Error('Invalid dimension');
    }
    return theSum;
};

exports.product = function product(matrix, dimension) {
    if (typeof (dimension) === 'undefined') {
        dimension = 0;
    }
    var rows = matrix.length,
        cols = matrix[0].length,
        theProduct, i, j;

    if (dimension === -1) {
        theProduct = [1];
        for (i = 0; i < rows; i++) {
            for (j = 0; j < cols; j++) {
                theProduct[0] *= matrix[i][j];
            }
        }
    } else if (dimension === 0) {
        theProduct = new Array(cols);
        for (j = 0; j < cols; j++) {
            theProduct[j] = 1;
            for (i = 0; i < rows; i++) {
                theProduct[j] *= matrix[i][j];
            }
        }
    } else if (dimension === 1) {
        theProduct = new Array(rows);
        for (j = 0; j < rows; j++) {
            theProduct[j] = 1;
            for (i = 0; i < cols; i++) {
                theProduct[j] *= matrix[j][i];
            }
        }
    } else {
        throw new Error('Invalid dimension');
    }
    return theProduct;
};

exports.standardDeviation = function standardDeviation(matrix, means, unbiased) {
    var vari = exports.variance(matrix, means, unbiased), l = vari.length;
    for (var i = 0; i < l; i++) {
        vari[i] = Math.sqrt(vari[i]);
    }
    return vari;
};

exports.variance = function variance(matrix, means, unbiased) {
    if (typeof (unbiased) === 'undefined') {
        unbiased = true;
    }
    means = means || exports.mean(matrix);
    var rows = matrix.length;
    if (rows === 0) return [];
    var cols = matrix[0].length;
    var vari = new Array(cols);

    for (var j = 0; j < cols; j++) {
        var sum1 = 0, sum2 = 0, x = 0;
        for (var i = 0; i < rows; i++) {
            x = matrix[i][j] - means[j];
            sum1 += x;
            sum2 += x * x;
        }
        if (unbiased) {
            vari[j] = (sum2 - ((sum1 * sum1) / rows)) / (rows - 1);
        } else {
            vari[j] = (sum2 - ((sum1 * sum1) / rows)) / rows;
        }
    }
    return vari;
};

exports.median = function median(matrix) {
    var rows = matrix.length, cols = matrix[0].length;
    var medians = new Array(cols);

    for (var i = 0; i < cols; i++) {
        var data = new Array(rows);
        for (var j = 0; j < rows; j++) {
            data[j] = matrix[j][i];
        }
        data.sort(compareNumbers);
        var N = data.length;
        if (N % 2 === 0) {
            medians[i] = (data[N / 2] + data[(N / 2) - 1]) * 0.5;
        } else {
            medians[i] = data[Math.floor(N / 2)];
        }
    }
    return medians;
};

exports.mode = function mode(matrix) {
    var rows = matrix.length,
        cols = matrix[0].length,
        modes = new Array(cols),
        i, j;
    for (i = 0; i < cols; i++) {
        var itemCount = new Array(rows);
        for (var k = 0; k < rows; k++) {
            itemCount[k] = 0;
        }
        var itemArray = new Array(rows);
        var count = 0;

        for (j = 0; j < rows; j++) {
            var index = itemArray.indexOf(matrix[j][i]);
            if (index >= 0) {
                itemCount[index]++;
            } else {
                itemArray[count] = matrix[j][i];
                itemCount[count] = 1;
                count++;
            }
        }

        var maxValue = 0, maxIndex = 0;
        for (j = 0; j < count; j++) {
            if (itemCount[j] > maxValue) {
                maxValue = itemCount[j];
                maxIndex = j;
            }
        }

        modes[i] = itemArray[maxIndex];
    }
    return modes;
};

exports.skewness = function skewness(matrix, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var means = exports.mean(matrix);
    var n = matrix.length, l = means.length;
    var skew = new Array(l);

    for (var j = 0; j < l; j++) {
        var s2 = 0, s3 = 0;
        for (var i = 0; i < n; i++) {
            var dev = matrix[i][j] - means[j];
            s2 += dev * dev;
            s3 += dev * dev * dev;
        }

        var m2 = s2 / n;
        var m3 = s3 / n;
        var g = m3 / Math.pow(m2, 3 / 2);

        if (unbiased) {
            var a = Math.sqrt(n * (n - 1));
            var b = n - 2;
            skew[j] = (a / b) * g;
        } else {
            skew[j] = g;
        }
    }
    return skew;
};

exports.kurtosis = function kurtosis(matrix, unbiased) {
    if (typeof (unbiased) === 'undefined') unbiased = true;
    var means = exports.mean(matrix);
    var n = matrix.length, m = matrix[0].length;
    var kurt = new Array(m);

    for (var j = 0; j < m; j++) {
        var s2 = 0, s4 = 0;
        for (var i = 0; i < n; i++) {
            var dev = matrix[i][j] - means[j];
            s2 += dev * dev;
            s4 += dev * dev * dev * dev;
        }
        var m2 = s2 / n;
        var m4 = s4 / n;

        if (unbiased) {
            var v = s2 / (n - 1);
            var a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
            var b = s4 / (v * v);
            var c = ((n - 1) * (n - 1)) / ((n - 2) * (n - 3));
            kurt[j] = a * b - 3 * c;
        } else {
            kurt[j] = m4 / (m2 * m2) - 3;
        }
    }
    return kurt;
};

exports.standardError = function standardError(matrix) {
    var samples = matrix.length;
    var standardDeviations = exports.standardDeviation(matrix);
    var l = standardDeviations.length;
    var standardErrors = new Array(l);
    var sqrtN = Math.sqrt(samples);

    for (var i = 0; i < l; i++) {
        standardErrors[i] = standardDeviations[i] / sqrtN;
    }
    return standardErrors;
};

exports.covariance = function covariance(matrix, dimension) {
    return exports.scatter(matrix, undefined, dimension);
};

exports.scatter = function scatter(matrix, divisor, dimension) {
    if (typeof (dimension) === 'undefined') {
        dimension = 0;
    }
    if (typeof (divisor) === 'undefined') {
        if (dimension === 0) {
            divisor = matrix.length - 1;
        } else if (dimension === 1) {
            divisor = matrix[0].length - 1;
        }
    }
    var means = exports.mean(matrix, dimension);
    var rows = matrix.length;
    if (rows === 0) {
        return [[]];
    }
    var cols = matrix[0].length,
        cov, i, j, s, k;

    if (dimension === 0) {
        cov = new Array(cols);
        for (i = 0; i < cols; i++) {
            cov[i] = new Array(cols);
        }
        for (i = 0; i < cols; i++) {
            for (j = i; j < cols; j++) {
                s = 0;
                for (k = 0; k < rows; k++) {
                    s += (matrix[k][j] - means[j]) * (matrix[k][i] - means[i]);
                }
                s /= divisor;
                cov[i][j] = s;
                cov[j][i] = s;
            }
        }
    } else if (dimension === 1) {
        cov = new Array(rows);
        for (i = 0; i < rows; i++) {
            cov[i] = new Array(rows);
        }
        for (i = 0; i < rows; i++) {
            for (j = i; j < rows; j++) {
                s = 0;
                for (k = 0; k < cols; k++) {
                    s += (matrix[j][k] - means[j]) * (matrix[i][k] - means[i]);
                }
                s /= divisor;
                cov[i][j] = s;
                cov[j][i] = s;
            }
        }
    } else {
        throw new Error('Invalid dimension');
    }

    return cov;
};

exports.correlation = function correlation(matrix) {
    var means = exports.mean(matrix),
        standardDeviations = exports.standardDeviation(matrix, true, means),
        scores = exports.zScores(matrix, means, standardDeviations),
        rows = matrix.length,
        cols = matrix[0].length,
        i, j;

    var cor = new Array(cols);
    for (i = 0; i < cols; i++) {
        cor[i] = new Array(cols);
    }
    for (i = 0; i < cols; i++) {
        for (j = i; j < cols; j++) {
            var c = 0;
            for (var k = 0, l = scores.length; k < l; k++) {
                c += scores[k][j] * scores[k][i];
            }
            c /= rows - 1;
            cor[i][j] = c;
            cor[j][i] = c;
        }
    }
    return cor;
};

exports.zScores = function zScores(matrix, means, standardDeviations) {
    means = means || exports.mean(matrix);
    if (typeof (standardDeviations) === 'undefined') standardDeviations = exports.standardDeviation(matrix, true, means);
    return exports.standardize(exports.center(matrix, means, false), standardDeviations, true);
};

exports.center = function center(matrix, means, inPlace) {
    means = means || exports.mean(matrix);
    var result = matrix,
        l = matrix.length,
        i, j, jj;

    if (!inPlace) {
        result = new Array(l);
        for (i = 0; i < l; i++) {
            result[i] = new Array(matrix[i].length);
        }
    }

    for (i = 0; i < l; i++) {
        var row = result[i];
        for (j = 0, jj = row.length; j < jj; j++) {
            row[j] = matrix[i][j] - means[j];
        }
    }
    return result;
};

exports.standardize = function standardize(matrix, standardDeviations, inPlace) {
    if (typeof (standardDeviations) === 'undefined') standardDeviations = exports.standardDeviation(matrix);
    var result = matrix,
        l = matrix.length,
        i, j, jj;

    if (!inPlace) {
        result = new Array(l);
        for (i = 0; i < l; i++) {
            result[i] = new Array(matrix[i].length);
        }
    }

    for (i = 0; i < l; i++) {
        var resultRow = result[i];
        var sourceRow = matrix[i];
        for (j = 0, jj = resultRow.length; j < jj; j++) {
            if (standardDeviations[j] !== 0 && !isNaN(standardDeviations[j])) {
                resultRow[j] = sourceRow[j] / standardDeviations[j];
            }
        }
    }
    return result;
};

exports.weightedVariance = function weightedVariance(matrix, weights) {
    var means = exports.mean(matrix);
    var rows = matrix.length;
    if (rows === 0) return [];
    var cols = matrix[0].length;
    var vari = new Array(cols);

    for (var j = 0; j < cols; j++) {
        var sum = 0;
        var a = 0, b = 0;

        for (var i = 0; i < rows; i++) {
            var z = matrix[i][j] - means[j];
            var w = weights[i];

            sum += w * (z * z);
            b += w;
            a += w * w;
        }

        vari[j] = sum * (b / (b * b - a));
    }

    return vari;
};

exports.weightedMean = function weightedMean(matrix, weights, dimension) {
    if (typeof (dimension) === 'undefined') {
        dimension = 0;
    }
    var rows = matrix.length;
    if (rows === 0) return [];
    var cols = matrix[0].length,
        means, i, ii, j, w, row;

    if (dimension === 0) {
        means = new Array(cols);
        for (i = 0; i < cols; i++) {
            means[i] = 0;
        }
        for (i = 0; i < rows; i++) {
            row = matrix[i];
            w = weights[i];
            for (j = 0; j < cols; j++) {
                means[j] += row[j] * w;
            }
        }
    } else if (dimension === 1) {
        means = new Array(rows);
        for (i = 0; i < rows; i++) {
            means[i] = 0;
        }
        for (j = 0; j < rows; j++) {
            row = matrix[j];
            w = weights[j];
            for (i = 0; i < cols; i++) {
                means[j] += row[i] * w;
            }
        }
    } else {
        throw new Error('Invalid dimension');
    }

    var weightSum = array$1.sum(weights);
    if (weightSum !== 0) {
        for (i = 0, ii = means.length; i < ii; i++) {
            means[i] /= weightSum;
        }
    }
    return means;
};

exports.weightedCovariance = function weightedCovariance(matrix, weights, means, dimension) {
    dimension = dimension || 0;
    means = means || exports.weightedMean(matrix, weights, dimension);
    var s1 = 0, s2 = 0;
    for (var i = 0, ii = weights.length; i < ii; i++) {
        s1 += weights[i];
        s2 += weights[i] * weights[i];
    }
    var factor = s1 / (s1 * s1 - s2);
    return exports.weightedScatter(matrix, weights, means, factor, dimension);
};

exports.weightedScatter = function weightedScatter(matrix, weights, means, factor, dimension) {
    dimension = dimension || 0;
    means = means || exports.weightedMean(matrix, weights, dimension);
    if (typeof (factor) === 'undefined') {
        factor = 1;
    }
    var rows = matrix.length;
    if (rows === 0) {
        return [[]];
    }
    var cols = matrix[0].length,
        cov, i, j, k, s;

    if (dimension === 0) {
        cov = new Array(cols);
        for (i = 0; i < cols; i++) {
            cov[i] = new Array(cols);
        }
        for (i = 0; i < cols; i++) {
            for (j = i; j < cols; j++) {
                s = 0;
                for (k = 0; k < rows; k++) {
                    s += weights[k] * (matrix[k][j] - means[j]) * (matrix[k][i] - means[i]);
                }
                cov[i][j] = s * factor;
                cov[j][i] = s * factor;
            }
        }
    } else if (dimension === 1) {
        cov = new Array(rows);
        for (i = 0; i < rows; i++) {
            cov[i] = new Array(rows);
        }
        for (i = 0; i < rows; i++) {
            for (j = i; j < rows; j++) {
                s = 0;
                for (k = 0; k < cols; k++) {
                    s += weights[k] * (matrix[j][k] - means[j]) * (matrix[i][k] - means[i]);
                }
                cov[i][j] = s * factor;
                cov[j][i] = s * factor;
            }
        }
    } else {
        throw new Error('Invalid dimension');
    }

    return cov;
};
});

var array = array$1;
var matrix = matrix$1;

var index$27 = {
	array: array,
	matrix: matrix
};

const Stat = index$27.array;
/**
 * Function that returns an array of points given 1D array as follows:
 *
 * [x1, y1, .. , x2, y2, ..]
 *
 * And receive the number of dimensions of each point.
 * @param array
 * @param dimensions
 * @returns {Array} - Array of points.
 */
function coordArrayToPoints(array, dimensions) {
    if(array.length % dimensions !== 0) {
        throw new RangeError('Dimensions number must be accordance with the size of the array.');
    }

    var length = array.length / dimensions;
    var pointsArr = new Array(length);

    var k = 0;
    for(var i = 0; i < array.length; i += dimensions) {
        var point = new Array(dimensions);
        for(var j = 0; j < dimensions; ++j) {
            point[j] = array[i + j];
        }

        pointsArr[k] = point;
        k++;
    }

    return pointsArr;
}


/**
 * Function that given an array as follows:
 * [x1, y1, .. , x2, y2, ..]
 *
 * Returns an array as follows:
 * [[x1, x2, ..], [y1, y2, ..], [ .. ]]
 *
 * And receives the number of dimensions of each coordinate.
 * @param array
 * @param dimensions
 * @returns {Array} - Matrix of coordinates
 */
function coordArrayToCoordMatrix(array, dimensions) {
    if(array.length % dimensions !== 0) {
        throw new RangeError('Dimensions number must be accordance with the size of the array.');
    }

    var coordinatesArray = new Array(dimensions);
    var points = array.length / dimensions;
    for (var i = 0; i < coordinatesArray.length; i++) {
        coordinatesArray[i] = new Array(points);
    }

    for(i = 0; i < array.length; i += dimensions) {
        for(var j = 0; j < dimensions; ++j) {
            var currentPoint = Math.floor(i / dimensions);
            coordinatesArray[j][currentPoint] = array[i + j];
        }
    }

    return coordinatesArray;
}

/**
 * Function that receives a coordinate matrix as follows:
 * [[x1, x2, ..], [y1, y2, ..], [ .. ]]
 *
 * Returns an array of coordinates as follows:
 * [x1, y1, .. , x2, y2, ..]
 *
 * @param coordMatrix
 * @returns {Array}
 */
function coordMatrixToCoordArray(coordMatrix) {
    var coodinatesArray = new Array(coordMatrix.length * coordMatrix[0].length);
    var k = 0;
    for(var i = 0; i < coordMatrix[0].length; ++i) {
        for(var j = 0; j < coordMatrix.length; ++j) {
            coodinatesArray[k] = coordMatrix[j][i];
            ++k;
        }
    }

    return coodinatesArray;
}

/**
 * Tranpose a matrix, this method is for coordMatrixToPoints and
 * pointsToCoordMatrix, that because only transposing the matrix
 * you can change your representation.
 *
 * @param matrix
 * @returns {Array}
 */
function transpose(matrix) {
    var resultMatrix = new Array(matrix[0].length);
    for(var i = 0; i < resultMatrix.length; ++i) {
        resultMatrix[i] = new Array(matrix.length);
    }

    for (i = 0; i < matrix.length; ++i) {
        for(var j = 0; j < matrix[0].length; ++j) {
            resultMatrix[j][i] = matrix[i][j];
        }
    }

    return resultMatrix;
}

/**
 * Function that transform an array of points into a coordinates array
 * as follows:
 * [x1, y1, .. , x2, y2, ..]
 *
 * @param points
 * @returns {Array}
 */
function pointsToCoordArray(points) {
    var coodinatesArray = new Array(points.length * points[0].length);
    var k = 0;
    for(var i = 0; i < points.length; ++i) {
        for(var j = 0; j < points[0].length; ++j) {
            coodinatesArray[k] = points[i][j];
            ++k;
        }
    }

    return coodinatesArray;
}

/**
 * Apply the dot product between the smaller vector and a subsets of the
 * largest one.
 *
 * @param firstVector
 * @param secondVector
 * @returns {Array} each dot product of size of the difference between the
 *                  larger and the smallest one.
 */
function applyDotProduct(firstVector, secondVector) {
    var largestVector, smallestVector;
    if(firstVector.length <= secondVector.length) {
        smallestVector = firstVector;
        largestVector = secondVector;
    } else {
        smallestVector = secondVector;
        largestVector = firstVector;
    }

    var difference = largestVector.length - smallestVector.length + 1;
    var dotProductApplied = new Array(difference);

    for (var i = 0; i < difference; ++i) {
        var sum = 0;
        for (var j = 0; j < smallestVector.length; ++j) {
            sum += smallestVector[j] * largestVector[i + j];
        }
        dotProductApplied[i] = sum;
    }

    return dotProductApplied;
}
/**
 * To scale the input array between the specified min and max values. The operation is performed inplace
 * if the options.inplace is specified. If only one of the min or max parameters is specified, then the scaling
 * will multiply the input array by min/min(input) or max/max(input)
 * @param input
 * @param options
 * @returns {*}
 */
function scale(input, options){
    var y;
    if(options.inPlace){
        y = input;
    }
    else{
        y = new Array(input.length);
    }
    const max = options.max;
    const min = options.min;
    if(typeof max === "number"){
        if(typeof min === "number"){
            var minMax = Stat.minMax(input);
            var factor = (max - min)/(minMax.max-minMax.min);
            for(var i=0;i< y.length;i++){
                y[i]=(input[i]-minMax.min)*factor+min;
            }
        }
        else{
            var currentMin = Stat.max(input);
            var factor = max/currentMin;
            for(var i=0;i< y.length;i++){
                y[i] = input[i]*factor;
            }
        }
    }
    else{
        if(typeof min === "number"){
            var currentMin = Stat.min(input);
            var factor = min/currentMin;
            for(var i=0;i< y.length;i++){
                y[i] = input[i]*factor;
            }
        }
    }
    return y;
}

var ArrayUtils = {
    coordArrayToPoints: coordArrayToPoints,
    coordArrayToCoordMatrix: coordArrayToCoordMatrix,
    coordMatrixToCoordArray: coordMatrixToCoordArray,
    coordMatrixToPoints: transpose,
    pointsToCoordArray: pointsToCoordArray,
    pointsToCoordMatrix: transpose,
    applyDotProduct: applyDotProduct,
    scale:scale
};

/**
 *
 * Function that returns a Number array of equally spaced numberOfPoints
 * containing a representation of intensities of the spectra arguments x
 * and y.
 *
 * The options parameter contains an object in the following form:
 * from: starting point
 * to: last point
 * numberOfPoints: number of points between from and to
 * variant: "slot" or "smooth" - smooth is the default option
 *
 * The slot variant consist that each point in the new array is calculated
 * averaging the existing points between the slot that belongs to the current
 * value. The smooth variant is the same but takes the integral of the range
 * of the slot and divide by the step size between two points in the new array.
 *
 * @param x - sorted increasing x values
 * @param y
 * @param options
 * @returns {Array} new array with the equally spaced data.
 *
 */
function getEquallySpacedData(x, y, options) {
    if (x.length>1 && x[0]>x[1]) {
        x=x.slice().reverse();
        y=y.slice().reverse();
    }

    var xLength = x.length;
    if(xLength !== y.length)
        throw new RangeError("the x and y vector doesn't have the same size.");

    if (options === undefined) options = {};

    var from = options.from === undefined ? x[0] : options.from;
    if (isNaN(from) || !isFinite(from)) {
        throw new RangeError("'From' value must be a number");
    }
    var to = options.to === undefined ? x[x.length - 1] : options.to;
    if (isNaN(to) || !isFinite(to)) {
        throw new RangeError("'To' value must be a number");
    }

    var reverse = from > to;
    if(reverse) {
        var temp = from;
        from = to;
        to = temp;
    }

    var numberOfPoints = options.numberOfPoints === undefined ? 100 : options.numberOfPoints;
    if (isNaN(numberOfPoints) || !isFinite(numberOfPoints)) {
        throw new RangeError("'Number of points' value must be a number");
    }
    if(numberOfPoints < 1)
        throw new RangeError("the number of point must be higher than 1");

    var algorithm = options.variant === "slot" ? "slot" : "smooth"; // default value: smooth

    var output = algorithm === "slot" ? getEquallySpacedSlot(x, y, from, to, numberOfPoints) : getEquallySpacedSmooth(x, y, from, to, numberOfPoints);

    return reverse ? output.reverse() : output;
}

/**
 * function that retrieves the getEquallySpacedData with the variant "smooth"
 *
 * @param x
 * @param y
 * @param from - Initial point
 * @param to - Final point
 * @param numberOfPoints
 * @returns {Array} - Array of y's equally spaced with the variant "smooth"
 */
function getEquallySpacedSmooth(x, y, from, to, numberOfPoints) {
    var xLength = x.length;

    var step = (to - from) / (numberOfPoints - 1);
    var halfStep = step / 2;

    var start = from - halfStep;
    var output = new Array(numberOfPoints);

    var initialOriginalStep = x[1] - x[0];
    var lastOriginalStep = x[x.length - 1] - x[x.length - 2];

    // Init main variables
    var min = start;
    var max = start + step;

    var previousX = Number.MIN_VALUE;
    var previousY = 0;
    var nextX = x[0] - initialOriginalStep;
    var nextY = 0;

    var currentValue = 0;
    var slope = 0;
    var intercept = 0;
    var sumAtMin = 0;
    var sumAtMax = 0;

    var i = 0; // index of input
    var j = 0; // index of output

    function getSlope(x0, y0, x1, y1) {
        return (y1 - y0) / (x1 - x0);
    }

    main: while(true) {
        while (nextX - max >= 0) {
            // no overlap with original point, just consume current value
            var add = integral(0, max - previousX, slope, previousY);
            sumAtMax = currentValue + add;

            output[j] = (sumAtMax - sumAtMin) / step;
            j++;

            if (j === numberOfPoints)
                break main;

            min = max;
            max += step;
            sumAtMin = sumAtMax;
        }

        if(previousX <= min && min <= nextX) {
            add = integral(0, min - previousX, slope, previousY);
            sumAtMin = currentValue + add;
        }

        currentValue += integral(previousX, nextX, slope, intercept);

        previousX = nextX;
        previousY = nextY;

        if (i < xLength) {
            nextX = x[i];
            nextY = y[i];
            i++;
        } else if (i === xLength) {
            nextX += lastOriginalStep;
            nextY = 0;
        }
        // updating parameters
        slope = getSlope(previousX, previousY, nextX, nextY);
        intercept = -slope*previousX + previousY;
    }

    return output;
}

/**
 * function that retrieves the getEquallySpacedData with the variant "slot"
 *
 * @param x
 * @param y
 * @param from - Initial point
 * @param to - Final point
 * @param numberOfPoints
 * @returns {Array} - Array of y's equally spaced with the variant "slot"
 */
function getEquallySpacedSlot(x, y, from, to, numberOfPoints) {
    var xLength = x.length;

    var step = (to - from) / (numberOfPoints - 1);
    var halfStep = step / 2;
    var lastStep = x[x.length - 1] - x[x.length - 2];

    var start = from - halfStep;
    var output = new Array(numberOfPoints);

    // Init main variables
    var min = start;
    var max = start + step;

    var previousX = -Number.MAX_VALUE;
    var previousY = 0;
    var nextX = x[0];
    var nextY = y[0];
    var frontOutsideSpectra = 0;
    var backOutsideSpectra = true;

    var currentValue = 0;

    // for slot algorithm
    var currentPoints = 0;

    var i = 1; // index of input
    var j = 0; // index of output

    main: while(true) {
        if (previousX>=nextX) throw (new Error('x must be an increasing serie'));
        while (previousX - max > 0) {
            // no overlap with original point, just consume current value
            if(backOutsideSpectra) {
                currentPoints++;
                backOutsideSpectra = false;
            }

            output[j] = currentPoints <= 0 ? 0 : currentValue / currentPoints;
            j++;

            if (j === numberOfPoints)
                break main;

            min = max;
            max += step;
            currentValue = 0;
            currentPoints = 0;
        }

        if(previousX > min) {
            currentValue += previousY;
            currentPoints++;
        }

        if(previousX === -Number.MAX_VALUE || frontOutsideSpectra > 1)
            currentPoints--;

        previousX = nextX;
        previousY = nextY;

        if (i < xLength) {
            nextX = x[i];
            nextY = y[i];
            i++;
        } else {
            nextX += lastStep;
            nextY = 0;
            frontOutsideSpectra++;
        }
    }

    return output;
}
/**
 * Function that calculates the integral of the line between two
 * x-coordinates, given the slope and intercept of the line.
 *
 * @param x0
 * @param x1
 * @param slope
 * @param intercept
 * @returns {number} integral value.
 */
function integral(x0, x1, slope, intercept) {
    return (0.5 * slope * x1 * x1 + intercept * x1) - (0.5 * slope * x0 * x0 + intercept * x0);
}

var getEquallySpacedData_1 = getEquallySpacedData;
var integral_1 = integral;

var getEquallySpaced = {
	getEquallySpacedData: getEquallySpacedData_1,
	integral: integral_1
};

var SNV_1 = SNV;
var Stat$1 = index$27.array;

/**
 * Function that applies the standard normal variate (SNV) to an array of values.
 *
 * @param data - Array of values.
 * @returns {Array} - applied the SNV.
 */
function SNV(data) {
    var mean = Stat$1.mean(data);
    var std = Stat$1.standardDeviation(data);
    var result = data.slice();
    for (var i = 0; i < data.length; i++) {
        result[i] = (result[i] - mean) / std;
    }
    return result;
}

var snv = {
	SNV: SNV_1
};

var index$25 = createCommonjsModule(function (module, exports) {
module.exports = exports = ArrayUtils;


exports.getEquallySpacedData = getEquallySpaced.getEquallySpacedData;
exports.SNV = snv.SNV;
});

var index_1$4 = index$25.scale;

/**
 * @private
 * Check that a row index is not out of bounds
 * @param {Matrix} matrix
 * @param {number} index
 * @param {boolean} [outer]
 */
function checkRowIndex(matrix, index, outer) {
    var max = outer ? matrix.rows : matrix.rows - 1;
    if (index < 0 || index > max) {
        throw new RangeError('Row index out of range');
    }
}

/**
 * @private
 * Check that a column index is not out of bounds
 * @param {Matrix} matrix
 * @param {number} index
 * @param {boolean} [outer]
 */
function checkColumnIndex(matrix, index, outer) {
    var max = outer ? matrix.columns : matrix.columns - 1;
    if (index < 0 || index > max) {
        throw new RangeError('Column index out of range');
    }
}

/**
 * @private
 * Check that the provided vector is an array with the right length
 * @param {Matrix} matrix
 * @param {Array|Matrix} vector
 * @return {Array}
 * @throws {RangeError}
 */
function checkRowVector(matrix, vector) {
    if (vector.to1DArray) {
        vector = vector.to1DArray();
    }
    if (vector.length !== matrix.columns) {
        throw new RangeError('vector size must be the same as the number of columns');
    }
    return vector;
}

/**
 * @private
 * Check that the provided vector is an array with the right length
 * @param {Matrix} matrix
 * @param {Array|Matrix} vector
 * @return {Array}
 * @throws {RangeError}
 */
function checkColumnVector(matrix, vector) {
    if (vector.to1DArray) {
        vector = vector.to1DArray();
    }
    if (vector.length !== matrix.rows) {
        throw new RangeError('vector size must be the same as the number of rows');
    }
    return vector;
}

function checkIndices(matrix, rowIndices, columnIndices) {
    var rowOut = rowIndices.some(r => {
        return r < 0 || r >= matrix.rows;

    });

    var columnOut = columnIndices.some(c => {
        return c < 0 || c >= matrix.columns;
    });

    if (rowOut || columnOut) {
        throw new RangeError('Indices are out of range');
    }

    if (typeof rowIndices !== 'object' || typeof columnIndices !== 'object') {
        throw new TypeError('Unexpected type for row/column indices');
    }
    if (!Array.isArray(rowIndices)) rowIndices = Array.from(rowIndices);
    if (!Array.isArray(columnIndices)) rowIndices = Array.from(columnIndices);

    return {
        row: rowIndices,
        column: columnIndices
    };
}

function checkRange(matrix, startRow, endRow, startColumn, endColumn) {
    if (arguments.length !== 5) throw new TypeError('Invalid argument type');
    var notAllNumbers = Array.from(arguments).slice(1).some(function (arg) {
        return typeof arg !== 'number';
    });
    if (notAllNumbers) throw new TypeError('Invalid argument type');
    if (startRow > endRow || startColumn > endColumn || startRow < 0 || startRow >= matrix.rows || endRow < 0 || endRow >= matrix.rows || startColumn < 0 || startColumn >= matrix.columns || endColumn < 0 || endColumn >= matrix.columns) {
        throw new RangeError('Submatrix indices are out of range');
    }
}



function sumByRow(matrix) {
    var sum = Matrix.zeros(matrix.rows, 1);
    for (var i = 0; i < matrix.rows; ++i) {
        for (var j = 0; j < matrix.columns; ++j) {
            sum.set(i, 0, sum.get(i, 0) + matrix.get(i, j));
        }
    }
    return sum;
}

function sumByColumn(matrix) {
    var sum = Matrix.zeros(1, matrix.columns);
    for (var i = 0; i < matrix.rows; ++i) {
        for (var j = 0; j < matrix.columns; ++j) {
            sum.set(0, j, sum.get(0, j) + matrix.get(i, j));
        }
    }
    return sum;
}

function sumAll(matrix) {
    var v = 0;
    for (var i = 0; i < matrix.rows; i++) {
        for (var j = 0; j < matrix.columns; j++) {
            v += matrix.get(i, j);
        }
    }
    return v;
}

class BaseView extends AbstractMatrix() {
    constructor(matrix, rows, columns) {
        super();
        this.matrix = matrix;
        this.rows = rows;
        this.columns = columns;
    }

    static get [Symbol.species]() {
        return Matrix;
    }
}

class MatrixTransposeView extends BaseView {
    constructor(matrix) {
        super(matrix, matrix.columns, matrix.rows);
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(columnIndex, rowIndex, value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(columnIndex, rowIndex);
    }
}

class MatrixRowView extends BaseView {
    constructor(matrix, row) {
        super(matrix, 1, matrix.columns);
        this.row = row;
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(this.row, columnIndex, value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(this.row, columnIndex);
    }
}

class MatrixSubView extends BaseView {
    constructor(matrix, startRow, endRow, startColumn, endColumn) {
        checkRange(matrix, startRow, endRow, startColumn, endColumn);
        super(matrix, endRow - startRow + 1, endColumn - startColumn + 1);
        this.startRow = startRow;
        this.startColumn = startColumn;
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(this.startRow + rowIndex, this.startColumn + columnIndex, value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(this.startRow + rowIndex, this.startColumn + columnIndex);
    }
}

class MatrixSelectionView extends BaseView {
    constructor(matrix, rowIndices, columnIndices) {
        var indices = checkIndices(matrix, rowIndices, columnIndices);
        super(matrix, indices.row.length, indices.column.length);
        this.rowIndices = indices.row;
        this.columnIndices = indices.column;
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(this.rowIndices[rowIndex], this.columnIndices[columnIndex], value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(this.rowIndices[rowIndex], this.columnIndices[columnIndex]);
    }
}

class MatrixColumnView extends BaseView {
    constructor(matrix, column) {
        super(matrix, matrix.rows, 1);
        this.column = column;
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(rowIndex, this.column, value);
        return this;
    }

    get(rowIndex) {
        return this.matrix.get(rowIndex, this.column);
    }
}

class MatrixFlipRowView extends BaseView {
    constructor(matrix) {
        super(matrix, matrix.rows, matrix.columns);
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(this.rows - rowIndex - 1, columnIndex, value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(this.rows - rowIndex - 1, columnIndex);
    }
}

class MatrixFlipColumnView extends BaseView {
    constructor(matrix) {
        super(matrix, matrix.rows, matrix.columns);
    }

    set(rowIndex, columnIndex, value) {
        this.matrix.set(rowIndex, this.columns - columnIndex - 1, value);
        return this;
    }

    get(rowIndex, columnIndex) {
        return this.matrix.get(rowIndex, this.columns - columnIndex - 1);
    }
}

function AbstractMatrix(superCtor) {
    if (superCtor === undefined) superCtor = Object;

    /**
     * Real matrix
     * @class Matrix
     * @param {number|Array|Matrix} nRows - Number of rows of the new matrix,
     * 2D array containing the data or Matrix instance to clone
     * @param {number} [nColumns] - Number of columns of the new matrix
     */
    class Matrix extends superCtor {
        static get [Symbol.species]() {
            return this;
        }

        /**
         * Constructs a Matrix with the chosen dimensions from a 1D array
         * @param {number} newRows - Number of rows
         * @param {number} newColumns - Number of columns
         * @param {Array} newData - A 1D array containing data for the matrix
         * @return {Matrix} - The new matrix
         */
        static from1DArray(newRows, newColumns, newData) {
            var length = newRows * newColumns;
            if (length !== newData.length) {
                throw new RangeError('Data length does not match given dimensions');
            }
            var newMatrix = new this(newRows, newColumns);
            for (var row = 0; row < newRows; row++) {
                for (var column = 0; column < newColumns; column++) {
                    newMatrix.set(row, column, newData[row * newColumns + column]);
                }
            }
            return newMatrix;
        }

        /**
         * Creates a row vector, a matrix with only one row.
         * @param {Array} newData - A 1D array containing data for the vector
         * @return {Matrix} - The new matrix
         */
        static rowVector(newData) {
            var vector = new this(1, newData.length);
            for (var i = 0; i < newData.length; i++) {
                vector.set(0, i, newData[i]);
            }
            return vector;
        }

        /**
         * Creates a column vector, a matrix with only one column.
         * @param {Array} newData - A 1D array containing data for the vector
         * @return {Matrix} - The new matrix
         */
        static columnVector(newData) {
            var vector = new this(newData.length, 1);
            for (var i = 0; i < newData.length; i++) {
                vector.set(i, 0, newData[i]);
            }
            return vector;
        }

        /**
         * Creates an empty matrix with the given dimensions. Values will be undefined. Same as using new Matrix(rows, columns).
         * @param {number} rows - Number of rows
         * @param {number} columns - Number of columns
         * @return {Matrix} - The new matrix
         */
        static empty(rows, columns) {
            return new this(rows, columns);
        }

        /**
         * Creates a matrix with the given dimensions. Values will be set to zero.
         * @param {number} rows - Number of rows
         * @param {number} columns - Number of columns
         * @return {Matrix} - The new matrix
         */
        static zeros(rows, columns) {
            return this.empty(rows, columns).fill(0);
        }

        /**
         * Creates a matrix with the given dimensions. Values will be set to one.
         * @param {number} rows - Number of rows
         * @param {number} columns - Number of columns
         * @return {Matrix} - The new matrix
         */
        static ones(rows, columns) {
            return this.empty(rows, columns).fill(1);
        }

        /**
         * Creates a matrix with the given dimensions. Values will be randomly set.
         * @param {number} rows - Number of rows
         * @param {number} columns - Number of columns
         * @param {function} [rng=Math.random] - Random number generator
         * @return {Matrix} The new matrix
         */
        static rand(rows, columns, rng) {
            if (rng === undefined) rng = Math.random;
            var matrix = this.empty(rows, columns);
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < columns; j++) {
                    matrix.set(i, j, rng());
                }
            }
            return matrix;
        }

        /**
         * Creates a matrix with the given dimensions. Values will be random integers.
         * @param {number} rows - Number of rows
         * @param {number} columns - Number of columns
         * @param {number} [maxValue=1000] - Maximum value
         * @param {function} [rng=Math.random] - Random number generator
         * @return {Matrix} The new matrix
         */
        static randInt(rows, columns, maxValue, rng) {
            if (maxValue === undefined) maxValue = 1000;
            if (rng === undefined) rng = Math.random;
            var matrix = this.empty(rows, columns);
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < columns; j++) {
                    var value = Math.floor(rng() * maxValue);
                    matrix.set(i, j, value);
                }
            }
            return matrix;
        }

        /**
         * Creates an identity matrix with the given dimension. Values of the diagonal will be 1 and others will be 0.
         * @param {number} rows - Number of rows
         * @param {number} [columns=rows] - Number of columns
         * @param {number} [value=1] - Value to fill the diagonal with
         * @return {Matrix} - The new identity matrix
         */
        static eye(rows, columns, value) {
            if (columns === undefined) columns = rows;
            if (value === undefined) value = 1;
            var min = Math.min(rows, columns);
            var matrix = this.zeros(rows, columns);
            for (var i = 0; i < min; i++) {
                matrix.set(i, i, value);
            }
            return matrix;
        }

        /**
         * Creates a diagonal matrix based on the given array.
         * @param {Array} data - Array containing the data for the diagonal
         * @param {number} [rows] - Number of rows (Default: data.length)
         * @param {number} [columns] - Number of columns (Default: rows)
         * @return {Matrix} - The new diagonal matrix
         */
        static diag(data, rows, columns) {
            var l = data.length;
            if (rows === undefined) rows = l;
            if (columns === undefined) columns = rows;
            var min = Math.min(l, rows, columns);
            var matrix = this.zeros(rows, columns);
            for (var i = 0; i < min; i++) {
                matrix.set(i, i, data[i]);
            }
            return matrix;
        }

        /**
         * Returns a matrix whose elements are the minimum between matrix1 and matrix2
         * @param {Matrix} matrix1
         * @param {Matrix} matrix2
         * @return {Matrix}
         */
        static min(matrix1, matrix2) {
            matrix1 = this.checkMatrix(matrix1);
            matrix2 = this.checkMatrix(matrix2);
            var rows = matrix1.rows;
            var columns = matrix1.columns;
            var result = new this(rows, columns);
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < columns; j++) {
                    result.set(i, j, Math.min(matrix1.get(i, j), matrix2.get(i, j)));
                }
            }
            return result;
        }

        /**
         * Returns a matrix whose elements are the maximum between matrix1 and matrix2
         * @param {Matrix} matrix1
         * @param {Matrix} matrix2
         * @return {Matrix}
         */
        static max(matrix1, matrix2) {
            matrix1 = this.checkMatrix(matrix1);
            matrix2 = this.checkMatrix(matrix2);
            var rows = matrix1.rows;
            var columns = matrix1.columns;
            var result = new this(rows, columns);
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < columns; j++) {
                    result.set(i, j, Math.max(matrix1.get(i, j), matrix2.get(i, j)));
                }
            }
            return result;
        }

        /**
         * Check that the provided value is a Matrix and tries to instantiate one if not
         * @param {*} value - The value to check
         * @return {Matrix}
         */
        static checkMatrix(value) {
            return Matrix.isMatrix(value) ? value : new this(value);
        }

        /**
         * Returns true if the argument is a Matrix, false otherwise
         * @param {*} value - The value to check
         * @return {boolean}
         */
        static isMatrix(value) {
            return (value != null) && (value.klass === 'Matrix');
        }

        /**
         * @prop {number} size - The number of elements in the matrix.
         */
        get size() {
            return this.rows * this.columns;
        }

        /**
         * Applies a callback for each element of the matrix. The function is called in the matrix (this) context.
         * @param {function} callback - Function that will be called with two parameters : i (row) and j (column)
         * @return {Matrix} this
         */
        apply(callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            var ii = this.rows;
            var jj = this.columns;
            for (var i = 0; i < ii; i++) {
                for (var j = 0; j < jj; j++) {
                    callback.call(this, i, j);
                }
            }
            return this;
        }

        /**
         * Returns a new 1D array filled row by row with the matrix values
         * @return {Array}
         */
        to1DArray() {
            var array = new Array(this.size);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    array[i * this.columns + j] = this.get(i, j);
                }
            }
            return array;
        }

        /**
         * Returns a 2D array containing a copy of the data
         * @return {Array}
         */
        to2DArray() {
            var copy = new Array(this.rows);
            for (var i = 0; i < this.rows; i++) {
                copy[i] = new Array(this.columns);
                for (var j = 0; j < this.columns; j++) {
                    copy[i][j] = this.get(i, j);
                }
            }
            return copy;
        }

        /**
         * @return {boolean} true if the matrix has one row
         */
        isRowVector() {
            return this.rows === 1;
        }

        /**
         * @return {boolean} true if the matrix has one column
         */
        isColumnVector() {
            return this.columns === 1;
        }

        /**
         * @return {boolean} true if the matrix has one row or one column
         */
        isVector() {
            return (this.rows === 1) || (this.columns === 1);
        }

        /**
         * @return {boolean} true if the matrix has the same number of rows and columns
         */
        isSquare() {
            return this.rows === this.columns;
        }

        /**
         * @return {boolean} true if the matrix is square and has the same values on both sides of the diagonal
         */
        isSymmetric() {
            if (this.isSquare()) {
                for (var i = 0; i < this.rows; i++) {
                    for (var j = 0; j <= i; j++) {
                        if (this.get(i, j) !== this.get(j, i)) {
                            return false;
                        }
                    }
                }
                return true;
            }
            return false;
        }

        /**
         * Sets a given element of the matrix. mat.set(3,4,1) is equivalent to mat[3][4]=1
         * @abstract
         * @param {number} rowIndex - Index of the row
         * @param {number} columnIndex - Index of the column
         * @param {number} value - The new value for the element
         * @return {Matrix} this
         */
        set(rowIndex, columnIndex, value) { // eslint-disable-line no-unused-vars
            throw new Error('set method is unimplemented');
        }

        /**
         * Returns the given element of the matrix. mat.get(3,4) is equivalent to matrix[3][4]
         * @abstract
         * @param {number} rowIndex - Index of the row
         * @param {number} columnIndex - Index of the column
         * @return {number}
         */
        get(rowIndex, columnIndex) { // eslint-disable-line no-unused-vars
            throw new Error('get method is unimplemented');
        }

        /**
         * Creates a new matrix that is a repetition of the current matrix. New matrix has rowRep times the number of
         * rows of the matrix, and colRep times the number of columns of the matrix
         * @param {number} rowRep - Number of times the rows should be repeated
         * @param {number} colRep - Number of times the columns should be re
         * @return {Matrix}
         * @example
         * var matrix = new Matrix([[1,2]]);
         * matrix.repeat(2); // [[1,2],[1,2]]
         */
        repeat(rowRep, colRep) {
            rowRep = rowRep || 1;
            colRep = colRep || 1;
            var matrix = new this.constructor[Symbol.species](this.rows * rowRep, this.columns * colRep);
            for (var i = 0; i < rowRep; i++) {
                for (var j = 0; j < colRep; j++) {
                    matrix.setSubMatrix(this, this.rows * i, this.columns * j);
                }
            }
            return matrix;
        }

        /**
         * Fills the matrix with a given value. All elements will be set to this value.
         * @param {number} value - New value
         * @return {Matrix} this
         */
        fill(value) {
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, value);
                }
            }
            return this;
        }

        /**
         * Negates the matrix. All elements will be multiplied by (-1)
         * @return {Matrix} this
         */
        neg() {
            return this.mulS(-1);
        }

        /**
         * Returns a new array from the given row index
         * @param {number} index - Row index
         * @return {Array}
         */
        getRow(index) {
            checkRowIndex(this, index);
            var row = new Array(this.columns);
            for (var i = 0; i < this.columns; i++) {
                row[i] = this.get(index, i);
            }
            return row;
        }

        /**
         * Returns a new row vector from the given row index
         * @param {number} index - Row index
         * @return {Matrix}
         */
        getRowVector(index) {
            return this.constructor.rowVector(this.getRow(index));
        }

        /**
         * Sets a row at the given index
         * @param {number} index - Row index
         * @param {Array|Matrix} array - Array or vector
         * @return {Matrix} this
         */
        setRow(index, array) {
            checkRowIndex(this, index);
            array = checkRowVector(this, array);
            for (var i = 0; i < this.columns; i++) {
                this.set(index, i, array[i]);
            }
            return this;
        }

        /**
         * Swaps two rows
         * @param {number} row1 - First row index
         * @param {number} row2 - Second row index
         * @return {Matrix} this
         */
        swapRows(row1, row2) {
            checkRowIndex(this, row1);
            checkRowIndex(this, row2);
            for (var i = 0; i < this.columns; i++) {
                var temp = this.get(row1, i);
                this.set(row1, i, this.get(row2, i));
                this.set(row2, i, temp);
            }
            return this;
        }

        /**
         * Returns a new array from the given column index
         * @param {number} index - Column index
         * @return {Array}
         */
        getColumn(index) {
            checkColumnIndex(this, index);
            var column = new Array(this.rows);
            for (var i = 0; i < this.rows; i++) {
                column[i] = this.get(i, index);
            }
            return column;
        }

        /**
         * Returns a new column vector from the given column index
         * @param {number} index - Column index
         * @return {Matrix}
         */
        getColumnVector(index) {
            return this.constructor.columnVector(this.getColumn(index));
        }

        /**
         * Sets a column at the given index
         * @param {number} index - Column index
         * @param {Array|Matrix} array - Array or vector
         * @return {Matrix} this
         */
        setColumn(index, array) {
            checkColumnIndex(this, index);
            array = checkColumnVector(this, array);
            for (var i = 0; i < this.rows; i++) {
                this.set(i, index, array[i]);
            }
            return this;
        }

        /**
         * Swaps two columns
         * @param {number} column1 - First column index
         * @param {number} column2 - Second column index
         * @return {Matrix} this
         */
        swapColumns(column1, column2) {
            checkColumnIndex(this, column1);
            checkColumnIndex(this, column2);
            for (var i = 0; i < this.rows; i++) {
                var temp = this.get(i, column1);
                this.set(i, column1, this.get(i, column2));
                this.set(i, column2, temp);
            }
            return this;
        }

        /**
         * Adds the values of a vector to each row
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        addRowVector(vector) {
            vector = checkRowVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) + vector[j]);
                }
            }
            return this;
        }

        /**
         * Subtracts the values of a vector from each row
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        subRowVector(vector) {
            vector = checkRowVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) - vector[j]);
                }
            }
            return this;
        }

        /**
         * Multiplies the values of a vector with each row
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        mulRowVector(vector) {
            vector = checkRowVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) * vector[j]);
                }
            }
            return this;
        }

        /**
         * Divides the values of each row by those of a vector
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        divRowVector(vector) {
            vector = checkRowVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) / vector[j]);
                }
            }
            return this;
        }

        /**
         * Adds the values of a vector to each column
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        addColumnVector(vector) {
            vector = checkColumnVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) + vector[i]);
                }
            }
            return this;
        }

        /**
         * Subtracts the values of a vector from each column
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        subColumnVector(vector) {
            vector = checkColumnVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) - vector[i]);
                }
            }
            return this;
        }

        /**
         * Multiplies the values of a vector with each column
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        mulColumnVector(vector) {
            vector = checkColumnVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) * vector[i]);
                }
            }
            return this;
        }

        /**
         * Divides the values of each column by those of a vector
         * @param {Array|Matrix} vector - Array or vector
         * @return {Matrix} this
         */
        divColumnVector(vector) {
            vector = checkColumnVector(this, vector);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this.set(i, j, this.get(i, j) / vector[i]);
                }
            }
            return this;
        }

        /**
         * Multiplies the values of a row with a scalar
         * @param {number} index - Row index
         * @param {number} value
         * @return {Matrix} this
         */
        mulRow(index, value) {
            checkRowIndex(this, index);
            for (var i = 0; i < this.columns; i++) {
                this.set(index, i, this.get(index, i) * value);
            }
            return this;
        }

        /**
         * Multiplies the values of a column with a scalar
         * @param {number} index - Column index
         * @param {number} value
         * @return {Matrix} this
         */
        mulColumn(index, value) {
            checkColumnIndex(this, index);
            for (var i = 0; i < this.rows; i++) {
                this.set(i, index, this.get(i, index) * value);
            }
            return this;
        }

        /**
         * Returns the maximum value of the matrix
         * @return {number}
         */
        max() {
            var v = this.get(0, 0);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    if (this.get(i, j) > v) {
                        v = this.get(i, j);
                    }
                }
            }
            return v;
        }

        /**
         * Returns the index of the maximum value
         * @return {Array}
         */
        maxIndex() {
            var v = this.get(0, 0);
            var idx = [0, 0];
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    if (this.get(i, j) > v) {
                        v = this.get(i, j);
                        idx[0] = i;
                        idx[1] = j;
                    }
                }
            }
            return idx;
        }

        /**
         * Returns the minimum value of the matrix
         * @return {number}
         */
        min() {
            var v = this.get(0, 0);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    if (this.get(i, j) < v) {
                        v = this.get(i, j);
                    }
                }
            }
            return v;
        }

        /**
         * Returns the index of the minimum value
         * @return {Array}
         */
        minIndex() {
            var v = this.get(0, 0);
            var idx = [0, 0];
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    if (this.get(i, j) < v) {
                        v = this.get(i, j);
                        idx[0] = i;
                        idx[1] = j;
                    }
                }
            }
            return idx;
        }

        /**
         * Returns the maximum value of one row
         * @param {number} row - Row index
         * @return {number}
         */
        maxRow(row) {
            checkRowIndex(this, row);
            var v = this.get(row, 0);
            for (var i = 1; i < this.columns; i++) {
                if (this.get(row, i) > v) {
                    v = this.get(row, i);
                }
            }
            return v;
        }

        /**
         * Returns the index of the maximum value of one row
         * @param {number} row - Row index
         * @return {Array}
         */
        maxRowIndex(row) {
            checkRowIndex(this, row);
            var v = this.get(row, 0);
            var idx = [row, 0];
            for (var i = 1; i < this.columns; i++) {
                if (this.get(row, i) > v) {
                    v = this.get(row, i);
                    idx[1] = i;
                }
            }
            return idx;
        }

        /**
         * Returns the minimum value of one row
         * @param {number} row - Row index
         * @return {number}
         */
        minRow(row) {
            checkRowIndex(this, row);
            var v = this.get(row, 0);
            for (var i = 1; i < this.columns; i++) {
                if (this.get(row, i) < v) {
                    v = this.get(row, i);
                }
            }
            return v;
        }

        /**
         * Returns the index of the maximum value of one row
         * @param {number} row - Row index
         * @return {Array}
         */
        minRowIndex(row) {
            checkRowIndex(this, row);
            var v = this.get(row, 0);
            var idx = [row, 0];
            for (var i = 1; i < this.columns; i++) {
                if (this.get(row, i) < v) {
                    v = this.get(row, i);
                    idx[1] = i;
                }
            }
            return idx;
        }

        /**
         * Returns the maximum value of one column
         * @param {number} column - Column index
         * @return {number}
         */
        maxColumn(column) {
            checkColumnIndex(this, column);
            var v = this.get(0, column);
            for (var i = 1; i < this.rows; i++) {
                if (this.get(i, column) > v) {
                    v = this.get(i, column);
                }
            }
            return v;
        }

        /**
         * Returns the index of the maximum value of one column
         * @param {number} column - Column index
         * @return {Array}
         */
        maxColumnIndex(column) {
            checkColumnIndex(this, column);
            var v = this.get(0, column);
            var idx = [0, column];
            for (var i = 1; i < this.rows; i++) {
                if (this.get(i, column) > v) {
                    v = this.get(i, column);
                    idx[0] = i;
                }
            }
            return idx;
        }

        /**
         * Returns the minimum value of one column
         * @param {number} column - Column index
         * @return {number}
         */
        minColumn(column) {
            checkColumnIndex(this, column);
            var v = this.get(0, column);
            for (var i = 1; i < this.rows; i++) {
                if (this.get(i, column) < v) {
                    v = this.get(i, column);
                }
            }
            return v;
        }

        /**
         * Returns the index of the minimum value of one column
         * @param {number} column - Column index
         * @return {Array}
         */
        minColumnIndex(column) {
            checkColumnIndex(this, column);
            var v = this.get(0, column);
            var idx = [0, column];
            for (var i = 1; i < this.rows; i++) {
                if (this.get(i, column) < v) {
                    v = this.get(i, column);
                    idx[0] = i;
                }
            }
            return idx;
        }

        /**
         * Returns an array containing the diagonal values of the matrix
         * @return {Array}
         */
        diag() {
            var min = Math.min(this.rows, this.columns);
            var diag = new Array(min);
            for (var i = 0; i < min; i++) {
                diag[i] = this.get(i, i);
            }
            return diag;
        }

        /**
         * Returns the sum by the argument given, if no argument given,
         * it returns the sum of all elements of the matrix.
         * @param {string} by - sum by 'row' or 'column'.
         * @return {Matrix|number}
         */
        sum(by) {
            switch (by) {
                case 'row':
                    return sumByRow(this);
                case 'column':
                    return sumByColumn(this);
                default:
                    return sumAll(this);
            }
        }

        /**
         * Returns the mean of all elements of the matrix
         * @return {number}
         */
        mean() {
            return this.sum() / this.size;
        }

        /**
         * Returns the product of all elements of the matrix
         * @return {number}
         */
        prod() {
            var prod = 1;
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    prod *= this.get(i, j);
                }
            }
            return prod;
        }

        /**
         * Computes the cumulative sum of the matrix elements (in place, row by row)
         * @return {Matrix} this
         */
        cumulativeSum() {
            var sum = 0;
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    sum += this.get(i, j);
                    this.set(i, j, sum);
                }
            }
            return this;
        }

        /**
         * Computes the dot (scalar) product between the matrix and another
         * @param {Matrix} vector2 vector
         * @return {number}
         */
        dot(vector2) {
            if (Matrix.isMatrix(vector2)) vector2 = vector2.to1DArray();
            var vector1 = this.to1DArray();
            if (vector1.length !== vector2.length) {
                throw new RangeError('vectors do not have the same size');
            }
            var dot = 0;
            for (var i = 0; i < vector1.length; i++) {
                dot += vector1[i] * vector2[i];
            }
            return dot;
        }

        /**
         * Returns the matrix product between this and other
         * @param {Matrix} other
         * @return {Matrix}
         */
        mmul(other) {
            other = this.constructor.checkMatrix(other);
            if (this.columns !== other.rows) {
                // eslint-disable-next-line no-console
                console.warn('Number of columns of left matrix are not equal to number of rows of right matrix.');
            }

            var m = this.rows;
            var n = this.columns;
            var p = other.columns;

            var result = new this.constructor[Symbol.species](m, p);

            var Bcolj = new Array(n);
            for (var j = 0; j < p; j++) {
                for (var k = 0; k < n; k++) {
                    Bcolj[k] = other.get(k, j);
                }

                for (var i = 0; i < m; i++) {
                    var s = 0;
                    for (k = 0; k < n; k++) {
                        s += this.get(i, k) * Bcolj[k];
                    }

                    result.set(i, j, s);
                }
            }
            return result;
        }

        strassen2x2(other) {
            var result = new this.constructor[Symbol.species](2, 2);
            const a11 = this.get(0, 0);
            const b11 = other.get(0, 0);
            const a12 = this.get(0, 1);
            const b12 = other.get(0, 1);
            const a21 = this.get(1, 0);
            const b21 = other.get(1, 0);
            const a22 = this.get(1, 1);
            const b22 = other.get(1, 1);

            // Compute intermediate values.
            const m1 = (a11 + a22) * (b11 + b22);
            const m2 = (a21 + a22) * b11;
            const m3 = a11 * (b12 - b22);
            const m4 = a22 * (b21 - b11);
            const m5 = (a11 + a12) * b22;
            const m6 = (a21 - a11) * (b11 + b12);
            const m7 = (a12 - a22) * (b21 + b22);

            // Combine intermediate values into the output.
            const c00 = m1 + m4 - m5 + m7;
            const c01 = m3 + m5;
            const c10 = m2 + m4;
            const c11 = m1 - m2 + m3 + m6;

            result.set(0, 0, c00);
            result.set(0, 1, c01);
            result.set(1, 0, c10);
            result.set(1, 1, c11);
            return result;
        }

        strassen3x3(other) {
            var result = new this.constructor[Symbol.species](3, 3);

            const a00 = this.get(0, 0);
            const a01 = this.get(0, 1);
            const a02 = this.get(0, 2);
            const a10 = this.get(1, 0);
            const a11 = this.get(1, 1);
            const a12 = this.get(1, 2);
            const a20 = this.get(2, 0);
            const a21 = this.get(2, 1);
            const a22 = this.get(2, 2);

            const b00 = other.get(0, 0);
            const b01 = other.get(0, 1);
            const b02 = other.get(0, 2);
            const b10 = other.get(1, 0);
            const b11 = other.get(1, 1);
            const b12 = other.get(1, 2);
            const b20 = other.get(2, 0);
            const b21 = other.get(2, 1);
            const b22 = other.get(2, 2);

            const m1 = (a00 + a01 + a02 - a10 - a11 - a21 - a22) * b11;
            const m2 = (a00 - a10) * (-b01 + b11);
            const m3 = a11 * (-b00 + b01 + b10 - b11 - b12 - b20 + b22);
            const m4 = (-a00 + a10 + a11) * (b00 - b01 + b11);
            const m5 = (a10 + a11) * (-b00 + b01);
            const m6 = a00 * b00;
            const m7 = (-a00 + a20 + a21) * (b00 - b02 + b12);
            const m8 = (-a00 + a20) * (b02 - b12);
            const m9 = (a20 + a21) * (-b00 + b02);
            const m10 = (a00 + a01 + a02 - a11 - a12 - a20 - a21) * b12;
            const m11 = a21 * (-b00 + b02 + b10 - b11 - b12 - b20 + b21);
            const m12 = (-a02 + a21 + a22) * (b11 + b20 - b21);
            const m13 = (a02 - a22) * (b11 - b21);
            const m14 = a02 * b20;
            const m15 = (a21 + a22) * (-b20 + b21);
            const m16 = (-a02 + a11 + a12) * (b12 + b20 - b22);
            const m17 = (a02 - a12) * (b12 - b22);
            const m18 = (a11 + a12) * (-b20 + b22);
            const m19 = a01 * b10;
            const m20 = a12 * b21;
            const m21 = a10 * b02;
            const m22 = a20 * b01;
            const m23 = a22 * b22;

            const c00 = m6 + m14 + m19;
            const c01 = m1 + m4 + m5 + m6 + m12 + m14 + m15;
            const c02 = m6 + m7 + m9 + m10 + m14 + m16 + m18;
            const c10 = m2 + m3 + m4 + m6 + m14 + m16 + m17;
            const c11 = m2 + m4 + m5 + m6 + m20;
            const c12 = m14 + m16 + m17 + m18 + m21;
            const c20 = m6 + m7 + m8 + m11 + m12 + m13 + m14;
            const c21 = m12 + m13 + m14 + m15 + m22;
            const c22 = m6 + m7 + m8 + m9 + m23;

            result.set(0, 0, c00);
            result.set(0, 1, c01);
            result.set(0, 2, c02);
            result.set(1, 0, c10);
            result.set(1, 1, c11);
            result.set(1, 2, c12);
            result.set(2, 0, c20);
            result.set(2, 1, c21);
            result.set(2, 2, c22);
            return result;
        }

        /**
         * Returns the matrix product between x and y. More efficient than mmul(other) only when we multiply squared matrix and when the size of the matrix is > 1000.
         * @param {Matrix} y
         * @return {Matrix}
         */
        mmulStrassen(y) {
            var x = this.clone();
            var r1 = x.rows;
            var c1 = x.columns;
            var r2 = y.rows;
            var c2 = y.columns;
            if (c1 !== r2) {
                // eslint-disable-next-line no-console
                console.warn(`Multiplying ${r1} x ${c1} and ${r2} x ${c2} matrix: dimensions do not match.`);
            }

            // Put a matrix into the top left of a matrix of zeros.
            // `rows` and `cols` are the dimensions of the output matrix.
            function embed(mat, rows, cols) {
                var r = mat.rows;
                var c = mat.columns;
                if ((r === rows) && (c === cols)) {
                    return mat;
                } else {
                    var resultat = Matrix.zeros(rows, cols);
                    resultat = resultat.setSubMatrix(mat, 0, 0);
                    return resultat;
                }
            }


            // Make sure both matrices are the same size.
            // This is exclusively for simplicity:
            // this algorithm can be implemented with matrices of different sizes.

            var r = Math.max(r1, r2);
            var c = Math.max(c1, c2);
            x = embed(x, r, c);
            y = embed(y, r, c);

            // Our recursive multiplication function.
            function blockMult(a, b, rows, cols) {
                // For small matrices, resort to naive multiplication.
                if (rows <= 512 || cols <= 512) {
                    return a.mmul(b); // a is equivalent to this
                }

                // Apply dynamic padding.
                if ((rows % 2 === 1) && (cols % 2 === 1)) {
                    a = embed(a, rows + 1, cols + 1);
                    b = embed(b, rows + 1, cols + 1);
                } else if (rows % 2 === 1) {
                    a = embed(a, rows + 1, cols);
                    b = embed(b, rows + 1, cols);
                } else if (cols % 2 === 1) {
                    a = embed(a, rows, cols + 1);
                    b = embed(b, rows, cols + 1);
                }

                var halfRows = parseInt(a.rows / 2);
                var halfCols = parseInt(a.columns / 2);
                // Subdivide input matrices.
                var a11 = a.subMatrix(0, halfRows - 1, 0, halfCols - 1);
                var b11 = b.subMatrix(0, halfRows - 1, 0, halfCols - 1);

                var a12 = a.subMatrix(0, halfRows - 1, halfCols, a.columns - 1);
                var b12 = b.subMatrix(0, halfRows - 1, halfCols, b.columns - 1);

                var a21 = a.subMatrix(halfRows, a.rows - 1, 0, halfCols - 1);
                var b21 = b.subMatrix(halfRows, b.rows - 1, 0, halfCols - 1);

                var a22 = a.subMatrix(halfRows, a.rows - 1, halfCols, a.columns - 1);
                var b22 = b.subMatrix(halfRows, b.rows - 1, halfCols, b.columns - 1);

                // Compute intermediate values.
                var m1 = blockMult(Matrix.add(a11, a22), Matrix.add(b11, b22), halfRows, halfCols);
                var m2 = blockMult(Matrix.add(a21, a22), b11, halfRows, halfCols);
                var m3 = blockMult(a11, Matrix.sub(b12, b22), halfRows, halfCols);
                var m4 = blockMult(a22, Matrix.sub(b21, b11), halfRows, halfCols);
                var m5 = blockMult(Matrix.add(a11, a12), b22, halfRows, halfCols);
                var m6 = blockMult(Matrix.sub(a21, a11), Matrix.add(b11, b12), halfRows, halfCols);
                var m7 = blockMult(Matrix.sub(a12, a22), Matrix.add(b21, b22), halfRows, halfCols);

                // Combine intermediate values into the output.
                var c11 = Matrix.add(m1, m4);
                c11.sub(m5);
                c11.add(m7);
                var c12 = Matrix.add(m3, m5);
                var c21 = Matrix.add(m2, m4);
                var c22 = Matrix.sub(m1, m2);
                c22.add(m3);
                c22.add(m6);

                //Crop output to the desired size (undo dynamic padding).
                var resultat = Matrix.zeros(2 * c11.rows, 2 * c11.columns);
                resultat = resultat.setSubMatrix(c11, 0, 0);
                resultat = resultat.setSubMatrix(c12, c11.rows, 0);
                resultat = resultat.setSubMatrix(c21, 0, c11.columns);
                resultat = resultat.setSubMatrix(c22, c11.rows, c11.columns);
                return resultat.subMatrix(0, rows - 1, 0, cols - 1);
            }
            return blockMult(x, y, r, c);
        }

        /**
         * Returns a row-by-row scaled matrix
         * @param {number} [min=0] - Minimum scaled value
         * @param {number} [max=1] - Maximum scaled value
         * @return {Matrix} - The scaled matrix
         */
        scaleRows(min, max) {
            min = min === undefined ? 0 : min;
            max = max === undefined ? 1 : max;
            if (min >= max) {
                throw new RangeError('min should be strictly smaller than max');
            }
            var newMatrix = this.constructor.empty(this.rows, this.columns);
            for (var i = 0; i < this.rows; i++) {
                var scaled = index_1$4(this.getRow(i), {min, max});
                newMatrix.setRow(i, scaled);
            }
            return newMatrix;
        }

        /**
         * Returns a new column-by-column scaled matrix
         * @param {number} [min=0] - Minimum scaled value
         * @param {number} [max=1] - Maximum scaled value
         * @return {Matrix} - The new scaled matrix
         * @example
         * var matrix = new Matrix([[1,2],[-1,0]]);
         * var scaledMatrix = matrix.scaleColumns(); // [[1,1],[0,0]]
         */
        scaleColumns(min, max) {
            min = min === undefined ? 0 : min;
            max = max === undefined ? 1 : max;
            if (min >= max) {
                throw new RangeError('min should be strictly smaller than max');
            }
            var newMatrix = this.constructor.empty(this.rows, this.columns);
            for (var i = 0; i < this.columns; i++) {
                var scaled = index_1$4(this.getColumn(i), {
                    min: min,
                    max: max
                });
                newMatrix.setColumn(i, scaled);
            }
            return newMatrix;
        }


        /**
         * Returns the Kronecker product (also known as tensor product) between this and other
         * See https://en.wikipedia.org/wiki/Kronecker_product
         * @param {Matrix} other
         * @return {Matrix}
         */
        kroneckerProduct(other) {
            other = this.constructor.checkMatrix(other);

            var m = this.rows;
            var n = this.columns;
            var p = other.rows;
            var q = other.columns;

            var result = new this.constructor[Symbol.species](m * p, n * q);
            for (var i = 0; i < m; i++) {
                for (var j = 0; j < n; j++) {
                    for (var k = 0; k < p; k++) {
                        for (var l = 0; l < q; l++) {
                            result[p * i + k][q * j + l] = this.get(i, j) * other.get(k, l);
                        }
                    }
                }
            }
            return result;
        }

        /**
         * Transposes the matrix and returns a new one containing the result
         * @return {Matrix}
         */
        transpose() {
            var result = new this.constructor[Symbol.species](this.columns, this.rows);
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    result.set(j, i, this.get(i, j));
                }
            }
            return result;
        }

        /**
         * Sorts the rows (in place)
         * @param {function} compareFunction - usual Array.prototype.sort comparison function
         * @return {Matrix} this
         */
        sortRows(compareFunction) {
            if (compareFunction === undefined) compareFunction = compareNumbers;
            for (var i = 0; i < this.rows; i++) {
                this.setRow(i, this.getRow(i).sort(compareFunction));
            }
            return this;
        }

        /**
         * Sorts the columns (in place)
         * @param {function} compareFunction - usual Array.prototype.sort comparison function
         * @return {Matrix} this
         */
        sortColumns(compareFunction) {
            if (compareFunction === undefined) compareFunction = compareNumbers;
            for (var i = 0; i < this.columns; i++) {
                this.setColumn(i, this.getColumn(i).sort(compareFunction));
            }
            return this;
        }

        /**
         * Returns a subset of the matrix
         * @param {number} startRow - First row index
         * @param {number} endRow - Last row index
         * @param {number} startColumn - First column index
         * @param {number} endColumn - Last column index
         * @return {Matrix}
         */
        subMatrix(startRow, endRow, startColumn, endColumn) {
            checkRange(this, startRow, endRow, startColumn, endColumn);
            var newMatrix = new this.constructor[Symbol.species](endRow - startRow + 1, endColumn - startColumn + 1);
            for (var i = startRow; i <= endRow; i++) {
                for (var j = startColumn; j <= endColumn; j++) {
                    newMatrix[i - startRow][j - startColumn] = this.get(i, j);
                }
            }
            return newMatrix;
        }

        /**
         * Returns a subset of the matrix based on an array of row indices
         * @param {Array} indices - Array containing the row indices
         * @param {number} [startColumn = 0] - First column index
         * @param {number} [endColumn = this.columns-1] - Last column index
         * @return {Matrix}
         */
        subMatrixRow(indices, startColumn, endColumn) {
            if (startColumn === undefined) startColumn = 0;
            if (endColumn === undefined) endColumn = this.columns - 1;
            if ((startColumn > endColumn) || (startColumn < 0) || (startColumn >= this.columns) || (endColumn < 0) || (endColumn >= this.columns)) {
                throw new RangeError('Argument out of range');
            }

            var newMatrix = new this.constructor[Symbol.species](indices.length, endColumn - startColumn + 1);
            for (var i = 0; i < indices.length; i++) {
                for (var j = startColumn; j <= endColumn; j++) {
                    if (indices[i] < 0 || indices[i] >= this.rows) {
                        throw new RangeError('Row index out of range: ' + indices[i]);
                    }
                    newMatrix.set(i, j - startColumn, this.get(indices[i], j));
                }
            }
            return newMatrix;
        }

        /**
         * Returns a subset of the matrix based on an array of column indices
         * @param {Array} indices - Array containing the column indices
         * @param {number} [startRow = 0] - First row index
         * @param {number} [endRow = this.rows-1] - Last row index
         * @return {Matrix}
         */
        subMatrixColumn(indices, startRow, endRow) {
            if (startRow === undefined) startRow = 0;
            if (endRow === undefined) endRow = this.rows - 1;
            if ((startRow > endRow) || (startRow < 0) || (startRow >= this.rows) || (endRow < 0) || (endRow >= this.rows)) {
                throw new RangeError('Argument out of range');
            }

            var newMatrix = new this.constructor[Symbol.species](endRow - startRow + 1, indices.length);
            for (var i = 0; i < indices.length; i++) {
                for (var j = startRow; j <= endRow; j++) {
                    if (indices[i] < 0 || indices[i] >= this.columns) {
                        throw new RangeError('Column index out of range: ' + indices[i]);
                    }
                    newMatrix.set(j - startRow, i, this.get(j, indices[i]));
                }
            }
            return newMatrix;
        }

        /**
         * Set a part of the matrix to the given sub-matrix
         * @param {Matrix|Array< Array >} matrix - The source matrix from which to extract values.
         * @param {number} startRow - The index of the first row to set
         * @param {number} startColumn - The index of the first column to set
         * @return {Matrix}
         */
        setSubMatrix(matrix, startRow, startColumn) {
            matrix = this.constructor.checkMatrix(matrix);
            var endRow = startRow + matrix.rows - 1;
            var endColumn = startColumn + matrix.columns - 1;
            checkRange(this, startRow, endRow, startColumn, endColumn);
            for (var i = 0; i < matrix.rows; i++) {
                for (var j = 0; j < matrix.columns; j++) {
                    this[startRow + i][startColumn + j] = matrix.get(i, j);
                }
            }
            return this;
        }

        /**
         * Return a new matrix based on a selection of rows and columns
         * @param {Array<number>} rowIndices - The row indices to select. Order matters and an index can be more than once.
         * @param {Array<number>} columnIndices - The column indices to select. Order matters and an index can be use more than once.
         * @return {Matrix} The new matrix
         */
        selection(rowIndices, columnIndices) {
            var indices = checkIndices(this, rowIndices, columnIndices);
            var newMatrix = new this.constructor[Symbol.species](rowIndices.length, columnIndices.length);
            for (var i = 0; i < indices.row.length; i++) {
                var rowIndex = indices.row[i];
                for (var j = 0; j < indices.column.length; j++) {
                    var columnIndex = indices.column[j];
                    newMatrix[i][j] = this.get(rowIndex, columnIndex);
                }
            }
            return newMatrix;
        }

        /**
         * Returns the trace of the matrix (sum of the diagonal elements)
         * @return {number}
         */
        trace() {
            var min = Math.min(this.rows, this.columns);
            var trace = 0;
            for (var i = 0; i < min; i++) {
                trace += this.get(i, i);
            }
            return trace;
        }

        /*
         Matrix views
         */

        /**
         * Returns a view of the transposition of the matrix
         * @return {MatrixTransposeView}
         */
        transposeView() {
            return new MatrixTransposeView(this);
        }

        /**
         * Returns a view of the row vector with the given index
         * @param {number} row - row index of the vector
         * @return {MatrixRowView}
         */
        rowView(row) {
            checkRowIndex(this, row);
            return new MatrixRowView(this, row);
        }

        /**
         * Returns a view of the column vector with the given index
         * @param {number} column - column index of the vector
         * @return {MatrixColumnView}
         */
        columnView(column) {
            checkColumnIndex(this, column);
            return new MatrixColumnView(this, column);
        }

        /**
         * Returns a view of the matrix flipped in the row axis
         * @return {MatrixFlipRowView}
         */
        flipRowView() {
            return new MatrixFlipRowView(this);
        }

        /**
         * Returns a view of the matrix flipped in the column axis
         * @return {MatrixFlipColumnView}
         */
        flipColumnView() {
            return new MatrixFlipColumnView(this);
        }

        /**
         * Returns a view of a submatrix giving the index boundaries
         * @param {number} startRow - first row index of the submatrix
         * @param {number} endRow - last row index of the submatrix
         * @param {number} startColumn - first column index of the submatrix
         * @param {number} endColumn - last column index of the submatrix
         * @return {MatrixSubView}
         */
        subMatrixView(startRow, endRow, startColumn, endColumn) {
            return new MatrixSubView(this, startRow, endRow, startColumn, endColumn);
        }

        /**
         * Returns a view of the cross of the row indices and the column indices
         * @example
         * // resulting vector is [[2], [2]]
         * var matrix = new Matrix([[1,2,3], [4,5,6]]).selectionView([0, 0], [1])
         * @param {Array<number>} rowIndices
         * @param {Array<number>} columnIndices
         * @return {MatrixSelectionView}
         */
        selectionView(rowIndices, columnIndices) {
            return new MatrixSelectionView(this, rowIndices, columnIndices);
        }


        /**
        * Calculates and returns the determinant of a matrix as a Number
        * @example
        *   new Matrix([[1,2,3], [4,5,6]]).det()
        * @return {number}
        */
        det() {
            if (this.isSquare()) {
                var a, b, c, d;
                if (this.columns === 2) {
                    // 2 x 2 matrix
                    a = this.get(0, 0);
                    b = this.get(0, 1);
                    c = this.get(1, 0);
                    d = this.get(1, 1);

                    return a * d - (b * c);
                } else if (this.columns === 3) {
                    // 3 x 3 matrix
                    var subMatrix0, subMatrix1, subMatrix2;
                    subMatrix0 = this.selectionView([1, 2], [1, 2]);
                    subMatrix1 = this.selectionView([1, 2], [0, 2]);
                    subMatrix2 = this.selectionView([1, 2], [0, 1]);
                    a = this.get(0, 0);
                    b = this.get(0, 1);
                    c = this.get(0, 2);

                    return a * subMatrix0.det() - b * subMatrix1.det() + c * subMatrix2.det();
                } else {
                    // general purpose determinant using the LU decomposition
                    return new LuDecomposition(this).determinant;
                }

            } else {
                throw Error('Determinant can only be calculated for a square matrix.');
            }
        }

        /**
         * Returns inverse of a matrix if it exists or the pseudoinverse
         * @param {number} threshold - threshold for taking inverse of singular values (default = 1e-15)
         * @return {Matrix} the (pseudo)inverted matrix.
         */
        pseudoInverse(threshold) {
            if (threshold === undefined) threshold = Number.EPSILON;
            var svdSolution = new SingularValueDecomposition(this, {autoTranspose: true});

            var U = svdSolution.leftSingularVectors;
            var V = svdSolution.rightSingularVectors;
            var s = svdSolution.diagonal;

            for (var i = 0; i < s.length; i++) {
                if (Math.abs(s[i]) > threshold) {
                    s[i] = 1.0 / s[i];
                } else {
                    s[i] = 0.0;
                }
            }

            // convert list to diagonal
            s = this.constructor[Symbol.species].diag(s);
            return V.mmul(s.mmul(U.transposeView()));
        }
    }

    Matrix.prototype.klass = 'Matrix';

    function compareNumbers(a, b) {
        return a - b;
    }

    /*
     Synonyms
     */

    Matrix.random = Matrix.rand;
    Matrix.diagonal = Matrix.diag;
    Matrix.prototype.diagonal = Matrix.prototype.diag;
    Matrix.identity = Matrix.eye;
    Matrix.prototype.negate = Matrix.prototype.neg;
    Matrix.prototype.tensorProduct = Matrix.prototype.kroneckerProduct;
    Matrix.prototype.determinant = Matrix.prototype.det;

    /*
     Add dynamically instance and static methods for mathematical operations
     */

    var inplaceOperator = `
(function %name%(value) {
    if (typeof value === 'number') return this.%name%S(value);
    return this.%name%M(value);
})
`;

    var inplaceOperatorScalar = `
(function %name%S(value) {
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) %op% value);
        }
    }
    return this;
})
`;

    var inplaceOperatorMatrix = `
(function %name%M(matrix) {
    matrix = this.constructor.checkMatrix(matrix);
    if (this.rows !== matrix.rows ||
        this.columns !== matrix.columns) {
        throw new RangeError('Matrices dimensions must be equal');
    }
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, this.get(i, j) %op% matrix.get(i, j));
        }
    }
    return this;
})
`;

    var staticOperator = `
(function %name%(matrix, value) {
    var newMatrix = new this[Symbol.species](matrix);
    return newMatrix.%name%(value);
})
`;

    var inplaceMethod = `
(function %name%() {
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, %method%(this.get(i, j)));
        }
    }
    return this;
})
`;

    var staticMethod = `
(function %name%(matrix) {
    var newMatrix = new this[Symbol.species](matrix);
    return newMatrix.%name%();
})
`;

    var inplaceMethodWithArgs = `
(function %name%(%args%) {
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, %method%(this.get(i, j), %args%));
        }
    }
    return this;
})
`;

    var staticMethodWithArgs = `
(function %name%(matrix, %args%) {
    var newMatrix = new this[Symbol.species](matrix);
    return newMatrix.%name%(%args%);
})
`;


    var inplaceMethodWithOneArgScalar = `
(function %name%S(value) {
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, %method%(this.get(i, j), value));
        }
    }
    return this;
})
`;
    var inplaceMethodWithOneArgMatrix = `
(function %name%M(matrix) {
    matrix = this.constructor.checkMatrix(matrix);
    if (this.rows !== matrix.rows ||
        this.columns !== matrix.columns) {
        throw new RangeError('Matrices dimensions must be equal');
    }
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            this.set(i, j, %method%(this.get(i, j), matrix.get(i, j)));
        }
    }
    return this;
})
`;

    var inplaceMethodWithOneArg = `
(function %name%(value) {
    if (typeof value === 'number') return this.%name%S(value);
    return this.%name%M(value);
})
`;

    var staticMethodWithOneArg = staticMethodWithArgs;

    var operators = [
        // Arithmetic operators
        ['+', 'add'],
        ['-', 'sub', 'subtract'],
        ['*', 'mul', 'multiply'],
        ['/', 'div', 'divide'],
        ['%', 'mod', 'modulus'],
        // Bitwise operators
        ['&', 'and'],
        ['|', 'or'],
        ['^', 'xor'],
        ['<<', 'leftShift'],
        ['>>', 'signPropagatingRightShift'],
        ['>>>', 'rightShift', 'zeroFillRightShift']
    ];

    var i;
    var eval2 = eval;
    for (var operator of operators) {
        var inplaceOp = eval2(fillTemplateFunction(inplaceOperator, {name: operator[1], op: operator[0]}));
        var inplaceOpS = eval2(fillTemplateFunction(inplaceOperatorScalar, {name: operator[1] + 'S', op: operator[0]}));
        var inplaceOpM = eval2(fillTemplateFunction(inplaceOperatorMatrix, {name: operator[1] + 'M', op: operator[0]}));
        var staticOp = eval2(fillTemplateFunction(staticOperator, {name: operator[1]}));
        for (i = 1; i < operator.length; i++) {
            Matrix.prototype[operator[i]] = inplaceOp;
            Matrix.prototype[operator[i] + 'S'] = inplaceOpS;
            Matrix.prototype[operator[i] + 'M'] = inplaceOpM;
            Matrix[operator[i]] = staticOp;
        }
    }

    var methods = [
        ['~', 'not']
    ];

    [
        'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cbrt', 'ceil',
        'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'log', 'log1p',
        'log10', 'log2', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
    ].forEach(function (mathMethod) {
        methods.push(['Math.' + mathMethod, mathMethod]);
    });

    for (var method of methods) {
        var inplaceMeth = eval2(fillTemplateFunction(inplaceMethod, {name: method[1], method: method[0]}));
        var staticMeth = eval2(fillTemplateFunction(staticMethod, {name: method[1]}));
        for (i = 1; i < method.length; i++) {
            Matrix.prototype[method[i]] = inplaceMeth;
            Matrix[method[i]] = staticMeth;
        }
    }

    var methodsWithArgs = [
        ['Math.pow', 1, 'pow']
    ];

    for (var methodWithArg of methodsWithArgs) {
        var args = 'arg0';
        for (i = 1; i < methodWithArg[1]; i++) {
            args += `, arg${i}`;
        }
        if (methodWithArg[1] !== 1) {
            var inplaceMethWithArgs = eval2(fillTemplateFunction(inplaceMethodWithArgs, {
                name: methodWithArg[2],
                method: methodWithArg[0],
                args: args
            }));
            var staticMethWithArgs = eval2(fillTemplateFunction(staticMethodWithArgs, {name: methodWithArg[2], args: args}));
            for (i = 2; i < methodWithArg.length; i++) {
                Matrix.prototype[methodWithArg[i]] = inplaceMethWithArgs;
                Matrix[methodWithArg[i]] = staticMethWithArgs;
            }
        } else {
            var tmplVar = {
                name: methodWithArg[2],
                args: args,
                method: methodWithArg[0]
            };
            var inplaceMethod2 = eval2(fillTemplateFunction(inplaceMethodWithOneArg, tmplVar));
            var inplaceMethodS = eval2(fillTemplateFunction(inplaceMethodWithOneArgScalar, tmplVar));
            var inplaceMethodM = eval2(fillTemplateFunction(inplaceMethodWithOneArgMatrix, tmplVar));
            var staticMethod2 = eval2(fillTemplateFunction(staticMethodWithOneArg, tmplVar));
            for (i = 2; i < methodWithArg.length; i++) {
                Matrix.prototype[methodWithArg[i]] = inplaceMethod2;
                Matrix.prototype[methodWithArg[i] + 'M'] = inplaceMethodM;
                Matrix.prototype[methodWithArg[i] + 'S'] = inplaceMethodS;
                Matrix[methodWithArg[i]] = staticMethod2;
            }
        }
    }

    function fillTemplateFunction(template, values) {
        for (var value in values) {
            template = template.replace(new RegExp('%' + value + '%', 'g'), values[value]);
        }
        return template;
    }

    return Matrix;
}

class Matrix extends AbstractMatrix(Array) {
    constructor(nRows, nColumns) {
        var i;
        if (arguments.length === 1 && typeof nRows === 'number') {
            return new Array(nRows);
        }
        if (Matrix.isMatrix(nRows)) {
            return nRows.clone();
        } else if (Number.isInteger(nRows) && nRows > 0) { // Create an empty matrix
            super(nRows);
            if (Number.isInteger(nColumns) && nColumns > 0) {
                for (i = 0; i < nRows; i++) {
                    this[i] = new Array(nColumns);
                }
            } else {
                throw new TypeError('nColumns must be a positive integer');
            }
        } else if (Array.isArray(nRows)) { // Copy the values from the 2D array
            const matrix = nRows;
            nRows = matrix.length;
            nColumns = matrix[0].length;
            if (typeof nColumns !== 'number' || nColumns === 0) {
                throw new TypeError('Data must be a 2D array with at least one element');
            }
            super(nRows);
            for (i = 0; i < nRows; i++) {
                if (matrix[i].length !== nColumns) {
                    throw new RangeError('Inconsistent array dimensions');
                }
                this[i] = [].concat(matrix[i]);
            }
        } else {
            throw new TypeError('First argument must be a positive number or an array');
        }
        this.rows = nRows;
        this.columns = nColumns;
        return this;
    }

    set(rowIndex, columnIndex, value) {
        this[rowIndex][columnIndex] = value;
        return this;
    }

    get(rowIndex, columnIndex) {
        return this[rowIndex][columnIndex];
    }

    /**
     * Creates an exact and independent copy of the matrix
     * @return {Matrix}
     */
    clone() {
        var newMatrix = new this.constructor[Symbol.species](this.rows, this.columns);
        for (var row = 0; row < this.rows; row++) {
            for (var column = 0; column < this.columns; column++) {
                newMatrix.set(row, column, this.get(row, column));
            }
        }
        return newMatrix;
    }

    /**
     * Removes a row from the given index
     * @param {number} index - Row index
     * @return {Matrix} this
     */
    removeRow(index) {
        checkRowIndex(this, index);
        if (this.rows === 1) {
            throw new RangeError('A matrix cannot have less than one row');
        }
        this.splice(index, 1);
        this.rows -= 1;
        return this;
    }

    /**
     * Adds a row at the given index
     * @param {number} [index = this.rows] - Row index
     * @param {Array|Matrix} array - Array or vector
     * @return {Matrix} this
     */
    addRow(index, array) {
        if (array === undefined) {
            array = index;
            index = this.rows;
        }
        checkRowIndex(this, index, true);
        array = checkRowVector(this, array, true);
        this.splice(index, 0, array);
        this.rows += 1;
        return this;
    }

    /**
     * Removes a column from the given index
     * @param {number} index - Column index
     * @return {Matrix} this
     */
    removeColumn(index) {
        checkColumnIndex(this, index);
        if (this.columns === 1) {
            throw new RangeError('A matrix cannot have less than one column');
        }
        for (var i = 0; i < this.rows; i++) {
            this[i].splice(index, 1);
        }
        this.columns -= 1;
        return this;
    }

    /**
     * Adds a column at the given index
     * @param {number} [index = this.columns] - Column index
     * @param {Array|Matrix} array - Array or vector
     * @return {Matrix} this
     */
    addColumn(index, array) {
        if (typeof array === 'undefined') {
            array = index;
            index = this.columns;
        }
        checkColumnIndex(this, index, true);
        array = checkColumnVector(this, array);
        for (var i = 0; i < this.rows; i++) {
            this[i].splice(index, 0, array[i]);
        }
        this.columns += 1;
        return this;
    }
}

//https://github.com/lutzroeder/Mapack/blob/master/Source/QrDecomposition.cs
function QrDecomposition(value) {
    if (!(this instanceof QrDecomposition)) {
        return new QrDecomposition(value);
    }
    value = Matrix.checkMatrix(value);

    var qr = value.clone(),
        m = value.rows,
        n = value.columns,
        rdiag = new Array(n),
        i, j, k, s;

    for (k = 0; k < n; k++) {
        var nrm = 0;
        for (i = k; i < m; i++) {
            nrm = hypotenuse(nrm, qr[i][k]);
        }
        if (nrm !== 0) {
            if (qr[k][k] < 0) {
                nrm = -nrm;
            }
            for (i = k; i < m; i++) {
                qr[i][k] /= nrm;
            }
            qr[k][k] += 1;
            for (j = k + 1; j < n; j++) {
                s = 0;
                for (i = k; i < m; i++) {
                    s += qr[i][k] * qr[i][j];
                }
                s = -s / qr[k][k];
                for (i = k; i < m; i++) {
                    qr[i][j] += s * qr[i][k];
                }
            }
        }
        rdiag[k] = -nrm;
    }

    this.QR = qr;
    this.Rdiag = rdiag;
}

QrDecomposition.prototype = {
    solve: function (value) {
        value = Matrix.checkMatrix(value);

        var qr = this.QR,
            m = qr.rows;

        if (value.rows !== m) {
            throw new Error('Matrix row dimensions must agree');
        }
        if (!this.isFullRank()) {
            throw new Error('Matrix is rank deficient');
        }

        var count = value.columns;
        var X = value.clone();
        var n = qr.columns;
        var i, j, k, s;

        for (k = 0; k < n; k++) {
            for (j = 0; j < count; j++) {
                s = 0;
                for (i = k; i < m; i++) {
                    s += qr[i][k] * X[i][j];
                }
                s = -s / qr[k][k];
                for (i = k; i < m; i++) {
                    X[i][j] += s * qr[i][k];
                }
            }
        }
        for (k = n - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
                X[k][j] /= this.Rdiag[k];
            }
            for (i = 0; i < k; i++) {
                for (j = 0; j < count; j++) {
                    X[i][j] -= X[k][j] * qr[i][k];
                }
            }
        }

        return X.subMatrix(0, n - 1, 0, count - 1);
    },
    isFullRank: function () {
        var columns = this.QR.columns;
        for (var i = 0; i < columns; i++) {
            if (this.Rdiag[i] === 0) {
                return false;
            }
        }
        return true;
    },
    get upperTriangularMatrix() {
        var qr = this.QR,
            n = qr.columns,
            X = new Matrix(n, n),
            i, j;
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                if (i < j) {
                    X[i][j] = qr[i][j];
                } else if (i === j) {
                    X[i][j] = this.Rdiag[i];
                } else {
                    X[i][j] = 0;
                }
            }
        }
        return X;
    },
    get orthogonalMatrix() {
        var qr = this.QR,
            rows = qr.rows,
            columns = qr.columns,
            X = new Matrix(rows, columns),
            i, j, k, s;

        for (k = columns - 1; k >= 0; k--) {
            for (i = 0; i < rows; i++) {
                X[i][k] = 0;
            }
            X[k][k] = 1;
            for (j = k; j < columns; j++) {
                if (qr[k][k] !== 0) {
                    s = 0;
                    for (i = k; i < rows; i++) {
                        s += qr[i][k] * X[i][j];
                    }

                    s = -s / qr[k][k];

                    for (i = k; i < rows; i++) {
                        X[i][j] += s * qr[i][k];
                    }
                }
            }
        }
        return X;
    }
};

function inverse(matrix) {
    matrix = Matrix.checkMatrix(matrix);
    return solve(matrix, Matrix.eye(matrix.rows));
}

function solve(leftHandSide, rightHandSide) {
    leftHandSide = Matrix.checkMatrix(leftHandSide);
    rightHandSide = Matrix.checkMatrix(rightHandSide);
    return leftHandSide.isSquare() ? new LuDecomposition(leftHandSide).solve(rightHandSide) : new QrDecomposition(leftHandSide).solve(rightHandSide);
}

const defaultOptions = {
    assumeSymmetric: false
};

// https://github.com/lutzroeder/Mapack/blob/master/Source/EigenvalueDecomposition.cs
function EigenvalueDecomposition(matrix, options) {
    options = Object.assign({}, defaultOptions, options);
    if (!(this instanceof EigenvalueDecomposition)) {
        return new EigenvalueDecomposition(matrix, options);
    }
    matrix = Matrix.checkMatrix(matrix);
    if (!matrix.isSquare()) {
        throw new Error('Matrix is not a square matrix');
    }

    var n = matrix.columns,
        V = getFilled2DArray(n, n, 0),
        d = new Array(n),
        e = new Array(n),
        value = matrix,
        i, j;

    var isSymmetric = false;
    if (options.assumeSymmetric) {
        isSymmetric = true;
    } else {
        isSymmetric = matrix.isSymmetric();
    }

    if (isSymmetric) {
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                V[i][j] = value.get(i, j);
            }
        }
        tred2(n, e, d, V);
        tql2(n, e, d, V);
    } else {
        var H = getFilled2DArray(n, n, 0),
            ort = new Array(n);
        for (j = 0; j < n; j++) {
            for (i = 0; i < n; i++) {
                H[i][j] = value.get(i, j);
            }
        }
        orthes(n, H, ort, V);
        hqr2(n, e, d, V, H);
    }

    this.n = n;
    this.e = e;
    this.d = d;
    this.V = V;
}

EigenvalueDecomposition.prototype = {
    get realEigenvalues() {
        return this.d;
    },
    get imaginaryEigenvalues() {
        return this.e;
    },
    get eigenvectorMatrix() {
        if (!Matrix.isMatrix(this.V)) {
            this.V = new Matrix(this.V);
        }
        return this.V;
    },
    get diagonalMatrix() {
        var n = this.n,
            e = this.e,
            d = this.d,
            X = new Matrix(n, n),
            i, j;
        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                X[i][j] = 0;
            }
            X[i][i] = d[i];
            if (e[i] > 0) {
                X[i][i + 1] = e[i];
            } else if (e[i] < 0) {
                X[i][i - 1] = e[i];
            }
        }
        return X;
    }
};

function tred2(n, e, d, V) {

    var f, g, h, i, j, k,
        hh, scale;

    for (j = 0; j < n; j++) {
        d[j] = V[n - 1][j];
    }

    for (i = n - 1; i > 0; i--) {
        scale = 0;
        h = 0;
        for (k = 0; k < i; k++) {
            scale = scale + Math.abs(d[k]);
        }

        if (scale === 0) {
            e[i] = d[i - 1];
            for (j = 0; j < i; j++) {
                d[j] = V[i - 1][j];
                V[i][j] = 0;
                V[j][i] = 0;
            }
        } else {
            for (k = 0; k < i; k++) {
                d[k] /= scale;
                h += d[k] * d[k];
            }

            f = d[i - 1];
            g = Math.sqrt(h);
            if (f > 0) {
                g = -g;
            }

            e[i] = scale * g;
            h = h - f * g;
            d[i - 1] = f - g;
            for (j = 0; j < i; j++) {
                e[j] = 0;
            }

            for (j = 0; j < i; j++) {
                f = d[j];
                V[j][i] = f;
                g = e[j] + V[j][j] * f;
                for (k = j + 1; k <= i - 1; k++) {
                    g += V[k][j] * d[k];
                    e[k] += V[k][j] * f;
                }
                e[j] = g;
            }

            f = 0;
            for (j = 0; j < i; j++) {
                e[j] /= h;
                f += e[j] * d[j];
            }

            hh = f / (h + h);
            for (j = 0; j < i; j++) {
                e[j] -= hh * d[j];
            }

            for (j = 0; j < i; j++) {
                f = d[j];
                g = e[j];
                for (k = j; k <= i - 1; k++) {
                    V[k][j] -= (f * e[k] + g * d[k]);
                }
                d[j] = V[i - 1][j];
                V[i][j] = 0;
            }
        }
        d[i] = h;
    }

    for (i = 0; i < n - 1; i++) {
        V[n - 1][i] = V[i][i];
        V[i][i] = 1;
        h = d[i + 1];
        if (h !== 0) {
            for (k = 0; k <= i; k++) {
                d[k] = V[k][i + 1] / h;
            }

            for (j = 0; j <= i; j++) {
                g = 0;
                for (k = 0; k <= i; k++) {
                    g += V[k][i + 1] * V[k][j];
                }
                for (k = 0; k <= i; k++) {
                    V[k][j] -= g * d[k];
                }
            }
        }

        for (k = 0; k <= i; k++) {
            V[k][i + 1] = 0;
        }
    }

    for (j = 0; j < n; j++) {
        d[j] = V[n - 1][j];
        V[n - 1][j] = 0;
    }

    V[n - 1][n - 1] = 1;
    e[0] = 0;
}

function tql2(n, e, d, V) {

    var g, h, i, j, k, l, m, p, r,
        dl1, c, c2, c3, el1, s, s2,
        iter;

    for (i = 1; i < n; i++) {
        e[i - 1] = e[i];
    }

    e[n - 1] = 0;

    var f = 0,
        tst1 = 0,
        eps = Math.pow(2, -52);

    for (l = 0; l < n; l++) {
        tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
        m = l;
        while (m < n) {
            if (Math.abs(e[m]) <= eps * tst1) {
                break;
            }
            m++;
        }

        if (m > l) {
            iter = 0;
            do {
                iter = iter + 1;

                g = d[l];
                p = (d[l + 1] - g) / (2 * e[l]);
                r = hypotenuse(p, 1);
                if (p < 0) {
                    r = -r;
                }

                d[l] = e[l] / (p + r);
                d[l + 1] = e[l] * (p + r);
                dl1 = d[l + 1];
                h = g - d[l];
                for (i = l + 2; i < n; i++) {
                    d[i] -= h;
                }

                f = f + h;

                p = d[m];
                c = 1;
                c2 = c;
                c3 = c;
                el1 = e[l + 1];
                s = 0;
                s2 = 0;
                for (i = m - 1; i >= l; i--) {
                    c3 = c2;
                    c2 = c;
                    s2 = s;
                    g = c * e[i];
                    h = c * p;
                    r = hypotenuse(p, e[i]);
                    e[i + 1] = s * r;
                    s = e[i] / r;
                    c = p / r;
                    p = c * d[i] - s * g;
                    d[i + 1] = h + s * (c * g + s * d[i]);

                    for (k = 0; k < n; k++) {
                        h = V[k][i + 1];
                        V[k][i + 1] = s * V[k][i] + c * h;
                        V[k][i] = c * V[k][i] - s * h;
                    }
                }

                p = -s * s2 * c3 * el1 * e[l] / dl1;
                e[l] = s * p;
                d[l] = c * p;

            }
            while (Math.abs(e[l]) > eps * tst1);
        }
        d[l] = d[l] + f;
        e[l] = 0;
    }

    for (i = 0; i < n - 1; i++) {
        k = i;
        p = d[i];
        for (j = i + 1; j < n; j++) {
            if (d[j] < p) {
                k = j;
                p = d[j];
            }
        }

        if (k !== i) {
            d[k] = d[i];
            d[i] = p;
            for (j = 0; j < n; j++) {
                p = V[j][i];
                V[j][i] = V[j][k];
                V[j][k] = p;
            }
        }
    }
}

function orthes(n, H, ort, V) {

    var low = 0,
        high = n - 1,
        f, g, h, i, j, m,
        scale;

    for (m = low + 1; m <= high - 1; m++) {
        scale = 0;
        for (i = m; i <= high; i++) {
            scale = scale + Math.abs(H[i][m - 1]);
        }

        if (scale !== 0) {
            h = 0;
            for (i = high; i >= m; i--) {
                ort[i] = H[i][m - 1] / scale;
                h += ort[i] * ort[i];
            }

            g = Math.sqrt(h);
            if (ort[m] > 0) {
                g = -g;
            }

            h = h - ort[m] * g;
            ort[m] = ort[m] - g;

            for (j = m; j < n; j++) {
                f = 0;
                for (i = high; i >= m; i--) {
                    f += ort[i] * H[i][j];
                }

                f = f / h;
                for (i = m; i <= high; i++) {
                    H[i][j] -= f * ort[i];
                }
            }

            for (i = 0; i <= high; i++) {
                f = 0;
                for (j = high; j >= m; j--) {
                    f += ort[j] * H[i][j];
                }

                f = f / h;
                for (j = m; j <= high; j++) {
                    H[i][j] -= f * ort[j];
                }
            }

            ort[m] = scale * ort[m];
            H[m][m - 1] = scale * g;
        }
    }

    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            V[i][j] = (i === j ? 1 : 0);
        }
    }

    for (m = high - 1; m >= low + 1; m--) {
        if (H[m][m - 1] !== 0) {
            for (i = m + 1; i <= high; i++) {
                ort[i] = H[i][m - 1];
            }

            for (j = m; j <= high; j++) {
                g = 0;
                for (i = m; i <= high; i++) {
                    g += ort[i] * V[i][j];
                }

                g = (g / ort[m]) / H[m][m - 1];
                for (i = m; i <= high; i++) {
                    V[i][j] += g * ort[i];
                }
            }
        }
    }
}

function hqr2(nn, e, d, V, H) {
    var n = nn - 1,
        low = 0,
        high = nn - 1,
        eps = Math.pow(2, -52),
        exshift = 0,
        norm = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        z = 0,
        iter = 0,
        i, j, k, l, m, t, w, x, y,
        ra, sa, vr, vi,
        notlast, cdivres;

    for (i = 0; i < nn; i++) {
        if (i < low || i > high) {
            d[i] = H[i][i];
            e[i] = 0;
        }

        for (j = Math.max(i - 1, 0); j < nn; j++) {
            norm = norm + Math.abs(H[i][j]);
        }
    }

    while (n >= low) {
        l = n;
        while (l > low) {
            s = Math.abs(H[l - 1][l - 1]) + Math.abs(H[l][l]);
            if (s === 0) {
                s = norm;
            }
            if (Math.abs(H[l][l - 1]) < eps * s) {
                break;
            }
            l--;
        }

        if (l === n) {
            H[n][n] = H[n][n] + exshift;
            d[n] = H[n][n];
            e[n] = 0;
            n--;
            iter = 0;
        } else if (l === n - 1) {
            w = H[n][n - 1] * H[n - 1][n];
            p = (H[n - 1][n - 1] - H[n][n]) / 2;
            q = p * p + w;
            z = Math.sqrt(Math.abs(q));
            H[n][n] = H[n][n] + exshift;
            H[n - 1][n - 1] = H[n - 1][n - 1] + exshift;
            x = H[n][n];

            if (q >= 0) {
                z = (p >= 0) ? (p + z) : (p - z);
                d[n - 1] = x + z;
                d[n] = d[n - 1];
                if (z !== 0) {
                    d[n] = x - w / z;
                }
                e[n - 1] = 0;
                e[n] = 0;
                x = H[n][n - 1];
                s = Math.abs(x) + Math.abs(z);
                p = x / s;
                q = z / s;
                r = Math.sqrt(p * p + q * q);
                p = p / r;
                q = q / r;

                for (j = n - 1; j < nn; j++) {
                    z = H[n - 1][j];
                    H[n - 1][j] = q * z + p * H[n][j];
                    H[n][j] = q * H[n][j] - p * z;
                }

                for (i = 0; i <= n; i++) {
                    z = H[i][n - 1];
                    H[i][n - 1] = q * z + p * H[i][n];
                    H[i][n] = q * H[i][n] - p * z;
                }

                for (i = low; i <= high; i++) {
                    z = V[i][n - 1];
                    V[i][n - 1] = q * z + p * V[i][n];
                    V[i][n] = q * V[i][n] - p * z;
                }
            } else {
                d[n - 1] = x + p;
                d[n] = x + p;
                e[n - 1] = z;
                e[n] = -z;
            }

            n = n - 2;
            iter = 0;
        } else {
            x = H[n][n];
            y = 0;
            w = 0;
            if (l < n) {
                y = H[n - 1][n - 1];
                w = H[n][n - 1] * H[n - 1][n];
            }

            if (iter === 10) {
                exshift += x;
                for (i = low; i <= n; i++) {
                    H[i][i] -= x;
                }
                s = Math.abs(H[n][n - 1]) + Math.abs(H[n - 1][n - 2]);
                x = y = 0.75 * s;
                w = -0.4375 * s * s;
            }

            if (iter === 30) {
                s = (y - x) / 2;
                s = s * s + w;
                if (s > 0) {
                    s = Math.sqrt(s);
                    if (y < x) {
                        s = -s;
                    }
                    s = x - w / ((y - x) / 2 + s);
                    for (i = low; i <= n; i++) {
                        H[i][i] -= s;
                    }
                    exshift += s;
                    x = y = w = 0.964;
                }
            }

            iter = iter + 1;

            m = n - 2;
            while (m >= l) {
                z = H[m][m];
                r = x - z;
                s = y - z;
                p = (r * s - w) / H[m + 1][m] + H[m][m + 1];
                q = H[m + 1][m + 1] - z - r - s;
                r = H[m + 2][m + 1];
                s = Math.abs(p) + Math.abs(q) + Math.abs(r);
                p = p / s;
                q = q / s;
                r = r / s;
                if (m === l) {
                    break;
                }
                if (Math.abs(H[m][m - 1]) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H[m - 1][m - 1]) + Math.abs(z) + Math.abs(H[m + 1][m + 1])))) {
                    break;
                }
                m--;
            }

            for (i = m + 2; i <= n; i++) {
                H[i][i - 2] = 0;
                if (i > m + 2) {
                    H[i][i - 3] = 0;
                }
            }

            for (k = m; k <= n - 1; k++) {
                notlast = (k !== n - 1);
                if (k !== m) {
                    p = H[k][k - 1];
                    q = H[k + 1][k - 1];
                    r = (notlast ? H[k + 2][k - 1] : 0);
                    x = Math.abs(p) + Math.abs(q) + Math.abs(r);
                    if (x !== 0) {
                        p = p / x;
                        q = q / x;
                        r = r / x;
                    }
                }

                if (x === 0) {
                    break;
                }

                s = Math.sqrt(p * p + q * q + r * r);
                if (p < 0) {
                    s = -s;
                }

                if (s !== 0) {
                    if (k !== m) {
                        H[k][k - 1] = -s * x;
                    } else if (l !== m) {
                        H[k][k - 1] = -H[k][k - 1];
                    }

                    p = p + s;
                    x = p / s;
                    y = q / s;
                    z = r / s;
                    q = q / p;
                    r = r / p;

                    for (j = k; j < nn; j++) {
                        p = H[k][j] + q * H[k + 1][j];
                        if (notlast) {
                            p = p + r * H[k + 2][j];
                            H[k + 2][j] = H[k + 2][j] - p * z;
                        }

                        H[k][j] = H[k][j] - p * x;
                        H[k + 1][j] = H[k + 1][j] - p * y;
                    }

                    for (i = 0; i <= Math.min(n, k + 3); i++) {
                        p = x * H[i][k] + y * H[i][k + 1];
                        if (notlast) {
                            p = p + z * H[i][k + 2];
                            H[i][k + 2] = H[i][k + 2] - p * r;
                        }

                        H[i][k] = H[i][k] - p;
                        H[i][k + 1] = H[i][k + 1] - p * q;
                    }

                    for (i = low; i <= high; i++) {
                        p = x * V[i][k] + y * V[i][k + 1];
                        if (notlast) {
                            p = p + z * V[i][k + 2];
                            V[i][k + 2] = V[i][k + 2] - p * r;
                        }

                        V[i][k] = V[i][k] - p;
                        V[i][k + 1] = V[i][k + 1] - p * q;
                    }
                }
            }
        }
    }

    if (norm === 0) {
        return;
    }

    for (n = nn - 1; n >= 0; n--) {
        p = d[n];
        q = e[n];

        if (q === 0) {
            l = n;
            H[n][n] = 1;
            for (i = n - 1; i >= 0; i--) {
                w = H[i][i] - p;
                r = 0;
                for (j = l; j <= n; j++) {
                    r = r + H[i][j] * H[j][n];
                }

                if (e[i] < 0) {
                    z = w;
                    s = r;
                } else {
                    l = i;
                    if (e[i] === 0) {
                        H[i][n] = (w !== 0) ? (-r / w) : (-r / (eps * norm));
                    } else {
                        x = H[i][i + 1];
                        y = H[i + 1][i];
                        q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
                        t = (x * s - z * r) / q;
                        H[i][n] = t;
                        H[i + 1][n] = (Math.abs(x) > Math.abs(z)) ? ((-r - w * t) / x) : ((-s - y * t) / z);
                    }

                    t = Math.abs(H[i][n]);
                    if ((eps * t) * t > 1) {
                        for (j = i; j <= n; j++) {
                            H[j][n] = H[j][n] / t;
                        }
                    }
                }
            }
        } else if (q < 0) {
            l = n - 1;

            if (Math.abs(H[n][n - 1]) > Math.abs(H[n - 1][n])) {
                H[n - 1][n - 1] = q / H[n][n - 1];
                H[n - 1][n] = -(H[n][n] - p) / H[n][n - 1];
            } else {
                cdivres = cdiv(0, -H[n - 1][n], H[n - 1][n - 1] - p, q);
                H[n - 1][n - 1] = cdivres[0];
                H[n - 1][n] = cdivres[1];
            }

            H[n][n - 1] = 0;
            H[n][n] = 1;
            for (i = n - 2; i >= 0; i--) {
                ra = 0;
                sa = 0;
                for (j = l; j <= n; j++) {
                    ra = ra + H[i][j] * H[j][n - 1];
                    sa = sa + H[i][j] * H[j][n];
                }

                w = H[i][i] - p;

                if (e[i] < 0) {
                    z = w;
                    r = ra;
                    s = sa;
                } else {
                    l = i;
                    if (e[i] === 0) {
                        cdivres = cdiv(-ra, -sa, w, q);
                        H[i][n - 1] = cdivres[0];
                        H[i][n] = cdivres[1];
                    } else {
                        x = H[i][i + 1];
                        y = H[i + 1][i];
                        vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
                        vi = (d[i] - p) * 2 * q;
                        if (vr === 0 && vi === 0) {
                            vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
                        }
                        cdivres = cdiv(x * r - z * ra + q * sa, x * s - z * sa - q * ra, vr, vi);
                        H[i][n - 1] = cdivres[0];
                        H[i][n] = cdivres[1];
                        if (Math.abs(x) > (Math.abs(z) + Math.abs(q))) {
                            H[i + 1][n - 1] = (-ra - w * H[i][n - 1] + q * H[i][n]) / x;
                            H[i + 1][n] = (-sa - w * H[i][n] - q * H[i][n - 1]) / x;
                        } else {
                            cdivres = cdiv(-r - y * H[i][n - 1], -s - y * H[i][n], z, q);
                            H[i + 1][n - 1] = cdivres[0];
                            H[i + 1][n] = cdivres[1];
                        }
                    }

                    t = Math.max(Math.abs(H[i][n - 1]), Math.abs(H[i][n]));
                    if ((eps * t) * t > 1) {
                        for (j = i; j <= n; j++) {
                            H[j][n - 1] = H[j][n - 1] / t;
                            H[j][n] = H[j][n] / t;
                        }
                    }
                }
            }
        }
    }

    for (i = 0; i < nn; i++) {
        if (i < low || i > high) {
            for (j = i; j < nn; j++) {
                V[i][j] = H[i][j];
            }
        }
    }

    for (j = nn - 1; j >= low; j--) {
        for (i = low; i <= high; i++) {
            z = 0;
            for (k = low; k <= Math.min(j, high); k++) {
                z = z + V[i][k] * H[k][j];
            }
            V[i][j] = z;
        }
    }
}

function cdiv(xr, xi, yr, yi) {
    var r, d;
    if (Math.abs(yr) > Math.abs(yi)) {
        r = yi / yr;
        d = yr + r * yi;
        return [(xr + r * xi) / d, (xi - r * xr) / d];
    } else {
        r = yr / yi;
        d = yi + r * yr;
        return [(r * xr + xi) / d, (r * xi - xr) / d];
    }
}

// https://github.com/lutzroeder/Mapack/blob/master/Source/CholeskyDecomposition.cs
function CholeskyDecomposition(value) {
    if (!(this instanceof CholeskyDecomposition)) {
        return new CholeskyDecomposition(value);
    }
    value = Matrix.checkMatrix(value);
    if (!value.isSymmetric()) {
        throw new Error('Matrix is not symmetric');
    }

    var a = value,
        dimension = a.rows,
        l = new Matrix(dimension, dimension),
        positiveDefinite = true,
        i, j, k;

    for (j = 0; j < dimension; j++) {
        var Lrowj = l[j];
        var d = 0;
        for (k = 0; k < j; k++) {
            var Lrowk = l[k];
            var s = 0;
            for (i = 0; i < k; i++) {
                s += Lrowk[i] * Lrowj[i];
            }
            Lrowj[k] = s = (a[j][k] - s) / l[k][k];
            d = d + s * s;
        }

        d = a[j][j] - d;

        positiveDefinite &= (d > 0);
        l[j][j] = Math.sqrt(Math.max(d, 0));
        for (k = j + 1; k < dimension; k++) {
            l[j][k] = 0;
        }
    }

    if (!positiveDefinite) {
        throw new Error('Matrix is not positive definite');
    }

    this.L = l;
}

CholeskyDecomposition.prototype = {
    get lowerTriangularMatrix() {
        return this.L;
    },
    solve: function (value) {
        value = Matrix.checkMatrix(value);

        var l = this.L,
            dimension = l.rows;

        if (value.rows !== dimension) {
            throw new Error('Matrix dimensions do not match');
        }

        var count = value.columns,
            B = value.clone(),
            i, j, k;

        for (k = 0; k < dimension; k++) {
            for (j = 0; j < count; j++) {
                for (i = 0; i < k; i++) {
                    B[k][j] -= B[i][j] * l[k][i];
                }
                B[k][j] /= l[k][k];
            }
        }

        for (k = dimension - 1; k >= 0; k--) {
            for (j = 0; j < count; j++) {
                for (i = k + 1; i < dimension; i++) {
                    B[k][j] -= B[i][j] * l[i][k];
                }
                B[k][j] /= l[k][k];
            }
        }

        return B;
    }
};



var index$24 = Object.freeze({
	default: Matrix,
	Matrix: Matrix,
	abstractMatrix: AbstractMatrix,
	solve: solve,
	inverse: inverse,
	SingularValueDecomposition: SingularValueDecomposition,
	SVD: SingularValueDecomposition,
	EigenvalueDecomposition: EigenvalueDecomposition,
	EVD: EigenvalueDecomposition,
	CholeskyDecomposition: CholeskyDecomposition,
	CHO: CholeskyDecomposition,
	LuDecomposition: LuDecomposition,
	LU: LuDecomposition,
	QrDecomposition: QrDecomposition,
	QR: QrDecomposition
});

function getSeparatedKernel(kernel) {
    var svd = new SingularValueDecomposition(kernel, { autoTranspose: true });
    if (svd.rank !== 1) return null;
    var s = Math.sqrt(svd.s[0]);
    var v = svd.U.map(v => v[0] * s);
    var h = svd.V.map(h => h[0] * s);
    return [v, h];
}

/**
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} kernel
 * @param {object} [options] - options
 * @param {Array} [options.channels] - Array of channels to treat. Defaults to all channels
 * @param {number} [options.bitDepth=this.bitDepth] - A new bit depth can be specified. This allows to use 32 bits to avoid clamping of floating-point numbers.
 * @param {boolean} [options.normalize=false]
 * @param {number} [options.divisor=1]
 * @param {string} [options.border='copy']
 * @param {string} [options.algorithm='auto'] - Either 'auto', 'direct', 'fft' or 'separable'. fft is much faster for large kernel.
 * If the separable algorithm is used, one must provide as kernel an array of two 1D kernels.
 * The 'auto' option will try to separate the kernel if that is possible.
 * @return {Image}
 */
function convolution(kernel) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels,
        bitDepth = options.bitDepth,
        _options$normalize = options.normalize,
        normalize = _options$normalize === undefined ? false : _options$normalize,
        _options$divisor = options.divisor,
        divisor = _options$divisor === undefined ? 1 : _options$divisor,
        _options$border = options.border,
        border = _options$border === undefined ? 'copy' : _options$border,
        _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'auto' : _options$algorithm;


    var newImage = Image$1.createFrom(this, { bitDepth });

    channels = validateArrayOfChannels(this, channels, true);

    if (algorithm !== 'separable') {
        var _validateKernel = validateKernel(kernel);

        kernel = _validateKernel.kernel;
    } else if (!Array.isArray(kernel) || kernel.length !== 2) {
        throw new RangeError('separable convolution requires two arrays of numbers to represent the kernel');
    }

    if (algorithm === 'auto') {
        var separatedKernel = getSeparatedKernel(kernel);
        if (separatedKernel !== null) {
            algorithm = 'separable';
            kernel = separatedKernel;
        } else if ((kernel.length > 9 || kernel[0].length > 9) && this.width <= 4096 && this.height <= 4096) {
            algorithm = 'fft';
        } else {
            algorithm = 'direct';
        }
    }

    var halfHeight = void 0,
        halfWidth = void 0;
    if (algorithm === 'separable') {
        halfHeight = Math.floor(kernel[0].length / 2);
        halfWidth = Math.floor(kernel[1].length / 2);
    } else {
        halfHeight = Math.floor(kernel.length / 2);
        halfWidth = Math.floor(kernel[0].length / 2);
    }
    var clamped = newImage.isClamped;

    var tmpData = new Array(this.height * this.width);
    var index = void 0,
        x = void 0,
        y = void 0,
        channel = void 0,
        c = void 0,
        tmpResult = void 0;
    for (channel = 0; channel < channels.length; channel++) {
        c = channels[channel];
        //Copy the channel in a single array
        for (y = 0; y < this.height; y++) {
            for (x = 0; x < this.width; x++) {
                index = y * this.width + x;
                tmpData[index] = this.data[index * this.channels + c];
            }
        }
        if (algorithm === 'direct') {
            tmpResult = index_1$3(tmpData, kernel, {
                rows: this.height,
                cols: this.width,
                normalize: normalize,
                divisor: divisor
            });
        } else if (algorithm === 'separable') {
            tmpResult = convolutionSeparable(tmpData, kernel, this.width, this.height);
            if (normalize) {
                divisor = 0;
                for (var i = 0; i < kernel[0].length; i++) {
                    for (var j = 0; j < kernel[1].length; j++) {
                        divisor += kernel[0][i] * kernel[1][j];
                    }
                }
            }
            if (divisor !== 1) {
                for (var _i = 0; _i < tmpResult.length; _i++) {
                    tmpResult[_i] /= divisor;
                }
            }
        } else {
            tmpResult = index_2$1(tmpData, kernel, {
                rows: this.height,
                cols: this.width,
                normalize: normalize,
                divisor: divisor
            });
        }

        //Copy the result to the output image
        for (y = 0; y < this.height; y++) {
            for (x = 0; x < this.width; x++) {
                index = y * this.width + x;
                if (clamped) {
                    newImage.data[index * this.channels + c] = Math.min(Math.max(tmpResult[index], 0), newImage.maxValue);
                } else {
                    newImage.data[index * this.channels + c] = tmpResult[index];
                }
            }
        }
    }
    // if the kernel was not applied on the alpha channel we just copy it
    // TODO: in general we should copy the channels that where not changed
    // TODO: probably we should just copy the image at the beginning ?
    if (this.alpha && !channels.includes(this.channels)) {
        for (x = this.components; x < this.data.length; x = x + this.channels) {
            newImage.data[x] = this.data[x];
        }
    }

    //I only can have 3 types of borders:
    //  1. Considering the image as periodic: periodic
    //  2. Extend the interior borders: copy
    //  3. fill with a color: set
    if (border !== 'periodic') {
        newImage.setBorder({ size: [halfWidth, halfHeight], algorithm: border });
    }

    return newImage;
}

/**
 * Apply a gaussian filter to the image
 * @memberof Image
 * @instance
 * @param {object} options
 * @param {number} [options.radius=1] : number of pixels around the current pixel
 * @param {number} [options.sigma]
 * @param {number[]|string[]} [options.channels] : to which channel to apply the filter. By default all but alpha.
 * @param {string} [options.border='copy']
 * @param {boolean} [options.algorithm='auto'] : Algorithm for convolution {@link Image#convolution}
 * @return {Image}
 */
function gaussianFilter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$radius = options.radius,
        radius = _options$radius === undefined ? 1 : _options$radius,
        sigma = options.sigma,
        channels = options.channels,
        _options$border = options.border,
        border = _options$border === undefined ? 'copy' : _options$border;


    this.checkProcessable('gaussian', {
        bitDepth: [8, 16]
    });

    var kernel = void 0;
    if (sigma) {
        kernel = getSigmaKernel(sigma);
    } else {
        // sigma approximation using radius
        sigma = 0.3 * (radius - 1) + 0.8;
        kernel = getKernel(radius, sigma);
    }

    return convolution.call(this, [kernel, kernel], { border, channels, algorithm: 'separable' });
}

var sqrt2Pi = Math.sqrt(2 * Math.PI);

function getKernel(radius, sigma) {
    if (radius < 1) {
        throw new RangeError('Radius should be grater than 0');
    }

    var n = 2 * radius + 1;
    var kernel = new Array(n);
    var twoSigmaSquared = 0 - 1 / (2 * sigma * sigma);
    var sigmaSqrt2Pi = 1 / (sigma * sqrt2Pi);

    for (var i = 0; i <= radius; i++) {
        var value = Math.exp(i * i * twoSigmaSquared) * sigmaSqrt2Pi;
        kernel[radius + i] = value;
        kernel[radius - i] = value;
    }
    return kernel;
}

function getSigmaKernel(sigma) {
    if (sigma <= 0) {
        throw new RangeError('Sigma should be grater than 0');
    }
    var sigma2 = 2 * (sigma * sigma); //2*sigma^2
    var PI2sigma2 = Math.PI * sigma2; //2*PI*sigma^2
    var value = 1 / PI2sigma2;
    var sum = value;
    var neighbors = 0;

    while (sum < 0.99) {
        neighbors++;
        value = Math.exp(-(neighbors * neighbors) / sigma2) / PI2sigma2;
        sum += 4 * value;
        for (var i = 1; i < neighbors; i++) {
            value = Math.exp(-(i * i + neighbors * neighbors) / sigma2) / PI2sigma2;
            sum += 8 * value;
        }
        value = 4 * Math.exp(-(2 * neighbors * neighbors) / sigma2) / PI2sigma2;
        sum += value;
    }

    // What does this case mean ?
    if (sum > 1) {
        throw new Error('unexpected sum over 1');
    }

    return getKernel(neighbors, sigma);
}

var DISCRETE_LAPLACE_4 = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

var DISCRETE_LAPLACE_8 = [[1, 1, 1], [1, -8, 1], [1, 1, 1]];

var GRADIENT_X = [[-1, 0, +1], [-2, 0, +2], [-1, 0, +1]];

var GRADIENT_Y = [[-1, -2, -1], [0, 0, 0], [+1, +2, +1]];

var SECOND_DERIVATIVE = [[-1, -2, 0, 2, 1], [-2, -4, 0, 4, 2], [0, 0, 0, 0, 0], [1, 2, 0, -2, -1], [2, 4, 0, -4, -2]];

var SECOND_DERIVATIVE_INV = [[1, 2, 0, -2, -1], [2, 4, 0, -4, -2], [0, 0, 0, 0, 0], [-2, -4, 0, 4, 2], [-1, -2, 0, 2, 1]];

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {Array<Array<number>>} [options.kernelX]
 * @param {Array<Array<number>>} [options.kernelY]
 * @param {string} [options.border='copy']
 * @param {*} [options.channels]
 * #param {number} [options.bitDepth=this.bitDepth] Specify the bitDepth of the resulting image
 * @return {Image}
 */
function sobelFilter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$kernelX = options.kernelX,
        kernelX = _options$kernelX === undefined ? GRADIENT_X : _options$kernelX,
        _options$kernelY = options.kernelY,
        kernelY = _options$kernelY === undefined ? GRADIENT_Y : _options$kernelY,
        _options$border = options.border,
        border = _options$border === undefined ? 'copy' : _options$border,
        channels = options.channels,
        _options$bitDepth = options.bitDepth,
        bitDepth = _options$bitDepth === undefined ? this.bitDepth : _options$bitDepth;


    this.checkProcessable('sobel', {
        bitDepth: [8, 16]
    });

    var gX = convolution.call(this, kernelX, {
        channels: channels,
        border: border,
        bitDepth: 32
    });

    var gY = convolution.call(this, kernelY, {
        channels: channels,
        border: border,
        bitDepth: 32
    });

    return gX.hypotenuse(gY, { bitDepth, channels: channels });
}

var index$29 = newArray;

function newArray (n, value) {
  n = n || 0;
  var array = new Array(n);
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array
}

/**
 * Level the image for by default have the minimal and maximal values.
 * @memberof Image
 * @instance
 * @param {object} options
 * @param {(undefined|number|string|[number]|[string])} [options.channels=undefined] Specify which channels should be processed
 *      * undefined : we take all the channels but alpha
 *      * number : this specific channel
 *      * string : converted to a channel based on rgb, cmyk, hsl or hsv (one letter code)
 *      * [number] : array of channels as numbers
 *      * [string] : array of channels as one letter string
 * @param {number} [options.min=this.min] minimal value after levelling
 * @param {number} [options.max=this.max] maximal value after levelling
 * @return {this}
 */
function level() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'range' : _options$algorithm,
        channels = options.channels,
        _options$min = options.min,
        min = _options$min === undefined ? this.min : _options$min,
        _options$max = options.max,
        max = _options$max === undefined ? this.max : _options$max;


    this.checkProcessable('level', {
        bitDepth: [8, 16]
    });

    channels = validateArrayOfChannels(this, { channels: channels });

    switch (algorithm) {
        case 'range':
            if (min < 0) {
                min = 0;
            }
            if (max > this.maxValue) {
                max = this.maxValue;
            }

            if (!Array.isArray(min)) {
                min = index$29(channels.length, min);
            }
            if (!Array.isArray(max)) {
                max = index$29(channels.length, max);
            }

            processImage(this, min, max, channels);
            break;

        default:
            throw new Error('level: algorithm not implement: ' + algorithm);
    }

    return this;
}

function processImage(image, min, max, channels) {
    var delta = 1e-5; // sorry no better value that this "best guess"
    var factor = new Array(image.channels);

    for (var c of channels) {
        if (min[c] === 0 && max[c] === image.maxValue) {
            factor[c] = 0;
        } else if (max[c] === min[c]) {
            factor[c] = 0;
        } else {
            factor[c] = (image.maxValue + 1 - delta) / (max[c] - min[c]);
        }
        min[c] += (0.5 - delta / 2) / factor[c];
    }

    /*
     Note on border effect
     For 8 bits images we should calculate for the space between -0.5 and 255.5
     so that after ronding the first and last points still have the same population
     But doing this we need to deal with Math.round that gives 256 if the value is 255.5
     */

    for (var j = 0; j < channels.length; j++) {
        var _c = channels[j];
        if (factor[_c] !== 0) {
            for (var i = 0; i < image.data.length; i += image.channels) {
                image.data[i + _c] = Math.min(Math.max(0, (image.data[i + _c] - min[_c]) * factor[_c] + 0.5 | 0), image.maxValue);
            }
        }
    }
}

var toString$3 = Object.prototype.toString;

var isArrayType = function isArrayType(value) {
    return toString$3.call(value).substr(-6, 5) === 'Array';
};

function checkNumberArray(value) {
    if (!isNaN(value)) {
        if (value <= 0) {
            throw new Error('checkNumberArray: the value must be greater than 0');
        }
        return value;
    } else {
        if (value instanceof Image$1) {
            return value.data;
        }
        if (!isArrayType(value)) {
            throw new Error('checkNumberArray: the value should be either a number, array or Image');
        }
        return value;
    }
}

/**
 * Add a specific integer on the specified points of the specified channels
 * @memberof Image
 * @instance
 * @param {*} value
 * @param {object} [options]
 * @return {this} Modified current image
 */
function add(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels;

    this.checkProcessable('add', {
        bitDepth: [8, 16]
    });

    channels = validateArrayOfChannels(this, { channels: channels });
    value = checkNumberArray(value);

    // we allow 3 cases, the value may be an array (1D), an image or a single value
    if (!isNaN(value)) {
        for (var j = 0; j < channels.length; j++) {
            var c = channels[j];
            for (var i = 0; i < this.data.length; i += this.channels) {
                this.data[i + c] = Math.min(this.maxValue, this.data[i + c] + value >> 0);
            }
        }
    } else {
        if (this.data.length !== value.length) {
            throw new Error('add: the data size is different');
        }
        for (var _j = 0; _j < channels.length; _j++) {
            var _c = channels[_j];
            for (var _i = 0; _i < this.data.length; _i += this.channels) {
                this.data[_i + _c] = Math.max(0, Math.min(this.maxValue, this.data[_i + _c] + value[_i + _c] >> 0));
            }
        }
    }

    return this;
}

/**
 * @memberof Image
 * @instance
 * @param {*} value
 * @param {object} [options]
 * @return {this}
 */
function subtract(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels;

    this.checkProcessable('subtract', {
        bitDepth: [8, 16]
    });

    channels = validateArrayOfChannels(this, { channels: channels });
    value = checkNumberArray(value);

    if (!isNaN(value)) {
        for (var j = 0; j < channels.length; j++) {
            var c = channels[j];
            for (var i = 0; i < this.data.length; i += this.channels) {
                this.data[i + c] = Math.max(0, this.data[i + c] - value >> 0);
            }
        }
    } else {
        if (this.data.length !== value.length) {
            throw new Error('substract: the data size is different');
        }
        for (var _j = 0; _j < channels.length; _j++) {
            var _c = channels[_j];
            for (var _i = 0; _i < this.data.length; _i += this.channels) {
                this.data[_i + _c] = Math.max(0, Math.min(this.maxValue, this.data[_i + _c] - value[_i + _c] >> 0));
            }
        }
    }

    return this;
}

/**
 * Calculate a new image that is the hypotenuse between the current image and the otherImage.
 * @memberof Image
 * @instance
 * @param {Image} otherImage
 * @param {object} [options={}]
 * @param {number} [options.bitDepth=this.bitDepth]
 * @param {number[]|string[]} [options.channels] : to which channel to apply the filter. By default all but alpha.
 * @return {Image}
 */
function hypotenuse$1(otherImage) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$bitDepth = options.bitDepth,
        bitDepth = _options$bitDepth === undefined ? this.bitDepth : _options$bitDepth,
        channels = options.channels;

    this.checkProcessable('hypotenuse', {
        bitDepth: [8, 16, 32]
    });
    if (this.width !== otherImage.width || this.height !== otherImage.height) {
        throw new Error('hypotenuse: both images must have the same size');
    }
    if (this.alpha !== otherImage.alpha || this.bitDepth !== otherImage.bitDepth) {
        throw new Error('hypotenuse: both images must have the same alpha and bitDepth');
    }
    if (this.channels !== otherImage.channels) {
        throw new Error('hypotenuse: both images must have the same number of channels');
    }

    var newImage = Image$1.createFrom(this, { bitDepth: bitDepth });

    channels = validateArrayOfChannels(this, { channels: channels });

    var clamped = newImage.isClamped;

    for (var j = 0; j < channels.length; j++) {
        var c = channels[j];
        for (var i = c; i < this.data.length; i += this.channels) {
            var value = Math.hypot(this.data[i], otherImage.data[i]);
            if (clamped) {
                // we calculate the clamped result
                newImage.data[i] = Math.min(Math.max(Math.round(value), 0), newImage.maxValue);
            } else {
                newImage.data[i] = value;
            }
        }
    }

    return newImage;
}

/**
 * @memberof Image
 * @instance
 * @param {*} value
 * @param {object} [options]
 * @return {this}
 */
function multiply(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels;

    this.checkProcessable('multiply', {
        bitDepth: [8, 16]
    });
    if (value <= 0) {
        throw new Error('multiply: the value must be greater than 0');
    }

    channels = validateArrayOfChannels(this, { channels: channels });
    value = checkNumberArray(value);

    if (!isNaN(value)) {
        for (var j = 0; j < channels.length; j++) {
            var c = channels[j];
            for (var i = 0; i < this.data.length; i += this.channels) {
                this.data[i + c] = Math.min(this.maxValue, this.data[i + c] * value >> 0);
            }
        }
    } else {
        if (this.data.length !== value.length) {
            throw new Error('multiply: the data size is different');
        }
        for (var _j = 0; _j < channels.length; _j++) {
            var _c = channels[_j];
            for (var _i = 0; _i < this.data.length; _i += this.channels) {
                this.data[_i + _c] = Math.max(0, Math.min(this.maxValue, this.data[_i + _c] * value[_i + _c] >> 0));
            }
        }
    }

    return this;
}

/**
 * @memberof Image
 * @instance
 * @param {*} value
 * @param {object} [options]
 * @return {this}
 */
function divide(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channels = options.channels;

    this.checkProcessable('divide', {
        bitDepth: [8, 16]
    });

    channels = validateArrayOfChannels(this, { channels: channels });
    value = checkNumberArray(value);

    if (!isNaN(value)) {
        for (var j = 0; j < channels.length; j++) {
            var c = channels[j];
            for (var i = 0; i < this.data.length; i += this.channels) {
                this.data[i + c] = Math.min(this.maxValue, this.data[i + c] / value >> 0);
            }
        }
    } else {
        if (this.data.length !== value.length) {
            throw new Error('divide: the: the data size is different');
        }
        for (var _j = 0; _j < channels.length; _j++) {
            var _c = channels[_j];
            for (var _i = 0; _i < this.data.length; _i += this.channels) {
                this.data[_i + _c] = Math.max(0, Math.min(this.maxValue, this.data[_i + _c] / value[_i + _c] >> 0));
            }
        }
    }

    return this;
}

class BaseRegression {
    constructor() {
        if (new.target === BaseRegression) {
            throw new Error('BaseRegression must be subclassed');
        }
    }

    predict(x) {
        if (typeof x === 'number') {
            return this._predict(x);
        } else if (Array.isArray(x)) {
            const y = new Array(x.length);
            for (let i = 0; i < x.length; i++) {
                y[i] = this._predict(x[i]);
            }
            return y;
        } else {
            throw new TypeError('x must be a number or array');
        }
    }

    _predict() {
        throw new Error('_predict must be implemented');
    }

    train() {
        //Do nothing for this package
    }

    toString() {
        return '';
    }

    toLaTeX() {
        return '';
    }

    /**
     * Return the correlation coefficient of determination (r) and chi-square.
     * @param {Array<number>} x
     * @param {Array<number>} y
     * @return {object}
     */
    score(x, y) {
        if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) {
            throw new Error('x and y must be arrays of the same length');
        }

        const n = x.length;
        const y2 = new Array(n);
        for (let i = 0; i < n; i++) {
            y2[i] = this._predict(x[i]);
        }

        let xSum = 0;
        let ySum = 0;
        let chi2 = 0;
        let rmsd = 0;
        let xSquared = 0;
        let ySquared = 0;
        let xY = 0;
        for (let i = 0; i < n; i++) {
            xSum += y2[i];
            ySum += y[i];
            xSquared += y2[i] * y2[i];
            ySquared += y[i] * y[i];
            xY += y2[i] * y[i];
            if (y[i] !== 0) {
                chi2 += (y[i] - y2[i]) * (y[i] - y2[i]) / y[i];
            }
            rmsd = (y[i] - y2[i]) * (y[i] - y2[i]);
        }

        const r = (n * xY - xSum * ySum) / Math.sqrt((n * xSquared - xSum * xSum) * (n * ySquared - ySum * ySum));

        return {
            r: r,
            r2: r * r,
            chi2: chi2,
            rmsd: rmsd * rmsd / n
        };
    }
}

function squaredEuclidean$1(p, q) {
    var d = 0;
    for (var i = 0; i < p.length; i++) {
        d += (p[i] - q[i]) * (p[i] - q[i]);
    }
    return d;
}

function euclidean(p, q) {
    return Math.sqrt(squaredEuclidean$1(p, q));
}

var euclidean_1 = euclidean;
euclidean.squared = squaredEuclidean$1;

const squaredEuclidean = euclidean_1.squared;

const defaultOptions$2 = {
    sigma: 1
};

class GaussianKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$2, options);
        this.sigma = options.sigma;
        this.divisor = 2 * options.sigma * options.sigma;
    }

    compute(x, y) {
        const distance = squaredEuclidean(x, y);
        return Math.exp(-distance / this.divisor);
    }
}

var gaussianKernel = GaussianKernel;

const defaultOptions$3 = {
    degree: 1,
    constant: 1,
    scale: 1
};

class PolynomialKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$3, options);

        this.degree = options.degree;
        this.constant = options.constant;
        this.scale = options.scale;
    }

    compute(x, y) {
        var sum = 0;
        for (var i = 0; i < x.length; i++) {
            sum += x[i] * y[i];
        }
        return Math.pow(this.scale * sum + this.constant, this.degree);
    }
}

var polynomialKernel = PolynomialKernel;

const defaultOptions$4 = {
    sigma: 1,
    degree: 1
};

class ANOVAKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$4, options);
        this.sigma = options.sigma;
        this.degree = options.degree;
    }

    compute(x, y) {
        var sum = 0;
        var len = Math.min(x.length, y.length);
        for (var i = 1; i <= len; ++i) {
            sum += Math.pow(Math.exp(-this.sigma * Math.pow(Math.pow(x[i - 1], i) -
                    Math.pow(y[i - 1], i), 2)), this.degree);
        }
        return sum;
    }
}

var anovaKernel = ANOVAKernel;

const squaredEuclidean$2 = euclidean_1.squared;

const defaultOptions$5 = {
    sigma: 1
};

class CauchyKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$5, options);
        this.sigma = options.sigma;
    }

    compute(x, y) {
        return 1 / (1 + squaredEuclidean$2(x, y) / (this.sigma * this.sigma));
    }
}

var cauchyKernel = CauchyKernel;

const defaultOptions$6 = {
    sigma: 1
};

class ExponentialKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$6, options);
        this.sigma = options.sigma;
        this.divisor = 2 * options.sigma * options.sigma;
    }

    compute(x, y) {
        const distance = euclidean_1(x, y);
        return Math.exp(-distance / this.divisor);
    }
}

var exponentialKernel = ExponentialKernel;

class HistogramIntersectionKernel {
    compute(x, y) {
        var min = Math.min(x.length, y.length);
        var sum = 0;
        for (var i = 0; i < min; ++i) {
            sum += Math.min(x[i], y[i]);
        }

        return sum;
    }
}

var histogramIntersectionKernel = HistogramIntersectionKernel;

const defaultOptions$7 = {
    sigma: 1
};

class LaplacianKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$7, options);
        this.sigma = options.sigma;
    }

    compute(x, y) {
        const distance = euclidean_1(x, y);
        return Math.exp(-distance / this.sigma);
    }
}

var laplacianKernel = LaplacianKernel;

const squaredEuclidean$3 = euclidean_1.squared;

const defaultOptions$8 = {
    constant: 1
};

class MultiquadraticKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$8, options);
        this.constant = options.constant;
    }

    compute(x, y) {
        return Math.sqrt(squaredEuclidean$3(x, y) + this.constant * this.constant);
    }
}

var multiquadraticKernel = MultiquadraticKernel;

const squaredEuclidean$4 = euclidean_1.squared;

const defaultOptions$9 = {
    constant: 1
};

class RationalQuadraticKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$9, options);
        this.constant = options.constant;
    }

    compute(x, y) {
        const distance = squaredEuclidean$4(x, y);
        return 1 - (distance / (distance + this.constant));
    }
}

var rationalQuadraticKernel = RationalQuadraticKernel;

const defaultOptions$10 = {
    alpha: 0.01,
    constant: -Math.E
};

class SigmoidKernel {
    constructor(options) {
        options = Object.assign({}, defaultOptions$10, options);
        this.alpha = options.alpha;
        this.constant = options.constant;
    }

    compute(x, y) {
        var sum = 0;
        for (var i = 0; i < x.length; i++) {
            sum += x[i] * y[i];
        }
        return Math.tanh(this.alpha * sum + this.constant);
    }
}

var sigmoidKernel = SigmoidKernel;

var require$$0$8 = ( index$24 && Matrix ) || index$24;

const Matrix$1 = require$$0$8.Matrix;












const kernelType = {
    gaussian: gaussianKernel,
    rbf: gaussianKernel,
    polynomial: polynomialKernel,
    poly: polynomialKernel,
    anova: anovaKernel,
    cauchy: cauchyKernel,
    exponential: exponentialKernel,
    histogram: histogramIntersectionKernel,
    min: histogramIntersectionKernel,
    laplacian: laplacianKernel,
    multiquadratic: multiquadraticKernel,
    rational: rationalQuadraticKernel,
    sigmoid: sigmoidKernel,
    mlp: sigmoidKernel
};

class Kernel {
    constructor(type, options) {
        this.kernelType = type;
        if (type === 'linear') return;

        if (typeof type === 'string') {
            type = type.toLowerCase();

            var KernelConstructor = kernelType[type];
            if (KernelConstructor) {
                this.kernelFunction = new KernelConstructor(options);
            } else {
                throw new Error('unsupported kernel type: ' + type);
            }
        } else if (typeof type === 'object' && typeof type.compute === 'function') {
            this.kernelFunction = type;
        } else {
            throw new TypeError('first argument must be a valid kernel type or instance');
        }
    }

    compute(inputs, landmarks) {
        if (landmarks === undefined) {
            landmarks = inputs;
        }

        if (this.kernelType === 'linear') {
            var matrix = new Matrix$1(inputs);
            return matrix.mmul(new Matrix$1(landmarks).transposeView());
        }

        const kernelMatrix = new Matrix$1(inputs.length, landmarks.length);
        var i, j;
        if (inputs === landmarks) { // fast path, matrix is symmetric
            for (i = 0; i < inputs.length; i++) {
                for (j = i; j < inputs.length; j++) {
                    kernelMatrix[i][j] = kernelMatrix[j][i] = this.kernelFunction.compute(inputs[i], inputs[j]);
                }
            }
        } else {
            for (i = 0; i < inputs.length; i++) {
                for (j = 0; j < landmarks.length; j++) {
                    kernelMatrix[i][j] = this.kernelFunction.compute(inputs[i], landmarks[j]);
                }
            }
        }
        return kernelMatrix;
    }
}

var kernel = Kernel;

const defaultOptions$1 = {
    lambda: 0.1,
    kernelType: 'gaussian',
    kernelOptions: {},
    computeCoefficient: false
};

// Implements the Kernel ridge regression algorithm.
// http://www.ics.uci.edu/~welling/classnotes/papers_class/Kernel-Ridge.pdf
class KernelRidgeRegression extends BaseRegression {
    constructor(inputs, outputs, options) {
        super();
        if (inputs === true) { // reloading model
            this.alpha = outputs.alpha;
            this.inputs = outputs.inputs;
            this.kernelType = outputs.kernelType;
            this.kernelOptions = outputs.kernelOptions;
            this.kernel = new kernel(outputs.kernelType, outputs.kernelOptions);
        } else {
            options = Object.assign({}, defaultOptions$1, options);

            const kernelFunction = new kernel(options.kernelType, options.kernelOptions);
            const K = kernelFunction.compute(inputs);
            const n = inputs.length;
            K.add(Matrix.eye(n, n).mul(options.lambda));

            this.alpha = solve(K, outputs);
            this.inputs = inputs;
            this.kernelType = options.kernelType;
            this.kernelOptions = options.kernelOptions;
            this.kernel = kernelFunction;
        }
    }

    _predict(newInputs) {
        return this.kernel.compute([newInputs], this.inputs).mmul(this.alpha)[0];
    }

    toJSON() {
        return {
            name: 'kernelRidgeRegression',
            alpha: this.alpha,
            inputs: this.inputs,
            kernelType: this.kernelType,
            kernelOptions: this.kernelOptions
        };
    }

    static load(json) {
        if (json.name !== 'kernelRidgeRegression') {
            throw new TypeError('not a KRR model');
        }
        return new KernelRidgeRegression(true, json);
    }
}

const median = array.median;

/**
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} coordinates
 * @param {Array<Array<number>>} values;
 * @param {object} [options]
 * @return {Image}
 */
function background(coordinates, values, options) {
    var model = new KernelRidgeRegression(coordinates, values, options);
    var allCoordinates = new Array(this.size);
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            allCoordinates[j * this.width + i] = [i, j];
        }
    }
    var result = model.predict(allCoordinates);
    var background = Image$1.createFrom(this);
    for (var _i = 0; _i < this.size; _i++) {
        background.data[_i] = Math.min(this.maxValue, Math.max(0, result[_i][0]));
    }
    return background;
}

/**
 * Crops the image
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.x=0] - x coordinate to place the zero of the new image
 * @param {number} [options.y=0] - y coordinate to place the zero of the new image
 * @param {number} [options.width=this.width-x] - width of the new image
 * @param {number} [options.height=this.height-y] - height of the new image
 * @return {Image} The new cropped image
 * @example
 * var cropped = image.crop({
 *   x:0,
 *   y:0
 * });
 */
function crop() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$x = options.x,
        x = _options$x === undefined ? 0 : _options$x,
        _options$y = options.y,
        y = _options$y === undefined ? 0 : _options$y,
        _options$width = options.width,
        width = _options$width === undefined ? this.width - x : _options$width,
        _options$height = options.height,
        height = _options$height === undefined ? this.height - y : _options$height;


    this.checkProcessable('max', {
        bitDepth: [8, 16]
    });

    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    if (x > this.width - 1 || y > this.height - 1) {
        throw new RangeError(`crop: origin (x:${x}, y:${y}) out of range (${this.width - 1}; ${this.height - 1})`);
    }
    if (width <= 0 || height <= 0) {
        throw new RangeError(`crop: width and height (width:${width}; height:${height}) must be positive numbers`);
    }
    if (x < 0 || y < 0) {
        throw new RangeError(`crop: x and y (x:${x}, y:${y}) must be positive numbers`);
    }
    if (width > this.width - x || height > this.height - y) {
        throw new RangeError(`crop: (x: ${x}, y:${y}, width:${width}, height:${height}) size is out of range`);
    }

    var newImage = Image$1.createFrom(this, { width, height, position: [x, y] });

    var xWidth = width * this.channels;
    var y1 = y + height;

    var ptr = 0; // pointer for new array

    var jLeft = x * this.channels;

    for (var i = y; i < y1; i++) {
        var j = i * this.width * this.channels + jLeft;
        var jL = j + xWidth;
        for (; j < jL; j++) {
            newImage.data[ptr++] = this.data[j];
        }
    }

    return newImage;
}

/**
 * Crops the image based on the alpha channel
 * This removes lines and columns where the alpha channel is lower than a threshold value.
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.threshold=this.maxValue]
 * @return {Image}
 */
function cropAlpha() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    this.checkProcessable('cropAlpha', {
        alpha: 1
    });

    var _options$threshold = options.threshold,
        threshold = _options$threshold === undefined ? this.maxValue : _options$threshold;


    var left = findLeft(this, threshold, this.components);

    if (left === -1) {
        throw new Error('Could not find new dimensions. Threshold may be too high.');
    }

    var top = findTop(this, threshold, this.components, left);
    var bottom = findBottom(this, threshold, this.components, left);
    var right = findRight(this, threshold, this.components, left, top, bottom);

    return this.crop({
        x: left,
        y: top,
        width: right - left + 1,
        height: bottom - top + 1
    });
}

function findLeft(image, threshold, channel) {
    for (var x = 0; x < image.width; x++) {
        for (var y = 0; y < image.height; y++) {
            if (image.getValueXY(x, y, channel) >= threshold) {
                return x;
            }
        }
    }
    return -1;
}

function findTop(image, threshold, channel, left) {
    for (var y = 0; y < image.height; y++) {
        for (var x = left; x < image.width; x++) {
            if (image.getValueXY(x, y, channel) >= threshold) {
                return y;
            }
        }
    }
    return -1;
}

function findBottom(image, threshold, channel, left) {
    for (var y = image.height - 1; y >= 0; y--) {
        for (var x = left; x < image.width; x++) {
            if (image.getValueXY(x, y, channel) >= threshold) {
                return y;
            }
        }
    }
    return -1;
}

function findRight(image, threshold, channel, left, top, bottom) {
    for (var x = image.width - 1; x >= left; x--) {
        for (var y = top; y <= bottom; y++) {
            if (image.getValueXY(x, y, channel) >= threshold) {
                return x;
            }
        }
    }
    return -1;
}

/**
 * Nearest neighbor scaling algorithm
 * @private
 * @param {Image} newImage
 * @param {number} newWidth
 * @param {number} newHeight
 */
function nearestNeighbor(newImage, newWidth, newHeight) {
    var wRatio = this.width / newWidth;
    var hRatio = this.height / newHeight;

    if (this.bitDepth > 1) {
        for (var i = 0; i < newWidth; i++) {
            var w = Math.floor((i + 0.5) * wRatio);
            for (var j = 0; j < newHeight; j++) {
                var h = Math.floor((j + 0.5) * hRatio);
                for (var c = 0; c < this.channels; c++) {
                    newImage.setValueXY(i, j, c, this.getValueXY(w, h, c));
                }
            }
        }
    } else {
        for (var _i = 0; _i < newWidth; _i++) {
            var _w = Math.floor((_i + 0.5) * wRatio);
            for (var _j = 0; _j < newHeight; _j++) {
                var _h = Math.floor((_j + 0.5) * hRatio);
                if (this.getBitXY(_w, _h)) {
                    newImage.setBitXY(_i, _j);
                }
            }
        }
    }
}

/**
 * @private
 * Converts a factor value to a number between 0 and 1
 * @param {string|number} value
 * @return {number}
 */
function getFactor(value) {
    if (typeof value === 'string') {
        var last = value[value.length - 1];
        value = parseFloat(value);
        if (last === '%') {
            value /= 100;
        }
    }
    return value;
}

/**
 * @private
 * We can specify a threshold as "0.4", "40%" or 123
 * @param {string|number} value
 * @param {number} maxValue
 * @return {number}
 */
function getThreshold(value, maxValue) {
    if (!maxValue) {
        throw Error('getThreshold : the maxValue should be specified');
    }
    if (typeof value === 'string') {
        var last = value[value.length - 1];
        if (last !== '%') {
            throw Error('getThreshold : if the value is a string it must finish by %');
        }
        return parseFloat(value) / 100 * maxValue;
    } else if (typeof value === 'number') {
        if (value < 1) {
            return value * maxValue;
        }
        return value;
    } else {
        throw Error('getThreshold : the value is not valid');
    }
}

function factorDimensions(factor, width, height) {
    factor = getFactor(factor);
    var newWidth = Math.round(factor * width);
    var newHeight = Math.round(factor * height);

    if (newWidth <= 0) {
        newWidth = 1;
    }
    if (newHeight <= 0) {
        newHeight = 1;
    }
    return {
        width: newWidth,
        height: newHeight
    };
}

/**
 * Rescale an image
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.width=this.width] - new width
 * @param {number} [options.height=this.height] - new height
 * @param {number} [options.factor=1] - scaling factor (applied to the new width and height values)
 * @param {string} [options.algorithm='nearestNeighbor']
 * @param {boolean} [options.preserveAspectRatio=true] - preserve width/height ratio if only one of them is defined
 * @return {Image}
 */
function scale$1() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$factor = options.factor,
        factor = _options$factor === undefined ? 1 : _options$factor,
        _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'nearestNeighbor' : _options$algorithm,
        _options$preserveAspe = options.preserveAspectRatio,
        preserveAspectRatio = _options$preserveAspe === undefined ? true : _options$preserveAspe;


    var width = options.width;
    var height = options.height;

    if (!width) {
        if (height && preserveAspectRatio) {
            width = Math.round(height * (this.width / this.height));
        } else {
            width = this.width;
        }
    }
    if (!height) {
        if (preserveAspectRatio) {
            height = Math.round(width * (this.height / this.width));
        } else {
            height = this.height;
        }
    }

    var _factorDimensions = factorDimensions(factor, width, height);

    width = _factorDimensions.width;
    height = _factorDimensions.height;


    if (width === this.width && height === this.height) {
        var _newImage = this.clone();
        _newImage.position = [0, 0];
        return _newImage;
    }

    var shiftX = Math.round((this.width - width) / 2);
    var shiftY = Math.round((this.height - height) / 2);
    var newImage = Image$1.createFrom(this, { width, height, position: [shiftX, shiftY] });

    switch (algorithm.toLowerCase()) {
        case 'nearestneighbor':
        case 'nearestneighbour':
            nearestNeighbor.call(this, newImage, width, height);
            break;
        default:
            throw new Error('Unsupported scale algorithm: ' + algorithm);
    }

    return newImage;
}

// based on https://bgrins.github.io/TinyColor/docs/tinycolor.html

/**
 * Make a copy of the current image and convert the color model to HSV
 * The source image has to be RGB !
 * @memberof Image
 * @instance
 * @return {Image} - New image in HSV color model
 * @example
 * var hsvImage = image.hsv();
 * // we can create one image per channel
 * var channels = hsvImage.split();
 */
function hsv() {
    this.checkProcessable('hsv', {
        bitDepth: [8, 16],
        alpha: [0, 1],
        colorModel: [RGB$1]
    });

    var newImage = Image$1.createFrom(this, {
        colorModel: HSV
    });

    var ptr = 0;
    var data = this.data;
    for (var i = 0; i < data.length; i += this.channels) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];

        var min = Math.min(red, green, blue);
        var max = Math.max(red, green, blue);
        var delta = max - min;
        var hue = 0;
        var saturation = max === 0 ? 0 : delta / max;
        var value = max;

        if (max !== min) {
            switch (max) {
                case red:
                    hue = (green - blue) / delta + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / delta + 2;
                    break;
                case blue:
                    hue = (red - green) / delta + 4;
                    break;
                default:
                    throw new Error('unreachable');
            }
            hue /= 6;
        }

        newImage.data[ptr++] = hue * this.maxValue;
        newImage.data[ptr++] = saturation * this.maxValue;
        newImage.data[ptr++] = value;
        if (this.alpha) {
            newImage.data[ptr++] = data[i + 3];
        }
    }

    return newImage;
}

// http://www.easyrgb.com/index.php?X=MATH&H=18#text18
// check rgbToHsl : https://bgrins.github.io/TinyColor/docs/tinycolor.html

/**
 * Make a copy of the current image and convert the color model to HSL
 * The source image has to be RGB !
 * @memberof Image
 * @instance
 * @return {Image} - New image in HSL color model
 * @example
 * var hslImage = image.hsl();
 * // we can create one image per channel
 * var channels = hslImage.split();
 */
function hsl() {
    this.checkProcessable('hsl', {
        bitDepth: [8, 16],
        alpha: [0, 1],
        colorModel: [RGB$1]
    });

    var newImage = Image$1.createFrom(this, {
        colorModel: HSL
    });

    var threshold = Math.floor(this.maxValue / 2);
    var ptr = 0;
    var data = this.data;
    for (var i = 0; i < data.length; i += this.channels) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];

        var max = Math.max(red, green, blue);
        var min = Math.min(red, green, blue);
        var hue = 0;
        var saturation = 0;
        var luminance = (max + min) / 2;
        if (max !== min) {
            var delta = max - min;
            saturation = luminance > threshold ? delta / (2 - max - min) : delta / (max + min);
            switch (max) {
                case red:
                    hue = (green - blue) / delta + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / delta + 2;
                    break;
                case blue:
                    hue = (red - green) / delta + 4;
                    break;
                default:
                    throw new Error('unreachable');
            }
            hue /= 6;
        }

        newImage.data[ptr++] = hue * this.maxValue;
        newImage.data[ptr++] = saturation * this.maxValue;
        newImage.data[ptr++] = luminance;
        if (this.alpha) {
            newImage.data[ptr++] = data[i + 3];
        }
    }

    return newImage;
}

// http://www.easyrgb.com/index.php?X=MATH&H=18#text18
// check rgbToHsl : https://bgrins.github.io/TinyColor/docs/tinycolor.html

/**
 * Make a copy of the current image and convert the color model to CMYK
 * The source image has to be RGB !
 * @memberof Image
 * @instance
 * @return {Image} - New image in CMYK color model
 * @example
 * var cmykImage = image.cmyk();
 * // we can create one image per channel
 * var channels = cmykImage.split();
 */
function cmyk() {
    this.checkProcessable('cmyk', {
        bitDepth: [8, 16],
        alpha: [0, 1],
        colorModel: [RGB$1]
    });

    var newImage = Image$1.createFrom(this, {
        components: 4,
        colorModel: CMYK$1
    });

    var ptr = 0;
    var data = this.data;
    for (var i = 0; i < data.length; i += this.channels) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];

        var black = Math.min(this.maxValue - red, this.maxValue - green, this.maxValue - blue);
        var cyan = (this.maxValue - red - black) / (1 - black / this.maxValue);
        var magenta = (this.maxValue - green - black) / (1 - black / this.maxValue);
        var yellow = (this.maxValue - blue - black) / (1 - black / this.maxValue);

        newImage.data[ptr++] = cyan;
        newImage.data[ptr++] = magenta;
        newImage.data[ptr++] = yellow;
        newImage.data[ptr++] = black;
        if (this.alpha) {
            newImage.data[ptr++] = data[i + 3];
        }
    }

    return newImage;
}

/**
 * Make a copy of the current image and convert to RGBA 8 bits
 * Those images are the one that are displayed in a canvas.
 * RGB model in 8 bits per channel and containing as well an alpha channel.
 * The source image may be:
 * * a mask (binary image)
 * * a grey image (8 or 16 bits) with or without alpha channel
 * * a color image (8 or 16 bits) with or without alpha channel in with RGB model
 * The conversion is based on {@link Image#getRGBAData}.
 * @memberof Image
 * @instance
 * @return {Image} - New image in RGB color model with alpha channel
 * @example
 * var rgbaImage = image.rgba8();
 */
function rgba8() {
    return new Image$1(this.width, this.height, this.getRGBAData(), {
        kind: 'RGBA',
        parent: this
    });
}

var methods = {
    luma709(data, i) {
        // sRGB
        // return data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        // Let's do a little trick ... in order not convert the integer to a double we do
        // the multiplication with integer to reach a total of 32768 and then shift the bits
        // of 15 to the right
        // This does a Math.floor and may lead to small (max 1) difference
        // Same result, > 10% faster on the full grey conversion
        return data[i] * 6966 + data[i + 1] * 23436 + data[i + 2] * 2366 >> 15;
    },
    luma601(data, i) {
        // NTSC
        // return this.data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        return data[i] * 9798 + data[i + 1] * 19235 + data[i + 2] * 3735 >> 15;
    },
    maximum(data, i) {
        return Math.max(data[i], data[i + 1], data[i + 2]);
    },
    minimum(data, i) {
        return Math.min(data[i], data[i + 1], data[i + 2]);
    },
    average(data, i) {
        return (data[i] + data[i + 1] + data[i + 2]) / 3 >> 0;
    },
    minmax(data, i) {
        return (Math.max(data[i], data[i + 1], data[i + 2]) + Math.min(data[i], data[i + 1], data[i + 2])) / 2;
    },
    red(data, i) {
        return data[i];
    },
    green(data, i) {
        return data[i + 1];
    },
    blue(data, i) {
        return data[i + 2];
    },
    cyan(data, i, image) {
        var black = methods.black(data, i, image);
        return (image.maxValue - data[0] - black) / (1 - black / image.maxValue) >> 0;
    },
    magenta(data, i, image) {
        var black = methods.black(data, i, image);
        return (image.maxValue - data[1] - black) / (1 - black / image.maxValue) >> 0;
    },
    yellow(data, i, image) {
        var black = methods.black(data, i, image);
        return (image.maxValue - data[2] - black) / (1 - black / image.maxValue) >> 0;
    },
    black(data, i, image) {
        return Math.min(image.maxValue - data[i], image.maxValue - data[i + 1], image.maxValue - data[i + 2]);
    },
    hue(data, i, image) {
        var min = methods.min(data, i);
        var max = methods.max(data, i);
        if (max === min) {
            return 0;
        }
        var hue = 0;
        var delta = max - min;

        switch (max) {
            case data[i]:
                hue = (data[i + 1] - data[i + 2]) / delta + (data[i + 1] < data[i + 2] ? 6 : 0);
                break;
            case data[i + 1]:
                hue = (data[i + 2] - data[i]) / delta + 2;
                break;
            case data[i + 2]:
                hue = (data[i] - data[i + 1]) / delta + 4;
                break;
            default:
                throw new Error('unreachable');
        }
        return hue / 6 * image.maxValue >> 0;
    },
    saturation(data, i, image) {
        // from HSV model
        var min = methods.min(data, i);
        var max = methods.max(data, i);
        var delta = max - min;
        return max === 0 ? 0 : delta / max * image.maxValue;
    },
    lightness(data, i) {
        var min = methods.min(data, i);
        var max = methods.max(data, i);
        return (max + min) / 2;
    }
};

Object.defineProperty(methods, 'luminosity', { enumerable: false, value: methods.lightness });
Object.defineProperty(methods, 'luminance', { enumerable: false, value: methods.lightness });
Object.defineProperty(methods, 'min', { enumerable: false, value: methods.minimum });
Object.defineProperty(methods, 'max', { enumerable: false, value: methods.maximum });
Object.defineProperty(methods, 'brightness', { enumerable: false, value: methods.maximum });

var names = Object.keys(methods);

/**
 * Converts the current image to grey scale
 * The source image has to be RGB !
 * If there is an alpha channel we need to decide what to do:
 * * keepAlpha : we will keep the alpha channel and you will get a GREY / A image
 * * mergeAlpha : we will multiply each pixel of the image by the alpha
 * @memberof Image
 * @instance
 * @param {object} options
 * @param {string} [options.algorithm='luma709'] - Algorithm to get the grey image
 * @param {boolean} [options.keepAlpha=false] - If true the RGB values are treated
 *          separately from the alpha channel and the method returns a GREYA image.
 * @param {boolean} [options.mergeAlpha=true] - If true the alpha channel will be applied on each pixel.
 *          This means that if for an 8bits RGBA image we have an alpha channel value of 0,
 *          this grey scale value will always be 0 (black pixel)
 * @param {boolean} [options.allowGrey=false] - By default only RGB images are allowed.
 *          If true grey images are also allowed and will either return a copy or
 *          apply the alpha channel depending the options
 * @return {Image} - Grey scale image (with or without alpha depending the options)
 * @example
 * var grey = image.grey();
 */
function grey() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'luma709' : _options$algorithm,
        _options$keepAlpha = options.keepAlpha,
        keepAlpha = _options$keepAlpha === undefined ? false : _options$keepAlpha,
        _options$mergeAlpha = options.mergeAlpha,
        mergeAlpha = _options$mergeAlpha === undefined ? true : _options$mergeAlpha,
        _options$allowGrey = options.allowGrey,
        allowGrey = _options$allowGrey === undefined ? false : _options$allowGrey;


    var valid = {
        bitDepth: [8, 16],
        alpha: [0, 1]
    };

    if (!allowGrey) {
        valid.colorModel = [RGB$1];
        valid.components = [3];
    }

    this.checkProcessable('grey', valid);

    if (this.components === 1) {
        algorithm = 'red'; // actually we just take the first channel if it is a grey image
    }

    keepAlpha &= this.alpha;
    mergeAlpha &= this.alpha;
    if (keepAlpha) {
        mergeAlpha = false;
    }

    var newImage = Image$1.createFrom(this, {
        components: 1,
        alpha: keepAlpha,
        colorModel: null
    });

    var method = methods[algorithm.toLowerCase()];
    if (!method) {
        throw new Error('Unsupported grey algorithm: ' + algorithm);
    }

    var ptr = 0;
    for (var i = 0; i < this.data.length; i += this.channels) {
        if (mergeAlpha) {
            newImage.data[ptr++] = method(this.data, i, this) * this.data[i + this.components] / this.maxValue;
        } else {
            newImage.data[ptr++] = method(this.data, i, this);
            if (newImage.alpha) {
                newImage.data[ptr++] = this.data[i + this.components];
            }
        }
    }

    return newImage;
}

/*
 *
 * see http://rsb.info.nih.gov/ij/developer/source/ij/process/AutoThresholder.java.html.
 * Huang: Implements Huang's fuzzy thresholding method: Huang, L-K & Wang, M-J J (1995),
 * "Image thresholding by minimizing the measure of fuzziness", Pattern Recognition 28(1): 41-51
 *
 */

function huang(histogram) {
    /* Determine the first non-zero bin */
    var firstBin = 0;
    for (var ih = 0; ih < histogram.length; ih++) {
        if (histogram[ih] !== 0) {
            firstBin = ih;
            break;
        }
    }

    /* Determine the last non-zero bin */
    var lastBin = histogram.length - 1;
    for (var _ih = histogram.length - 1; _ih >= firstBin; _ih--) {
        if (histogram[_ih] !== 0) {
            lastBin = _ih;
            break;
        }
    }

    var term = 1.0 / (lastBin - firstBin);
    var mu0 = new Array(histogram.length);
    var sumPix = 0;
    var numPix = 0;
    for (var _ih2 = firstBin; _ih2 < histogram.length; _ih2++) {
        sumPix += _ih2 * histogram[_ih2];
        numPix += histogram[_ih2];
        mu0[_ih2] = sumPix / numPix;
    }

    var mu1 = new Array(histogram.length);
    sumPix = numPix = 0;
    for (var _ih3 = lastBin; _ih3 > 0; _ih3--) {
        sumPix += _ih3 * histogram[_ih3];
        numPix += histogram[_ih3];
        mu1[_ih3 - 1] = sumPix / numPix;
    }

    /* Determine the threshold that minimizes the fuzzy entropy*/
    var threshold = -1;
    var minEnt = Number.MAX_VALUE;
    for (var it = 0; it < histogram.length; it++) {
        var ent = 0;
        var muX = void 0;
        for (var _ih4 = 0; _ih4 <= it; _ih4++) {
            /* Equation (4) in Ref. 1 */
            muX = 1 / (1 + term * Math.abs(_ih4 - mu0[it]));
            if (!(muX < 1e-06 || muX > 0.999999)) {
                /* Equation (6) & (8) in Ref. 1 */
                ent += histogram[_ih4] * (-muX * Math.log(muX) - (1 - muX) * Math.log(1 - muX));
            }
        }

        for (var _ih5 = it + 1; _ih5 < histogram.length; _ih5++) {
            /* Equation (4) in Ref. 1 */
            muX = 1 / (1 + term * Math.abs(_ih5 - mu1[it]));
            if (!(muX < 1e-06 || muX > 0.999999)) {
                /* Equation (6) & (8) in Ref. 1 */
                ent += histogram[_ih5] * (-muX * Math.log(muX) - (1 - muX) * Math.log(1 - muX));
            }
        }

        if (ent < minEnt) {
            minEnt = ent;
            threshold = it;
        }
    }
    return threshold;
}

/*
 *
 * see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
 * Intermodes: This assumes a bimodal histogram. Implements the thresholding Prewitt, JMS & Mendelsohn, ML (1966),
 * "The analysis of cell images", Annals of the NewYork Academy of Sciences 128: 1035-1053
 *
 */

function intermodes(histogram) {
    var iHisto = histogram.slice();
    var iter = 0;
    while (!bimodalTest(iHisto)) {
        //smooth with a 3 point running mean filter
        var previous = 0;
        var current = 0;
        var next = iHisto[0];
        for (var i = 0; i < histogram.length - 1; i++) {
            previous = current;
            current = next;
            next = iHisto[i + 1];
            iHisto[i] = (previous + current + next) / 3;
        }
        iHisto[histogram.length - 1] = (current + next) / 3;
        iter++;
        if (iter > 10000) {
            throw new Error('Intermodes Threshold not found after 10000 iterations');
        }
    }

    // The threshold is the mean between the two peaks.
    var tt = 0;
    for (var _i = 1; _i < histogram.length - 1; _i++) {
        if (iHisto[_i - 1] < iHisto[_i] && iHisto[_i + 1] < iHisto[_i]) {
            tt += _i;
        }
    }
    return Math.floor(tt / 2.0);
}

function bimodalTest(iHisto) {
    var b = false;
    var modes = 0;

    for (var k = 1; k < iHisto.length - 1; k++) {
        if (iHisto[k - 1] < iHisto[k] && iHisto[k + 1] < iHisto[k]) {
            modes++;
            if (modes > 2) {
                return false;
            }
        }
    }
    if (modes === 2) {
        b = true;
    }
    return b;
}

/*
 * see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
 * Isodata: Ridler, TW & Calvard, S (1978), "Picture thresholding using an iterative selection method"
 * IEEE Transactions on Systems, Man and Cybernetics 8: 630-632.
 *
 */
function isodata(histogram) {

    var l = void 0; //the average grey value of pixels with intensities < g
    var toth = void 0; //the the average grey value of pixels with intensities > g
    var totl = void 0; //the total the average grey value of pixels with intensities < g
    var h = void 0; //the average grey value of pixels with intensities > g
    var g = 0; //threshold value

    for (var i = 1; i < histogram.length; i++) {
        if (histogram[i] > 0) {
            g = i + 1;
            break;
        }
    }

    while (true) {
        l = 0;
        totl = 0;
        for (var _i = 0; _i < g; _i++) {
            totl = totl + histogram[_i];
            l = l + histogram[_i] * _i;
        }
        h = 0;
        toth = 0;
        for (var _i2 = g + 1; _i2 < histogram.length; _i2++) {
            toth += histogram[_i2];
            h += histogram[_i2] * _i2;
        }
        if (totl > 0 && toth > 0) {
            l /= totl;
            h /= toth;
            if (g === Math.round((l + h) / 2.0)) {
                break;
            }
        }
        g++;
        if (g > histogram.length - 2) {
            throw new Error('Threshold not found');
        }
    }
    return g;
}

/*
 * see http://rsb.info.nih.gov/ij/developer/source/ij/process/AutoThresholder.java.html
 * The method is present in: Implements Li's Minimum Cross Entropy thresholding method
 * This implementation is based on the iterative version (Ref. 2nd reference below) of the algorithm.
 *  1) Li, CH & Lee, CK (1993), "Minimum Cross 	Entropy Thresholding", Pattern Recognition 26(4): 61 625
 *  2) Li, CH & Tam, PKS (1998), "An Iterative 	Algorithm for Minimum Cross Entropy Thresholding",
 *     Pattern 	Recognition Letters 18(8): 771-776
 *  3) Sezgin, M & Sankur, B (2004), "Survey 	over Image Thresholding Techniques and Quantitative Performance
 *     Evaluation",Journal of Electronic Imaging 13(1): 146-165
 * @param histogram - the histogram of the image
 *        total - the number of pixels in the image
 * @returns {number} - the threshold
 */

function li(histogram, total) {

    var threshold = void 0;
    var sumBack = void 0; /* sum of the background pixels at a given threshold */
    var sumObj = void 0; /* sum of the object pixels at a given threshold */
    var numBack = void 0; /* number of background pixels at a given threshold */
    var numObj = void 0; /* number of object pixels at a given threshold */
    var oldThresh = void 0;
    var newThresh = void 0;
    var meanBack = void 0; /* mean of the background pixels at a given threshold */
    var meanObj = void 0; /* mean of the object pixels at a given threshold */
    var mean = void 0; /* mean gray-level in the image */
    var tolerance = void 0; /* threshold tolerance */
    var temp = void 0;
    tolerance = 0.5;

    /* Calculate the mean gray-level */
    mean = 0.0;
    for (var ih = 0; ih < histogram.length; ih++) {
        mean += ih * histogram[ih];
    }

    mean /= total;
    /* Initial estimate */
    newThresh = mean;

    do {
        oldThresh = newThresh;
        threshold = oldThresh + 0.5 | 0; /* range */

        /* Calculate the means of background and object pixels */
        /* Background */
        sumBack = 0;
        numBack = 0;

        for (var _ih = 0; _ih <= threshold; _ih++) {
            sumBack += _ih * histogram[_ih];
            numBack += histogram[_ih];
        }
        meanBack = numBack === 0 ? 0.0 : sumBack / numBack;

        /* Object */
        sumObj = 0;
        numObj = 0;
        for (var _ih2 = threshold + 1; _ih2 < histogram.length; _ih2++) {
            sumObj += _ih2 * histogram[_ih2];
            numObj += histogram[_ih2];
        }
        meanObj = numObj === 0 ? 0.0 : sumObj / numObj;
        temp = (meanBack - meanObj) / (Math.log(meanBack) - Math.log(meanObj));

        if (temp < -Number.EPSILON) {
            newThresh = temp - 0.5 | 0;
        } else {
            newThresh = temp + 0.5 | 0;
        }
        /*  Stop the iterations when the difference between the
         new and old threshold values is less than the tolerance */
    } while (Math.abs(newThresh - oldThresh) > tolerance);

    return threshold;
}

/*
 * see http://rsb.info.nih.gov/ij/developer/source/ij/process/AutoThresholder.java.html
 * The method is present in: Implements Kapur-Sahoo-Wong (Maximum Entropy) thresholding method:
 * Kapur, JN; Sahoo, PK & Wong, ACK (1985), "A New Method for Gray-Level Picture Thresholding Using the Entropy of the Histogram",
 * Graphical Models and Image Processing 29(3): 273-285
 * @param histogram - the histogram of the image
 *        total - the number of pixels in the image
 * @returns {number} - the threshold
 */

function maxEntropy(histogram, total) {
    var normHisto = new Array(histogram.length); // normalized histogram
    for (var ih = 0; ih < histogram.length; ih++) {
        normHisto[ih] = histogram[ih] / total;
    }

    var P1 = new Array(histogram.length); // cumulative normalized histogram
    var P2 = new Array(histogram.length);
    P1[0] = normHisto[0];
    P2[0] = 1.0 - P1[0];

    for (var _ih = 1; _ih < histogram.length; _ih++) {
        P1[_ih] = P1[_ih - 1] + normHisto[_ih];
        P2[_ih] = 1.0 - P1[_ih];
    }

    /* Determine the first non-zero bin */
    var firstBin = 0;
    for (var _ih2 = 0; _ih2 < histogram.length; _ih2++) {
        if (Math.abs(P1[_ih2]) >= Number.EPSILON) {
            firstBin = _ih2;
            break;
        }
    }

    /* Determine the last non-zero bin */
    var lastBin = histogram.length - 1;
    for (var _ih3 = histogram.length - 1; _ih3 >= firstBin; _ih3--) {
        if (Math.abs(P2[_ih3]) >= Number.EPSILON) {
            lastBin = _ih3;
            break;
        }
    }

    // Calculate the total entropy each gray-level
    // and find the threshold that maximizes it
    var threshold = -1;
    var totEnt = void 0; // total entropy
    var maxEnt = Number.MIN_VALUE; // max entropy
    var entBack = void 0; // entropy of the background pixels at a given threshold
    var entObj = void 0; // entropy of the object pixels at a given threshold

    for (var it = firstBin; it <= lastBin; it++) {
        /* Entropy of the background pixels */
        entBack = 0.0;
        for (var _ih4 = 0; _ih4 <= it; _ih4++) {
            if (histogram[_ih4] !== 0) {
                entBack -= normHisto[_ih4] / P1[it] * Math.log(normHisto[_ih4] / P1[it]);
            }
        }

        /* Entropy of the object pixels */
        entObj = 0.0;
        for (var _ih5 = it + 1; _ih5 < histogram.length; _ih5++) {
            if (histogram[_ih5] !== 0) {
                entObj -= normHisto[_ih5] / P2[it] * Math.log(normHisto[_ih5] / P2[it]);
            }
        }

        /* Total entropy */
        totEnt = entBack + entObj;

        if (maxEnt < totEnt) {
            maxEnt = totEnt;
            threshold = it;
        }
    }
    return threshold;
}

/*
 * The method is present in: Uses the 	mean of grey levels as the threshold. It is described in:
 * Glasbey, CA (1993), "An analysis of histogram-based thresholding algorithms",
 * CVGIP: Graphical Models and Image Processing 55: 532-537
 * @param histogram - the histogram of the image
 *        total - the number of pixels in the image
 * @returns {number} - the threshold
 */

function mean(histogram, total) {
    var sum = 0;
    for (var i = 0; i < histogram.length; i++) {
        sum += i * histogram[i];
    }
    return Math.floor(sum / total);
}

/*
 * see http://rsb.info.nih.gov/ij/developer/source/ij/process/AutoThresholder.java.html
 * The method is present in: An 	iterative implementation of Kittler and Illingworth's Minimum Error
 * thresholding:Kittler, J & Illingworth, J (1986), "Minimum error thresholding", Pattern Recognition 19: 41-47
 * @param histogram - the histogram of the image
 *        total - the number of pixels in the image
 * @returns {number} - the threshold
 */

function minError(histogram, total) {

    var threshold = void 0;
    var Tprev = -2;
    var mu = void 0,
        nu = void 0,
        p = void 0,
        q = void 0,
        sigma2 = void 0,
        tau2 = void 0,
        w0 = void 0,
        w1 = void 0,
        w2 = void 0,
        sqterm = void 0,
        temp = void 0;

    /* Calculate the mean gray-level */
    var mean = 0.0;
    for (var ih = 0; ih < histogram.length; ih++) {
        mean += ih * histogram[ih];
    }

    mean /= total;

    threshold = mean;

    while (threshold !== Tprev) {
        //Calculate some statistics.
        var sumA1 = sumA(histogram, threshold);
        var sumA2 = sumA(histogram, histogram.length - 1);
        var sumB1 = sumB(histogram, threshold);
        var sumB2 = sumB(histogram, histogram.length - 1);
        var sumC1 = sumC(histogram, threshold);
        var sumC2 = sumC(histogram, histogram.length - 1);

        mu = sumB1 / sumA1;
        nu = (sumB2 - sumB1) / (sumA2 - sumA1);
        p = sumA1 / sumA2;
        q = (sumA2 - sumA1) / sumA2;
        sigma2 = sumC1 / sumA1 - mu * mu;
        tau2 = (sumC2 - sumC1) / (sumA2 - sumA1) - nu * nu;

        //The terms of the quadratic equation to be solved.
        w0 = 1.0 / sigma2 - 1.0 / tau2;
        w1 = mu / sigma2 - nu / tau2;
        w2 = mu * mu / sigma2 - nu * nu / tau2 + Math.log10(sigma2 * (q * q) / (tau2 * (p * p)));

        //If the next threshold would be imaginary, return with the current one.
        sqterm = w1 * w1 - w0 * w2;
        if (sqterm < 0) {
            return threshold;
        }

        //The updated threshold is the integer part of the solution of the quadratic equation.
        Tprev = threshold;
        temp = (w1 + Math.sqrt(sqterm)) / w0;

        if (isNaN(temp)) {
            threshold = Tprev;
        } else {
            threshold = Math.floor(temp);
        }
    }
    return threshold;
}

//aux func

function sumA(y, j) {
    var x = 0;
    for (var i = 0; i <= j; i++) {
        x += y[i];
    }
    return x;
}

function sumB(y, j) {
    var x = 0;
    for (var i = 0; i <= j; i++) {
        x += i * y[i];
    }
    return x;
}

function sumC(y, j) {
    var x = 0;
    for (var i = 0; i <= j; i++) {
        x += i * i * y[i];
    }
    return x;
}

//see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// J. M. S. Prewitt and M. L. Mendelsohn, "The analysis of cell images," in
// Annals of the New York Academy of Sciences, vol. 128, pp. 1035-1053, 1966.
// ported to ImageJ plugin by G.Landini from Antti Niemisto's Matlab code (GPL)
// Original Matlab code Copyright (C) 2004 Antti Niemisto
// See http://www.cs.tut.fi/~ant/histthresh/ for an excellent slide presentation
// and the original Matlab code
function minimum(histogram) {
    if (histogram.length < 2) {
        //validate that the histogram has at least two color values
        return 0;
    }
    var iterations = 0; //number of iterations of the smoothing process
    var threshold = -1;
    var max = -1; // maximum color value with a greater number of pixels to 0
    var histogramCopy = new Array(histogram.length); //a copy of the histogram
    for (var i = 0; i < histogram.length; i++) {
        histogramCopy[i] = histogram[i];
        if (histogram[i] > 0) {
            max = i;
        }
    }
    while (!bimodalTest$1(histogramCopy)) {
        histogramCopy = smoothed(histogramCopy);
        iterations++;
        if (iterations > 10000) {
            //if they occur more than 10000 iterations it returns -1
            return threshold;
        }
    }
    threshold = minimumBetweenPeeks(histogramCopy, max);
    return threshold;
}
function smoothed(histogram) {
    //Smooth with a 3 point running mean filter
    var auHistogram = new Array(histogram.length); // a copy of the histograma for the smoothing process
    for (var i = 1; i < histogram.length - 1; i++) {
        auHistogram[i] = (histogram[i - 1] + histogram[i] + histogram[i + 1]) / 3;
    }
    auHistogram[0] = (histogram[0] + histogram[1]) / 3;
    auHistogram[histogram.length - 1] = (histogram[histogram.length - 2] + histogram[histogram.length - 1]) / 3;
    return auHistogram;
}
function minimumBetweenPeeks(histogramBimodal, max) {
    var threshold = void 0;
    for (var i = 1; i < max; i++) {
        if (histogramBimodal[i - 1] > histogramBimodal[i] && histogramBimodal[i + 1] >= histogramBimodal[i]) {
            threshold = i;
            break;
        }
    }
    return threshold;
}
function bimodalTest$1(histogram) {
    //It is responsible for determining if a histogram is bimodal
    var len = histogram.length;
    var isBimodal = false;
    var peaks = 0;
    for (var k = 1; k < len - 1; k++) {
        if (histogram[k - 1] < histogram[k] && histogram[k + 1] < histogram[k]) {
            peaks++;
            if (peaks > 2) {
                return false;
            }
        }
    }
    if (peaks === 2) {
        isBimodal = true;
    }
    return isBimodal;
}

//see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// W. Tsai, "Moment-preserving thresholding: a new approach," Computer Vision,
// Graphics, and Image Processing, vol. 29, pp. 377-393, 1985.
// Ported to ImageJ plugin by G.Landini from the the open source project FOURIER 0.8
// by M. Emre Celebi , Department of Computer Science, Louisiana State University in Shreveport
// Shreveport, LA 71115, USA
// http://sourceforge.net/projects/fourier-ipal
// http://www.lsus.edu/faculty/~ecelebi/fourier.htm
function moments(histogram, total) {
    //moments
    var m0 = 1.0;
    var m1 = 0.0;
    var m2 = 0.0;
    var m3 = 0.0;
    var sum = 0.0;
    var p0 = void 0;
    var cd = void 0,
        c0 = void 0,
        c1 = void 0,
        z0 = void 0,
        z1 = void 0; /* auxiliary variables */
    var threshold = -1;
    var histogramLength = histogram.length;
    var normalizedHistogram = new Array(histogramLength);
    for (var i = 0; i < histogramLength; i++) {
        normalizedHistogram[i] = histogram[i] / total;
    }
    /* Calculate the first, second, and third order moments */
    for (var _i = 0; _i < histogramLength; _i++) {
        m1 += _i * normalizedHistogram[_i];
        m2 += _i * _i * normalizedHistogram[_i];
        m3 += _i * _i * _i * normalizedHistogram[_i];
    }
    /*
     First 4 moments of the gray-level image should match the first 4 moments
     of the target binary image. This leads to 4 equalities whose solutions
     are given in the Appendix of Ref. 1
     */
    cd = m0 * m2 - m1 * m1; //determinant of the matriz of hankel for moments 2x2
    c0 = (-m2 * m2 + m1 * m3) / cd;
    c1 = (m0 * -m3 + m2 * m1) / cd;
    //new two gray values where z0<z1
    z0 = 0.5 * (-c1 - Math.sqrt(c1 * c1 - 4.0 * c0));
    z1 = 0.5 * (-c1 + Math.sqrt(c1 * c1 - 4.0 * c0));
    p0 = (z1 - m1) / (z1 - z0); /* Fraction of the object pixels in the target binary image (p0z0+p1z1=m1) */
    // The threshold is the gray-level closest to the p0-tile of the normalized histogram
    for (var _i2 = 0; _i2 < histogramLength; _i2++) {
        sum += normalizedHistogram[_i2];
        if (sum > p0) {
            threshold = _i2;
            break;
        }
    }
    return threshold;
}

/*
 * The method is present in: Otsu, N (1979), "A threshold selection method from gray-level histograms", IEEE Trans. Sys., Man., Cyber. 9: 62-66
 * The Otsu implementation is based on: https://en.wikipedia.org/wiki/Otsu's_method
 * @param histogram - the histogram of the image
 * @returns {number} - the threshold
 */

function otsu(histogram, total) {

    var sum = 0; //Total Intensities of the histogram
    var sumB = 0; //Total intensities in the 1-class histogram
    var wB = 0; //Total pixels in the 1-class histogram
    var wF = 0; //Total pixels in the 2-class histogram
    var mB = void 0; //Mean of 1-class intensities
    var mF = void 0; //Mean of 2-class intensities
    var max = 0.0; //Auxiliary variable to save temporarily the max variance
    var between = 0.0; //To save the current variance
    var threshold = 0.0;

    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    for (var _i = 1; _i < histogram.length; ++_i) {
        wB += histogram[_i];

        if (wB === 0) {
            continue;
        }
        wF = total - wB;
        if (wF === 0) {
            break;
        }

        sumB += _i * histogram[_i];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * (mB - mF) * (mB - mF);

        if (between >= max) {
            threshold = _i;
            max = between;
        }
    }
    return threshold;
}

// See http://imagej.nih.gov/ij/download/tools/source/ij/process/AutoThresholder.java
// W. Doyle, "Operation useful for similarity-invariant pattern recognition,"
// Journal of the Association for Computing Machinery, vol. 9,pp. 259-267, 1962.
// ported to ImageJ plugin by G.Landini from Antti Niemisto's Matlab code (GPL)
// Original Matlab code Copyright (C) 2004 Antti Niemisto
// See http://www.cs.tut.fi/~ant/histthresh/ for an excellent slide presentation
// and the original Matlab code.
function percentile(histogram) {
    var threshold = -1;
    var percentile = 0.5; // default fraction of foreground pixels
    var avec = new Array(histogram.length);

    var total = partialSum(histogram, histogram.length - 1);
    var temp = 1.0;

    for (var i = 0; i < histogram.length; i++) {
        avec[i] = Math.abs(partialSum(histogram, i) / total - percentile);
        if (avec[i] < temp) {
            temp = avec[i];
            threshold = i;
        }
    }

    return threshold;
}

function partialSum(histogram, endIndex) {
    var x = 0;
    for (var i = 0; i <= endIndex; i++) {
        x += histogram[i];
    }
    return x;
}

// see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// Kapur J.N., Sahoo P.K., and Wong A.K.C. (1985) "A New Method for
// Gray-Level Picture Thresholding Using the Entropy of the Histogram"
// Graphical Models and Image Processing, 29(3): 273-285
// M. Emre Celebi
// 06.15.2007
// Ported to ImageJ plugin by G.Landini from E Celebi's fourier_0.8 routines
function renyiEntropy(histogram, total) {
    var optThreshold = void 0; //Optimal threshold
    var firstBin = void 0; //First non-zero bin
    var lastBin = void 0; //last non-zero bin

    var normHisto = new Array(histogram.length); //normalized histogram
    var P1 = new Array(histogram.length); //acumulative normalized histogram
    var P2 = new Array(histogram.length); //acumulative normalized histogram

    //Entropy Variables
    var threshold1 = 0;
    var threshold2 = 0;
    var threshold3 = 0;
    var maxEnt1 = 0.0;
    var maxEnt2 = 0.0;
    var maxEnt3 = 0.0;
    var alpha2 = 0.5;
    var term2 = 1.0 / (1.0 - alpha2);
    var alpha3 = 2.0;
    var term3 = 1.0 / (1.0 - alpha3);

    for (var ih = 0; ih < histogram.length; ih++) {
        normHisto[ih] = histogram[ih] / total;
    }

    P1[0] = normHisto[0];
    P2[0] = 1.0 - P1[0];
    for (var _ih = 1; _ih < histogram.length; _ih++) {
        P1[_ih] = P1[_ih - 1] + normHisto[_ih];
        P2[_ih] = 1.0 - P1[_ih];
    }

    /* Determine the first non-zero bin */
    firstBin = 0;
    for (var _ih2 = 0; _ih2 < histogram.length; _ih2++) {
        if (Math.abs(P1[_ih2]) >= Number.EPSILON) {
            firstBin = _ih2;
            break;
        }
    }

    /* Determine the last non-zero bin */
    lastBin = histogram.length - 1;
    for (var _ih3 = histogram.length - 1; _ih3 >= firstBin; _ih3--) {
        if (Math.abs(P2[_ih3]) >= Number.EPSILON) {
            lastBin = _ih3;
            break;
        }
    }

    /* Maximum Entropy Thresholding - BEGIN */
    /* ALPHA = 1.0 */
    /* Calculate the total entropy each gray-level
     and find the threshold that maximizes it
     */
    for (var it = firstBin; it <= lastBin; it++) {
        /* Entropy of the background pixels */
        var entBack1 = 0.0;
        var entBack2 = 0.0;
        var entBack3 = 0.0;
        for (var _ih4 = 0; _ih4 <= it; _ih4++) {
            if (histogram[_ih4] !== 0) {
                entBack1 -= normHisto[_ih4] / P1[it] * Math.log(normHisto[_ih4] / P1[it]);
            }
            entBack2 += Math.sqrt(normHisto[_ih4] / P1[it]);
            entBack3 += normHisto[_ih4] * normHisto[_ih4] / (P1[it] * P1[it]);
        }

        /* Entropy of the object pixels */
        var entObj1 = 0.0;
        var entObj2 = 0.0;
        var entObj3 = 0.0;
        for (var _ih5 = it + 1; _ih5 < histogram.length; _ih5++) {
            if (histogram[_ih5] !== 0) {
                entObj1 -= normHisto[_ih5] / P2[it] * Math.log(normHisto[_ih5] / P2[it]);
            }
            entObj2 += Math.sqrt(normHisto[_ih5] / P2[it]);
            entObj3 += normHisto[_ih5] * normHisto[_ih5] / (P2[it] * P2[it]);
        }

        /* Total entropy */
        var totEnt1 = entBack1 + entObj1;
        var totEnt2 = term2 * (entBack2 * entObj2 > 0.0 ? Math.log(entBack2 * entObj2) : 0.0);
        var totEnt3 = term3 * (entBack3 * entObj3 > 0.0 ? Math.log(entBack3 * entObj3) : 0.0);

        if (totEnt1 > maxEnt1) {
            maxEnt1 = totEnt1;
            threshold1 = it;
        }

        if (totEnt2 > maxEnt2) {
            maxEnt2 = totEnt2;
            threshold2 = it;
        }

        if (totEnt3 > maxEnt3) {
            maxEnt3 = totEnt3;
            threshold3 = it;
        }
    }
    /* End Maximum Entropy Thresholding */

    var tStars = [threshold1, threshold2, threshold3];
    tStars.sort(asc);

    var betas = void 0;

    /* Adjust beta values */
    if (Math.abs(tStars[0] - tStars[1]) <= 5) {
        if (Math.abs(tStars[1] - tStars[2]) <= 5) {
            betas = [1, 2, 1];
        } else {
            betas = [0, 1, 3];
        }
    } else {
        if (Math.abs(tStars[1] - tStars[2]) <= 5) {
            betas = [3, 1, 0];
        } else {
            betas = [1, 2, 1];
        }
    }

    /* Determine the optimal threshold value */
    var omega = P1[tStars[2]] - P1[tStars[0]];
    optThreshold = Math.round(tStars[0] * (P1[tStars[0]] + 0.25 * omega * betas[0]) + 0.25 * tStars[1] * omega * betas[1] + tStars[2] * (P2[tStars[2]] + 0.25 * omega * betas[2]));

    return optThreshold;
}

// see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// Shanhbag A.G. (1994) "Utilization of Information Measure as a Means of
// Image Thresholding" Graphical Models and Image Processing, 56(5): 414-419
// Ported to ImageJ plugin by G.Landini from E Celebi's fourier_0.8 routines

function shanbhag(histogram, total) {
    var normHisto = new Array(histogram.length); // normalized histogram
    for (var ih = 0; ih < histogram.length; ih++) {
        normHisto[ih] = histogram[ih] / total;
    }

    var P1 = new Array(histogram.length); // cumulative normalized histogram
    var P2 = new Array(histogram.length);
    P1[0] = normHisto[0];
    P2[0] = 1.0 - P1[0];
    for (var _ih = 1; _ih < histogram.length; _ih++) {
        P1[_ih] = P1[_ih - 1] + normHisto[_ih];
        P2[_ih] = 1.0 - P1[_ih];
    }

    /* Determine the first non-zero bin */
    var firstBin = 0;
    for (var _ih2 = 0; _ih2 < histogram.length; _ih2++) {
        if (Math.abs(P1[_ih2]) >= Number.EPSILON) {
            firstBin = _ih2;
            break;
        }
    }

    /* Determine the last non-zero bin */
    var lastBin = histogram.length - 1;
    for (var _ih3 = histogram.length - 1; _ih3 >= firstBin; _ih3--) {
        if (Math.abs(P2[_ih3]) >= Number.EPSILON) {
            lastBin = _ih3;
            break;
        }
    }

    // Calculate the total entropy each gray-level
    // and find the threshold that maximizes it
    var threshold = -1;
    var minEnt = Number.MAX_VALUE; // min entropy

    var term = void 0;
    var totEnt = void 0; // total entropy
    var entBack = void 0; // entropy of the background pixels at a given threshold
    var entObj = void 0; // entropy of the object pixels at a given threshold
    for (var it = firstBin; it <= lastBin; it++) {
        /* Entropy of the background pixels */
        entBack = 0.0;
        term = 0.5 / P1[it];
        for (var _ih4 = 1; _ih4 <= it; _ih4++) {
            entBack -= normHisto[_ih4] * Math.log(1.0 - term * P1[_ih4 - 1]);
        }
        entBack *= term;

        /* Entropy of the object pixels */
        entObj = 0.0;
        term = 0.5 / P2[it];
        for (var _ih5 = it + 1; _ih5 < histogram.length; _ih5++) {
            entObj -= normHisto[_ih5] * Math.log(1.0 - term * P2[_ih5]);
        }
        entObj *= term;

        /* Total entropy */
        totEnt = Math.abs(entBack - entObj);

        if (totEnt < minEnt) {
            minEnt = totEnt;
            threshold = it;
        }
    }
    return threshold;
}

// see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// Zack, G. W., Rogers, W. E. and Latt, S. A., 1977,
// Automatic Measurement of Sister Chromatid Exchange Frequency,
// Journal of Histochemistry and Cytochemistry 25 (7), pp. 741-753
//
//  modified from Johannes Schindelin plugin
function triangle(histogram) {

    // find min and max
    var min = 0;
    var dmax = 0;
    var max = 0;
    var min2 = 0;
    for (var i = 0; i < histogram.length; i++) {
        if (histogram[i] > 0) {
            min = i;
            break;
        }
    }
    if (min > 0) {
        // line to the (p==0) point, not to histogram[min]
        min--;
    }

    // The Triangle algorithm cannot tell whether the data is skewed to one side or another.
    // This causes a problem as there are 2 possible thresholds between the max and the 2 extremes
    // of the histogram.
    // Here I propose to find out to which side of the max point the data is furthest, and use that as
    //  the other extreme.
    for (var _i = histogram.length - 1; _i > 0; _i--) {
        if (histogram[_i] > 0) {
            min2 = _i;
            break;
        }
    }
    if (min2 < histogram.length - 1) {
        // line to the (p==0) point, not to data[min]
        min2++;
    }

    for (var _i2 = 0; _i2 < histogram.length; _i2++) {
        if (histogram[_i2] > dmax) {
            max = _i2;
            dmax = histogram[_i2];
        }
    }

    // find which is the furthest side
    var inverted = false;
    if (max - min < min2 - max) {
        // reverse the histogram
        inverted = true;
        var left = 0; // index of leftmost element
        var right = histogram.length - 1; // index of rightmost element
        while (left < right) {
            // exchange the left and right elements
            var temp = histogram[left];
            histogram[left] = histogram[right];
            histogram[right] = temp;
            // move the bounds toward the center
            left++;
            right--;
        }
        min = histogram.length - 1 - min2;
        max = histogram.length - 1 - max;
    }

    if (min === max) {
        return min;
    }

    // describe line by nx * x + ny * y - d = 0
    var nx = void 0,
        ny = void 0,
        d = void 0;
    // nx is just the max frequency as the other point has freq=0
    nx = histogram[max]; //-min; // data[min]; //  lowest value bmin = (p=0)% in the image
    ny = min - max;
    d = Math.sqrt(nx * nx + ny * ny);
    nx /= d;
    ny /= d;
    d = nx * min + ny * histogram[min];

    // find split point
    var split = min;
    var splitDistance = 0;
    for (var _i3 = min + 1; _i3 <= max; _i3++) {
        var newDistance = nx * _i3 + ny * histogram[_i3] - d;
        if (newDistance > splitDistance) {
            split = _i3;
            splitDistance = newDistance;
        }
    }
    split--;

    if (inverted) {
        // The histogram might be used for something else, so let's reverse it back
        var _left = 0;
        var _right = histogram.length - 1;
        while (_left < _right) {
            var _temp = histogram[_left];
            histogram[_left] = histogram[_right];
            histogram[_right] = _temp;
            _left++;
            _right--;
        }
        return histogram.length - 1 - split;
    } else {
        return split;
    }
}

// see https://github.com/fiji/Auto_Threshold/blob/master/src/main/java/fiji/threshold/Auto_Threshold.java
// Implements Yen  thresholding method
// 1) Yen J.C., Chang F.J., and Chang S. (1995) "A New Criterion
//    for Automatic Multilevel Thresholding" IEEE Trans. on Image
//    Processing, 4(3): 370-378
// 2) Sezgin M. and Sankur B. (2004) "Survey over Image Thresholding
//    Techniques and Quantitative Performance Evaluation" Journal of
//    Electronic Imaging, 13(1): 146-165
//    http://citeseer.ist.psu.edu/sezgin04survey.html
//
// M. Emre Celebi
// 06.15.2007
// Ported to ImageJ plugin by G.Landini from E Celebi's fourier_0.8 routines

function yen(histogram, total) {
    var normHisto = new Array(histogram.length); // normalized histogram
    for (var ih = 0; ih < histogram.length; ih++) {
        normHisto[ih] = histogram[ih] / total;
    }

    var P1 = new Array(histogram.length); // cumulative normalized histogram
    P1[0] = normHisto[0];
    for (var _ih = 1; _ih < histogram.length; _ih++) {
        P1[_ih] = P1[_ih - 1] + normHisto[_ih];
    }

    var P1Sq = new Array(histogram.length);
    P1Sq[0] = normHisto[0] * normHisto[0];
    for (var _ih2 = 1; _ih2 < histogram.length; _ih2++) {
        P1Sq[_ih2] = P1Sq[_ih2 - 1] + normHisto[_ih2] * normHisto[_ih2];
    }

    var P2Sq = new Array(histogram.length);
    P2Sq[histogram.length - 1] = 0.0;
    for (var _ih3 = histogram.length - 2; _ih3 >= 0; _ih3--) {
        P2Sq[_ih3] = P2Sq[_ih3 + 1] + normHisto[_ih3 + 1] * normHisto[_ih3 + 1];
    }

    /* Find the threshold that maximizes the criterion */
    var threshold = -1;
    var maxCrit = Number.MIN_VALUE;
    var crit = void 0;
    for (var it = 0; it < histogram.length; it++) {
        crit = -1.0 * (P1Sq[it] * P2Sq[it] > 0.0 ? Math.log(P1Sq[it] * P2Sq[it]) : 0.0) + 2 * (P1[it] * (1.0 - P1[it]) > 0.0 ? Math.log(P1[it] * (1.0 - P1[it])) : 0.0);
        if (crit > maxCrit) {
            maxCrit = crit;
            threshold = it;
        }
    }
    return threshold;
}

var methods$1 = {
    huang,
    intermodes,
    isodata,
    li,
    maxentropy: maxEntropy,
    mean,
    minerror: minError,
    minimum,
    moments,
    otsu,
    percentile,
    renyientropy: renyiEntropy,
    shanbhag,
    triangle,
    yen
};

var names$1 = ['threshold'].concat(Object.keys(methods$1));

/**
 * Creation of binary mask is based on the determination of a threshold
 * You may either choose among the provided algorithm or just specify a threshold value
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {string} [options.algorithm='threshold']
 * @param {number} [options.threshold=0.5] - If the algorithm is 'threshold' specify here the value (0 to 1).
 * @param {boolean} [options.useAlpha=true] - Apply the alpha channel to determine the intensity of the pixel.
 * @param {boolean} [options.invert=false] - Invert the resulting image
 * @return {Image} - Binary image containing the mask
 */
function mask() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'threshold' : _options$algorithm,
        _options$threshold = options.threshold,
        threshold = _options$threshold === undefined ? 0.5 : _options$threshold,
        _options$useAlpha = options.useAlpha,
        useAlpha = _options$useAlpha === undefined ? true : _options$useAlpha,
        _options$invert = options.invert,
        invert = _options$invert === undefined ? false : _options$invert;


    this.checkProcessable('mask', {
        components: 1,
        bitDepth: [8, 16]
    });

    if (algorithm === 'threshold') {
        threshold = getThreshold(threshold, this.maxValue);
    } else {
        var method = methods$1[algorithm.toLowerCase()];
        if (method) {
            var histogram = this.getHistogram();
            threshold = method(histogram, this.size);
        } else {
            throw new Error('mask transform unknown algorithm: ' + algorithm);
        }
    }

    var newImage = new Image$1(this.width, this.height, {
        kind: 'BINARY',
        parent: this
    });

    var ptr = 0;
    if (this.alpha && useAlpha) {
        for (var i = 0; i < this.data.length; i += this.channels) {
            var value = this.data[i] + (this.maxValue - this.data[i]) * (this.maxValue - this.data[i + 1]) / this.maxValue;
            if (invert && value <= threshold || !invert && value >= threshold) {
                newImage.setBit(ptr);
            }
            ptr++;
        }
    } else {
        for (var _i = 0; _i < this.data.length; _i += this.channels) {
            if (invert && this.data[_i] <= threshold || !invert && this.data[_i] >= threshold) {
                newImage.setBit(ptr);
            }
            ptr++;
        }
    }

    return newImage;
}

/**
 * Make a copy of the current image
 * @memberof Image
 * @instance
 * @param {Image} fromImage
 * @param {Image} toImage
 * @param {number} x
 * @param {number} y
 */
function copyImage(fromImage, toImage, x, y) {
    var fromWidth = fromImage.width;
    var fromHeight = fromImage.height;
    var toWidth = toImage.width;
    var channels = fromImage.channels;
    for (var i = 0; i < fromWidth; i++) {
        for (var j = 0; j < fromHeight; j++) {
            for (var k = 0; k < channels; k++) {
                var source = (j * fromWidth + i) * channels + k;
                var target = ((y + j) * toWidth + x + i) * channels + k;
                toImage.data[target] = fromImage.data[source];
            }
        }
    }
}

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.size=0]
 * @param {string} [options.algorithm='copy']
 * @param {array<number>} [options.color]
 * @return {Image}
 */
function pad() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$size = options.size,
        size = _options$size === undefined ? 0 : _options$size,
        _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'copy' : _options$algorithm,
        color = options.color;


    this.checkProcessable('pad', {
        bitDepth: [8, 16]
    });

    if (algorithm === 'set') {
        if (color.length !== this.channels) {
            throw new Error('pad: the color array must have the same length as the number of channels. Here: ' + this.channels);
        }
        for (var i = 0; i < color.length; i++) {
            if (color[i] === 0) {
                color[i] = 0.001;
            }
        }
    } else {
        color = index$29(this.channels, null);
    }

    if (!Array.isArray(size)) {
        size = [size, size];
    }

    var newWidth = this.width + size[0] * 2;
    var newHeight = this.height + size[1] * 2;
    var channels = this.channels;

    var newImage = Image$1.createFrom(this, { width: newWidth, height: newHeight });

    copyImage(this, newImage, size[0], size[1]);

    for (var _i = size[0]; _i < newWidth - size[0]; _i++) {
        for (var k = 0; k < channels; k++) {
            var value = color[k] || newImage.data[(size[1] * newWidth + _i) * channels + k];
            for (var j = 0; j < size[1]; j++) {
                newImage.data[(j * newWidth + _i) * channels + k] = value;
            }
            value = color[k] || newImage.data[((newHeight - size[1] - 1) * newWidth + _i) * channels + k];
            for (var _j = newHeight - size[1]; _j < newHeight; _j++) {
                newImage.data[(_j * newWidth + _i) * channels + k] = value;
            }
        }
    }

    for (var _j2 = 0; _j2 < newHeight; _j2++) {
        for (var _k = 0; _k < channels; _k++) {
            var _value = color[_k] || newImage.data[(_j2 * newWidth + size[0]) * channels + _k];
            for (var _i2 = 0; _i2 < size[0]; _i2++) {
                newImage.data[(_j2 * newWidth + _i2) * channels + _k] = _value;
            }
            _value = color[_k] || newImage.data[(_j2 * newWidth + newWidth - size[0] - 1) * channels + _k];
            for (var _i3 = newWidth - size[0]; _i3 < newWidth; _i3++) {
                newImage.data[(_j2 * newWidth + _i3) * channels + _k] = _value;
            }
        }
    }

    return newImage;
}

/**
 * Change the image color depth.
 * The color depth is the number of bits that is assigned to each point of a channel.
 * For normal images it is 8 bits meaning the value is between 0 and 255.
 * Currently only conversion from 8 to 16 bits and 16 to 8 bits is allowed.
 * @memberof Image
 * @instance
 * @param {number} [newColorDepth=8]
 * @return {Image} The new image
 * @example
 * var newImage = image.colorDepth({
 *   newColorDepth:8
 * });
 */
function colorDepth() {
    var newColorDepth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 8;


    this.checkProcessable('colorDepth', {
        bitDepth: [8, 16]
    });

    if (![8, 16].includes(newColorDepth)) {
        throw Error('You need to specify the new colorDepth as 8 or 16');
    }

    if (this.bitDepth === newColorDepth) {
        return this.clone();
    }

    var newImage = Image$1.createFrom(this, { bitDepth: newColorDepth });

    if (newColorDepth === 8) {
        for (var i = 0; i < this.data.length; i++) {
            newImage.data[i] = this.data[i] >> 8;
        }
    } else {
        for (var _i = 0; _i < this.data.length; _i++) {
            newImage.data[_i] = this.data[_i] << 8 | this.data[_i];
        }
    }

    return newImage;
}

//http://homepages.inf.ed.ac.uk/rbf/HIPR2/rotate.htm
//http://www.cyut.edu.tw/~yltang/program/Rotate1.java
function rotateFree(degrees) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$interpolatio = options.interpolation,
        interpolation = _options$interpolatio === undefined ? 'none' : _options$interpolatio,
        _options$width = options.width,
        width = _options$width === undefined ? this.width : _options$width,
        _options$height = options.height,
        height = _options$height === undefined ? this.height : _options$height;


    var radians = degrees * Math.PI / 180;
    var newWidth = Math.floor(Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)));
    var newHeight = Math.floor(Math.abs(height * Math.cos(radians)) + Math.abs(width * Math.sin(radians)));
    var newImageRotated = Image$1.createFrom(this, { width: newWidth, height: newHeight });
    var cos = Math.cos(-radians);
    var sin = Math.sin(-radians);

    var x0 = newWidth / 2;
    var y0 = newHeight / 2;
    if (newWidth % 2 === 0) {
        x0 = x0 - 0.5;
        if (newHeight % 2 === 0) {
            y0 = y0 - 0.5;
        } else {
            y0 = Math.floor(y0);
        }
    } else {
        x0 = Math.floor(x0);
        if (newHeight % 2 === 0) {
            y0 = y0 - 0.5;
        } else {
            y0 = Math.floor(y0);
        }
    }

    var incrementX = Math.floor(width / 2 - x0);
    var incrementY = Math.floor(height / 2 - y0);

    if (interpolation === 'bilinear') {
        var stride = this.width * this.channels;
        for (var i = 0; i < newWidth; i += 1) {
            for (var j = 0; j < newHeight; j += 1) {
                var x = (i - x0) * cos - (j - y0) * sin + x0 + incrementX;
                var y = (j - y0) * cos + (i - x0) * sin + y0 + incrementY;
                var x1 = x | 0;
                var y1 = y | 0;
                var xDiff = x - x1;
                var yDiff = y - y1;
                for (var c = 0; c < this.channels; c++) {
                    if (x < 0 || x >= width || y < 0 || y >= height) {
                        if (this.alpha) {
                            newImageRotated.setValueXY(i, j, c, this.alpha);
                        } else {
                            newImageRotated.setValueXY(i, j, c, this.maxValue);
                        }
                    } else {
                        var index = (y1 * this.width + x1) * this.channels + c;

                        var A = this.data[index];
                        var B = this.data[index + this.channels];
                        var C = this.data[index + stride];
                        var D = this.data[index + stride + this.channels];

                        var result = A + xDiff * (B - A) + yDiff * (C - A) + xDiff * yDiff * (A - B - C + D) | 0;

                        newImageRotated.setValueXY(i, j, c, result);
                    }
                }
            }
        }
    } else {
        for (var _i = 0; _i < newWidth; _i += 1) {
            for (var _j = 0; _j < newHeight; _j += 1) {
                for (var _c = 0; _c < this.channels; _c++) {
                    var _x2 = Math.round((_i - x0) * cos - (_j - y0) * sin + x0) + incrementX;
                    var _y = Math.round((_j - y0) * cos + (_i - x0) * sin + y0) + incrementY;

                    if (_x2 < 0 || _x2 >= width || _y < 0 || _y >= height) {
                        if (this.alpha) {
                            newImageRotated.setValueXY(_i, _j, _c, this.alpha);
                        } else {
                            newImageRotated.setValueXY(_i, _j, _c, this.maxValue);
                        }
                    } else {
                        newImageRotated.setValueXY(_i, _j, _c, this.getValueXY(_x2, _y, _c));
                    }
                }
            }
        }
    }

    return newImageRotated;
}

/**
 * Rotates an image
 * @memberof Image
 * @instance
 * @param {number} angle - angle of the rotation in degrees
 * @param {object} [options]
 * @return {Image} The new rotated image
 */
function rotate(angle, options) {
    if (typeof angle !== 'number') {
        throw new TypeError('angle must be a number');
    }

    if (angle < 0) {
        angle = Math.ceil(-angle / 360) * 360 + angle;
    }

    switch (angle % 360) {
        case 0:
            return this.clone();
        case 90:
            return rotateRight.call(this);
        case 180:
            return rotate180.call(this);
        case 270:
            return rotateLeft.call(this);
        default:
            return rotateFree.call(this, angle, options);
    }
}

/**
 * Rotates an image counter-clockwise
 * @memberof Image
 * @instance
 * @return {Image} The new rotated image
 */
function rotateLeft() {
    var newImage = Image$1.createFrom(this, { width: this.height, height: this.width });
    var newMaxHeight = newImage.height - 1;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            for (var k = 0; k < this.channels; k++) {
                newImage.setValueXY(i, newMaxHeight - j, k, this.getValueXY(j, i, k));
            }
        }
    }
    return newImage;
}

/**
 * Rotates an image clockwise
 * @memberof Image
 * @instance
 * @return {Image} The new rotated image
 */

function rotateRight() {
    var newImage = Image$1.createFrom(this, { width: this.height, height: this.width });
    var newMaxWidth = newImage.width - 1;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            for (var k = 0; k < this.channels; k++) {
                newImage.setValueXY(newMaxWidth - i, j, k, this.getValueXY(j, i, k));
            }
        }
    }
    return newImage;
}

function rotate180() {
    var newImage = Image$1.createFrom(this);
    var newMaxWidth = newImage.width - 1;
    var newMaxHeight = newImage.height - 1;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            for (var k = 0; k < this.channels; k++) {
                newImage.setValueXY(newMaxWidth - j, newMaxHeight - i, k, this.getValueXY(j, i, k));
            }
        }
    }
    return newImage;
}

/**
 * This method will change the border
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.size=0]
 * @param {string} [options.algorithm='copy']
 * @param {number[]} [options.color]
 * @return {this}
 */
function setBorder() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$size = options.size,
        size = _options$size === undefined ? 0 : _options$size,
        _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'copy' : _options$algorithm,
        color = options.color;


    this.checkProcessable('setBorder', {
        bitDepth: [8, 16, 32, 64]
    });

    if (algorithm === 'set') {
        if (color.length !== this.channels) {
            throw new Error('setBorder: the color array must have the same length as the number of channels. Here: ' + this.channels);
        }
        for (var i = 0; i < color.length; i++) {
            if (color[i] === 0) {
                color[i] = 0.001;
            }
        }
    } else {
        color = index$29(this.channels, null);
    }

    if (!Array.isArray(size)) {
        size = [size, size];
    }

    var leftRightSize = size[0];
    var topBottomSize = size[1];
    var channels = this.channels;

    for (var _i = leftRightSize; _i < this.width - leftRightSize; _i++) {
        for (var k = 0; k < channels; k++) {
            var value = color[k] || this.data[(_i + this.width * topBottomSize) * channels + k];
            for (var j = 0; j < topBottomSize; j++) {
                this.data[(j * this.width + _i) * channels + k] = value;
            }
            value = color[k] || this.data[(_i + this.width * (this.height - topBottomSize - 1)) * channels + k];
            for (var _j = this.height - topBottomSize; _j < this.height; _j++) {
                this.data[(_j * this.width + _i) * channels + k] = value;
            }
        }
    }

    for (var _j2 = 0; _j2 < this.height; _j2++) {
        for (var _k = 0; _k < channels; _k++) {
            var _value = color[_k] || this.data[(_j2 * this.width + leftRightSize) * channels + _k];
            for (var _i2 = 0; _i2 < leftRightSize; _i2++) {
                this.data[(_j2 * this.width + _i2) * channels + _k] = _value;
            }
            _value = color[_k] || this.data[(_j2 * this.width + this.width - leftRightSize - 1) * channels + _k];
            for (var _i3 = this.width - leftRightSize; _i3 < this.width; _i3++) {
                this.data[(_j2 * this.width + _i3) * channels + _k] = _value;
            }
        }
    }

    return this;
}

// TODO this code seems buggy if it is not 0,0
/**
 * We will try to move a set of images in order to get only the best common part of them.
 * In a stack, we compare 2 consecutive images or directly to a parent.
 * Ignoring border may be dangerous ! If there is a shape on the side of the image there will be a
 * continuous shift if you ignore border. By default it is better to leave it to 0,0
 * Now if the background is not black there will also be no way to shift ...
 * It may therefore be much better to make a background correction before trying to match and crop.
 * @memberof Stack
 * @instance
 * @param {object} [options]
 * @param {string} [options.algorithm='matchToPrevious'] - matchToPrevious or matchToFirst
 * @param {number[]} [options.ignoreBorder=[0, 0]]
 * @return {Stack}
 */
function matchAndCrop() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'matchToPrevious' : _options$algorithm,
        _options$ignoreBorder = options.ignoreBorder,
        ignoreBorder = _options$ignoreBorder === undefined ? [0, 0] : _options$ignoreBorder;


    this.checkProcessable('matchAndCrop', {
        bitDepth: [8, 16]
    });

    var matchToPrevious = algorithm === 'matchToPrevious';

    var parent = this[0];
    var results = [];
    results[0] = {
        position: [0, 0],
        image: this[0]
    };

    var relativePosition = [0, 0];

    // we calculate the best relative position to the parent image
    for (var i = 1; i < this.length; i++) {

        var position = parent.getBestMatch(this[i], { border: ignoreBorder });

        results[i] = {
            position: [position[0] + relativePosition[0], position[1] + relativePosition[1]],
            image: this[i]
        };
        if (matchToPrevious) {
            relativePosition[0] += position[0];
            relativePosition[1] += position[1];
            parent = this[i];
        }
    }
    // now we can calculate the cropping that we need to do

    var leftShift = 0;
    var rightShift = 0;
    var topShift = 0;
    var bottomShift = 0;

    for (var _i = 0; _i < results.length; _i++) {
        var result = results[_i];
        if (result.position[0] > leftShift) {
            leftShift = result.position[0];
        }
        if (result.position[0] < rightShift) {
            rightShift = result.position[0];
        }
        if (result.position[1] > topShift) {
            topShift = result.position[1];
        }
        if (result.position[1] < bottomShift) {
            bottomShift = result.position[1];
        }
    }
    rightShift = 0 - rightShift;
    bottomShift = 0 - bottomShift;

    for (var _i2 = 0; _i2 < results.length; _i2++) {
        var _result = results[_i2];

        _result.crop = _result.image.crop({
            x: leftShift - _result.position[0],
            y: topShift - _result.position[1],
            width: parent.width - rightShift - leftShift,
            height: parent.height - bottomShift - topShift
        });
    }

    // finally we crop and create a new array of images
    var newImages = [];
    for (var _i3 = 0; _i3 < results.length; _i3++) {
        newImages[_i3] = results[_i3].crop;
    }

    return new Stack(newImages);
}

/**
 * @memberof Stack
 * @instance
 * @return {number[]}
 */
function min() {
    this.checkProcessable('min', {
        bitDepth: [8, 16]
    });

    var min = this[0].min;
    for (var i = 1; i < this.length; i++) {
        for (var j = 0; j < min.length; j++) {
            min[j] = Math.min(min[j], this[i].min[j]);
        }
    }
    return min;
}

/**
 * @memberof Stack
 * @instance
 * @return {number[]}
 */
function max() {

    this.checkProcessable('min', {
        bitDepth: [8, 16]
    });

    var max = this[0].max;
    for (var i = 1; i < this.length; i++) {
        for (var j = 0; j < max.length; j++) {
            max[j] = Math.max(max[j], this[i].max[j]);
        }
    }
    return max;
}

/**
 * Returns the median of an histogram
 * @param {number[]} histogram
 * @return {number}
 * @private
 */
function median$2(histogram) {
    var total = histogram.reduce((sum, x) => sum + x);

    if (total === 0) {
        throw new Error('unreachable');
    }

    var position = 0;
    var currentTotal = 0;
    var middle = total / 2;
    var previous = void 0;

    while (true) {
        if (histogram[position] > 0) {
            if (previous !== undefined) {
                return (previous + position) / 2;
            }
            currentTotal += histogram[position];
            if (currentTotal > middle) {
                return position;
            } else if (currentTotal === middle) {
                previous = position;
            }
        }
        position++;
    }
}

/**
 * Retuns the mean of an histogram
 * @param {number[]} histogram
 * @return {number}
 * @private
 */
function mean$1(histogram) {
    var total = 0;
    var sum = 0;

    for (var i = 0; i < histogram.length; i++) {
        total += histogram[i];
        sum += histogram[i] * i;
    }

    if (total === 0) {
        return 0;
    }

    return sum / total;
}

/**
 * @memberof Stack
 * @instance
 * @return {number[]}
 */
function median$1() {

    this.checkProcessable('median', {
        bitDepth: [8, 16]
    });

    var histograms = this.getHistograms({ maxSlots: this[0].maxValue + 1 });
    var result = new Array(histograms.length);
    for (var c = 0; c < histograms.length; c++) {
        var histogram = histograms[c];
        result[c] = median$2(histogram);
    }
    return result;
}

/**
 * @memberof Stack
 * @instance
 * @param {object} [options]
 * @return {number[]}
 */
function histogram(options) {
    this.checkProcessable('min', {
        bitDepth: [8, 16]
    });

    var histogram = this[0].getHistogram(options);
    for (var i = 1; i < this.length; i++) {
        var secondHistogram = this[i].getHistogram(options);
        for (var j = 0; j < histogram.length; j++) {
            histogram[j] += secondHistogram[j];
        }
    }
    return histogram;
}

/**
 * @memberof Stack
 * @instance
 * @param {object} [options]
 * @return {Array<Array<number>>}
 */
function histograms(options) {
    this.checkProcessable('min', {
        bitDepth: [8, 16]
    });

    var histograms = this[0].getHistograms(options);
    var histogramLength = histograms[0].length;
    for (var i = 1; i < this.length; i++) {
        var secondHistograms = this[i].getHistograms(options);
        for (var c = 0; c < histograms.length; c++) {
            for (var j = 0; j < histogramLength; j++) {
                histograms[c][j] += secondHistograms[c][j];
            }
        }
    }
    return histograms;
}

/**
 * @memberof Stack
 * @instance
 * @return {Image}
 */
function average() {
    this.checkProcessable('average', {
        bitDepth: [8, 16]
    });

    var data = new Uint32Array(this[0].data.length);
    for (var i = 0; i < this.length; i++) {
        var current = this[i];
        for (var j = 0; j < this[0].data.length; j++) {
            data[j] += current.data[j];
        }
    }

    var image = Image$1.createFrom(this[0]);
    var newData = image.data;

    for (var _i = 0; _i < this[0].data.length; _i++) {
        newData[_i] = data[_i] / this.length;
    }

    return image;
}

function extend$2(Stack) {
    // let inPlace = {inPlace: true};
    Stack.extendMethod('matchAndCrop', matchAndCrop);

    Stack.extendMethod('getMin', min);
    Stack.extendMethod('getMax', max);
    Stack.extendMethod('getMedian', median$1);
    Stack.extendMethod('getHistogram', histogram);
    Stack.extendMethod('getHistograms', histograms);

    Stack.extendMethod('getAverage', average);
}

var computedPropertyDescriptor$1 = {
    configurable: true,
    enumerable: false,
    get: undefined
};

/**
 * Class representing stack of images
 * @class Stack
 */
class Stack extends Array {
    constructor(images) {
        if (Array.isArray(images)) {
            super(images.length);
            for (var i = 0; i < images.length; i++) {
                this[i] = images[i];
            }
        } else if (typeof images === 'number') {
            super(images);
        } else {
            super();
        }
        this.computed = null;
    }

    static load(urls) {
        return Promise.all(urls.map(Image$1.load)).then(images => new Stack(images));
    }

    static extendMethod(name, method) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var _options$inPlace = options.inPlace,
            inPlace = _options$inPlace === undefined ? false : _options$inPlace,
            _options$returnThis = options.returnThis,
            returnThis = _options$returnThis === undefined ? true : _options$returnThis,
            _options$partialArgs = options.partialArgs,
            partialArgs = _options$partialArgs === undefined ? [] : _options$partialArgs;


        if (inPlace) {
            Stack.prototype[name] = function () {
                // remove computed properties
                this.computed = null;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var result = method.apply(this, [...partialArgs, ...args]);
                if (returnThis) {
                    return this;
                }
                return result;
            };
        } else {
            Stack.prototype[name] = function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                return method.apply(this, [...partialArgs, ...args]);
            };
        }
        return Stack;
    }

    static extendProperty(name, method) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var _options$partialArgs2 = options.partialArgs,
            partialArgs = _options$partialArgs2 === undefined ? [] : _options$partialArgs2;


        computedPropertyDescriptor$1.get = function () {
            if (this.computed === null) {
                this.computed = {};
            } else if (index$11(name, this.computed)) {
                return this.computed[name];
            }
            var result = method.apply(this, partialArgs);
            this.computed[name] = result;
            return result;
        };
        Object.defineProperty(Stack.prototype, name, computedPropertyDescriptor$1);
        return Stack;
    }

    /**
     * Check if a process can be applied on the stack
     * @param {string} processName
     * @param {object} [options]
     * @private
     */
    checkProcessable(processName) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (typeof processName !== 'string') {
            throw new TypeError('checkProcessable requires as first parameter the processName (a string)');
        }
        if (this.size === 0) {
            throw new TypeError('The process: ' + processName + ' can not be applied on an empty stack');
        }
        this[0].checkProcessable(processName, options);
        for (var i = 1; i < this.length; i++) {
            if ((options.sameSize === undefined || options.sameSize) && this[0].width !== this[i].width) {
                throw new TypeError('The process: ' + processName + ' can not be applied if width is not identical in all images');
            }
            if ((options.sameSize === undefined || options.sameSize) && this[0].height !== this[i].height) {
                throw new TypeError('The process: ' + processName + ' can not be applied if height is not identical in all images');
            }
            if ((options.sameAlpha === undefined || options.sameAlpha) && this[0].alpha !== this[i].alpha) {
                throw new TypeError('The process: ' + processName + ' can not be applied if alpha is not identical in all images');
            }
            if ((options.sameBitDepth === undefined || options.sameBitDepth) && this[0].bitDepth !== this[i].bitDepth) {
                throw new TypeError('The process: ' + processName + ' can not be applied if bitDepth is not identical in all images');
            }
            if ((options.sameColorModel === undefined || options.sameColorModel) && this[0].colorModel !== this[i].colorModel) {
                throw new TypeError('The process: ' + processName + ' can not be applied if colorModel is not identical in all images');
            }
            if ((options.sameNumberChannels === undefined || options.sameNumberChannels) && this[0].channels !== this[i].channels) {
                throw new TypeError('The process: ' + processName + ' can not be applied if channels is not identical in all images');
            }
        }
    }
}

if (!Array[Symbol.species]) {
    // support old engines
    Stack.prototype.map = function (cb, thisArg) {
        if (typeof cb !== 'function') {
            throw new TypeError(cb + ' is not a function');
        }
        var newStack = new Stack(this.length);
        for (var i = 0; i < this.length; i++) {
            newStack[i] = cb.call(thisArg, this[i], i, this);
        }
        return newStack;
    };
}

extend$2(Stack);

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {boolean} [options.preserveAlpha=true]
 * @return {Stack}
 */
function split() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$preserveAlph = options.preserveAlpha,
        preserveAlpha = _options$preserveAlph === undefined ? true : _options$preserveAlph;


    this.checkProcessable('split', {
        bitDepth: [8, 16]
    });

    // split will always return a stack of images
    if (this.components === 1) {
        return new Stack([this.clone()]);
    }

    var images = new Stack();

    var data = this.data;
    if (this.alpha && preserveAlpha) {
        for (var i = 0; i < this.components; i++) {
            var newImage = Image$1.createFrom(this, {
                components: 1,
                alpha: true,
                colorModel: null
            });
            var ptr = 0;
            for (var j = 0; j < data.length; j += this.channels) {
                newImage.data[ptr++] = data[j + i];
                newImage.data[ptr++] = data[j + this.components];
            }
            images.push(newImage);
        }
    } else {
        for (var _i = 0; _i < this.channels; _i++) {
            var _newImage = Image$1.createFrom(this, {
                components: 1,
                alpha: false,
                colorModel: null
            });
            var _ptr = 0;
            for (var _j = 0; _j < data.length; _j += this.channels) {
                _newImage.data[_ptr++] = data[_j + _i];
            }
            images.push(_newImage);
        }
    }

    return images;
}

/**
 * Create a grey image based on the selected channel
 * @memberof Image
 * @instance
 * @param {number|string} channel
 * @param {object} [options]
 * @param {boolean} [options.keepAlpha]
 * @param {boolean} [options.mergeAlpha]
 * @return {Image} A grey image with the extracted channel
 */
function getChannel(channel) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$keepAlpha = options.keepAlpha,
        keepAlpha = _options$keepAlpha === undefined ? false : _options$keepAlpha,
        _options$mergeAlpha = options.mergeAlpha,
        mergeAlpha = _options$mergeAlpha === undefined ? false : _options$mergeAlpha;


    keepAlpha &= this.alpha;
    mergeAlpha &= this.alpha;

    this.checkProcessable('getChannel', {
        bitDepth: [8, 16]
    });

    channel = validateChannel(this, channel);

    var newImage = Image$1.createFrom(this, {
        components: 1,
        alpha: keepAlpha,
        colorModel: null
    });
    var ptr = 0;
    for (var j = 0; j < this.data.length; j += this.channels) {
        if (mergeAlpha) {
            newImage.data[ptr++] = this.data[j + channel] * this.data[j + this.components] / this.maxValue;
        } else {
            newImage.data[ptr++] = this.data[j + channel];
            if (keepAlpha) {
                newImage.data[ptr++] = this.data[j + this.components];
            }
        }
    }

    return newImage;
}

/**
 * Create a new grey Image by combining the channels of the current image.
 * @memberof Image
 * @instance
 * @param {function} method
 * @param {object} [options]
 * @param {boolean} [options.mergeAlpha=false]
 * @param {boolean} [options.keepAlpha=false]
 * @return {Image}
 */
function combineChannels() {
    var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultCombineMethod;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$mergeAlpha = options.mergeAlpha,
        mergeAlpha = _options$mergeAlpha === undefined ? false : _options$mergeAlpha,
        _options$keepAlpha = options.keepAlpha,
        keepAlpha = _options$keepAlpha === undefined ? false : _options$keepAlpha;


    mergeAlpha &= this.alpha;
    keepAlpha &= this.alpha;

    this.checkProcessable('combineChannels', {
        bitDepth: [8, 16]
    });

    var newImage = Image$1.createFrom(this, {
        components: 1,
        alpha: keepAlpha,
        colorModel: null
    });

    var ptr = 0;
    for (var i = 0; i < this.size; i++) {
        // TODO quite slow because we create a new pixel each time
        var value = method(this.getPixel(i));
        if (mergeAlpha) {
            newImage.data[ptr++] = value * this.data[i * this.channels + this.components] / this.maxValue;
        } else {
            newImage.data[ptr++] = value;
            if (keepAlpha) {
                newImage.data[ptr++] = this.data[i * this.channels + this.components];
            }
        }
    }

    return newImage;
}

function defaultCombineMethod(pixel) {
    return (pixel[0] + pixel[1] + pixel[2]) / 3;
}

/**
 * @memberof Image
 * @instance
 * @param {*} channel
 * @param {Image} image
 *
 * @return {this}
 */
function setChannel(channel, image) {
    this.checkProcessable('setChannel', {
        bitDepth: [8, 16]
    });

    image.checkProcessable('setChannel (image parameter check)', {
        bitDepth: [this.bitDepth],
        alpha: [0],
        components: [1]
    });

    if (image.width !== this.width || image.height !== this.height) {
        throw new Error('Images must have exactly the same width and height');
    }

    channel = validateChannel(this, channel);

    var ptr = channel;
    for (var i = 0; i < image.data.length; i++) {
        this.data[ptr] = image.data[i];
        ptr += this.channels;
    }

    return this;
}

/**
 * Try to match the current pictures with another one. If normalize we normalize separately the 2 images.
 * @memberof Image
 * @instance
 * @param {Image} image - Other image
 * @param {object} [options]
 * @return {number[]|number}
 */
function getSimilarity(image) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$shift = options.shift,
        shift = _options$shift === undefined ? [0, 0] : _options$shift,
        average = options.average,
        channels = options.channels,
        defaultAlpha = options.defaultAlpha,
        normalize = options.normalize,
        _options$border = options.border,
        border = _options$border === undefined ? [0, 0] : _options$border;


    this.checkProcessable('getSimilarity', {
        bitDepth: [8, 16]
    });

    if (!Array.isArray(border)) {
        border = [border, border];
    }
    channels = validateArrayOfChannels(this, { channels: channels, defaultAlpha: defaultAlpha });

    if (this.bitDepth !== image.bitDepth) {
        throw new Error('Both images must have the same bitDepth');
    }
    if (this.channels !== image.channels) {
        throw new Error('Both images must have the same number of channels');
    }
    if (this.colorModel !== image.colorModel) {
        throw new Error('Both images must have the same colorModel');
    }

    if (typeof average === 'undefined') {
        average = true;
    }

    // we allow a shift
    // we need to find the minX, maxX, minY, maxY
    var minX = Math.max(border[0], -shift[0]);
    var maxX = Math.min(this.width - border[0], this.width - shift[0]);
    var minY = Math.max(border[1], -shift[1]);
    var maxY = Math.min(this.height - border[1], this.height - shift[1]);

    var results = index$29(channels.length, 0);
    for (var i = 0; i < channels.length; i++) {
        var c = channels[i];
        var sumThis = normalize ? this.sum[c] : Math.max(this.sum[c], image.sum[c]);
        var sumImage = normalize ? image.sum[c] : Math.max(this.sum[c], image.sum[c]);

        if (sumThis !== 0 && sumImage !== 0) {
            for (var x = minX; x < maxX; x++) {
                for (var y = minY; y < maxY; y++) {
                    var indexThis = x * this.multiplierX + y * this.multiplierY + c;
                    var indexImage = indexThis + shift[0] * this.multiplierX + shift[1] * this.multiplierY;
                    results[i] += Math.min(this.data[indexThis] / sumThis, image.data[indexImage] / sumImage);
                }
            }
        }
    }

    if (average) {
        return results.reduce((sum, x) => sum + x) / results.length;
    }
    return results;
}

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number[]} [options.sampling=[10, 10]]
 * @param {boolean} [options.painted=false]
 * @param {Image} [options.mask]
 * @return {object}
 */
function getPixelsGrid() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$sampling = options.sampling,
        sampling = _options$sampling === undefined ? [10, 10] : _options$sampling,
        _options$painted = options.painted,
        painted = _options$painted === undefined ? false : _options$painted,
        mask = options.mask;


    this.checkProcessable('getPixelsGrid', {
        bitDepth: [8, 16],
        channels: 1
    });

    if (!Array.isArray(sampling)) {
        sampling = [sampling, sampling];
    }

    var xSampling = sampling[0];
    var ySampling = sampling[1];
    var nbSamples = xSampling * ySampling;

    var xyS = new Array(nbSamples);
    var zS = new Array(nbSamples);

    var xStep = this.width / xSampling;
    var yStep = this.height / ySampling;
    var currentX = Math.floor(xStep / 2);

    var position = 0;
    for (var i = 0; i < xSampling; i++) {
        var currentY = Math.floor(yStep / 2);
        for (var j = 0; j < ySampling; j++) {
            var x = Math.round(currentX);
            var y = Math.round(currentY);
            if (!mask || mask.getBitXY(x, y)) {
                xyS[position] = [x, y];
                zS[position] = this.getPixelXY(x, y);
                position++;
            }
            currentY += yStep;
        }
        currentX += xStep;
    }

    // resize arrays if needed
    xyS.length = position;
    zS.length = position;

    var toReturn = { xyS, zS };

    if (painted) {
        toReturn.painted = this.rgba8().paintPoints(xyS);
    }

    return toReturn;
}

function Matrix$2(width, height, defaultValue) {
    var matrix = new Array(width);
    for (var x = 0; x < width; x++) {
        matrix[x] = new Array(height);
    }
    if (defaultValue) {
        for (var _x = 0; _x < width; _x++) {
            for (var y = 0; y < height; y++) {
                matrix[_x][y] = defaultValue;
            }
        }
    }
    matrix.width = width;
    matrix.height = height;
    matrix.__proto__ = Matrix$2.prototype;
    return matrix;
}

Matrix$2.prototype.localMin = function (x, y) {
    var min = this[x][y];
    var position = [x, y];
    for (var i = Math.max(0, x - 1); i < Math.min(this.length, x + 2); i++) {
        for (var j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
            if (this[i][j] < min) {
                min = this[i][j];
                position = [i, j];
            }
        }
    }
    return {
        position: position,
        value: min
    };
};

Matrix$2.prototype.localMax = function (x, y) {
    var max = this[x][y];
    var position = [x, y];
    for (var i = Math.max(0, x - 1); i < Math.min(this.length, x + 2); i++) {
        for (var j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
            if (this[i][j] > max) {
                max = this[i][j];
                position = [i, j];
            }
        }
    }
    return {
        position: position,
        value: max
    };
};

Matrix$2.prototype.localSearch = function (x, y, value) {
    var results = [];
    for (var i = Math.max(0, x - 1); i < Math.min(this.length, x + 2); i++) {
        for (var j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
            if (this[i][j] === value) {
                results.push([i, j]);
            }
        }
    }
    return results;
};

/**
 * Try to match the current pictures with another one
 * @memberof Image
 * @instance
 * @param {Image} image - Other image to match
 * @param {object} [options]
 * @return {number[]}
 */
function match(image) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var border = options.border;


    this.checkProcessable('getChannel', {
        bitDepth: [8, 16]
    });

    if (this.bitDepth !== image.bitDepth) {
        throw new Error('Both images must have the same bitDepth');
    }
    if (this.channels !== image.channels) {
        throw new Error('Both images must have the same number of channels');
    }
    if (this.colorModel !== image.colorModel) {
        throw new Error('Both images must have the same colorModel');
    }

    // there could be many names
    var similarityMatrix = new Matrix$2(image.width, image.height, -Infinity);

    var currentX = Math.floor(image.width / 2);
    var currentY = Math.floor(image.height / 2);
    var middleX = currentX;
    var middleY = currentY;
    var theEnd = false;

    while (!theEnd) {
        var toCalculatePositions = similarityMatrix.localSearch(currentX, currentY, -Infinity);
        for (var i = 0; i < toCalculatePositions.length; i++) {
            var position = toCalculatePositions[i];
            var similarity = this.getSimilarity(image, { border: border, shift: [middleX - position[0], middleY - position[1]] });
            similarityMatrix[position[0]][position[1]] = similarity;
        }

        var max = similarityMatrix.localMax(currentX, currentY);
        if (max.position[0] !== currentX || max.position[1] !== currentY) {
            currentX = max.position[0];
            currentY = max.position[1];
        } else {
            theEnd = true;
        }
    }

    return [currentX - middleX, currentY - middleY];
}

/**
 * @memberof Image
 * @instance
 * @param {number} row
 * @param {number} [channel=0]
 * @return {number[]}
 */
function getRow(row) {
    var channel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    this.checkProcessable('getRow', {
        bitDepth: [8, 16]
    });

    this.checkRow(row);
    this.checkChannel(channel);

    var array = new Array(this.width);
    var ptr = 0;
    var begin = row * this.width * this.channels + channel;
    var end = begin + this.width * this.channels;
    for (var j = begin; j < end; j += this.channels) {
        array[ptr++] = this.data[j];
    }

    return array;
}

/**
 * @memberof Image
 * @instance
 * @param {number} column
 * @param {number} [channel=0]
 * @return {number[]}
 */
function getColumn(column) {
    var channel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;


    this.checkProcessable('getColumn', {
        bitDepth: [8, 16]
    });

    this.checkColumn(column);
    this.checkChannel(channel);

    var array = new Array(this.height);
    var ptr = 0;
    var step = this.width * this.channels;
    for (var j = channel + column * this.channels; j < this.data.length; j += step) {
        array[ptr++] = this.data[j];
    }
    return array;
}

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.channel]
 * @return {Matrix}
 */
function getMatrix() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var channel = options.channel;

    this.checkProcessable('getMatrix', {
        bitDepth: [8, 16]
    });

    if (channel === undefined) {
        if (this.components > 1) {
            throw new RangeError('You need to define the channel for an image that contains more than one channel');
        }
        channel = 0;
    }

    var matrix = new Matrix(this.height, this.width);
    for (var x = 0; x < this.height; x++) {
        for (var y = 0; y < this.width; y++) {
            matrix.set(x, y, this.getValueXY(y, x, channel));
        }
    }

    return matrix;
}

/**
 * We set the data of the image from a matrix. The size of the matrix and the data have to be the same.
 * @memberof Image
 * @instance
 * @param {Matrix} matrix
 * @param {object} [options]
 * @param {number} [options.channel]
 */
function setMatrix(matrix) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var channel = options.channel;

    this.checkProcessable('getMatrix', {
        bitDepth: [8, 16]
    });

    if (channel === undefined) {
        if (this.components > 1) {
            throw new RangeError('You need to define the channel for an image that contains more than one channel');
        }
        channel = 0;
    }

    if (!matrix.length || !matrix[0].length || this.width !== matrix.columns || this.height !== matrix.rows) {
        throw new RangeError('The size of the matrix must be equal to the size of the image');
    }

    for (var x = 0; x < this.height; x++) {
        for (var y = 0; y < this.width; y++) {
            this.setValueXY(y, x, channel, matrix.get(x, y));
        }
    }
}

/**
 * Returns an array of arrays containing the pixel values in the form
 * [[R1, G1, B1], [R2, G2, B2], ...]
 * @memberof Image
 * @instance
 * @return {Array<Array<number>>}
 */
function getPixelsArray() {
    this.checkProcessable('getPixelsArray', {
        bitDepth: [8, 16, 32]
    });

    var array = new Array(this.size);
    var ptr = 0;
    for (var i = 0; i < this.data.length; i += this.channels) {
        var pixel = new Array(this.components);
        for (var j = 0; j < this.components; j++) {
            pixel[j] = this.data[i + j];
        }
        array[ptr++] = pixel;
    }

    return array;
}

/**
 * Find intersection of points between two different masks
 * @memberof Image
 * @instance
 * @param {Image} mask2 - a mask (1 bit image)
 * @return {object} - object containing number of white pixels for mask1, for mask 2 and for them both
 */
function getIntersection(mask2) {

    var mask1 = this;
    var closestParent = mask1.getClosestCommonParent(mask2);

    var startPos1 = mask1.getRelativePosition(closestParent, { defaultFurther: true });
    var allRelPos1 = getRelativePositionForAllPixels(mask1, startPos1);
    var startPos2 = mask2.getRelativePosition(closestParent, { defaultFurther: true });
    var allRelPos2 = getRelativePositionForAllPixels(mask2, startPos2);

    var commonSurface = getCommonSurface(allRelPos1, allRelPos2);
    var intersection = { whitePixelsMask1: [], whitePixelsMask2: [], commonWhitePixels: [] };

    for (var i = 0; i < commonSurface.length; i++) {
        var currentRelativePos = commonSurface[i];
        var realPos1 = [currentRelativePos[0] - startPos1[0], currentRelativePos[1] - startPos1[1]];
        var realPos2 = [currentRelativePos[0] - startPos2[0], currentRelativePos[1] - startPos2[1]];
        var valueBitMask1 = mask1.getBitXY(realPos1[0], realPos1[1]);
        var valueBitMask2 = mask2.getBitXY(realPos2[0], realPos2[1]);

        if (valueBitMask1 === 1 && valueBitMask2 === 1) {
            intersection.commonWhitePixels.push(currentRelativePos);
        }
    }

    for (var _i = 0; _i < allRelPos1.length; _i++) {
        var posX = void 0;
        var posY = void 0;
        if (_i !== 0) {
            posX = Math.floor(_i / (mask1.width - 1));
            posY = _i % (mask1.width - 1);
        }
        if (mask1.getBitXY(posX, posY) === 1) {
            intersection.whitePixelsMask1.push(allRelPos1[_i]);
        }
    }

    for (var _i2 = 0; _i2 < allRelPos2.length; _i2++) {
        var _posX = 0;
        var _posY = 0;
        if (_i2 !== 0) {
            _posX = Math.floor(_i2 / (mask2.width - 1));
            _posY = _i2 % (mask2.width - 1);
        }
        if (mask2.getBitXY(_posX, _posY) === 1) {
            intersection.whitePixelsMask2.push(allRelPos2[_i2]);
        }
    }

    return intersection;
}

/**
 * Get relative position array for all pixels in masks
 * @param {Image} mask - a mask (1 bit image)
 * @param {Array<number>} startPosition - start position of mask relative to parent
 * @return {Array} - relative position of all pixels
 * @private
 */
function getRelativePositionForAllPixels(mask, startPosition) {
    var relativePositions = [];
    for (var i = 0; i < mask.height; i++) {
        for (var j = 0; j < mask.width; j++) {
            var originalPos = [i, j];
            relativePositions.push([originalPos[0] + startPosition[0], originalPos[1] + startPosition[1]]);
        }
    }
    return relativePositions;
}

/**
 * Finds common surface for two arrays containing the positions of the pixels relative to parent image
 * @param {Array<number>} positionArray1 - positions of pixels relative to parent
 * @param {Array<number>} positionArray2 - positions of pixels relative to parent
 * @return {Array<number>} - positions of common pixels for both arrays
 * @private
 */
function getCommonSurface(positionArray1, positionArray2) {
    var i = 0;
    var j = 0;
    var commonSurface = [];
    while (i < positionArray1.length && j < positionArray2.length) {
        if (positionArray1[i][0] === positionArray2[j][0] && positionArray1[i][1] === positionArray2[j][1]) {
            commonSurface.push(positionArray1[i]);
            i++;
            j++;
        } else if (positionArray1[i][0] < positionArray2[j][0] || positionArray1[i][0] === positionArray2[j][0] && positionArray1[i][1] < positionArray2[j][1]) {
            i++;
        } else {
            j++;
        }
    }
    return commonSurface;
}

/**
 * Finds common parent between two different masks
 * @memberof Image
 * @instance
 * @param {Image} mask - a mask (1 bit image)
 * @return {Image} - the lowest common parent of both masks
 */
function getClosestCommonParent(mask) {
    var depthMask1 = getDepth(this);
    var depthMask2 = getDepth(mask);

    var furthestParent = void 0;
    if (depthMask1 >= depthMask2) {
        furthestParent = getFurthestParent(this, depthMask1);
    } else {
        furthestParent = getFurthestParent(mask, depthMask2);
    }

    if (depthMask1 === 0 || depthMask2 === 0) {
        //comparing with at least one original image -> no common parent
        return furthestParent;
    }
    var m1 = this;
    var m2 = mask;

    while (depthMask1 !== depthMask2) {
        if (depthMask1 > depthMask2) {
            m1 = m1.parent;
            if (m1 === undefined) {
                return furthestParent;
            }
            depthMask1 = depthMask1 - 1;
        } else {
            m2 = m2.parent;
            if (m2 === undefined) {
                return furthestParent;
            }
            depthMask2 = depthMask2 - 1;
        }
    }

    while (m1 !== m2 && typeof m1 !== undefined && typeof m2 !== undefined) {
        m1 = m1.parent;
        m2 = m2.parent;
        if (m1 === undefined || m2 === undefined) {
            return furthestParent;
        }
    }

    //TODO
    //no common parent, use parent at top of hierarchy of m1
    //we assume it works for now
    if (m1 !== m2) {
        return furthestParent;
    }

    return m1;
}

/**
 * Find the depth of the mask with respect to its arborescence.
 * Helper function to find the common parent between two masks.
 * @param {Image} mask - a mask (1 bit Image)
 * @return {number} - depth of mask
 * @private
 */
function getDepth(mask) {
    var d = 0;
    var m = mask;
    //a null parent means it's the original image
    while (m.parent != null) {
        m = m.parent;
        d++;
    }
    return d;
}

function getFurthestParent(mask, depth) {
    var m = mask;
    while (depth > 0) {
        m = m.parent;
        depth = depth - 1;
    }
    return m;
}

const defaultOptions$12 = {
    lowThreshold: 10,
    highThreshold: 30,
    gaussianBlur: 1.1
};

const Gx = [
    [-1, 0, +1],
    [-2, 0, +2],
    [-1, 0, +1]
];

const Gy = [
    [-1, -2, -1],
    [0, 0, 0],
    [+1, +2, +1]
];

const convOptions = {
    bitDepth: 32,
    mode: 'periodic'
};

function cannyEdgeDetector(image, options) {
    image.checkProcessable('Canny edge detector', {
        bitDepth: 8,
        channels: 1,
        components: 1
    });

    options = Object.assign({}, defaultOptions$12, options);

    const width = image.width;
    const height = image.height;
    const brightness = image.maxValue;

    const gfOptions = {
        sigma: options.gaussianBlur,
        radius: 3
    };

    const gf = image.gaussianFilter(gfOptions);

    const gradientX = gf.convolution(Gy, convOptions);
    const gradientY = gf.convolution(Gx, convOptions);

    const G = gradientY.hypotenuse(gradientX);

    const Image = image.constructor;

    const nms = new Image(width, height, {
        kind: 'GREY',
        bitDepth: 32
    });

    const edges = new Image(width, height, {
        kind: 'GREY',
        bitDepth: 32
    });

    const finalImage = new Image(width, height, {
        kind: 'GREY'
    });

    // Non-Maximum supression
    for (var i = 1; i < width - 1; i++) {
        for (var j = 1; j < height - 1; j++) {

            var dir = (Math.round(Math.atan2(gradientY.getValueXY(i, j, 0), gradientX.getValueXY(i, j, 0)) * (5.0 / Math.PI)) + 5) % 5;

            if (
                !((dir === 0 && (G.getValueXY(i, j, 0) <= G.getValueXY(i, j - 1, 0) || G.getValueXY(i, j, 0) <= G.getValueXY(i, j + 1, 0)))
                    || (dir === 1 && (G.getValueXY(i, j, 0) <= G.getValueXY(i - 1, j + 1, 0) || G.getValueXY(i, j, 0) <= G.getValueXY(i + 1, j - 1, 0)))
                    || (dir === 2 && (G.getValueXY(i, j, 0) <= G.getValueXY(i - 1, j, 0) || G.getValueXY(i, j, 0) <= G.getValueXY(i + 1, j, 0)))
                    || (dir === 3 && (G.getValueXY(i, j, 0) <= G.getValueXY(i - 1, j - 1, 0) || G.getValueXY(i, j, 0) <= G.getValueXY(i + 1, j + 1, 0))))
            ) {
                nms.setValueXY(i, j, 0, G.getValueXY(i, j, 0));
            }
        }
    }

    for (i = 0; i < width * height; ++i) {
        var currentNms = nms.data[i];
        var currentEdge = 0;
        if (currentNms > options.highThreshold) {
            currentEdge++;
            finalImage.data[i] = brightness;
        }
        if (currentNms > options.lowThreshold) {
            currentEdge++;
        }

        edges.data[i] = currentEdge;
    }

    // Hysteresis: first pass
    var currentPixels = [];
    for (i = 1; i < width - 1; ++i) {
        for (j = 1; j < height - 1; ++j) {
            if (edges.getValueXY(i, j, 0) !== 1) {
                continue;
            }

            outer: for (var k = i - 1; k < i + 2; ++k) {
                for (var l = j - 1; l < j + 2; ++l) {
                    if (edges.getValueXY(k, l, 0) === 2) {
                        currentPixels.push([i, j]);
                        finalImage.setValueXY(i, j, 0, brightness);
                        break outer;
                    }
                }
            }
        }
    }

    // Hysteresis: second pass
    while (currentPixels.length > 0) {
        var newPixels = [];
        for (i = 0; i < currentPixels.length; ++i) {
            for (j = -1; j < 2; ++j) {
                for (k = -1; k < 2; ++k) {
                    if (j === 0 && k === 0) {
                        continue;
                    }
                    var row = currentPixels[i][0] + j;
                    var col = currentPixels[i][1] + k;
                    if (edges.getValueXY(row, col, 0) === 1 && finalImage.getValueXY(row, col, 0) === 0) {
                        newPixels.push([row, col]);
                        finalImage.setValueXY(row, col, 0, brightness);
                    }
                }
            }
        }
        currentPixels = newPixels;
    }

    return finalImage;
}

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @return {Image}
 */
function cannyEdge(options) {
  return cannyEdgeDetector(this, options);
}

/**
 * Extracts a part of an original image based on a mask. By default the mask may contain
 * a relative position and this part of the original image will be extracted.
 * @memberof Image
 * @instance
 * @param {Image} mask - Image containing a binary mask
 * @param {object} [options]
 * @param {number[]} [options.position] - Array of 2 elements to force the x,y coordinates
 * @return {Image} A new image
 */
function extract(mask) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var position = options.position;

    this.checkProcessable('extract', {
        bitDepth: [1, 8, 16]
    });

    // we need to find the relative position to the parent
    if (!position) {
        position = mask.getRelativePosition(this);
        if (!position) {
            throw new Error('extract : can not extract an image because the relative position can not be ' + 'determined, try to specify manually the position as an array of 2 elements [x,y].');
        }
    }

    if (this.bitDepth > 1) {
        var _extract = Image$1.createFrom(this, {
            width: mask.width,
            height: mask.height,
            alpha: 1, // we force the alpha, otherwise difficult to extract a mask ...
            position: position,
            parent: this
        });

        for (var x = 0; x < mask.width; x++) {
            for (var y = 0; y < mask.height; y++) {
                // we copy the point
                for (var channel = 0; channel < this.channels; channel++) {
                    var value = this.getValueXY(x + position[0], y + position[1], channel);
                    _extract.setValueXY(x, y, channel, value);
                }
                // we make it transparent in case it is not in the mask
                if (!mask.getBitXY(x, y)) {
                    _extract.setValueXY(x, y, this.components, 0);
                }
            }
        }

        return _extract;
    } else {
        var _extract2 = Image$1.createFrom(this, {
            width: mask.width,
            height: mask.height,
            position: position,
            parent: this
        });
        for (var _y = 0; _y < mask.height; _y++) {
            for (var _x2 = 0; _x2 < mask.width; _x2++) {
                if (mask.getBitXY(_x2, _y)) {
                    if (this.getBitXY(_x2 + position[0], _y + position[1])) {
                        _extract2.setBitXY(_x2, _y);
                    }
                }
            }
        }

        return _extract2;
    }
}

var fastList = createCommonjsModule(function (module, exports) {
(function() { // closure for web browsers

function Item (data, prev, next) {
  this.next = next;
  if (next) next.prev = this;
  this.prev = prev;
  if (prev) prev.next = this;
  this.data = data;
}

function FastList () {
  if (!(this instanceof FastList)) return new FastList
  this._head = null;
  this._tail = null;
  this.length = 0;
}

FastList.prototype =
{ push: function (data) {
    this._tail = new Item(data, this._tail, null);
    if (!this._head) this._head = this._tail;
    this.length ++;
  }

, pop: function () {
    if (this.length === 0) return undefined
    var t = this._tail;
    this._tail = t.prev;
    if (t.prev) {
      t.prev = this._tail.next = null;
    }
    this.length --;
    if (this.length === 1) this._head = this._tail;
    else if (this.length === 0) this._head = this._tail = null;
    return t.data
  }

, unshift: function (data) {
    this._head = new Item(data, null, this._head);
    if (!this._tail) this._tail = this._head;
    this.length ++;
  }

, shift: function () {
    if (this.length === 0) return undefined
    var h = this._head;
    this._head = h.next;
    if (h.next) {
      h.next = this._head.prev = null;
    }
    this.length --;
    if (this.length === 1) this._tail = this._head;
    else if (this.length === 0) this._head = this._tail = null;
    return h.data
  }

, item: function (n) {
    if (n < 0) n = this.length + n;
    var h = this._head;
    while (n-- > 0 && h) h = h.next;
    return h ? h.data : undefined
  }

, slice: function (n, m) {
    if (!n) n = 0;
    if (!m) m = this.length;
    if (m < 0) m = this.length + m;
    if (n < 0) n = this.length + n;

    if (m === n) {
      return []
    }

    if (m < n) {
      throw new Error("invalid offset: "+n+","+m+" (length="+this.length+")")
    }

    var len = m - n
      , ret = new Array(len)
      , i = 0
      , h = this._head;
    while (n-- > 0 && h) h = h.next;
    while (i < len && h) {
      ret[i++] = h.data;
      h = h.next;
    }
    return ret
  }

, drop: function () {
    FastList.call(this);
  }

, forEach: function (fn, thisp) {
    var p = this._head
      , i = 0
      , len = this.length;
    while (i < len && p) {
      fn.call(thisp || this, p.data, i, this);
      p = p.next;
      i ++;
    }
  }

, map: function (fn, thisp) {
    var n = new FastList();
    this.forEach(function (v, i, me) {
      n.push(fn.call(thisp || me, v, i, me));
    });
    return n
  }

, filter: function (fn, thisp) {
    var n = new FastList();
    this.forEach(function (v, i, me) {
      if (fn.call(thisp || me, v, i, me)) n.push(v);
    });
    return n
  }

, reduce: function (fn, val, thisp) {
    var i = 0
      , p = this._head
      , len = this.length;
    if (!val) {
      i = 1;
      val = p && p.data;
      p = p && p.next;
    }
    while (i < len && p) {
      val = fn.call(thisp || this, val, p.data, this);
      i ++;
      p = p.next;
    }
    return val
  }
};

module.exports = FastList;

})();
});

function floodFill() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$x = options.x,
        x = _options$x === undefined ? 0 : _options$x,
        _options$y = options.y,
        y = _options$y === undefined ? 0 : _options$y,
        _options$inPlace = options.inPlace,
        inPlace = _options$inPlace === undefined ? true : _options$inPlace;


    var destination = inPlace ? this : Image$1.createFrom(this);

    this.checkProcessable('floodFill', { bitDepth: 1 });

    if (this.bitDepth === 1) {
        var bit = this.getBitXY(x, y);
        if (bit) return destination;
        var queue = new fastList();
        queue.push(new Node(x, y));
        while (queue.length > 0) {
            var node = queue.shift();
            destination.setBitXY(node.x, node.y);
            for (var i = node.x + 1; i < this.width; i++) {
                if (!destination.getBitXY(i, node.y) && !this.getBitXY(i, node.y)) {
                    destination.setBitXY(i, node.y);
                    if (node.y + 1 < this.height && !this.getBitXY(i, node.y + 1)) {
                        queue.push(new Node(i, node.y + 1));
                    }
                    if (node.y - 1 >= 0 && !this.getBitXY(i, node.y - 1)) {
                        queue.push(new Node(i, node.y - 1));
                    }
                } else {
                    break;
                }
            }
            for (var _i = node.x - 1; _i >= 0; _i++) {
                if (!destination.getBitXY(_i, node.y) && !this.getBitXY(_i, node.y)) {
                    destination.setBitXY(_i, node.y);
                    if (node.y + 1 < this.height && !this.getBitXY(_i, node.y + 1)) {
                        queue.push(new Node(_i, node.y + 1));
                    }
                    if (node.y - 1 >= 0 && !this.getBitXY(_i, node.y - 1)) {
                        queue.push(new Node(_i, node.y - 1));
                    }
                } else {
                    break;
                }
            }
        }
    }

    return destination;
}

function Node(x, y) {
    this.x = x;
    this.y = y;
}

var hex2rgb = function(hex) {
  if(hex[0] === '#') hex = hex.substr(1);

  if(hex.length === 6) {
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    };
  } else if(hex.length === 3) {
    return {
      r: parseInt(hex[0]+hex[0], 16),
      g: parseInt(hex[1]+hex[1], 16),
      b: parseInt(hex[2]+hex[2], 16)
    };
  }
};

// http://www.rapidtables.com/convert/color/hsv-to-rgb.htm
var hsv2rgb = function(h, s, v) {
  var s = s/100, v = v/100;
  var rgb = [];

  var c = v * s;
  var hh = h/60;
  var x = c * (1 - Math.abs(hh%2-1));
  var m = v - c;

  switch(parseInt(hh, 10)) {
    case 0:
      rgb = [c, x, 0];
    break;

    case 1:
      rgb = [x, c, 0];
    break;

    case 2:
      rgb = [0, c, x];
    break;

    case 3:
      rgb = [0, x, c];
    break;

    case 4:
      rgb = [x, 0, c];
    break;

    case 5:
      rgb = [c, 0, x];
    break;
  }

  return {
    r: Math.round(255*(rgb[0]+m)),
    g: Math.round(255*(rgb[1]+m)),
    b: Math.round(255*(rgb[2]+m))
  };
};

var rgb2hex = function(r, g, b) {
  return [
    _convert(r),
    _convert(g),
    _convert(b)
  ].join('');

  function _convert(num) {
    var hex = num.toString(16);
    return hex.length===1 ? '0'+hex : hex;
  }
};

var hsv2hex = function(h, s, v) {
  var rgb = hsv2rgb(h, s, v);
  return rgb2hex(rgb.r, rgb.g, rgb.b);
};

// http://www.rapidtables.com/convert/color/rgb-to-hsv.htm
var rgb2hsv = function(r, g, b) {
  var h, s, v;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var delta = max - min;

  // hue
  if(delta === 0) {
    h = 0;
  } else if(r === max) {
    h = ((g-b)/delta) % 6;
  } else if(g === max) {
    h = (b-r)/delta + 2;
  } else if(b === max) {
    h = (r-g)/delta + 4;
  }

  h = Math.round(h*60);
  if(h < 0) h += 360;

  // saturation
  s = Math.round((max === 0 ? 0 : (delta/max)) * 100);

  // value
  v = Math.round(max/255*100);

  return {
    h: h,
    s: s,
    v: v
  };
};

var rgba = function(r, g, b, a) {
  return 'rgba('+
    [r, g, b, a/100].join(',')+')';
};

// https://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
var rgba2rgb = function(r, g, b, a) {
  a = a / 100;

  return {
    r: parseInt((1 - a) * 255 + a * r, 10),
    g: parseInt((1 - a) * 255 + a * g, 10),
    b: parseInt((1 - a) * 255 + a * b, 10)
  };
};

var rgba2hex = function(r, g, b, a) {
  var rgb = rgba2rgb(r, g, b, a);
  return rgb2hex(rgb.r, rgb.g, rgb.b);
};

var hsl2hsv = function(h, s, l) {
  s *= ((l < 50) ? l : (100 - l)) / 100;

  console.log('s', s);

  return {
    h: h,
    s: 2 * s / (l+s) * 100,
    v: l + s
  };
};

var hsv2hsl = function(h, s, v) {
  var hh = (200 - s) * v / 100;

  return {
    h: h,
    s: s * v / (hh < 100 ? hh : 200 - hh),
    l: hh / 2
  };
};

var hsl2rgb$1 = function(h, s, l) {
  var hsv = hsl2hsv(h, s, l);
  return hsv2rgb(hsv.h, hsv.s, hsv.v);
};

var _colors = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 132, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 255, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 203],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [119, 128, 144],
  slategrey: [119, 128, 144],
  snow: [255, 255, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 5]
};

// based on component/color-parser




function parse(str) {
  return named(str)
    || hex3(str)
    || hex6(str)
    || rgb(str)
    || rgba$2(str)
    || hsl$1(str)
    || hsla(str);
}

function named(str) {
  var c = _colors[str.toLowerCase()];
  if(!c) return;
  return {
    r: c[0],
    g: c[1],
    b: c[2],
    a: 100
  };
}

function rgb(str) {
  if (0 == str.indexOf('rgb(')) {
    str = str.match(/rgb\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */).map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: 100
    };
  }
}

function rgba$2(str) {
  if(str.indexOf('rgba(') === 0) {
    str = str.match(/rgba\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */).map(Number);

    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts[3] * 100
    };
  }
}

function hex6(str) {
  if('#' === str[0] && 7 === str.length) {
    return {
      r: parseInt(str.slice(1, 3), 16),
      g: parseInt(str.slice(3, 5), 16),
      b: parseInt(str.slice(5, 7), 16),
      a: 100
    };
  }
}

function hex3(str) {
  if('#' === str[0] && 4 === str.length) {
    return {
      r: parseInt(str[1] + str[1], 16),
      g: parseInt(str[2] + str[2], 16),
      b: parseInt(str[3] + str[3], 16),
      a: 100
    };
  }
}

function hsl$1(str) {
  if(str.indexOf('hsl(') === 0) {
    str = str.match(/hsl\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */);

    var h = parseInt(parts[0], 10);
    var s = parseInt(parts[1], 10);
    var l = parseInt(parts[2], 10);

    var rgba = hsl2rgb$1(h, s, l);
    rgba.a = 100;

    return rgba;
  }
}

function hsla(str) {
  if(str.indexOf('hsla(') === 0) {
    str = str.match(/hsla\(([^)]+)\)/)[1];
    var parts = str.split(/ *, */);

    var h = parseInt(parts[0], 10);
    var s = parseInt(parts[1], 10);
    var l = parseInt(parts[2], 10);
    var a = parseInt(parts[3] * 100, 10);

    var rgba = hsl2rgb$1(h, s, l);
    rgba.a = a;

    return rgba;
  }
}

var cssColor = parse;

var index$30 = {
  hex2rgb: hex2rgb,
  hsv2hex: hsv2hex,
  hsv2rgb: hsv2rgb,
  rgb2hex: rgb2hex,
  rgb2hsv: rgb2hsv,
  rgba: rgba,
  rgba2rgb: rgba2rgb,
  rgba2hex: rgba2hex,
  hsl2hsv: hsl2hsv,
  hsv2hsl: hsv2hsl,
  hsl2rgb: hsl2rgb$1,
  cssColor: cssColor
};

var index_1$5 = index$30.cssColor;

function css2array(string) {
    var color = index_1$5(string);
    return [color.r, color.g, color.b, Math.round(color.a * 255 / 100)];
}

function hue2rgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}

function hsl2rgb(h, s, l) {
    var m1 = void 0,
        m2 = void 0,
        hue = void 0,
        r = void 0,
        g = void 0,
        b = void 0;
    s /= 100;
    l /= 100;

    if (s === 0) {
        r = g = b = l * 255;
    } else {
        if (l <= 0.5) {
            m2 = l * (s + 1);
        } else {
            m2 = l + s - l * s;
        }

        m1 = l * 2 - m2;
        hue = h / 360;
        r = hue2rgb(m1, m2, hue + 1 / 3);
        g = hue2rgb(m1, m2, hue);
        b = hue2rgb(m1, m2, hue - 1 / 3);
    }
    return { r: r, g: g, b: b };
}

function getDistinctColors(numColors) {
    var colors = new Array(numColors);
    var j = 0;
    for (var i = 0; i < 360; i += 360 / numColors) {
        j++;
        var color = hsl2rgb(i, 100, 30 + j % 4 * 15);
        colors[j - 1] = [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
    }
    return colors;
}

function getRandomColor() {
    return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
}

/**
 * Paint a mask or masks on the current image.
 * @memberof Image
 * @instance
 *
 * @param {Array<string>}       [labels] - Array of labels to display. Should the the same size as masks.
 * @param {Array<Array>}        [positions] - Array of labels to display. Should the the same size as masks.
 * @param {object}              [options]
 * @param {number[]|string}     [options.color='red'] - Array of 3 elements (R, G, B) or a valid css color.
 * @param {Array<Array<number>>|Array<string>} [options.colors] - Array of Array of 3 elements (R, G, B) for each color of each mask
 * @param {string|Array<string>} [options.font='12px Helvetica'] - Paint the labels in a different CSS style
 * @param {number|Array<number>} [options.rotate=0] - Rotate each label of a define angle
 * @return {this} The original painted image
 */
function paintLabels(labels, positions) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _options$color = options.color,
        color = _options$color === undefined ? 'blue' : _options$color,
        colors = options.colors,
        _options$font = options.font,
        font = _options$font === undefined ? '12px Helvetica' : _options$font,
        _options$rotate = options.rotate,
        rotate = _options$rotate === undefined ? 0 : _options$rotate;


    this.checkProcessable('paintMasks', {
        channels: [3, 4],
        bitDepth: [8, 16],
        colorModel: RGB$1
    });

    if (!Array.isArray(labels)) {
        throw Error('paintLabels: labels must be an array');
    }

    if (!Array.isArray(positions)) {
        throw Error('paintLabels: positions must be an array');
    }

    if (color && !Array.isArray(color)) {
        color = css2array(color);
    }

    if (colors) {
        colors = colors.map(function (color) {
            if (!Array.isArray(color)) {
                return css2array(color);
            }
            return color;
        });
    } else {
        colors = [color];
    }

    if (labels.length !== positions.length) {
        throw Error('paintLabels: positions and labels must be arrays from the same size');
    }

    // We convert everything to array so that we can simply loop thourgh all the labels
    if (!Array.isArray(font)) font = [font];
    if (!Array.isArray(rotate)) rotate = [rotate];

    var canvas = this.getCanvas({ originalData: true });
    var ctx = canvas.getContext('2d');
    for (var i = 0; i < labels.length; i++) {
        ctx.save();
        var _color = colors[i % colors.length];
        ctx.fillStyle = `rgba(${_color[0]},${_color[1]},${_color[2]},${_color[3] / this.maxValue})`;
        ctx.font = font[i % font.length];
        var position = positions[i];
        ctx.translate(position[0], position[1]);
        ctx.rotate(rotate[i % rotate.length] / 180 * Math.PI);
        ctx.fillText(labels[i], 0, 0);
        ctx.restore();
    }
    this.setData(ctx.getImageData(0, 0, this.width, this.height).data);

    return this;
}

/**
 * Paint a mask or masks on the current image.
 * @memberof Image
 * @instance
 * @param {(Image|Array<Image>)}     masks - Image containing a binary mask
 * @param {object}              [options]
 * @param {Array<number>|string}     [options.color='red'] - Array of 3 elements (R, G, B) or a valid css color.
 * @param {Array<Array<number>>|Array<string>} [options.colors] - Array of Array of 3 elements (R, G, B) for each color of each mask
 * @param {number}              [options.alpha=255] - Value from 0 to 255 to specify the alpha.
 * @param {boolean}             [options.randomColors=false] - To paint each mask with a random color
 * @param {boolean}             [options.distinctColors=false] - To paint each mask with a different color
 * @param {Array<string>}       [options.labels] - Array of labels to display. Should the the same size as masks.
 * @param {Array<Array<number>>} [options.labelsPosition] - Array of points [x,y] where the labels should be displayed.
 *                                      By default it is the 0,0 position of the correesponding mask.
 * @param {string}              [options.labelColor='blue'] - Define the color to paint the labels
 * @param {string}              [options.labelFont='12px Helvetica'] - Paint the labels in a different CSS style
 * @return {this} The original painted image
 */
function paintMasks(masks) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$color = options.color,
        color = _options$color === undefined ? 'red' : _options$color,
        colors = options.colors,
        _options$alpha = options.alpha,
        alpha = _options$alpha === undefined ? 255 : _options$alpha,
        _options$randomColors = options.randomColors,
        randomColors = _options$randomColors === undefined ? false : _options$randomColors,
        _options$distinctColo = options.distinctColors,
        distinctColors = _options$distinctColo === undefined ? false : _options$distinctColo,
        _options$labels = options.labels,
        labels = _options$labels === undefined ? [] : _options$labels,
        _options$labelsPositi = options.labelsPosition,
        labelsPosition = _options$labelsPositi === undefined ? [] : _options$labelsPositi,
        _options$labelColor = options.labelColor,
        labelColor = _options$labelColor === undefined ? 'blue' : _options$labelColor,
        _options$labelFont = options.labelFont,
        labelFont = _options$labelFont === undefined ? '12px Helvetica' : _options$labelFont;


    this.checkProcessable('paintMasks', {
        channels: [3, 4],
        bitDepth: [8, 16],
        colorModel: RGB$1
    });

    if (color && !Array.isArray(color)) {
        color = css2array(color);
    }

    if (colors) {
        colors = colors.map(function (color) {
            if (!Array.isArray(color)) {
                return css2array(color);
            }
            return color;
        });
    }

    if (!Array.isArray(masks)) {
        masks = [masks];
    }

    if (distinctColors) {
        colors = getDistinctColors(masks.length);
    }

    for (var i = 0; i < masks.length; i++) {
        var mask = masks[i];
        // we need to find the parent image to calculate the relative position

        if (colors) {
            color = colors[i % colors.length];
        } else if (randomColors) {
            color = getRandomColor();
        }

        for (var x = 0; x < mask.width; x++) {
            for (var y = 0; y < mask.height; y++) {
                if (mask.getBitXY(x, y)) {
                    for (var component = 0; component < Math.min(this.components, color.length); component++) {
                        if (alpha === 255) {
                            this.setValueXY(x + mask.position[0], y + mask.position[1], component, color[component]);
                        } else {
                            var value = this.getValueXY(x + mask.position[0], y + mask.position[1], component);
                            value = Math.round((value * (255 - alpha) + color[component] * alpha) / 255);
                            this.setValueXY(x + mask.position[0], y + mask.position[1], component, value);
                        }
                    }
                }
            }
        }
    }

    if (Array.isArray(labels) && labels.length > 0) {
        var canvas = this.getCanvas({ originalData: true });
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        for (var _i = 0; _i < Math.min(masks.length, labels.length); _i++) {
            var position = labelsPosition[_i] ? labelsPosition[_i] : masks[_i].position;
            ctx.fillText(labels[_i], position[0], position[1]);
        }
        this.setData(ctx.getImageData(0, 0, this.width, this.height).data);
    }

    return this;
}

var cross = [[0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]];

var smallCross = [[0, 1, 0], [1, 1, 1], [0, 1, 0]];

/**
 * Class representing a shape
 * @class Shape
 * @param {object} [options]
 * @param {string} [options.kind='cross'] - Predefined matrix shape, 'cross' or 'smallCross'
 * @param {string} [options.shape] - Value may be 'square', 'rectangle', 'circle', 'ellipse' or 'triangle'
 *                                  The size of the shape will be determined by the size, width and height.
 *                                  A Shape is by default filled.
 * @param {number} [options.size]
 * @param {number} [options.width=options.size] - width of the shape. Must be odd.
 * @param {number} [options.height=options.size] - width of the shape. Must be odd.
 * @param {boolean} [options.filled=true] - If false only the border ot the shape is taken into account.
 */
class Shape {
    constructor() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var _options$kind = options.kind,
            kind = _options$kind === undefined ? 'cross' : _options$kind,
            shape = options.shape,
            size = options.size,
            width = options.width,
            height = options.height,
            _options$filled = options.filled,
            filled = _options$filled === undefined ? true : _options$filled;

        if (size) {
            width = size;
            height = size;
        }
        if (width && 1 !== 1 || height && 1 !== 1) {
            throw Error('Shape: The width and height has to be odd numbers.');
        }
        if (shape) {
            switch (shape.toLowerCase()) {
                case 'square':
                case 'rectangle':
                    this.matrix = rectangle(width, height, { filled });
                    break;
                case 'circle':
                case 'ellipse':
                    this.matrix = ellipse(width, height, { filled });
                    break;
                case 'triangle':
                    this.matrix = triangle$1(width, height, { filled });
                    break;
                default:
                    throw new Error(`Shape: unexpected shape: ${shape}`);
            }
        } else if (kind) {
            switch (kind.toLowerCase()) {
                case 'cross':
                    this.matrix = cross;
                    break;
                case 'smallcross':
                    this.matrix = smallCross;
                    break;
                default:
                    throw new Error(`Shape: unexpected kind: ${kind}`);
            }
        } else {
            throw new Error('Shape: expected a kind or a shape option');
        }
        this.height = this.matrix.length;
        this.width = this.matrix[0].length;
        this.halfHeight = this.height / 2 >> 0;
        this.halfWidth = this.width / 2 >> 0;
    }

    /**
     * Returns an array of [x,y] points
     * @return {Array<Array<number>>} - Array of [x,y] points
     */
    getPoints() {
        var matrix = this.matrix;
        var points = [];
        for (var y = 0; y < matrix.length; y++) {
            for (var x = 0; x < matrix[0].length; x++) {
                if (matrix[y][x]) {
                    points.push([x - this.halfWidth, y - this.halfHeight]);
                }
            }
        }
        return points;
    }

    /**
     * Returns a Mask (1 bit Image) corresponding to this shape.
     * @return {Image}
     */
    getMask() {
        var img = new Image$1(this.width, this.height, {
            kind: BINARY
        });
        for (var y = 0; y < this.matrix.length; y++) {
            for (var x = 0; x < this.matrix[0].length; x++) {
                if (this.matrix[y][x]) {
                    img.setBitXY(x, y);
                }
            }
        }
        return img;
    }
}

function rectangle(width, height, options) {
    var matrix = Matrix.zeros(height, width);
    if (options.filled) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                matrix.set(y, x, 1);
            }
        }
    } else {
        for (var _y of [0, height - 1]) {
            for (var _x2 = 0; _x2 < width; _x2++) {
                matrix.set(_y, _x2, 1);
            }
        }
        for (var _y2 = 0; _y2 < height; _y2++) {
            for (var _x3 of [0, width - 1]) {
                matrix.set(_y2, _x3, 1);
            }
        }
    }

    return matrix;
}

function ellipse(width, height, options) {
    var matrix = Matrix.zeros(height, width, options);
    var yEven = 1 - height % 2;
    var xEven = 1 - width % 2;
    var a = Math.floor((width - 1) / 2); // horizontal ellipse axe
    var b = Math.floor((height - 1) / 2); // vertical ellipse axe
    var a2 = a * a;
    var b2 = b * b;
    if (options.filled) {
        for (var y = 0; y <= b; y++) {
            var shift = Math.floor(Math.sqrt(a2 - a2 * y * y / b2));
            for (var x = a - shift; x <= a; x++) {
                matrix.set(b - y, x, 1);
                matrix.set(b + y + yEven, x, 1);
                matrix.set(b - y, width - x - 1, 1);
                matrix.set(b + y + yEven, width - x - 1, 1);
            }
        }
    } else {
        for (var _y3 = 0; _y3 <= b; _y3++) {
            var _shift = Math.floor(Math.sqrt(a2 - a2 * _y3 * _y3 / b2));
            var _x4 = a - _shift;
            matrix.set(b - _y3, _x4, 1);
            matrix.set(b + _y3 + yEven, _x4, 1);
            matrix.set(b - _y3, width - _x4 - 1, 1);
            matrix.set(b + _y3 + yEven, width - _x4 - 1, 1);
        }

        for (var _x5 = 0; _x5 <= a; _x5++) {
            var _shift2 = Math.floor(Math.sqrt(b2 - b2 * _x5 * _x5 / a2));
            var _y4 = b - _shift2;
            matrix.set(_y4, a - _x5, 1);
            matrix.set(_y4, a + _x5 + xEven, 1);
            matrix.set(height - _y4 - 1, a - _x5, 1);
            matrix.set(height - _y4 - 1, a + _x5 + xEven, 1);
        }
    }
    return matrix;
}

function triangle$1(width, height, options) {
    if (!options.filled) {
        throw new Error('Non filled triangle is not implemented');
    }
    var matrix = Matrix.zeros(height, width, options);
    for (var y = 0; y < height; y++) {
        var shift = Math.floor((1 - y / height) * width / 2);
        for (var x = shift; x < width - shift; x++) {
            matrix.set(y, x, 1);
        }
    }
    return matrix;
}

/**
 * Paint pixels on the current image.
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} points - Array of [x,y] points
 * @param {object} [options]
 * @param {Array<number>} [options.color=[max,0,0]] - Array of 3 elements (R, G, B), default is red.
 * @param {object} [options.shape] - Definition of the shape, see Shape contructor.
 * @return {this} The original painted image
 */
function paintPoints(points) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$color = options.color,
        color = _options$color === undefined ? [this.maxValue, 0, 0] : _options$color,
        shape = options.shape;


    this.checkProcessable('paintPoints', {
        bitDepth: [8, 16]
    });

    var shapePixels = new Shape(shape).getPoints();

    var numberChannels = Math.min(this.channels, color.length);

    for (var i = 0; i < points.length; i++) {
        var xP = points[i][0];
        var yP = points[i][1];
        for (var j = 0; j < shapePixels.length; j++) {
            var xS = shapePixels[j][0];
            var yS = shapePixels[j][1];
            if (xP + xS >= 0 && yP + yS >= 0 && xP + xS < this.width && yP + yS < this.height) {
                var position = (xP + xS + (yP + yS) * this.width) * this.channels;
                for (var channel = 0; channel < numberChannels; channel++) {
                    this.data[position + channel] = color[channel];
                }
            }
        }
    }

    return this;
}

/**
 * Paint a polyline defined by an array of points.
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} points - Array of [x,y] points
 * @param {object} [options]
 * @param {Array<number>} [options.color=[max,0,0]] - Array of 3 elements (R, G, B), default is red.
 * @param {boolean} [options.closed=false] - Close the polyline.
 * @return {this} The original painted image
 */
function paintPolyline(points) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$color = options.color,
        color = _options$color === undefined ? [this.maxValue, 0, 0] : _options$color,
        _options$closed = options.closed,
        closed = _options$closed === undefined ? false : _options$closed;


    this.checkProcessable('paintPoints', {
        bitDepth: [8, 16]
    });

    var numberChannels = Math.min(this.channels, color.length);

    for (var i = 0; i < points.length - 1 + closed; i++) {
        var from = points[i];
        var to = points[(i + 1) % points.length];

        var dx = to[0] - from[0];
        var dy = to[1] - from[1];
        var steps = Math.max(Math.abs(dx), Math.abs(dy));

        var xIncrement = dx / steps;
        var yIncrement = dy / steps;

        var x = from[0];
        var y = from[1];

        for (var j = 0; j <= steps; j++) {
            var xPoint = Math.round(x);
            var yPoint = Math.round(y);

            if (xPoint >= 0 && yPoint >= 0 && xPoint < this.width && yPoint < this.height) {
                var position = (xPoint + yPoint * this.width) * this.channels;
                for (var channel = 0; channel < numberChannels; channel++) {
                    this.data[position + channel] = color[channel];
                }
            }

            x = x + xIncrement;
            y = y + yIncrement;
        }
    }

    return this;
}

/**
 * Paint a polygon defined by an array of points.
 * @memberof Image
 * @instance
 * @param {Array<Array<number>>} points - Array of [x,y] points
 * @param {object} [options]
 * @param {Array<number>} [options.color=[max,0,0]] - Array of 3 elements (R, G, B), default is red.
 * @return {this} The original painted image
 */
function paintPolygon(points) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  options.closed = true;

  return this.paintPolyline(points, options);
}

/**
 * Returns a histogram for the specified channel
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.maxSlots=256]
 * @param {number} [options.channel]
 * @param {boolean} [options.useAlpha=true]
 * @return {number[]}
 */
function getHistogram() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$maxSlots = options.maxSlots,
        maxSlots = _options$maxSlots === undefined ? 256 : _options$maxSlots,
        channel = options.channel,
        _options$useAlpha = options.useAlpha,
        useAlpha = _options$useAlpha === undefined ? true : _options$useAlpha;

    this.checkProcessable('getHistogram', {
        bitDepth: [1, 8, 16]
    });
    if (channel === undefined) {
        if (this.components > 1) {
            throw new RangeError('You need to define the channel for an image that contains more than one channel');
        }
        channel = 0;
    }
    return getChannelHistogram.call(this, channel, { useAlpha, maxSlots });
}

/**
 * Returns an array (number of channels) of array (number of slots) containing
 * the number of data of a specific intensity.
 * Intensity may be grouped by the maxSlots parameter.
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.maxSlots] - Number of slots in the resulting
 *      array. The intensity will be evently distributed between 0 and
 *      the maxValue allowed for this image (255 for usual images).
 *      If maxSlots = 8, all the intensities between 0 and 31 will be
 *      placed in the slot 0, 32 to 63 in slot 1, ...
 * @return {Array<Array<number>>}
 * @example
 *      image.getHistograms({
 *          maxSlots: 8,
 *          useAlpha: false
 *      });
 */
function getHistograms() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$maxSlots2 = options.maxSlots,
        maxSlots = _options$maxSlots2 === undefined ? 256 : _options$maxSlots2,
        _options$useAlpha2 = options.useAlpha,
        useAlpha = _options$useAlpha2 === undefined ? true : _options$useAlpha2;

    this.checkProcessable('getHistograms', {
        bitDepth: [8, 16]
    });
    var results = new Array(useAlpha ? this.components : this.channels);
    for (var i = 0; i < results.length; i++) {
        results[i] = getChannelHistogram.call(this, i, { useAlpha, maxSlots });
    }
    return results;
}

function getChannelHistogram(channel, options) {
    var useAlpha = options.useAlpha,
        maxSlots = options.maxSlots;

    //for a mask, return a number array containing count of black and white points (black = array[0], white = array[1])

    if (this.bitDepth === 1) {
        var blackWhiteCount = [0, 0];
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                var value = this.getBitXY(i, j);
                if (value === 0) {
                    blackWhiteCount[0] += 1;
                } else if (value === 1) {
                    blackWhiteCount[1] += 1;
                }
            }
        }
        return blackWhiteCount;
    }

    var bitSlots = Math.log2(maxSlots);
    if (!index$20(bitSlots)) {
        throw new RangeError('maxSlots must be a power of 2, for example: 64, 256, 1024');
    }
    // we will compare the bitSlots to the bitDepth of the image
    // based on this we will shift the values. This allows to generate a histogram
    // of 16 grey even if the images has 256 shade of grey

    var bitShift = 0;
    if (this.bitDepth > bitSlots) {
        bitShift = this.bitDepth - bitSlots;
    }

    var data = this.data;
    var result = index$29(Math.pow(2, Math.min(this.bitDepth, bitSlots)), 0);
    if (useAlpha && this.alpha) {
        var alphaChannelDiff = this.channels - channel - 1;

        for (var _i = channel; _i < data.length; _i += this.channels) {
            result[data[_i] >> bitShift] += data[_i + alphaChannelDiff] / this.maxValue;
        }
    } else {
        for (var _i2 = channel; _i2 < data.length; _i2 += this.channels) {
            result[data[_i2] >> bitShift]++;
        }
    }

    return result;
}

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {boolean} [options.useAlpha=true]
 * @param {number} [options.nbSlots=512]
 * @return {number[]}
 */
function getColorHistogram() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$useAlpha = options.useAlpha,
        useAlpha = _options$useAlpha === undefined ? true : _options$useAlpha,
        _options$nbSlots = options.nbSlots,
        nbSlots = _options$nbSlots === undefined ? 512 : _options$nbSlots;


    this.checkProcessable('getColorHistogram', {
        bitDepth: [8, 16],
        components: [3]
    });

    var nbSlotsCheck = Math.log(nbSlots) / Math.log(8);
    if (nbSlotsCheck !== Math.floor(nbSlotsCheck)) {
        throw new RangeError('nbSlots must be a power of 8. Usually 8, 64, 512 or 4096');
    }

    var bitShift = this.bitDepth - nbSlotsCheck;

    var data = this.data;
    var result = index$29(Math.pow(8, nbSlotsCheck), 0);
    var factor2 = Math.pow(2, nbSlotsCheck * 2);
    var factor1 = Math.pow(2, nbSlotsCheck);

    for (var i = 0; i < data.length; i += this.channels) {
        var slot = (data[i] >> bitShift) * factor2 + (data[i + 1] >> bitShift) * factor1 + (data[i + 2] >> bitShift);
        if (useAlpha && this.alpha) {
            result[slot] += data[i + this.channels - 1] / this.maxValue;
        } else {
            result[slot]++;
        }
    }

    return result;
}

/**
 * Returns an array with the minimal value of each channel
 * @memberof Image
 * @instance
 * @return {number[]} Array having has size the number of channels
 */
function min$1() {
    this.checkProcessable('min', {
        bitDepth: [8, 16]
    });

    var result = index$29(this.channels, +Infinity);

    for (var i = 0; i < this.data.length; i += this.channels) {
        for (var c = 0; c < this.channels; c++) {
            if (this.data[i + c] < result[c]) {
                result[c] = this.data[i + c];
            }
        }
    }
    return result;
}

/**
 * Returns an array with the maximal value of each channel
 * @memberof Image
 * @instance
 * @return {number[]} Array having has size the number of channels
 */
function max$1() {
    this.checkProcessable('max', {
        bitDepth: [8, 16]
    });

    var result = index$29(this.channels, -Infinity);

    for (var i = 0; i < this.data.length; i += this.channels) {
        for (var c = 0; c < this.channels; c++) {
            if (this.data[i + c] > result[c]) {
                result[c] = this.data[i + c];
            }
        }
    }
    return result;
}

/**
 * Returns an array with the sum of the values of each channel
 * @memberof Image
 * @instance
 * @return {number[]} Array having has size the number of channels
 */
function sum() {
    this.checkProcessable('sum', {
        bitDepth: [8, 16]
    });

    var result = index$29(this.channels, 0);

    for (var i = 0; i < this.data.length; i += this.channels) {
        for (var c = 0; c < this.channels; c++) {
            result[c] += this.data[i + c];
        }
    }
    return result;
}

/**
 * Returns the moment of an image (https://en.wikipedia.org/wiki/Image_moment)
 * @memberof Image
 * @instance
 * @param {number} [xPower=0]
 * @param {number} [yPower=0]
 * @return {number}
 */
function getMoment() {
    var xPower = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var yPower = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    this.checkProcessable('getMoment', {
        bitDepth: [1]
    });

    var m = 0;

    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            if (this.getBitXY(x, y) === 1) {
                m += Math.pow(x, xPower) * Math.pow(y, yPower);
            }
        }
    }
    return m;
}

/**
 * Returns an array of object with position.
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {Image} [options.mask] - Region of the image that is analyzed. The rest is omitted.
 * @param {number} [options.region=3] -  1, 2 or 3. Define the region around each points that is analyzed. 1 corresponds to 4 cross points, 2 to
 *        the 8 points around and 3 to the 12 points around the central pixel.
 * @param {number} [options.removeClosePoints=0] - Remove pts which have a distance between them smaller than this param.
 * @param {boolean} [options.invert=false] - Search for minima instead of maxima
 * @param {number} [options.maxEquals=2] - Maximal number of values that may be equal to the maximum
 * @return {number[]} Array whose size is the number of channels
 */
function localMaxima() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mask = options.mask,
        _options$region = options.region,
        region = _options$region === undefined ? 3 : _options$region,
        _options$removeCloseP = options.removeClosePoints,
        removeClosePoints = _options$removeCloseP === undefined ? 0 : _options$removeCloseP,
        _options$invert = options.invert,
        invert = _options$invert === undefined ? false : _options$invert,
        _options$maxEquals = options.maxEquals,
        maxEquals = _options$maxEquals === undefined ? 2 : _options$maxEquals;

    var image = this;
    this.checkProcessable('localMaxima', {
        bitDepth: [8, 16],
        components: 1
    });
    region *= 4;

    var maskExpectedValue = invert ? 0 : 1;

    var dx = [+1, 0, -1, 0, +1, +1, -1, -1, +2, 0, -2, 0, +2, +2, -2, -2];
    var dy = [0, +1, 0, -1, +1, -1, +1, -1, 0, +2, 0, -2, +2, -2, +2, -2];
    var shift = region <= 8 ? 1 : 2;
    var points = [];
    for (var currentY = shift; currentY < image.height - shift; currentY++) {
        for (var currentX = shift; currentX < image.width - shift; currentX++) {
            if (mask && mask.getBitXY(currentX, currentY) !== maskExpectedValue) {
                continue;
            }
            var counter = 0;
            var nbEquals = 0;
            var currentValue = image.data[currentX + currentY * image.width];
            for (var dir = 0; dir < region; dir++) {
                if (invert) {
                    // we search for minima
                    if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] > currentValue) {
                        counter++;
                    }
                } else {
                    if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] < currentValue) {
                        counter++;
                    }
                }
                if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] === currentValue) {
                    nbEquals++;
                }
            }
            if (counter + nbEquals === region && nbEquals <= maxEquals) {
                points.push([currentX, currentY]);
            }
        }
    }
    // TODO How to make a more performant and general way
    // we don't deal correctly here with groups of points that should be grouped if at the
    // beginning one of them is closer to another
    // Seems that we would ened to calculate a matrix and then split this matrix in 'independant matrices'
    // Or to assign a cluster to each point and regroup them if 2 clusters are close to each other
    // later approach seems much better
    if (removeClosePoints > 0) {
        for (var i = 0; i < points.length; i++) {
            for (var j = i + 1; j < points.length; j++) {
                if (Math.sqrt(Math.pow(points[i][0] - points[j][0], 2) + Math.pow(points[i][1] - points[j][1], 2)) < removeClosePoints) {
                    points[i][0] = points[i][0] + points[j][0] >> 1;
                    points[i][1] = points[i][1] + points[j][1] >> 1;
                    points.splice(j, 1);
                    j--;
                }
            }
        }
    }
    return points;
}

/**
 * Returns an array with the average value of each channel
 * @memberof Image
 * @instance
 * @return {number[]} Array having has size the number of channels
 */
function mean$2() {
    var histograms = this.getHistograms({ maxSlots: this.maxValue + 1 });
    var result = new Array(histograms.length);
    for (var c = 0; c < histograms.length; c++) {
        var histogram = histograms[c];
        result[c] = mean$1(histogram);
    }
    return result;
}

/**
 * Returns an array with the median value of each channel
 * @memberof Image
 * @instance
 * @return {number[]} Array having has size the number of channels
 */
function median$3() {
    var histograms = this.getHistograms({ maxSlots: this.maxValue + 1 });
    var result = new Array(histograms.length);
    for (var c = 0; c < histograms.length; c++) {
        var histogram = histograms[c];
        result[c] = median$2(histogram);
    }
    return result;
}

/**
 * Allows to generate an array of points for a binary image (bit depth = 1)
 * @memberof Image
 * @instance
 * @return {Array<Array<number>>} - an array of [x,y] corresponding to the set pixels in the binary image
 */
function points() {
    this.checkProcessable('points', {
        bitDepth: [1]
    });

    var pixels = new Array(this.size);
    var counter = 0;
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            if (this.getBitXY(x, y) === 1) {
                pixels[counter++] = [x, y];
            }
        }
    }
    pixels.length = counter;
    return pixels;
}

/**
 * An image may be derived from another image either by a crop
 * or because it is a ROI (region of interest)
 * Also a region of interest can be reprocessed to generated another
 * set of region of interests.
 * It is therefore important to keep the hierarchy of images to know
 * which image is derived from which one and be able to get the
 * relative position of one image in another
 * This methods takes care of this.
 * @memberof Image
 * @instance
 * @param {Image} targetImage
 * @param {object} [options={}]
 * @param {boolean} [options.defaultFurther=false] If set to true and no parent found returns the relative position
 *      to the further parent
 * @return {number[]|boolean}
 */
function getRelativePosition(targetImage) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (this === targetImage) {
        return [0, 0];
    }
    var position = [0, 0];

    var currentImage = this;
    while (currentImage) {
        if (currentImage === targetImage) {
            return position;
        }
        if (currentImage.position) {
            position[0] += currentImage.position[0];
            position[1] += currentImage.position[1];
        }
        currentImage = currentImage.parent;
    }
    // we should never reach this place, this means we could not find the parent
    // throw Error('Parent image was not found, can not get relative position.')
    if (options.defaultFurther) return position;

    return false;
}

/**
 * TODO would be suprised if this stuff works
 * @memberof Image
 * @instance
 * @return {object} SVD result
 */
function getSvd() {
    this.checkProcessable('getSvd', {
        bitDepth: [1]
    });

    return SingularValueDecomposition(this.points);
}

/**
 * Returns the number of transparent pixels
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {number} [options.alpha=1] - Value of the alpha value to count.
 * @return {number} Number of transparent pixels
 */
function countAlphaPixels() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$alpha = options.alpha,
        alpha = _options$alpha === undefined ? 1 : _options$alpha;

    this.checkProcessable('countAlphaPixels', {
        bitDepth: [8, 16],
        alpha: 1
    });

    var count = 0;

    if (alpha !== undefined) {
        for (var i = this.components; i < this.data.length; i += this.channels) {
            if (this.data[i] === alpha) {
                count++;
            }
        }
        return count;
    } else {
        // because there is an alpha channel all the pixels have an alpha
        return this.size;
    }
}

/**
 * Computes the convex hull of a binary image using Andrew's Monotone Chain Algorithm
 * http://www.algorithmist.com/index.php/Monotone_Chain_Convex_Hull
 * @param {Array<Array<number>>} points - An array of points (two elements arrays)
 * @param {object} [options]
 * @param {boolean} [options.sorted=false]
 * @return {Array<Array<number>>} Coordinates of the convex hull in clockwise order
 */
function monotoneChainConvexHull$1(points, options = {}) {
    if (!options.sorted) {
        points.sort(byXThenY);
    }

    const n = points.length;
    const result = new Array(n * 2);
    var k = 0;

    for (var i = 0; i < n; i++) {
        const point = points[i];
        while (k >= 2 && cw(result[k - 2], result[k - 1], point) <= 0) {
            k--;
        }
        result[k++] = point;
    }

    const t = k + 1;
    for (i = n - 2; i >= 0; i--) {
        const point = points[i];
        while (k >= t && cw(result[k - 2], result[k - 1], point) <= 0) {
            k--;
        }
        result[k++] = point;
    }

    return result.slice(0, k - 1);
}

function cw(p1, p2, p3) {
    return (p2[1] - p1[1]) * (p3[0] - p1[0]) - (p2[0] - p1[0]) * (p3[1] - p1[1]);
}

function byXThenY(point1, point2) {
    if (point1[0] === point2[0]) {
        return point1[1] - point2[1];
    }
    return point1[0] - point2[0];
}

/**
 * Returns the convex hull of a binary image
 * @memberof Image
 * @instance
 * @return {Array<Array<number>>}
 */
function monotoneChainConvexHull() {
  var image = this;
  image.checkProcessable('monotoneChainConvexHull', { bitDepth: 1 });

  var points = image.getPoints();

  return monotoneChainConvexHull$1(points, { sorted: true });
}

/**
 * Rounds all the x and y values of an array of points
 * @param {Array<Array<number>>} points
 * @return {Array<Array<number>>} modified input value
 * @private
 */


/**
 * Calculates a new point that is the difference p1 - p2
 * @param {Array<number>} p1
 * @param {Array<number>} p2
 * @return {Array<number>}
 * @private
 */
function difference(p1, p2) {
    return [p1[0] - p2[0], p1[1] - p2[1]];
}

/**
 * Normalize a point
 * @param {Array<number>} p
 * @return {Array<number>}
 * @private
 */
function normalize(p) {
    var length = Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
    return [p[0] / length, p[1] / length];
}

/**
 * We rotate an array of points
 * @param {number} radians
 * @param {Array<Array<number>>} srcPoints
 * @param {Array<Array<number>>} destPoints
 * @return {Array<Array<number>>}
 * @private
 */
function rotate$1(radians, srcPoints, destPoints) {
    if (destPoints === undefined) destPoints = new Array(srcPoints.length);
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    for (var i = 0; i < destPoints.length; ++i) {
        destPoints[i] = [cos * srcPoints[i][0] - sin * srcPoints[i][1], sin * srcPoints[i][0] + cos * srcPoints[i][1]];
    }
    return destPoints;
}

/**
 * Dot products of 2 points assuming vectors starting from (0,0)
 * @param {Array<number>} p1
 * @param {Array<number>} p2
 * @return {number}
 * @private
 */


/**
 * Returns the angle between 3 points. The first one is a common point
 * @param {Array<number>} origin
 * @param {Array<number>} p1
 * @param {Array<number>} p2
 * @return {number}
 * @private
 */


/**
 * Returns the 4 points of an horizontal rectangle that includes all the points
 * @param {Array<Array<number>>} points
 * @return {Array<Array<number>>}
 * @private
 */


/**
 * Returns 2 points with minimal and maximal XY
 * @param {Array<Array<number>>} points
 * @return {Array<Array<number>>}
 * @private
 */


/**
 * Moves the minX, minY to 0,0
 * All the points will be positive after this move
 * @param {Array<Array<number>>} srcPoints
 * @param {Array<Array<number>>} destPoints
 * @return {Array<Array<number>>}
 * @private
 */

/**
 * Computes the minimum bounding box around a binary image
 * https://www.researchgate.net/profile/Lennert_Den_Boer2/publication/303783472_A_Fast_Algorithm_for_Generating_a_Minimal_Bounding_Rectangle/links/5751a14108ae6807fafb2aa5.pdf
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {Array<Array<number>>} [options.originalPoints]
 * @return {Array<Array<number>>}
 */
function minimalBoundingRectangle() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$originalPoin = options.originalPoints,
        originalPoints = _options$originalPoin === undefined ? monotoneChainConvexHull.call(this) : _options$originalPoin;


    if (originalPoints.length === 0) {
        return [];
    }

    if (originalPoints.length === 1) {
        return [originalPoints[0], originalPoints[0], originalPoints[0], originalPoints[0]];
    }

    var p = new Array(originalPoints.length);

    var minSurface = +Infinity;
    var minSurfaceAngle = 0;
    var mbr = void 0;

    for (var i = 0; i < p.length; i++) {
        var angle$$1 = getAngle(originalPoints[i], originalPoints[(i + 1) % p.length]);

        rotate$1(-angle$$1, originalPoints, p);

        // we rotate and translate so that this axe is in the bottom
        var aX = p[i][0];
        var aY = p[i][1];
        var bX = p[(i + 1) % p.length][0];
        var bY = p[(i + 1) % p.length][1];

        var tUndefined = true;
        var tMin = 0;
        var tMax = 0;
        var maxWidth = 0;
        for (var j = 0; j < p.length; j++) {
            var cX = p[j][0];
            var cY = p[j][1];
            var t = (cX - aX) / (bX - aX);
            if (tUndefined === true) {
                tUndefined = false;
                tMin = t;
                tMax = t;
            } else {
                if (t < tMin) tMin = t;
                if (t > tMax) tMax = t;
            }
            var width = (-(bX - aX) * cY + bX * aY - bY * aX) / (bX - aX);

            if (Math.abs(width) > Math.abs(maxWidth)) maxWidth = width;
        }
        var pMin = [aX + tMin * (bX - aX), aY];
        var pMax = [aX + tMax * (bX - aX), aY];

        var currentSurface = Math.abs(maxWidth * (tMin - tMax) * (bX - aX));

        if (currentSurface < minSurface) {
            minSurfaceAngle = angle$$1;
            minSurface = currentSurface;
            mbr = [pMin, pMax, [pMax[0], pMax[1] - maxWidth], [pMin[0], pMin[1] - maxWidth]];
        }
    }
    rotate$1(minSurfaceAngle, mbr, mbr);
    return mbr;
}

// the angle that allows to make the line going through p1 and p2 horizontal
// this is an optimized version because it assume one vector is horizontal
function getAngle(p1, p2) {
    var diff = difference(p2, p1);
    var vector = normalize(diff);
    var angle$$1 = Math.acos(vector[0]);
    if (vector[1] < 0) return -angle$$1;
    return angle$$1;
}

// filters
// transforms
// utility
// operators
// computers
function extend$1(Image) {
    var inPlace = { inPlace: true };

    Image.extendMethod('invertGetSet', invert, inPlace);
    Image.extendMethod('invertIterator', invertIterator, inPlace);
    Image.extendMethod('invertPixel', invertPixel, inPlace);
    Image.extendMethod('invertOneLoop', invertOneLoop, inPlace);
    Image.extendMethod('invertApply', invertApply, inPlace);
    Image.extendMethod('invert', invert$1, inPlace);
    Image.extendMethod('invertBinaryLoop', invertBinaryLoop, inPlace);
    Image.extendMethod('level', level, inPlace);
    Image.extendMethod('add', add, inPlace);
    Image.extendMethod('subtract', subtract, inPlace);
    Image.extendMethod('multiply', multiply, inPlace);
    Image.extendMethod('divide', divide, inPlace);
    Image.extendMethod('hypotenuse', hypotenuse$1);
    Image.extendMethod('background', background);
    Image.extendMethod('flipX', flipX);
    Image.extendMethod('flipY', flipY);

    Image.extendMethod('blurFilter', blurFilter);
    Image.extendMethod('medianFilter', medianFilter);
    Image.extendMethod('gaussianFilter', gaussianFilter);
    Image.extendMethod('sobelFilter', sobelFilter);

    Image.extendMethod('crop', crop);
    Image.extendMethod('cropAlpha', cropAlpha);
    Image.extendMethod('scale', scale$1);
    Image.extendMethod('hsv', hsv);
    Image.extendMethod('hsl', hsl);
    Image.extendMethod('cmyk', cmyk);
    Image.extendMethod('rgba8', rgba8);
    Image.extendMethod('grey', grey).extendMethod('gray', grey);
    Image.extendMethod('mask', mask);
    Image.extendMethod('pad', pad);
    Image.extendMethod('colorDepth', colorDepth);
    Image.extendMethod('setBorder', setBorder, inPlace);
    Image.extendMethod('rotate', rotate);
    Image.extendMethod('rotateLeft', rotateLeft);
    Image.extendMethod('rotateRight', rotateRight);

    Image.extendMethod('getRow', getRow);
    Image.extendMethod('getColumn', getColumn);
    Image.extendMethod('getMatrix', getMatrix);
    Image.extendMethod('setMatrix', setMatrix);
    Image.extendMethod('getPixelsArray', getPixelsArray);
    Image.extendMethod('getIntersection', getIntersection);
    Image.extendMethod('getClosestCommonParent', getClosestCommonParent);

    Image.extendMethod('split', split);
    Image.extendMethod('getChannel', getChannel);
    Image.extendMethod('combineChannels', combineChannels);
    Image.extendMethod('setChannel', setChannel);
    Image.extendMethod('getSimilarity', getSimilarity);
    Image.extendMethod('getPixelsGrid', getPixelsGrid);
    Image.extendMethod('getBestMatch', match);

    Image.extendMethod('cannyEdge', cannyEdge);
    Image.extendMethod('convolution', convolution);
    Image.extendMethod('convolutionFft', convolutionFft);
    Image.extendMethod('extract', extract);
    Image.extendMethod('floodFill', floodFill);
    Image.extendMethod('paintLabels', paintLabels, inPlace);
    Image.extendMethod('paintMasks', paintMasks, inPlace);
    Image.extendMethod('paintPoints', paintPoints, inPlace);
    Image.extendMethod('paintPolyline', paintPolyline, inPlace);
    Image.extendMethod('paintPolygon', paintPolygon, inPlace);

    Image.extendMethod('countAlphaPixels', countAlphaPixels);
    Image.extendMethod('monotoneChainConvexHull', monotoneChainConvexHull);
    Image.extendMethod('minimalBoundingRectangle', minimalBoundingRectangle);
    Image.extendMethod('getHistogram', getHistogram).extendProperty('histogram', getHistogram);
    Image.extendMethod('getHistograms', getHistograms).extendProperty('histograms', getHistograms);
    Image.extendMethod('getColorHistogram', getColorHistogram).extendProperty('colorHistogram', getColorHistogram);
    Image.extendMethod('getMin', min$1).extendProperty('min', min$1);
    Image.extendMethod('getMax', max$1).extendProperty('max', max$1);
    Image.extendMethod('getSum', sum).extendProperty('sum', sum);
    Image.extendMethod('getMoment', getMoment).extendProperty('moment', getMoment);
    Image.extendMethod('getLocalMaxima', localMaxima);
    Image.extendMethod('getMedian', median$3).extendProperty('median', median$3);
    Image.extendMethod('getMean', mean$2).extendProperty('mean', mean$2);
    Image.extendMethod('getPoints', points).extendProperty('points', points);
    Image.extendMethod('getRelativePosition', getRelativePosition);
    Image.extendMethod('getSvd', getSvd).extendProperty('svd', getSvd);
}

// those methods can only apply on binary images... but we will not lose time to check!
var bitMethods = {

    /**
     * Set a specific pixel using XY coordinates from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     */
    setBitXY(x, y) {
        var target = y * this.width + x;
        var shift = 7 - (target & 7);
        var slot = target >> 3;
        this.data[slot] |= 1 << shift;
    },

    /**
     * Clear (unset) a specific pixel using XY coordinates from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     */
    clearBitXY(x, y) {
        var target = y * this.width + x;
        var shift = 7 - (target & 7);
        var slot = target >> 3;
        this.data[slot] &= ~(1 << shift);
    },

    /**
     * Toggle (invert) a specific pixel using XY coordinates from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     */
    toggleBitXY(x, y) {
        var target = y * this.width + x;
        var shift = 7 - (target & 7);
        var slot = target >> 3;
        this.data[slot] ^= 1 << shift;
    },

    /**
     * Get the state of a specific pixel using XY coordinates from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     * @return {number} 0: bit is unset, 1: bit is set
     */
    getBitXY(x, y) {
        var target = y * this.width + x;
        var shift = 7 - (target & 7);
        var slot = target >> 3;
        return this.data[slot] & 1 << shift ? 1 : 0;
    },

    /**
     * Set a specific pixel from a binary image (mask)
     *
     * @memberof Image
     * @instance
     * @param {number} pixel - the pixel number which correspond to x * image.width + y
     */
    setBit(pixel) {
        var shift = 7 - (pixel & 7);
        var slot = pixel >> 3;
        this.data[slot] |= 1 << shift;
    },

    /**
     * Clear (unset) a specific pixel from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} pixel - the pixel number which correspond to x * image.width + y
     */
    clearBit(pixel) {
        var shift = 7 - (pixel & 7);
        var slot = pixel >> 3;
        this.data[slot] &= ~(1 << shift);
    },

    /**
     * Toggle (invert) a specific pixel from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} pixel - the pixel number which correspond to x * image.width + y
     */
    toggleBit(pixel) {
        var shift = 7 - (pixel & 7);
        var slot = pixel >> 3;
        this.data[slot] ^= 1 << shift;
    },

    /**
     * Get the state of a specific pixel using XY coordinates from a binary image (mask)
     * @memberof Image
     * @instance
     * @param {number} pixel - the pixel number which correspond to x * image.width + y
     * @return {number} 0: bit is unset, 1: bit is set
     */
    getBit(pixel) {
        var shift = 7 - (pixel & 7);
        var slot = pixel >> 3;
        return this.data[slot] & 1 << shift ? 1 : 0;
    }
};

var bitMethods$1 = function (Image) {
    for (var i in bitMethods) {
        Image.prototype[i] = bitMethods[i];
    }
};

// We calculate all the border length with the neighbours

function commonBorderLength(roiMap) {
    var data = roiMap.data;
    var dx = [+1, 0, -1, 0];
    var dy = [0, +1, 0, -1];

    var minMax = roiMap.minMax;
    var shift = -minMax.min;
    var max = minMax.max + shift;
    var borderInfo = [];
    for (var i = 0; i <= max; i++) {
        borderInfo.push(Object.create(null));
    }

    for (var x = 0; x < roiMap.width; x++) {
        for (var y = 0; y < roiMap.height; y++) {
            var target = x + y * roiMap.width;
            var currentRoiID = data[target];
            if (currentRoiID !== 0) {
                // each pixel may only contribute one time to a border
                var used = Object.create(null);
                var isBorder = false;
                for (var dir = 0; dir < 4; dir++) {
                    var newX = x + dx[dir];
                    var newY = y + dy[dir];
                    if (newX >= 0 && newY >= 0 && newX < roiMap.width && newY < roiMap.height) {
                        var neighbourRoiID = data[newX + newY * roiMap.width];
                        if (currentRoiID !== neighbourRoiID) {
                            isBorder = true;
                            if (neighbourRoiID !== 0 && used[neighbourRoiID] === undefined) {
                                used[neighbourRoiID] = true;
                                if (!borderInfo[neighbourRoiID + shift][currentRoiID]) {
                                    borderInfo[neighbourRoiID + shift][currentRoiID] = 1;
                                } else {
                                    borderInfo[neighbourRoiID + shift][currentRoiID]++;
                                }
                            }
                        }
                    } else {
                        isBorder = true;
                    }
                }
                // we will also add an information to specify the border length
                if (isBorder) {
                    if (!borderInfo[currentRoiID + shift][currentRoiID]) {
                        borderInfo[currentRoiID + shift][currentRoiID] = 1;
                    } else {
                        borderInfo[currentRoiID + shift][currentRoiID]++;
                    }
                }
            }
        }
    }

    // we convert now the result to an object for fast lookup and we will reshift the result
    var result = {};
    for (var _i = 0; _i < borderInfo.length; _i++) {
        if (Object.keys(borderInfo[_i]).length > 0) {
            result[_i - shift] = borderInfo[_i];
        }
    }
    return result;
}

/**
 * In place modification of the roiMap that joins regions of interest
 * @param {object} [options]
 * @param {string|function(object,number,number)} [options.algorithm='commonBorderLength'] algorithm used to decide which ROIs are merged.
 *      Current implemented algorithms are 'commonBorderLength' that use the parameters
 *      'minCommonBorderLength' and 'maxCommonBorderLength' as well as 'commonBorderRatio' that uses
 *      the parameters 'minCommonBorderRatio' and 'maxCommonBorderRatio'.
 * @param {number} [options.minCommonBorderLength=5] minimal common number of pixels for merging
 * @param {number} [options.maxCommonBorderLength=100] maximal common number of pixels for merging
 * @param {number} [options.minCommonBorderRatio=0.3] minimal common border ratio for merging
 * @param {number} [options.maxCommonBorderRatio=1] maximal common border ratio for merging
 * @return {this}
 */

function mergeRoi() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$algorithm = options.algorithm,
        algorithm = _options$algorithm === undefined ? 'commonBorderLength' : _options$algorithm,
        _options$minCommonBor = options.minCommonBorderLength,
        minCommonBorderLength = _options$minCommonBor === undefined ? 5 : _options$minCommonBor,
        _options$maxCommonBor = options.maxCommonBorderLength,
        maxCommonBorderLength = _options$maxCommonBor === undefined ? 100 : _options$maxCommonBor,
        _options$minCommonBor2 = options.minCommonBorderRatio,
        minCommonBorderRatio = _options$minCommonBor2 === undefined ? 0.3 : _options$minCommonBor2,
        _options$maxCommonBor2 = options.maxCommonBorderRatio,
        maxCommonBorderRatio = _options$maxCommonBor2 === undefined ? 1 : _options$maxCommonBor2;


    var checkFunction = function checkFunction(currentInfo, currentID, neighbourID) {
        return currentInfo[neighbourID] >= minCommonBorderLength && currentInfo[neighbourID] <= maxCommonBorderLength;
    };
    if (typeof algorithm === 'function') {
        checkFunction = algorithm;
    }
    if (algorithm.toLowerCase() === 'commonborderratio') {
        checkFunction = function checkFunction(currentInfo, currentID, neighbourID) {
            var ratio = Math.min(currentInfo[neighbourID] / currentInfo[currentID], 1);
            return ratio >= minCommonBorderRatio && ratio <= maxCommonBorderRatio;
        };
    }
    var roiMap = this;
    var borderLengths = roiMap.commonBorderLength;
    var newMap = {};
    var oldToNew = {};

    for (var currentID of Object.keys(borderLengths)) {
        var currentInfo = borderLengths[currentID];
        var neighbourIDs = Object.keys(currentInfo);
        for (var neighbourID of neighbourIDs) {
            if (neighbourID !== currentID) {
                // it is not myself ...
                if (checkFunction(currentInfo, currentID, neighbourID)) {
                    // the common border are in the range. We should merge
                    var newNeighbourID = neighbourID;
                    if (oldToNew[neighbourID]) newNeighbourID = oldToNew[neighbourID];
                    var newCurrentID = currentID;
                    if (oldToNew[currentID]) newCurrentID = oldToNew[currentID];

                    if (Number(newNeighbourID) !== newCurrentID) {
                        var smallerID = Math.min(newNeighbourID, newCurrentID);
                        var largerID = Math.max(newNeighbourID, newCurrentID);

                        if (!newMap[smallerID]) {
                            newMap[smallerID] = {};
                        }
                        newMap[smallerID][largerID] = true;
                        oldToNew[largerID] = smallerID;
                        if (newMap[largerID]) {
                            // need to put everything to smallerID and remove property
                            for (var id of Object.keys(newMap[largerID])) {
                                newMap[smallerID][id] = true;
                                oldToNew[id] = smallerID;
                            }
                            delete newMap[largerID];
                        }
                    }
                }
            }
        }
    }

    var minMax = roiMap.minMax;
    var shift = -minMax.min;
    var max = minMax.max + shift;
    var oldToNewArray = new Array(max + 1).fill(0);
    for (var key of Object.keys(oldToNew)) {
        oldToNewArray[Number(key) + shift] = oldToNew[key];
    }
    // time to change the roiMap
    var data = roiMap.data;
    for (var i = 0; i < data.length; i++) {
        var currentValue = data[i];
        if (currentValue !== 0) {
            var newValue = oldToNewArray[currentValue + shift];
            if (newValue !== 0) {
                data[i] = newValue;
            }
        }
    }

    roiMap.computed = {};
    return roiMap;
}

/**
 * The roiMap is an array of the size of the original image data that contains
 * positive and negative numbers. When the number is common, it corresponds
 * to one region of interest (ROI)
 *
 * @class RoiMap
 * @private
 */
class RoiMap {
    constructor(parent, data) {
        this.parent = parent;
        this.width = parent.width;
        this.height = parent.height;
        this.data = data;
        this.negative = 0;
        this.positive = 0;
        this.computed = {};
    }

    get total() {
        return this.negative + this.positive;
    }

    get minMax() {
        if (this.computed.minMax) return this.computed.minMax;
        var min = Number.MAX_SAFE_INTEGER;
        var max = Number.MIN_SAFE_INTEGER;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i] < min) min = this.data[i];
            if (this.data[i] > max) max = this.data[i];
        }
        return this.computed.minMax = { min, max };
    }

    get commonBorderLength() {
        return commonBorderLength(this);
    }

    mergeRoi() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return mergeRoi.call(this, options);
    }

    rowsInfo() {
        var rowsInfo = new Array(this.height);
        var currentRow = 0;
        for (var i = 0; i < this.data.length; i += this.width) {
            var info = {
                row: currentRow,
                positivePixel: 0,
                negativePixel: 0,
                zeroPixel: 0,
                positiveRoi: 0,
                negativeRoi: 0,
                medianChange: 0
            };
            rowsInfo[currentRow++] = info;
            var positives = {};
            var negatives = {};
            var changes = [];
            var previous = this.data[i];
            var current = 0;
            for (var j = i; j < i + this.width; j++) {
                var value = this.data[j];
                if (previous !== value) {
                    previous = value;
                    changes.push(current);
                    current = 0;
                }
                current++;
                if (value > 0) {
                    info.positivePixel++;
                    if (!positives[value]) {
                        positives[value] = true;
                    }
                } else if (value < 0) {
                    info.negativePixel++;
                    if (!negatives[value]) {
                        negatives[value] = true;
                    }
                } else {
                    info.zeroPixel++;
                }
            }
            changes.push(current);
            // TODO use median package
            info.medianChange = changes.sort((a, b) => a - b)[Math.floor(changes.length / 2)];
            info.positiveRoiIDs = Object.keys(positives);
            info.negativeRoiIDs = Object.keys(negatives);
            info.positiveRoi = info.positiveRoiIDs.length;
            info.negativeRoi = info.negativeRoiIDs.length;
        }
        return rowsInfo;
    }

    colsInfo() {
        var colsInfo = new Array(this.width);
        var currentCol = 0;
        for (var i = 0; i < this.width; i++) {
            var info = {
                col: currentCol,
                positivePixel: 0,
                negativePixel: 0,
                zeroPixel: 0,
                positiveRoi: 0,
                negativeRoi: 0,
                medianChange: 0
            };
            colsInfo[currentCol++] = info;
            var positives = {};
            var negatives = {};
            var changes = [];
            var previous = this.data[i];
            var current = 0;
            for (var j = i; j < i + this.data.length; j += this.width) {
                var value = this.data[j];
                if (previous !== value) {
                    previous = value;
                    changes.push(current);
                    current = 0;
                }
                current++;
                if (value > 0) {
                    info.positivePixel++;
                    if (!positives[value]) {
                        positives[value] = true;
                    }
                } else if (value < 0) {
                    info.negativePixel++;
                    if (!negatives[value]) {
                        negatives[value] = true;
                    }
                } else {
                    info.zeroPixel++;
                }
            }
            changes.push(current);
            // TODO use median package
            info.medianChange = changes.sort((a, b) => a - b)[Math.floor(changes.length / 2)];
            info.positiveRoiIDs = Object.keys(positives);
            info.negativeRoiIDs = Object.keys(negatives);
            info.positiveRoi = info.positiveRoiIDs.length;
            info.negativeRoi = info.negativeRoiIDs.length;
        }
        return colsInfo;
    }

}

/**
 * @memberof RoiManager
 * @instance
 * @param {Image} mask
 * @param {object} [options]
 * @return {RoiMap}
 */
function fromMask(mask) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$allowCorners = options.allowCorners,
        allowCorners = _options$allowCorners === undefined ? false : _options$allowCorners;


    var MAX_ARRAY = 0x00ffff; // 65535 should be enough for most of the cases

    // based on a binary image we will create plenty of small images
    var data = new Int16Array(mask.size); // maxValue: 32767, minValue: -32768

    // split will always return an array of images
    var positiveID = 0;
    var negativeID = 0;

    var xToProcess = new Uint16Array(MAX_ARRAY + 1); // assign dynamically ????
    var yToProcess = new Uint16Array(MAX_ARRAY + 1); // mask +1 is of course mandatory !!!


    for (var x = 0; x < mask.width; x++) {
        for (var y = 0; y < mask.height; y++) {
            if (data[y * mask.width + x] === 0) {
                // need to process the whole surface
                analyseSurface(x, y);
            }
        }
    }

    function analyseSurface(x, y) {
        var from = 0;
        var to = 0;
        var targetState = mask.getBitXY(x, y);
        var id = targetState ? ++positiveID : --negativeID;
        if (positiveID > 32767 || negativeID < -32768) throw new Error('Too many regions of interest');
        xToProcess[0] = x;
        yToProcess[0] = y;
        while (from <= to) {
            var currentX = xToProcess[from & MAX_ARRAY];
            var currentY = yToProcess[from & MAX_ARRAY];
            data[currentY * mask.width + currentX] = id;
            // need to check all around mask pixel
            if (currentX > 0 && data[currentY * mask.width + currentX - 1] === 0 && mask.getBitXY(currentX - 1, currentY) === targetState) {
                // LEFT
                to++;
                xToProcess[to & MAX_ARRAY] = currentX - 1;
                yToProcess[to & MAX_ARRAY] = currentY;
                data[currentY * mask.width + currentX - 1] = -32768;
            }
            if (currentY > 0 && data[(currentY - 1) * mask.width + currentX] === 0 && mask.getBitXY(currentX, currentY - 1) === targetState) {
                // TOP
                to++;
                xToProcess[to & MAX_ARRAY] = currentX;
                yToProcess[to & MAX_ARRAY] = currentY - 1;
                data[(currentY - 1) * mask.width + currentX] = -32768;
            }
            if (currentX < mask.width - 1 && data[currentY * mask.width + currentX + 1] === 0 && mask.getBitXY(currentX + 1, currentY) === targetState) {
                // RIGHT
                to++;
                xToProcess[to & MAX_ARRAY] = currentX + 1;
                yToProcess[to & MAX_ARRAY] = currentY;
                data[currentY * mask.width + currentX + 1] = -32768;
            }
            if (currentY < mask.height - 1 && data[(currentY + 1) * mask.width + currentX] === 0 && mask.getBitXY(currentX, currentY + 1) === targetState) {
                // BOTTOM
                to++;
                xToProcess[to & MAX_ARRAY] = currentX;
                yToProcess[to & MAX_ARRAY] = currentY + 1;
                data[(currentY + 1) * mask.width + currentX] = -32768;
            }
            if (allowCorners) {
                if (currentX > 0 && currentY > 0 && data[(currentY - 1) * mask.width + currentX - 1] === 0 && mask.getBitXY(currentX - 1, currentY - 1) === targetState) {
                    // TOP LEFT
                    to++;
                    xToProcess[to & MAX_ARRAY] = currentX - 1;
                    yToProcess[to & MAX_ARRAY] = currentY - 1;
                    data[(currentY - 1) * mask.width + currentX - 1] = -32768;
                }
                if (currentX < mask.width - 1 && currentY > 0 && data[(currentY - 1) * mask.width + currentX + 1] === 0 && mask.getBitXY(currentX + 1, currentY - 1) === targetState) {
                    // TOP RIGHT
                    to++;
                    xToProcess[to & MAX_ARRAY] = currentX + 1;
                    yToProcess[to & MAX_ARRAY] = currentY - 1;
                    data[(currentY - 1) * mask.width + currentX + 1] = -32768;
                }
                if (currentX > 0 && currentY < mask.height - 1 && data[(currentY + 1) * mask.width + currentX - 1] === 0 && mask.getBitXY(currentX - 1, currentY + 1) === targetState) {
                    // BOTTOM LEFT
                    to++;
                    xToProcess[to & MAX_ARRAY] = currentX - 1;
                    yToProcess[to & MAX_ARRAY] = currentY + 1;
                    data[(currentY + 1) * mask.width + currentX - 1] = -32768;
                }
                if (currentX < mask.width - 1 && currentY < mask.height - 1 && data[(currentY + 1) * mask.width + currentX + 1] === 0 && mask.getBitXY(currentX + 1, currentY + 1) === targetState) {
                    // BOTTOM RIGHT
                    to++;
                    xToProcess[to & MAX_ARRAY] = currentX + 1;
                    yToProcess[to & MAX_ARRAY] = currentY + 1;
                    data[(currentY + 1) * mask.width + currentX + 1] = -32768;
                }
            }

            from++;

            if (to - from > MAX_ARRAY) {
                throw new Error('analyseMask can not finish, the array to manage internal data is not big enough.' + 'You could improve mask by changing MAX_ARRAY');
            }
        }
    }
    return new RoiMap(mask, data);
}

/**
 * @class DisjointSet
 */
class DisjointSet {
    constructor() {
        this.nodes = new Map();
    }

    /**
     * Adds an element as a new set
     * @param {*} value
     * @return {DisjointSetNode} Object holding the element
     */
    add(value) {
        var node = this.nodes.get(value);
        if (!node) {
            node = new DisjointSetNode(value);
            this.nodes.set(value, node);
        }
        return node;
    }

    /**
     * Merges the sets that contain x and y
     * @param {DisjointSetNode} x
     * @param {DisjointSetNode} y
     */
    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX === rootY) {
            return;
        }
        if (rootX.rank < rootY.rank) {
            rootX.parent = rootY;
        } else if (rootX.rank > rootY.rank) {
            rootY.parent = rootX;
        } else {
            rootY.parent = rootX;
            rootX.rank++;
        }
    }

    /**
     * Finds and returns the root node of the set that contains node
     * @param {DisjointSetNode} node
     * @return {DisjointSetNode}
     */
    find(node) {
        var rootX = node;
        while (rootX.parent !== null) {
            rootX = rootX.parent;
        }
        var toUpdateX = node;
        while (toUpdateX.parent !== null) {
            var toUpdateParent = toUpdateX;
            toUpdateX = toUpdateX.parent;
            toUpdateParent.parent = rootX;
        }
        return rootX;
    }

    /**
     * Returns true if x and y belong to the same set
     * @param {DisjointSetNode} x
     * @param {DisjointSetNode} y
     */
    connected(x, y) {
        return this.find(x) === this.find(y);
    }
}

var DisjointSet_1 = DisjointSet;

function DisjointSetNode(value) {
    this.value = value;
    this.parent = null;
    this.rank = 0;
}

/*
This algorithm is nice and is therefore kept here
However it seems to be slower than the get mask and
also provides only the positive ROI
We therefore don't expose it in the roiManager
 */

var direction4X = [-1, 0];
var direction4Y = [0, -1];
var neighbours4 = [null, null];

var direction8X = [-1, -1, 0, 1];
var direction8Y = [0, -1, -1, -1];
var neighbours8 = [null, null, null, null];

/*
Implementation of the connected-component labeling algorithm
 */
function fromMaskConnectedComponentLabelingAlgorithm(mask) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _options$allowCorners = options.allowCorners,
        allowCorners = _options$allowCorners === undefined ? false : _options$allowCorners;

    var neighbours = 4;
    if (allowCorners) {
        neighbours = 8;
    }

    var directionX = void 0;
    var directionY = void 0;
    var neighboursList = void 0;
    if (neighbours === 8) {
        directionX = direction8X;
        directionY = direction8Y;
        neighboursList = neighbours8;
    } else if (neighbours === 4) {
        directionX = direction4X;
        directionY = direction4Y;
        neighboursList = neighbours4;
    } else {
        throw new RangeError('unsupported neighbours count: ' + neighbours);
    }

    var size = mask.size;
    var width = mask.width;
    var height = mask.height;
    var labels = new Array(size);
    var data = new Uint32Array(size);
    var linked = new DisjointSet_1();

    var currentLabel = 1;
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            // true means out of background
            var index = i + j * width;
            if (mask.getBit(index)) {
                var smallestNeighbour = null;
                for (var k = 0; k < neighboursList.length; k++) {
                    var ii = i + directionX[k];
                    var jj = j + directionY[k];
                    if (ii >= 0 && jj >= 0 && ii < width && jj < height) {
                        var _index = ii + jj * width;
                        var neighbour = labels[_index];
                        if (!neighbour) {
                            neighboursList[k] = null;
                        } else {
                            neighboursList[k] = neighbour;
                            if (!smallestNeighbour || neighboursList[k].value < smallestNeighbour.value) {
                                smallestNeighbour = neighboursList[k];
                            }
                        }
                    }
                }
                if (!smallestNeighbour) {
                    labels[index] = linked.add(currentLabel++);
                } else {
                    labels[index] = smallestNeighbour;
                    for (var _k = 0; _k < neighboursList.length; _k++) {
                        if (neighboursList[_k] && neighboursList[_k] !== smallestNeighbour) {
                            linked.union(smallestNeighbour, neighboursList[_k]);
                        }
                    }
                }
            }
        }
    }

    for (var _j = 0; _j < height; _j++) {
        for (var _i = 0; _i < width; _i++) {
            var _index2 = _i + _j * width;
            if (mask.getBit(_index2)) {
                data[_index2] = linked.find(labels[_index2]).value;
            }
        }
    }

    return new RoiMap(mask, data);
}

/**
 * @memberof RoiManager
 * @instance
 * @param {object} [options]
 * @param {boolean} [options.allowCorner=true]
 * @param {boolean} [options.onlyTop=false]
 * @param {boolean} [options.invert=false]
 * @return {RoiMap}
 */
function fromMaxima() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _options$allowCorner = options.allowCorner,
        allowCorner = _options$allowCorner === undefined ? true : _options$allowCorner,
        _options$onlyTop = options.onlyTop,
        onlyTop = _options$onlyTop === undefined ? false : _options$onlyTop,
        _options$invert = options.invert,
        invert = _options$invert === undefined ? false : _options$invert;


    var image = this;
    image.checkProcessable('fromMaxima', { components: [1] });

    var PROCESS_TOP = 1;
    var PROCESS_NORMAL = 2;

    // split will always return an array of images
    var positiveID = 0;
    var negativeID = 0;

    var data = new Int16Array(image.size); // maxValue: 32767, minValue: -32768
    var processed = new Int8Array(image.size);
    var variations = new Float32Array(image.size);

    var MAX_ARRAY = 0x0fffff; // should be enough for most of the cases
    var xToProcess = new Uint16Array(MAX_ARRAY + 1); // assign dynamically ????
    var yToProcess = new Uint16Array(MAX_ARRAY + 1); // mask +1 is of course mandatory !!!


    var from = 0;
    var to = 0;

    var xToProcessTop = new Uint16Array(MAX_ARRAY + 1); // assign dynamically ????
    var yToProcessTop = new Uint16Array(MAX_ARRAY + 1); // mask +1 is of course mandatory !!!

    var fromTop = 0;
    var toTop = 0;

    appendMaxima(image, { maxima: !invert });

    while (from < to) {
        var currentX = xToProcess[from & MAX_ARRAY];
        var currentY = yToProcess[from & MAX_ARRAY];
        process(currentX, currentY, PROCESS_NORMAL);
        from++;
    }

    return new RoiMap(image, data);

    // we will look for the maxima (or minima) that is present in the picture
    // a maxima is a point that is surrounded by lower values
    // should deal with allowCorner and invert
    function appendMaxima(_ref) {
        var _ref$maxima = _ref.maxima,
            maxima = _ref$maxima === undefined ? true : _ref$maxima;

        for (var y = 1; y < image.height - 1; y++) {
            for (var x = 1; x < image.width - 1; x++) {
                var index = x + y * image.width;
                if (processed[index] === 0) {
                    var currentValue = maxima ? image.data[index] : -image.data[x + y * image.width];
                    if (image.data[y * image.width + x - 1] > currentValue) {
                        // LEFT
                        continue;
                    }
                    if (image.data[y * image.width + x + 1] > currentValue) {
                        // RIGHT
                        continue;
                    }
                    if (image.data[(y - 1) * image.width + x] > currentValue) {
                        // TOP
                        continue;
                    }
                    if (image.data[(y + 1) * image.width + x] > currentValue) {
                        // BOTTOM
                        continue;
                    }
                    if (allowCorner) {
                        if (image.data[(y - 1) * image.width + x - 1] > currentValue) {
                            // LEFT TOP
                            continue;
                        }
                        if (image.data[(y - 1) * image.width + x + 1] > currentValue) {
                            // RIGHT TOP
                            continue;
                        }
                        if (image.data[(y + 1) * image.width + x - 1] > currentValue) {
                            // LEFT BOTTOM
                            continue;
                        }
                        if (image.data[(y + 1) * image.width + x + 1] > currentValue) {
                            // RIGHT BOTTOM
                            continue;
                        }
                    }

                    data[index] = maxima ? ++positiveID : --negativeID;

                    var valid = processTop(x, y, PROCESS_TOP);
                    if (!valid) {
                        if (maxima) {
                            --positiveID;
                        } else {
                            ++negativeID;
                        }
                    }
                }
            }
        }
    }

    // we will try to get all the points of the top (same value)
    // and to check if the whole group is surrounded by lower value
    // as soon as one of them if not part we need to reverse the process
    // and just for get those points
    function processTop(xToProcess, yToProcess) {
        var currentTo = to; // in case if fails we come back
        fromTop = 0;
        toTop = 1;
        xToProcessTop[0] = xToProcess;
        yToProcessTop[0] = yToProcess;
        var valid = true;
        while (fromTop < toTop) {
            var _currentX = xToProcessTop[fromTop & MAX_ARRAY];
            var _currentY = yToProcessTop[fromTop & MAX_ARRAY];
            valid &= process(_currentX, _currentY, PROCESS_TOP);
            fromTop++;
        }
        if (!valid) {
            // need to clear all the calculated data because the top is not surrounded by negative values
            for (var i = 0; i < toTop; i++) {
                var _currentX2 = xToProcessTop[i & MAX_ARRAY];
                var _currentY2 = yToProcessTop[i & MAX_ARRAY];
                var index = _currentY2 * image.width + _currentX2;
                data[index] = 0;
            }
            to = currentTo;
        }
        return valid;
    }

    /*
     For a specific point we will check the points around, increase the area of interests and add
     them to the processing list
     type=0 : top
     type=1 : normal
     */
    function process(xCenter, yCenter, type) {
        var currentID = data[yCenter * image.width + xCenter];
        var currentValue = image.data[yCenter * image.width + xCenter];
        for (var y = yCenter - 1; y <= yCenter + 1; y++) {
            for (var x = xCenter - 1; x <= xCenter + 1; x++) {
                var index = y * image.width + x;
                if (processed[index] === 0) {
                    processed[index] = 1;
                    // we store the variation compare to the parent pixel
                    variations[index] = image.data[index] - currentValue;
                    switch (type) {
                        case PROCESS_TOP:
                            if (variations[index] === 0) {
                                // we look for maxima
                                // if we are next to a border ... it is not surrounded !
                                if (x === 0 || y === 0 || x === image.width - 1 || y === image.height - 1) {
                                    return false;
                                }
                                data[index] = currentID;
                                xToProcessTop[toTop & MAX_ARRAY] = x;
                                yToProcessTop[toTop & MAX_ARRAY] = y;
                                toTop++;
                            } else if (variations[index] > 0) {
                                // not a global maximum
                                return false;
                            } else {
                                // a point we will have to process
                                if (!onlyTop) {
                                    data[index] = currentID;
                                    xToProcess[to & MAX_ARRAY] = x;
                                    yToProcess[to & MAX_ARRAY] = y;
                                    to++;
                                }
                            }
                            break;
                        case PROCESS_NORMAL:
                            if (variations[index] <= 0) {
                                // we look for maxima
                                data[index] = currentID;
                                xToProcess[to & MAX_ARRAY] = x;
                                yToProcess[to & MAX_ARRAY] = y;
                                to++;
                            }
                            break;
                        default:
                            throw new Error('unreachable');
                    }
                }
            }
        }
        return true;
    }
}

var priorityQueue = createCommonjsModule(function (module, exports) {
(function(f){{module.exports=f();}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof commonjsRequire=="function"&&commonjsRequire;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r);}return n[o].exports}var i=typeof commonjsRequire=="function"&&commonjsRequire;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var AbstractPriorityQueue, ArrayStrategy, BHeapStrategy, BinaryHeapStrategy, PriorityQueue,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

AbstractPriorityQueue = _dereq_('./PriorityQueue/AbstractPriorityQueue');

ArrayStrategy = _dereq_('./PriorityQueue/ArrayStrategy');

BinaryHeapStrategy = _dereq_('./PriorityQueue/BinaryHeapStrategy');

BHeapStrategy = _dereq_('./PriorityQueue/BHeapStrategy');

PriorityQueue = (function(superClass) {
  extend(PriorityQueue, superClass);

  function PriorityQueue(options) {
    options || (options = {});
    options.strategy || (options.strategy = BinaryHeapStrategy);
    options.comparator || (options.comparator = function(a, b) {
      return (a || 0) - (b || 0);
    });
    PriorityQueue.__super__.constructor.call(this, options);
  }

  return PriorityQueue;

})(AbstractPriorityQueue);

PriorityQueue.ArrayStrategy = ArrayStrategy;

PriorityQueue.BinaryHeapStrategy = BinaryHeapStrategy;

PriorityQueue.BHeapStrategy = BHeapStrategy;

module.exports = PriorityQueue;


},{"./PriorityQueue/AbstractPriorityQueue":2,"./PriorityQueue/ArrayStrategy":3,"./PriorityQueue/BHeapStrategy":4,"./PriorityQueue/BinaryHeapStrategy":5}],2:[function(_dereq_,module,exports){
var AbstractPriorityQueue;

module.exports = AbstractPriorityQueue = (function() {
  function AbstractPriorityQueue(options) {
    var ref;
    if ((options != null ? options.strategy : void 0) == null) {
      throw 'Must pass options.strategy, a strategy';
    }
    if ((options != null ? options.comparator : void 0) == null) {
      throw 'Must pass options.comparator, a comparator';
    }
    this.priv = new options.strategy(options);
    this.length = (options != null ? (ref = options.initialValues) != null ? ref.length : void 0 : void 0) || 0;
  }

  AbstractPriorityQueue.prototype.queue = function(value) {
    this.length++;
    this.priv.queue(value);
    return void 0;
  };

  AbstractPriorityQueue.prototype.dequeue = function(value) {
    if (!this.length) {
      throw 'Empty queue';
    }
    this.length--;
    return this.priv.dequeue();
  };

  AbstractPriorityQueue.prototype.peek = function(value) {
    if (!this.length) {
      throw 'Empty queue';
    }
    return this.priv.peek();
  };

  AbstractPriorityQueue.prototype.clear = function() {
    this.length = 0;
    return this.priv.clear();
  };

  return AbstractPriorityQueue;

})();


},{}],3:[function(_dereq_,module,exports){
var ArrayStrategy, binarySearchForIndexReversed;

binarySearchForIndexReversed = function(array, value, comparator) {
  var high, low, mid;
  low = 0;
  high = array.length;
  while (low < high) {
    mid = (low + high) >>> 1;
    if (comparator(array[mid], value) >= 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

module.exports = ArrayStrategy = (function() {
  function ArrayStrategy(options) {
    var ref;
    this.options = options;
    this.comparator = this.options.comparator;
    this.data = ((ref = this.options.initialValues) != null ? ref.slice(0) : void 0) || [];
    this.data.sort(this.comparator).reverse();
  }

  ArrayStrategy.prototype.queue = function(value) {
    var pos;
    pos = binarySearchForIndexReversed(this.data, value, this.comparator);
    this.data.splice(pos, 0, value);
    return void 0;
  };

  ArrayStrategy.prototype.dequeue = function() {
    return this.data.pop();
  };

  ArrayStrategy.prototype.peek = function() {
    return this.data[this.data.length - 1];
  };

  ArrayStrategy.prototype.clear = function() {
    this.data.length = 0;
    return void 0;
  };

  return ArrayStrategy;

})();


},{}],4:[function(_dereq_,module,exports){
var BHeapStrategy;

module.exports = BHeapStrategy = (function() {
  function BHeapStrategy(options) {
    var arr, i, j, k, len, ref, ref1, shift, value;
    this.comparator = (options != null ? options.comparator : void 0) || function(a, b) {
      return a - b;
    };
    this.pageSize = (options != null ? options.pageSize : void 0) || 512;
    this.length = 0;
    shift = 0;
    while ((1 << shift) < this.pageSize) {
      shift += 1;
    }
    if (1 << shift !== this.pageSize) {
      throw 'pageSize must be a power of two';
    }
    this._shift = shift;
    this._emptyMemoryPageTemplate = arr = [];
    for (i = j = 0, ref = this.pageSize; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      arr.push(null);
    }
    this._memory = [];
    this._mask = this.pageSize - 1;
    if (options.initialValues) {
      ref1 = options.initialValues;
      for (k = 0, len = ref1.length; k < len; k++) {
        value = ref1[k];
        this.queue(value);
      }
    }
  }

  BHeapStrategy.prototype.queue = function(value) {
    this.length += 1;
    this._write(this.length, value);
    this._bubbleUp(this.length, value);
    return void 0;
  };

  BHeapStrategy.prototype.dequeue = function() {
    var ret, val;
    ret = this._read(1);
    val = this._read(this.length);
    this.length -= 1;
    if (this.length > 0) {
      this._write(1, val);
      this._bubbleDown(1, val);
    }
    return ret;
  };

  BHeapStrategy.prototype.peek = function() {
    return this._read(1);
  };

  BHeapStrategy.prototype.clear = function() {
    this.length = 0;
    this._memory.length = 0;
    return void 0;
  };

  BHeapStrategy.prototype._write = function(index, value) {
    var page;
    page = index >> this._shift;
    while (page >= this._memory.length) {
      this._memory.push(this._emptyMemoryPageTemplate.slice(0));
    }
    return this._memory[page][index & this._mask] = value;
  };

  BHeapStrategy.prototype._read = function(index) {
    return this._memory[index >> this._shift][index & this._mask];
  };

  BHeapStrategy.prototype._bubbleUp = function(index, value) {
    var compare, indexInPage, parentIndex, parentValue;
    compare = this.comparator;
    while (index > 1) {
      indexInPage = index & this._mask;
      if (index < this.pageSize || indexInPage > 3) {
        parentIndex = (index & ~this._mask) | (indexInPage >> 1);
      } else if (indexInPage < 2) {
        parentIndex = (index - this.pageSize) >> this._shift;
        parentIndex += parentIndex & ~(this._mask >> 1);
        parentIndex |= this.pageSize >> 1;
      } else {
        parentIndex = index - 2;
      }
      parentValue = this._read(parentIndex);
      if (compare(parentValue, value) < 0) {
        break;
      }
      this._write(parentIndex, value);
      this._write(index, parentValue);
      index = parentIndex;
    }
    return void 0;
  };

  BHeapStrategy.prototype._bubbleDown = function(index, value) {
    var childIndex1, childIndex2, childValue1, childValue2, compare;
    compare = this.comparator;
    while (index < this.length) {
      if (index > this._mask && !(index & (this._mask - 1))) {
        childIndex1 = childIndex2 = index + 2;
      } else if (index & (this.pageSize >> 1)) {
        childIndex1 = (index & ~this._mask) >> 1;
        childIndex1 |= index & (this._mask >> 1);
        childIndex1 = (childIndex1 + 1) << this._shift;
        childIndex2 = childIndex1 + 1;
      } else {
        childIndex1 = index + (index & this._mask);
        childIndex2 = childIndex1 + 1;
      }
      if (childIndex1 !== childIndex2 && childIndex2 <= this.length) {
        childValue1 = this._read(childIndex1);
        childValue2 = this._read(childIndex2);
        if (compare(childValue1, value) < 0 && compare(childValue1, childValue2) <= 0) {
          this._write(childIndex1, value);
          this._write(index, childValue1);
          index = childIndex1;
        } else if (compare(childValue2, value) < 0) {
          this._write(childIndex2, value);
          this._write(index, childValue2);
          index = childIndex2;
        } else {
          break;
        }
      } else if (childIndex1 <= this.length) {
        childValue1 = this._read(childIndex1);
        if (compare(childValue1, value) < 0) {
          this._write(childIndex1, value);
          this._write(index, childValue1);
          index = childIndex1;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return void 0;
  };

  return BHeapStrategy;

})();


},{}],5:[function(_dereq_,module,exports){
var BinaryHeapStrategy;

module.exports = BinaryHeapStrategy = (function() {
  function BinaryHeapStrategy(options) {
    var ref;
    this.comparator = (options != null ? options.comparator : void 0) || function(a, b) {
      return a - b;
    };
    this.length = 0;
    this.data = ((ref = options.initialValues) != null ? ref.slice(0) : void 0) || [];
    this._heapify();
  }

  BinaryHeapStrategy.prototype._heapify = function() {
    var i, j, ref;
    if (this.data.length > 0) {
      for (i = j = 1, ref = this.data.length; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
        this._bubbleUp(i);
      }
    }
    return void 0;
  };

  BinaryHeapStrategy.prototype.queue = function(value) {
    this.data.push(value);
    this._bubbleUp(this.data.length - 1);
    return void 0;
  };

  BinaryHeapStrategy.prototype.dequeue = function() {
    var last, ret;
    ret = this.data[0];
    last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._bubbleDown(0);
    }
    return ret;
  };

  BinaryHeapStrategy.prototype.peek = function() {
    return this.data[0];
  };

  BinaryHeapStrategy.prototype.clear = function() {
    this.length = 0;
    this.data.length = 0;
    return void 0;
  };

  BinaryHeapStrategy.prototype._bubbleUp = function(pos) {
    var parent, x;
    while (pos > 0) {
      parent = (pos - 1) >>> 1;
      if (this.comparator(this.data[pos], this.data[parent]) < 0) {
        x = this.data[parent];
        this.data[parent] = this.data[pos];
        this.data[pos] = x;
        pos = parent;
      } else {
        break;
      }
    }
    return void 0;
  };

  BinaryHeapStrategy.prototype._bubbleDown = function(pos) {
    var last, left, minIndex, right, x;
    last = this.data.length - 1;
    while (true) {
      left = (pos << 1) + 1;
      right = left + 1;
      minIndex = pos;
      if (left <= last && this.comparator(this.data[left], this.data[minIndex]) < 0) {
        minIndex = left;
      }
      if (right <= last && this.comparator(this.data[right], this.data[minIndex]) < 0) {
        minIndex = right;
      }
      if (minIndex !== pos) {
        x = this.data[minIndex];
        this.data[minIndex] = this.data[pos];
        this.data[pos] = x;
        pos = minIndex;
      } else {
        break;
      }
    }
    return void 0;
  };

  return BinaryHeapStrategy;

})();


},{}]},{},[1])(1)
});
});

var dxs = [+1, 0, -1, 0, +1, +1, -1, -1];
var dys = [0, +1, 0, -1, +1, -1, +1, -1];

/**
 * This method allows to create a ROIMap using the water shed algorithm. By default this algorithm
 * will fill the holes and therefore the lowest value of the image (black zones).
 * If no points are given, the function will look for all the minimal points.
 * If no mask is given the algorithm will completely fill the image.
 * Please take care about the value that has be in the mask ! In order to be coherent with the expected mask,
 * meaning that if it is a dark zone, the mask will be dark the normal behaviour to fill a zone
 * is that the mask pixel is clear (value of 0) !
 * However if you work in the 'invert' mode, the mask value has to be 'set' and the method will look for
 * maxima.
 * @memberof RoiManager
 * @instance
 * @param {object} [options={}]
 * @param {Array<Array<number>>} [options.points] - Array of points [[x1,y1], [x2,y2], ...].
 * @param {number} [options.fillMaxValue] - Limit of filling. By example, we can fill to a maximum value 32000 of a 16 bitDepth image.
 *          If invert this will corresponds to the minimal value
 * @param {Image} [options.image=this] - By default the waterShed will be applied on the current image. However waterShed can only be applied
 *                              on 1 component image. This allows to specify a grey scale image on which to apply waterShed..
 * @param {Image} [options.mask] - A binary image, the same size as the image. The algorithm will fill only if the current pixel in the binary mask is true.
 * @param {boolean} [options.invert=false] - By default we fill the minima
 * @return {RoiMap}
 */
function fromWaterShed() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var points = options.points,
        mask = options.mask,
        image = options.image,
        _options$fillMaxValue = options.fillMaxValue,
        fillMaxValue = _options$fillMaxValue === undefined ? this.maxValue : _options$fillMaxValue,
        _options$invert = options.invert,
        invert = _options$invert === undefined ? false : _options$invert;

    var currentImage = image || this;
    currentImage.checkProcessable('fromWaterShed', {
        bitDepth: [8, 16],
        components: 1
    });

    /*
     We need to invert the logic because we are always using method to look for maxima and not minima and
     here water is expected to fill the minima first ...
    */

    invert = !invert;

    //WaterShed is done from points in the image. We can either specify those points in options,
    // or it is gonna take the minimum locals of the image by default.
    if (!points) {
        points = currentImage.getLocalMaxima({
            invert,
            mask
        });
    }

    var maskExpectedValue = invert ? 0 : 1;

    var data = new Int16Array(currentImage.size);
    var width = currentImage.width;
    var height = currentImage.height;
    var toProcess = new priorityQueue({
        comparator: (a, b) => a[2] - b[2],
        strategy: priorityQueue.BinaryHeapStrategy
    });
    for (var i = 0; i < points.length; i++) {
        var index = points[i][0] + points[i][1] * width;
        data[index] = i + 1;
        var intensity = currentImage.data[index];
        if (invert && intensity <= fillMaxValue || !invert && intensity >= fillMaxValue) {
            toProcess.queue([points[i][0], points[i][1], intensity]);
        }
    }

    //Then we iterate through each points
    while (toProcess.length > 0) {
        var currentPoint = toProcess.dequeue();
        var currentValueIndex = currentPoint[0] + currentPoint[1] * width;

        for (var dir = 0; dir < 4; dir++) {
            var newX = currentPoint[0] + dxs[dir];
            var newY = currentPoint[1] + dys[dir];
            if (newX >= 0 && newY >= 0 && newX < width && newY < height) {
                var currentNeighbourIndex = newX + newY * width;
                if (!mask || mask.getBit(currentNeighbourIndex) === maskExpectedValue) {
                    var _intensity = currentImage.data[currentNeighbourIndex];
                    if (invert && _intensity <= fillMaxValue || !invert && _intensity >= fillMaxValue) {
                        if (data[currentNeighbourIndex] === 0) {
                            data[currentNeighbourIndex] = data[currentValueIndex];
                            toProcess.queue([currentPoint[0] + dxs[dir], currentPoint[1] + dys[dir], _intensity]);
                        }
                    }
                }
            }
        }
    }

    return new RoiMap(currentImage, data);
}

/**
 * @memberof RoiManager
 * @instance
 * @param {Array<Array<number>>} pointsToPaint - an array of points
 * @param {object} [options]
 * @return {RoiMap}
 */
function fromPoints(pointsToPaint) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var shape = new Shape(options);

    // based on a binary image we will create plenty of small images
    var data = new Int16Array(this.size); // maxValue: 32767, minValue: -32768
    var positiveID = 0;
    var shapePoints = shape.getPoints();
    for (var i = 0; i < pointsToPaint.length; i++) {
        positiveID++;
        var xP = pointsToPaint[i][0];
        var yP = pointsToPaint[i][1];
        for (var j = 0; j < shapePoints.length; j++) {
            var xS = shapePoints[j][0];
            var yS = shapePoints[j][1];
            if (xP + xS >= 0 && yP + yS >= 0 && xP + xS < this.width && yP + yS < this.height) {
                data[xP + xS + (yP + yS) * this.width] = positiveID;
            }
        }
    }

    return new RoiMap(this, data);
}

var twoProduct_1 = twoProduct;

var SPLITTER = +(Math.pow(2, 27) + 1.0);

function twoProduct(a, b, result) {
  var x = a * b;

  var c = SPLITTER * a;
  var abig = c - a;
  var ahi = c - abig;
  var alo = a - ahi;

  var d = SPLITTER * b;
  var bbig = d - b;
  var bhi = d - bbig;
  var blo = b - bhi;

  var err1 = x - (ahi * bhi);
  var err2 = err1 - (alo * bhi);
  var err3 = err2 - (ahi * blo);

  var y = alo * blo - err3;

  if(result) {
    result[0] = y;
    result[1] = x;
    return result
  }

  return [ y, x ]
}

var robustSum = linearExpansionSum;

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0;
  var nf = f.length|0;
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs = Math.abs;
  var ei = e[eptr];
  var ea = abs(ei);
  var fi = f[fptr];
  var fa = abs(fi);
  var a, b;
  if(ea < fa) {
    b = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
      fa = abs(fi);
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
      fa = abs(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei;
      eptr += 1;
      if(eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if(fptr < nf) {
        fi = f[fptr];
        fa = abs(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while(eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
    }
  }
  while(fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    } 
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if(fptr < nf) {
      fi = f[fptr];
    }
  }
  if(q0) {
    g[count++] = q0;
  }
  if(q1) {
    g[count++] = q1;
  }
  if(!count) {
    g[count++] = 0.0;  
  }
  g.length = count;
  return g
}

var twoSum = fastTwoSum;

function fastTwoSum(a, b, result) {
	var x = a + b;
	var bv = x - a;
	var av = x - bv;
	var br = b - bv;
	var ar = a - av;
	if(result) {
		result[0] = ar + br;
		result[1] = x;
		return result
	}
	return [ar+br, x]
}

var robustScale = scaleLinearExpansion;

function scaleLinearExpansion(e, scale) {
  var n = e.length;
  if(n === 1) {
    var ts = twoProduct_1(e[0], scale);
    if(ts[0]) {
      return ts
    }
    return [ ts[1] ]
  }
  var g = new Array(2 * n);
  var q = [0.1, 0.1];
  var t = [0.1, 0.1];
  var count = 0;
  twoProduct_1(e[0], scale, q);
  if(q[0]) {
    g[count++] = q[0];
  }
  for(var i=1; i<n; ++i) {
    twoProduct_1(e[i], scale, t);
    var pq = q[1];
    twoSum(pq, t[0], q);
    if(q[0]) {
      g[count++] = q[0];
    }
    var a = t[1];
    var b = q[1];
    var x = a + b;
    var bv = x - a;
    var y = b - bv;
    q[1] = x;
    if(y) {
      g[count++] = y;
    }
  }
  if(q[1]) {
    g[count++] = q[1];
  }
  if(count === 0) {
    g[count++] = 0.0;
  }
  g.length = count;
  return g
}

var robustDiff = robustSubtract;

//Easy case: Add two scalars
function scalarScalar$1(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0;
  var nf = f.length|0;
  if(ne === 1 && nf === 1) {
    return scalarScalar$1(e[0], -f[0])
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs = Math.abs;
  var ei = e[eptr];
  var ea = abs(ei);
  var fi = -f[fptr];
  var fa = abs(fi);
  var a, b;
  if(ea < fa) {
    b = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
      fa = abs(fi);
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
      ea = abs(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
      fa = abs(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei;
      eptr += 1;
      if(eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if(fptr < nf) {
        fi = -f[fptr];
        fa = abs(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while(eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if(eptr < ne) {
      ei = e[eptr];
    }
  }
  while(fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if(y) {
      g[count++] = y;
    } 
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if(fptr < nf) {
      fi = -f[fptr];
    }
  }
  if(q0) {
    g[count++] = q0;
  }
  if(q1) {
    g[count++] = q1;
  }
  if(!count) {
    g[count++] = 0.0;  
  }
  g.length = count;
  return g
}

var orientation_1 = createCommonjsModule(function (module) {
"use strict";






var NUM_EXPAND = 5;

var EPSILON     = 1.1102230246251565e-16;
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON;
var ERRBOUND4   = (7.0 + 56.0 * EPSILON) * EPSILON;

function cofactor(m, c) {
  var result = new Array(m.length-1);
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1);
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j];
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n);
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m", j, "[", (n-i-1), "]"].join("");
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1;
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return [["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")]
  } else {
    var expr = [];
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", generateSum(determinant(cofactor(m, i))), ",", sign(i), m[0][i], ")"].join(""));
    }
    return expr
  }
}

function orientation(n) {
  var pos = [];
  var neg = [];
  var m = matrix(n);
  var args = [];
  for(var i=0; i<n; ++i) {
    if((i&1)===0) {
      pos.push.apply(pos, determinant(cofactor(m, i)));
    } else {
      neg.push.apply(neg, determinant(cofactor(m, i)));
    }
    args.push("m" + i);
  }
  var posExpr = generateSum(pos);
  var negExpr = generateSum(neg);
  var funcName = "orientation" + n + "Exact";
  var code = ["function ", funcName, "(", args.join(), "){var p=", posExpr, ",n=", negExpr, ",d=sub(p,n);\
return d[d.length-1];};return ", funcName].join("");
  var proc = new Function("sum", "prod", "scale", "sub", code);
  return proc(robustSum, twoProduct_1, robustScale, robustDiff)
}

var orientation3Exact = orientation(3);
var orientation4Exact = orientation(4);

var CACHED = [
  function orientation0() { return 0 },
  function orientation1() { return 0 },
  function orientation2(a, b) { 
    return b[0] - a[0]
  },
  function orientation3(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0]);
    var r = (a[0] - c[0]) * (b[1] - c[1]);
    var det = l - r;
    var s;
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r;
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r);
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s;
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
  },
  function orientation4(a,b,c,d) {
    var adx = a[0] - d[0];
    var bdx = b[0] - d[0];
    var cdx = c[0] - d[0];
    var ady = a[1] - d[1];
    var bdy = b[1] - d[1];
    var cdy = c[1] - d[1];
    var adz = a[2] - d[2];
    var bdz = b[2] - d[2];
    var cdz = c[2] - d[2];
    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;
    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var det = adz * (bdxcdy - cdxbdy) 
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady);
    var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
    var tol = ERRBOUND4 * permanent;
    if ((det > tol) || (-det > tol)) {
      return det
    }
    return orientation4Exact(a,b,c,d)
  }
];

function slowOrient(args) {
  var proc = CACHED[args.length];
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length);
  }
  return proc.apply(undefined, args)
}

function generateOrientationProc() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length));
  }
  var args = [];
  var procArgs = ["slow"];
  for(var i=0; i<=NUM_EXPAND; ++i) {
    args.push("a" + i);
    procArgs.push("o" + i);
  }
  var code = [
    "function getOrientation(", args.join(), "){switch(arguments.length){case 0:case 1:return 0;"
  ];
  for(var i=2; i<=NUM_EXPAND; ++i) {
    code.push("case ", i, ":return o", i, "(", args.slice(0, i).join(), ");");
  }
  code.push("}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return getOrientation");
  procArgs.push(code.join(""));

  var proc = Function.apply(undefined, procArgs);
  module.exports = proc.apply(undefined, [slowOrient].concat(CACHED));
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i];
  }
}

generateOrientationProc();
});

var robustPnp = robustPointInPolygon;



function robustPointInPolygon(vs, point) {
  var x = point[0];
  var y = point[1];
  var n = vs.length;
  var inside = 1;
  var lim = n;
  for(var i = 0, j = n-1; i<lim; j=i++) {
    var a = vs[i];
    var b = vs[j];
    var yi = a[1];
    var yj = b[1];
    if(yj < yi) {
      if(yj < y && y < yi) {
        var s = orientation_1(a, b, point);
        if(s === 0) {
          return 0
        } else {
          inside ^= (0 < s)|0;
        }
      } else if(y === yi) {
        var c = vs[(i+1)%n];
        var yk = c[1];
        if(yi < yk) {
          var s = orientation_1(a, b, point);
          if(s === 0) {
            return 0
          } else {
            inside ^= (0 < s)|0;
          }
        }
      }
    } else if(yi < yj) {
      if(yi < y && y < yj) {
        var s = orientation_1(a, b, point);
        if(s === 0) {
          return 0
        } else {
          inside ^= (s < 0)|0;
        }
      } else if(y === yi) {
        var c = vs[(i+1)%n];
        var yk = c[1];
        if(yk < yi) {
          var s = orientation_1(a, b, point);
          if(s === 0) {
            return 0
          } else {
            inside ^= (s < 0)|0;
          }
        }
      }
    } else if(y === yi) {
      var x0 = Math.min(a[0], b[0]);
      var x1 = Math.max(a[0], b[0]);
      if(i === 0) {
        while(j>0) {
          var k = (j+n-1)%n;
          var p = vs[k];
          if(p[1] !== y) {
            break
          }
          var px = p[0];
          x0 = Math.min(x0, px);
          x1 = Math.max(x1, px);
          j = k;
        }
        if(j === 0) {
          if(x0 <= x && x <= x1) {
            return 0
          }
          return 1 
        }
        lim = j+1;
      }
      var y0 = vs[(j+n-1)%n][1];
      while(i+1<lim) {
        var p = vs[i+1];
        if(p[1] !== y) {
          break
        }
        var px = p[0];
        x0 = Math.min(x0, px);
        x1 = Math.max(x1, px);
        i += 1;
      }
      if(x0 <= x && x <= x1) {
        return 0
      }
      var y1 = vs[(i+1)%n][1];
      if(x < x0 && (y0 < y !== y1 < y)) {
        inside ^= 1;
      }
    }
  }
  return 2 * inside - 1
}

/**
 * Class to manage Region Of Interests
 * @class Roi
 */
class Roi {

    constructor(map, id) {
        this.map = map;
        this.id = id;
        this.minX = Number.POSITIVE_INFINITY;
        this.maxX = Number.NEGATIVE_INFINITY;
        this.minY = Number.POSITIVE_INFINITY;
        this.maxY = Number.NEGATIVE_INFINITY;
        this.meanX = 0;
        this.meanY = 0;
        this.surface = 0;
        this.computed = {};
    }

    /**
     * Returns a binary image (mask) for the corresponding ROI
     * @param {object} [options]
     * @param {number} [options.scale=1] - Scaling factor to apply to the mask
     * @param {string} [options.kind='normal'] - 'contour', 'box', 'filled', 'center', 'hull' or 'normal'
     * @return {Image} - Returns a mask (1 bit Image)
     */
    getMask() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var _options$scale = options.scale,
            scale = _options$scale === undefined ? 1 : _options$scale,
            _options$kind = options.kind,
            kind = _options$kind === undefined ? '' : _options$kind;

        var mask = void 0;
        switch (kind) {
            case 'contour':
                mask = this.contourMask;
                break;
            case 'box':
                mask = this.boxMask;
                break;
            case 'filled':
                mask = this.filledMask;
                break;
            case 'center':
                mask = this.centerMask;
                break;
            case 'hull':
                mask = this.hullMask;
                break;
            default:
                mask = this.mask;
        }

        if (scale < 1) {
            // by reassigning the mask we loose the parent and therefore the position
            // we will have to force it back
            mask = mask.scale({ factor: scale });
            mask.parent = this.mask.parent;
            mask.position[0] += this.minX;
            mask.position[1] += this.minY;
        }

        return mask;
    }

    get mean() {
        throw new Error('Roi mean not implemented yet');
        // return [this.meanX,this.meanY];
    }

    get center() {
        if (this.computed.center) {
            return this.computed.center;
        }
        return this.computed.center = [this.width / 2 >> 0, this.height / 2 >> 0];
    }

    get ratio() {
        return this.width / this.height;
    }

    get width() {
        return this.maxX - this.minX + 1;
    }

    get height() {
        return this.maxY - this.minY + 1;
    }

    _computExternalIDs() {
        // take all the borders and remove the internal one ...
        var borders = this.borderIDs;
        var lengths = this.borderLengths;

        this.computed.externalIDs = [];
        this.computed.externalLengths = [];

        var internals = this.internalIDs;

        for (var i = 0; i < borders.length; i++) {
            if (!internals.includes(borders[i])) {
                this.computed.externalIDs.push(borders[i]);
                this.computed.externalLengths.push(lengths[i]);
            }
        }
    }

    get externalIDs() {
        if (this.computed.externalIDs) {
            return this.computed.externalIDs;
        }
        this._computExternalIDs();
        return this.computed.externalIDs;
    }

    get externalLengths() {
        if (this.computed.externalLengths) {
            return this.computed.externalLengths;
        }
        this._computExternalIDs();
        return this.computed.externalLengths;
    }

    _computeBorderIDs() {
        var borders = getBorders(this);
        this.computed.borderIDs = borders.ids;
        this.computed.borderLengths = borders.lengths;
    }

    /**
     Retrieve all the IDs (array of number) of the regions that are in contact with this
     specific region. It may be external or internal
     */
    get borderIDs() {
        if (this.computed.borderIDs) {
            return this.computed.borderIDs;
        }
        this._computeBorderIDs();
        return this.computed.borderIDs;
    }

    /**
     Retrieve all the length (array of number) of the contacts with this
     specific region. It may be external or internal
     */
    get borderLengths() {
        if (this.computed.borderLengths) {
            return this.computed.borderLengths;
        }
        this._computeBorderIDs();
        return this.computed.borderLengths;
    }

    /**
     Retrieve all the IDs or the Roi touching the box surrouding the region
      It should really be an array to solve complex cases related to border effect
      Like the image
     <pre>
     0000
     1111
     0000
     1111
     </pre>
      The first row of 1 will be surrouned by 2 differents zones
      Or even worse
     <pre>
     010
     111
     010
     </pre>
     The cross will be surrouned by 4 differents zones
      However in most of the cases it will be an array of one element
     */
    get boxIDs() {
        if (this.computed.boxIDs) {
            return this.computed.boxIDs;
        }
        return this.computed.boxIDs = getBoxIDs(this);
    }

    get internalIDs() {
        if (this.computed.internalIDs) {
            return this.computed.internalIDs;
        }
        return this.computed.internalIDs = getInternalIDs(this);
    }

    /**
     Number of pixels of the Roi that touch the rectangle
     This is useful for the calculation of the border
     because we will ignore those special pixels of the rectangle
     border that don't have neighbours all around them.
     */
    get box() {
        // points of the Roi that touch the rectangular shape
        if (this.computed.box) {
            return this.computed.box;
        }
        return this.computed.box = getBox(this);
    }

    /**
     Calculates the number of pixels that are in the external border of the Roi
     Contour are all the pixels that touch an external "zone".
     All the pixels that touch the box are part of the border and
     are calculated in the getBoxPixels procedure
     */
    get external() {
        if (this.computed.external) {
            return this.computed.external;
        }
        return this.computed.external = getExternal(this);
    }

    /**
     Calculates the number of pixels that are involved in border
     Border are all the pixels that touch another "zone". It could be external
     or internal. If there is a hole in the zone it will be counted as a border.
     All the pixels that touch the box are part of the border and
     are calculated in the getBoxPixels procedure
     */
    get border() {
        if (this.computed.border) {
            return this.computed.border;
        }
        return this.computed.border = getBorder(this);
    }

    /**
        Returns a binary image (mask) containing only the border of the mask
     */
    get contourMask() {
        if (this.computed.contourMask) {
            return this.computed.contourMask;
        }

        var img = new Image$1(this.width, this.height, {
            kind: BINARY,
            position: [this.minX, this.minY],
            parent: this.map.parent
        });

        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.map.data[x + this.minX + (y + this.minY) * this.map.width] === this.id) {
                    // it also has to be on a border ...
                    if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
                        if (this.map.data[x - 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y - 1 + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y + 1 + this.minY) * this.map.width] !== this.id) {
                            img.setBitXY(x, y);
                        }
                    } else {
                        img.setBitXY(x, y);
                    }
                }
            }
        }
        return this.computed.contour = img;
    }

    get boxMask() {
        if (this.computed.boxMask) {
            return this.computed.boxMask;
        }

        var img = new Image$1(this.width, this.height, {
            kind: BINARY,
            position: [this.minX, this.minY],
            parent: this.map.parent
        });

        for (var x = 0; x < this.width; x++) {
            img.setBitXY(x, 0);
            img.setBitXY(x, this.height - 1);
        }
        for (var y = 0; y < this.height; y++) {
            img.setBitXY(0, y);
            img.setBitXY(this.width - 1, y);
        }
        return this.computed.boxMask = img;
    }

    /**
     Returns a binary image containing the mask
     */
    get mask() {
        if (this.computed.mask) {
            return this.computed.mask;
        }

        var img = new Image$1(this.width, this.height, {
            kind: BINARY,
            position: [this.minX, this.minY],
            parent: this.map.parent
        });

        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.map.data[x + this.minX + (y + this.minY) * this.map.width] === this.id) {
                    img.setBitXY(x, y);
                }
            }
        }
        return this.computed.mask = img;
    }

    get filledMask() {
        if (this.computed.filledMask) {
            return this.computed.filledMask;
        }

        var img = new Image$1(this.width, this.height, {
            kind: BINARY,
            position: [this.minX, this.minY],
            parent: this.map.parent
        });

        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var target = x + this.minX + (y + this.minY) * this.map.width;
                if (this.internalIDs.includes(this.map.data[target])) {
                    img.setBitXY(x, y);
                } // by default a pixel is to 0 so no problems, it will be transparent
            }
        }
        return this.computed.filledMask = img;
    }

    get centerMask() {
        if (this.computed.centerMask) {
            return this.computed.centerMask;
        }

        var img = new Shape({ kind: 'smallCross' }).getMask();

        img.parent = this.map.parent;
        img.position = [this.minX + this.center[0] - 1, this.minY + this.center[1] - 1];

        return this.computed.centerMask = img;
    }

    get hullMask() {
        if (this.computed.hullMask) {
            return this.computed.hullMask;
        }

        var img = new Image$1(this.width, this.height, {
            kind: BINARY,
            position: [this.minX, this.minY],
            parent: this.map.parent
        });

        var hull = this.mask.monotoneChainConvexHull();
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (robustPnp(hull, [x, y]) !== 1) {
                    img.setBitXY(x, y);
                }
            }
        }

        return this.computed.hullMask = img;
    }

    get points() {
        if (this.computed.points) {
            return this.computed.points;
        }
        var points = [];
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var target = (y + this.minY) * this.map.width + x + this.minX;
                if (this.map.data[target] === this.id) {
                    points.push([x, y]);
                }
            }
        }
        return this.computed.points = points;
    }

    get maxLengthPoints() {
        if (this.computed.maxLengthPoints) {
            return this.computed.maxLengthPoints;
        }
        var maxLength = 0;
        var maxLengthPoints = void 0;
        var points = this.points;

        for (var i = 0; i < points.length; i++) {
            for (var j = i + 1; j < points.length; j++) {
                var currentML = Math.pow(points[i][0] - points[j][0], 2) + Math.pow(points[i][1] - points[j][1], 2);
                if (currentML >= maxLength) {
                    maxLength = currentML;
                    maxLengthPoints = [points[i], points[j]];
                }
            }
        }
        return this.computed.maxLengthPoints = maxLengthPoints;
    }

    /**
        Calculates the maximum length between two pixels of the Roi.
     */
    get maxLength() {
        if (this.computed.maxLength) {
            return this.computed.maxLength;
        }
        var maxLength = Math.sqrt(Math.pow(this.maxLengthPoints[0][0] - this.maxLengthPoints[1][0], 2) + Math.pow(this.maxLengthPoints[0][1] - this.maxLengthPoints[1][1], 2));
        return this.computed.maxLength = maxLength;
    }

    get angle() {
        if (this.computed.angle) {
            return this.computed.angle;
        }
        var points = this.maxLengthPoints;
        var angle = -Math.atan2(points[0][1] - points[1][1], points[0][0] - points[1][0]) * 180 / Math.PI;

        return this.computed.angle = angle;
    }

    toJSON() {
        return {
            id: this.id,
            minX: this.minX,
            maxX: this.maxX,
            minY: this.minY,
            maxY: this.maxY,
            meanX: this.meanX,
            meanY: this.meanY,
            height: this.height,
            width: this.width,
            surface: this.surface
        };
    }
}

// TODO we should follow the region in order to increase the speed

function getBorders(roi) {
    var roiMap = roi.map;
    var data = roiMap.data;
    var surroudingIDs = new Set(); // allows to get a unique list without indexOf
    var surroundingBorders = new Map();
    var visitedData = new Set();
    var dx = [+1, 0, -1, 0];
    var dy = [0, +1, 0, -1];

    for (var x = roi.minX; x <= roi.maxX; x++) {
        for (var y = roi.minY; y <= roi.maxY; y++) {
            var target = x + y * roiMap.width;
            if (data[target] === roi.id) {
                for (var dir = 0; dir < 4; dir++) {
                    var newX = x + dx[dir];
                    var newY = y + dy[dir];
                    if (newX >= 0 && newY >= 0 && newX < roiMap.width && newY < roiMap.height) {
                        var neighbour = newX + newY * roiMap.width;

                        if (data[neighbour] !== roi.id && !visitedData.has(neighbour)) {
                            visitedData.add(neighbour);
                            surroudingIDs.add(data[neighbour]);
                            var surroundingBorder = surroundingBorders.get(data[neighbour]);
                            if (!surroundingBorder) {
                                surroundingBorders.set(data[neighbour], 1);
                            } else {
                                surroundingBorders.set(data[neighbour], ++surroundingBorder);
                            }
                        }
                    }
                }
            }
        }
    }
    var ids = Array.from(surroudingIDs);
    var borderLengths = ids.map(function (id) {
        return surroundingBorders.get(id);
    });
    return {
        ids: ids,
        lengths: borderLengths
    };
}

function getBoxIDs(roi) {
    var surroundingIDs = new Set(); // allows to get a unique list without indexOf

    var roiMap = roi.map;
    var data = roiMap.data;

    // we check the first line and the last line
    for (var y of [0, roi.height - 1]) {
        for (var x = 0; x < roi.width; x++) {
            var target = (y + roi.minY) * roiMap.width + x + roi.minX;
            if (x - roi.minX > 0 && data[target] === roi.id && data[target - 1] !== roi.id) {
                var value = data[target - 1];
                surroundingIDs.add(value);
            }
            if (roiMap.width - x - roi.minX > 1 && data[target] === roi.id && data[target + 1] !== roi.id) {
                var _value = data[target + 1];
                surroundingIDs.add(_value);
            }
        }
    }

    // we check the first column and the last column
    for (var _x2 of [0, roi.width - 1]) {
        for (var _y = 0; _y < roi.height; _y++) {
            var _target = (_y + roi.minY) * roiMap.width + _x2 + roi.minX;
            if (_y - roi.minY > 0 && data[_target] === roi.id && data[_target - roiMap.width] !== roi.id) {
                var _value2 = data[_target - roiMap.width];
                surroundingIDs.add(_value2);
            }
            if (roiMap.height - _y - roi.minY > 1 && data[_target] === roi.id && data[_target + roiMap.width] !== roi.id) {
                var _value3 = data[_target + roiMap.width];
                surroundingIDs.add(_value3);
            }
        }
    }

    return Array.from(surroundingIDs); // the selection takes the whole rectangle
}

function getBox(roi) {
    var total = 0;
    var roiMap = roi.map;
    var data = roiMap.data;

    var topBottom = [0];
    if (roi.height > 1) {
        topBottom[1] = roi.height - 1;
    }
    for (var y of topBottom) {
        for (var x = 1; x < roi.width - 1; x++) {
            var target = (y + roi.minY) * roiMap.width + x + roi.minX;
            if (data[target] === roi.id) {
                total++;
            }
        }
    }

    var leftRight = [0];
    if (roi.width > 1) {
        leftRight[1] = roi.width - 1;
    }
    for (var _x3 of leftRight) {
        for (var _y2 = 0; _y2 < roi.height; _y2++) {
            var _target2 = (_y2 + roi.minY) * roiMap.width + _x3 + roi.minX;
            if (data[_target2] === roi.id) {
                total++;
            }
        }
    }
    return total;
}

function getBorder(roi) {
    var total = 0;
    var roiMap = roi.map;
    var data = roiMap.data;

    for (var x = 1; x < roi.width - 1; x++) {
        for (var y = 1; y < roi.height - 1; y++) {
            var target = (y + roi.minY) * roiMap.width + x + roi.minX;
            if (data[target] === roi.id) {
                // if a point around is not roi.id it is a border
                if (data[target - 1] !== roi.id || data[target + 1] !== roi.id || data[target - roiMap.width] !== roi.id || data[target + roiMap.width] !== roi.id) {
                    total++;
                }
            }
        }
    }
    return total + roi.box;
}

function getExternal(roi) {
    var total = 0;
    var roiMap = roi.map;
    var data = roiMap.data;

    for (var x = 1; x < roi.width - 1; x++) {
        for (var y = 1; y < roi.height - 1; y++) {
            var target = (y + roi.minY) * roiMap.width + x + roi.minX;
            if (data[target] === roi.id) {
                // if a point around is not roi.id it is a border
                if (roi.externalIDs.includes(data[target - 1]) || roi.externalIDs.includes(data[target + 1]) || roi.externalIDs.includes(data[target - roiMap.width]) || roi.externalIDs.includes(data[target + roiMap.width])) {
                    total++;
                }
            }
        }
    }
    return total + roi.box;
}

/*
We will calculate all the ids of the map that are "internal"
This will allow to extract the 'plain' image
 */
function getInternalIDs(roi) {
    var internal = [roi.id];
    var roiMap = roi.map;
    var data = roiMap.data;

    if (roi.height > 2) {
        for (var x = 0; x < roi.width; x++) {
            var target = roi.minY * roiMap.width + x + roi.minX;
            if (internal.includes(data[target])) {
                var id = data[target + roiMap.width];
                if (!internal.includes(id) && !roi.boxIDs.includes(id)) {
                    internal.push(id);
                }
            }
        }
    }

    var array = new Array(4);
    for (var _x4 = 1; _x4 < roi.width - 1; _x4++) {
        for (var y = 1; y < roi.height - 1; y++) {
            var _target3 = (y + roi.minY) * roiMap.width + _x4 + roi.minX;
            if (internal.includes(data[_target3])) {
                // we check if one of the neighbour is not yet in

                array[0] = data[_target3 - 1];
                array[1] = data[_target3 + 1];
                array[2] = data[_target3 - roiMap.width];
                array[3] = data[_target3 + roiMap.width];

                for (var i = 0; i < 4; i++) {
                    var _id = array[i];
                    if (!internal.includes(_id) && !roi.boxIDs.includes(_id)) {
                        internal.push(_id);
                    }
                }
            }
        }
    }

    return internal;
}

// TODO check the links for the reference in the docs (@see)

/**
 * A layer that is caracterised by a RoiMap (@see RoiMap) and that will
 * generated automatically the corresponding ROI.
 * ROI should be a continuous
 * surface (it is not tested when it is not continous ...)
 * From the roiMap, the RoiLayer will create the corresponding
 * ROI (@see Roi).
 *
 * @class RoiLayer
 * @private
 * @param {Image} image
 * @param {object} [options]
 */
class RoiLayer {
    constructor(roiMap, options) {
        this.roiMap = roiMap;
        this.options = options;
        this.roi = this.createRoi();
    }

    /**
     * Roi are created from a roiMap
     * The roiMap contains mainty an array of identifiers that define
     * for each data to which Roi it belongs
     * @memberof RoiManager
     * @instance
     * @return {Roi[]}
     */
    createRoi() {
        // we need to find all all the different IDs there is in the data
        var data = this.roiMap.data;
        var mapIDs = {};
        this.roiMap.positive = 0;
        this.roiMap.negative = 0;

        for (var i = 0; i < data.length; i++) {
            if (data[i] && !mapIDs[data[i]]) {
                mapIDs[data[i]] = true;
                if (data[i] > 0) {
                    this.roiMap.positive++;
                } else {
                    this.roiMap.negative++;
                }
            }
        }

        var rois = {};

        for (var mapID in mapIDs) {
            rois[mapID] = new Roi(this.roiMap, mapID * 1);
        }
        var width = this.roiMap.width;
        var height = this.roiMap.height;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var target = y * width + x;
                if (data[target] !== 0) {
                    var _mapID = data[target];
                    var roi = rois[_mapID];
                    if (x < roi.minX) {
                        roi.minX = x;
                    }
                    if (x > roi.maxX) {
                        roi.maxX = x;
                    }
                    if (y < roi.minY) {
                        roi.minY = y;
                    }
                    if (y > roi.maxY) {
                        roi.maxY = y;
                    }
                    roi.meanX += x;
                    roi.meanY += y;
                    roi.surface++;
                }
            }
        }
        var roiArray = [];
        for (var _mapID2 in mapIDs) {
            rois[_mapID2].meanX /= rois[_mapID2].surface;
            rois[_mapID2].meanY /= rois[_mapID2].surface;
            roiArray.push(rois[_mapID2]);
        }

        return roiArray;
    }

}

/**
 * A manager of Regions of Interest. A RoiManager is related to a specific Image
 * and may contain multiple layers. Each layer is characterized by a label whose is
 * name by default 'default'
 * @class RoiManager
 * @param {Image} image
 * @param {object} [options]
 */
class RoiManager {
    constructor(image) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        this._image = image;
        this._options = options;
        if (!this._options.label) {
            this._options.label = 'default';
        }
        this._layers = {};
        this._painted = null;
    }

    // docs is in the corresponding file
    fromMaxima() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var opt = index$6({}, this._options, options);
        var roiMap = fromMaxima.call(this._image, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
    }

    // docs is in the corresponding file
    fromPoints(points) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var opt = index$6({}, this._options, options);
        var roiMap = fromPoints.call(this._image, points, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
        return this;
    }

    /**
     * @param {number[]} map
     * @param {object} [options]
     * @return {this}
     */
    putMap(map) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var roiMap = new RoiMap(this._image, map);
        var opt = index$6({}, this._options, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
        return this;
    }

    // docs is in the corresponding file
    fromWaterShed() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var opt = index$6({}, this._options, options);
        var roiMap = fromWaterShed.call(this._image, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
    }

    // docs is in the corresponding file
    fromMask(mask) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var opt = index$6({}, this._options, options);
        var roiMap = fromMask.call(this._image, mask, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
        return this;
    }

    fromMaskConnectedComponentLabelingAlgorithm(mask) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var opt = index$6({}, this._options, options);
        var roiMap = fromMaskConnectedComponentLabelingAlgorithm.call(this._image, mask, options);
        this._layers[opt.label] = new RoiLayer(roiMap, opt);
        return this;
    }

    /**
     *
     * @param {object} [options]
     * @return {RoiMap}
     */
    getMap() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var opt = index$6({}, this._options, options);
        this._assertLayerWithLabel(opt.label);
        return this._layers[opt.label].roiMap;
    }

    /**
     * Return statistics about rows
     * @param {object} [options]
     * @return {object[]}
     */
    rowsInfo() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return this.getMap(options).rowsInfo();
    }

    /**
     * Return statistics about columns
     * @param {object} [options]
     * @return {object[]}
     */
    colsInfo() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return this.getMap(options).rowsInfo();
    }

    /**
     * Return the IDs of the Regions Of Interest (Roi) as an array of number
     * @param {object} [options]
     * @return {number[]}
     */
    getRoiIds() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var rois = this.getRois(options);
        if (rois) {
            var ids = new Array(rois.length);
            for (var i = 0; i < rois.length; i++) {
                ids[i] = rois[i].id;
            }
            return ids;
        }
        throw new Error('ROIs not found');
    }

    /**
     * Allows to select ROI based on size, label and sign.
     * @param {object} [options={}]
     * @param {string} [options.label='default'] Label of the layer containing the ROI
     * @param {boolean} [options.positive=true] Select the positive region of interest
     * @param {boolean} [options.negative=true] Select he negative region of interest
     * @param {number} [options.minSurface=0]
     * @param {number} [options.maxSurface=Number.POSITIVE_INFINITY]
     * @param {number} [options.minWidth=0]
     * @param {number} [options.minHeight=Number.POSITIVE_INFINITY]
     * @param {number} [options.maxWidth=0]
     * @param {number} [options.maxHeight=Number.POSITIVE_INFINITY]
     * @param {number} [options.minRatio=0] Ratio width / height
     * @param {number} [options.maxRatio=Number.POSITIVE_INFINITY]
     * @return {Roi[]}
     */
    getRois() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var _options$label = options.label,
            label = _options$label === undefined ? this._options.label : _options$label,
            _options$positive = options.positive,
            positive = _options$positive === undefined ? true : _options$positive,
            _options$negative = options.negative,
            negative = _options$negative === undefined ? true : _options$negative,
            _options$minSurface = options.minSurface,
            minSurface = _options$minSurface === undefined ? 0 : _options$minSurface,
            _options$maxSurface = options.maxSurface,
            maxSurface = _options$maxSurface === undefined ? Number.POSITIVE_INFINITY : _options$maxSurface,
            _options$minWidth = options.minWidth,
            minWidth = _options$minWidth === undefined ? 0 : _options$minWidth,
            _options$maxWidth = options.maxWidth,
            maxWidth = _options$maxWidth === undefined ? Number.POSITIVE_INFINITY : _options$maxWidth,
            _options$minHeight = options.minHeight,
            minHeight = _options$minHeight === undefined ? 0 : _options$minHeight,
            _options$maxHeight = options.maxHeight,
            maxHeight = _options$maxHeight === undefined ? Number.POSITIVE_INFINITY : _options$maxHeight,
            _options$minRatio = options.minRatio,
            minRatio = _options$minRatio === undefined ? 0 : _options$minRatio,
            _options$maxRatio = options.maxRatio,
            maxRatio = _options$maxRatio === undefined ? Number.POSITIVE_INFINITY : _options$maxRatio;


        if (!this._layers[label]) {
            throw new Error('getRoi: This Roi layer (' + label + ') does not exists.');
        }

        var allRois = this._layers[label].roi;

        // todo Is this old way to change the array size still faster ?
        var rois = new Array(allRois.length);
        var ptr = 0;
        for (var i = 0; i < allRois.length; i++) {
            var roi = allRois[i];
            if ((roi.id < 0 && negative || roi.id > 0 && positive) && roi.surface >= minSurface && roi.surface <= maxSurface && roi.width >= minWidth && roi.width <= maxWidth && roi.height >= minHeight && roi.height <= maxHeight && roi.ratio >= minRatio && roi.ratio <= maxRatio) {
                rois[ptr++] = roi;
            }
        }
        rois.length = ptr;
        return rois;
    }

    /**
     * Returns an array of masks
     * See @links Roi.getMask for the options
     * @param {object} [options]
     * @return {Image[]} Retuns an array of masks (1 bit Image)
     */
    getMasks() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var rois = this.getRois(options);

        var masks = new Array(rois.length);
        for (var i = 0; i < rois.length; i++) {
            masks[i] = rois[i].getMask(options);
        }
        return masks;
    }

    /**
     *
     * @param {object} [options]
     * @return {number[]}
     */
    getData() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var opt = index$6({}, this._options, options);
        this._assertLayerWithLabel(opt.label);
        return this._layers[opt.label].roiMap.data;
    }

    /**
     * Paint the ROI on a copy of the image adn return this image.
     * For painting options @links Image.paintMasks
     * For ROI selection options @links RoiManager.getMasks
     * @param {object} [options] - all the options to select ROIs
     * @param {string} [options.labelProperty] - Paint a mask property on the image.
     *                                  May be any property of the ROI like
     *                                  for example id, surface, width, height, meanX, meanY.
     * @return {Image} - The painted RGBA 8 bits image
     */
    paint() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var labelProperty = options.labelProperty;

        if (!this._painted) {
            this._painted = this._image.rgba8();
        }
        var masks = this.getMasks(options);

        if (labelProperty) {
            var rois = this.getRois(options);
            options.labels = rois.map(roi => roi[labelProperty]);
            options.labelsPosition = rois.map(roi => [roi.meanX, roi.meanY]);
        }

        this._painted.paintMasks(masks, options);
        return this._painted;
    }

    // return a mask corresponding to all the selected masks
    getMask() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var mask = new Image$1(this._image.width, this._image.height, { kind: 'BINARY' });
        var masks = this.getMasks(options);

        for (var i = 0; i < masks.length; i++) {
            var roi = masks[i];
            // we need to find the parent image to calculate the relative position

            for (var x = 0; x < roi.width; x++) {
                for (var y = 0; y < roi.height; y++) {
                    if (roi.getBitXY(x, y)) {
                        mask.setBitXY(x + roi.position[0], y + roi.position[1]);
                    }
                }
            }
        }
        return mask;
    }

    /**
     * Reset the changes to the current painted iamge to the image that was
     * used during the creation of the RoiManager except if a new image is
     * specified as parameter;
     * @param {object} [options]
     * @param {Image} [options.image] A new iamge that you would like to sue for painting over
     */
    resetPainted() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var image = options.image;

        if (image) {
            this._painted = this.image.rgba8();
        } else {
            this._painted = this._image.rgba8();
        }
    }

    /**
     * In place modification of the roiMap that joins regions of interest
     * @param {object} [options]
     * @param {string|function(object,number,number)} [options.algorithm='commonBorderLength'] algorithm used to decide which ROIs are merged.
     *      Current implemented algorithms are 'commonBorderLength' that use the parameters
     *      'minCommonBorderLength' and 'maxCommonBorderLength' as well as 'commonBorderRatio' that uses
     *      the parameters 'minCommonBorderRatio' and 'maxCommonBorderRatio'.
     * @param {number} [options.minCommonBorderLength=5] minimal common number of pixels for merging
     * @param {number} [options.maxCommonBorderLength=100] maximal common number of pixels for merging
     * @param {number} [options.minCommonBorderRatio=0.3] minimal common border ratio for merging
     * @param {number} [options.maxCommonBorderRatio=1] maximal common border ratio for merging
     * @return {this}
     */
    mergeRoi() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var roiMap = this.getMap(options);
        roiMap.mergeRoi(options);
        this.putMap(roiMap.data, options);
        return this;
    }

    /**
     * Finds all corresponding ROIs for all ROIs in the manager
     * @param {number[]} roiMap
     * @param {object} [options]
     * @return {Array} array of objects returned in correspondingRoisInformation
     */
    findCorrespondingRoi(roiMap) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var allRois = this.getRois(options);
        var allRelated = [];
        for (var i = 0; i < allRois.length; i++) {
            var currentRoi = allRois[i];
            var x = currentRoi.minX;
            var y = currentRoi.minY;
            var allPoints = currentRoi.points;
            var roiSign = Math.sign(currentRoi.id);
            var currentRelated = correspondingRoisInformation(x, y, allPoints, roiMap, roiSign);
            allRelated.push(currentRelated);
        }
        return allRelated;
    }

    _assertLayerWithLabel(label) {
        if (!this._layers[label]) {
            throw new Error(`no layer with label ${label}`);
        }
    }

}

/**
 * For a given ROI, find corresponding ROIs and properties in given ROIMap.
 * Returns an object containing the ID of ROIs, the surface shared by given and corresponding ROIs,
 * the percentage of given ROI surface covered by the corresponding ROI, the number of points with same and opposite signs,
 * the total number of points (same and opposite).
 * @param {number} x - minX value of ROI
 * @param {number} y - minY value of ROI
 * @param {Array<Array<number>>} points - points of ROI
 * @param {Array<number>} roiMap - roiMap from which we get the corresponding ROI
 * @param {number} roiSign - sign of ROI
 * @return {object} {{id: Array, surface: Array, roiSurfaceCovered: Array, same: number, opposite: number, total: number}}
 * @private
 */
function correspondingRoisInformation(x, y, points, roiMap, roiSign) {
    var correspondingRois = { id: [], surface: [], roiSurfaceCovered: [], same: 0, opposite: 0, total: 0 };
    for (var i = 0; i < points.length; i++) {
        var currentPoint = points[i];
        var currentX = currentPoint[0];
        var currentY = currentPoint[1];
        var correspondingRoiMapIndex = currentX + x + (currentY + y) * roiMap.width;
        var value = roiMap.data[correspondingRoiMapIndex];

        if (value > 0 || value < 0) {
            if (correspondingRois.id.includes(value)) {
                correspondingRois.surface[correspondingRois.id.indexOf(value)] += 1;
            } else {
                correspondingRois.id.push(value);
                correspondingRois.surface.push(1);
            }
        }
    }

    for (var _i = 0; _i < correspondingRois.id.length; _i++) {
        var currentSign = Math.sign(correspondingRois.id[_i]);
        if (currentSign === roiSign) {
            correspondingRois.same += correspondingRois.surface[_i];
        } else {
            correspondingRois.opposite += correspondingRois.surface[_i];
        }
        correspondingRois.roiSurfaceCovered[_i] = correspondingRois.surface[_i] / points.length;
    }
    correspondingRois.total = correspondingRois.opposite + correspondingRois.same;

    return correspondingRois;
}

var types = new Map();
var image = void 0;

function getMediaType(type) {
    if (!image) {
        image = new Image$1(1, 1);
    }
    var theType = types.get(type);
    if (!theType) {
        theType = new MediaType(type);
        types.set(type, theType);
    }
    return theType;
}

function canWrite(type) {
    if (env === 'node' && type !== 'image/png') {
        return false; // node-canvas throws for other types
    } else {
        return getMediaType(type).canWrite();
    }
}

class MediaType {
    constructor(type) {
        this.type = type;
        this._canWrite = null;
    }

    canWrite() {
        if (this._canWrite === null) {
            this._canWrite = image.toDataURL(this.type).startsWith('data:' + this.type);
        }
        return this._canWrite;
    }
}

function getType(type) {
    if (!type.includes('/')) {
        type = 'image/' + type;
    }
    return type;
}

const defaultByteLength$2 = 1024 * 8;
const charArray$2 = [];

class IOBuffer$4 {
    constructor(data, options) {
        options = options || {};
        if (data === undefined) {
            data = defaultByteLength$2;
        }
        if (typeof data === 'number') {
            data = new ArrayBuffer(data);
        }
        let length = data.byteLength;
        const offset = options.offset ? options.offset>>>0 : 0;
        if (data.buffer) {
            length = data.byteLength - offset;
            if (data.byteLength !== data.buffer.byteLength) { // Node.js buffer from pool
                data = data.buffer.slice(data.byteOffset + offset, data.byteOffset + data.byteLength);
            } else if (offset) {
                data = data.buffer.slice(offset);
            } else {
                data = data.buffer;
            }
        }
        this.buffer = data;
        this.length = length;
        this.byteLength = length;
        this.byteOffset = 0;
        this.offset = 0;
        this.littleEndian = true;
        this._data = new DataView(this.buffer);
        this._increment = length || defaultByteLength$2;
        this._mark = 0;
    }

    available(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        return (this.offset + byteLength) <= this.length;
    }

    isLittleEndian() {
        return this.littleEndian;
    }

    setLittleEndian() {
        this.littleEndian = true;
    }

    isBigEndian() {
        return !this.littleEndian;
    }

    setBigEndian() {
        this.littleEndian = false;
    }

    skip(n) {
        if (n === undefined) n = 1;
        this.offset += n;
    }

    seek(offset) {
        this.offset = offset;
    }

    mark() {
        this._mark = this.offset;
    }

    reset() {
        this.offset = this._mark;
    }

    rewind() {
        this.offset = 0;
    }

    ensureAvailable(byteLength) {
        if (byteLength === undefined) byteLength = 1;
        if (!this.available(byteLength)) {
            const newIncrement = this._increment + this._increment;
            this._increment = newIncrement;
            const newLength = this.length + newIncrement;
            const newArray = new Uint8Array(newLength);
            newArray.set(new Uint8Array(this.buffer));
            this.buffer = newArray.buffer;
            this.length = newLength;
            this._data = new DataView(this.buffer);
        }
    }

    readBoolean() {
        return this.readUint8() !== 0;
    }

    readInt8() {
        return this._data.getInt8(this.offset++);
    }

    readUint8() {
        return this._data.getUint8(this.offset++);
    }

    readByte() {
        return this.readUint8();
    }

    readBytes(n) {
        if (n === undefined) n = 1;
        var bytes = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            bytes[i] = this.readByte();
        }
        return bytes;
    }

    readInt16() {
        var value = this._data.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    readUint16() {
        var value = this._data.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    }

    readInt32() {
        var value = this._data.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    readUint32() {
        var value = this._data.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    readFloat32() {
        var value = this._data.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    }

    readFloat64() {
        var value = this._data.getFloat64(this.offset, this.littleEndian);
        this.offset += 8;
        return value;
    }

    readChar() {
        return String.fromCharCode(this.readInt8());
    }

    readChars(n) {
        if (n === undefined) n = 1;
        charArray$2.length = n;
        for (var i = 0; i < n; i++) {
            charArray$2[i] = this.readChar();
        }
        return charArray$2.join('');
    }

    writeBoolean(bool) {
        this.writeUint8(bool ? 0xff : 0x00);
    }

    writeInt8(value) {
        this.ensureAvailable(1);
        this._data.setInt8(this.offset++, value);
    }

    writeUint8(value) {
        this.ensureAvailable(1);
        this._data.setUint8(this.offset++, value);
    }

    writeByte(value) {
        this.writeUint8(value);
    }

    writeBytes(bytes) {
        this.ensureAvailable(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            this._data.setUint8(this.offset++, bytes[i]);
        }
    }

    writeInt16(value) {
        this.ensureAvailable(2);
        this._data.setInt16(this.offset, value, this.littleEndian);
        this.offset += 2;
    }

    writeUint16(value) {
        this.ensureAvailable(2);
        this._data.setUint16(this.offset, value, this.littleEndian);
        this.offset += 2;
    }

    writeInt32(value) {
        this.ensureAvailable(4);
        this._data.setInt32(this.offset, value, this.littleEndian);
        this.offset += 4;
    }

    writeUint32(value) {
        this.ensureAvailable(4);
        this._data.setUint32(this.offset, value, this.littleEndian);
        this.offset += 4;
    }

    writeFloat32(value) {
        this.ensureAvailable(4);
        this._data.setFloat32(this.offset, value, this.littleEndian);
        this.offset += 4;
    }

    writeFloat64(value) {
        this.ensureAvailable(8);
        this._data.setFloat64(this.offset, value, this.littleEndian);
        this.offset += 8;
    }

    writeChar(str) {
        this.writeUint8(str.charCodeAt(0));
    }

    writeChars(str) {
        for (var i = 0; i < str.length; i++) {
            this.writeUint8(str.charCodeAt(i));
        }
    }

    toArray() {
        return new Uint8Array(this.buffer, 0, this.offset);
    }
}

var IOBuffer_1$3 = IOBuffer$4;

const tagsById = {
    // Baseline tags
    0x00FE: 'NewSubfileType',
    0x00FF: 'SubfileType',
    0x0100: 'ImageWidth',
    0x0101: 'ImageLength',
    0x0102: 'BitsPerSample',
    0x0103: 'Compression',
    0x0106: 'PhotometricInterpretation',
    0x0107: 'Threshholding',
    0x0108: 'CellWidth',
    0x0109: 'CellLength',
    0x010A: 'FillOrder',
    0x010E: 'ImageDescription',
    0x010F: 'Make',
    0x0110: 'Model',
    0x0111: 'StripOffsets',
    0x0112: 'Orientation',
    0x0115: 'SamplesPerPixel',
    0x0116: 'RowsPerStrip',
    0x0117: 'StripByteCounts',
    0x0118: 'MinSampleValue',
    0x0119: 'MaxSampleValue',
    0x011A: 'XResolution',
    0x011B: 'YResolution',
    0x011C: 'PlanarConfiguration',
    0x0120: 'FreeOffsets',
    0x0121: 'FreeByteCounts',
    0x0122: 'GrayResponseUnit',
    0x0123: 'GrayResponseCurve',
    0x0128: 'ResolutionUnit',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x013B: 'Artist',
    0x013C: 'HostComputer',
    0x0140: 'ColorMap',
    0x0152: 'ExtraSamples',
    0x8298: 'Copyright',

    // Extension tags
    0x010D: 'DocumentName',
    0x011D: 'PageName',
    0x011E: 'XPosition',
    0x011F: 'YPosition',
    0x0124: 'T4Options',
    0x0125: 'T6Options',
    0x0129: 'PageNumber',
    0x012D: 'TransferFunction',
    0x013D: 'Predictor',
    0x013E: 'WhitePoint',
    0x013F: 'PrimaryChromaticities',
    0x0141: 'HalftoneHints',
    0x0142: 'TileWidth',
    0x0143: 'TileLength',
    0x0144: 'TileOffsets',
    0x0145: 'TileByteCounts',
    0x0146: 'BadFaxLines',
    0x0147: 'CleanFaxData',
    0x0148: 'ConsecutiveBadFaxLines',
    0x014A: 'SubIFDs',
    0x014C: 'InkSet',
    0x014D: 'InkNames',
    0x014E: 'NumberOfInks',
    0x0150: 'DotRange',
    0x0151: 'TargetPrinter',
    0x0153: 'SampleFormat',
    0x0154: 'SMinSampleValue',
    0x0155: 'SMaxSampleValue',
    0x0156: 'TransferRange',
    0x0157: 'ClipPath',
    0x0158: 'XClipPathUnits',
    0x0159: 'YClipPathUnits',
    0x015A: 'Indexed',
    0x015B: 'JPEGTables',
    0x015F: 'OPIProxy',
    0x0190: 'GlobalParametersIFD',
    0x0191: 'ProfileType',
    0x0192: 'FaxProfile',
    0x0193: 'CodingMethods',
    0x0194: 'VersionYear',
    0x0195: 'ModeNumber',
    0x01B1: 'Decode',
    0x01B2: 'DefaultImageColor',
    0x0200: 'JPEGProc',
    0x0201: 'JPEGInterchangeFormat',
    0x0202: 'JPEGInterchangeFormatLength',
    0x0203: 'JPEGRestartInterval',
    0x0205: 'JPEGLosslessPredictors',
    0x0206: 'JPEGPointTransforms',
    0x0207: 'JPEGQTables',
    0x0208: 'JPEGDCTables',
    0x0209: 'JPEGACTables',
    0x0211: 'YCbCrCoefficients',
    0x0212: 'YCbCrSubSampling',
    0x0213: 'YCbCrPositioning',
    0x0214: 'ReferenceBlackWhite',
    0x022F: 'StripRowCounts',
    0x02BC: 'XMP',
    0x800D: 'ImageID',
    0x87AC: 'ImageLayer',

    // Private tags
    0x80A4: 'WangAnnotatio',
    0x82A5: 'MDFileTag',
    0x82A6: 'MDScalePixel',
    0x82A7: 'MDColorTable',
    0x82A8: 'MDLabName',
    0x82A9: 'MDSampleInfo',
    0x82AA: 'MDPrepDate',
    0x82AB: 'MDPrepTime',
    0x82AC: 'MDFileUnits',
    0x830E: 'ModelPixelScaleTag',
    0x83BB: 'IPTC',
    0x847E: 'INGRPacketDataTag',
    0x847F: 'INGRFlagRegisters',
    0x8480: 'IrasBTransformationMatrix',
    0x8482: 'ModelTiepointTag',
    0x85D8: 'ModelTransformationTag',
    0x8649: 'Photoshop',
    0x8769: 'ExifIFD',
    0x8773: 'ICCProfile',
    0x87AF: 'GeoKeyDirectoryTag',
    0x87B0: 'GeoDoubleParamsTag',
    0x87B1: 'GeoAsciiParamsTag',
    0x8825: 'GPSIFD',
    0x885C: 'HylaFAXFaxRecvParams',
    0x885D: 'HylaFAXFaxSubAddress',
    0x885E: 'HylaFAXFaxRecvTime',
    0x935C: 'ImageSourceData',
    0xA005: 'InteroperabilityIFD',
    0xA480: 'GDAL_METADATA',
    0xA481: 'GDAL_NODATA',
    0xC427: 'OceScanjobDescription',
    0xC428: 'OceApplicationSelector',
    0xC429: 'OceIdentificationNumber',
    0xC42A: 'OceImageLogicCharacteristics',
    0xC612: 'DNGVersion',
    0xC613: 'DNGBackwardVersion',
    0xC614: 'UniqueCameraModel',
    0xC615: 'LocalizedCameraModel',
    0xC616: 'CFAPlaneColor',
    0xC617: 'CFALayout',
    0xC618: 'LinearizationTable',
    0xC619: 'BlackLevelRepeatDim',
    0xC61A: 'BlackLevel',
    0xC61B: 'BlackLevelDeltaH',
    0xC61C: 'BlackLevelDeltaV',
    0xC61D: 'WhiteLevel',
    0xC61E: 'DefaultScale',
    0xC61F: 'DefaultCropOrigin',
    0xC620: 'DefaultCropSize',
    0xC621: 'ColorMatrix1',
    0xC622: 'ColorMatrix2',
    0xC623: 'CameraCalibration1',
    0xC624: 'CameraCalibration2',
    0xC625: 'ReductionMatrix1',
    0xC626: 'ReductionMatrix2',
    0xC627: 'AnalogBalance',
    0xC628: 'AsShotNeutral',
    0xC629: 'AsShotWhiteXY',
    0xC62A: 'BaselineExposure',
    0xC62B: 'BaselineNoise',
    0xC62C: 'BaselineSharpness',
    0xC62D: 'BayerGreenSplit',
    0xC62E: 'LinearResponseLimit',
    0xC62F: 'CameraSerialNumber',
    0xC630: 'LensInfo',
    0xC631: 'ChromaBlurRadius',
    0xC632: 'AntiAliasStrength',
    0xC634: 'DNGPrivateData',
    0xC635: 'MakerNoteSafety',
    0xC65A: 'CalibrationIlluminant1',
    0xC65B: 'CalibrationIlluminant2',
    0xC65C: 'BestQualityScale',
    0xC660: 'AliasLayerMetadata'
};

const tagsByName = {};
for (var i$1 in tagsById) {
    tagsByName[tagsById[i$1]] = i$1;
}

var standard = {
    tagsById,
    tagsByName
};

const tagsById$1 = {
    0x829A: 'ExposureTime',
    0x829D: 'FNumber',
    0x8822: 'ExposureProgram',
    0x8824: 'SpectralSensitivity',
    0x8827: 'ISOSpeedRatings',
    0x8828: 'OECF',
    0x8830: 'SensitivityType',
    0x8831: 'StandardOutputSensitivity',
    0x8832: 'RecommendedExposureIndex',
    0x8833: 'ISOSpeed',
    0x8834: 'ISOSpeedLatitudeyyy',
    0x8835: 'ISOSpeedLatitudezzz',
    0x9000: 'ExifVersion',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0x9101: 'ComponentsConfiguration',
    0x9102: 'CompressedBitsPerPixel',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9203: 'BrightnessValue',
    0x9204: 'ExposureBiasValue',
    0x9205: 'MaxApertureValue',
    0x9206: 'SubjectDistance',
    0x9207: 'MeteringMode',
    0x9208: 'LightSource',
    0x9209: 'Flash',
    0x920A: 'FocalLength',
    0x9214: 'SubjectArea',
    0x927C: 'MakerNote',
    0x9286: 'UserComment',
    0x9290: 'SubsecTime',
    0x9291: 'SubsecTimeOriginal',
    0x9292: 'SubsecTimeDigitized',
    0xA000: 'FlashpixVersion',
    0xA001: 'ColorSpace',
    0xA002: 'PixelXDimension',
    0xA003: 'PixelYDimension',
    0xA004: 'RelatedSoundFile',
    0xA20B: 'FlashEnergy',
    0xA20C: 'SpatialFrequencyResponse',
    0xA20E: 'FocalPlaneXResolution',
    0xA20F: 'FocalPlaneYResolution',
    0xA210: 'FocalPlaneResolutionUnit',
    0xA214: 'SubjectLocation',
    0xA215: 'ExposureIndex',
    0xA217: 'SensingMethod',
    0xA300: 'FileSource',
    0xA301: 'SceneType',
    0xA302: 'CFAPattern',
    0xA401: 'CustomRendered',
    0xA402: 'ExposureMode',
    0xA403:	'WhiteBalance',
    0xA404:	'DigitalZoomRatio',
    0xA405:	'FocalLengthIn35mmFilm',
    0xA406:	'SceneCaptureType',
    0xA407:	'GainControl',
    0xA408:	'Contrast',
    0xA409:	'Saturation',
    0xA40A:	'Sharpness',
    0xA40B:	'DeviceSettingDescription',
    0xA40C:	'SubjectDistanceRange',
    0xA420:	'ImageUniqueID',
    0xA430: 'CameraOwnerName',
    0xA431: 'BodySerialNumber',
    0xA432: 'LensSpecification',
    0xA433: 'LensMake',
    0xA434: 'LensModel',
    0xA435: 'LensSerialNumber',
    0xA500: 'Gamma'
};

const tagsByName$1 = {};
for (var i$2 in tagsById$1) {
    tagsByName$1[tagsById$1[i$2]] = i$2;
}

var exif = {
    tagsById: tagsById$1,
    tagsByName: tagsByName$1
};

const tagsById$2 = {
    0x0000: 'GPSVersionID',
    0x0001: 'GPSLatitudeRef',
    0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude',
    0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude',
    0x0007: 'GPSTimeStamp',
    0x0008: 'GPSSatellites',
    0x0009: 'GPSStatus',
    0x000A: 'GPSMeasureMode',
    0x000B: 'GPSDOP',
    0x000C: 'GPSSpeedRef',
    0x000D: 'GPSSpeed',
    0x000E: 'GPSTrackRef',
    0x000F: 'GPSTrack',
    0x0010: 'GPSImgDirectionRef',
    0x0011: 'GPSImgDirection',
    0x0012: 'GPSMapDatum',
    0x0013: 'GPSDestLatitudeRef',
    0x0014: 'GPSDestLatitude',
    0x0015: 'GPSDestLongitudeRef',
    0x0016: 'GPSDestLongitude',
    0x0017: 'GPSDestBearingRef',
    0x0018: 'GPSDestBearing',
    0x0019: 'GPSDestDistanceRef',
    0x001A: 'GPSDestDistance',
    0x001B: 'GPSProcessingMethod',
    0x001C: 'GPSAreaInformation',
    0x001D: 'GPSDateStamp',
    0x001E: 'GPSDifferential',
    0x001F: 'GPSHPositioningError'
};

const tagsByName$2 = {};
for (var i$3 in tagsById$2) {
    tagsByName$2[tagsById$2[i$3]] = i$3;
}

var gps = {
    tagsById: tagsById$2,
    tagsByName: tagsByName$2
};

const tags = {
    standard: standard,
    exif: exif,
    gps: gps
};

class IFD {
    constructor(kind) {
        if (!kind) {
            throw new Error('missing kind');
        }
        this.data = null;
        this.fields = new Map();
        this.kind = kind;
        this._map = null;
    }

    get(tag) {
        if (typeof tag === 'number') {
            return this.fields.get(tag);
        } else if (typeof tag === 'string') {
            return this.fields.get(tags[this.kind].tagsByName[tag]);
        } else {
            throw new Error('expected a number or string');
        }
    }

    get map() {
        if (!this._map) {
            this._map = {};
            const taglist = tags[this.kind].tagsById;
            for (var key of this.fields.keys()) {
                if (taglist[key]) {
                    this._map[taglist[key]] = this.fields.get(key);
                }
            }
        }
        return this._map;
    }
}

var ifd = IFD;

const dateTimeRegex = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

class TiffIfd extends ifd {
    constructor() {
        super('standard');
    }

    // Custom fields
    get size() {
        return this.width * this.height;
    }
    get width() {
        return this.imageWidth;
    }
    get height() {
        return this.imageLength;
    }
    get components() {
        return this.samplesPerPixel;
    }
    get date() {
        var date = new Date();
        var result = dateTimeRegex.exec(this.dateTime);
        date.setFullYear(result[1], result[2] - 1, result[3]);
        date.setHours(result[4], result[5], result[6]);
        return date;
    }

    // IFD fields
    get newSubfileType() {
        return this.get(254);
    }
    get imageWidth() {
        return this.get(256);
    }
    get imageLength() {
        return this.get(257);
    }
    get bitsPerSample() {
        return this.get(258);
    }
    get compression() {
        return this.get(259) || 1;
    }
    get type() {
        return this.get(262);
    }
    get fillOrder() {
        return this.get(266) || 1;
    }
    get documentName() {
        return this.get(269);
    }
    get imageDescription() {
        return this.get(270);
    }
    get stripOffsets() {
        return alwaysArray(this.get(273));
    }
    get orientation() {
        return this.get(274);
    }
    get samplesPerPixel() {
        return this.get(277);
    }
    get rowsPerStrip() {
        return this.get(278);
    }
    get stripByteCounts() {
        return alwaysArray(this.get(279));
    }
    get minSampleValue() {
        return this.get(280) || 0;
    }
    get maxSampleValue() {
        return this.get(281) || Math.pow(2, this.bitsPerSample) - 1;
    }
    get xResolution() {
        return this.get(282);
    }
    get yResolution() {
        return this.get(283);
    }
    get planarConfiguration() {
        return this.get(284) || 1;
    }
    get resolutionUnit() {
        return this.get(296) || 2;
    }
    get dateTime() {
        return this.get(306);
    }
    get predictor() {
        return this.get(317) || 1;
    }
    get sampleFormat() {
        return this.get(339) || 1;
    }
    get sMinSampleValue() {
        return this.get(340) || this.minSampleValue;
    }
    get sMaxSampleValue() {
        return this.get(341) || this.maxSampleValue;
    }
}

function alwaysArray(value) {
    if (typeof value === 'number') return [value];
    return value;
}

var tiffIfd = TiffIfd;

var types$1 = new Map([
    [1, [1, readByte]],       // BYTE
    [2, [1, readASCII]],      // ASCII
    [3, [2, readShort]],      // SHORT
    [4, [4, readLong]],       // LONG
    [5, [8, readRational]],   // RATIONAL
    [6, [1, readSByte]],      // SBYTE
    [7, [1, readByte]],       // UNDEFINED
    [8, [2, readSShort]],     // SSHORT
    [9, [4, readSLong]],      // SLONG
    [10, [8, readSRational]], // SRATIONAL
    [11, [4, readFloat]],     // FLOAT
    [12, [8, readDouble]]     // DOUBLE
]);

var getByteLength = function (type, count) {
    return types$1.get(type)[0] * count;
};

var readData = function (decoder, type, count) {
    return types$1.get(type)[1](decoder, count);
};

function readByte(decoder, count) {
    if (count === 1) return decoder.readUint8();
    var array = new Uint8Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint8();
    }
    return array;
}

function readASCII(decoder, count) {
    var strings = [];
    var currentString = '';
    for (var i = 0; i < count; i++) {
        var char = String.fromCharCode(decoder.readUint8());
        if (char === '\0') {
            strings.push(currentString);
            currentString = '';
        } else {
            currentString += char;
        }
    }
    if (strings.length === 1) {
        return strings[0];
    } else {
        return strings;
    }
}

function readShort(decoder, count) {
    if (count === 1) return decoder.readUint16();
    var array = new Uint16Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint16();
    }
    return array;
}

function readLong(decoder, count) {
    if (count === 1) return decoder.readUint32();
    var array = new Uint32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint32();
    }
    return array;
}

function readRational(decoder, count) {
    if (count === 1) {
        return decoder.readUint32() / decoder.readUint32();
    }
    var rationals = new Array(count);
    for (var i = 0; i < count; i++) {
        rationals[i] = decoder.readUint32() / decoder.readUint32();
    }
    return rationals;
}

function readSByte(decoder, count) {
    if (count === 1) return decoder.readInt8();
    var array = new Int8Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt8();
    }
    return array;
}

function readSShort(decoder, count) {
    if (count === 1) return decoder.readInt16();
    var array = new Int16Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt16();
    }
    return array;
}

function readSLong(decoder, count) {
    if (count === 1) return decoder.readInt32();
    var array = new Int32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt32();
    }
    return array;
}

function readSRational(decoder, count) {
    if (count === 1) {
        return decoder.readInt32() / decoder.readInt32();
    }
    var rationals = new Array(count);
    for (var i = 0; i < count; i++) {
        rationals[i] = decoder.readInt32() / decoder.readInt32();
    }
    return rationals;
}

function readFloat(decoder, count) {
    if (count === 1) return decoder.readFloat32();
    var array = new Float32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readFloat32();
    }
    return array;
}

function readDouble(decoder, count) {
    if (count === 1) return decoder.readFloat64();
    var array = new Float64Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readFloat64();
    }
    return array;
}

var ifdValue = {
	getByteLength: getByteLength,
	readData: readData
};

const defaultOptions$13 = {
    ignoreImageData: false,
    onlyFirst: false
};

class TIFFDecoder extends IOBuffer_1$3 {
    constructor(data, options) {
        super(data, options);
        this._nextIFD = 0;
    }

    decode(options) {
        options = Object.assign({}, defaultOptions$13, options);
        const result = [];
        this.decodeHeader();
        while (this._nextIFD) {
            result.push(this.decodeIFD(options));
            if (options.onlyFirst) {
                return result[0];
            }
        }
        return result;
    }

    decodeHeader() {
        // Byte offset
        let value = this.readUint16();
        if (value === 0x4949) {
            this.setLittleEndian();
        } else if (value === 0x4D4D) {
            this.setBigEndian();
        } else {
            throw new Error('invalid byte order: 0x' + value.toString(16));
        }

        // Magic number
        value = this.readUint16();
        if (value !== 42) {
            throw new Error('not a TIFF file');
        }

        // Offset of the first IFD
        this._nextIFD = this.readUint32();
    }

    decodeIFD(options) {
        this.seek(this._nextIFD);

        var ifd$$1;
        if (!options.kind) {
            ifd$$1 = new tiffIfd();
        } else {
            ifd$$1 = new ifd(options.kind);
        }

        const numEntries = this.readUint16();
        for (var i = 0; i < numEntries; i++) {
            this.decodeIFDEntry(ifd$$1);
        }
        if (!options.ignoreImageData) {
            this.decodeImageData(ifd$$1);
        }
        this._nextIFD = this.readUint32();
        return ifd$$1;
    }

    decodeIFDEntry(ifd$$1) {
        const offset = this.offset;
        const tag = this.readUint16();
        const type = this.readUint16();
        const numValues = this.readUint32();

        if (type < 1 || type > 12) {
            this.skip(4); // unknown type, skip this value
            return;
        }

        const valueByteLength = ifdValue.getByteLength(type, numValues);
        if (valueByteLength > 4) {
            this.seek(this.readUint32());
        }

        const value = ifdValue.readData(this, type, numValues);
        ifd$$1.fields.set(tag, value);

        // Read sub-IFDs
        if (tag === 0x8769 || tag === 0x8825) {
            let currentOffset = this.offset;
            let kind;
            if (tag === 0x8769) {
                kind = 'exif';
            } else if (tag === 0x8825) {
                kind = 'gps';
            }
            this._nextIFD = value;
            ifd$$1[kind] = this.decodeIFD({
                kind,
                ignoreImageData: true
            });
            this.offset = currentOffset;
        }

        // go to the next entry
        this.seek(offset);
        this.skip(12);
    }

    decodeImageData(ifd$$1) {
        const orientation = ifd$$1.orientation;
        if (orientation && orientation !== 1) {
            unsupported('orientation', orientation);
        }
        switch (ifd$$1.type) {
            case 1: // BlackIsZero
            case 2: // RGB
                this.readStripData(ifd$$1);
                break;
            default:
                unsupported('image type', ifd$$1.type);
                break;
        }
    }

    readStripData(ifd$$1) {
        const width = ifd$$1.width;
        const height = ifd$$1.height;

        const bitDepth = validateBitDepth(ifd$$1.bitsPerSample);
        const sampleFormat = ifd$$1.sampleFormat;
        let size = width * height;
        const data = getDataArray(size, 1, bitDepth, sampleFormat);

        const compression = ifd$$1.compression;
        const rowsPerStrip = ifd$$1.rowsPerStrip;
        const maxPixels = rowsPerStrip * width;
        const stripOffsets = ifd$$1.stripOffsets;
        const stripByteCounts = ifd$$1.stripByteCounts;

        var pixel = 0;
        for (var i = 0; i < stripOffsets.length; i++) {
            var stripData = this.getStripData(compression, stripOffsets[i], stripByteCounts[i]);
            // Last strip can be smaller
            var length = size > maxPixels ? maxPixels : size;
            size -= length;
            if (bitDepth === 8) {
                pixel = fill8bit(data, stripData, pixel, length);
            } else if (bitDepth === 16) {
                pixel = fill16bit(data, stripData, pixel, length, this.isLittleEndian());
            } else if (bitDepth === 32 && sampleFormat === 3) {
                pixel = fillFloat32(data, stripData, pixel, length, this.isLittleEndian());
            } else {
                unsupported('bitDepth', bitDepth);
            }
        }

        ifd$$1.data = data;
    }

    getStripData(compression, offset, byteCounts) {
        switch (compression) {
            case 1: // No compression
                return new DataView(this.buffer, offset, byteCounts);
            case 2: // CCITT Group 3 1-Dimensional Modified Huffman run length encoding
            case 32773: // PackBits compression
                return unsupported('Compression', compression);
            default:
                throw new Error('invalid compression: ' + compression);
        }
    }
}

var tiffDecoder = TIFFDecoder;

function getDataArray(size, channels, bitDepth, sampleFormat) {
    if (bitDepth === 8) {
        return new Uint8Array(size * channels);
    } else if (bitDepth === 16) {
        return new Uint16Array(size * channels);
    } else if (bitDepth === 32 && sampleFormat === 3) {
        return new Float32Array(size * channels);
    } else {
        return unsupported('bit depth / sample format', bitDepth + ' / ' + sampleFormat);
    }
}

function fill8bit(dataTo, dataFrom, index, length) {
    for (var i = 0; i < length; i++) {
        dataTo[index++] = dataFrom.getUint8(i);
    }
    return index;
}

function fill16bit(dataTo, dataFrom, index, length, littleEndian) {
    for (var i = 0; i < length * 2; i += 2) {
        dataTo[index++] = dataFrom.getUint16(i, littleEndian);
    }
    return index;
}

function fillFloat32(dataTo, dataFrom, index, length, littleEndian) {
    for (var i = 0; i < length * 4; i += 4) {
        dataTo[index++] = dataFrom.getFloat32(i, littleEndian);
    }
    return index;
}

function unsupported(type, value) {
    throw new Error('Unsupported ' + type + ': ' + value);
}

function validateBitDepth(bitDepth) {
    if (bitDepth.length) {
        const bitDepthArray = bitDepth;
        bitDepth = bitDepthArray[0];
        for (var i = 0; i < bitDepthArray.length; i++) {
            if (bitDepthArray[i] !== bitDepth) {
                unsupported('bit depth', bitDepthArray);
            }
        }
    }
    return bitDepth;
}

var decode$3 = function decodeTIFF(data, options) {
    const decoder = new tiffDecoder(data, options);
    return decoder.decode(options);
};

var decode$2 = decode$3;

var index$34 = {
	decode: decode$2
};

function decode$1(data) {
    const buffer = new IOBuffer_1$3(data);
    const result = {};
    buffer.setBigEndian();
    const val = buffer.readUint16();
    if (val !== 0xffd8) {
        throw new Error('SOI marker not found. Not a valid JPEG file');
    }
    const next = buffer.readUint16();
    if (next === 0xffe1) {
        const length = buffer.readUint16();
        const header = buffer.readBytes(6);
        if (header[0] === 69 && // E
            header[1] === 120 && // x
            header[2] === 105 && // i
            header[3] === 102 && // f
            header[4] === 0 &&
            header[5] === 0) {
       //     buffer.skip(2);
            const exif = index$34.decode(buffer, {
                onlyFirst: true,
                ignoreImageData: true,
                offset: buffer.offset
            });
            result.exif = exif;
        }
    }
    return result;
}

var decode_1 = decode$1;

var decode = decode_1;

var index$37 = input => {
	const buf = new Uint8Array(input);

	if (!(buf && buf.length > 1)) {
		return null;
	}

	const check = (header, opts) => {
		opts = Object.assign({
			offset: 0
		}, opts);

		for (let i = 0; i < header.length; i++) {
			if (header[i] !== buf[i + opts.offset]) {
				return false;
			}
		}

		return true;
	};

	if (check([0xFF, 0xD8, 0xFF])) {
		return {
			ext: 'jpg',
			mime: 'image/jpeg'
		};
	}

	if (check([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
		return {
			ext: 'png',
			mime: 'image/png'
		};
	}

	if (check([0x47, 0x49, 0x46])) {
		return {
			ext: 'gif',
			mime: 'image/gif'
		};
	}

	if (check([0x57, 0x45, 0x42, 0x50], {offset: 8})) {
		return {
			ext: 'webp',
			mime: 'image/webp'
		};
	}

	if (check([0x46, 0x4C, 0x49, 0x46])) {
		return {
			ext: 'flif',
			mime: 'image/flif'
		};
	}

	// Needs to be before `tif` check
	if (
		(check([0x49, 0x49, 0x2A, 0x0]) || check([0x4D, 0x4D, 0x0, 0x2A])) &&
		check([0x43, 0x52], {offset: 8})
	) {
		return {
			ext: 'cr2',
			mime: 'image/x-canon-cr2'
		};
	}

	if (
		check([0x49, 0x49, 0x2A, 0x0]) ||
		check([0x4D, 0x4D, 0x0, 0x2A])
	) {
		return {
			ext: 'tif',
			mime: 'image/tiff'
		};
	}

	if (check([0x42, 0x4D])) {
		return {
			ext: 'bmp',
			mime: 'image/bmp'
		};
	}

	if (check([0x49, 0x49, 0xBC])) {
		return {
			ext: 'jxr',
			mime: 'image/vnd.ms-photo'
		};
	}

	if (check([0x38, 0x42, 0x50, 0x53])) {
		return {
			ext: 'psd',
			mime: 'image/vnd.adobe.photoshop'
		};
	}

	// Needs to be before the `zip` check
	if (
		check([0x50, 0x4B, 0x3, 0x4]) &&
		check([0x6D, 0x69, 0x6D, 0x65, 0x74, 0x79, 0x70, 0x65, 0x61, 0x70, 0x70, 0x6C, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6F, 0x6E, 0x2F, 0x65, 0x70, 0x75, 0x62, 0x2B, 0x7A, 0x69, 0x70], {offset: 30})
	) {
		return {
			ext: 'epub',
			mime: 'application/epub+zip'
		};
	}

	// Needs to be before `zip` check
	// Assumes signed `.xpi` from addons.mozilla.org
	if (
		check([0x50, 0x4B, 0x3, 0x4]) &&
		check([0x4D, 0x45, 0x54, 0x41, 0x2D, 0x49, 0x4E, 0x46, 0x2F, 0x6D, 0x6F, 0x7A, 0x69, 0x6C, 0x6C, 0x61, 0x2E, 0x72, 0x73, 0x61], {offset: 30})
	) {
		return {
			ext: 'xpi',
			mime: 'application/x-xpinstall'
		};
	}

	if (
		check([0x50, 0x4B]) &&
		(buf[2] === 0x3 || buf[2] === 0x5 || buf[2] === 0x7) &&
		(buf[3] === 0x4 || buf[3] === 0x6 || buf[3] === 0x8)
	) {
		return {
			ext: 'zip',
			mime: 'application/zip'
		};
	}

	if (check([0x75, 0x73, 0x74, 0x61, 0x72], {offset: 257})) {
		return {
			ext: 'tar',
			mime: 'application/x-tar'
		};
	}

	if (
		check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7]) &&
		(buf[6] === 0x0 || buf[6] === 0x1)
	) {
		return {
			ext: 'rar',
			mime: 'application/x-rar-compressed'
		};
	}

	if (check([0x1F, 0x8B, 0x8])) {
		return {
			ext: 'gz',
			mime: 'application/gzip'
		};
	}

	if (check([0x42, 0x5A, 0x68])) {
		return {
			ext: 'bz2',
			mime: 'application/x-bzip2'
		};
	}

	if (check([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])) {
		return {
			ext: '7z',
			mime: 'application/x-7z-compressed'
		};
	}

	if (check([0x78, 0x01])) {
		return {
			ext: 'dmg',
			mime: 'application/x-apple-diskimage'
		};
	}

	if (
		(
			check([0x0, 0x0, 0x0]) &&
			(buf[3] === 0x18 || buf[3] === 0x20) &&
			check([0x66, 0x74, 0x79, 0x70], {offset: 4})
		) ||
		check([0x33, 0x67, 0x70, 0x35]) ||
		(
			check([0x0, 0x0, 0x0, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]) &&
			check([0x6D, 0x70, 0x34, 0x31, 0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D], {offset: 16})
		) ||
		check([0x0, 0x0, 0x0, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]) ||
		check([0x0, 0x0, 0x0, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32, 0x0, 0x0, 0x0, 0x0])
	) {
		return {
			ext: 'mp4',
			mime: 'video/mp4'
		};
	}

	if (check([0x0, 0x0, 0x0, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x56])) {
		return {
			ext: 'm4v',
			mime: 'video/x-m4v'
		};
	}

	if (check([0x4D, 0x54, 0x68, 0x64])) {
		return {
			ext: 'mid',
			mime: 'audio/midi'
		};
	}

	// https://github.com/threatstack/libmagic/blob/master/magic/Magdir/matroska
	if (check([0x1A, 0x45, 0xDF, 0xA3])) {
		const sliced = buf.subarray(4, 4 + 4096);
		const idPos = sliced.findIndex((el, i, arr) => arr[i] === 0x42 && arr[i + 1] === 0x82);

		if (idPos >= 0) {
			const docTypePos = idPos + 3;
			const findDocType = type => Array.from(type).every((c, i) => sliced[docTypePos + i] === c.charCodeAt(0));

			if (findDocType('matroska')) {
				return {
					ext: 'mkv',
					mime: 'video/x-matroska'
				};
			}

			if (findDocType('webm')) {
				return {
					ext: 'webm',
					mime: 'video/webm'
				};
			}
		}
	}

	if (check([0x0, 0x0, 0x0, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20]) ||
		check([0x66, 0x72, 0x65, 0x65], {offset: 4}) ||
		check([0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20], {offset: 4}) ||
		check([0x6D, 0x64, 0x61, 0x74], {offset: 4}) || // MJPEG
		check([0x77, 0x69, 0x64, 0x65], {offset: 4})) {
		return {
			ext: 'mov',
			mime: 'video/quicktime'
		};
	}

	if (
		check([0x52, 0x49, 0x46, 0x46]) &&
		check([0x41, 0x56, 0x49], {offset: 8})
	) {
		return {
			ext: 'avi',
			mime: 'video/x-msvideo'
		};
	}

	if (check([0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9])) {
		return {
			ext: 'wmv',
			mime: 'video/x-ms-wmv'
		};
	}

	if (check([0x0, 0x0, 0x1, 0xBA])) {
		return {
			ext: 'mpg',
			mime: 'video/mpeg'
		};
	}

	if (
		check([0x49, 0x44, 0x33]) ||
		check([0xFF, 0xFB])
	) {
		return {
			ext: 'mp3',
			mime: 'audio/mpeg'
		};
	}

	if (
		check([0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], {offset: 4}) ||
		check([0x4D, 0x34, 0x41, 0x20])
	) {
		return {
			ext: 'm4a',
			mime: 'audio/m4a'
		};
	}

	// Needs to be before `ogg` check
	if (check([0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], {offset: 28})) {
		return {
			ext: 'opus',
			mime: 'audio/opus'
		};
	}

	if (check([0x4F, 0x67, 0x67, 0x53])) {
		return {
			ext: 'ogg',
			mime: 'audio/ogg'
		};
	}

	if (check([0x66, 0x4C, 0x61, 0x43])) {
		return {
			ext: 'flac',
			mime: 'audio/x-flac'
		};
	}

	if (
		check([0x52, 0x49, 0x46, 0x46]) &&
		check([0x57, 0x41, 0x56, 0x45], {offset: 8})
	) {
		return {
			ext: 'wav',
			mime: 'audio/x-wav'
		};
	}

	if (check([0x23, 0x21, 0x41, 0x4D, 0x52, 0x0A])) {
		return {
			ext: 'amr',
			mime: 'audio/amr'
		};
	}

	if (check([0x25, 0x50, 0x44, 0x46])) {
		return {
			ext: 'pdf',
			mime: 'application/pdf'
		};
	}

	if (check([0x4D, 0x5A])) {
		return {
			ext: 'exe',
			mime: 'application/x-msdownload'
		};
	}

	if (
		(buf[0] === 0x43 || buf[0] === 0x46) &&
		check([0x57, 0x53], {offset: 1})
	) {
		return {
			ext: 'swf',
			mime: 'application/x-shockwave-flash'
		};
	}

	if (check([0x7B, 0x5C, 0x72, 0x74, 0x66])) {
		return {
			ext: 'rtf',
			mime: 'application/rtf'
		};
	}

	if (check([0x00, 0x61, 0x73, 0x6D])) {
		return {
			ext: 'wasm',
			mime: 'application/wasm'
		};
	}

	if (
		check([0x77, 0x4F, 0x46, 0x46]) &&
		(
			check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
			check([0x4F, 0x54, 0x54, 0x4F], {offset: 4})
		)
	) {
		return {
			ext: 'woff',
			mime: 'application/font-woff'
		};
	}

	if (
		check([0x77, 0x4F, 0x46, 0x32]) &&
		(
			check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
			check([0x4F, 0x54, 0x54, 0x4F], {offset: 4})
		)
	) {
		return {
			ext: 'woff2',
			mime: 'application/font-woff'
		};
	}

	if (
		check([0x4C, 0x50], {offset: 34}) &&
		(
			check([0x00, 0x00, 0x01], {offset: 8}) ||
			check([0x01, 0x00, 0x02], {offset: 8}) ||
			check([0x02, 0x00, 0x02], {offset: 8})
		)
	) {
		return {
			ext: 'eot',
			mime: 'application/octet-stream'
		};
	}

	if (check([0x00, 0x01, 0x00, 0x00, 0x00])) {
		return {
			ext: 'ttf',
			mime: 'application/font-sfnt'
		};
	}

	if (check([0x4F, 0x54, 0x54, 0x4F, 0x00])) {
		return {
			ext: 'otf',
			mime: 'application/font-sfnt'
		};
	}

	if (check([0x00, 0x00, 0x01, 0x00])) {
		return {
			ext: 'ico',
			mime: 'image/x-icon'
		};
	}

	if (check([0x46, 0x4C, 0x56, 0x01])) {
		return {
			ext: 'flv',
			mime: 'video/x-flv'
		};
	}

	if (check([0x25, 0x21])) {
		return {
			ext: 'ps',
			mime: 'application/postscript'
		};
	}

	if (check([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])) {
		return {
			ext: 'xz',
			mime: 'application/x-xz'
		};
	}

	if (check([0x53, 0x51, 0x4C, 0x69])) {
		return {
			ext: 'sqlite',
			mime: 'application/x-sqlite3'
		};
	}

	if (check([0x4E, 0x45, 0x53, 0x1A])) {
		return {
			ext: 'nes',
			mime: 'application/x-nintendo-nes-rom'
		};
	}

	if (check([0x43, 0x72, 0x32, 0x34])) {
		return {
			ext: 'crx',
			mime: 'application/x-google-chrome-extension'
		};
	}

	if (
		check([0x4D, 0x53, 0x43, 0x46]) ||
		check([0x49, 0x53, 0x63, 0x28])
	) {
		return {
			ext: 'cab',
			mime: 'application/vnd.ms-cab-compressed'
		};
	}

	// Needs to be before `ar` check
	if (check([0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E, 0x0A, 0x64, 0x65, 0x62, 0x69, 0x61, 0x6E, 0x2D, 0x62, 0x69, 0x6E, 0x61, 0x72, 0x79])) {
		return {
			ext: 'deb',
			mime: 'application/x-deb'
		};
	}

	if (check([0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E])) {
		return {
			ext: 'ar',
			mime: 'application/x-unix-archive'
		};
	}

	if (check([0xED, 0xAB, 0xEE, 0xDB])) {
		return {
			ext: 'rpm',
			mime: 'application/x-rpm'
		};
	}

	if (
		check([0x1F, 0xA0]) ||
		check([0x1F, 0x9D])
	) {
		return {
			ext: 'Z',
			mime: 'application/x-compress'
		};
	}

	if (check([0x4C, 0x5A, 0x49, 0x50])) {
		return {
			ext: 'lz',
			mime: 'application/x-lzip'
		};
	}

	if (check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
		return {
			ext: 'msi',
			mime: 'application/x-msi'
		};
	}

	if (check([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02])) {
		return {
			ext: 'mxf',
			mime: 'application/mxf'
		};
	}

	if (check([0x42, 0x4C, 0x45, 0x4E, 0x44, 0x45, 0x52])) {
		return {
			ext: 'blend',
			mime: 'application/x-blender'
		};
	}

	return null;
};

const imageExts = new Set([
	'jpg',
	'png',
	'gif',
	'webp',
	'tif',
	'bmp',
	'jxr',
	'psd'
]);

var index$36 = input => {
	const ret = index$37(input);
	return imageExts.has(ret && ret.ext) ? ret : null;
};

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
var lookup = new Uint8Array(256);
for (var i$4 = 0; i$4 < chars.length; i$4++) {
    lookup[chars.charCodeAt(i$4)] = i$4;
}

function encode$3(bytes) {
    var i = void 0;
    var len = bytes.length;
    var base64 = '';

    for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
        base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
        base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
}

function decode$5(base64) {
    var bufferLength = base64.length * 0.75;
    var len = base64.length;
    var p = 0;
    var encoded1 = void 0,
        encoded2 = void 0,
        encoded3 = void 0,
        encoded4 = void 0;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    var bytes = new Uint8Array(bufferLength);

    for (var _i = 0; _i < len; _i += 4) {
        encoded1 = lookup[base64.charCodeAt(_i)];
        encoded2 = lookup[base64.charCodeAt(_i + 1)];
        encoded3 = lookup[base64.charCodeAt(_i + 2)];
        encoded4 = lookup[base64.charCodeAt(_i + 3)];

        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }

    return bytes;
}

function toBase64URL(u8, type) {
    var base64 = encode$3(u8);
    return `data:${type};base64,${base64}`;
}

var isDataURL = /^data:[a-z]+\/([a-z]+);base64,/;

function loadImage$1(image, options) {
    if (typeof image === 'string') {
        return loadURL(image, options);
    } else if (image instanceof ArrayBuffer) {
        return Promise.resolve(loadBinary(new Uint8Array(image)));
    } else if (image.buffer) {
        return Promise.resolve(loadBinary(image));
    } else {
        throw new Error('argument to "load" must be a string or buffer.');
    }
}

function loadBinary(image, base64Url) {
    var type = index$36(image);
    if (type) {
        switch (type.mime) {
            case 'image/png':
                return loadPNG(image);
            case 'image/jpeg':
                {
                    var decoded = decode(image);
                    var meta = void 0;
                    if (decoded.exif) {
                        meta = getMetadata(decoded.exif);
                    }
                    return loadGeneric(getBase64('image/jpeg'), { meta });
                }
            case 'image/tiff':
                return loadTIFF(image);
            default:
                return loadGeneric(getBase64(type.mime));
        }
    }
    return loadGeneric(getBase64('application/octet-stream'));
    function getBase64(type) {
        if (base64Url) {
            return base64Url;
        } else {
            return toBase64URL(image, type);
        }
    }
}

function loadURL(url, options) {
    var dataURL = url.slice(0, 64).match(isDataURL);
    var binaryDataP = void 0;
    if (dataURL) {
        binaryDataP = Promise.resolve(decode$5(url.slice(dataURL[0].length)));
    } else {
        binaryDataP = fetchBinary(url, options);
    }
    return binaryDataP.then(binaryData => {
        var uint8 = new Uint8Array(binaryData);
        return loadBinary(uint8, dataURL ? url : undefined);
    });
}

function loadPNG(data) {
    var png = decodePNG(data);
    var bitDepth = png.bitDepth;
    var bitmap = png.data;
    if (bitDepth === 8) {
        bitmap = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength);
    }

    var type = png.colourType;
    var components = void 0;
    var alpha = 0;
    switch (type) {
        case 0:
            components = 1;break;
        case 2:
            components = 3;break;
        case 4:
            components = 1;alpha = 1;break;
        case 6:
            components = 3;alpha = 1;break;
        default:
            throw new Error(`Unexpected colourType: ${type}`);
    }

    return new Image$1(png.width, png.height, bitmap, { components, alpha, bitDepth });
}

function loadTIFF(data) {
    var result = decode$2(data);
    if (result.length === 1) {
        return getImageFromIFD(result[0]);
    } else {
        return new Stack(result.map(getImageFromIFD));
    }
}

function getMetadata(image) {
    var metadata = {
        tiff: image
    };
    if (image.exif) {
        metadata.exif = image.exif;
    }
    if (image.gps) {
        metadata.gps = image.gps;
    }
    return metadata;
}

function getImageFromIFD(image) {
    return new Image$1(image.width, image.height, image.data, {
        components: 1,
        alpha: 0,
        colorModel: null,
        bitDepth: image.bitsPerSample.length ? image.bitsPerSample[0] : image.bitsPerSample,
        meta: getMetadata(image)
    });
}

function loadGeneric(url, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
        var image = new DOMImage();
        image.onload = function () {
            var w = image.width;
            var h = image.height;
            var canvas = new Canvas(w, h);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, w, h);
            var data = ctx.getImageData(0, 0, w, h).data;
            resolve(new Image$1(w, h, data, options));
        };
        image.onerror = function () {
            reject(new Error('Could not load ' + url));
        };
        image.src = url;
    });
}

var computedPropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get: undefined
};

var toString = Object.prototype.toString;
var imageStringTag = 'IJSImage';

/**
 * Class representing an image.
 * This class allows to manipulate easily images directly in the browser or in node.
 *
 * This library is designed to deal with scientific images (8 or 16 bit depth) and will be able to open
 * and process jpeg, png and uncompressed tiff images. It is designed to work in the browser
 * as on the server side in node.
 *
 * An image is characterized by:
 * * width and height
 * * colorModel (RGB, HSL, CMYK, GREY, ...)
 * * components: number of components, Grey scale images will have 1 component while RGB will have 3 and CMYK 4.
 * * alpha: 0 or 1 depending if there is an alpha channel. The
 *      alpha channel define the opacity of each pixel
 * * channels: number of channels (components + alpha)
 * * bitDepth : number of bits to define the intensity of a point.
 *      The values may be 1 for a binary image (mask), 8 for a normal image (each
 *      channel contains values between 0 and 255) and 16 for scientific images
 *      (each channel contains values between 0 and 65535).
 *      The png library and tiff library included in image-js allow to deal correctly with
 *      8 and 16 bit depth images.
 * * position : an array of 2 elements that allows to define a relative position
 *      to a parent image. This will be used in a crop or in the management
 *      of Region Of Interests (Roi) for exmaple
 * * data : an array that contains all the points of the image.
 *      Depending the bitDepth Uint8Array (1 bit), Uint8ClampedArray (8 bits),
 *      Uint16Array (16 bits), Float32Array (32 bits)
 *
 * In an image we have pixels and points:
 * * A pixel is an array that has as size the number of channels
 * and that contains all the values that define a particular pixel of the image.
 * * A point is an array of 2 elements that contains the x / y coordinate
 * of a specific pixel of the image
 *
 *
 * @class Image
 * @param {number} [width=1]
 * @param {number} [height=1]
 * @param {Array} [data] - Image data to load
 * @param {object} options
 *
 * @example
 *
 * In order to run the next examples you will have to install node and
 * create a new project
 *
 * To install node you could use nvm that can be installed from
 * https://github.com/creationix/nvm
 *
 * Once nvm is install:
 * nvm install stable
 * nvm alias default stable
 *
 * You may then create a folder, go in this folder and install image-js
 * mkdir test-image-js
 * cd test-image-js
 * npm install image-js
 *
 * In the test-image-js folder please also store please a test.jpg image like
 * wget https://raw.githubusercontent.com/image-js/core/c44bb2a0a45d95f43f3c1f8ecb58ee7afa752bb9/test/img/cat.jpg


 * @example

 // javascript code using node to get some info about the image

 // we load the library that was install using 'npm install image-js'
 const {Image} = require('image-js');

 // loading an image is asynchronous and will return a promise.
 // once the promise has been resolved the function in the 'then' method will
 // be executed
 Image.load('cat.jpg').then(function(image) {
        console.log('Width',image.width);
        console.log('Height',image.height);
        console.log('colorModel', image.colorModel);
        console.log('components', image.components);
        console.log('alpha', image.alpha);
        console.log('channels', image.channels);
        console.log('bitDepth', image.bitDepth);
});

 @example
// Convert an image to grey scale
const {Image} =require('image-js');

Image.load('cat.jpg').then(function(image) {
    var grey=image.grey();
    grey.save('cat-grey.jpg');
});

 @example
 // Split a RGB image in it's components
 const {Image} = require('image-js');

 Image.load('cat.jpg').then(function(image) {
    var components=image.split();
    components[0].save('cat-red.jpg');
    components[1].save('cat-green.jpg');
    components[2].save('cat-blur.jpg');
});


 @example
 // for this example you will need the picture of an ecstasy pill that is available on
 // wget https://raw.githubusercontent.com/image-js/core/854e70f50d63cc73d2dde1d2020fe61ba1b5ec05/test/img/xtc.png // the goal is to isolate the picture and to get a RGB histogram of the pill.
 // Practically this allows to classify pills based on the histogram similarity
 // This work was published at: http://dx.doi.org/10.1016/j.forsciint.2012.10.004

 const {Image} = require('image-js');

 Image.load('xtc.png').then(function(image) {


    var grey=image.grey({
        algorithm:'lightness'
    });
    // we create a mask, which is basically a binary image
    // a mask has as source a grey image and we will decide how to determine
    // the threshold to define what is white and what is black
    var mask=grey.mask({
        algorithm: 'li'
    });

    // it is possible to create an array of Region Of Interest (Roi) using
    // the RoiManager. A RoiManager will be applied on the original image
    // in order to be able to extract from the original image the regions

    // the result of this console.log result can diretly be pasted
    // in the browser
    // console.log(mask.toDataURL());


    var manager = image.getRoiManager();
    manager.fromMask(mask);
    var rois=manager.getRoi({
        positive: true,
        negative: false,
        minSurface: 100
    });

    // console.log(rois);

    // we can sort teh rois by surface
    // for demonstration we use an arrow function
    rois.sort((a, b) => b.surface-a.surface);

    // the first Roi (the biggest is expected to be the pill)

    var pillMask=rois[0].getMask({
        scale: 0.7   // we will scale down the mask to take just the center of the pill and avoid border effects
    });

    // image-js remembers the parent of the image and the relative
    // position of a derived image. This is the case for a crop as
    // well as for Roi

    var pill=image.extract(pillMask);
    pill.save('pill.jpg');

    var histogram=pill.getHistograms({maxSlots: 16});

    console.log(histogram);
});

 @example
 // Example of use of IJS in the browser

 <sript>
    var canvas = document.getElementById('myCanvasID');
    var image = IJS.fromCanvas(canvas);
 </script>
*/
class Image$1 {
    constructor(width, height, data, options) {
        if (width === undefined) {
            width = 1;
        }
        if (height === undefined) {
            height = 1;
        }

        // copy another image
        if (typeof width === 'object') {
            var otherImage = width;
            var cloneData = height === true;
            width = otherImage.width;
            height = otherImage.height;
            data = cloneData ? otherImage.data.slice() : otherImage.data;
            options = {
                position: otherImage.position,
                components: otherImage.components,
                alpha: otherImage.alpha,
                bitDepth: otherImage.bitDepth,
                colorModel: otherImage.colorModel,
                parent: otherImage,
                meta: otherImage.meta
            };
        }

        if (data && !data.length) {
            options = data;
            data = null;
        }
        if (options === undefined) {
            options = {};
        }

        this.width = width;
        this.height = height;

        if (this.width <= 0) {
            throw new RangeError('width must be greater than 0');
        }
        if (this.height <= 0) {
            throw new RangeError('height must be greater than 0');
        }

        // We will set the parent image for relative position

        Object.defineProperty(this, 'parent', {
            enumerable: false,
            writable: true
        });
        this.parent = options.parent;
        this.position = options.position || [0, 0];

        var theKind = void 0;
        if (typeof options.kind === 'string') {
            theKind = getKind(options.kind);
            if (!theKind) {
                throw new RangeError('invalid image kind: ' + options.kind);
            }
        } else {
            theKind = getKind(RGBA);
        }

        var kindDefinition = index$6({}, theKind, options);
        this.components = kindDefinition.components;
        this.alpha = kindDefinition.alpha + 0;
        this.bitDepth = kindDefinition.bitDepth;
        this.colorModel = kindDefinition.colorModel;
        this.meta = options.meta || {};

        this.computed = null;

        this.initialize();

        if (!data) data = createPixelArray(this);
        this.setData(data);
    }

    get [Symbol.toStringTag]() {
        return imageStringTag;
    }

    static isImage(img) {
        return toString.call(img) === `[object ${imageStringTag}]`;
    }

    initialize() {
        this.size = this.width * this.height;
        this.sizes = [this.width, this.height];
        this.channels = this.components + this.alpha;
        if (this.bitDepth === 32) {
            this.maxValue = Number.MAX_VALUE;
        } else {
            this.maxValue = Math.pow(2, this.bitDepth) - 1; // we may not use 1 << this.bitDepth for 32 bits images
        }

        this.multiplierX = this.channels;
        this.multiplierY = this.channels * this.width;
        this.isClamped = this.bitDepth < 32;
        this.borderSizes = [0, 0]; // when a filter create a border it may have impact on future processing like Roi
    }

    setData(data) {
        var length = getTheoreticalPixelArraySize(this);
        if (length !== data.length) {
            throw new RangeError(`incorrect data size. Should be ${length} and found ${data.length}`);
        }
        this.data = data;
    }

    /**
     * Load an image
     * @param {string|ArrayBuffer|Buffer|Uint8Array} url - URL of the image (browser, can be a dataURL) or path (Node.js)
     * or buffer containing the binary data
     * @param {object} [options]
     * @return {Promise<Image>}
     * @example
     *  Image.load('http://xxxx').then(
     *      function(image) {
     *          console.log(image);
     *          // we can display the histogram of the first channel
     *          console.log(image.histograms[0]);
     *      }
     *  )
     */
    static load(url, options) {
        return loadImage$1(url, options);
    }

    /**
     * Creates an image from an HTML Canvas object
     * @param {Canvas} canvas
     * @return {Image}
     */
    static fromCanvas(canvas) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return new Image$1(imageData.width, imageData.height, imageData.data);
    }

    static extendMethod(name, method) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var _options$inPlace = options.inPlace,
            inPlace = _options$inPlace === undefined ? false : _options$inPlace,
            _options$returnThis = options.returnThis,
            returnThis = _options$returnThis === undefined ? true : _options$returnThis,
            _options$partialArgs = options.partialArgs,
            partialArgs = _options$partialArgs === undefined ? [] : _options$partialArgs,
            _options$stack = options.stack,
            stack = _options$stack === undefined ? false : _options$stack;


        if (inPlace) {
            Image$1.prototype[name] = function () {
                // remove computed properties
                this.computed = null;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var result = method.apply(this, [...partialArgs, ...args]);
                if (returnThis) {
                    return this;
                }
                return result;
            };
            if (stack) {
                var stackName = typeof stack === 'string' ? stack : name;
                if (returnThis) {
                    Stack.prototype[stackName] = function () {
                        for (var image of this) {
                            image[name](...arguments);
                        }
                        return this;
                    };
                } else {
                    Stack.prototype[stackName] = function () {
                        var result = new Stack(this.length);
                        for (var i = 0; i < this.length; i++) {
                            result[i] = this[i][name](...arguments);
                        }
                        return result;
                    };
                }
            }
        } else {
            Image$1.prototype[name] = function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                return method.apply(this, [...partialArgs, ...args]);
            };
            if (stack) {
                var _stackName = typeof stack === 'string' ? stack : name;
                Stack.prototype[_stackName] = function () {
                    var result = new Stack(this.length);
                    for (var i = 0; i < this.length; i++) {
                        result[i] = this[i][name](...arguments);
                    }
                    return result;
                };
            }
        }
        return Image$1;
    }

    static extendProperty(name, method) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var _options$partialArgs2 = options.partialArgs,
            partialArgs = _options$partialArgs2 === undefined ? [] : _options$partialArgs2;


        computedPropertyDescriptor.get = function () {
            if (this.computed === null) {
                this.computed = {};
            } else if (index$11(name, this.computed)) {
                return this.computed[name];
            }
            var result = method.apply(this, partialArgs);
            this.computed[name] = result;
            return result;
        };
        Object.defineProperty(Image$1.prototype, name, computedPropertyDescriptor);
        return Image$1;
    }

    static createFrom(other, options) {
        var newOptions = {
            width: other.width,
            height: other.height,
            position: [0, 0],
            components: other.components,
            alpha: other.alpha,
            colorModel: other.colorModel,
            bitDepth: other.bitDepth,
            parent: other
        };
        index$6(newOptions, options);
        return new Image$1(newOptions.width, newOptions.height, newOptions);
    }

    static isTypeSupported(type) {
        var operation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'write';

        if (typeof type !== 'string') {
            throw new TypeError('type argument must be a string');
        }
        type = getType(type);
        if (operation === 'write') {
            return canWrite(type);
        } else {
            throw new TypeError('unknown operation: ' + operation);
        }
    }

    getPixelIndex(indices) {
        var shift = 0;
        for (var i = 0; i < indices.length; i++) {
            shift += this.multipliers[i] * indices[i];
        }
        return shift;
    }

    /**
     * Set the value of specific pixel channel
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     * @param {number} channel
     * @param {number} value - the new value of this pixel channel
     * @return {this}
     */
    setValueXY(x, y, channel, value) {
        this.data[(y * this.width + x) * this.channels + channel] = value;
        this.computed = null;
        return this;
    }

    /**
     * Get the value of specific pixel channel
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     * @param {number} channel
     * @return {number} - the value of this pixel channel
     */
    getValueXY(x, y, channel) {
        return this.data[(y * this.width + x) * this.channels + channel];
    }

    /**
     * Set the value of specific pixel channel
     * @param {number} index - 1D index of the pixel
     * @param {number} channel
     * @param {number} value - the new value of this pixel channel
     * @return {this}
     */
    setValue(index$$1, channel, value) {
        this.data[index$$1 * this.channels + channel] = value;
        this.computed = null;
        return this;
    }

    /**
     * Get the value of specific pixel channel
     * @param {number} index - 1D index of the pixel
     * @param {number} channel
     * @return {number} - the value of this pixel channel
     */
    getValue(index$$1, channel) {
        return this.data[index$$1 * this.channels + channel];
    }

    /**
     * Set the value of an entire pixel
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     * @param {number[]} value - the new value of this pixel
     * @return {this}
     */
    setPixelXY(x, y, value) {
        return this.setPixel(y * this.width + x, value);
    }

    /**
     * Get the value of an entire pixel
     * @param {number} x - x coordinate (0 = left)
     * @param {number} y - y coordinate (0 = top)
     * @return {number[]} the value of this pixel
     */
    getPixelXY(x, y) {
        return this.getPixel(y * this.width + x);
    }

    /**
     * Set the value of an entire pixel
     * @param {number} index - 1D index of the pixel
     * @param {number[]} value - the new value of this pixel
     * @return {this}
     */
    setPixel(index$$1, value) {
        var target = index$$1 * this.channels;
        for (var i = 0; i < value.length; i++) {
            this.data[target + i] = value[i];
        }
        this.computed = null;
        return this;
    }

    /**
     * Get the value of an entire pixel
     * @param {number} index - 1D index of the pixel
     * @return {number[]} the value of this pixel
     */
    getPixel(index$$1) {
        var value = new Array(this.channels);
        var target = index$$1 * this.channels;
        for (var i = 0; i < this.channels; i++) {
            value[i] = this.data[target + i];
        }
        return value;
    }

    /**
     * Creates a dataURL string from the image.
     * @param {string} [type='image/png']
     * @param {object} [options]
     * @param {boolean} [options.async=false] - Set to true to asynchronously generate the dataURL. This is required on Node.js for jpeg compression.
     * @param {boolean} [options.useCanvas=false] - Force use of the canvas API to save the image instead of JavaScript implementation
     * @return {string|Promise<string>}
     */
    toDataURL() {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/png';
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var _options$async = options.async,
            async = _options$async === undefined ? false : _options$async,
            _options$useCanvas = options.useCanvas,
            useCanvas = _options$useCanvas === undefined ? false : _options$useCanvas;

        type = getType(type);
        function dataUrl(encoder, ctx) {
            var u8 = encoder(ctx);
            return toBase64URL(u8, type);
        }
        if (async) {
            return new Promise((resolve, reject) => {
                if (type === 'image/bmp') {
                    resolve(dataUrl(encode, this));
                } else if (type === 'image/png' && canJSEncodePng(this) && !useCanvas) {
                    resolve(dataUrl(encodePNG, this));
                } else {
                    this.getCanvas().toDataURL(type, function (err, text) {
                        if (err) reject(err);else resolve(text);
                    });
                }
            });
        } else {
            if (type === 'image/bmp') {
                return dataUrl(encode, this);
            } else if (type === 'image/png' && canJSEncodePng(this) && !useCanvas) {
                return dataUrl(encodePNG, this);
            } else {
                return this.getCanvas().toDataURL(type);
            }
        }
    }

    /**
     * Creates a base64 string from the image.
     * @param {string} [type='image/png']
     * @param {object} [options] - Same options as toDataURL
     * @return {string|Promise<string>}
     */
    toBase64() {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/png';
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (options.async) {
            return this.toDataURL(type, options).then(function (dataURL) {
                return dataURL.substring(dataURL.indexOf(',') + 1);
            });
        } else {
            var dataURL = this.toDataURL(type, options);
            return dataURL.substring(dataURL.indexOf(',') + 1);
        }
    }

    /**
     * Creates a blob from the image and return a Promise.
     * @param {string} [type='image/png'] A String indicating the image format. The default type is image/png.
     * @param {string} [quality=0.8] A Number between 0 and 1 indicating image quality if the requested type is image/jpeg or image/webp. If this argument is anything else, the default value for image quality is used. Other arguments are ignored.
     * @return {Promise}
     */
    toBlob() {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/png';
        var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.8;

        return index_1(this.getCanvas({ originalData: true }), type, quality);
    }

    /**
     * Creates a new canvas element and draw the image inside it
     * @param {object} [options]
     * @param {boolean} [options.originalData=false]
     * @return {Canvas}
     */
    getCanvas() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var _options$originalData = options.originalData,
            originalData = _options$originalData === undefined ? false : _options$originalData;

        var data = void 0;
        if (!originalData) {
            data = new ImageData(this.getRGBAData(), this.width, this.height);
        } else {
            this.checkProcessable('getInPlaceCanvas', {
                channels: [4],
                bitDepth: [8]
            });
            data = new ImageData(this.data, this.width, this.height);
        }
        var canvas = new Canvas(this.width, this.height);
        var ctx = canvas.getContext('2d');
        ctx.putImageData(data, 0, 0);
        return canvas;
    }

    /**
     * Retrieve the data of the current image as RGBA 8 bits
     * The source image may be:
     * * a mask (binary image)
     * * a grey image (8 or 16 bits) with or without alpha channel
     * * a color image (8 or 16 bits) with or without alpha channel in with RGB model
     * @instance
     * @return {Uint8ClampedArray} - Array with the data
     * @example
     * var imageData = image.getRGBAData();
     */
    getRGBAData() {
        this.checkProcessable('getRGBAData', {
            components: [1, 3],
            bitDepth: [1, 8, 16]
        });
        var size = this.size;
        var newData = new Uint8ClampedArray(this.width * this.height * 4);
        if (this.bitDepth === 1) {
            for (var i = 0; i < size; i++) {
                var value = this.getBit(i);
                newData[i * 4] = value * 255;
                newData[i * 4 + 1] = value * 255;
                newData[i * 4 + 2] = value * 255;
            }
        } else {
            if (this.components === 1) {
                for (var _i = 0; _i < size; _i++) {
                    newData[_i * 4] = this.data[_i * this.channels] >>> this.bitDepth - 8;
                    newData[_i * 4 + 1] = this.data[_i * this.channels] >>> this.bitDepth - 8;
                    newData[_i * 4 + 2] = this.data[_i * this.channels] >>> this.bitDepth - 8;
                }
            } else if (this.components === 3) {
                this.checkProcessable('getRGBAData', { colorModel: [RGB$1] });
                if (this.colorModel === RGB$1) {
                    for (var _i2 = 0; _i2 < size; _i2++) {
                        newData[_i2 * 4] = this.data[_i2 * this.channels] >>> this.bitDepth - 8;
                        newData[_i2 * 4 + 1] = this.data[_i2 * this.channels + 1] >>> this.bitDepth - 8;
                        newData[_i2 * 4 + 2] = this.data[_i2 * this.channels + 2] >>> this.bitDepth - 8;
                    }
                }
            }
        }
        if (this.alpha) {
            this.checkProcessable('getRGBAData', { bitDepth: [8, 16] });
            for (var _i3 = 0; _i3 < size; _i3++) {
                newData[_i3 * 4 + 3] = this.data[_i3 * this.channels + this.components] >> this.bitDepth - 8;
            }
        } else {
            for (var _i4 = 0; _i4 < size; _i4++) {
                newData[_i4 * 4 + 3] = 255;
            }
        }
        return newData;
    }

    /**
     * Create a new manager for regions of interest based on the current image.
     * @param {object} [options]
     * @return {RoiManager}
     */
    getRoiManager(options) {
        return new RoiManager(this, options);
    }

    /**
     * Create a new image based on the current image.
     * By default the method will copy the data
     * @instance
     * @param {object} options
     * @param {boolean} [options.copyData=true] - Specify if we want also to clone
     *          the data or only the image parameters (size, colorModel, ...)
     * @return {Image} - The source image clone
     * @example
     * var emptyImage = image.clone({copyData:false});
     */
    clone() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var _options$copyData = options.copyData,
            copyData = _options$copyData === undefined ? true : _options$copyData;

        return new Image$1(this, copyData);
    }

    /**
     * Save the image to disk (Node.js only)
     * @param {string} path
     * @param {object} [options]
     * @param {string} [options.format='png'] - One of: png, jpg, bmp (limited support for bmp)
     * @param {boolean} [options.useCanvas=false] - Force use of the canvas API to save the image instead of JavaScript implementation
     * @return {Promise} - Resolves when the file is fully written
     */
    save(path) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var _options$format = options.format,
            format = _options$format === undefined ? 'png' : _options$format,
            _options$useCanvas2 = options.useCanvas,
            useCanvas = _options$useCanvas2 === undefined ? false : _options$useCanvas2;

        return new Promise((resolve, reject) => {
            var stream = void 0,
                buffer = void 0;
            switch (format.toLowerCase()) {
                case 'png':
                    {
                        if (!canJSEncodePng(this) || useCanvas) {
                            stream = this.getCanvas().pngStream();
                        } else {
                            buffer = encodePNG(this);
                        }
                        break;
                    }
                case 'jpg':
                case 'jpeg':
                    stream = this.getCanvas().jpegStream();
                    break;
                case 'bmp':
                    buffer = encode(this);
                    break;
                default:
                    throw new RangeError('invalid output format: ' + format);
            }
            if (stream) {
                var out = createWriteStream(path);
                out.on('finish', resolve);
                out.on('error', reject);
                stream.pipe(out);
            } else if (buffer) {
                writeFile(path, Buffer.from(buffer), err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            }
        });
    }

    // this method check if a process can be applied on the current image
    checkProcessable(processName) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var bitDepth = options.bitDepth,
            alpha = options.alpha,
            colorModel = options.colorModel,
            components = options.components,
            channels = options.channels;

        if (typeof processName !== 'string') {
            throw new TypeError('checkProcessable requires as first parameter the processName (a string)');
        }
        if (bitDepth) {
            if (!Array.isArray(bitDepth)) {
                bitDepth = [bitDepth];
            }
            if (!bitDepth.includes(this.bitDepth)) {
                throw new TypeError('The process: ' + processName + ' can only be applied if bit depth is in: ' + bitDepth);
            }
        }
        if (alpha) {
            if (!Array.isArray(alpha)) {
                alpha = [alpha];
            }
            if (!alpha.includes(this.alpha)) {
                throw new TypeError('The process: ' + processName + ' can only be applied if alpha is in: ' + alpha);
            }
        }
        if (colorModel) {
            if (!Array.isArray(colorModel)) {
                colorModel = [colorModel];
            }
            if (!colorModel.includes(this.colorModel)) {
                throw new TypeError('The process: ' + processName + ' can only be applied if color model is in: ' + colorModel);
            }
        }
        if (components) {
            if (!Array.isArray(components)) {
                components = [components];
            }
            if (!components.includes(this.components)) {
                throw new TypeError('The process: ' + processName + ' can only be applied if the number of components is in: ' + components);
            }
        }
        if (channels) {
            if (!Array.isArray(channels)) {
                channels = [channels];
            }
            if (!channels.includes(this.channels)) {
                throw new TypeError('The process: ' + processName + ' can only be applied if the number of channels is in: ' + channels);
            }
        }
    }

    checkColumn(column) {
        if (column < 0 || column >= this.width) {
            throw new RangeError(`checkColumn: column should be included between 0 and ${this.width - 1}. Current value: ${column}`);
        }
    }

    checkRow(row) {
        if (row < 0 || row >= this.height) {
            throw new RangeError(`checkRow: row should be included between 0 and ${this.height - 1}. Current value: ${row}`);
        }
    }

    checkChannel(channel) {
        if (channel < 0 || channel >= this.channels) {
            throw new RangeError(`checkChannel: channel should be included between 0 and ${this.channels - 1}. Current value: ${channel}`);
        }
    }

    apply(filter) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var index$$1 = (y * this.width + x) * this.channels;
                filter.call(this, index$$1);
            }
        }
    }
}

function canJSEncodePng(img) {
    return img.bitDepth === 8 || img.bitDepth === 16;
}

extend$1(Image$1);
bitMethods$1(Image$1);

// http://homepages.inf.ed.ac.uk/rbf/HIPR2/log.htm

function laplacianOfGaussian(sigma, nPoints, factor) {
    var kernel = new Array(nPoints);
    var i = void 0,
        j = void 0,
        x2 = void 0,
        y2 = void 0;
    if (!factor) {
        factor = 100;
    }
    factor *= -1; //-480/(Math.PI*Math.pow(sigma,4));
    var center = (nPoints - 1) / 2;
    var sigma2 = 2 * sigma * sigma;
    for (i = 0; i < nPoints; i++) {
        kernel[i] = new Array(nPoints);
        y2 = (i - center) * (i - center);
        for (j = 0; j < nPoints; j++) {
            x2 = (j - center) * (j - center);
            kernel[i][j] = Math.round(factor * (1 - (x2 + y2) / sigma2) * Math.exp(-(x2 + y2) / sigma2));
        }
    }

    return kernel;
}



var kernel$1 = Object.freeze({
	laplacianOfGaussian: laplacianOfGaussian,
	DISCRETE_LAPLACE_4: DISCRETE_LAPLACE_4,
	DISCRETE_LAPLACE_8: DISCRETE_LAPLACE_8,
	GRADIENT_X: GRADIENT_X,
	GRADIENT_Y: GRADIENT_Y,
	SECOND_DERIVATIVE: SECOND_DERIVATIVE,
	SECOND_DERIVATIVE_INV: SECOND_DERIVATIVE_INV
});

var worker$2 = function () {
    var window = self.window = self;
    function ManagedWorker() {
        this._listeners = {};
    }
    ManagedWorker.prototype.on = function (event, callback) {
        if (this._listeners[event])
            throw new RangeError('there is already a listener for ' + event);
        if (typeof callback !== 'function')
            throw new TypeError('callback argument must be a function');
        this._listeners[event] = callback;
    };
    ManagedWorker.prototype._send = function (id, data, transferable) {
        if (transferable === undefined) {
            transferable = [];
        } else if (!Array.isArray(transferable)) {
            transferable = [transferable];
        }
        self.postMessage({
            id: id,
            data: data
        }, transferable);
    };
    ManagedWorker.prototype._trigger = function (event, args) {
        if (!this._listeners[event])
            throw new Error('event ' + event + ' is not defined');
        this._listeners[event].apply(null, args);
    };
    var worker = new ManagedWorker();
    self.onmessage = function (event) {
        switch(event.data.action) {
            case 'exec':
                event.data.args.unshift(function (data, transferable) {
                    worker._send(event.data.id, data, transferable);
                });
                worker._trigger(event.data.event, event.data.args);
                break;
            case 'ping':
                worker._send(event.data.id, 'pong');
                break;
            default:
                throw new Error('unexpected action: ' + event.data.action);
        }
    };
    "CODE";
};

var workerStr = worker$2.toString().split('"CODE";');

var newWorkerURL = function newWorkerURL(code, deps) {
    var blob = new Blob(['(', workerStr[0], 'importScripts.apply(self, ' + JSON.stringify(deps) + ');\n', '(', code, ')();', workerStr[1], ')();'], {type: 'application/javascript'});
    return URL.createObjectURL(blob);
};

var workerTemplate = {
	newWorkerURL: newWorkerURL
};

var CORES = navigator.hardwareConcurrency || 1;

function WorkerManager(func, options) {
    // Check arguments
    if (typeof func !== 'string' && typeof func !== 'function')
        throw new TypeError('func argument must be a function');
    if (options === undefined)
        options = {};
    if (typeof options !== 'object' || options === null)
        throw new TypeError('options argument must be an object');

    this._workerCode = func.toString();

    // Parse options
    if (options.maxWorkers === undefined || options.maxWorkers === 'auto') {
        this._numWorkers = Math.min(CORES - 1, 1);
    } else if (options.maxWorkers > 0) {
        this._numWorkers = Math.min(options.maxWorkers, CORES);
    } else {
        this._numWorkers = CORES;
    }

    this._workers = new Map();
    this._timeout = options.timeout || 0;
    this._terminateOnError = !!options.terminateOnError;

    var deps = options.deps;
    if (typeof deps === 'string')
        deps = [deps];
    if (!Array.isArray(deps))
        deps = undefined;

    this._id = 0;
    this._terminated = false;
    this._working = 0;
    this._waiting = [];

    this._init(deps);
}

WorkerManager.prototype._init = function (deps) {
    var workerURL = workerTemplate.newWorkerURL(this._workerCode, deps);

    for (var i = 0; i < this._numWorkers; i++) {
        var worker = new Worker(workerURL);
        worker.onmessage = this._onmessage.bind(this, worker);
        worker.onerror = this._onerror.bind(this, worker);
        worker.running = false;
        worker.id = i;
        this._workers.set(worker, null);
    }

    URL.revokeObjectURL(workerURL);
};

WorkerManager.prototype._onerror = function (worker, error) {
    if (this._terminated)
        return;
    this._working--;
    worker.running = false;
    var callback = this._workers.get(worker);
    if (callback) {
        callback[1](error.message);
    }
    this._workers.set(worker, null);
    if (this._terminateOnError) {
        this.terminate();
    } else {
        this._exec();
    }
};

WorkerManager.prototype._onmessage = function (worker, event) {
    if (this._terminated)
        return;
    this._working--;
    worker.running = false;
    var callback = this._workers.get(worker);
    if (callback) {
        callback[0](event.data.data);
    }
    this._workers.set(worker, null);
    this._exec();
};

WorkerManager.prototype._exec = function () {
    for (var worker of this._workers.keys()) {
        if (this._working === this._numWorkers ||
            this._waiting.length === 0) {
            return;
        }
        if (!worker.running) {
            for (var i = 0; i < this._waiting.length; i++) {
                var execInfo = this._waiting[i];
                if (typeof execInfo[4] === 'number' && execInfo[4] !== worker.id) {
                    // this message is intended to another worker, let's ignore it
                    continue;
                }
                this._waiting.splice(i, 1);
                worker.postMessage({
                    action: 'exec',
                    event: execInfo[0],
                    args: execInfo[1]
                }, execInfo[2]);
                worker.running = true;
                worker.time = Date.now();
                this._workers.set(worker, execInfo[3]);
                this._working++;
                break;
            }
        }
    }
};

WorkerManager.prototype.terminate = function () {
    if (this._terminated) return;
    for (var entry of this._workers) {
        entry[0].terminate();
        if (entry[1]) {
            entry[1][1](new Error('Terminated'));
        }
    }
    this._workers.clear();
    this._waiting = [];
    this._working = 0;
    this._terminated = true;
};

WorkerManager.prototype.postAll = function (event, args) {
    if (this._terminated)
        throw new Error('Cannot post (terminated)');
    var promises = [];
    for (var worker of this._workers.keys()) {
        promises.push(this.post(event, args, [], worker.id));
    }
    return Promise.all(promises);
};

WorkerManager.prototype.post = function (event, args, transferable, id) {
    if (args === undefined) args = [];
    if (transferable === undefined) transferable = [];
    if (!Array.isArray(args)) {
        args = [args];
    }
    if (!Array.isArray(transferable)) {
        transferable = [transferable];
    }

    var self = this;
    return new Promise(function (resolve, reject) {
        if (self._terminated) throw new Error('Cannot post (terminated)');
        self._waiting.push([event, args, transferable, [resolve, reject], id]);
        self._exec();
    });
};

var index$39 = WorkerManager;

var defaultOptions$14 = {
    regression: {
        kernelType: 'polynomial',
        kernelOptions: { degree: 2, constant: 1 }
    },
    threshold: 0.02,
    roi: {
        minSurface: 100,
        positive: false
    },
    sampling: 20,
    include: []
};

function run(image, options, onStep) {
    options = index$6({}, defaultOptions$14, options);
    var manager = this.manager;
    if (Array.isArray(image)) {
        return Promise.all(image.map(function (img) {
            var run = runOnce(manager, img, options);
            if (typeof onStep === 'function') {
                run.then(onStep);
            }
            return run;
        }));
    } else {
        return runOnce(manager, image, options);
    }
}

function runOnce(manager, image, options) {
    return manager.post('data', [image, options]).then(function (response) {
        for (var i in response) {
            response[i] = new Image$1(response[i]);
        }
        return response;
    });
}

function work() {
    worker.on('data', function (send, image, options) {
        image = new IJS(image);
        var result = {};
        var toTransfer = [];

        var grey = image.grey();

        var sobel = grey.sobelFilter();
        maybeInclude('sobel', sobel);

        var mask = sobel.level().mask({ threshold: options.threshold });
        maybeInclude('mask', mask);

        var roiManager = sobel.getRoiManager();
        roiManager.fromMask(mask);
        var realMask = roiManager.getMask(options.roi);
        maybeInclude('realMask', realMask);

        var pixels = grey.getPixelsGrid({
            sampling: options.sampling,
            mask: realMask
        });

        var background = image.getBackground(pixels.xyS, pixels.zS, options.regression);
        maybeInclude('background', background);

        var corrected = image.subtract(background);

        result.result = corrected;
        toTransfer.push(corrected.data.buffer);
        send(result, toTransfer);

        function maybeInclude(name, image) {
            if (options.include.includes(name)) {
                result[name] = image;
                toTransfer.push(image.data.buffer);
            }
        }
    });
}

var background$1 = { run, work };

function extend$3(Worker) {
    Worker.extendMethod('background', background$1);
}

class Worker$1 {
    constructor() {
        this._url = null;
        this._deps = [null];
    }
    checkUrl() {
        if (this._url === null) {
            throw new Error('image worker must be initialized with an URL');
        }
    }
    get url() {
        return this._url;
    }
    set url(value) {
        if (typeof value !== 'string') {
            throw new TypeError('worker URL must be a string');
        }
        this._url = value;
        this._deps[0] = value;
    }
    static extendMethod(name, method) {
        var manager = void 0;
        var url = void 0;
        var runner = {};
        function run() {
            if (!manager) {
                this.checkUrl();
                url = this.url;
                manager = new index$39(method.work, { deps: url });
                runner.manager = manager;
            }

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return method.run.call(runner, ...args);
        }
        run.reset = function () {
            if (manager) {
                manager.terminate();
                manager = new index$39(method.work, { deps: url });
                runner.manager = manager;
            }
        };
        Worker$1.prototype[name] = run;
    }
}

extend$3(Worker$1);

var worker$1 = new Worker$1();

var Static = {
    grey: names,
    mask: names$1
};

exports['default'] = Image$1;
exports.Image = Image$1;
exports.Kernel = kernel$1;
exports.Static = Static;
exports.Stack = Stack;
exports.Shape = Shape;
exports.Worker = worker$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
