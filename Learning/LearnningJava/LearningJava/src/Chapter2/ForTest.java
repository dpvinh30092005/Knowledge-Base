/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter2;

import java.util.Iterator;

/**
 *
 * @author Dinh Dinh
 */
public class ForTest {
    //for(initialization; condition; iteration) statement;

    public static void main(String[] args) {
        int x;
        for (x = 0; x < 10; x = x + 1) {
            System.out.println("This is x: " + x);
        }
        System.out.println();

        for (x = 0; x < 10; x++) {
            System.out.println("This is x: " + x);
        }

    }
}
