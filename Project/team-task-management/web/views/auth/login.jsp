<%-- 
    Document   : login
    Created on : Jan 17, 2026, 1:17:28 AM
    Author     : Dinh Dinh
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Team Task Management</title>
    </head>
    <body>
        <form action="LoginServlet" method="POST">
            <label>Email</label> <input type="email" name="txtEmail" required> <br>
            <label>Username</label> <input type="text" name="txtUsername" required> <br>
            <label>Password</label> <input type="password" name="txtPassword" required> <br>
            
            <input type="submit" value="LOGIN">
        </form>
    </body>
</html>
