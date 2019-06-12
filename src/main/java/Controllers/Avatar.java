package Controllers;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Random;

@Path("avatar/")
@SuppressWarnings("unchecked")
public class Avatar {

    private static final int MAX_X = 16;
    private static final int MAX_Y = 12;

    class AvatarModel {
        int id;
        int x;
        int y;
        String image;
        String chatText;
        long chatExpiry;
        long lastSeen;
    }

    private static final ArrayList<AvatarModel> avatars = new ArrayList<>();

    @GET
    @Path("list")
    @Produces(MediaType.APPLICATION_JSON)
    public String listAvatars() {

        JSONArray avatarList = new JSONArray();

        for (AvatarModel a : avatars) {

            if (a.lastSeen < System.currentTimeMillis() - 30000) continue;

            if (System.currentTimeMillis() > a.chatExpiry) {
                synchronized (avatars) {
                    a.chatText = "";
                }
            }

            JSONObject o = new JSONObject();
            o.put("id", a.id);
            o.put("x", a.x);
            o.put("y", a.y);
            o.put("image", a.image);
            o.put("text", a.chatText);
            avatarList.add(o);
        }

        return avatarList.toString();
    }

    @POST
    @Path("new")
    @Produces(MediaType.APPLICATION_JSON)
    public String newAvatar() {

        Random rnd = new Random(System.currentTimeMillis());

        AvatarModel a = new AvatarModel();
        a.id = avatars.size() + 1;
        a.x = rnd.nextInt(MAX_X);
        a.y = rnd.nextInt(MAX_Y);
        a.image = (rnd.nextInt(43) + 1) + ".png";
        a.lastSeen = System.currentTimeMillis();

        synchronized (avatars) {
            avatars.add(a);
        }

        return "{\"status\": \"OK\", \"id\":" + a.id + "}";
    }

    @POST
    @Path("update")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public String updateAvatar(@FormDataParam("id") int id, @FormDataParam("x") int x, @FormDataParam("y") int y) {

        for (AvatarModel a: avatars) {
            if (a.id == id) {
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x > MAX_X - 1) x = MAX_X - 1;
                if (y > MAX_Y - 1) y = MAX_Y - 1;
                synchronized (avatars) {
                    a.x = x;
                    a.y = y;
                    a.lastSeen = System.currentTimeMillis();
                }
                return "{\"status\": \"OK\"}";
            }
        }

        return "{\"error\": \"No avatar found with id " + id + ".\"}";

    }

    @POST
    @Path("speak")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public String speakAvatar(@FormDataParam("id") int id, @FormDataParam("text") String text) {

        for (AvatarModel a: avatars) {
            if (a.id == id) {
                synchronized (avatars) {
                    a.chatText = text;
                    a.chatExpiry = System.currentTimeMillis() + 5000; // 5 seconds in the future!
                    a.lastSeen = System.currentTimeMillis();
                }
                return "{\"status\": \"OK\"}";
            }
        }

        return "{\"error\": \"No avatar found with id " + id + ".\"}";

    }

}



