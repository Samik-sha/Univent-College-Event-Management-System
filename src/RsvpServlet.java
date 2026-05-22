package univent;

import java.io.*;
import java.sql.*;
import javax.servlet.http.*;

public class RsvpServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private static final String URL  = "jdbc:postgresql://localhost:5432/Univent";
    private static final String USER = "postgres";
    private static final String PASS = "*******";

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        String path = request.getPathInfo(); // /{eventId}/rsvp

        if (path == null || !path.matches("/\\d+/rsvp")) {
            response.setStatus(400);
            return;
        }

        int eventId = Integer.parseInt(path.split("/")[1]);

        BufferedReader reader = request.getReader();
        String body = reader.readLine();

        String userName = extract(body, "userName");

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            Class.forName("org.postgresql.Driver");
            Connection conn = DriverManager.getConnection(URL, USER, PASS);

            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO rsvps (user_name, event_id) VALUES (?, ?)"
            );
            ps.setString(1, userName);
            ps.setInt(2, eventId);

            ps.executeUpdate();

            out.print("{\"ok\":true,\"msg\":\"RSVP successful\"}");

            conn.close();

        } catch (SQLException e) {

            // Handle duplicate RSVP
            if (e.getMessage().contains("duplicate")) {
                out.print("{\"ok\":false,\"msg\":\"Already RSVPed\"}");
            } else {
                e.printStackTrace();
                response.setStatus(500);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
        }
    }

    private String extract(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\"";
            int start = json.indexOf(pattern) + pattern.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        } catch (Exception e) {
            return "";
        }
    }
}
