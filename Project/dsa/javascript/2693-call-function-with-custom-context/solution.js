// 2693. Call Function with Custom Context  [Medium]
// https://leetcode.com/problems/call-function-with-custom-context/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

/**
 * @param {Object} context
 * @param {Array} args
 * @return {null|boolean|number|string|Array|Object}
 */
Function.prototype.callPolyfill = function(context, ...args) {
    
}

/**
 * function increment() { this.count++; return this.count; }
 * increment.callPolyfill({count: 1}); // 2
 */
