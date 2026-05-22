<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
<%@ page import="java.sql.*" %>
<%@ page contentType="application/json" pageEncoding="UTF-8" %>

<%
  String dbUrl  = "jdbc:postgresql://localhost:5432/Univent";
  String dbUser = "postgres";
  String dbPass = "******";

  int eventId;
  String userName = request.getParameter("userName");

  try {
    eventId = Integer.parseInt(request.getParameter("eventId"));
  } catch (Exception e) {
    response.setStatus(400);
    out.print("{\"error\": \"Invalid eventId\"}");
    return;
  }

  if (userName == null || userName.trim().isEmpty()) {
    response.setStatus(400);
    out.print("{\"error\": \"Missing userName\"}");
    return;
  }

  try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {

    // 1. Check if event exists
    PreparedStatement stmt1 = conn.prepareStatement("SELECT id FROM events WHERE id = ?");
    stmt1.setInt(1, eventId);
    ResultSet rs = stmt1.executeQuery();
    if (!rs.next()) {
      response.setStatus(404);
      out.print("{\"error\": \"Event not found\"}");
      return;
    }

    // 2. Check if already RSVPed
    PreparedStatement stmt2 = conn.prepareStatement(
      "SELECT COUNT(*) FROM rsvps WHERE user_name = ? AND event_id = ?");
    stmt2.setString(1, userName);
    stmt2.setInt(2, eventId);
    ResultSet rs2 = stmt2.executeQuery();
    rs2.next();
    if (rs2.getInt(1) > 0) {
      response.setStatus(400);
      out.print("{\"error\": \"Already RSVPed for this event\"}");
      return;
    }

    // 3. INSERT RSVP
    PreparedStatement stmt3 = conn.prepareStatement(
      "INSERT INTO rsvps (user_name, event_id) VALUES (?, ?)");
    stmt3.setString(1, userName);
    stmt3.setInt(2, eventId);
    stmt3.executeUpdate();

    out.print("{\"msg\": \"✅ Successfully RSVPed\", \"ok\": true}");
  } catch (SQLException e) {
    e.printStackTrace();
    response.setStatus(500);
    out.print("{\"error\": \"DB error\"}");
  }
%>
</body>
</html>