module com.zjtcoder.englishapp {
    requires javafx.controls;
    requires javafx.fxml;
    requires java.sql;
    requires com.microsoft.sqlserver.jdbc;

    opens com.zjtcoder.englishapp.ui.controller to javafx.fxml;
    exports com.zjtcoder.englishapp.ui;
}
