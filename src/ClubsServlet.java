package univent;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ClubsServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

    private static final String URL  = "jdbc:postgresql://localhost:5432/Univent";
    private static final String USER = "postgres";
    private static final String PASS = "*****";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        StringBuilder json = new StringBuilder();

        json.append("{\"clubs\":[");

        try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {
        	Class.forName("org.postgresql.Driver");

            String clubQuery = "SELECT * FROM clubs ORDER BY id";
            PreparedStatement clubStmt = conn.prepareStatement(clubQuery);
            ResultSet clubRs = clubStmt.executeQuery();

            boolean firstClub = true;

            while (clubRs.next()) {
                if (!firstClub) json.append(",");
                firstClub = false;

                int clubId = clubRs.getInt("id");

                json.append("{");
                json.append("\"id\":").append(clubId).append(",");
                json.append("\"name\":\"").append(escape(clubRs.getString("name"))).append("\",");
                json.append("\"description\":\"").append(escape(clubRs.getString("description"))).append("\",");
                json.append("\"category\":\"").append(escape(clubRs.getString("category"))).append("\",");
                json.append("\"icon\":\"").append(escape(clubRs.getString("icon"))).append("\",");
                json.append("\"color\":\"").append(escape(clubRs.getString("color"))).append("\",");
                json.append("\"bg\":\"").append(escape(clubRs.getString("bg"))).append("\",");
                json.append("\"members\":").append(clubRs.getInt("members")).append(",");

                // 🔥 EVENTS
                json.append("\"events\":[");

                String eventQuery = "SELECT * FROM events WHERE club_id = ? ORDER BY date";
                PreparedStatement eventStmt = conn.prepareStatement(eventQuery);
                eventStmt.setInt(1, clubId);
                ResultSet eventRs = eventStmt.executeQuery();

                boolean firstEvent = true;

                while (eventRs.next()) {
                    if (!firstEvent) json.append(",");
                    firstEvent = false;

                    json.append("{");
                    json.append("\"id\":").append(eventRs.getInt("id")).append(",");
                    json.append("\"title\":\"").append(escape(eventRs.getString("title"))).append("\",");
                    json.append("\"date\":\"").append(eventRs.getString("date")).append("\",");
                    json.append("\"time\":\"").append(eventRs.getString("time")).append("\",");
                    json.append("\"location\":\"").append(escape(eventRs.getString("location"))).append("\",");
                    json.append("\"type\":\"").append(escape(eventRs.getString("type"))).append("\",");
                    json.append("\"description\":\"").append(escape(eventRs.getString("description"))).append("\",");
                    json.append("\"capacity\":").append(eventRs.getInt("capacity")).append(",");

                    // 👇 keep empty for now (frontend needs it)
                    json.append("\"rsvps\":[]");

                    json.append("}");
                }

                json.append("]"); // end events
                json.append("}"); // end club
            }

            json.append("]}");

            out.print(json.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print("{\"error\":\"Server error\"}");
        }

        out.flush();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\"", "\\\"");
    }
}