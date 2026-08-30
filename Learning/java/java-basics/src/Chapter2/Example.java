/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter2;

/**
 *
 * @author Dinh Dinh
 */
public class Example {
    // Your program begins with a call to main().
    public static void main(String[] args) {
        /*
        This line begins the main( ) method.
        
        -> All Java applications begin execution by calling main( )
        
        -> The public keyword is an access specifier, which allows the programmer to control the
           visibility of class members.
        -> The keyword static allows main( ) to be called without
            having to instantiate a particular instance of the class. 
            (Cho phép main được gọi mà không cần tạo 1 instance cụ thể của lớp)
        -> The keyword void simply tells the compiler that main( ) does not return a value.
            (As you will see, methods may also return values)
        
        !!! Main is different from main
         Any information that you need to pass to a method is received by variables specified
        within the set of parentheses that follow the name of the method. These variables are called
        parameters. 
        
        -> args[ ] declares a parameter named args, which is an array of instances of the class String
             args receives any command-line arguments present when the program is executed.
        */
        System.out.println("This is Simple Java Program");
    }
}
