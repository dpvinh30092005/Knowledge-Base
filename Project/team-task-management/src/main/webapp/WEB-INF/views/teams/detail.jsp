<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Chi tiết Team</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <h1>${team.teamName}</h1>
        
        <div class="detail-section">
            <h2>Thông tin Team</h2>
            <p><strong>Leader:</strong> ${team.leader.fullName != null ? team.leader.fullName : team.leader.username}</p>
            <p><strong>Mô tả:</strong> ${team.description != null ? team.description : '-'}</p>
            <p><strong>Trạng thái:</strong> <span class="badge">${team.status}</span></p>
            <p><strong>Team Code:</strong> ${team.teamCode != null ? team.teamCode : '-'}</p>
        </div>
        
        <div class="detail-section">
            <h2>Thành viên</h2>
            <ul>
                <c:forEach var="member" items="${team.members}">
                    <li>${member.fullName != null ? member.fullName : member.username} (${member.email})</li>
                </c:forEach>
            </ul>
        </div>
        
        <div class="detail-section">
            <h2>Tasks</h2>
            <c:if test="${empty team.tasks}">
                <p>Chưa có task nào.</p>
            </c:if>
            <c:if test="${not empty team.tasks}">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Tên Task</th>
                            <th>Trạng thái</th>
                            <th>Ưu tiên</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:forEach var="task" items="${team.tasks}">
                            <tr>
                                <td>${task.taskName}</td>
                                <td><span class="badge">${task.status}</span></td>
                                <td>${task.priority}</td>
                                <td>
                                    <a href="${pageContext.request.contextPath}/tasks/${task.taskId}" class="btn btn-sm">Xem</a>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </c:if>
            <div style="margin-top: 15px;">
                <a href="${pageContext.request.contextPath}/tasks/new?teamId=${team.teamId}" class="btn btn-primary">Tạo Task mới</a>
            </div>
        </div>
        
        <div class="form-actions">
            <a href="${pageContext.request.contextPath}/teams" class="btn">Quay lại</a>
        </div>
    </div>
</body>
</html>

