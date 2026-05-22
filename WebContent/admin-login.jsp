<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
<%@ page contentType="application/json" pageEncoding="UTF-8"%>

<%
  String adminUser = "admin";
  String adminPass = "1234";

  String username = request.getParameter("username");
  String password = request.getParameter("password");

  if (username == null || password == null
      || username.trim().isEmpty() || password.trim().isEmpty()) {
    response.setStatus(400);
    out.print("{\"error\": \"Missing username or password\"}");
    return;
  }

  if (!adminUser.equals(username) || !adminPass.equals(password)) {
    response.setStatus(401);
    out.print("{\"error\": \"Invalid credentials\"}");
    return;
  }

  session.setAttribute("isAdmin", true);
  session.setAttribute("adminUser", username);

  out.print("{\"ok\":true,\"isAdmin\":true}");
%>
</body>
</html>