<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<div class="header">
    <h1>Team Task Management</h1>
    <nav>
        <a href="${pageContext.request.contextPath}/dashboard">Dashboard</a>
        <a href="${pageContext.request.contextPath}/teams">Teams</a>
        <a href="${pageContext.request.contextPath}/tasks">Tasks</a>
    </nav>
    <div class="user-info">
        <c:if test="${not empty user}">
            <span>Xin chào, ${user.fullName != null ? user.fullName : user.username}</span>
        </c:if>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-sm">Đăng xuất</a>
    </div>
</div>

