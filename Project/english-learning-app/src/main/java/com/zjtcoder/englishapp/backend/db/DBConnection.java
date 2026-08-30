package com.zjtcoder.englishapp.backend.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

// Database connection bootstrapper; configuration will be added later.
public class DBConnection {

    private static final String DB_NAME = "english_learning_app";
    private static final String DB_USER_NAME = "SA";
    private static final String DB_PASSWORD = "12345";

    public static Connection getConnection() throws SQLException, ClassNotFoundException {
        Connection conn = null;
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        String url = "jdbc:sqlserver://localhost:1433;"
                + "databaseName=" + DB_NAME + ";"
                + "encrypt=true;trustServerCertificate=true";
        conn = DriverManager.getConnection(url, DB_USER_NAME, DB_PASSWORD);
        return conn;
    }

}
