<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Danh sách Teams</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/common.css">
</head>
<body>
    <jsp:include page="../common/header.jsp"/>
    
    <div class="container">
        <div class="page-header">
            <h1>Danh sách Teams</h1>
            <a href="${pageContext.request.contextPath}/teams/new" class="btn btn-primary">Tạo Team mới</a>
        </div>

        <c:if test="${not empty success}">
            <div class="alert alert-success">${success}</div>
        </c:if>

        <c:if test="${empty teams}">
            <p>Chưa có team nào.</p>
        </c:if>

        <c:if test="${not empty teams}">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tên Team</th>
                        <th>Leader</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <c:forEach var="team" items="${teams}">
                        <tr>
                            <td>${team.teamName}</td>
                            <td>${team.leader.fullName != null ? team.leader.fullName : team.leader.username}</td>
                            <td>${team.description != null ? team.description : '-'}</td>
                            <td><span class="badge">${team.status}</span></td>
                            <td>
                                <a href="${pageContext.request.contextPath}/teams/${team.teamId}" class="btn btn-sm">Xem</a>
                            </td>
                        </tr>
                    </c:forEach>
                </tbody>
            </table>
        </c:if>
    </div>
</body>
</html>

