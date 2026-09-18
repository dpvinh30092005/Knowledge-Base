// 2637. Promise Time Limit  [Medium]
// https://leetcode.com/problems/promise-time-limit/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

/**
 * @param {Function} fn
 * @param {number} t
 * @return {Function}
 */
var timeLimit = function(fn, t) {
    
    return async function(...args) {
        
    }
};

/**
 * const limited = timeLimit((t) => new Promise(res => setTimeout(res, t)), 100);
 * limited(150).catch(console.log) // "Time Limit Exceeded" at t=100ms
 */
