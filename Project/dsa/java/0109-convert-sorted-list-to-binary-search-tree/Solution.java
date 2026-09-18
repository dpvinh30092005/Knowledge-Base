// 109. Convert Sorted List to Binary Search Tree  [Medium]
// https://leetcode.com/problems/convert-sorted-list-to-binary-search-tree/
//
// Approach:
//
// Complexity: Time O(?)  Space O(?)

import java.util.*;

class Solution {
    public TreeNode sortedListToBST(ListNode head) {
        
    }

    public static void main(String[] args) {
        Solution s = new Solution();
        // System.out.println(s.method(...));
    }
}

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
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
