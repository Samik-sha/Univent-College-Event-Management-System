<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.sql.*, java.util.*" %>
<%
    
  String dbUrl  = "jdbc:postgresql://localhost:5432/Univent";
  String dbUser = "postgres";
  String dbPass = "*****";

  List<Map<String, Object>> clubs = new ArrayList<>();

  try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {

    // 1. SELECT clubs with event count
    PreparedStatement stmt1 = conn.prepareStatement(
      "SELECT c.*, COUNT(e.id) AS event_count " +
      "FROM clubs c LEFT JOIN events e ON c.id = e.club_id " +
      "GROUP BY c.id ORDER BY c.id"
    );
    ResultSet rs1 = stmt1.executeQuery();

    // 2. SELECT events with club name + color
    PreparedStatement stmt2 = conn.prepareStatement(
      "SELECT e.*, c.name AS club_name, c.color AS club_color " +
      "FROM events e JOIN clubs c ON e.club_id = c.id ORDER BY e.date, e.time"
    );
    ResultSet rs2 = stmt2.executeQuery();

    Map<Integer, List<Map<String, Object>>> eventsByClub = new HashMap<>();
    while (rs2.next()) {
      Map<String, Object> event = new HashMap<>();
      event.put("id", rs2.getInt("id"));
      event.put("clubId", rs2.getInt("club_id"));
      event.put("title", rs2.getString("title"));
      event.put("date", rs2.getDate("date").toString());
      event.put("time", rs2.getString("time"));
      event.put("location", rs2.getString("location"));
      event.put("type", rs2.getString("type"));
      event.put("description", rs2.getString("description"));
      event.put("capacity", rs2.getInt("capacity"));
      event.put("clubName", rs2.getString("club_name"));
      event.put("clubColor", rs2.getString("club_color"));

      List<Map<String, Object>> list = eventsByClub.getOrDefault(rs2.getInt("club_id"), new ArrayList<>());
      list.add(event);
      eventsByClub.put(rs2.getInt("club_id"), list);
    }

    // 3. SELECT rsvps
    PreparedStatement stmt3 = conn.prepareStatement("SELECT user_name, event_id FROM rsvps");
    ResultSet rs3 = stmt3.executeQuery();
    Map<Integer, List<String>> rsvpsByEvent = new HashMap<>();
    while (rs3.next()) {
      int eventId = rs3.getInt("event_id");
      String userName = rs3.getString("user_name");
      List<String> rsvps = rsvpsByEvent.getOrDefault(eventId, new ArrayList<>());
      rsvps.add(userName);
      rsvpsByEvent.put(eventId, rsvps);
    }

    // 4. Build clubs
    while (rs1.next()) {
      Map<String, Object> club = new HashMap<>();
      club.put("id", rs1.getInt("id"));
      club.put("name", rs1.getString("name"));
      club.put("category", rs1.getString("category"));
      club.put("description", rs1.getString("description"));
      club.put("members", rs1.getInt("members"));
      club.put("color", rs1.getString("color"));
      club.put("bg", rs1.getString("bg"));
      club.put("icon", rs1.getString("icon"));

      List<Map<String, Object>> events = eventsByClub.getOrDefault(rs1.getInt("id"), new ArrayList<>());
      for (Map<String, Object> e : events) {
        int eventId = (Integer) e.get("id");
        e.put("rsvps", rsvpsByEvent.getOrDefault(eventId, new ArrayList<>()));
      }
      club.put("events", events);

      clubs.add(club);
    }

    // 5. Print JSON (minimal)
    out.print("{\"clubs\":[");
    for (int i = 0; i < clubs.size(); i++) {
      if (i > 0) out.print(",");
      // Simple stringify (good enough for this project)
      out.print("{\"id\":" + clubs.get(i).get("id") +
          ",\"name\":\"" + clubs.get(i).get("name") +
          "\",\"category\":\"" + clubs.get(i).get("category") +
          "\",\"description\":\"" + clubs.get(i).get("description") +
          "\",\"members\":" + clubs.get(i).get("members") +
          ",\"color\":\"" + clubs.get(i).get("color") +
          "\",\"bg\":\"" + clubs.get(i).get("bg") +
          "\",\"icon\":\"" + clubs.get(i).get("icon") +
          "\",\"events\":[");
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> ces = (List<Map<String, Object>>) clubs.get(i).get("events");
     
      for (int j = 0; j < ces.size(); j++) {
        if (j > 0) out.print(",");
        out.print("{\"id\":" + ces.get(j).get("id") +
            ",\"clubId\":" + ces.get(j).get("clubId") +
            ",\"title\":\"" + ces.get(j).get("title") +
            "\",\"date\":\"" + ces.get(j).get("date") +
            "\",\"time\":\"" + ces.get(j).get("time") +
            "\",\"location\":\"" + ces.get(j).get("location") +
            "\",\"type\":\"" + ces.get(j).get("type") +
            "\",\"description\":\"" + ces.get(j).get("description") +
            "\",\"capacity\":" + ces.get(j).get("capacity") +
            ",\"rsvps\":[");
        @SuppressWarnings("unchecked")
       
       List<String> r = (List<String>) ces.get(j).get("rsvps");
        for (int k = 0; k < r.size(); k++) {
          if (k > 0) out.print(",");
          out.print("\"" + r.get(k) + "\"");
        }
        out.print("]}");
      }
      out.print("]}");
    }
    out.print("]}");

  } catch (SQLException e) {
    e.printStackTrace();
    response.setStatus(500);
    out.print("{\"error\": \"DB error\"}");
  }
%>
