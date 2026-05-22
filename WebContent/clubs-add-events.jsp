<%@ page import="java.sql.*" %>
<%@ page contentType="application/json" pageEncoding="UTF-8" %>
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
  if (session.getAttribute("isAdmin") == null) {
    response.setStatus(401);
    out.print("{\"error\": \"Not logged in as admin\"}");
    return;
  }

  // 1. Parse form data
  int clubId;
  String title      = request.getParameter("title");
  String dateStr    = request.getParameter("date");
  String timeStr    = request.getParameter("time");
  String location   = request.getParameter("location");
  String type       = request.getParameter("type");
  String desc       = request.getParameter("description");
  String capStr     = request.getParameter("capacity");

  try {
    clubId = Integer.parseInt(request.getParameter("clubId"));
  } catch (Exception e) {
    response.setStatus(400);
    out.print("{\"error\": \"Invalid clubId\"}");
    return;
  }

  if (title == null || title.trim().isEmpty() ||
      dateStr == null || dateStr.trim().isEmpty() ||
      location == null || location.trim().isEmpty() ||
      type == null || type.trim().isEmpty()) {
    response.setStatus(400);
    out.print("{\"error\": \"Missing required fields\"}");
    return;
  }

  int capacity = 50;
  try {
    if (capStr != null && !capStr.isEmpty()) {
      capacity = Integer.parseInt(capStr);
    }
  } catch (Exception e) {
    // default to 50
  }

  // 2. JDBC setup
  String dbUrl  = "jdbc:postgresql://localhost:5432/Univent";
  String dbUser = "postgres";
  String dbPass = "******";

  try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {
    PreparedStatement stmt = conn.prepareStatement(
      "INSERT INTO events (club_id, title, date, time, location, type, description, capacity) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    );

    stmt.setInt(1, clubId);
    stmt.setString(2, title);
    stmt.setDate(3, java.sql.Date.valueOf(dateStr));
    if (timeStr == null || timeStr.isEmpty()) {
      stmt.setTime(4, null);
    } else {
      String fullTime = timeStr + ":00"; // minimal
      stmt.setTime(4, java.sql.Time.valueOf(fullTime));
    }
    stmt.setString(5, location);
    stmt.setString(6, type);
    stmt.setString(7, desc);
    stmt.setInt(8, capacity);

    ResultSet rs = stmt.executeQuery();
    if (!rs.next()) {
      response.setStatus(500);
      out.print("{\"error\": \"Could not create event\"}");
      return;
    }

    String dateOut = rs.getDate("date").toString();
    String timeOut = rs.getTime("time") == null ? "null" : "\"" + rs.getTime("time").toString() + "\"";

    out.print("{\"id\":" + rs.getInt("id") +
        ",\"clubId\":" + rs.getInt("club_id") +
        ",\"title\":\"" + title + "\"" +
        ",\"date\":\"" + dateOut + "\"" +
        ",\"time\":" + timeOut +
        ",\"location\":\"" + location + "\"" +
        ",\"type\":\"" + type + "\"" +
        ",\"capacity\":" + rs.getInt("capacity") +
        ",\"rsvps\":[]}");
  } catch (SQLException e) {
    e.printStackTrace();
    response.setStatus(500);
    out.print("{\"error\": \"DB error\"}");
  }
%>
</body>
</html>