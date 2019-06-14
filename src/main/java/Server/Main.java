package Server;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.servlet.ServletContainer;

/* ------------------------------------------------------------------------------
 This class is where the program starts executing and what starts the server.
 Tell IntelliJ to run this file to start everything going!
 Navigate to http://localhost:8081/client/index.html in Chrome once it's running.
 ------------------------------------------------------------------------------ */
public class Main {

    public static void main(String[] args) {

        ResourceConfig config = new ResourceConfig();       // Prepare the server configuration (uses the Jetty library).
        config.packages("Controllers");                     // The package containing the HTTP request handlers for the API.
        config.register(MultiPartFeature.class);            // Enables support for multi-part forms (important!)
        Server server = new Server(8081);             // The port number to connect to (part of the URL).

        ServletHolder servlet = new ServletHolder(new ServletContainer(config));            // Creates the Jersey 'servlet' to run on the server.
        ServletContextHandler context = new ServletContextHandler(server, "/");
        context.addServlet(servlet, "/*");                                         // Connect the servlet to the server.

        try {
            server.start();                                 // Actually start the server!
            System.out.println("Server successfully started.");
            server.join();                                  // This line of code leaves the program running indefinitely, waiting for HTTP requests.
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
