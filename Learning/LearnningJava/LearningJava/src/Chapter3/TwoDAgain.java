/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Chapter3;

/**
 *
 * @author Dinh Dinh
 */
public class TwoDAgain {

    public static void main(String[] args) {
        int twoD[][] = new int[4][];
        twoD[0] = new int[4];
        twoD[1] = new int[3];
        twoD[2] = new int[2];
        twoD[3] = new int[1];

//        int i, j, k = 0;
//        for (i = 0; i < 4; i++) {
//            for (j = 0; j < i + 1; j++) {
//                twoD[i][j] = k;
//                k++;
//            }
//        }
        int i, j, k = 0;
        for (i = 0; i < 4; i++) {
            for (j = 0; j < 4 - i; j++) {
                twoD[i][j] = k;
                k++;
            }
        }

//        for (i = 0; i < 4; i++) {
//            for (j = 0; j < 4 + 1; j++) {
//                System.out.print(twoD[i][j] + " ");
//            }
//            System.out.println("");
//        }

        for (i = 0; i < 4; i++) {
            for (j = 0; j < 4 - i; j++) {
                System.out.print(twoD[i][j] + " ");
            }
            System.out.println("");
        }
    }
}
