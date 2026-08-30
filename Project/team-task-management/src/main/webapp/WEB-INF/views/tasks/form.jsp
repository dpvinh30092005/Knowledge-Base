<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Tạo Task mới</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <h1>Tạo Task mới</h1>
        
        <form action="${pageContext.request.contextPath}/tasks/create" method="POST" class="form">
            <div class="form-group">
                <label>Tên Task *</label>
                <input type="text" name="taskName" required>
            </div>
            
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description" rows="4"></textarea>
            </div>
            
            <div class="form-group">
                <label>Team *</label>
                <select name="teamId" required>
                    <option value="">-- Chọn Team --</option>
                    <c:forEach var="team" items="${teams}">
                        <option value="${team.teamId}" ${team.teamId == task.team.teamId ? 'selected' : ''}>
                            ${team.teamName}
                        </option>
                    </c:forEach>
                </select>
            </div>
            
            <div class="form-group">
                <label>Ưu tiên</label>
                <select name="priority">
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM" selected>Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Hạn chót</label>
                <input type="datetime-local" name="dueDate">
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Tạo Task</button>
                <a href="${pageContext.request.contextPath}/tasks" class="btn">Hủy</a>
            </div>
        </form>
    </div>
</body>
</html>

