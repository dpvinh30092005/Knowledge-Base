<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Danh sách Tasks</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <div class="page-header">
            <h1>Danh sách Tasks</h1>
            <a href="${pageContext.request.contextPath}/tasks/new" class="btn btn-primary">Tạo Task mới</a>
        </div>

        <c:if test="${not empty success}">
            <div class="alert alert-success">${success}</div>
        </c:if>

        <c:if test="${empty tasks}">
            <p>Chưa có task nào.</p>
        </c:if>

        <c:if test="${not empty tasks}">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tên Task</th>
                        <th>Team</th>
                        <th>Ưu tiên</th>
                        <th>Trạng thái</th>
                        <th>Người tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <c:forEach var="task" items="${tasks}">
                        <tr>
                            <td>${task.taskName}</td>
                            <td>${task.team.teamName}</td>
                            <td>${task.priority}</td>
                            <td><span class="badge">${task.status}</span></td>
                            <td>${task.createdBy.fullName != null ? task.createdBy.fullName : task.createdBy.username}</td>
                            <td>
                                <a href="${pageContext.request.contextPath}/tasks/${task.taskId}" class="btn btn-sm">Xem</a>
                            </td>
                        </tr>
                    </c:forEach>
                </tbody>
            </table>
        </c:if>
    </div>
</body>
</html>

