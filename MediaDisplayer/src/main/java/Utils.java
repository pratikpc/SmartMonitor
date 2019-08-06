import javafx.application.Platform;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;

import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public class Utils {
    public static void CreateDirectoryIfNotExists(final String path) {
        final File directory = new File(path);
        if (!directory.exists()) directory.mkdirs();
    }

    public static String GetAbsolutePath(final String first, final String... names) {
        return Paths.get(first, names).toAbsolutePath().normalize().toString();
    }

    public static void ClearDirectory(final String fileOrDirectory) {
        ClearDirectory(new File(fileOrDirectory));
    }

    public static boolean ExistsDirectory(final String path) throws Exception {
        return Files.exists(Paths.get(path));
    }

    public static void ClearDirectory(final File fileOrDirectory) {
        if (fileOrDirectory.isDirectory())
            for (File child : fileOrDirectory.listFiles())
                ClearDirectory(child);

        fileOrDirectory.delete();
    }

    public static UrlEncodedFormEntity AddToForm(final List<NameValuePair> form) throws Exception {
        return new UrlEncodedFormEntity(form, "UTF-8");
    }

    public static boolean CreateConfirmationDialog(final String title, final String content) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle(title);
        //       alert.setHeaderText("Header");
        alert.setContentText(content);

        Optional<ButtonType> result = alert.showAndWait();
        return result.orElse(ButtonType.CANCEL) == ButtonType.OK;
    }

    public static void Terminate() {
        Platform.exit();
        System.exit(0);

    }

    public static String ToUri(final String path) throws Exception {
        return new File(path).toURI().toURL().toExternalForm();
    }

    public static FileType GetFileType(String path) throws Exception {
        final String mimeType = Files.probeContentType(Paths.get(path));
        if (mimeType == null) return FileType.UNKNOWN;
        if (mimeType.startsWith("image")) return FileType.IMAGE;
        if (mimeType.startsWith("video")) return FileType.VIDEO;
        return FileType.UNKNOWN;
    }

    public static FileType GetFileType(final URI path) throws Exception {
        final String mimeType = Files.probeContentType(Paths.get(path));
        if (mimeType == null) return FileType.UNKNOWN;
        if (mimeType.startsWith("image")) return FileType.IMAGE;
        if (mimeType.startsWith("video")) return FileType.VIDEO;
        return FileType.UNKNOWN;
    }

    public static int GetCurrentHourAndMinuteAsInteger() {
        final LocalTime currentTime = LocalTime.now();
        final int hour = currentTime.getHour();
        final int minute = currentTime.getMinute();

        return hour * 100 + minute;
    }

    public static boolean IsDirectoryEmpty(final String directory) throws Exception {
        return directory != null && !Files.list(Paths.get(directory)).findAny().isPresent();
    }

    public enum FileType {
        UNKNOWN,
        IMAGE,
        VIDEO
    }
}
