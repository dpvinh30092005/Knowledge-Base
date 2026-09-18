// 106. Construct Binary Tree from Inorder and Postorder Traversal  [Medium]
// https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

import java.util.*;

class Solution {
    public TreeNode buildTree(int[] inorder, int[] postorder) {
        
    }

    public static void main(String[] args) {
        Solution s = new Solution();
        // System.out.println(s.method(...));
    }
}

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
