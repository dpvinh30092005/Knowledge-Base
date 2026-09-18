// 652. Find Duplicate Subtrees  [Medium]
// https://leetcode.com/problems/find-duplicate-subtrees/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

import java.util.*;

class Solution {
    public List<TreeNode> findDuplicateSubtrees(TreeNode root) {
        
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
