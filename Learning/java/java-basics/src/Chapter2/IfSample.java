/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter2;

/**
 *
 * @author Dinh Dinh
 */
public class IfSample {

    public static void main(String[] args) {
        /*if(condition) statement;
        Here, condition is a Boolean expression. If condition is true, then the statement is executed.
        If condition is false, then the statement is bypassed. Here is an example:
        
            if(num < 100) System.out.println("num is less than 100");
        
        In this case, if num contains a value that is less than 100, the conditional expression is
        true, and println( ) will execute. If num contains a value greater than or equal to 100, then
        the println( ) method is bypassed.
         */

        int x, y;

        x = 10;
        y = 20;

        if (x < y) {
            System.out.println("X less than y");
        }

        x = x * 2;
        if (x == y) {
            System.out.println("X now equal to Y");
        }
        
        x = x * 2;
        if (x > y) {
            System.out.println("X new greater than Y");
        }
        
        
        //This won't display anything
        if (x == y) {
            System.out.println("you won't see this");
        }
    }
}
