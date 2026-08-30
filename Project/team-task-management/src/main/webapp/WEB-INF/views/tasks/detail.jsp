<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Chi tiết Task</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <h1>${task.taskName}</h1>
        
        <div class="detail-section">
            <h2>Thông tin Task</h2>
            <p><strong>Mô tả:</strong> ${task.description != null ? task.description : '-'}</p>
            <p><strong>Team:</strong> ${task.team.teamName}</p>
            <p><strong>Ưu tiên:</strong> ${task.priority}</p>
            <p><strong>Trạng thái:</strong> <span class="badge">${task.status}</span></p>
            <p><strong>Người tạo:</strong> ${task.createdBy.fullName != null ? task.createdBy.fullName : task.createdBy.username}</p>
            <c:if test="${task.dueDate != null}">
                <p><strong>Hạn chót:</strong> <fmt:formatDate value="${task.dueDate}" pattern="dd/MM/yyyy HH:mm"/></p>
            </c:if>
        </div>
        
        <div class="detail-section">
            <h2>Người được giao</h2>
            <c:if test="${empty task.assignments}">
                <p>Chưa có ai được giao task này.</p>
            </c:if>
            <c:if test="${not empty task.assignments}">
                <ul>
                    <c:forEach var="assignment" items="${task.assignments}">
                        <li>${assignment.assignedUser.fullName != null ? assignment.assignedUser.fullName : assignment.assignedUser.username} (${assignment.assignedUser.email})</li>
                    </c:forEach>
                </ul>
            </c:if>
        </div>
        
        <div class="detail-section">
            <h2>Cập nhật trạng thái</h2>
            <form action="${pageContext.request.contextPath}/tasks/${task.taskId}/status" method="POST">
                <select name="status">
                    <option value="TODO" ${task.status == 'TODO' ? 'selected' : ''}>Cần làm</option>
                    <option value="IN_PROGRESS" ${task.status == 'IN_PROGRESS' ? 'selected' : ''}>Đang thực hiện</option>
                    <option value="IN_REVIEW" ${task.status == 'IN_REVIEW' ? 'selected' : ''}>Đang xem xét</option>
                    <option value="DONE" ${task.status == 'DONE' ? 'selected' : ''}>Hoàn thành</option>
                    <option value="CANCELLED" ${task.status == 'CANCELLED' ? 'selected' : ''}>Đã hủy</option>
                </select>
                <button type="submit" class="btn btn-primary">Cập nhật</button>
            </form>
        </div>
        
        <div class="form-actions">
            <a href="${pageContext.request.contextPath}/tasks" class="btn">Quay lại</a>
        </div>
    </div>
</body>
</html>

