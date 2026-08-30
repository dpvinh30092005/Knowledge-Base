/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter3;

/**
 *
 * @author Dinh Dinh
 */
public class TwoDArray {

    public static void main(String[] args) {
        int twoD[][] = new int[4][5];

        int i, j, k = 0;

        for (i = 0; i < 4; i++) {
            for (j = 0; j < 5; j++) {
                twoD[i][j] = k;
                k++;
            }
        }
        for (i = 0; i < 4; i++) {
            for (j = 0; j < 5; j++) {
                System.out.print(twoD[i][j] + " ");
            }
            System.out.println("");
        }
    }
}
