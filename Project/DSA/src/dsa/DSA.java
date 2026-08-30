/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package dsa;

import java.util.*;

/**
 *
 * @author Dinh Dinh
 */
public class DSA {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        // TODO code application logic here
        int [] num1 = {1,3};
        int [] num2 = {2,4};

        System.out.println(num1[0]);
    }

}

 class ListNode {

    int val;
    ListNode next;

    ListNode() {
    }

    ListNode(int val) {
        this.val = val;
    }

    ListNode(int val, ListNode next) {
        this.val = val;
        this.next = next;
    }
}

class Solution {

    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> check = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int num = target - nums[i];
            if (check.containsKey(num)) {
                return new int[]{check.get(num), i};
            }
            check.put(nums[i], i);

        }
        return new int[]{};
    }

    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode current = dummy;
        int carry = 0;

        while (l1 != null || l2 != null || carry != 0) {

            int x = 0;
            if (l1 != null) {
                x = l1.val;
            }
            int y = 0;
            if (l2 != null) {
                y = l2.val;
            }

            int sum = x + y + carry;
            int digit = sum % 10;
            carry = sum / 10;

            current.next = new ListNode(digit);
            current = current.next;

            if (l1 != null) {
                l1 = l1.next;
            }
            if (l2 != null) {
                l2 = l2.next;
            }
        }
    return dummy.next;
    }

    public int lengthOfLongestSubstring(String s) {
        HashSet<Character> set = new HashSet<>();
        int left = 0;
        int maxLength = 0;

        for (int right = 0; right < s.length(); right++) {

            char c = s.charAt(right);
            while (set.contains(c)) {
                set.remove(s.charAt(left));
                left++;
            }
            set.add(c);
            maxLength = Math.max(maxLength, right - left + 1);

        }
        return  maxLength;
    }

    public String longestPalindrome(String s) {
return"";
    }

    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) {
            return s;
        }

        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }

        int currentRow = 0;
        boolean goingDown = false;

        for (char c : s.toCharArray()) {
            rows[currentRow].append(c);


            if (currentRow == 0 || currentRow == numRows - 1) {
                goingDown = !goingDown;
            }


            if (goingDown) {
                currentRow++;
            } else {
                currentRow--;
            }
        }

        StringBuilder res = new StringBuilder();
        for (StringBuilder row : rows) {
            res.append(row);
        }
        return res.toString();
    }

    public boolean isValid(String s) {

        Stack<Character> stack = new Stack<>();

        for (Character c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            }
           else {

               if (stack.isEmpty()) {
                   return false;
               }

               char top =  stack.pop();

               if (c == ')' && top != '(') {
                   return false;
               }
               else if (c == ']' && top != '[') {
                   return false;
               }
               else if (c == '}' && top != '{') {
                   return false;
               }

            }
        }
return stack.isEmpty();
    }

    public boolean isPalindrome(int x) {
        /*
         * 121
         *
         * */
        if (x < 0) {
            return false;
        }
        int orginal = x;
        int reversed = 0;
        while (x != 0) {
            int remainder = x % 10;
            reversed = reversed * 10 + remainder;
            x = x/10;
        }



return (orginal == reversed);


    }

    public int romanToInt(String s) {
        int result = 0;
        for (int i = 0; i < s.length(); i++) {
            int current = roman(s.charAt(i));
            if (i < s.length() - 1 &&  current < roman(s.charAt(i + 1))) {
                result -= current;
            }else {
                result += current;
            }
        }
        return result;
    }

    private int roman (char c) {
        return switch (c) {
            case 'I' -> 1;
            case 'V' -> 5;
            case 'X' -> 10;
            case 'L' -> 50;
            case 'C' -> 100;
            case 'D' -> 500;
            default -> 1000;
        };
    }

    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {

        ListNode dummy = new ListNode();
        ListNode head = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val < list2.val) {
                head.next = list1;
                list1 = list1.next;
            }
            else {
                head.next = list2;
                list2 = list2.next;
            }
            head = head.next;
        }

        if (list1 != null) {
            head.next = list1;
        }
        if (list2 != null) {
            head.next = list2;
        }
        return dummy.next;
    }

    public double findMedianSortedArrays(int[] nums1, int[] nums2) {

        int len1 =  nums1.length, len2 = nums2.length;
        int[] merged = new int[len1 + len2];
        int pointerMerged = 0, pointerlen1 = 0, pointerlen2 = 0;

        while (pointerlen1 < len1 && pointerlen2 < len2) {
            if (nums1[pointerlen1] < nums2[pointerlen2]) {
                merged[pointerMerged++] = nums1[pointerlen1++];
            }
            else {
                merged[pointerMerged++] = nums2[pointerlen2++];
            }
        }

        while (pointerlen1 < len1) {
            merged[pointerMerged++] = nums1[pointerlen1++];
        }
        while (pointerlen2 < len2) {
            merged[pointerMerged++] = nums2[pointerlen2++];
        }

        int total = len1 + len2;

        if (total % 2 == 1) {
            return merged[total / 2];
        }
        return (merged[total / 2] + merged[(total / 2) - 1]) / 2.0;
    }

    public String longestCommonPrefix(String[] strs) {

        for (int i = 0; i < strs.length; i++) {
            if (strs[i] == null || strs[i].length() == 0) {
                return strs[0];
            }

            if (strs[i].length() == 1) {
                return strs[0];
            }
            if ()

        }
    }
}
