module com.zjtcoder.nocnoc {
    requires javafx.controls;
    requires javafx.fxml;


    opens com.zjtcoder.nocnoc to javafx.fxml;
    exports com.zjtcoder.nocnoc;
}