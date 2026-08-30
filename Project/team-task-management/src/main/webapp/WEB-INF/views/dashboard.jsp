<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Dashboard - Team Task Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
        }
        .header {
            background: #667eea;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { font-size: 24px; }
        .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 0 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .section h2 {
            margin-bottom: 15px;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-todo { background: #e3f2fd; color: #1976d2; }
        .status-in-progress { background: #fff3e0; color: #f57c00; }
        .status-done { background: #e8f5e9; color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Team Task Management</h1>
        <div class="user-info">
            <span>Xin chào, ${user.fullName != null ? user.fullName : user.username}</span>
            <a href="${pageContext.request.contextPath}/logout" class="btn btn-primary">Đăng xuất</a>
        </div>
    </div>

    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <h3>Tổng số Teams</h3>
                <div class="number">${teamCount}</div>
            </div>
            <div class="stat-card">
                <h3>Tổng số Tasks</h3>
                <div class="number">${taskCount}</div>
            </div>
        </div>

        <div class="section">
            <h2>Teams của tôi</h2>
            <c:if test="${empty teams}">
                <p>Bạn chưa tham gia team nào.</p>
            </c:if>
            <c:if test="${not empty teams}">
                <table>
                    <thead>
                        <tr>
                            <th>Tên Team</th>
                            <th>Leader</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:forEach var="team" items="${teams}">
                            <tr>
                                <td>${team.teamName}</td>
                                <td>${team.leader.fullName != null ? team.leader.fullName : team.leader.username}</td>
                                <td><span class="status-badge">${team.status}</span></td>
                                <td>
                                    <a href="${pageContext.request.contextPath}/teams/${team.teamId}" class="btn btn-primary">Xem</a>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </c:if>
            <div style="margin-top: 15px;">
                <a href="${pageContext.request.contextPath}/teams/new" class="btn btn-primary">Tạo Team mới</a>
            </div>
        </div>

        <div class="section">
            <h2>Tasks của tôi</h2>
            <c:if test="${empty myTasks}">
                <p>Bạn chưa có task nào được giao.</p>
            </c:if>
            <c:if test="${not empty myTasks}">
                <table>
                    <thead>
                        <tr>
                            <th>Tên Task</th>
                            <th>Team</th>
                            <th>Ưu tiên</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:forEach var="task" items="${myTasks}">
                            <tr>
                                <td>${task.taskName}</td>
                                <td>${task.team.teamName}</td>
                                <td>${task.priority}</td>
                                <td>
                                    <span class="status-badge status-${task.status.name().toLowerCase().replace('_', '-')}">
                                        ${task.status}
                                    </span>
                                </td>
                                <td>
                                    <a href="${pageContext.request.contextPath}/tasks/${task.taskId}" class="btn btn-primary">Xem</a>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </c:if>
            <div style="margin-top: 15px;">
                <a href="${pageContext.request.contextPath}/tasks/new" class="btn btn-primary">Tạo Task mới</a>
            </div>
        </div>
    </div>
</body>
</html>

