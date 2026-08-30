/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package khanhkt.account;

import khanhkt.utils.DBHelper;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.naming.NamingException;

/**
 *
 * @author natton
 */
public class AccountDAO {
    public AccountDTO getAccountByUsernameAndPassword(String username, String password) 
            throws SQLException, NamingException {
        Connection con = null;
        PreparedStatement stm = null;
        ResultSet rs = null;
        AccountDTO dto = null;
        try {
            //1. connect database
            con = DBHelper.getConnection();
            if (con != null) {
                //2.Create SQL String
                String sql = "SELECT fullname FROM Account WHERE username = ? AND password = ?";
                //3.Create statement
                stm = con.prepareStatement(sql);
                stm.setString(1, username);
                stm.setString(2, password);
                //4.Query Data 
                rs = stm.executeQuery();
                //5.Process Data
                if (rs.next()) {
                    String fullname = rs.getString("fullname");
                    dto = new AccountDTO(username, password, fullname);
                }
            }
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (stm != null) {
                stm.close();
            }
            if (con != null) {
                con.close();
            }
        }
        return dto;
    }
    
    public List<AccountDTO> searchAccountByFullName(String searchValue) 
            throws SQLException, NamingException {
        Connection con = null;
        PreparedStatement stm = null;
        ResultSet rs = null;
        List<AccountDTO> listAccount = new ArrayList<AccountDTO>();
        try {
            con = DBHelper.getConnection();
            if (con != null) {
                String sql = "SELECT username, password, fullname FROM Account WHERE fullname LIKE ?";
                stm = con.prepareStatement(sql);
                stm.setString(1, "%" + searchValue + "%");
                rs = stm.executeQuery();
                while (rs.next()) {
                    String username = rs.getString("username");
                    String password = rs.getString("password");
                    String fullname = rs.getString("fullname");
                    AccountDTO dto = new AccountDTO(username, password, fullname);
                    listAccount.add(dto);
                }//end while rs not null
            }//end if con is not null
        } finally {
            if (rs != null) {
                rs.close();
            }
            if (stm != null) {
                stm.close();
            }
            if (con != null) {
                con.close();
            }
        }
        return listAccount;
    }

}
