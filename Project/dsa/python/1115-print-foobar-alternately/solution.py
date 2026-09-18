# 1115. Print FooBar Alternately  [Medium]
# https://leetcode.com/problems/print-foobar-alternately/
#
# Approach:
#
# Complexity: Time O(?)  Space O(?)

from typing import *

class FooBar:
    def __init__(self, n):
        self.n = n


    def foo(self, printFoo: 'Callable[[], None]') -> None:
        
        for i in range(self.n):
            
            # printFoo() outputs "foo". Do not change or remove this line.
        	printFoo()


    def bar(self, printBar: 'Callable[[], None]') -> None:
        
        for i in range(self.n):
            
            # printBar() outputs "bar". Do not change or remove this line.
        	printBar()


if __name__ == "__main__":
    s = Solution()
    # print(s.method(...))
