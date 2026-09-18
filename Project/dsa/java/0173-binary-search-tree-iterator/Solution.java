// 173. Binary Search Tree Iterator  [Medium]
// https://leetcode.com/problems/binary-search-tree-iterator/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

import java.util.*;

class BSTIterator {

    public BSTIterator(TreeNode root) {
        
    }
    
    public int next() {
        
    }
    
    public boolean hasNext() {
        
    }
}

/**
 * Your BSTIterator object will be instantiated and called as such:
 * BSTIterator obj = new BSTIterator(root);
 * int param_1 = obj.next();
 * boolean param_2 = obj.hasNext();
 */

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
