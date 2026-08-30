<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Tạo Team mới</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <h1>Tạo Team mới</h1>
        
        <form action="${pageContext.request.contextPath}/teams/create" method="POST" class="form">
            <div class="form-group">
                <label>Tên Team *</label>
                <input type="text" name="teamName" required>
            </div>
            
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description" rows="4"></textarea>
            </div>
            
            <div class="form-group">
                <label>Team Code</label>
                <input type="text" name="teamCode">
            </div>
            
            <div class="form-group">
                <label>Thành viên</label>
                <select name="memberIds" multiple size="5">
                    <c:forEach var="user" items="${users}">
                        <option value="${user.userId}">${user.fullName != null ? user.fullName : user.username} (${user.email})</option>
                    </c:forEach>
                </select>
                <small>Giữ Ctrl/Cmd để chọn nhiều thành viên</small>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Tạo Team</button>
                <a href="${pageContext.request.contextPath}/teams" class="btn">Hủy</a>
            </div>
        </form>
    </div>
</body>
</html>

