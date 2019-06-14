package Controllers;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Random;

/* ------------------------------------------------------------------------------
   This API controller class listens for any HTTP request on the 'avatar' path.
   ------------------------------------------------------------------------------ */
@Path("avatar/")
@SuppressWarnings("unchecked")
public class Avatar {

    private static final int MAX_X = 16;        // The max X and Y positions on the grid.
    private static final int MAX_Y = 12;

    class AvatarModel {             // This small class encapsulates the state of an Avatar, it doesn't need any methods.
        int id;
        int x;
        int y;
        String image;
        String chatText;
        long chatExpiry;
        long lastSeen;
    }

    private static final ArrayList<AvatarModel> avatars = new ArrayList<>();       // This data structure stores all the Avatars during the program's runtime.

    /*-------------------------------------------------------
    The HTTP Request handler for the /avatar/list API path.
    Sends a list of all the Avatar's current states.
    ------------------------------------------------------*/
    @GET
    @Path("list")
    @Produces(MediaType.APPLICATION_JSON)
    public String listAvatars() {

        JSONArray avatarList = new JSONArray();             // Prepare an empty JSON list object.

        for (AvatarModel a : avatars) {                     // Loop through all the Avatars in the list

            if (a.lastSeen < System.currentTimeMillis() - 30000) continue;          // Ignore them if they've not been seen in the last 30 seconds.

            if (System.currentTimeMillis() > a.chatExpiry) {                        // If they have stale text (older than 5 seoconds)...
                synchronized (avatars) {                                            // ... thread lock the avatar data structure (prevents concurrent modification errors) ...
                    a.chatText = "";                                                // ... and clear the text.
                }
            }

            JSONObject o = new JSONObject();                // Build a new JSON object with each of the Avatar's fields as required by the client...
            o.put("id", a.id);
            o.put("x", a.x);
            o.put("y", a.y);
            o.put("image", a.image);
            o.put("text", a.chatText);
            avatarList.add(o);                              // ...and add it to the list!
        }

        return avatarList.toString();                       // Send the list to the client as a text string (JSON encoded).
    }

    /*-------------------------------------------------------
    The HTTP Request handler for the /avatar/new API path.
    Creates a new Avatar when someone first loads the page.
    ------------------------------------------------------*/
    @POST
    @Path("new")
    @Produces(MediaType.APPLICATION_JSON)
    public String newAvatar() {

        Random rnd = new Random(System.currentTimeMillis());            // Prepare a random number generator.

        AvatarModel a = new AvatarModel();                              // Create a new Avatar object...
        a.id = avatars.size() + 1;                                      // ... id is current list size + 1
        a.x = rnd.nextInt(MAX_X);                                       // ... x and y are randomly generated.
        a.y = rnd.nextInt(MAX_Y);
        a.image = (rnd.nextInt(43) + 1) + ".png";                // ... image is randomly chosen.
        a.lastSeen = System.currentTimeMillis();                        // Note the Avatar was just seen (they're still active).

        synchronized (avatars) {                    // Thread lock the avatar data structure (prevents concurrent modification errors).
            avatars.add(a);                         // Add the new Avatar!
        }

        return "{\"status\": \"OK\", \"id\":" + a.id + "}";
    }

    /*-------------------------------------------------------
    The HTTP Request handler for the /avatar/update API path.
    Allows clients to send updated positions for their avatars.
    ------------------------------------------------------*/
    @POST
    @Path("update")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public String updateAvatar(@FormDataParam("id") int id, @FormDataParam("x") int x, @FormDataParam("y") int y) {

        for (AvatarModel a: avatars) {          // Find the correct Avatar...
            if (a.id == id) {                   // ...i.e. the one with the correct id.
                if (x < 0) x = 0;                   // Prevent the avatar from walking off the playing field.
                if (y < 0) y = 0;
                if (x > MAX_X - 1) x = MAX_X - 1;
                if (y > MAX_Y - 1) y = MAX_Y - 1;
                synchronized (avatars) {        // Thread lock the avatar data structure (prevents concurrent modification errors).
                    a.x = x;                                        // Set the new X and Y co-ordinate as requested.
                    a.y = y;                                        // n.b. This is not checked so is completely hackable!!!
                    a.lastSeen = System.currentTimeMillis();        // Note the Avatar was just seen (they're still active).
                }
                return "{\"status\": \"OK\"}";
            }
        }

        return "{\"error\": \"No avatar found with id " + id + ".\"}";

    }

    /*-------------------------------------------------------
    The HTTP Request handler for the /avatar/speak API path.
    Used whenever a client tries to speak (presses Enter key).
    ------------------------------------------------------*/
    @POST
    @Path("speak")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public String speakAvatar(@FormDataParam("id") int id, @FormDataParam("text") String text) {

        for (AvatarModel a: avatars) {          // Find the correct Avatar...
            if (a.id == id) {                   // ...i.e. the one with the correct id.
                synchronized (avatars) {        // Thread lock the avatar data structure (prevents concurrent modification errors).
                    a.chatText = text;                                  // Set the text...
                    a.chatExpiry = System.currentTimeMillis() + 5000;   // ...expiring 5 seconds in the future!
                    a.lastSeen = System.currentTimeMillis();            // Note the Avatar was just seen (they're still active).
                }
                return "{\"status\": \"OK\"}";
            }
        }

        return "{\"error\": \"No avatar found with id " + id + ".\"}";

    }

}



