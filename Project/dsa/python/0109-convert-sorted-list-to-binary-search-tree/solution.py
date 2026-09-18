# 109. Convert Sorted List to Binary Search Tree  [Medium]
# https://leetcode.com/problems/convert-sorted-list-to-binary-search-tree/
#
# Approach:
#
# Complexity: Time O(?)  Space O(?)

from typing import *

# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Solution:
    def sortedListToBST(self, head: ListNode | None) -> TreeNode | None:
        pass


if __name__ == "__main__":
    s = Solution()
    # print(s.method(...))
