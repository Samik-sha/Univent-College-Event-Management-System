package univent;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import javax.servlet.ServletException;
import javax.servlet.http.*;

public class EventsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static final String URL  = "jdbc:postgresql://localhost:5432/Univent";
    private static final String USER = "postgres";
    private static final String PASS = "******";

    // =========================
    // GET EVENTS
    // =========================
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String path = request.getPathInfo(); // /{clubId}/events

        if (path == null || !path.matches("/\\d+/events")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        int clubId = Integer.parseInt(path.split("/")[1]);

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        out.print("{\"events\":[");

        try {
            Class.forName("org.postgresql.Driver");

            Connection conn = DriverManager.getConnection(URL, USER, PASS);

            PreparedStatement ps = conn.prepareStatement(
                "SELECT * FROM events WHERE club_id=?"
            );
            ps.setInt(1, clubId);

            ResultSet rs = ps.executeQuery();

            boolean first = true;

            while (rs.next()) {
                if (!first) out.print(",");
                first = false;

                out.print("{");
                out.print("\"id\":" + rs.getInt("id") + ",");
                out.print("\"title\":\"" + rs.getString("title") + "\",");
                out.print("\"date\":\"" + rs.getString("date") + "\",");
                out.print("\"time\":\"" + rs.getString("time") + "\",");
                out.print("\"location\":\"" + rs.getString("location") + "\",");
                out.print("\"type\":\"" + rs.getString("type") + "\",");
                out.print("\"description\":\"" + rs.getString("description") + "\",");
                out.print("\"capacity\":" + rs.getInt("capacity") + ",");
                out.print("\"rsvps\":[]");
                out.print("}");
            }

            out.print("]}");

            conn.close();

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
        }
    }

    // =========================
    // CREATE EVENT (POST)
    // =========================
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String path = request.getPathInfo(); // /{clubId}/events

        if (path == null || !path.matches("/\\d+/events")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        int clubId = Integer.parseInt(path.split("/")[1]);

        // Read request body
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;

        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        String body = sb.toString();

        // VERY SIMPLE JSON parsing (manual)
        String title = getValue(body, "title");
        String date = getValue(body, "date");
        String time = getValue(body, "time");
        String location = getValue(body, "location");
        String type = getValue(body, "type");
        String description = getValue(body, "description");
        int capacity = Integer.parseInt(getValue(body, "capacity"));

        try {
            Class.forName("org.postgresql.Driver");

            Connection conn = DriverManager.getConnection(URL, USER, PASS);

            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO events (club_id, title, date, time, location, type, description, capacity) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
            );

            ps.setInt(1, clubId);
            ps.setString(2, title);
            ps.setDate(3, Date.valueOf(date));
            ps.setTime(4, time.isEmpty() ? null : Time.valueOf(time + ":00"));
            ps.setString(5, location);
            ps.setString(6, type);
            ps.setString(7, description);
            ps.setInt(8, capacity);

            ResultSet rs = ps.executeQuery();
            rs.next();
            int id = rs.getInt(1);

            response.setContentType("application/json");
            PrintWriter out = response.getWriter();

            out.print("{\"id\":" + id + ",\"title\":\"" + title + "\"}");

            conn.close();

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
        }
    }

    // =========================
    // SIMPLE JSON PARSER
    // =========================
    private String getValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":";
            int start = json.indexOf(pattern) + pattern.length();

            if (json.charAt(start) == '"') {
                start++;
                int end = json.indexOf("\"", start);
                return json.substring(start, end);
            } else {
                int end = json.indexOf(",", start);
                if (end == -1) end = json.indexOf("}", start);
                return json.substring(start, end).trim();
            }
        } catch (Exception e) {
            return "";
        }
    }
}
