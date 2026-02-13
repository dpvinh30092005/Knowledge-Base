package com.zjtcoder.superapp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) {
        //Dùng các class có sẵn được cung cấp bởi JDK có trong thư viện JDBC
        //JDBC này sẽ tự động mốc với SQL Server JDBC Driver của hãng MS giúp điều khiển
        Connection conn = null;
        try {

            String dbURL = "jdbc:sqlserver://localhost:1433;databaseName=HSF302;encrypt=true;trustServerCertificate=true";
            String user = "sa";
            String pass = "12345";
            //Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            conn = DriverManager.getConnection(dbURL, user, pass);
            System.out.println("Connect to DB successfully");

            PreparedStatement stm = conn.prepareStatement("SELECT * FROM Subject");
            ResultSet rs = stm.executeQuery();

            while (rs.next()) {
                String  code = rs.getString("Code");
                String name = rs.getString("Name");
//              String description = rs.getString("Description");
                int credits = rs.getInt("Credits");
                int hours = rs.getInt("StudyHours");
                //System.out.println(code + " | " + name + " | " + description + " | " + credits + " | " + hours + " | ");
                System.out.printf("|%10s|%-40s|%4d|%4d|\n", code, name, credits, hours);
            }
            conn.close();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}