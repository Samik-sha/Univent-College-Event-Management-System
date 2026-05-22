package univent;

import java.io.*;
import javax.servlet.http.*;

public class AdminLoginServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        BufferedReader reader = request.getReader();
        String body = reader.readLine(); // {"username":"admin","password":"1234"}

        String username = extract(body, "username");
        String password = extract(body, "password");

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        if ("admin".equals(username) && "1234".equals(password)) {

            String sessionId = "admin-session"; // simple session

            request.getServletContext().setAttribute(sessionId, "admin");

            out.print("{\"sessionId\":\"" + sessionId + "\"}");

        } else {
            response.setStatus(401);
            out.print("{\"error\":\"Invalid credentials\"}");
        }
    }

    // simple JSON parser
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
